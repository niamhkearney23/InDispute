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

/**
 * The name to greet somebody by.
 *
 * The display name is whatever the signup form was given, and when it was
 * given nothing it falls back to the part of the email before the @. That is
 * fine as a label and wrong in a greeting: "Good morning, niamhkearney23" is
 * worse than not using a name at all.
 *
 * So: the first word only, and only when it looks like a name somebody would
 * answer to. Anything carrying digits, or long enough to be a handle rather
 * than a name, is dropped and the greeting stands on its own.
 */
export function greetingName(displayName: string | null | undefined): string | null {
  const first = String(displayName ?? '').trim().split(/[\s.]+/)[0] ?? '';
  if (first.length < 2 || first.length > 20) return null;
  if (/\d|[^\p{L}'-]/u.test(first)) return null;
  // Typed in lower case by somebody in a hurry. Their name still gets a capital.
  return first.charAt(0).toUpperCase() + first.slice(1);
}
