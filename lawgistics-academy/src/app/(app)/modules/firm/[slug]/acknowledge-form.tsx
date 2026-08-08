'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import { acknowledge } from './actions';

/**
 * The acknowledgement.
 *
 * Two steps rather than one, and the checkbox is not decoration: a single
 * button at the bottom of a policy is pressed on the way past. Ticking a box
 * that says what it means and then pressing a button is the smallest amount of
 * friction that makes the record worth having, and this record is the entire
 * reason the feature exists.
 */
export function AcknowledgeForm({ slug, label }: { slug: string; label: string }) {
  const [state, formAction, pending] = useActionState(acknowledge, { error: null });
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form action={formAction}>
      <input type="hidden" name="slug" value={slug} />

      <Card>
        <label className="flex items-start gap-3 text-[1.0625rem] leading-relaxed">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            // 32px, because this is the tap target the whole record rests on.
            className="mt-0.5 size-8 shrink-0 rounded-[4px] border-rule-strong accent-burgundy"
          />
          <span>{label}, and I understand it applies to my work from today.</span>
        </label>

        <div className="mt-5">
          <Button type="submit" size="lg" variant="accent" disabled={!confirmed || pending}>
            {pending ? 'Recording…' : 'Record this'}
          </Button>
        </div>

        <p className="mt-4 border-t border-rule pt-4 text-sm text-slate">
          This records your name and today’s date against the version you have just read. If
          the firm changes it, you will be asked again.
        </p>

        {state.error ? (
          <div className="mt-4">
            <Notice tone="warn">{state.error}</Notice>
          </div>
        ) : null}
      </Card>
    </form>
  );
}
