'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import { NOTE_MAX_LENGTH } from '@/lib/notes/rules';
import type { AdminState } from '../actions';

export interface NoteFormValues {
  id?: string;
  body: string;
  forDate: string;
  country: 'ALL' | 'AU' | 'MY';
  traineesOnly: boolean;
}

/** Writing or correcting a morning note. */
export function NoteForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  initial: NoteFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [body, setBody] = useState(initial.body);
  const field =
    'w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-accent';

  return (
    <form action={formAction}>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <Card>
        <div className="space-y-4">
          <div>
            <label htmlFor="body" className="mb-1.5 block text-sm font-medium">
              Your note
            </label>
            <textarea
              id="body"
              name="body"
              rows={4}
              required
              maxLength={NOTE_MAX_LENGTH}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Morning all. Round 2 before nine, then the list of authorities by five. I will look at the citations first."
              className={`${field} py-2.5`}
            />
            <p className="mt-1 text-xs text-muted">
              A few lines, in your own words. It goes out under your name, at the top of Today.
              No client names. {body.trim().length} of {NOTE_MAX_LENGTH}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="forDate" className="mb-1.5 block text-sm font-medium">
                The morning it is for
              </label>
              <input
                id="forDate"
                name="forDate"
                type="date"
                required
                defaultValue={initial.forDate}
                className={`${field} h-11 sm:h-10`}
              />
            </div>
            <div>
              <label htmlFor="country" className="mb-1.5 block text-sm font-medium">
                Who it is for
              </label>
              <select
                id="country"
                name="country"
                defaultValue={initial.country}
                className={`${field} h-11 sm:h-10`}
              >
                <option value="ALL">Everyone, both countries</option>
                <option value="MY">Malaysia</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>

          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="traineesOnly" defaultChecked={initial.traineesOnly} className="size-4" />
            Only confirmed trainees
          </label>

          {state.error ? <Notice tone="warn">{state.error}</Notice> : null}
          {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}

          <Button type="submit" variant="accent" disabled={pending}>
            {pending ? 'Saving' : submitLabel}
          </Button>
        </div>
      </Card>
    </form>
  );
}
