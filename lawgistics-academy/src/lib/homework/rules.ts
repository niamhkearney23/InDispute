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
import { HOLIDAYS } from '@/content/holidays';

export type HomeworkDay =
  | { state: 'none' }
  | { state: 'before'; daysUntilStart: number }
  /** A weekend, or a public holiday the programme does not run on. */
  | { state: 'weekend'; nextDay: number; resumesOn: string; holiday?: string }
  | { state: 'day'; day: number }
  | { state: 'finished' };

/** Monday is 1, Sunday is 7, so "past 5" reads as "past Friday" everywhere below. */
function isoWeekday(isoDate: string): number {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday to Friday, and not a public holiday the programme skips. */
export function isWorkingDay(isoDate: string): boolean {
  return isoWeekday(isoDate) <= 5 && !(isoDate in HOLIDAYS);
}

/**
 * The calendar date working day `day` of a placement falls on, counting
 * the start date as day one when it is a working day. The inverse of
 * workingDaysElapsed, for drawing a schedule: day 6 of a placement that
 * starts on a Monday is the following Monday, or the Tuesday when that
 * Monday is a holiday.
 */
export function dateOfWorkingDay(startsOn: string, day: number): string {
  let date = startsOn;
  let counted = isWorkingDay(date) ? 1 : 0;
  while (counted < day) {
    date = addDays(date, 1);
    if (isWorkingDay(date)) counted++;
  }
  return date;
}

/**
 * Working days from a start date through an elapsed calendar offset,
 * counting the start date itself when it is a working day. Counted a day at
 * a time: a placement is a few weeks, and a holiday has to be skipped
 * wherever it falls.
 */
export function workingDaysElapsed(startsOn: string, calendarDaysElapsed: number): number {
  let count = 0;
  for (let i = 0; i <= calendarDaysElapsed; i++) {
    if (isWorkingDay(addDays(startsOn, i))) count++;
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

  if (!isWorkingDay(today)) {
    let ahead = 1;
    while (!isWorkingDay(addDays(today, ahead))) ahead++;
    const nextDay = workingDaysElapsed(startsOn, calendarDaysElapsed + ahead);
    if (nextDay > HOMEWORK_DAYS) return { state: 'finished' };
    const holiday = HOLIDAYS[today];
    return {
      state: 'weekend',
      nextDay,
      resumesOn: addDays(today, ahead),
      ...(holiday ? { holiday } : {}),
    };
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
