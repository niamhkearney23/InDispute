'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import type { AdminState } from '../actions';
import { decideAccess, saveAccessCode, setAccessCodeActive } from './actions';

export interface WaitingRow {
  userId: string;
  name: string;
  email: string | null;
  label: string;
  requestedOn: string;
}

/** One person waiting, with Confirm and Not with us. */
export function WaitingRowForm({ row }: { row: WaitingRow }) {
  const [state, formAction, pending] = useActionState(decideAccess, { error: null } as AdminState);
  if (state.ok) {
    return (
      <li className="py-3 text-sm text-slate">
        <strong className="font-medium text-ink">{row.name}</strong>: {state.ok}
      </li>
    );
  }
  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium break-words">{row.name}</p>
        <p className="text-sm break-words text-slate">
          <span className="break-all">{row.email ?? 'No email'}</span> · says they are with{' '}
          <strong className="font-medium">{row.label}</strong> · {row.requestedOn}
        </p>
        {state.error ? (
          <div className="mt-2">
            <Notice tone="warn">{state.error}</Notice>
          </div>
        ) : null}
      </div>
      <form action={formAction} className="flex shrink-0 gap-2">
        <input type="hidden" name="userId" value={row.userId} />
        <Button
          type="submit"
          name="decision"
          value="confirmed"
          variant="accent"
          size="sm"
          disabled={pending}
        >
          Confirm
        </Button>
        <Button
          type="submit"
          name="decision"
          value="declined"
          variant="outline"
          size="sm"
          disabled={pending}
        >
          Not with us
        </Button>
      </form>
    </li>
  );
}

/** Making a new code. */
export function NewCodeForm() {
  const [state, formAction, pending] = useActionState(saveAccessCode, {
    error: null,
  } as AdminState);
  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="label" className="mb-1 block text-sm font-semibold">
            Who it is for
          </label>
          <input
            id="label"
            name="label"
            required
            maxLength={120}
            placeholder="Thomas Philip"
            className="h-11 w-full rounded-md border-2 border-rule bg-paper-raised px-3 outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-semibold">
            The code they type
          </label>
          <input
            id="code"
            name="code"
            required
            maxLength={40}
            autoComplete="off"
            placeholder="TP-2026"
            className="h-11 w-full rounded-md border-2 border-rule bg-paper-raised px-3 uppercase outline-none placeholder:normal-case focus:border-accent"
          />
        </div>
      </div>
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Saving…' : 'Make the code'}
      </Button>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
    </form>
  );
}

/** The on/off switch for a code. */
export function CodeSwitch({ id, active }: { id: string; active: boolean }) {
  const [state, formAction, pending] = useActionState(setAccessCodeActive, {
    error: null,
  } as AdminState);
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? 'false' : 'true'} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {active ? 'Switch off' : 'Switch on'}
      </Button>
      {state.error ? <p className="mt-1 text-xs text-verdict-wrong">{state.error}</p> : null}
    </form>
  );
}
