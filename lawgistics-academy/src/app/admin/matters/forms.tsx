'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Notice, cn } from '@/components/ui';
import { decideMatter, markMatterAttempt, saveMatter, setMatterPublished } from './actions';

const FIELD =
  'w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2.5 text-base outline-none focus:border-accent';

export interface MatterFormValues {
  id?: string;
  number: number;
  title: string;
  country: 'MY' | 'AU';
  area: string;
  brief: string;
  timeLimitMinutes: number;
  procedurePrompt: string;
  draftPrompt: string;
  speakPrompt: string;
  modelAnswer: string;
  sources: string;
}

/** Writing or changing a matter. Changing the words clears the sign-off. */
export function MatterForm({ initial }: { initial: MatterFormValues }) {
  const [state, action, pending] = useActionState(saveMatter, { error: null });

  return (
    <form action={action} className="space-y-5">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <Card>
        <h2 className="mb-4 text-lg">The file</h2>
        <div className="grid gap-4 sm:grid-cols-[6rem_1fr]">
          <Field label="Number" htmlFor="number">
            <input id="number" name="number" type="number" min={1} max={999} defaultValue={initial.number} className={FIELD} />
          </Field>
          <Field label="Title" htmlFor="title">
            <input id="title" name="title" defaultValue={initial.title} required maxLength={200} className={FIELD} />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Country" htmlFor="country">
            <select id="country" name="country" defaultValue={initial.country} className={FIELD}>
              <option value="MY">Malaysia</option>
              <option value="AU">Australia</option>
            </select>
          </Field>
          <Field label="Area" htmlFor="area">
            <input id="area" name="area" defaultValue={initial.area} maxLength={80} className={FIELD} />
          </Field>
          <Field label="Time limit (minutes)" htmlFor="timeLimitMinutes">
            <input id="timeLimitMinutes" name="timeLimitMinutes" type="number" min={5} max={240} defaultValue={initial.timeLimitMinutes} className={FIELD} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="The facts" htmlFor="brief" hint="Invented facts only. No real client, matter or person.">
            <textarea id="brief" name="brief" defaultValue={initial.brief} rows={9} required maxLength={6000} className={FIELD} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg">The tasks</h2>
        <div className="space-y-4">
          <Field label="1. Procedure" htmlFor="procedurePrompt">
            <input id="procedurePrompt" name="procedurePrompt" defaultValue={initial.procedurePrompt} maxLength={500} className={FIELD} />
          </Field>
          <Field label="2. Advice" htmlFor="draftPrompt">
            <input id="draftPrompt" name="draftPrompt" defaultValue={initial.draftPrompt} maxLength={500} className={FIELD} />
          </Field>
          <Field label="3. Spoken explanation" htmlFor="speakPrompt">
            <input id="speakPrompt" name="speakPrompt" defaultValue={initial.speakPrompt} maxLength={500} className={FIELD} />
          </Field>
          <p className="text-xs text-muted">4. The five follow-up questions are asked about each learner&rsquo;s own draft.</p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg">How a lawyer would approach it</h2>
        <p className="mb-4 text-sm text-slate">
          Shown to a learner only after they hand in their own attempt.
        </p>
        <Field label="The approach" htmlFor="modelAnswer">
          <textarea id="modelAnswer" name="modelAnswer" defaultValue={initial.modelAnswer} rows={14} required maxLength={12000} className={FIELD} />
        </Field>
        <div className="mt-4">
          <Field label="Sources" htmlFor="sources" hint="The rules and provisions it relies on.">
            <textarea id="sources" name="sources" defaultValue={initial.sources} rows={2} maxLength={2000} className={FIELD} />
          </Field>
        </div>
      </Card>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : initial.id ? 'Save changes' : 'Create the matter'}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** A coach signing a matter off, or flagging it with a note. */
export function DecisionForm({ id, updatedAt }: { id: string; updatedAt: string }) {
  const [state, action, pending] = useActionState(decideMatter, { error: null });
  const [note, setNote] = useState('');

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="updatedAt" value={updatedAt} />
      <label htmlFor="note" className="block text-sm font-medium">
        Note (needed to flag)
      </label>
      <textarea
        id="note"
        name="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={2000}
        className={FIELD}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="verify" variant="accent" disabled={pending}>
          Sign it off
        </Button>
        <Button type="submit" name="decision" value="flag" variant="outline" disabled={pending || !note.trim()}>
          Flag it
        </Button>
      </div>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
    </form>
  );
}

export function PublishForm({ id, published, canPublish }: { id: string; published: boolean; canPublish: boolean }) {
  const [state, action, pending] = useActionState(setMatterPublished, { error: null });
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="published" value={published ? 'false' : 'true'} />
      <Button type="submit" variant={published ? 'outline' : 'accent'} disabled={pending || (!published && !canPublish)}>
        {published ? 'Take it down' : 'Publish'}
      </Button>
      {!published && !canPublish ? (
        <p className="text-xs text-muted">It can go up once it is signed off and not flagged.</p>
      ) : null}
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
    </form>
  );
}

/** A lawyer marking a handed-in attempt. */
export function MatterMarkForm({
  attemptId,
  verdict,
  feedback,
}: {
  attemptId: string;
  verdict: 'good' | 'again' | null;
  feedback: string;
}) {
  const [state, action, pending] = useActionState(markMatterAttempt, { error: null });
  const [choice, setChoice] = useState<'good' | 'again' | null>(verdict);

  return (
    <form action={action} className="mt-4 space-y-3 border-t border-rule pt-4">
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="verdict" value={choice ?? ''} />
      <div className="flex flex-wrap gap-2">
        {(['good', 'again'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setChoice(v)}
            aria-pressed={choice === v}
            className={cn(
              'rounded-full border-2 px-4 py-2 text-sm font-medium',
              choice === v
                ? v === 'good'
                  ? 'border-verdict-correct bg-verdict-correct-wash text-verdict-correct'
                  : 'border-warn/60 bg-warn-wash text-warn'
                : 'border-rule',
            )}
          >
            {v === 'good' ? 'Good' : 'Needs another go'}
          </button>
        ))}
      </div>
      <label htmlFor={`fb-${attemptId}`} className="sr-only">
        Feedback
      </label>
      <textarea
        id={`fb-${attemptId}`}
        name="feedback"
        defaultValue={feedback}
        rows={3}
        maxLength={4000}
        placeholder="What they got right, and what you would have done differently"
        className={FIELD}
      />
      <Button type="submit" variant="accent" disabled={pending || !choice}>
        {pending ? 'Saving…' : verdict ? 'Change the mark' : 'Mark it'}
      </Button>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
    </form>
  );
}
