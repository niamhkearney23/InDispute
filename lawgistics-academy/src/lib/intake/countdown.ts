/**
 * One short line about where the trainee intake stands, for the home page:
 * "Starts in 3 days", "Starts Monday", "Week 2 under way". Null once the
 * intake has finished, so the page never advertises a start that has gone.
 * Dates are compared in Kuala Lumpur, where the programme runs.
 */
function klDate(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  );
}

export function intakeStatus(startsOn: string, endsOn: string, now: Date): string | null {
  const today = klDate(now);
  if (today > endsOn) return null;
  const until = daysBetween(today, startsOn);
  if (until > 1) return `Starts in ${until} days`;
  if (until === 1) return 'Starts tomorrow';
  if (until === 0) return 'Starts today';
  const week = Math.min(4, Math.floor(-until / 7) + 1);
  return `Week ${week} under way`;
}
