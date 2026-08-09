'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { join } from './actions';

export function JoinForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState(join, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Your email
        </label>
        {/* Shown but not editable, and not submitted: the address comes from the
            invitation. A field somebody could change here would let whoever
            held the link decide who they were joining as. */}
        <input
          id="email"
          type="email"
          value={email}
          readOnly
          disabled
          className="h-12 w-full rounded-[5px] border border-rule bg-paper-sunk px-3 text-base text-slate"
        />
        <p className="mt-1 text-xs text-muted">
          This is the address the firm invited. Tell them if it is wrong.
        </p>
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Choose a password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className="h-12 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy"
        />
        <p className="mt-1 text-xs text-muted">At least 10 characters.</p>
      </div>

      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}

      <Button type="submit" size="lg" variant="accent" disabled={pending}>
        {pending ? 'Setting up your account…' : 'Create my account'}
      </Button>
    </form>
  );
}
