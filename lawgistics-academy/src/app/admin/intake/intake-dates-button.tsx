'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import type { AdminState } from '../actions';
import { setIntakeDates } from '../onboarding/actions';
import { PROGRAMME } from '@/content/programme';

export function IntakeDatesButton({ label }: { label: string }) {
  const [state, formAction, pending] = useActionState(setIntakeDates, {
    error: null,
  } as AdminState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="intake" value={PROGRAMME.intakeStartsOn} />
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Saving…' : label}
      </Button>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
    </form>
  );
}
