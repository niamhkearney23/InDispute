'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Notice } from '@/components/ui';
import { completeSetup } from './actions';

/**
 * The counts are passed in rather than written into the copy. The old numbers
 * were stale within a week of being typed, and a page that misdescribes what it
 * is about to do to somebody's database is the last place to be approximately
 * right.
 */
export function SetupForm({
  questionCount,
  factCount,
}: {
  questionCount: number;
  factCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await completeSetup(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(result.message);
      router.refresh();
    });
  }

  if (done) {
    return <Notice tone="neutral">{done}</Notice>;
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <h2 className="text-lg">Load the content and make me an administrator</h2>
          <p className="mt-1 text-sm text-slate">
            Loads {questionCount} questions, {factCount} daily facts, the modules and
            lessons, and the concept and skill map, then grants this account administrator
            rights. Safe to run more than once.
          </p>
        </div>

        <div>
          <label htmlFor="token" className="mb-1.5 block text-sm font-medium">
            Setup token
          </label>
          <input
            id="token"
            name="token"
            type="password"
            required
            className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3.5 text-base outline-none focus:border-accent"
          />
          <p className="mt-1 text-xs text-muted">
            The value of your SETUP_TOKEN environment variable.
          </p>
        </div>

        <p className="text-sm text-muted">
          The questions and daily facts load waiting for a lawyer to check them. Learners see
          nothing until each item is signed off and published from the review page.
        </p>

        {error ? <Notice tone="error">{error}</Notice> : null}

        <Button type="submit" size="lg" variant="accent" disabled={pending}>
          {pending ? 'Setting up…' : 'Set it up'}
        </Button>
      </form>
    </Card>
  );
}
