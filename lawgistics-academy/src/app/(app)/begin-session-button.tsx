'use client';

import { useTransition } from 'react';
import { beginSession } from './actions';
import { Button } from '@/components/ui';
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

  return (
    <Button
      size="lg"
      variant={variant}
      disabled={pending}
      onClick={() => startTransition(() => beginSession(kind))}
    >
      {pending ? 'Preparing…' : label}
    </Button>
  );
}
