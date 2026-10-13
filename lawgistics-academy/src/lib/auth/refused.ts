/**
 * Whether the auth server has this person banned. A deleted account is
 * (0043), and is then treated as signed out everywhere, so a page left open
 * on another device cannot carry on until its token runs out. Kept apart
 * from the erasure rules because the middleware imports it, and the
 * middleware cannot load Node's crypto.
 */
export function signInRefused(user: { banned_until?: string | null } | null | undefined): boolean {
  const until = user?.banned_until;
  if (!until) return false;
  const at = Date.parse(until);
  return Number.isFinite(at) && at > Date.now();
}

/**
 * What the database says to a deleted account (0045, `check_request`). The
 * same words are in the migration, and a test holds the two together.
 */
export const ERASED_REFUSAL = 'This account has been deleted and can no longer be used.';

/**
 * Whether the answer to `rpc('caller_erased')`, asked with the person's own
 * session, says their account is deleted. It does when the function answers
 * true, or when PostgREST's pre-request check refused the request outright
 * (permission denied, with the refusal above). Anything else, including a
 * database without 0045 or one that cannot be reached, is not taken as
 * deleted: the database refuses a deleted account on its own, so this check
 * only decides what the app shows, and it must not sign everybody out on a
 * passing network fault.
 */
export function erasedByCheck(
  data: unknown,
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (error) return error.code === '42501' && (error.message ?? '').includes(ERASED_REFUSAL);
  return data === true;
}
