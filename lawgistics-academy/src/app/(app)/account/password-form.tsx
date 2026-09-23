'use client';

import { useActionState } from 'react';
import { Button, Card, Notice, Wordmark } from '@/components/ui';
import { changePassword } from './actions';

const INPUT =
  'h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10';

/** The two boxes and the button, on their own. */
export function PasswordForm({ submitLabel }: { submitLabel: string }) {
  const [state, formAction, pending] = useActionState(changePassword, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={INPUT}
        />
        <p className="mt-1 text-xs text-muted">At least eight characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium">
          The same again
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={INPUT}
        />
      </div>

      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}

/**
 * The first thing an account made by an administrator sees. Drawn by the
 * app layout in place of whatever page was asked for, until a password of
 * the person's own has been chosen.
 */
export function FirstPassword() {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <Wordmark />
      </div>
      <Card className="shadow-raised">
        <p className="eyebrow mb-2">Before you begin</p>
        <h1 className="text-2xl">Choose your own password</h1>
        <p className="mt-2 mb-5 text-sm text-slate">
          The password you signed in with was set for you by whoever made your account, so
          they have seen it. Choose one now that only you know. The old one stops working
          the moment you save.
        </p>
        <PasswordForm submitLabel="Save and continue" />
      </Card>
    </div>
  );
}
