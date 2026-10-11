import { appIcon } from '@/lib/app-icon';

/**
 * The icon an iPhone puts on the home screen when somebody chooses "Add to
 * Home Screen". iOS rounds the corners itself, so this fills the square.
 */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return appIcon(180);
}
