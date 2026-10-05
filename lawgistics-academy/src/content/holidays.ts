/**
 * Public holidays the trainee programme does not run on.
 *
 * Only days the firm has confirmed, because a guessed holiday moves every
 * date after it: the day plan, the homework, when work falls due and the
 * last day of the month. Add the next intake's holidays here before setting
 * its dates, and move `intakeEndsOn` in programme.ts to match (a test checks
 * the two agree).
 */
export const HOLIDAYS: Record<string, string> = {
  // Deepavali falls on Sunday 8 November 2026, so the Monday is the holiday.
  '2026-11-09': 'Deepavali',
};
