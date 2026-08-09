'use client';

import { useActionState, useState } from 'react';
import { Button, Notice } from '@/components/ui';
import { declare } from './actions';

/**
 * Recording that a person has done something the app cannot see.
 *
 * Two shapes, and the difference is deliberate. Signing a document gets the
 * checkbox, because that record is a claim about a legal document and the
 * friction is the point: a lone button at the end of a row is pressed on the
 * way past. Everything else gets a single button, because making somebody tick
 * a box to say their mailbox works is ceremony, and ceremony everywhere teaches
 * people to click through the one place it mattered.
 */
export function DeclareForm({
  slug,
  kind,
  needsFirmCheck,
}: {
  slug: string;
  kind: 'sign' | 'task';
  needsFirmCheck: boolean;
}) {
  const [state, formAction, pending] = useActionState(declare, { error: null });
  const [confirmed, setConfirmed] = useState(false);

  const ceremonial = kind === 'sign';

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="slug" value={slug} />

      {ceremonial ? (
        <label className="flex items-start gap-3 text-[0.9375rem] leading-relaxed">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 size-8 shrink-0 rounded-[4px] border-rule-strong accent-burgundy"
          />
          <span>I have signed this and returned it to the firm.</span>
        </label>
      ) : null}

      <div className={ceremonial ? 'mt-4' : ''}>
        <Button
          type="submit"
          variant={ceremonial ? 'accent' : 'outline'}
          disabled={(ceremonial && !confirmed) || pending}
        >
          {pending ? 'Recording…' : ceremonial ? 'Record this' : 'I have done this'}
        </Button>
      </div>

      {needsFirmCheck ? (
        <p className="mt-3 text-sm text-slate">
          The firm checks this one as well, so it stays on your list until somebody there
          confirms it.
        </p>
      ) : null}

      {state.error ? (
        <div className="mt-3">
          <Notice tone="warn">{state.error}</Notice>
        </div>
      ) : null}
    </form>
  );
}
