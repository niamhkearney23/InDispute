'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import { WORK_FILE_ACCEPT, isTrustedWorkLink } from '@/lib/work/links';
import type { AdminState } from '../actions';

export interface WorkPostFormValues {
  id?: string;
  kind: 'task' | 'material';
  title: string;
  instructions: string;
  /** What is attached already, so an edit does not look like it lost the file. */
  fileName: string | null;
  linkUrl: string;
  scope: 'one' | 'everyone';
  traineesOnly: boolean;
  country: 'ALL' | 'AU' | 'MY';
  dueOn: string;
  sessionId: string;
  homeworkDay: number | null;
  published: boolean;
}

const INPUT =
  'h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10';

/**
 * Posting a piece of work, or something to read.
 *
 * The link is checked as it is typed, as a session link is: the wrong kind
 * of link is the thing people get wrong, and being told while the paste is
 * still on screen is the difference between a fix and a shrug.
 */
export function WorkPostForm({
  action,
  initial,
  sessions,
  submitLabel,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  initial: WorkPostFormValues;
  sessions: Array<{ id: string; title: string }>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [kind, setKind] = useState(initial.kind);
  const [link, setLink] = useState(initial.linkUrl);

  const trimmed = link.trim();
  const trusted = trimmed ? isTrustedWorkLink(trimmed) : null;

  return (
    <form action={formAction} className="space-y-5">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Card>
        <h2 className="mb-4 text-lg">What it is</h2>

        <fieldset className="mb-4">
          <legend className="mb-1.5 text-sm font-medium">Kind</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['task', 'Work to do', 'An intern puts their name on it, does it, and hands it in.'],
                ['material', 'Something to read', 'A file or a link. Nothing to hand in.'],
              ] as const
            ).map(([value, label, help]) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-2.5 rounded-[5px] border border-rule-strong bg-paper-raised p-3 text-sm has-[:checked]:border-burgundy"
              >
                <input
                  type="radio"
                  name="kind"
                  value={value}
                  checked={kind === value}
                  onChange={() => setKind(value)}
                  className="mt-0.5 size-4"
                />
                <span>
                  <strong className="font-medium">{label}</strong>
                  <span className="mt-0.5 block text-xs text-slate">{help}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              name="title"
              defaultValue={initial.title}
              required
              maxLength={200}
              className={INPUT}
            />
          </div>

          <div>
            <label htmlFor="instructions" className="mb-1.5 block text-sm font-medium">
              {kind === 'task' ? 'What to do' : 'Why it is worth reading'}
            </label>
            <textarea
              id="instructions"
              name="instructions"
              defaultValue={initial.instructions}
              rows={5}
              maxLength={5000}
              className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2.5 text-base outline-none focus:border-burgundy"
            />
            <p className="mt-1 text-xs text-muted">
              {kind === 'task'
                ? 'Say what a good answer looks like and how long it should take. An intern reads this alone.'
                : 'A sentence or two. It sits under the link.'}
            </p>
          </div>

          <div>
            <label htmlFor="file" className="mb-1.5 block text-sm font-medium">
              File {initial.fileName ? '(replace)' : '(optional)'}
            </label>
            {initial.fileName ? (
              <p className="mb-1.5 text-sm text-slate">Attached now: {initial.fileName}</p>
            ) : null}
            <input
              id="file"
              name="file"
              type="file"
              accept={WORK_FILE_ACCEPT}
              className="block w-full text-base file:mr-3 file:rounded-[5px] file:border file:border-rule-strong file:bg-paper-raised file:px-3 file:py-2 file:text-sm file:text-ink"
            />
            <p className="mt-1 text-xs text-muted">
              A PDF, a Word document, or an image, up to 20MB. Nothing that identifies a
              client: take the names out first.
            </p>
          </div>

          <div>
            <label htmlFor="linkUrl" className="mb-1.5 block text-sm font-medium">
              Google Drive link (optional)
            </label>
            <input
              id="linkUrl"
              name="linkUrl"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              className={INPUT}
            />
            {trusted === false ? (
              <p className="mt-1.5 text-xs text-verdict-wrong">
                That link cannot be used here. In Google Drive or Docs, press Share, then
                Copy link. It should begin <code>https://drive.google.com/</code> or{' '}
                <code>https://docs.google.com/</code>.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted">
                Share it with the people who need it in Drive first. This app only holds the
                address.
              </p>
            )}
          </div>
        </div>
      </Card>

      {kind === 'task' ? (
        <Card>
          <h2 className="mb-4 text-lg">Who does it</h2>
          <fieldset>
            <legend className="sr-only">Scope</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['one', 'One person', 'The first intern to put their name on it gets it.'],
                  ['everyone', 'Everyone', 'Each intern does their own and hands it in.'],
                ] as const
              ).map(([value, label, help]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-start gap-2.5 rounded-[5px] border border-rule-strong bg-paper-raised p-3 text-sm has-[:checked]:border-burgundy"
                >
                  <input
                    type="radio"
                    name="scope"
                    value={value}
                    defaultChecked={initial.scope === value}
                    className="mt-0.5 size-4"
                  />
                  <span>
                    <strong className="font-medium">{label}</strong>
                    <span className="mt-0.5 block text-xs text-slate">{help}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4">
            <label htmlFor="dueOn" className="mb-1.5 block text-sm font-medium">
              Due (optional)
            </label>
            <input id="dueOn" name="dueOn" type="date" defaultValue={initial.dueOn} className={INPUT} />
            <p className="mt-1 text-xs text-muted">
              Shown to them, and anything handed in after it is marked late. It does not stop a
              late one.
            </p>
          </div>
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-4 text-lg">Who sees it, and where</h2>

        <div className="space-y-4">
          <label className="flex items-start gap-2.5 py-2 text-sm">
            <input
              type="checkbox"
              name="traineesOnly"
              defaultChecked={initial.traineesOnly}
              className="mt-0.5 size-5"
            />
            <span>
              <strong className="font-medium">Litigation trainees only.</strong>{' '}
              <span className="text-slate">
                Untick to put it in front of everybody in the country chosen below.
              </span>
            </span>
          </label>

          <div>
            <label htmlFor="country" className="mb-1.5 block text-sm font-medium">
              Country
            </label>
            <select id="country" name="country" defaultValue={initial.country} className={INPUT}>
              <option value="ALL">Both</option>
              <option value="MY">Malaysia only</option>
              <option value="AU">Australia only</option>
            </select>
          </div>

          <div>
            <label htmlFor="sessionId" className="mb-1.5 block text-sm font-medium">
              Attach to a session (optional)
            </label>
            <select id="sessionId" name="sessionId" defaultValue={initial.sessionId} className={INPUT}>
              <option value="">Not attached</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">It then appears under that session&apos;s video.</p>
          </div>

          <div>
            <label htmlFor="homeworkDay" className="mb-1.5 block text-sm font-medium">
              Attach to a homework day (optional)
            </label>
            <select
              id="homeworkDay"
              name="homeworkDay"
              defaultValue={initial.homeworkDay ?? 0}
              className={INPUT}
            >
              <option value={0}>Not attached</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2.5 py-2 text-sm">
            <input
              type="checkbox"
              name="published"
              defaultChecked={initial.published}
              className="mt-0.5 size-5"
            />
            <span>
              <strong className="font-medium">Put it up.</strong>{' '}
              <span className="text-slate">
                Unticked, it is a draft only coaches can see. Taking it down later keeps it for
                anyone who already put their name on it.
              </span>
            </span>
          </label>
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
