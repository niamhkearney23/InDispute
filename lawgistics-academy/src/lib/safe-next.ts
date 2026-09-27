/**
 * Where to send somebody after they sign in, from a `next` in the address.
 *
 * Only a path on this site. Starting with "/" is not enough on its own:
 * browsers read a backslash as a slash, so "/\evil.com" means another site,
 * and a tab or newline inside the address is dropped before it is read, so
 * "/<tab>/evil.com" does too. Both got past the old check, which made the
 * sign-in page a way to send somebody who had just trusted it with their
 * password straight on to a copy of it somewhere else.
 */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return fallback;
  try {
    const base = 'https://this-site.invalid';
    const resolved = new URL(next, base);
    if (resolved.origin !== base) return fallback;
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return fallback;
  }
}
