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
  nextIntake: 'November 2026',
  /** The working pattern. */
  days: 'Monday to Friday',
  /**
   * The current intake's first and last working day. An administrator
   * applies these to confirmed trainees from the intake page; nothing reads
   * them as a person's dates until that has been done, because a start date
   * is the firm's decision about a person, not a default.
   */
  intakeStartsOn: '2026-11-02',
  intakeEndsOn: '2026-11-27',
} as const;
