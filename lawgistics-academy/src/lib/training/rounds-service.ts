import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { localMidnight, shiftLocalDate } from '@/lib/local-day';
import { todayIn } from '@/lib/onboarding/rules';
import {
  ROUNDS_TIMEZONE,
  lastRoundsDate,
  roundsDayNumber,
  roundsFor,
  type Round,
  type RoundSession,
} from './rounds';
import type { SupabaseClient } from '@supabase/supabase-js';
import { trainingOpen } from './service';
import { JURISDICTION_COUNTRY, asCountry, type Country, type Jurisdiction } from '@/lib/types';

type SessionRow = { id: string; started_at: string; planned_question_count: number; completed_at: string | null };

/**
 * Daily sessions since a moment, each with when its answers were given, so a
 * round counts only answers given in its hour. Answers are read a thousand at
 * a time: a month of mornings is about eight hundred. Sessions are read from
 * a day earlier than the answers, so one started the evening before and
 * answered after midnight still has its answers counted where they fell.
 */
async function roundSessions(db: SupabaseClient, userId: string, since: string): Promise<RoundSession[]> {
  const { data: sessions } = await db
    .from('training_sessions')
    .select('id, started_at, planned_question_count, completed_at')
    .eq('user_id', userId)
    .eq('kind', 'daily')
    .gte('started_at', new Date(new Date(since).getTime() - 86_400_000).toISOString())
    .limit(1000);
  const rows = (sessions ?? []) as SessionRow[];
  if (rows.length === 0) return [];

  const times = new Map<string, string[]>(rows.map((r) => [r.id, []]));
  for (let page = 0; page < 10; page++) {
    const { data } = await db
      .from('user_question_attempts')
      .select('session_id, answered_at')
      .eq('user_id', userId)
      .gte('answered_at', since)
      .order('answered_at', { ascending: true })
      .order('id', { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    for (const a of (data ?? []) as Array<{ session_id: string | null; answered_at: string }>) {
      if (a.session_id) times.get(a.session_id)?.push(a.answered_at);
    }
    if ((data ?? []).length < 1000) break;
  }
  return rows.map((r) => ({
    startedAt: r.started_at,
    answeredAt: times.get(r.id) ?? [],
    questionCount: r.planned_question_count,
    completedAt: r.completed_at,
  }));
}

/**
 * When questions were first signed off for a country, as near as the record
 * says: before it, no round could have been done, so none is missed.
 *
 * Questions carry no publication time, so this is the earliest sign-off
 * (`verified_at`) among the current, published versions. It can be early,
 * when a question was signed off some time before it was published, and it
 * can be late, when the first question published has since been edited and
 * signed off again. Late only excuses rounds; early can still show a round
 * missed that nobody could have done, which only a recorded publication time
 * would fix.
 */
async function firstQuestionAt(db: SupabaseClient, country: Country): Promise<Date | null> {
  const { data } = await db
    .from('question_versions')
    .select('verified_at, jurisdiction, questions!inner(status, country)')
    .eq('is_current', true)
    .eq('verification_status', 'human_verified')
    .eq('questions.status', 'published')
    // Filtered in the query: the first two hundred sign-offs could all be the
    // other country's, and then this country's first day was never found.
    .eq('questions.country', country)
    .not('verified_at', 'is', null)
    .order('verified_at', { ascending: true })
    .limit(1);
  // Checked again by jurisdiction, so a question whose country and
  // jurisdiction disagree does not start the other country's calendar.
  const first = ((data ?? []) as Array<{ verified_at: string; jurisdiction: Jurisdiction }>).find(
    (v) => JURISDICTION_COUNTRY[v.jurisdiction] === country,
  );
  return first ? new Date(first.verified_at) : null;
}

/**
 * The instant rounds start counting for this person: the later of when they
 * were confirmed and when questions were first signed off. A round that
 * closes at or before it is not applicable, never missed.
 */
async function roundsNotBefore(
  db: SupabaseClient,
  country: Country,
  approvedAt: string,
): Promise<Date> {
  const confirmed = new Date(approvedAt);
  const opened = await firstQuestionAt(db, country);
  return opened && opened > confirmed ? opened : confirmed;
}

export interface RoundsToday {
  timezone: string;
  date: string;
  rounds: Round[];
  /**
   * The next morning with rounds, as "Monday 9 November", or null when today
   * was the placement's last. Not simply "tomorrow": after Friday it is
   * Monday, and a public holiday is skipped.
   */
  nextMorning: string | null;
}

function nextMorningAfter(date: string, startsOn: string, endsOn: string | null): string | null {
  const end = lastRoundsDate(startsOn, endsOn);
  let next = shiftLocalDate(date, 1);
  while (roundsDayNumber(startsOn, endsOn, next) === null && next <= end) next = shiftLocalDate(next, 1);
  if (next > end) return null;
  return new Date(`${next}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

/**
 * Today's rounds for this person, or null when they are not on rounds: not
 * a confirmed litigation trainee, not a rounds day of their placement
 * (`roundsDayNumber`, the same test the calendar uses), or no questions
 * published yet for their country (a round nobody could do is not a round
 * missed). A round that closed before they were confirmed or before
 * questions were first signed off is not applicable.
 * Everybody else trains to their own daily goal, as before.
 *
 * Service client, so every caller passes the signed-in user's own id.
 */
export async function roundsToday(userId: string, now: Date = new Date()): Promise<RoundsToday | null> {
  const db = createServiceClient();
  const { data: p } = await db
    .from('profiles')
    .select('track, trainee_approved_at, starts_on, ends_on, country')
    .eq('id', userId)
    .maybeSingle();
  if (!p || p.track !== 'litigation_trainee' || !p.trainee_approved_at) return null;
  const country = asCountry(p.country);
  if (!(await trainingOpen(country))) return null;

  const timezone = ROUNDS_TIMEZONE;
  const date = todayIn(timezone, now);
  const startsOn = p.starts_on as string | null;
  const endsOn = p.ends_on as string | null;
  if (!startsOn || roundsDayNumber(startsOn, endsOn, date) === null) return null;

  const [sessions, notBefore] = await Promise.all([
    roundSessions(db, userId, localMidnight(timezone, date).toISOString()),
    roundsNotBefore(db, country, p.trainee_approved_at as string),
  ]);
  return {
    timezone,
    date,
    rounds: roundsFor(timezone, date, sessions, now, notBefore),
    nextMorning: nextMorningAfter(date, startsOn, endsOn),
  };
}

export interface RoundDay {
  date: string;
  rounds: Round[];
}

/**
 * Every working day of a trainee's placement so far, with its rounds, for
 * the little calendar and for the coach. Days still to come are left out.
 * Service client: callers pass the signed-in user's own id, or a coach's
 * page passes a trainee it has already checked it may read.
 */
export async function roundsHistory(
  userId: string,
  now: Date = new Date(),
): Promise<{ startsOn: string; endsOn: string | null; days: RoundDay[] } | null> {
  const db = createServiceClient();
  const { data: p } = await db
    .from('profiles')
    .select('track, trainee_approved_at, starts_on, ends_on, country')
    .eq('id', userId)
    .maybeSingle();
  // Only a confirmed trainee is on rounds, as in roundsToday.
  if (!p || p.track !== 'litigation_trainee' || !p.trainee_approved_at || !p.starts_on) return null;
  // Nothing to answer, nothing missed: no calendar until questions are published.
  const country = asCountry(p.country);
  if (!(await trainingOpen(country))) return null;

  const timezone = ROUNDS_TIMEZONE;
  const today = todayIn(timezone, now);
  // The calendar starts on the later of the start date and the day rounds
  // start counting (confirmed, and questions first signed off), because a
  // round before either could not have been done. On that first day the
  // rounds that closed before it are not applicable rather than missed. It
  // ends on the last rounds day, which is day twenty when no end date was set.
  const startsOn = p.starts_on as string;
  const endsOn = p.ends_on as string | null;
  const notBefore = await roundsNotBefore(db, country, p.trainee_approved_at as string);
  const counting = todayIn(timezone, notBefore);
  const first = counting > startsOn ? counting : startsOn;
  const end = lastRoundsDate(startsOn, endsOn);
  const last = end < today ? end : today;

  const all = await roundSessions(db, userId, localMidnight(timezone, first).toISOString());
  const days: RoundDay[] = [];
  for (let date = first; date <= last; date = shiftLocalDate(date, 1)) {
    if (roundsDayNumber(startsOn, endsOn, date) === null) continue;
    days.push({ date, rounds: roundsFor(timezone, date, all, now, notBefore) });
  }
  return { startsOn, endsOn: endsOn ?? end, days };
}
