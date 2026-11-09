import { DEFAULT_ACCENT, brand } from '@/lib/brand';

const CREAM = '#f7f4ee';
const GOLD = '#c9a24b';

/**
 * The mark drawn for the icon: a pair of scales, cream on the brand's navy
 * with a gold accent. A deployment that sets its own accent colour is another
 * firm's, so it keeps its own letter instead of ours. Both values that reach
 * the markup are checked in lib/brand (hex or nothing; one letter or digit).
 */
export function markSvg(rounded = true): string {
  const accent = brand.accent ?? DEFAULT_ACCENT;
  const inner = brand.accent
    ? `<text x="50" y="50" fill="${CREAM}" font-family="Georgia, 'Times New Roman', serif" font-size="62" font-weight="600" text-anchor="middle" dominant-baseline="central">${brand.initial}</text>`
    : `<g fill="none" stroke="${CREAM}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M50 27 V70" />
    <path d="M27 36 H73" />
    <path d="M27 36 L17 57 M27 36 L37 57" stroke-width="2.4" />
    <path d="M73 36 L63 57 M73 36 L83 57" stroke-width="2.4" />
    <path d="M36 74 H64" />
  </g>
  <path d="M15 57 H39 Q27 71 15 57 Z" fill="${GOLD}" />
  <path d="M61 57 H85 Q73 71 61 57 Z" fill="${GOLD}" />
  <circle cx="50" cy="23" r="4.5" fill="${GOLD}" />`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="${rounded ? 22 : 0}" fill="${accent}" />${inner}</svg>`;
}

export const markDataUri = () => `data:image/svg+xml;base64,${Buffer.from(markSvg(false)).toString('base64')}`;
