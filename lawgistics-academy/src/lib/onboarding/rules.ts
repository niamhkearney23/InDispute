/**
 * What "done" means, and how long there is left.
 *
 * Deliberately free of `server-only` and of any database call, because these
 * are the two pieces of this feature that are worth testing directly: whether
 * an item counts as finished, and how many days somebody has. Both were
 * previously inline in the service and repeated across three pages, which is
 * how a checklist ends up saying one thing to a joiner and another to the
 * person overseeing them.
 */

export type FirmStepKind = 'read' | 'sign' | 'task';

/**
 * Whether an item counts as finished.
 *
 * A reading step is finished when the person has acknowledged the current
 * version of the document, and that record belongs to the firm-module tables,
 * not here. Nobody at the firm confirms a reading step: you cannot observe
 * somebody reading, and a tick that claimed you had would be worth less than
 * the honest gap.
 *
 * Anything else is finished when the person says so, and, where the firm can
 * actually see the thing, when the firm says so too. Both halves are required
 * in that case, and the order they arrive in does not matter.
 */
export function settles(
  kind: FirmStepKind,
  needsFirmCheck: boolean,
  declaredAt: string | null,
  confirmedAt: string | null,
): boolean {
  if (kind === 'read') return declaredAt !== null;
  if (needsFirmCheck) return declaredAt !== null && confirmedAt !== null;
  return declaredAt !== null;
}

/** Said done by them, still waiting on somebody at the firm. */
export function awaitingFirm(
  kind: FirmStepKind,
  needsFirmCheck: boolean,
  declaredAt: string | null,
  confirmedAt: string | null,
): boolean {
  if (kind === 'read') return false;
  return needsFirmCheck && declaredAt !== null && confirmedAt === null;
}

/** A calendar date as YYYY-MM-DD, converted to a count of days. */
function dayNumber(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1) / 86_400_000;
}

/**
 * Today's calendar date in somebody's own timezone.
 *
 * These pages render on the server, where `new Date()` is the server's clock.
 * On Vercel that is UTC, so a learner in Kuala Lumpur would be told the wrong
 * number of days for the first eight hours of every one of their days. The app
 * already stores each person's timezone and already uses it for the greeting
 * and the daily brief; the countdown has no business disagreeing with them.
 *
 * en-CA because it formats as YYYY-MM-DD, which is the shape the start date is
 * already in.
 */
export function todayIn(timezone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  } catch {
    // An unrecognised timezone must not take the page down over a countdown.
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(now);
  }
}

/**
 * Whole days between today and a start date, counted in calendar days rather
 * than elapsed time.
 *
 * Subtracting two timestamps and dividing by a day gives the wrong answer twice
 * a year in any country that changes its clocks, because the day the clocks go
 * forward is 23 hours long. Comparing calendar dates sidesteps that entirely,
 * and "you begin in 0 days" on the morning somebody begins is the kind of wrong
 * that gets noticed immediately.
 */
export function daysUntil(
  startsOn: string,
  timezone: string,
  now: Date = new Date(),
): number {
  return dayNumber(startsOn) - dayNumber(todayIn(timezone, now));
}

export function longDate(value: string): string {
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function shortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** The sentence at the top of a joiner's list. */
export function countdown(
  startsOn: string,
  timezone: string,
  now: Date = new Date(),
): string {
  const days = daysUntil(startsOn, timezone, now);
  // Past a couple of months a day count stops being information and starts
  // being noise, and a mistyped year turns it into nonsense: 2099 for 2029
  // reads as "you begin in 26,503 days", which tells somebody nothing except
  // that the page is not paying attention. The date alone is right either way.
  if (days > 60) return `You begin on ${longDate(startsOn)}.`;
  if (days > 1) return `You begin in ${days} days, on ${longDate(startsOn)}.`;
  if (days === 1) return `You begin tomorrow, ${longDate(startsOn)}.`;
  if (days === 0) return 'You begin today.';
  return `You began on ${longDate(startsOn)}.`;
}
