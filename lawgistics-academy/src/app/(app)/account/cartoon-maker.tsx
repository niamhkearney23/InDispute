'use client';

import { useActionState, useMemo, useState } from 'react';
import { Button, Notice } from '@/components/ui';
import { CARTOON_PARTS, DEFAULT_CARTOON, randomCartoon, type CartoonStyle } from '@/lib/avatar/cartoon';
import { CartoonPicker } from '@/components/cartoon-picker';
import { cartoonDataUri } from '@/lib/avatar/draw';
import { clearCartoon, saveCartoon, type CartoonState } from './actions';

const initialState: CartoonState = { error: null };

/**
 * Building a cartoon of yourself, a part at a time, with the face redrawn
 * as you go. Every choice for a shape (hair, eyes, glasses and so on) is
 * shown on your own face, so you pick what you can see, not a name. Nothing
 * is saved until Save is pressed.
 */
export function CartoonMaker({ saved }: { saved: CartoonStyle | null }) {
  const [draft, setDraft] = useState<CartoonStyle>(saved ?? DEFAULT_CARTOON);
  const [saveState, saveAction, saving] = useActionState(saveCartoon, initialState);
  const [clearState, clearAction, clearing] = useActionState(clearCartoon, initialState);
  // Which button was pressed last. Only its result is shown, and changing
  // the face clears it, so an old message never sits over a newer one.
  const [last, setLast] = useState<'save' | 'clear' | null>(null);
  const change = (next: CartoonStyle) => {
    setDraft(next);
    setLast(null);
  };

  const face = useMemo(() => cartoonDataUri(draft), [draft]);

  const changed = !saved || CARTOON_PARTS.some(({ key }) => draft[key] !== saved[key]);
  const result = last === 'save' ? saveState : last === 'clear' ? clearState : null;
  const message = result?.error ?? null;
  const ok =
    last === 'save' && !message && saved && !changed
      ? saveState.ok
      : last === 'clear' && !message && !saved
        ? clearState.ok
        : undefined;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      {/* Side by side on a phone, so the face and Save stay in view above
          the choices; stacked in a column beside them on a wider screen. */}
      <div className="flex items-center gap-4 sm:w-40 sm:shrink-0 sm:flex-col sm:items-stretch sm:gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={face}
          alt="Your cartoon, as it stands"
          width={140}
          height={140}
          className="size-28 shrink-0 rounded-full border border-rule sm:size-[140px] sm:self-center"
        />
        <form action={saveAction} className="flex min-w-0 flex-1 flex-col gap-2">
          <input type="hidden" name="style" value={JSON.stringify(draft)} />
          <Button type="submit" size="sm" disabled={saving || !changed} onClick={() => setLast('save')}>
            {saving ? 'Saving…' : saved && !changed ? 'Saved' : 'Save my cartoon'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => change(randomCartoon())}>
            Surprise me
          </Button>
          {saved ? (
            <Button
              type="submit"
              formAction={clearAction}
              onClick={() => setLast('clear')}
              size="sm"
              variant="outline"
              disabled={clearing}
            >
              {clearing ? 'Removing…' : 'Remove cartoon'}
            </Button>
          ) : null}
        </form>
      </div>

      <div className="min-w-0 flex-1">
        <CartoonPicker value={draft} onChange={change} />

        <div className="mt-4" aria-live="polite">
          {message ? (
            <Notice tone="warn">
              <strong>{message}</strong>
            </Notice>
          ) : ok ? (
            <p className="text-sm font-semibold text-verdict-correct">{ok}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
