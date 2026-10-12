import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { supervisedIds } from '@/lib/admin/supervision';
import { roundsHistory } from '@/lib/training/rounds-service';
import { listCohorts } from '@/lib/training/cohorts';
import { DEFAULT_SCHEDULE } from '@/lib/training/schedule';
import { rosterWithStatus } from '@/lib/certification/service';
import { todayIn } from '@/lib/onboarding/rules';
import { localMidnight } from '@/lib/local-day';
import { activeByMonth, monthBounds, monthsUpTo, type ActiveMonth } from './rules';

/**
 * What the firm's reports read. Service-role reads, so every caller has
 * checked the caller is an administrator or the firm's administrator. The
 * people counted are the people the firm supervises (confirmed trainees,
 * accepted invitations, confirmed on an active code), the same set a coach
 * sees, so a firm is never invoiced for somebody who signed up on their own.
 */

export interface Person {
  id: string;
  name: string;
  email: string | null;
  /** "Trainee", "Trainee (not confirmed)" or "Learner". */
  role: string;
  cohort: string;
  startsOn: string | null;
  endsOn: string | null;
}

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  track: string | null;
  trainee_approved_at: string | null;
  cohort_id?: string | null;
  starts_on: string | null;
  ends_on: string | null;
  is_admin: boolean | null;
  is_coach: boolean | null;
  is_firm_admin?: boolean | null;
  erased_at?: string | null;
};

/** The firm's people, staff left out, by name. */
export async function firmPeople(): Promise<Person[]> {
  const ids = [...(await supervisedIds())];
  if (ids.length === 0) return [];
  const [{ data }, cohorts] = await Promise.all([
    createServiceClient().from('profiles').select('*').in('id', ids).limit(5000),
    listCohorts(),
  ]);
  const cohortName = new Map(cohorts.map((c) => [c.id, c.name]));
  return ((data ?? []) as ProfileRow[])
    .filter((p) => !p.is_admin && !p.is_coach && !p.is_firm_admin)
    .map((p) => ({
      id: p.id,
      // A deleted account (0043) still counts for the months it was active,
      // under its new name, but its placeholder address is nobody's to show.
      name: p.display_name?.trim() || p.email || 'Unnamed',
      email: p.erased_at ? null : p.email,
      role:
        p.track === 'litigation_trainee'
          ? p.trainee_approved_at
            ? 'Trainee'
            : 'Trainee (not confirmed)'
          : 'Learner',
      cohort: (p.cohort_id && cohortName.get(p.cohort_id)) || '',
      startsOn: p.starts_on,
      endsOn: p.ends_on,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Active people per month for the last `count` months, on the firm's clock.
 * Null when the figures could not be read, so a page says so rather than
 * showing a month of zeros a firm might be invoiced on.
 */
export async function activeMonths(people: Person[], count = 12): Promise<ActiveMonth[] | null> {
  const zone = DEFAULT_SCHEDULE.timezone;
  const months = monthsUpTo(todayIn(zone), count);
  if (people.length === 0) return activeByMonth([], months);
  const { since, until } = monthBounds(months[0], months[months.length - 1]);
  const { data, error } = await createServiceClient().rpc('firm_activity', {
    ids: people.map((p) => p.id),
    since: localMidnight(zone, since).toISOString(),
    until: localMidnight(zone, until).toISOString(),
    zone,
  });
  if (error) return null;
  return activeByMonth((data ?? []) as Array<{ user_id: string; month: string }>, months);
}

export interface Progress {
  person: Person;
  homeworkDays: number;
  workHandedIn: number;
  workGood: number;
  mattersGood: number;
  certificateIssued: string | null;
  /** Rounds done, missed and counted so far; null for somebody not on rounds. */
  rounds: { done: number; missed: number; counted: number } | null;
}

/** Each person's progress through the programme. */
export async function progressFor(people: Person[]): Promise<Progress[]> {
  if (people.length === 0) return [];
  const ids = people.map((p) => p.id);
  const db = createServiceClient();
  const [homework, submissions, matters, certificates] = await Promise.all([
    db.from('homework_declarations').select('user_id').in('user_id', ids).limit(20000),
    db.from('work_submissions').select('post_id, user_id, submitted_at, verdict').in('user_id', ids).limit(20000),
    db.from('matter_attempts').select('user_id, verdict').in('user_id', ids).eq('verdict', 'good').limit(20000),
    db.from('certificates').select('user_id, issued_at').in('user_id', ids),
  ]);

  const count = (rows: Array<{ user_id: string }> | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1);
    return m;
  };
  const homeworkBy = count(homework.data as Array<{ user_id: string }> | null);
  const mattersBy = count(matters.data as Array<{ user_id: string }> | null);
  const certBy = new Map(
    ((certificates.data ?? []) as Array<{ user_id: string; issued_at: string }>).map((c) => [c.user_id, c.issued_at]),
  );

  // The latest hand-in per person per piece is the one that counts, as on
  // the intake page: handed in twice and marked Good the second time is good.
  const latest = new Map<string, { user_id: string; verdict: string | null; submitted_at: string }>();
  for (const s of (submissions.data ?? []) as Array<{
    post_id: string;
    user_id: string;
    submitted_at: string;
    verdict: string | null;
  }>) {
    const key = `${s.post_id}/${s.user_id}`;
    const held = latest.get(key);
    if (!held || s.submitted_at > held.submitted_at) latest.set(key, s);
  }
  const work = new Map<string, { handedIn: number; good: number }>();
  for (const s of latest.values()) {
    const w = work.get(s.user_id) ?? { handedIn: 0, good: 0 };
    w.handedIn += 1;
    if (s.verdict === 'good') w.good += 1;
    work.set(s.user_id, w);
  }

  // Rounds, a few people at a time: each reads that person's mornings.
  const rounds = new Map<string, Progress['rounds']>();
  const onRounds = people.filter((p) => p.role === 'Trainee');
  for (let i = 0; i < onRounds.length; i += 5) {
    await Promise.all(
      onRounds.slice(i, i + 5).map(async (p) => {
        const h = await roundsHistory(p.id).catch(() => null);
        if (!h) return;
        const all = h.days.flatMap((d) => d.rounds);
        const done = all.filter((r) => r.state === 'done').length;
        const missed = all.filter((r) => r.state === 'missed').length;
        rounds.set(p.id, { done, missed, counted: done + missed });
      }),
    );
  }

  return people.map((person) => ({
    person,
    homeworkDays: homeworkBy.get(person.id) ?? 0,
    workHandedIn: work.get(person.id)?.handedIn ?? 0,
    workGood: work.get(person.id)?.good ?? 0,
    mattersGood: mattersBy.get(person.id) ?? 0,
    certificateIssued: certBy.get(person.id) ?? null,
    rounds: rounds.get(person.id) ?? null,
  }));
}

export interface RegisterRow {
  name: string;
  firm: string;
  boxesAtTopGrade: number;
  coreMissing: number[];
  advocacy: boolean;
  certified: boolean;
}

/** The certification register: each trainee's standing against the competencies. */
export async function registerRows(): Promise<RegisterRow[]> {
  const roster = await rosterWithStatus();
  return roster.map(({ trainee, status }) => ({
    name: trainee.fullName,
    firm: trainee.firmName,
    boxesAtTopGrade: status.boxesAtL3.length,
    coreMissing: status.missingSpineBoxes,
    advocacy: status.hasAdvocacyBox,
    certified: status.certified,
  }));
}
