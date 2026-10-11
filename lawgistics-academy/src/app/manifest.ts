import type { MetadataRoute } from 'next';
import { brand } from '@/lib/brand';

/**
 * What a phone needs to put the academy on its home screen as an app: its
 * name, where it opens, and its icons. Served at /manifest.webmanifest and
 * linked from every page by Next itself.
 *
 * It opens on Today, signed in, in its own window without the browser's
 * address bar. Everything in it is the brand, which is the firm's per
 * deployment, so another firm's copy installs under its own name and colour.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: brand.fullName,
    short_name: brand.name.slice(0, 12),
    description: brand.tagline,
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#0d1b2a',
    theme_color: '#0d1b2a',
    icons: [
      { src: '/app-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/app-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/app-icon/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
