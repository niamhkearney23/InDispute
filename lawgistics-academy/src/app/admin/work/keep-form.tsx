'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import type { AdminState } from '../actions';
import { keepForSupervision } from './actions';

export interface KeepChoice {
  id: string;
  /** A few words of it, to pick it by. */
  label: string;
  kept: boolean;
}

/**
 * Keeping a learner's message or comment for supervision (0045), or no
 * longer keeping it, with a reason. A kept one survives the learner deleting
 * their account and the retention period; anything else is replaced with a
 * notice then. Shown to coaches and administrators only; the action asks
 * again.
 */
export function KeepForm({
  postId,
  kind,
  choices,
}: {
  postId: string;
  kind: 'message' | 'comment';
  choices: KeepChoice[];
}) {
  const [state, action, pending] = useActionState(keepForSupervision, { error: null } as AdminState);
  if (choices.length === 0) return null;
  const noun = kind === 'message' ? 'message' : 'comment';

  return (
    <details className="mt-3 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-slate underline underline-offset-4">
        Keep a {noun} for supervision
      </summary>
      <form action={action} className="mt-2 space-y-3">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="postId" value={postId} />
        <p className="max-w-xl text-slate">
          If this learner deletes their account, or the work is older than the retention period,
          their {noun}s are replaced with a notice, except any kept here because supervision needs
          it. Say why.
        </p>
        <div>
          <label htmlFor={`keep-${kind}-${postId}`} className="mb-1.5 block font-medium">
            Which {noun}
          </label>
          <select
            id={`keep-${kind}-${postId}`}
            name="id"
            required
            className="h-11 w-full max-w-xl rounded-[5px] border border-rule-strong bg-paper px-3 text-base sm:h-10"
          >
            {choices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kept ? '(kept) ' : ''}
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="space-y-1">
          <legend className="mb-1 font-medium">Keep it?</legend>
          <label className="flex min-h-11 items-center gap-2">
            <input type="radio" name="keep" value="keep" defaultChecked />
            Keep it for supervision
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="radio" name="keep" value="release" />
            No longer keep it
          </label>
        </fieldset>
        <div>
          <label htmlFor={`keep-reason-${kind}-${postId}`} className="mb-1.5 block font-medium">
            Why
          </label>
          <input
            id={`keep-reason-${kind}-${postId}`}
            name="reason"
            required
            minLength={3}
            maxLength={500}
            autoComplete="off"
            className="h-11 w-full max-w-xl rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-accent sm:h-10"
          />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
        {state.error ? <Notice tone="warn">{state.error}</Notice> : null}
        {state.ok ? <Notice tone="neutral">{state.ok}</Notice> : null}
      </form>
    </details>
  );
}
