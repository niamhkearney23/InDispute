'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import type { AdminState } from '../actions';
import { assignCohort, saveCohort } from './actions';
import { ROUND_HOUR_CHOICES, TIMEZONES, hourLabel } from '@/lib/training/schedule';

const field =
  'h-11 w-full rounded-md border-2 border-rule bg-paper-raised px-3 outline-none focus:border-accent';

export interface CohortValues {
  id?: string;
  name: string;
  startsOn: string;
  endsOn: string;
  timezone: string;
  roundHours: number[];
  holidays: string;
}

/** Making a cohort, or changing one. */
export function CohortForm({ values }: { values: CohortValues }) {
  const [state, formAction, pending] = useActionState(saveCohort, { error: null } as AdminState);
  return (
    <form action={formAction} className="space-y-5">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-semibold">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={values.name}
          placeholder="November 2026"
          className={field}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="startsOn" className="mb-1 block text-sm font-semibold">
            First day
          </label>
          <input id="startsOn" name="startsOn" type="date" required defaultValue={values.startsOn} className={field} />
        </div>
        <div>
          <label htmlFor="endsOn" className="mb-1 block text-sm font-semibold">
            Last day
          </label>
          <input id="endsOn" name="endsOn" type="date" required defaultValue={values.endsOn} className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="timezone" className="mb-1 block text-sm font-semibold">
          The rounds run on the clock in
        </label>
        <select id="timezone" name="timezone" defaultValue={values.timezone} className={field}>
          {TIMEZONES.map(([zone, city]) => (
            <option key={zone} value={zone}>
              {city}
            </option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Round times</legend>
        <p className="mb-2 text-sm text-slate">
          Each round is ten questions and open for its own hour. Choose one to eight.
        </p>
        <div className="flex flex-wrap gap-2">
          {ROUND_HOUR_CHOICES.map((h) => (
            <label
              key={h}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border-2 border-rule bg-paper-raised px-3 text-sm has-[:checked]:border-accent"
            >
              <input type="checkbox" name="roundHours" value={h} defaultChecked={values.roundHours.includes(h)} />
              {hourLabel(h)}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="holidays" className="mb-1 block text-sm font-semibold">
          Public holidays to skip
        </label>
        <p className="mb-2 text-sm text-slate">
          One a line, the date then the name, for example <span className="font-mono">2026-11-09 Deepavali</span>.
          Nothing runs on these days and the programme moves on to the next working day.
        </p>
        <textarea
          id="holidays"
          name="holidays"
          rows={5}
          defaultValue={values.holidays}
          className="w-full rounded-md border-2 border-rule bg-paper-raised px-3 py-2 font-mono text-sm outline-none focus:border-accent"
        />
      </div>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Saving…' : values.id ? 'Save the cohort' : 'Make the cohort'}
      </Button>
    </form>
  );
}

export interface PersonRow {
  id: string;
  name: string;
  email: string | null;
  note: string;
}

/** Putting people in, or taking them out. */
export function MembersForm({
  cohortId,
  rows,
  action,
  label,
  empty,
}: {
  cohortId: string;
  rows: PersonRow[];
  action: 'add' | 'remove';
  label: string;
  empty: string;
}) {
  const [state, formAction, pending] = useActionState(assignCohort, { error: null } as AdminState);
  if (rows.length === 0) return <p className="text-sm text-slate">{empty}</p>;
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="cohortId" value={cohortId} />
      <input type="hidden" name="action" value={action} />
      <ul className="divide-y divide-rule">
        {rows.map((r) => (
          <li key={r.id}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2.5">
              <input type="checkbox" name="userId" value={r.id} className="mt-1.5" />
              <span className="min-w-0">
                <span className="block font-medium break-words">{r.name}</span>
                <span className="block text-sm break-words text-slate">
                  <span className="break-all">{r.email ?? 'No email'}</span> · {r.note}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
      <Button type="submit" variant={action === 'add' ? 'accent' : 'outline'} disabled={pending}>
        {pending ? 'Saving…' : label}
      </Button>
    </form>
  );
}
