import NextLink from 'next/link';
import type { ComponentProps } from 'react';

/**
 * Every link in the app, with background preloading off unless a link asks.
 *
 * Next preloads a page as soon as its link scrolls into view. Every page
 * behind the sign-in is rendered per request (the CSP nonce, the session),
 * so a preload brings back only the page's outline, about 270 bytes, never
 * its content, while the middleware still checks the session and the
 * deleted-account rule for it: two calls to Supabase per link on screen.
 * Measured in October 2026 against the visual check's stand-in: one visit
 * to Today made 16 preloads and 78 calls to Supabase, 46 with preloading
 * blocked. The page a person actually opens is fetched when they tap, as
 * it would be anyway. A test holds every file to this import.
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
