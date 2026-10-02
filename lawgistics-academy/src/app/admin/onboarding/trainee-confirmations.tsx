'use client';

import { useActionState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import type { AdminState } from '../actions';
import { confirmTrainee } from './actions';

export interface PendingTraineeRow {
  id: string;
  name: string;
  email: string | null;
  joinedOn: string | null;
}

/**
 * People who signed themselves up as trainees, waiting for somebody at the
 * firm to say whether they are. Until then the work posted for trainees stays
 * out of their sight; the rest of the app works for them as normal.
 */
export function TraineeConfirmations({ rows }: { rows: PendingTraineeRow[] }) {
  if (rows.length === 0) return null;
  return (
    <Card className="border-accent/30">
      <h2 className="text-lg">
        {rows.length === 1
          ? '1 person says they are a trainee'
          : `${rows.length} people say they are trainees`}
      </h2>
      <p className="mt-1 text-sm text-slate">
        They signed themselves up on the trainee page. Confirm the ones you know are on the
        programme; until you do, they cannot see the work posted for trainees. &ldquo;Not a
        trainee&rdquo; keeps their account and moves them to ordinary training.
      </p>
      <ul className="mt-4 divide-y divide-rule">
        {rows.map((row) => (
          <Row key={row.id} row={row} />
        ))}
      </ul>
    </Card>
  );
}

function Row({ row }: { row: PendingTraineeRow }) {
  const [state, formAction, pending] = useActionState(confirmTrainee, {
    error: null,
  } as AdminState);

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
        <p className="text-sm break-all text-slate">
          {row.email ?? 'No email'}
          {row.joinedOn ? ` · joined ${row.joinedOn}` : ''}
        </p>
        {state.error ? (
          <div className="mt-2">
            <Notice tone="warn">{state.error}</Notice>
          </div>
        ) : null}
      </div>
      <form action={formAction} className="flex shrink-0 gap-2">
        <input type="hidden" name="userId" value={row.id} />
        <Button type="submit" name="decision" value="confirm" variant="accent" size="sm" disabled={pending}>
          Confirm
        </Button>
        <Button type="submit" name="decision" value="decline" variant="outline" size="sm" disabled={pending}>
          Not a trainee
        </Button>
      </form>
    </li>
  );
}
