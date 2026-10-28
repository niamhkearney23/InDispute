'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import { DIMENSION_LABELS, type StudioDimension } from '@/lib/studio/rules';
import { reviewStudioAttempt } from './actions';
import type { AdminState } from '../actions';

type Mark = '' | 'not_assessed' | `${number}`;
type Decision = '' | 'approved' | 'rejected';

/**
 * A coach's review. Their own feedback is required; changing a mark,
 * agreeing or disagreeing with an AI comment and suggesting what to practise
 * next are optional, and anything left alone is not recorded.
 */
export function StudioReviewForm({
  attemptId,
  dimensions,
  comments,
  exercises,
}: {
  attemptId: string;
  /** The exercise's rubric dimensions, with the AI's mark if it gave one. */
  dimensions: Array<{ dimension: StudioDimension; ai: number | null }>;
  /** The AI's comments, by id, for the coach to agree or disagree with. */
  comments: Array<{ id: string; text: string }>;
  exercises: Array<{ slug: string; title: string }>;
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(reviewStudioAttempt, { error: null });
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const field =
    'w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-accent';

  const overrides = Object.fromEntries(
    Object.entries(marks)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => [k, v === 'not_assessed' ? v : Number(v)]),
  );
  const chosen = Object.fromEntries(Object.entries(decisions).filter(([, v]) => v !== ''));

  if (state.ok) return <Notice tone="good">{state.ok}</Notice>;

  return (
    <form action={formAction}>
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="scoreOverrides" value={JSON.stringify(overrides)} />
      <input type="hidden" name="commentDecisions" value={JSON.stringify(chosen)} />
      <Card>
        <div className="space-y-5">
          <div>
            <label htmlFor="feedback" className="mb-1.5 block text-sm font-medium">
              Your feedback
            </label>
            <textarea
              id="feedback"
              name="feedback"
              rows={6}
              required
              maxLength={6000}
              className={`${field} py-2.5`}
              placeholder="What worked, what to change first, and how."
            />
            <p className="mt-1 text-xs text-muted">
              The learner sees this under your name, beside the AI&rsquo;s feedback and marked as
              written by a person. It cannot be edited afterwards; write another review instead.
            </p>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Your marks (optional)</legend>
            <p className="mb-3 text-xs text-muted">
              Leave a mark as it is to record nothing for it. &ldquo;Not assessed&rdquo; is an answer
              too.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {dimensions.map(({ dimension, ai }) => (
                <label key={dimension} className="block text-sm">
                  <span className="mb-1 block">
                    {DIMENSION_LABELS[dimension]}
                    <span className="text-muted"> (AI: {ai === null ? 'not assessed' : `${ai} of 10`})</span>
                  </span>
                  <select
                    className={`${field} min-h-11`}
                    value={marks[dimension] ?? ''}
                    onChange={(e) => setMarks({ ...marks, [dimension]: e.target.value as Mark })}
                  >
                    <option value="">No change</option>
                    <option value="not_assessed">Not assessed</option>
                    {Array.from({ length: 11 }, (_, n) => (
                      <option key={n} value={String(n)}>
                        {n} of 10
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>

          {comments.length ? (
            <fieldset>
              <legend className="mb-3 text-sm font-medium">The AI&rsquo;s comments (optional)</legend>
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-md border border-rule p-3 text-sm">
                    <p>{c.text}</p>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {(['', 'approved', 'rejected'] as const).map((v) => (
                        <label key={v} className="flex min-h-11 items-center gap-2">
                          <input
                            type="radio"
                            name={`decision-${c.id}`}
                            checked={(decisions[c.id] ?? '') === v}
                            onChange={() => setDecisions({ ...decisions, [c.id]: v })}
                            className="size-5"
                          />
                          {v === '' ? 'No view' : v === 'approved' ? 'I agree' : 'I disagree'}
                        </label>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : null}

          <div>
            <label htmlFor="followUp" className="mb-1.5 block text-sm font-medium">
              Practise next (optional)
            </label>
            <select id="followUp" name="followUp" className={`${field} min-h-11`} defaultValue="">
              <option value="">No suggestion</option>
              {exercises.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          {state.error ? <Notice tone="error">{state.error}</Notice> : null}
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save my review'}
          </Button>
        </div>
      </Card>
    </form>
  );
}
