'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { markSubmission } from './actions';

/**
 * Two verdicts and a paragraph. Good, or needs another go, and what the
 * coach would have done differently. Nothing finer than that: the value is
 * the sentence, not a score.
 */
export function MarkForm({
  submissionId,
  verdict,
  feedback,
}: {
  submissionId: string;
  verdict: 'good' | 'again' | null;
  feedback: string;
}) {
  const [state, formAction, pending] = useActionState(markSubmission, { error: null });

  return (
    <form action={formAction} className="mt-3 space-y-3 border-t border-rule pt-3">
      <input type="hidden" name="id" value={submissionId} />

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Verdict</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['good', 'Good'],
              ['again', 'Needs another go'],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-[5px] border border-rule-strong bg-paper-raised px-3 py-2 text-sm has-[:checked]:border-burgundy"
            >
              <input
                type="radio"
                name="verdict"
                value={value}
                defaultChecked={verdict === value}
                required
                className="size-4"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`feedback-${submissionId}`} className="mb-1.5 block text-sm font-medium">
          Feedback
        </label>
        <textarea
          id={`feedback-${submissionId}`}
          name="feedback"
          defaultValue={feedback}
          rows={4}
          maxLength={5000}
          className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2.5 text-base outline-none focus:border-burgundy"
        />
        <p className="mt-1 text-xs text-muted">
          What you would have done differently, and one thing they got right. They read this
          alone.
        </p>
      </div>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}

      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? 'Saving…' : verdict ? 'Change the mark' : 'Mark it'}
      </Button>
    </form>
  );
}
