import type { MetadataRoute } from 'next';
import { DEFAULT_ACCENT, brand } from '@/lib/brand';

/**
 * What lets the site be put on a home screen and open like an app: a name, a
 * start page, no browser bar, and icons drawn from the brand (so a firm's own
 * deployment gets its own letter and colour, as the tab icon does).
 */
export default function manifest(): MetadataRoute.Manifest {
  const accent = brand.accent ?? DEFAULT_ACCENT;
  return {
    name: brand.fullName,
    short_name: brand.name,
    description: brand.tagline,
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#f5f3ee',
    theme_color: accent,
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
