'use client';

import './globals.css';
import { ErrorView } from '@/components/error-view';

/**
 * The last resort: the root layout itself failed, or a layout under it with
 * no error page of its own (the academy's and admin's layouts both read the
 * session first, so a database that cannot be reached ends up here). It
 * replaces the whole document, so it brings its own html, body and styles,
 * in the cream look, because nothing has said which look this person is in.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en-AU">
      <body className="min-h-dvh bg-paper px-4 py-10 text-ink sm:px-8">
        <title>Something went wrong</title>
        <ErrorView error={error} retry={retry} home={{ href: '/', label: 'Go to the front page' }} />
      </body>
    </html>
  );
}
