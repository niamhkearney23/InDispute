'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import type { AdminState } from '../actions';
import { linkCertificationTrainee } from './actions';

/**
 * An administrator linking this register record to the trainee's own
 * account (0045), so that deleting the account puts the record up for
 * review. Leave the address empty to unlink.
 */
export function LinkForm({ traineeId, linkedEmail }: { traineeId: string; linkedEmail: string | null }) {
  const [state, action, pending] = useActionState(linkCertificationTrainee, {
    error: null,
  } as AdminState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="traineeId" value={traineeId} />
      <p className="text-sm text-slate">
        {linkedEmail
          ? `Linked to the account signed in as ${linkedEmail}.`
          : 'Not linked to an account. If this trainee uses the academy, link their account so that, if it is ever deleted, this record comes up for review.'}
      </p>
      <div>
        <label htmlFor={`link-${traineeId}`} className="mb-1.5 block text-sm font-medium">
          Their sign-in address (leave empty to unlink)
        </label>
        <input
          id={`link-${traineeId}`}
          name="email"
          type="email"
          autoComplete="off"
          maxLength={320}
          className="h-11 w-full max-w-md rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-accent sm:h-10"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? 'Saving…' : 'Save the link'}
      </Button>
      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="neutral">{state.ok}</Notice> : null}
    </form>
  );
}
