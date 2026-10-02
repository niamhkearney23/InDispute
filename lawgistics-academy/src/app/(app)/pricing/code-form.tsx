'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { redeemCode, type CodeState } from './actions';

/** The box for a code from a firm or university. */
export function CodeForm() {
  const [state, action, pending] = useActionState<CodeState, FormData>(redeemCode, { error: null });
  return (
    <form action={action} className="space-y-3">
      <label htmlFor="code" className="block text-sm font-semibold">
        Code from your firm or university
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="code"
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="e.g. FIRM-2026"
          className="h-11 w-full rounded-md border-2 border-rule bg-paper-raised px-3 text-base uppercase outline-none placeholder:normal-case placeholder:text-muted/70 focus:border-accent sm:max-w-xs"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Checking…' : 'Use code'}
        </Button>
      </div>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
    </form>
  );
}
