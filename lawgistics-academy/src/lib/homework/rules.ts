/**
 * Which day of somebody's homework today is.
 *
 * Deliberately a small discriminated union rather than a nullable number: the
 * card has five different things to say, and "null" would collapse "you have
 * not started", "it is Saturday" and "you finished" into one silence.
 *
 * The calendar arithmetic is borrowed from the onboarding rules rather than
 * rewritten, because the app should have one answer to "what day is it where
 * this person is", not two that drift apart at a DST boundary.
 */
import { daysUntil, todayIn } from '@/lib/onboarding/rules';
import { HOMEWORK_DAYS } from '@/content/seed/homework';

export type HomeworkDay =
  | { state: 'none' }
  | { state: 'before'; daysUntilStart: number }
  | { state: 'weekend'; nextDay: number }
  | { state: 'day'; day: number }
  | { state: 'finished' };

/** Monday is 1, Sunday is 7, so "past 5" reads as "past Friday" everywhere below. */
function isoWeekday(isoDate: string): number {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/**
 * Working days (Monday to Friday) from a start date through an elapsed
 * calendar offset, counting the start date itself when it is a weekday.
 *
 * A full seven-day block always contains exactly five weekdays regardless of
 * which day it starts on, so only the leftover few days at the end need
 * counting one at a time; the rest is whole weeks times five.
 */
export function workingDaysElapsed(startsOn: string, calendarDaysElapsed: number): number {
  if (calendarDaysElapsed < 0) return 0;

  const totalDays = calendarDaysElapsed + 1;
  const remainder = totalDays % 7;
  const fullWeeks = (totalDays - remainder) / 7;

  let count = fullWeeks * 5;
  const startWeekday = isoWeekday(startsOn);
  for (let i = 0; i < remainder; i++) {
    const weekday = ((startWeekday - 1 + i) % 7) + 1;
    if (weekday <= 5) count++;
  }
  return count;
}

export function homeworkDay(
  startsOn: string | null,
  endsOn: string | null,
  timezone: string,
  now: Date = new Date(),
): HomeworkDay {
  if (!startsOn) return { state: 'none' };

  const daysUntilStart = daysUntil(startsOn, timezone, now);
  if (daysUntilStart > 0) return { state: 'before', daysUntilStart };

  const today = todayIn(timezone, now);
  if (endsOn && today > endsOn) return { state: 'finished' };

  const calendarDaysElapsed = -daysUntilStart;
  const weekday = isoWeekday(today);

  if (weekday > 5) {
    const toMonday = weekday === 6 ? 2 : 1;
    const nextDay = workingDaysElapsed(startsOn, calendarDaysElapsed + toMonday);
    return nextDay > HOMEWORK_DAYS ? { state: 'finished' } : { state: 'weekend', nextDay };
  }

  const day = workingDaysElapsed(startsOn, calendarDaysElapsed);
  return day > HOMEWORK_DAYS ? { state: 'finished' } : { state: 'day', day };
}

/**
 * The most recent working day that has actually happened, for catching up.
 *
 * A weekend has no day of its own, but Friday's did not stop being real just
 * because it is now Saturday: this is what lets somebody declare Friday's
 * task over the weekend without also letting them declare Monday's before it
 * arrives. Zero before the placement has begun.
 */
export function lastArrivedDay(day: HomeworkDay): number {
  switch (day.state) {
    case 'day':
      return day.day;
    case 'weekend':
      return day.nextDay - 1;
    case 'finished':
      return HOMEWORK_DAYS;
    default:
      return 0;
  }
}
