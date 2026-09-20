'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { declareHomework } from './actions';

/** Ticking off a day's homework. No ceremony: this is a reading task, not a
 *  signed document, and a checkbox in front of it would teach the same lesson
 *  the onboarding checklist deliberately avoids for everything but a signature. */
export function HomeworkForm({ day }: { day: number }) {
  const [state, formAction, pending] = useActionState(declareHomework, { error: null });

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="day" value={day} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? 'Recording…' : 'I have done this'}
      </Button>
      {state.error ? (
        <div className="mt-3">
          <Notice tone="warn">{state.error}</Notice>
        </div>
      ) : null}
    </form>
  );
}
