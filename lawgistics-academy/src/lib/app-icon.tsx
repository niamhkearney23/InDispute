import { ImageResponse } from 'next/og';
import { DEFAULT_ACCENT, brand } from '@/lib/brand';

/**
 * The home-screen icon: the firm's initial on the firm's accent, the same
 * as the tab icon (`app/icon.tsx`) but as a PNG, because a phone will not
 * put an SVG on its home screen.
 *
 * `inset` is how far in the letter sits. A plain icon fills the square; a
 * "maskable" one is cropped by the phone into a circle or a squircle, so its
 * letter has to stay inside the middle four fifths to survive.
 */
export function appIcon(size: number, inset: 'plain' | 'maskable' = 'plain'): ImageResponse {
  const accent = brand.accent ?? DEFAULT_ACCENT;
  const fontSize = Math.round(size * (inset === 'maskable' ? 0.42 : 0.56));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: accent,
          color: '#f7f4ee',
          fontSize,
          fontWeight: 600,
        }}
      >
        {brand.initial}
      </div>
    ),
    { width: size, height: size },
  );
}
