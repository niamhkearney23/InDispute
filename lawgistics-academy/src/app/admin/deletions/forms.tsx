'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import type { AdminState } from '../actions';
import { closeErasureReview, decideErasureReview, redactIdentifyingRecord, retryErasure } from './actions';

const INITIAL: AdminState = { error: null };

function Said({ state }: { state: AdminState }) {
  if (state.error) return <Notice tone="warn">{state.error}</Notice>;
  if (state.ok) return <Notice tone="neutral">{state.ok}</Notice>;
  return null;
}

/** Runs the unfinished steps of one deletion now. */
export function RetryForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(retryErasure, INITIAL);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? 'Retrying…' : 'Retry'}
      </Button>
      <Said state={state} />
    </form>
  );
}

/** Redact or retain one certification record. */
export function DecideForm({ userId, itemId }: { userId: string; itemId: string }) {
  const [state, action, pending] = useActionState(decideErasureReview, INITIAL);
  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="itemId" value={itemId} />
      <fieldset className="space-y-1.5 text-sm">
        <legend className="mb-1 font-medium">Decision</legend>
        <label className="flex min-h-11 items-center gap-2">
          <input type="radio" name="decision" value="redact" required />
          Redact identifying details (keeps grades, dates and box numbers)
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="radio" name="decision" value="retain" required />
          Retain as it is
        </label>
      </fieldset>
      <div>
        <label htmlFor={`reason-${itemId}`} className="mb-1.5 block text-sm font-medium">
          Reason, needed to retain (for example: regulatory record)
        </label>
        <input
          id={`reason-${itemId}`}
          name="reason"
          maxLength={500}
          autoComplete="off"
          className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-accent sm:h-10"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? 'Saving…' : 'Record the decision'}
      </Button>
      <Said state={state} />
    </form>
  );
}

/** Replaces one work-board message or comment with a notice. */
export function RedactForm({
  userId,
  recordId,
  kind,
}: {
  userId: string;
  recordId: string;
  kind: 'message' | 'comment';
}) {
  const [state, action, pending] = useActionState(redactIdentifyingRecord, INITIAL);
  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="recordId" value={recordId} />
      <input type="hidden" name="kind" value={kind} />
      <Button type="submit" size="sm" variant="outline" disabled={pending || Boolean(state.ok)}>
        {pending ? 'Removing…' : 'Redact'}
      </Button>
      <Said state={state} />
    </form>
  );
}

/** Closes the review; refused by the database while anything is undecided. */
export function CloseReviewForm({ userId, ready }: { userId: string; ready: boolean }) {
  const [state, action, pending] = useActionState(closeErasureReview, INITIAL);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" variant="outline" disabled={pending || !ready}>
        {pending ? 'Closing…' : 'Close the review'}
      </Button>
      <Said state={state} />
    </form>
  );
}
