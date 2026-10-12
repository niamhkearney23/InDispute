import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { brand } from '@/lib/brand';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

// Labels, numbers and dates in the navy look: the instrument-panel voice.
const code = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-code',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: brand.fullName,
    template: `%s · ${brand.fullName}`,
  },
  description:
    'Adaptive litigation training for law students and junior lawyers: PLT students in Australia, pupils and interns in Malaysia. Train like a lawyer.',
};

export const viewport: Viewport = {
  themeColor: '#fbf9f4',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Every page carries a script nonce minted for its own request (see
  // src/middleware.ts), and a page built once ahead of time has no request to
  // take one from: its scripts would be refused. Waiting on the connection
  // here makes every page under this layout render per request, including the
  // few that read no cookies of their own, like the not-found page.
  await connection();
  return (
    <html lang="en-AU" className={`${display.variable} ${body.variable} ${code.variable}`}>
      <body
        // A firm's accent replaces the navy everywhere it is used, rather
        // than in the one button somebody remembered. The value is hex-checked
        // in lib/brand before it reaches a style attribute.
        style={
          brand.accent
            ? ({ '--color-accent': brand.accent } as React.CSSProperties)
            : undefined
        }
      >
        {children}
      </body>
    </html>
  );
}
