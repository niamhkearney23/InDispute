import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { homeworkDay, isWorkingDay } from '@/lib/homework/rules';
import { localMidnight, shiftLocalDate } from '@/lib/local-day';
import { todayIn } from '@/lib/onboarding/rules';
import { ROUNDS_TIMEZONE, roundsFor, type Round } from './rounds';
import { trainingOpen } from './service';
import { asCountry } from '@/lib/types';

export interface RoundsToday {
  timezone: string;
  date: string;
  rounds: Round[];
}

/**
 * Today's rounds for this person, or null when they are not on rounds: not
 * a confirmed litigation trainee, not a working day of their placement, or
 * no questions published yet for their country (a round nobody could do is
 * not a round missed).
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
  if (!(await trainingOpen(asCountry(p.country)))) return null;

  const timezone = ROUNDS_TIMEZONE;
  if (homeworkDay(p.starts_on, p.ends_on, timezone, now).state !== 'day') return null;

  const date = todayIn(timezone, now);
  const { data: sessions } = await db
    .from('training_sessions')
    .select('started_at, total_answered, status')
    .eq('user_id', userId)
    .eq('kind', 'daily')
    .gte('started_at', localMidnight(timezone, date).toISOString());

  return {
    timezone,
    date,
    rounds: roundsFor(
      timezone,
      date,
      ((sessions ?? []) as Array<{ started_at: string; total_answered: number; status: string }>).map(
        (s) => ({ startedAt: s.started_at, totalAnswered: s.total_answered, completed: s.status === 'completed' }),
      ),
      now,
    ),
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
    .select('track, starts_on, ends_on, country')
    .eq('id', userId)
    .maybeSingle();
  if (!p || p.track !== 'litigation_trainee' || !p.starts_on) return null;
  // Nothing to answer, nothing missed: no calendar until questions are published.
  if (!(await trainingOpen(asCountry(p.country)))) return null;

  const timezone = ROUNDS_TIMEZONE;
  const today = todayIn(timezone, now);
  const { data: sessions } = await db
    .from('training_sessions')
    .select('started_at, total_answered, status')
    .eq('user_id', userId)
    .eq('kind', 'daily')
    .gte('started_at', localMidnight(timezone, p.starts_on).toISOString())
    .limit(1000);
  const all = ((sessions ?? []) as Array<{ started_at: string; total_answered: number; status: string }>).map(
    (s) => ({ startedAt: s.started_at, totalAnswered: s.total_answered, completed: s.status === 'completed' }),
  );

  const days: RoundDay[] = [];
  const last = p.ends_on && p.ends_on < today ? p.ends_on : today;
  for (let date = p.starts_on; date <= last; date = shiftLocalDate(date, 1)) {
    if (!isWorkingDay(date)) continue;
    days.push({ date, rounds: roundsFor(timezone, date, all, now) });
  }
  return { startsOn: p.starts_on, endsOn: p.ends_on, days };
}
