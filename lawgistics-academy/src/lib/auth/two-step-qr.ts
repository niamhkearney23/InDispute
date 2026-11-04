/**
 * The QR code Supabase returns, as something an <img> can show.
 *
 * Supabase sends the picture as SVG text, and the client library puts
 * `data:image/svg+xml;utf-8,` in front of it. Left like that, the first `#`
 * in a colour inside the drawing ends the address as far as the browser is
 * concerned, and the picture comes out blank or broken. So the prefix comes
 * off and the drawing is sent as base64, which has no characters an address
 * treats specially. Anything that is not a picture comes back as null, and
 * the page offers the typed key instead.
 */
export function qrImageSource(raw: string): string | null {
  // Any data-address label in front (utf-8, utf8, charset=..., repeated).
  let svg = raw.replace(/^(?:data:image\/svg\+xml(?:;[a-z0-9=-]+)*,)+/i, '').trim();
  if (/^data:image\/(?:png|svg\+xml);base64,[a-z0-9+/=]+$/i.test(svg)) return svg;
  // Some servers send the drawing percent-encoded.
  if (/^%3c/i.test(svg)) {
    try {
      svg = decodeURIComponent(svg).trim();
    } catch {
      return null;
    }
  }
  // An XML declaration, a doctype or a comment may come before the drawing;
  // what matters is that it is one SVG drawing. Shown in an <img>, an SVG
  // cannot run anything, so nothing else needs checking.
  const start = svg.search(/<svg[\s>]/i);
  if (start < 0 || /<script/i.test(svg) || !/<\/svg>\s*$/i.test(svg)) return null;
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}
