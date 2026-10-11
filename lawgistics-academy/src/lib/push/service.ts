import 'server-only';

import webpush from 'web-push';
import { createServiceClient } from '@/lib/supabase/service';
import { pushEnv } from '@/lib/env-server';
import { scheduleForCohort } from '@/lib/training/cohorts';
import { trainingOpen } from '@/lib/training/service';
import { todayIn } from '@/lib/onboarding/rules';
import { asCountry, type Country } from '@/lib/types';
import {
  markedMessage,
  newWorkMessage,
  roundDueForReminder,
  roundReminder,
  type DeviceKeys,
  type PushMessage,
} from './rules';

/**
 * Phone notifications (0042), the sending.
 *
 * Every function here uses the service client, so every caller has already
 * established who is asking: the account actions pass the signed-in person's
 * own id, the work board passes ids it read after `checkCoach`, and the
 * reminder route checks its own token first.
 *
 * Sending never gets in the way of the thing that caused it. A mark is saved
 * whether or not a phone can be reached, and a failure here is swallowed
 * after the device that caused it is dealt with.
 */

type DeviceRow = { user_id: string; endpoint: string; p256dh: string; auth_secret: string };

/** Whether this deployment can send notifications at all. */
export function pushConfigured(): boolean {
  return pushEnv() !== null;
}

/** The key a browser needs to subscribe, or null when notifications are off. */
export function pushPublicKey(): string | null {
  return pushEnv()?.publicKey ?? null;
}

/** A device saved for this person, replacing whoever had that address before. */
export async function saveDevice(userId: string, keys: DeviceKeys, label: string): Promise<boolean> {
  const { error } = await createServiceClient()
    .from('push_devices')
    .upsert(
      {
        user_id: userId,
        endpoint: keys.endpoint,
        p256dh: keys.p256dh,
        auth_secret: keys.auth,
        label,
      },
      { onConflict: 'endpoint' },
    );
  return !error;
}

/** This person's device at this address, forgotten. Nobody else's. */
export async function forgetDevice(userId: string, endpoint: string): Promise<boolean> {
  const { error } = await createServiceClient()
    .from('push_devices')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);
  return !error;
}

/** How many devices this person has notifications on. */
export async function deviceCount(userId: string): Promise<number> {
  const { count } = await createServiceClient()
    .from('push_devices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}

interface SendOptions {
  /** How long a push service keeps trying a phone that is off, in seconds. */
  ttl: number;
  urgency: 'normal' | 'high';
}

/**
 * One message to some devices. A device the push service says is gone (the
 * person turned notifications off in their phone's settings, or removed the
 * app) is forgotten, so it is not tried again. Returns how many were sent.
 */
async function send(devices: DeviceRow[], message: PushMessage, options: SendOptions): Promise<number> {
  const config = pushEnv();
  if (!config || devices.length === 0) return 0;
  const db = createServiceClient();
  const payload = JSON.stringify(message);
  let sent = 0;

  for (let i = 0; i < devices.length; i += 20) {
    const batch = devices.slice(i, i + 20);
    const results = await Promise.allSettled(
      batch.map((d) =>
        webpush.sendNotification(
          { endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth_secret } },
          payload,
          {
            vapidDetails: {
              subject: config.subject,
              publicKey: config.publicKey,
              privateKey: config.privateKey,
            },
            TTL: options.ttl,
            urgency: options.urgency,
            timeout: 10_000,
          },
        ),
      ),
    );

    const gone: string[] = [];
    const reached: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        reached.push(batch[index].endpoint);
        return;
      }
      const status = (result.reason as { statusCode?: number } | null)?.statusCode;
      if (status === 404 || status === 410) gone.push(batch[index].endpoint);
    });
    sent += reached.length;

    if (gone.length > 0) await db.from('push_devices').delete().in('endpoint', gone);
    if (reached.length > 0) {
      await db.from('push_devices').update({ last_sent_at: new Date().toISOString() }).in('endpoint', reached);
    }
  }
  return sent;
}

async function devicesOf(userIds: string[]): Promise<DeviceRow[]> {
  if (userIds.length === 0) return [];
  const { data } = await createServiceClient()
    .from('push_devices')
    .select('user_id, endpoint, p256dh, auth_secret')
    .in('user_id', userIds);
  return (data ?? []) as DeviceRow[];
}

/**
 * Telling the person whose hand-in was just marked. Called after the mark is
 * saved, with the submission the coach marked.
 */
export async function notifyMarked(submissionId: string): Promise<void> {
  if (!pushConfigured()) return;
  try {
    const db = createServiceClient();
    const { data: handIn } = await db
      .from('work_submissions')
      .select('user_id, post_id')
      .eq('id', submissionId)
      .maybeSingle();
    const row = handIn as { user_id: string; post_id: string } | null;
    if (!row) return;
    const { data: post } = await db.from('work_posts').select('id, title').eq('id', row.post_id).maybeSingle();
    if (!post) return;
    await send(await devicesOf([row.user_id]), markedMessage(post as { id: string; title: string }), {
      ttl: 86_400,
      urgency: 'normal',
    });
  } catch {
    // A mark stands whether or not a phone hears about it.
  }
}

/**
 * Telling everybody a post is for that it is up, once. The post is claimed
 * for announcing in the same statement that checks it has not been, so two
 * saves at once cannot both announce it, and an edit to a post already up
 * announces nothing.
 */
export async function notifyNewWorkPost(postId: string): Promise<void> {
  if (!pushConfigured()) return;
  try {
    const db = createServiceClient();
    const { data: claimed } = await db
      .from('work_posts')
      .update({ announced_at: new Date().toISOString() })
      .eq('id', postId)
      .eq('published', true)
      .is('announced_at', null)
      .select('id, title, kind')
      .maybeSingle();
    if (!claimed) return;
    const { data: devices } = await db.rpc('push_devices_for_work_post', { post_id: postId });
    await send(
      (devices ?? []) as DeviceRow[],
      newWorkMessage(claimed as { id: string; title: string; kind: 'task' | 'material' }),
      { ttl: 86_400, urgency: 'normal' },
    );
  } catch {
    // The post is up whether or not anybody's phone hears about it.
  }
}

type TraineeRow = {
  id: string;
  country: string | null;
  track: string | null;
  trainee_approved_at: string | null;
  starts_on: string | null;
  ends_on: string | null;
  cohort_id?: string | null;
};

export interface ReminderRun {
  /** Confirmed trainees with notifications on. */
  trainees: number;
  /** Reminders sent this time. */
  sent: number;
}

/**
 * Round reminders: for every confirmed trainee with a device, the round about
 * to open on their own cohort's clock, if one is. Each reminder is written
 * down before it is sent, and only sent if writing it down was new, so calling
 * this twice in the same minute buzzes nobody twice.
 *
 * Nobody hears about rounds before questions are published for their
 * country, because until then there are no rounds (see `roundsToday`).
 */
export async function sendRoundReminders(now: Date = new Date()): Promise<ReminderRun> {
  if (!pushConfigured()) return { trainees: 0, sent: 0 };
  const db = createServiceClient();

  const { data: deviceRows } = await db
    .from('push_devices')
    .select('user_id, endpoint, p256dh, auth_secret')
    .limit(5000);
  const devices = (deviceRows ?? []) as DeviceRow[];
  const owners = [...new Set(devices.map((d) => d.user_id))];
  if (owners.length === 0) return { trainees: 0, sent: 0 };

  const { data: people } = await db
    .from('profiles')
    // Every column, so a database without 0041's cohort_id still answers.
    .select('*')
    .in('id', owners)
    .eq('track', 'litigation_trainee')
    .not('trainee_approved_at', 'is', null);
  const trainees = (people ?? []) as TraineeRow[];

  const open = new Map<Country, boolean>();
  let sent = 0;

  for (const person of trainees) {
    const country = asCountry(person.country);
    if (!open.has(country)) open.set(country, await trainingOpen(country));
    if (!open.get(country)) continue;

    const schedule = await scheduleForCohort(db, person.cohort_id);
    const date = todayIn(schedule.timezone, now);
    const due = roundDueForReminder(schedule, date, person.starts_on, person.ends_on, now);
    if (!due) continue;

    const { data: noted } = await db
      .from('push_round_reminders')
      .upsert(
        { user_id: person.id, opens_at: due.opensAt.toISOString() },
        { onConflict: 'user_id,opens_at', ignoreDuplicates: true },
      )
      .select('user_id');
    if (!noted || noted.length === 0) continue;

    // Worth delivering until the round closes: a phone that was off at 7:52
    // and comes back at 8:20 still has forty minutes of that round.
    const ttl = Math.max(60, Math.round((due.opensAt.getTime() + 3_600_000 - now.getTime()) / 1000));
    sent += await send(
      devices.filter((d) => d.user_id === person.id),
      roundReminder(due, schedule),
      { ttl, urgency: 'high' },
    );
  }

  return { trainees: trainees.length, sent };
}
