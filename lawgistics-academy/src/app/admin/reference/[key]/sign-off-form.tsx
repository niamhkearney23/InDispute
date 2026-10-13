'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { signOffReference, type ReferenceSignOffState } from '../actions';

export function ReferenceSignOffForm({
  itemKey,
  hash,
  confirmText,
}: {
  itemKey: string;
  hash: string;
  confirmText: string;
}) {
  const [state, action, pending] = useActionState<ReferenceSignOffState, FormData>(
    signOffReference,
    { error: null },
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="key" value={itemKey} />
      <input type="hidden" name="hash" value={hash} />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="confirm" value="yes" required className="mt-1 accent-accent" />
        <span>{confirmText}</span>
      </label>
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Saving…' : 'Sign it off'}
      </Button>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
    </form>
  );
}
