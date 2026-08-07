'use client';

import { useActionState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import { JURISDICTION_LABELS, type Jurisdiction } from '@/lib/types';
import type { AdminState } from '../actions';
import type { TaxonomyOption } from '../question-form';

export interface FactFormValues {
  factId?: string;
  slug: string;
  title: string;
  body: string;
  whyItMatters: string;
  jurisdiction: Jurisdiction;
  court: string;
  domainId: string;
  sourceReference: string;
  sourceUrl: string;
  sourceCheckedOn: string;
  sortOrder: number;
}

const JURISDICTIONS = Object.keys(JURISDICTION_LABELS) as Jurisdiction[];

export function FactForm({
  action,
  initial,
  domains,
  submitLabel,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  initial: FactFormValues;
  domains: TaxonomyOption[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="space-y-5">
      {initial.factId ? <input type="hidden" name="factId" value={initial.factId} /> : null}

      <Card>
        <h2 className="mb-1 text-lg">The fact</h2>
        <p className="mb-4 text-sm text-slate">
          The title is the hook — one sentence, stated as a proposition. The body explains
          it in two to four sentences.
        </p>

        <div className="space-y-4">
          <Text label="Slug" name="slug" defaultValue={initial.slug} required />
          <Text label="Title" name="title" defaultValue={initial.title} required />
          <TextArea label="Body" name="body" defaultValue={initial.body} rows={5} required />
          <TextArea
            label="Why this matters in practice (optional)"
            name="whyItMatters"
            defaultValue={initial.whyItMatters}
            rows={3}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg">Classification and source</h2>
        <p className="mb-4 text-sm text-slate">
          A fact without a checkable source cannot be verified. If a rule belongs to one
          jurisdiction, say so — never leave it as a general principle to be safe.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Jurisdiction"
            name="jurisdiction"
            defaultValue={initial.jurisdiction}
            required
          >
            {JURISDICTIONS.map((value) => (
              <option key={value} value={value}>
                {JURISDICTION_LABELS[value]}
              </option>
            ))}
          </Select>
          <Text label="Court (optional)" name="court" defaultValue={initial.court} />
          <Select label="Area (optional)" name="domainId" defaultValue={initial.domainId}>
            <option value="">—</option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </Select>
          <Text
            label="Rotation order"
            name="sortOrder"
            type="number"
            defaultValue={String(initial.sortOrder)}
            hint="Facts cycle in this order, one per day."
          />
          <Text
            label="Source reference"
            name="sourceReference"
            defaultValue={initial.sourceReference}
          />
          <Text label="Source URL" name="sourceUrl" type="url" defaultValue={initial.sourceUrl} />
          <Text
            label="Checked on"
            name="sourceCheckedOn"
            type="date"
            defaultValue={initial.sourceCheckedOn}
          />
        </div>
      </Card>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="neutral">{state.ok}</Notice> : null}

      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}

function Text({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.ComponentProps<'input'>) {
  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={props.name}
        className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10 sm:text-sm"
        {...props}
      />
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function TextArea({
  label,
  ...props
}: { label: string } & React.ComponentProps<'textarea'>) {
  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={props.name}
        className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2 text-base outline-none focus:border-burgundy sm:text-sm"
        {...props}
      />
    </div>
  );
}

function Select({
  label,
  children,
  ...props
}: { label: string } & React.ComponentProps<'select'>) {
  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <select
        id={props.name}
        className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-2.5 text-base outline-none focus:border-burgundy sm:h-10 sm:text-sm"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
