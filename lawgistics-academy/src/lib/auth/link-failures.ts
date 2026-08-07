/**
 * Why a confirmation link did not work, as a fixed set of codes.
 *
 * The obvious implementation is to put Supabase's own message in the redirect
 * and render it. That would mean any page in the app could be made to display
 * arbitrary text chosen by whoever wrote the link: send someone
 * `/login?error=Your+account+is+suspended,+call+...` and the app says it, in
 * its own voice, on its own domain. The wording has to come from here, and the
 * URL may only choose between these.
 */

export const LINK_FAILURES = {
  expired:
    'That confirmation link has expired. Links are only valid for a short time, ' +
    'so request a new one, or sign in below if you have already confirmed.',
  used:
    'That confirmation link has already been used. If you confirmed your address ' +
    'earlier, just sign in below.',
  invalid:
    'That confirmation link is not valid. It may have been cut short by your ' +
    'email program. Sign in below if your account is already confirmed.',
  mismatch:
    'That confirmation link could not be completed in this browser. Open it in ' +
    'the same browser you signed up in, or sign in below.',
  unknown:
    'That confirmation link did not work. If your account is already confirmed, ' +
    'sign in below.',
} as const;

export type LinkFailure = keyof typeof LINK_FAILURES;

/** Narrows an untrusted query or fragment value to one of the codes above. */
export function asLinkFailure(value: string | null | undefined): LinkFailure | null {
  if (!value) return null;
  // `in` walks the prototype chain, so it answers true for 'constructor',
  // 'toString' and '__proto__'. Those would then index to undefined and render
  // as an empty warning box: an alarming, wordless notice on the sign-in page.
  return Object.hasOwn(LINK_FAILURES, value) ? (value as LinkFailure) : null;
}

/**
 * Classifies a message from Supabase into one of the codes. Called on the
 * server, where the message is trustworthy; the code is what crosses the URL.
 */
export function classifyLinkFailure(message: string): LinkFailure {
  const text = message.toLowerCase();

  if (text.includes('expired')) return 'expired';
  if (text.includes('already') || text.includes('used')) return 'used';
  if (text.includes('verifier') || text.includes('challenge')) return 'mismatch';
  if (text.includes('invalid') || text.includes('not found')) return 'invalid';

  return 'unknown';
}
