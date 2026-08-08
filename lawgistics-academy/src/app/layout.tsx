import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
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

export const metadata: Metadata = {
  title: {
    default: brand.fullName,
    template: `%s · ${brand.fullName}`,
  },
  description:
    'Adaptive litigation training for Australian law students, PLT students, graduates and junior lawyers. Train like a lawyer.',
};

export const viewport: Viewport = {
  themeColor: '#fbf9f4',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${display.variable} ${body.variable}`}>
      <body
        // A firm's accent replaces the burgundy everywhere it is used, rather
        // than in the one button somebody remembered. The value is hex-checked
        // in lib/brand before it reaches a style attribute.
        style={
          brand.accent
            ? ({ '--color-burgundy': brand.accent } as React.CSSProperties)
            : undefined
        }
      >
        {children}
      </body>
    </html>
  );
}
