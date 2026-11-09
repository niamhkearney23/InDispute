import { markSvg } from '@/lib/brand-mark';

/**
 * The tab icon, drawn from the brand rather than checked in as a file.
 *
 * A static icon.svg meant a firm running their own deployment got somebody
 * else's letter and somebody else's colour in the browser tab, which is the
 * one piece of branding a person looks at all day.
 *
 * This returns an SVG Response, which the icon convention accepts, so there is
 * no image renderer and no font to load at build time. The two values that
 * reach the markup are checked in lib/brand: the accent is hex or nothing, and
 * the initial is one letter or digit.
 */
export const size = { width: 32, height: 32 };
export const contentType = 'image/svg+xml';

export default function Icon() {
  const svg = markSvg();

  return new Response(svg, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
