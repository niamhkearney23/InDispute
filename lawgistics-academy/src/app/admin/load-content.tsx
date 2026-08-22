'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Notice } from '@/components/ui';
import { loadNewContent } from './actions';

/**
 * Shown only when the deployment carries questions the database has not got.
 *
 * The count comes from the server rather than from the copy, because a number
 * typed into a sentence is stale the next time somebody writes a question, and
 * this button is the last place to be approximately right about what it is
 * about to do to a database.
 */
export function LoadContent({ missing }: { missing: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  function onClick() {
    setResult(null);
    startTransition(async () => {
      const outcome = await loadNewContent();
      setResult(
        outcome.ok ? { ok: true, text: outcome.message } : { ok: false, text: outcome.error },
      );
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <Card>
      <h2 className="text-lg">
        {missing} question{missing === 1 ? '' : 's'} in this release are not in the database
      </h2>
      <p className="mt-1 text-sm text-slate">
        Content is loaded once at first run, so anything written since then is sitting in
        the deployment unused. Loading it again brings those across. A question already
        here is left exactly as it is, sign-off included. One whose wording has changed
        gets a new version, and the old version is kept because past attempts point at
        what the learner actually saw. Nothing is published into training that a person
        has not verified.
      </p>

      {result ? (
        <div className="mt-4">
          <Notice tone={result.ok ? 'good' : 'warn'}>{result.text}</Notice>
        </div>
      ) : null}

      <div className="mt-4">
        <Button onClick={onClick} disabled={pending} variant="accent">
          {pending ? 'Loading' : 'Load the missing content'}
        </Button>
      </div>
    </Card>
  );
}
