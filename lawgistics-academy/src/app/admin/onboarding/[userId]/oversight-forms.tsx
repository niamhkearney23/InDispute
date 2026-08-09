'use client';

import { useActionState, useState } from 'react';
import { Button, Notice } from '@/components/ui';
import type { AdminState } from '../../actions';
import { confirm, decide, setStartDate } from '../actions';

/** Confirming one item for one person. */
export function ConfirmButton({
  userId,
  stepId,
  label,
}: {
  userId: string;
  stepId: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(confirm, { error: null } as AdminState);

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="stepId" value={stepId} />
      <Button type="submit" variant="accent" size="sm" disabled={pending}>
        {pending ? 'Recording…' : label}
      </Button>
      {state.error ? (
        <div className="mt-2">
          <Notice tone="warn">{state.error}</Notice>
        </div>
      ) : null}
    </form>
  );
}

export function StartDateForm({
  userId,
  startsOn,
}: {
  userId: string;
  startsOn: string | null;
}) {
  const [state, formAction, pending] = useActionState(setStartDate, { error: null } as AdminState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label htmlFor="startsOn" className="mb-1.5 block text-sm font-medium">
          Begins on
        </label>
        <input
          id="startsOn"
          name="startsOn"
          type="date"
          defaultValue={startsOn ?? ''}
          className="h-11 rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy"
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}
      {state.ok ? <p className="text-sm text-slate">{state.ok}</p> : null}
    </form>
  );
}

/**
 * The decision.
 *
 * The count of what is outstanding is shown here and recorded by the server
 * independently, so this warning is a courtesy and not the control. Clearing
 * somebody with work outstanding is allowed on purpose, because firms have real
 * exceptions and a system that forbids them gets worked around outside the
 * system. What is not allowed is for it to look afterwards like there was
 * nothing outstanding.
 */
export function DecisionForm({
  userId,
  cleared,
  outstandingCount,
  supervisorName,
}: {
  userId: string;
  cleared: boolean;
  outstandingCount: number;
  supervisorName: string;
}) {
  const [state, formAction, pending] = useActionState(decide, { error: null } as AdminState);
  const [acknowledged, setAcknowledged] = useState(false);

  const clearingEarly = !cleared && outstandingCount > 0;
  const blocked = clearingEarly && !acknowledged;

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="decision" value={cleared ? 'withdrawn' : 'cleared'} />

      <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
        Note {cleared ? '' : '(optional)'}
      </label>
      <textarea
        id="note"
        name="note"
        rows={3}
        maxLength={500}
        placeholder={
          cleared
            ? 'Why the clearance is being withdrawn.'
            : clearingEarly
              ? 'Worth saying why, since something is still outstanding.'
              : 'Anything worth recording alongside this.'
        }
        className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2 text-base leading-relaxed outline-none focus:border-burgundy"
      />

      {clearingEarly ? (
        <label className="mt-4 flex items-start gap-3 text-[0.9375rem] leading-relaxed">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-0.5 size-8 shrink-0 rounded-[4px] border-rule-strong accent-burgundy"
          />
          <span>
            I am clearing this person with {outstandingCount}{' '}
            {outstandingCount === 1 ? 'item' : 'items'} still outstanding, and I understand
            that is recorded against my name.
          </span>
        </label>
      ) : null}

      <div className="mt-5">
        <Button
          type="submit"
          size="lg"
          variant={cleared ? 'outline' : 'accent'}
          disabled={blocked || pending}
        >
          {pending
            ? 'Recording…'
            : cleared
              ? 'Withdraw this clearance'
              : 'Clear them to begin'}
        </Button>
      </div>

      <p className="mt-4 border-t border-rule pt-4 text-sm text-slate">
        This records {supervisorName} and today’s date, and how many items were outstanding
        when you pressed it. It cannot be edited or removed afterwards; a decision made in
        error is undone by withdrawing it, which is recorded in the same way.
      </p>

      {state.error ? (
        <div className="mt-4">
          <Notice tone="warn">{state.error}</Notice>
        </div>
      ) : null}
    </form>
  );
}
