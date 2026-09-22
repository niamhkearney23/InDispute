'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { WORK_FILE_ACCEPT } from '@/lib/work/links';
import { claimWork, submitWork } from '../actions';

/** Putting your name on it. One button; the database decides the rest. */
export function ClaimForm({ postId, scope }: { postId: string; scope: 'one' | 'everyone' }) {
  const [state, formAction, pending] = useActionState(claimWork, { error: null });

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="postId" value={postId} />
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Working…' : scope === 'one' ? 'Put my name on it' : 'I will do this one'}
      </Button>
      {state.error ? (
        <div className="mt-3">
          <Notice tone="warn">{state.error}</Notice>
        </div>
      ) : null}
    </form>
  );
}

/**
 * Handing it in.
 *
 * The rule is stated above the box rather than behind a link, because the
 * box is a statement the person is making and they should be able to read
 * what they are saying. It is not pre-ticked.
 */
export function SubmitForm({ postId, again }: { postId: string; again: boolean }) {
  const [state, formAction, pending] = useActionState(submitWork, { error: null });

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <input type="hidden" name="postId" value={postId} />

      <div>
        <label htmlFor="file" className="mb-1.5 block text-sm font-medium">
          {again ? 'Your next go' : 'Your work'}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept={WORK_FILE_ACCEPT}
          className="block w-full text-base file:mr-3 file:rounded-[5px] file:border file:border-rule-strong file:bg-paper-raised file:px-3 file:py-2 file:text-sm file:text-ink"
        />
        <p className="mt-1 text-xs text-muted">A PDF, a Word document, or an image, up to 20MB.</p>
      </div>

      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
          A note for your coach (optional)
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={2000}
          className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2.5 text-base outline-none focus:border-burgundy"
        />
        <p className="mt-1 text-xs text-muted">
          What you were unsure about is more useful to them than what you were sure of.
        </p>
      </div>

      <div className="rounded-md border border-rule bg-paper-sunk px-4 py-3 text-sm">
        <p className="text-slate">
          <strong className="font-medium text-ink">Nothing that identifies a client.</strong>{' '}
          No names, no company names, no file numbers, no addresses, no dates that would pick
          a matter out. If the work is on a real file, take those out before you upload it.
          This platform is for training and is not the firm&apos;s document system.
        </p>
        <label className="mt-3 flex items-start gap-2.5 py-2">
          <input type="checkbox" name="declaredClean" required className="mt-0.5 size-5" />
          <span>I have checked, and there is nothing in this file that identifies a client.</span>
        </label>
      </div>

      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Uploading…' : 'Hand it in'}
      </Button>
    </form>
  );
}
