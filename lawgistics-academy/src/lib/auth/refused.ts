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
