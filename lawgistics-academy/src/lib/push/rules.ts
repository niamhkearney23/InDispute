/**
 * Phone notifications (0042), the rules. Pure, so they are tested directly.
 *
 * Three things send a notification: a round about to open, a coach marking
 * something a person handed in, and a coach putting up new work. Which round
 * is due a reminder is decided here from the same functions the rounds
 * themselves use (`roundsDayNumber`, `roundWindows`), so a reminder can never
 * announce a round the Today page would not show.
 */
import { roundWindows, roundsDayNumber } from '@/lib/training/rounds';
import { roundCountWord, zoneName, type Schedule } from '@/lib/training/schedule';

/**
 * How far ahead of a round its reminder may go. The scheduler calls every
 * five minutes, so a reminder arrives between five and ten minutes before the
 * round opens: enough to put the kettle down, not so much it is forgotten.
 */
export const REMINDER_LEAD_MINUTES = 10;

/** What a notification says, and where tapping it goes. */
export interface PushMessage {
  title: string;
  body: string;
  /** A path inside the app, always beginning with a single slash. */
  url: string;
  /**
   * Notifications with the same tag replace each other on the phone, so a
   * second mark on the same post does not stack under the first.
   */
  tag: string;
}

/** A round about to open: its number, when it opens, and its label. */
export interface DueRound {
  number: number;
  opensAt: Date;
  opensLabel: string;
}

/**
 * The round whose reminder is due now, if any: one on a rounds day of this
 * person's placement that opens after `now` and no more than the lead time
 * ahead of it. Null on a weekend, a skipped holiday, outside the placement,
 * or when no round is that close.
 */
export function roundDueForReminder(
  schedule: Schedule,
  localDate: string,
  startsOn: string | null,
  endsOn: string | null,
  now: Date,
  leadMinutes: number = REMINDER_LEAD_MINUTES,
): DueRound | null {
  if (roundsDayNumber(startsOn, endsOn, localDate, schedule.holidays) === null) return null;
  const lead = leadMinutes * 60_000;
  const due = roundWindows(schedule, localDate).find((w) => {
    const ahead = w.opensAt.getTime() - now.getTime();
    return ahead > 0 && ahead <= lead;
  });
  return due ? { number: due.number, opensAt: due.opensAt, opensLabel: due.opensLabel } : null;
}

/** "Round 2 of 4 opens at 8am": the reminder for a round about to open. */
export function roundReminder(round: DueRound, schedule: Schedule): PushMessage {
  const of = schedule.roundHours.length > 1 ? ` of ${roundCountWord(schedule)}` : '';
  return {
    title: `Round ${round.number}${of} opens at ${round.opensLabel}`,
    body: `${zoneName(schedule)}. Ten questions, and the round is open for the hour.`,
    url: '/dashboard',
    tag: `round-${round.opensAt.toISOString()}`,
  };
}

/** A coach marked something this person handed in. */
export function markedMessage(post: { id: string; title: string }): PushMessage {
  return {
    title: 'Your work has been marked',
    body: `${shorten(post.title)}. Open it to read what your coach said.`,
    url: `/work/${post.id}`,
    tag: `marked-${post.id}`,
  };
}

/** A coach put up a new piece of work, or something to read. */
export function newWorkMessage(post: { id: string; title: string; kind: 'task' | 'material' }): PushMessage {
  return {
    title: post.kind === 'task' ? 'New work on the board' : 'Something new to read',
    body: shorten(post.title),
    url: `/work/${post.id}`,
    tag: `work-${post.id}`,
  };
}

/** Kept short, because a lock screen shows about a line. */
function shorten(text: string, max = 90): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * The push services a device may be at. The server sends a request to the
 * address a browser gives it, so an address anywhere else is refused: it
 * would let somebody make this server call a URL of their choosing.
 */
const PUSH_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'web.push.apple.com',
];
const PUSH_HOST_SUFFIXES = ['.push.apple.com', '.notify.windows.com'];

export function isPushServiceAddress(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  return PUSH_HOSTS.includes(host) || PUSH_HOST_SUFFIXES.some((s) => host.endsWith(s));
}

/** A device as the browser describes it, once checked. */
export interface DeviceKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/**
 * The browser's subscription, as JSON, checked before anything is saved: an
 * address at a known push service and two keys of the right shape. Null when
 * it is not one.
 */
export function readSubscription(json: string): DeviceKeys | null {
  if (json.length > 4000) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  const value = raw as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  const endpoint = value?.endpoint;
  const p256dh = value?.keys?.p256dh;
  const auth = value?.keys?.auth;
  if (typeof endpoint !== 'string' || endpoint.length > 1000 || !isPushServiceAddress(endpoint)) return null;
  if (typeof p256dh !== 'string' || p256dh.length < 40 || p256dh.length > 200 || !BASE64URL.test(p256dh)) return null;
  if (typeof auth !== 'string' || auth.length < 16 || auth.length > 100 || !BASE64URL.test(auth)) return null;
  return { endpoint, p256dh, auth };
}

/**
 * "iPhone", "Android phone", "Computer": a plain label for the device list,
 * from the browser's own description of itself. Nothing more specific is
 * kept.
 */
export function deviceLabel(userAgent: string | null): string {
  const ua = userAgent ?? '';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? 'Android phone' : 'Android tablet';
  return 'Computer';
}
