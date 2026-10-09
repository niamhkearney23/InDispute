'use client';

import { ErrorView } from '@/components/error-view';

/**
 * A page in the academy that failed. Inside the academy's own layout, so the
 * menu is still there and the page is navy like the rest.
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorView error={error} retry={retry} home={{ href: '/dashboard', label: 'Go to today' }} />;
}
