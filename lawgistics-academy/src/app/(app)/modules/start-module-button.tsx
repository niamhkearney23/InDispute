'use client';

import { useState, useTransition } from 'react';
import { beginModule } from '../actions';
import { Button, Notice } from '@/components/ui';

export function StartModuleButton({ slug, label }: { slug: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full">
      <Button
        size="lg"
        variant="accent"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await beginModule(slug);
              if (result?.error) setError(result.error);
            } catch (caught) {
              setError(
                caught instanceof Error ? caught.message : 'Could not start the module.',
              );
            }
          });
        }}
      >
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
