'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Button, Notice } from '@/components/ui';
import { COMMENT_MAX_LENGTH } from '@/lib/work/links';
import { postComment } from '../actions';

/**
 * Saying something under a post. A few one-tap starters, because an empty
 * box under a lawyer's post is the hardest thing on the page to write in.
 * The database decides whether this person may comment here at all.
 */
const STARTERS = ['I’m on it', 'Quick question: ', 'Handed mine in', 'Thank you!'];

export function CommentForm({ postId, staff = false }: { postId: string; staff?: boolean }) {
  const [state, formAction, pending] = useActionState(postComment, { error: null });
  const formRef = useRef<HTMLFormElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  // The comment is on the page once it is posted, so the box empties.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="postId" value={postId} />
      {staff ? null : (
        <div className="flex flex-wrap gap-1.5">
          {STARTERS.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => {
                const box = boxRef.current;
                if (!box) return;
                box.value = starter;
                box.focus();
                box.setSelectionRange(starter.length, starter.length);
              }}
              className="min-h-9 rounded-full border border-rule-strong bg-paper px-3 text-sm text-slate transition hover:border-accent/50 hover:bg-accent-wash hover:text-ink"
            >
              {starter.trim()}
            </button>
          ))}
        </div>
      )}
      <label htmlFor={`comment-${postId}`} className="sr-only">
        Comment
      </label>
      <textarea
        ref={boxRef}
        id={`comment-${postId}`}
        name="body"
        rows={2}
        required
        maxLength={COMMENT_MAX_LENGTH}
        placeholder={staff ? 'Reply to everyone on this post' : 'Say something to everyone on this'}
        className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2.5 text-base outline-none focus:border-accent"
      />
      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? 'Posting…' : 'Post'}
        </Button>
        <span className="text-xs text-muted">
          Everyone who can see this post can read it. No client names.
        </span>
      </div>
    </form>
  );
}
