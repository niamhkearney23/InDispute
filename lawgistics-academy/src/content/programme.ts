/**
 * The litigation trainee programme, as its front page describes it.
 *
 * Plain facts in one place, so that when the next intake moves the change is
 * one line here rather than a hunt through the pages. Nothing in the app's
 * behaviour turns on these: the programme's dates for a person are set by
 * their supervisor on their profile, and this is only what the door says.
 */
export const PROGRAMME = {
  /** How long it runs. */
  length: 'One month',
  /** When the next one starts, in words. */
  nextIntake: 'October 2026',
  /** The working pattern. */
  days: 'Monday to Friday',
} as const;
