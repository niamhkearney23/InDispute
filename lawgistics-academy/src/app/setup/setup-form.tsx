'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Notice } from '@/components/ui';
import { completeSetup } from './actions';

export function SetupForm({ tokenRequired }: { tokenRequired: boolean }) {
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
            Loads 78 questions, 50 daily facts and the concept and skill map, then grants
            this account administrator rights. Safe to run more than once.
          </p>
        </div>

        {tokenRequired ? (
          <div>
            <label htmlFor="token" className="mb-1.5 block text-sm font-medium">
              Setup token
            </label>
            <input
              id="token"
              name="token"
              type="password"
              required
              className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3.5 text-base outline-none focus:border-burgundy"
            />
            <p className="mt-1 text-xs text-muted">
              The value of your SETUP_TOKEN environment variable.
            </p>
          </div>
        ) : null}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="publish"
            value="no"
            className="mt-1 size-5 shrink-0 accent-[#6b1f2a]"
          />
          <span>
            Hold everything back until I have verified it.
            <span className="mt-0.5 block text-xs text-muted">
              Stricter, and safer. Training sessions stay empty until you publish from the
              verification queue. Leave unticked to have a working app immediately, with
              every item still marked as needing review.
            </span>
          </span>
        </label>

        {error ? <Notice tone="error">{error}</Notice> : null}

        <Button type="submit" size="lg" variant="accent" disabled={pending}>
          {pending ? 'Setting up…' : 'Set it up'}
        </Button>
      </form>
    </Card>
  );
}
