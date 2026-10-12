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
  const svg = raw.replace(/^(?:data:image\/svg\+xml;utf-8,)+/i, '').trim();
  if (/^data:image\/(?:png|svg\+xml);base64,[a-z0-9+/=]+$/i.test(svg)) return svg;
  if (!/^(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(svg)) return null;
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}
