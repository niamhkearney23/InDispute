'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Notice } from '@/components/ui';
import { publishAllVerified, restoreAllWithdrawn, withdrawAllUnverified } from './actions';

/**
 * The bulk operations that are safe to offer.
 *
 * There is deliberately no "verify everything". Verification is a statement by a
 * person that they have read the content and it is correct; a button that
 * asserts that two hundred times over is exactly the thing this whole workflow
 * exists to prevent.
 *
 * Restoring is a different matter and is safe for the same reason: it changes
 * what learners can see, not what anybody is recorded as having checked. It
 * exists because withdrawing without it was a one-way door.
 */
export function BulkActions({
  verifiedCount,
  liveUnverifiedCount,
  withdrawnCount,
}: {
  verifiedCount: number;
  liveUnverifiedCount: number;
  withdrawnCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: 'publish' | 'withdraw' | 'restore') {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result =
        action === 'publish'
          ? await publishAllVerified()
          : action === 'withdraw'
            ? await withdrawAllUnverified()
            : await restoreAllWithdrawn();

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        action === 'publish'
          ? 'Everything signed off is now published.'
          : action === 'withdraw'
            ? 'Unverified content has been withdrawn. Learners will only see items you have signed off.'
            : 'Everything withdrawn is back in front of learners. Nothing has been marked as verified; anything flagged stayed where it was.',
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
        <Button
          size="sm"
          variant="outline"
          disabled={pending || withdrawnCount === 0}
          onClick={() => run('restore')}
        >
          Put everything back in front of learners ({withdrawnCount})
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted">
        There is no bulk “verify”, on purpose. Publishing acts only on items that already
        carry a named sign-off, so it cannot be used to wave anything through unread.
        Putting things back is the undo for withdrawing: it changes what learners can see
        and records nothing about anybody having checked it. Items you flagged stay
        withdrawn either way.
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
