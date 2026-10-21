'use client';

import { useState, useTransition } from 'react';
import { beginSession } from './actions';
import { Button, Notice } from '@/components/ui';
import { isRedirect } from '@/lib/is-redirect';
import type { SessionKind } from '@/lib/types';

export function BeginSessionButton({
  kind,
  label,
  variant = 'accent',
  compact = false,
}: {
  kind: SessionKind;
  label: string;
  variant?: 'accent' | 'primary' | 'outline' | 'light';
  /** A small button on one line of a list, rather than a full-width one. */
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function start() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await beginSession(kind);
        // A successful start redirects, so reaching here at all means it did not.
        if (result?.error) setError(result.error);
      } catch (caught) {
        // A successful start arrives here too, as the redirect signal.
        if (isRedirect(caught)) throw caught;
        setError(
          caught instanceof Error
            ? caught.message
            : 'Could not start the session. Please try again.',
        );
      }
    });
  }

  return (
    // Full width when stacked, so the button fills the row on a phone.
    // Content width once the layout turns horizontal: left as w-full it
    // takes the whole flex row, which strands the button against its own
    // left edge and squeezes everything beside it.
    <div className={compact ? 'shrink-0' : 'w-full sm:w-auto'}>
      <Button size={compact ? 'sm' : 'lg'} variant={variant} disabled={pending} onClick={start}>
        {pending ? 'Preparing…' : label}
      </Button>
      {error ? (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
    </div>
  );
}
