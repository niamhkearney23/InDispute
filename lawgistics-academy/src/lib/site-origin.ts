/**
 * The address to send somebody back to after signing in or out.
 *
 * The request's own origin is right on Vercel, which passes the public host
 * through, but behind any other proxy the app sees the address it was
 * reached on inside the box, often http://localhost:3000, and a redirect
 * built from that sends a person who has just confirmed their email to a
 * page that does not exist on their computer. NEXT_PUBLIC_SITE_URL is the
 * address the firm gave the deployment, so it is used then, and only then:
 * when the request's own origin is a real public address it is kept, so a
 * stale setting or a preview link never sends somebody to another host
 * where they are not signed in. `publicEnv.siteUrl` is not used here because
 * it falls back to localhost, which is the very thing to avoid.
 */
export function siteOrigin(
  requestOrigin: string,
  configured: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  let internal = false;
  try {
    const host = new URL(requestOrigin).hostname;
    internal = host === 'localhost' || host === '0.0.0.0' || host.startsWith('127.');
  } catch {
    internal = true;
  }
  const value = configured?.trim();
  if (internal && value) {
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.origin;
    } catch {
      // Not an address. Fall through to the one the request came in on.
    }
  }
  return requestOrigin;
}
