'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { CONFIRM_WORD } from '@/lib/account/erasure-rules';
import { deleteMyAccount, type DeleteAccountState } from './actions';

const INPUT =
  'h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-accent sm:h-10';

/**
 * Deleting your account, behind a second step: the form opens only when
 * asked for, and goes ahead only with the word and your own address typed
 * out. Neither box is filled in for you.
 */
export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteMyAccount, {
    error: null,
  } as DeleteAccountState);

  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer items-center rounded-[5px] py-2 text-sm font-medium text-warn underline underline-offset-4">
        Delete my account
      </summary>
      <form action={formAction} className="mt-4 space-y-4">
        <div>
          <label htmlFor="confirmWord" className="mb-1.5 block text-sm font-medium">
            Type {CONFIRM_WORD} in capitals
          </label>
          <input
            id="confirmWord"
            name="confirmWord"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="confirmEmail" className="mb-1.5 block text-sm font-medium">
            Your email address
          </label>
          <input
            id="confirmEmail"
            name="confirmEmail"
            type="email"
            autoComplete="off"
            required
            className={INPUT}
          />
        </div>

        {state.error ? <Notice tone="warn">{state.error}</Notice> : null}

        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Deleting…' : 'Delete my account for good'}
        </Button>
      </form>
    </details>
  );
}
