'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Notice } from '@/components/ui';
import { publishAllVerified } from './actions';

/**
 * The bulk operations that are safe to offer.
 *
 * There is deliberately no "verify everything". Verification is a statement by a
 * person that they have read the content and it is correct; a button that
 * asserts that two hundred times over is exactly the thing this whole workflow
 * exists to prevent.
 *
 * There used to be a "withdraw everything unverified" and its undo. Since 0044
 * nothing unverified can be published at all, so both had nothing to act on.
 */
export function BulkActions({ verifiedCount }: { verifiedCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await publishAllVerified();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage('Everything signed off is now published.');
      router.refresh();
    });
  }

  return (
    <Card>
      <p className="eyebrow mb-3">In bulk</p>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={pending || verifiedCount === 0}
          onClick={run}
        >
          Publish everything signed off ({verifiedCount})
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted">
        There is no bulk “verify”, on purpose. Publishing acts only on items that already
        carry a named sign-off, so it cannot be used to wave anything through unread.
        Items flagged as wrong stay withdrawn.
      </p>

      {message ? (
        <div className="mt-3">
          <Notice tone="neutral">{message}</Notice>
        </div>
      ) : null}
      {error ? (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
    </Card>
  );
}
