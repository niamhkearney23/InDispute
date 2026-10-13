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

/* -------------------------------------------------------------------------- */
/* The steps of a deletion (0045)                                             */
/* -------------------------------------------------------------------------- */

/**
 * A deletion is four steps, each recorded on its job (account_erasures) when
 * it finishes. The database step is one transaction and nothing has changed
 * if it fails; after it, the person can no longer use the account whatever
 * happens to the other three, because the database refuses them.
 */
export type ErasureStep = 'database' | 'sessions' | 'signIn' | 'files';

export const ERASURE_STEPS: readonly ErasureStep[] = ['database', 'sessions', 'signIn', 'files'];

/** What each step is, for an administrator reading the job. */
export const STEP_LABEL: Record<ErasureStep, string> = {
  database: 'Name, email and photo removed from the database',
  sessions: 'Signed out on every device',
  signIn: 'Sign-in closed: new address, unknown password, banned',
  files: 'Stored photo and recordings deleted',
};

/** What is still to happen, in words for the person or an administrator. */
const PENDING_WORDS: Record<ErasureStep, string> = {
  database: 'removing the details from the database',
  sessions: 'ending every session',
  signIn: 'closing off sign-in at the sign-in service',
  files: 'deleting the stored files (the photo and any recordings)',
};

/**
 * How a run of the deletion came out.
 *
 *   refused: nothing changed (no such account, a staff account, or the
 *     database step failed and rolled back);
 *   complete: every step has finished;
 *   incomplete: the database step is done, so the account can no longer be
 *     used, but at least one other step has not finished. `recorded` is false
 *     when the progress itself could not be written to the job.
 */
export type ErasureOutcome =
  | { kind: 'refused'; error: string }
  | { kind: 'complete' }
  | { kind: 'incomplete'; pending: ErasureStep[]; recorded: boolean };

function list(words: string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}

/** The steps named in /goodbye's address, keeping only ones that exist. */
export function parsePending(value: string | string[] | undefined): ErasureStep[] {
  const raw = Array.isArray(value) ? value.join(',') : (value ?? '');
  const asked = new Set(raw.split(',').map((s) => s.trim()));
  return ERASURE_STEPS.filter((step) => asked.has(step));
}

/** Where somebody lands after deleting their own account. */
export function goodbyePath(outcome: ErasureOutcome): string {
  if (outcome.kind !== 'incomplete' || outcome.pending.length === 0) return '/goodbye';
  return `/goodbye?pending=${outcome.pending.join(',')}`;
}

/**
 * What /goodbye says. Only "has been deleted" when every step finished; when
 * something is outstanding, the truth: signed out and unable to use the
 * account, details removed from the database, and what the firm still has to
 * finish. Either way, what the firm keeps is not called anonymous.
 */
export function goodbyeCopy(pending: ErasureStep[]): { heading: string; body: string[] } {
  const kept =
    'Your name, email address and photo have been removed. What you answered and handed in, ' +
    'and any work-board message a supervisor kept for supervision, stay with the firm as its ' +
    'training record; your name is no longer on them, but what you wrote may still identify you.';
  if (pending.length === 0) {
    return {
      heading: 'Your account has been deleted.',
      body: [
        'You have been signed out everywhere and cannot sign in to it again. Your stored photo and any recordings have been deleted.',
        kept,
      ],
    };
  }
  return {
    heading: 'You are signed out, and the deletion is being finished.',
    body: [
      'You cannot use this account any more. Your details have been removed from our database.',
      `${capitalise(list(pending.map((s) => PENDING_WORDS[s])))} has not finished yet. The firm will finish it: it is retried automatically every day, and the firm’s administrators can see that it is outstanding.`,
      kept,
    ],
  };
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** What an administrator is told after deleting a learner, or retrying. */
export function adminErasureMessage(outcome: ErasureOutcome): { ok: boolean; text: string } {
  if (outcome.kind === 'refused') return { ok: false, text: outcome.error };
  if (outcome.kind === 'complete') {
    return {
      ok: true,
      text:
        'Deleted. Their name, email and photo are removed, they are signed out everywhere and cannot sign in again, and their stored files are deleted. What may still identify them is listed for review at Admin, Deletions.',
    };
  }
  if (outcome.pending.length === 0) {
    return {
      ok: false,
      text: 'Every step finished, but that could not be recorded. Admin, Deletions shows it as unfinished until the next retry records it.',
    };
  }
  const note = outcome.recorded
    ? ''
    : ' The progress could not be recorded, so Admin, Deletions may show more as unfinished until the next retry.';
  return {
    ok: false,
    text: `Not finished. Their details are removed from the database and they can no longer use the account, but ${list(
      outcome.pending.map((s) => PENDING_WORDS[s]),
    )} has not finished. It is retried automatically every day, and you can retry it now at Admin, Deletions.${note}`,
  };
}
