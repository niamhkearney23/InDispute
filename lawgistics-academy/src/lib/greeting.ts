/**
 * Time of day in the learner's own timezone, not the server's.
 *
 * Shared, because two pages greeting the same person differently within a
 * minute of each other reads as carelessness.
 */
export function greeting(date: Date, timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-AU', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(date),
  );

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
