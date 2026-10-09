'use client';

import { ErrorView } from '@/components/error-view';

/**
 * A staff page that failed. Staff get the same plain words as learners: the
 * detail is in the server log under the reference, not on the page.
 */
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  // Not /admin: that page is an administrator's, and sends a coach away.
  return <ErrorView error={error} retry={retry} home={{ href: '/dashboard', label: 'Go to today' }} />;
}
