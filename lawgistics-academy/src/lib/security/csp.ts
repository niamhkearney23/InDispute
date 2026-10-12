import { EMBED_HOSTS } from '@/lib/lessons/embed';

/**
 * The content security policy every page is served with.
 *
 * The point of it is the script line. A page here shows words other people
 * wrote: a coach's post, an intern's message, a firm's own policy. If one of
 * those ever slipped past the escaping and reached the page as markup, a
 * policy without script-src would run whatever it carried, as whoever was
 * reading, with their session. With this one a script runs only if it carries
 * the nonce minted for this one response, and anything such a script loads
 * inherits that trust ('strict-dynamic'), which is how Next's own chunks get
 * in without listing them.
 *
 * Kept as a plain function with no Next imports so a test can read the policy
 * it produces, and so the middleware stays a caller rather than the place the
 * rules live.
 */

export interface CspOptions {
  /** Fresh for every response. Never reuse one, or the nonce proves nothing. */
  nonce: string;
  /** React needs eval in development for its error overlays, never in production. */
  dev: boolean;
  /** NEXT_PUBLIC_SUPABASE_URL: the browser signs in against it and loads files from it. */
  supabaseUrl?: string;
  /** The brand logo as configured, which may live on the firm's own site. */
  logo?: string | null;
  /**
   * Only when the page itself came over HTTPS. On a plain http address
   * (a laptop, the visual QA mock) upgrading would send every request to an
   * https port nothing is listening on.
   */
  upgradeInsecure: boolean;
}

/** The origin of an absolute http(s) URL, or nothing when it is not one. */
function originOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/** A fresh nonce: 128 random bits, base64. Works on the edge and in Node alike. */
export function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function buildCsp(options: CspOptions): string {
  const supabase = originOf(options.supabaseUrl);
  // A logo given as a path is on this site already; only one on another host
  // needs naming.
  const logo = options.logo?.startsWith('https://') ? originOf(options.logo) : null;
  const frames = [...EMBED_HOSTS].map((host) => `https://${host}`);

  const directives: Array<[string, Array<string | null | false>]> = [
    ['default-src', ["'self'"]],
    [
      'script-src',
      ["'self'", `'nonce-${options.nonce}'`, "'strict-dynamic'", options.dev && "'unsafe-eval'"],
    ],
    // Styles stay open to inline. Pages set colours and widths in style
    // attributes (a firm's accent, a progress bar), and a nonce here would make
    // the browser ignore 'unsafe-inline' and drop every one of them. A style
    // cannot run anything, which is why the line that matters is scripts.
    ['style-src', ["'self'", "'unsafe-inline'"]],
    // data: is the cartoon maker's preview, drawn in the browser; blob: is a
    // photo previewed before it is uploaded; Supabase holds uploaded photos.
    ['img-src', ["'self'", 'data:', 'blob:', supabase, logo]],
    // blob: is a voice memo or recording played back before it is sent;
    // Supabase serves the ones already handed in, by signed address.
    ['media-src', ["'self'", 'blob:', supabase]],
    // The sign-in, sign-up and password forms talk to Supabase from the browser.
    ['connect-src', ["'self'", supabase]],
    // next/font serves the fonts from this site, so nothing else is needed.
    ['font-src', ["'self'"]],
    // Coach sessions and lesson videos, from the hosts lib/lessons/embed allows.
    ['frame-src', frames],
    ['frame-ancestors', ["'none'"]],
    ['base-uri', ["'self'"]],
    // Paying and managing a subscription leave through Stripe's own pages. The
    // form posts here and the server redirects there, and a browser holds a
    // form's redirect to this list too.
    ['form-action', ["'self'", 'https://checkout.stripe.com', 'https://billing.stripe.com']],
    ['object-src', ["'none'"]],
  ];

  const parts = directives.map(([name, values]) => {
    const kept = values.filter((v): v is string => Boolean(v));
    return `${name} ${[...new Set(kept)].join(' ')}`;
  });
  if (options.upgradeInsecure) parts.push('upgrade-insecure-requests');
  return parts.join('; ');
}
