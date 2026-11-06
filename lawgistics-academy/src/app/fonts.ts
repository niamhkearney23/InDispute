import { Libre_Caslon_Display } from 'next/font/google';

/**
 * The greeting on the dark pages (sign-in and the first visit): a display
 * Caslon, the face of a law report's title page. Loaded by the two layouts
 * that draw those pages, so the rest of the academy never fetches it.
 */
export const hello = Libre_Caslon_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-auth-display',
  display: 'swap',
});
