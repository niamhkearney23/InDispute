'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Button, Notice } from '@/components/ui';
import { sendWorkMessage } from '../actions';

/**
 * One box and one button. Used by the intern on their own thread and by the
 * coach on any intern's thread: the same action, and the database decides
 * which threads this person may write into.
 */
export function MessageForm({
  postId,
  threadUserId,
  placeholder,
}: {
  postId: string;
  /** Whose thread this goes into. An intern passes their own id. */
  threadUserId: string;
  placeholder: string;
}) {
  const [state, formAction, pending] = useActionState(sendWorkMessage, { error: null });
  const formRef = useRef<HTMLFormElement>(null);

  // The message is on the page once it is sent, so the box empties.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="threadUserId" value={threadUserId} />
      <label htmlFor={`message-${threadUserId}`} className="sr-only">
        Message
      </label>
      <textarea
        id={`message-${threadUserId}`}
        name="body"
        rows={2}
        required
        maxLength={2000}
        placeholder={placeholder}
        className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2.5 text-base outline-none focus:border-burgundy"
      />
      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? 'Sending…' : 'Send'}
      </Button>
    </form>
  );
}
