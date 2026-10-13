/**
 * How long the work board keeps what people said (0045), and the words that
 * replace text once it is removed. Nothing here needs a database or Node, so
 * a page, the daily job and the tests can all read it.
 */

/**
 * The retention period for work-board messages and comments, in months,
 * counted from when the piece of work closed (its last activity, or its due
 * date if that is later; `work_post_closed_at` in the migration). After it,
 * the daily job replaces their text with REDACTED_TEXT.retention, unless a
 * coach or administrator marked one kept for supervision.
 *
 * This is the one place the number lives: the database function takes it as
 * an argument and has no default of its own. Changing it is the owner's
 * decision, and CLAUDE.md and docs/SECURITY-SETUP.md say what it is.
 */
export const WORK_BOARD_RETENTION_MONTHS = 24;

/**
 * What a removed message or comment reads afterwards, by why it was removed.
 * The same words are in `public.redacted_text()`; a test holds the two
 * together, and the database refuses any other text in a removed row.
 */
export const REDACTED_TEXT = {
  erasure: 'Removed when the account was deleted.',
  retention: 'Removed at the end of the retention period.',
  review: 'Removed by an administrator to protect personal information.',
} as const;

export type RedactionReason = keyof typeof REDACTED_TEXT;

/** The shortest reason a coach may give for keeping a message. */
export const MIN_KEPT_REASON = 3;
