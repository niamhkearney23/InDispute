'use client';

import { useEffect } from 'react';
import { Button, ButtonLink, Card } from '@/components/ui';

/**
 * What a page shows when something on it failed. Plain words and a way to
 * try again, nothing more: the error's own message and stack are for whoever
 * reads the server logs, and in production Next replaces a server error's
 * message anyway. The reference is the digest, which matches the log line,
 * so somebody reporting it can give the one thing that finds it.
 *
 * Built from the tokens and the shared components, so it reads correctly in
 * the cream look and inside the navy one.
 */
export function ErrorView({
  error,
  retry,
  home,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  /** Where "Go back" leads: the learner's day, or the admin front page. */
  home: { href: string; label: string };
}) {
  useEffect(() => {
    // In the browser's console for whoever is debugging; never on the page.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-6">
      <Card>
        <p className="eyebrow mb-2">Something went wrong</p>
        <h1 className="text-2xl sm:text-3xl">This page could not be shown.</h1>
        <p className="mt-3 text-slate">
          Nothing you did caused this. Try again, and if it keeps happening, tell whoever runs
          the academy at your firm.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" variant="accent" onClick={() => retry()}>
            Try again
          </Button>
          <ButtonLink href={home.href} variant="outline">
            {home.label}
          </ButtonLink>
        </div>
        {error.digest ? (
          <p className="mt-5 text-xs text-muted">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
      </Card>
    </div>
  );
}
