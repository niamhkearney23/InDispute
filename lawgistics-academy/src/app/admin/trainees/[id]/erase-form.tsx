'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { CONFIRM_WORD } from '@/lib/account/erasure-rules';
import { eraseLearner, type EraseState } from '../actions';

const INPUT =
  'h-11 w-full max-w-xs rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-accent sm:h-10';

/** An administrator deleting a learner's account, behind the same typed word. */
export function EraseForm({ learnerId, erased }: { learnerId: string; erased: boolean }) {
  const [state, formAction, pending] = useActionState(eraseLearner, { error: null } as EraseState);

  return (
    <details>
      <summary className="inline-flex cursor-pointer items-center rounded-[5px] py-2 text-sm font-medium text-warn underline underline-offset-4">
        {erased ? 'Finish deleting this account' : 'Delete this account'}
      </summary>
      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="learnerId" value={learnerId} />
        <div>
          <label htmlFor="confirmWord" className="mb-1.5 block text-sm font-medium">
            Type {CONFIRM_WORD} in capitals
          </label>
          <input
            id="confirmWord"
            name="confirmWord"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
            className={INPUT}
          />
        </div>
        {state.error ? <Notice tone="warn">{state.error}</Notice> : null}
        {state.ok ? <Notice tone="neutral">{state.ok}</Notice> : null}
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Deleting…' : 'Delete for good'}
        </Button>
      </form>
    </details>
  );
}
