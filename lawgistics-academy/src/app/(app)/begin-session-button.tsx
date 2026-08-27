'use client';

import { useState, useTransition } from 'react';
import { beginSession } from './actions';
import { Button, Notice } from '@/components/ui';
import type { SessionKind } from '@/lib/types';

export function BeginSessionButton({
  kind,
  label,
  variant = 'accent',
}: {
  kind: SessionKind;
  label: string;
  variant?: 'accent' | 'primary' | 'outline';
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
    <div className="w-full sm:w-auto">
      <Button size="lg" variant={variant} disabled={pending} onClick={start}>
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
