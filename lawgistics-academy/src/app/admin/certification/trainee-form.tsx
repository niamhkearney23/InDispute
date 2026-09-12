'use client';

import { useActionState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import type { AdminState } from '../actions';

export interface TraineeFormValues {
  id?: string;
  fullName: string;
  firmName: string;
  notes: string;
}

export function TraineeForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  initial: TraineeFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="space-y-5">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Card>
        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              defaultValue={initial.fullName}
              required
              maxLength={200}
              className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
            />
          </div>

          <div>
            <label htmlFor="firmName" className="mb-1.5 block text-sm font-medium">
              Firm
            </label>
            <input
              id="firmName"
              name="firmName"
              defaultValue={initial.firmName}
              required
              maxLength={200}
              className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
            />
          </div>

          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={initial.notes}
              rows={3}
              maxLength={2000}
              className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2.5 text-base outline-none focus:border-burgundy"
            />
          </div>
        </div>
      </Card>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
