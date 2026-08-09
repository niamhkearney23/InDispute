'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import type { AdminState } from '../../actions';

export interface StepFormValues {
  stepId?: string;
  slug: string;
  title: string;
  detail: string;
  kind: 'read' | 'sign' | 'task';
  firmModuleId: string;
  needsFirmCheck: boolean;
  country: 'ALL' | 'AU' | 'MY';
  required: boolean;
  position: number;
  published: boolean;
}

export interface ModuleChoice {
  id: string;
  name: string;
  published: boolean;
  hasContent: boolean;
}

export function StepForm({
  action,
  initial,
  modules,
  submitLabel,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  initial: StepFormValues;
  modules: ModuleChoice[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null } as AdminState);
  const [kind, setKind] = useState(initial.kind);

  const reading = kind === 'read';
  const usable = modules.filter((m) => m.published && m.hasContent);

  return (
    <form action={formAction} className="space-y-5">
      {initial.stepId ? <input type="hidden" name="stepId" value={initial.stepId} /> : null}

      <Card>
        <h2 className="mb-1 text-lg">What they have to do</h2>
        <p className="mb-4 text-sm text-slate">
          One item on the list a new joiner sees before their first day.
        </p>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Title" name="title" defaultValue={initial.title} required />
            <Text
              label="Slug"
              name="slug"
              defaultValue={initial.slug}
              hint="Lower case, hyphens. Appears in the address."
              required
            />
          </div>

          <div>
            <label htmlFor="detail" className="mb-1.5 block text-sm font-medium">
              What they actually have to do
            </label>
            <textarea
              id="detail"
              name="detail"
              rows={3}
              maxLength={2000}
              defaultValue={initial.detail}
              placeholder="Where to find it, who to send it to, what happens next. An item with no instructions turns into a question for somebody’s supervisor, which is the cost this list exists to remove."
              className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2 text-base leading-relaxed outline-none focus:border-burgundy"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Kind"
              name="kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as StepFormValues['kind'])}
            >
              <option value="read">Read one of the firm’s documents</option>
              <option value="sign">Sign and return a document</option>
              <option value="task">Something to be set up or done</option>
            </Select>

            {reading ? (
              <Select
                label="Which document"
                name="firmModuleId"
                defaultValue={initial.firmModuleId}
              >
                <option value="">Choose one</option>
                {usable.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            ) : (
              <div />
            )}
          </div>

          {reading && usable.length === 0 ? (
            <Notice tone="warn">
              There is nothing to point at yet. A reading step needs one of the firm’s own
              documents, written and published under Firm, with words in it.
            </Notice>
          ) : null}

          {reading ? (
            <p className="text-sm text-slate">
              Finished by reading it and confirming at the end, which records the version they
              read. Nobody at the firm confirms this one: you cannot see whether somebody read
              something, and a tick that says you did would be worth less than the honest gap.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Who sees it" name="country" defaultValue={initial.country}>
              <option value="ALL">Everyone</option>
              <option value="AU">Australian accounts only</option>
              <option value="MY">Malaysian accounts only</option>
            </Select>
            <Text
              label="Order"
              name="position"
              type="number"
              min={0}
              max={99}
              defaultValue={initial.position}
            />
          </div>

          <div className="space-y-2 border-t border-rule pt-4">
            {!reading ? (
              <Check
                label="The firm has to confirm this as well"
                name="needsFirmCheck"
                defaultChecked={initial.needsFirmCheck}
                hint="Turn this on for anything the firm can actually see: a signed document arriving, a mailbox existing. It stays outstanding until somebody here confirms it."
              />
            ) : null}
            <Check label="Required" name="required" defaultChecked={initial.required} />
            <Check
              label="Published, so new joiners see it"
              name="published"
              defaultChecked={initial.published}
            />
          </div>
        </div>
      </Card>

      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" variant="accent" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
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
        className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
        {...props}
      />
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
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
        className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

function Check({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.ComponentProps<'input'>) {
  return (
    <div>
      <label className="flex items-start gap-3 text-[0.9375rem]">
        <input
          type="checkbox"
          className="mt-0.5 size-8 shrink-0 rounded-[4px] border-rule-strong accent-burgundy"
          {...props}
        />
        <span>{label}</span>
      </label>
      {hint ? <p className="mt-1 ml-11 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
