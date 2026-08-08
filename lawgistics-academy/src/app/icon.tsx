import { DEFAULT_ACCENT, brand } from '@/lib/brand';

/**
 * The tab icon, drawn from the brand rather than checked in as a file.
 *
 * A static icon.svg meant a firm running their own deployment got somebody
 * else's letter and somebody else's burgundy in the browser tab, which is the
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
  const accent = brand.accent ?? DEFAULT_ACCENT;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="${brand.initial}">
  <rect width="32" height="32" rx="6" fill="${accent}" />
  <text x="16" y="16" fill="#f7f4ee" font-family="Georgia, 'Times New Roman', serif" font-size="20" font-weight="600" text-anchor="middle" dominant-baseline="central">${brand.initial}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
