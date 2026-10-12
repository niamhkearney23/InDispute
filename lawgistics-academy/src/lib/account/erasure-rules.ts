/**
 * The rules of deleting an account (0043), with nothing that needs a
 * database, so they can be tested on their own. What the deletion does is in
 * `erasure.ts` and the migration; this says when it may go ahead and what the
 * account is left looking like. The account page's form reads the word from
 * here, so nothing in this file may need Node.
 */

/** What the name becomes, everywhere it was shown. */
export const ERASED_NAME = 'Deleted account';

/** The word typed to say yes. */
export const CONFIRM_WORD = 'DELETE';

/**
 * The sign-in address an erased account is left with. `.invalid` is reserved
 * (RFC 2606) so it can never receive mail, and the id keeps it unique, which
 * the auth server requires. The database's erase_account writes the same
 * address on the profile, and a test holds the two to one shape.
 */
export function erasedEmail(userId: string): string {
  return `erased-${userId}@invalid.invalid`;
}

/**
 * How long the ban lasts: a hundred years, which the auth server reads as a
 * Go duration. A ban, rather than only a new password, means even a reset
 * link sent to the old address could not get back in, were one ever sent.
 */
export const ERASED_BAN = '876000h';

/**
 * Whether the person really said yes: the word in capitals, and their own
 * email address, which the server compares with the one the session belongs
 * to, never one the form supplies. Spaces around either are forgiven and the
 * address is compared without regard to case, because nobody types their own
 * address the same way twice; the word is not, so it cannot be typed by
 * accident.
 */
export function confirmsErasure(
  typedWord: unknown,
  typedEmail: unknown,
  accountEmail: string | null | undefined,
): boolean {
  if (typeof typedWord !== 'string' || typeof typedEmail !== 'string') return false;
  if (!accountEmail) return false;
  return (
    typedWord.trim() === CONFIRM_WORD &&
    typedEmail.trim().toLowerCase() === accountEmail.trim().toLowerCase()
  );
}

/** An administrator erasing a learner types the word only. */
export function confirmsWord(typedWord: unknown): boolean {
  return typeof typedWord === 'string' && typedWord.trim() === CONFIRM_WORD;
}
