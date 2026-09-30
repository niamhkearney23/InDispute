/**
 * Days where the learner is.
 *
 * A date string is not an instant: "2026-08-25" starts at a different moment
 * in Kuala Lumpur than in Melbourne, and every daily thing here (the goal,
 * "yesterday", the streak) has to turn on the learner's midnight rather than
 * the server's. These helpers do that conversion without parsing a date in
 * the process's own timezone, which is UTC on Vercel and whatever the laptop
 * is set to when running locally, and neither is the learner's.
 */

/** How far a timezone is from UTC at a given instant, in minutes. */
export function zoneOffsetMinutes(timezone: string, at: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(at);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
    const asUtc = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour') === 24 ? 0 : get('hour'),
      get('minute'),
      get('second'),
    );
    return Math.round((asUtc - at.getTime()) / 60_000);
  } catch {
    return 0;
  }
}

/**
 * The instant a local calendar day begins.
 *
 * Two passes, because the offset can change between the guess and the
 * answer: on the day clocks go forward, the offset at UTC midnight is not
 * the offset at local midnight. The second pass asks the zone again at the
 * first answer, which lands on the right side of the change.
 */
export function localMidnight(timezone: string, localDate: string): Date {
  const [y, m, d] = localDate.split('-').map(Number);
  const naive = Date.UTC(y, m - 1, d);
  let guess = naive - zoneOffsetMinutes(timezone, new Date(naive)) * 60_000;
  guess = naive - zoneOffsetMinutes(timezone, new Date(guess)) * 60_000;
  return new Date(guess);
}

/** A calendar day some days before or after another, as YYYY-MM-DD. */
export function shiftLocalDate(localDate: string, days: number): string {
  const [y, m, d] = localDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * The streak as it stands today, not as it was last written.
 *
 * The stored count only moves when a session finishes, so a six-day streak
 * whose owner skipped yesterday still reads six in the table. It is not
 * six: it is over, and telling somebody "one session keeps the chain" when
 * the chain is already broken is a promise the next session breaks in front
 * of them. Alive means trained today or yesterday.
 */
export function liveStreak(stored: number, lastTrainedOn: string | null, today: string): number {
  if (!lastTrainedOn) return 0;
  const yesterday = shiftLocalDate(today, -1);
  return lastTrainedOn === today || lastTrainedOn === yesterday ? stored : 0;
}
