'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Notice } from '@/components/ui';
import { publishAllVerified, withdrawAllUnverified } from './actions';

/**
 * The two bulk operations that are safe to offer.
 *
 * There is deliberately no "verify everything". Verification is a statement by a
 * person that they have read the content and it is correct; a button that
 * asserts that a hundred times over is exactly the thing this whole workflow
 * exists to prevent.
 */
export function BulkActions({
  verifiedCount,
  liveUnverifiedCount,
}: {
  verifiedCount: number;
  liveUnverifiedCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: 'publish' | 'withdraw') {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result =
        action === 'publish' ? await publishAllVerified() : await withdrawAllUnverified();

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        action === 'publish'
          ? 'Everything signed off is now published.'
          : 'Unverified content has been withdrawn. Learners will only see items you have signed off.',
      );
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
          onClick={() => run('publish')}
        >
          Publish everything signed off ({verifiedCount})
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending || liveUnverifiedCount === 0}
          onClick={() => run('withdraw')}
        >
          Withdraw everything unverified ({liveUnverifiedCount})
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted">
        There is no bulk “verify”, on purpose. Publishing acts only on items that already
        carry a named sign-off, so it cannot be used to wave anything through unread.
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
