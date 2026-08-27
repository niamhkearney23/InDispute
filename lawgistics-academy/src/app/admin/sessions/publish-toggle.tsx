'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui';
import { setPublished } from './actions';

/**
 * Up, or taken down. There is no delete.
 *
 * Somebody watched it. A record that vanishes when somebody tidies up is not a
 * record, and "we covered that in a session" is worth nothing if the session
 * can be made never to have existed.
 */
export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const [state, formAction, pending] = useActionState(setPublished, { error: null });

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="published" value={published ? 'false' : 'true'} />
      <Button type="submit" variant={published ? 'outline' : 'accent'} disabled={pending}>
        {pending ? 'Working…' : published ? 'Take it down' : 'Put it up'}
      </Button>
      {state.error ? <span className="text-xs text-verdict-wrong">{state.error}</span> : null}
    </form>
  );
}
