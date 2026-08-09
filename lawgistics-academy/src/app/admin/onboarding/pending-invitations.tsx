'use client';

import { useActionState } from 'react';
import { Button, Card, Notice, Pill } from '@/components/ui';
import type { AdminState } from '../actions';
import { revoke } from './actions';

export interface PendingRow {
  id: string;
  email: string;
  displayName: string;
  startsOn: string | null;
  invitedByName: string | null;
  invitedOn: string;
  expiresOn: string;
  daysLeft: number;
}

/**
 * Invitations that are out but not taken up.
 *
 * Worth its own section rather than a line on the roster, because somebody who
 * has not made an account yet is not on the roster at all. Without this they
 * are invisible: the firm believes it has invited them, and nothing anywhere
 * says otherwise until their first morning.
 */
export function PendingInvitations({ rows }: { rows: PendingRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1.5">Sent, not taken up</p>
          <h2 className="text-xl sm:text-2xl">
            {rows.length === 1 ? '1 invitation is out' : `${rows.length} invitations are out`}
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <InvitationCard key={row.id} row={row} />
        ))}
      </div>
    </section>
  );
}

function InvitationCard({ row }: { row: PendingRow }) {
  const [state, formAction, pending] = useActionState(revoke, { error: null } as AdminState);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg">{row.displayName || row.email}</h3>
            {row.daysLeft <= 0 ? (
              <Pill tone="wrong">Expired</Pill>
            ) : row.daysLeft <= 3 ? (
              <Pill tone="warn">{row.daysLeft} days left</Pill>
            ) : (
              <Pill>Not taken up</Pill>
            )}
          </div>
          {row.displayName ? <p className="mt-1 text-sm text-slate">{row.email}</p> : null}
          <p className="mt-2 text-xs text-muted">
            Invited {row.invitedOn}
            {row.invitedByName ? ` by ${row.invitedByName}` : ''}
            {row.startsOn ? ` · begins ${row.startsOn}` : ' · no start date'}
            {' · '}link expires {row.expiresOn}
          </p>
        </div>

        <form action={formAction} className="shrink-0">
          <input type="hidden" name="invitationId" value={row.id} />
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? 'Calling back…' : 'Call it back'}
          </Button>
        </form>
      </div>

      {state.error ? (
        <div className="mt-3">
          <Notice tone="warn">{state.error}</Notice>
        </div>
      ) : null}
    </Card>
  );
}
