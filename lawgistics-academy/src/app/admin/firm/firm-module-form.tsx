'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import { FirmBody } from '@/components/firm-body';
import { readingMinutes } from '@/lib/firm/content';
import type { AdminState } from '../actions';

export interface FirmModuleFormValues {
  moduleId?: string;
  slug: string;
  name: string;
  summary: string;
  kind: 'welcome' | 'policy';
  country: 'ALL' | 'AU' | 'MY';
  required: boolean;
  position: number;
  published: boolean;
  body: string;
  /** The version currently in force, so the writer knows what saving will do. */
  version: number | null;
}

const PLACEHOLDER = `## Before you use any AI tool

Say here what a person may and may not put into a tool, in your own words.

- One rule to a line reads better than a paragraph of them
- Start a heading with two hashes
- Leave a blank line between paragraphs`;

export function FirmModuleForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  initial: FirmModuleFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [body, setBody] = useState(initial.body);
  const [preview, setPreview] = useState(false);

  const changed = body.trim() !== initial.body.trim();

  return (
    <form action={formAction} className="space-y-5">
      {initial.moduleId ? <input type="hidden" name="moduleId" value={initial.moduleId} /> : null}

      <Card>
        <h2 className="mb-1 text-lg">What it is</h2>
        <p className="mb-4 text-sm text-slate">
          This is the firm’s own content. It is not reviewed here and it never reaches the
          verification queue, because that queue is for statements of law we answer for.
        </p>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Title" name="name" defaultValue={initial.name} required />
            <Text
              label="Slug"
              name="slug"
              defaultValue={initial.slug}
              hint="Lower case, hyphens. Appears in the address."
              required
            />
          </div>

          <Text
            label="One line, shown in the list"
            name="summary"
            defaultValue={initial.summary}
            maxLength={400}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Kind" name="kind" defaultValue={initial.kind}>
              <option value="policy">Policy, read and acknowledged</option>
              <option value="welcome">Welcome, read</option>
            </Select>

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

          <p className="text-xs text-muted">
            Leave this on everyone unless there is a real reason not to. Somebody trained in
            one country working in the other is the person most likely to need the firm’s own
            rules spelled out, and scoping by country is exactly what would hide them.
          </p>

          <div className="space-y-2 border-t border-rule pt-4">
            <Check label="Required" name="required" defaultChecked={initial.required} />
            <Check
              label="Published, so learners can see it"
              name="published"
              defaultChecked={initial.published}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg">The words</h2>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="rounded-[5px] px-2 py-1.5 text-sm font-medium text-burgundy underline underline-offset-2"
          >
            {preview ? 'Back to editing' : 'Preview'}
          </button>
        </div>
        <p className="mb-4 text-sm text-slate">
          Plain text. A blank line starts a paragraph, <code className="font-mono">## </code>
          makes a heading, <code className="font-mono">- </code> makes a bullet. About{' '}
          {readingMinutes(body)} {readingMinutes(body) === 1 ? 'minute' : 'minutes'} to read.
        </p>

        {preview ? (
          <div className="rounded-[5px] border border-rule bg-paper-sunk p-5">
            {body.trim() ? (
              <FirmBody body={body} />
            ) : (
              <p className="text-sm text-muted">Nothing written yet.</p>
            )}
          </div>
        ) : (
          <textarea
            id="body"
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={18}
            required
            placeholder={PLACEHOLDER}
            className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2 font-mono text-base leading-relaxed outline-none focus:border-burgundy"
          />
        )}
        {/* Preview swaps the textarea out of the DOM, so the value has to travel
            some other way or previewing and submitting would post nothing. */}
        {preview ? <input type="hidden" name="body" value={body} /> : null}

        {initial.version && changed ? (
          <div className="mt-4">
            <Notice tone="warn">
              This will become version {initial.version + 1}. Everyone who acknowledged version{' '}
              {initial.version} will be asked again, because what they agreed to is not what this
              says. Fixing the title or the summary alone does not do that.
            </Notice>
          </div>
        ) : null}
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
        className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-2.5 text-base outline-none focus:border-burgundy sm:h-10"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

function Check({ label, ...props }: { label: string } & React.ComponentProps<'input'>) {
  return (
    <label className="flex items-center gap-2.5 py-1 text-sm font-medium">
      <input
        type="checkbox"
        className="size-8 rounded-[4px] border-rule-strong accent-burgundy"
        {...props}
      />
      {label}
    </label>
  );
}
