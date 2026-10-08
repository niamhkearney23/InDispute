'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import type { AdminState } from '../actions';
import { setStaffRole } from './actions';

/** Giving an existing account a staff role, or taking it away. */
export function StaffRoleForm() {
  const [state, formAction, pending] = useActionState(setStaffRole, {
    error: null,
  } as AdminState);
  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold">
            Their email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="off"
            className="h-11 w-full rounded-md border-2 border-rule bg-paper-raised px-3 outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="role" className="mb-1 block text-sm font-semibold">
            Role
          </label>
          <select
            id="role"
            name="role"
            className="h-11 w-full rounded-md border-2 border-rule bg-paper-raised px-3 outline-none focus:border-accent"
          >
            <option value="firm_admin">Firm administrator</option>
            <option value="coach">Coach (a lawyer who signs off and supervises)</option>
          </select>
        </div>
      </div>
      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="on" value="on" variant="accent" disabled={pending}>
          Give them the role
        </Button>
        <Button type="submit" name="on" value="off" variant="outline" disabled={pending}>
          Take it away
        </Button>
      </div>
    </form>
  );
}
