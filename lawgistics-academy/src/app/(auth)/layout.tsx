import type { Viewport } from 'next';
import { hello } from '../fonts';

// The sign-in pages are dark, so the browser's own bar is too.
export const viewport: Viewport = { themeColor: '#0c1520' };

/** The sign-in pages, with the greeting's typeface (src/app/fonts.ts). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={hello.variable}>{children}</div>;
}
