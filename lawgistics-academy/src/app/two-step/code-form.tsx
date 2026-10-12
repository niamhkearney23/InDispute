'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { verifyTwoStepCode } from './actions';

/**
 * The code box. 16px text so iOS does not zoom when it is tapped, numbers on
 * the keyboard, and `one-time-code` so a phone that can fill the code in
 * offers to.
 */
export const CODE_INPUT =
  'h-12 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-center font-mono ' +
  'text-xl tracking-[0.3em] outline-none focus:border-accent';

export function CodeForm({
  next,
  devices,
}: {
  next: string;
  devices: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(verifyTwoStepCode, { error: null });

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      {devices.length > 1 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Which device are you using?</legend>
          <div className="space-y-2">
            {devices.map((d, i) => (
              <label
                key={d.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[5px] border border-rule-strong bg-paper-raised px-3 py-2 text-sm has-[:checked]:border-accent"
              >
                <input
                  type="radio"
                  name="factor"
                  value={d.id}
                  defaultChecked={i === 0}
                  className="size-4 shrink-0"
                />
                <span className="min-w-0 break-words">{d.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="factor" value={devices[0]?.id ?? ''} />
      )}

      <div>
        <label htmlFor="code" className="mb-1.5 block text-sm font-medium">
          The six-digit code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 \-]*"
          maxLength={9}
          required
          autoFocus
          className={CODE_INPUT}
        />
      </div>

      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Checking…' : 'Continue'}
      </Button>
    </form>
  );
}
