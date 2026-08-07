import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { getReviewItems, summarise } from '@/lib/review/service';
import { Card, Notice, Stat } from '@/components/ui';
import { ReviewQueue } from './review-queue';
import { BulkActions } from './bulk-actions';

export const metadata: Metadata = { title: 'Verification' };
export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  await requireAdmin();

  const items = await getReviewItems();
  const stats = summarise(items);

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Verification</p>
        <h1 className="text-3xl">Sign off the content</h1>
        <p className="mt-3 max-w-2xl text-slate">
          Every question and daily fact, ordered so the ones most likely to contain an
          error come first. Anything already in front of learners but not yet signed off is
          at the very top.
        </p>
      </section>

      {stats.liveUnverified > 0 ? (
        <Notice tone="warn">
          <strong>
            {stats.liveUnverified} item{stats.liveUnverified === 1 ? ' is' : 's are'} live to
            learners without having been verified by a person.
          </strong>{' '}
          That is how the seed content ships so the product works out of the box. If you
          would rather nothing unreviewed were servable while you work through this, use
          “Withdraw everything unverified” below; it is reversible, and publishing is one
          click once an item is signed off.
        </Notice>
      ) : null}

      <section className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Stat label="Total items" value={stats.total} hint="questions and facts" />
        <Stat label="Signed off" value={stats.verified} />
        <Stat label="Outstanding" value={stats.outstanding} />
        <Stat
          label="Flagged"
          value={stats.flagged}
          hint={stats.flagged > 0 ? 'withdrawn from learners' : undefined}
        />
      </section>

      <Card>
        <p className="eyebrow mb-3">Working through it</p>
        <ul className="space-y-2 text-sm text-slate">
          <li>
            <strong className="text-ink">Correct and sign off</strong> records your name and
            the date against that exact wording. Rewriting it later clears the sign-off.
          </li>
          <li>
            <strong className="text-ink">Needs a change</strong> takes it out of circulation
            immediately and records what is wrong, so it can be fixed rather than forgotten.
          </li>
          <li>
            <strong className="text-ink">Remove entirely</strong> retires it for good.
          </li>
          <li>
            Signing off does not publish. Publishing is a separate, deliberate step; use
            “Publish everything signed off” when you are ready.
          </li>
        </ul>
      </Card>

      <BulkActions
        verifiedCount={stats.verified}
        liveUnverifiedCount={stats.liveUnverified}
      />

      <ReviewQueue items={items} />
    </div>
  );
}
