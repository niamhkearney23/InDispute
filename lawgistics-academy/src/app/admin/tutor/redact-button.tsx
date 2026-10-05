'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui';
import { redactTutorMessage, type RedactState } from './actions';

/** "Remove", under one message, for an administrator. Asks first. */
export function RedactButton({ messageId }: { messageId: string }) {
  const [state, action, pending] = useActionState<RedactState, FormData>(redactTutorMessage, {
    error: null,
  });
  return (
    <form
      action={action}
      className="mt-1"
      onSubmit={(e) => {
        if (!window.confirm('Remove this message for good? Its words cannot be brought back.')) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="messageId" value={messageId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? 'Removing…' : 'Remove'}
      </Button>
      {state.error ? <p className="text-xs text-verdict-wrong">{state.error}</p> : null}
    </form>
  );
}
