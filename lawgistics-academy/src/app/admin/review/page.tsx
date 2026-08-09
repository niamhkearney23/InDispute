import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import Link from 'next/link';
import { asReviewOrder, getReviewItems, summarise } from '@/lib/review/service';
import { Card, Notice, Stat, cn } from '@/components/ui';
import { ReviewQueue } from './review-queue';
import { BulkActions } from './bulk-actions';

export const metadata: Metadata = { title: 'Verification' };
export const dynamic = 'force-dynamic';

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  await requireAdmin();

  const { order: requested } = await searchParams;
  const order = asReviewOrder(requested);

  const items = await getReviewItems(order);
  const stats = summarise(items);

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Verification</p>
        <h1 className="text-3xl">Sign off the content</h1>
        <p className="mt-3 max-w-2xl text-slate">
          {order === 'simplest'
            ? 'Every question and daily fact, plainest first. These are the ones you can check quickly and confidently, which is the fastest way to make real progress through the list.'
            : 'Every question and daily fact, ordered so the ones most likely to contain an error come first. Anything already in front of learners but not yet signed off is at the very top.'}
        </p>

        <div className="mt-5 inline-flex rounded-[5px] border border-rule-strong p-0.5">
          <OrderTab href="/admin/review" label="Riskiest first" active={order === 'riskiest'} />
          <OrderTab
            href="/admin/review?order=simplest"
            label="Simplest first"
            active={order === 'simplest'}
          />
        </div>
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

      {stats.lapsed > 0 ? (
        <Notice tone="warn">
          <strong>
            {stats.lapsed} sign-off{stats.lapsed === 1 ? ' has' : 's have'} run out and{' '}
            {stats.lapsed === 1 ? 'is' : 'are'} back in the queue.
          </strong>{' '}
          Somebody checked {stats.lapsed === 1 ? 'it' : 'them'} and said how long that would
          hold for. That time is up, so {stats.lapsed === 1 ? 'it counts' : 'they count'} as
          outstanding again until somebody looks. Rules of court get amended and practice
          notes get reissued; a sign-off that never expired would quietly turn into the least
          trustworthy thing here.
        </Notice>
      ) : null}

      {stats.dueSoon > 0 ? (
        <p className="text-sm text-muted">
          {stats.dueSoon} more {stats.dueSoon === 1 ? 'is' : 'are'} due to be checked again
          within two months.
        </p>
      ) : null}

      <Card>
        <p className="eyebrow mb-3">Working through it</p>
        <ul className="space-y-2 text-sm text-slate">
          <li>
            <strong className="text-ink">Correct and sign off</strong> records your name and
            the date against that exact wording, and how long you are prepared to say it holds
            for. Rewriting it later clears the sign-off; so does the date running out.
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

/**
 * Plain links rather than a control, so switching order works before any
 * JavaScript has loaded and each ordering has an address you can bookmark.
 */
function OrderTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-[3px] px-3 py-2 text-sm whitespace-nowrap',
        active ? 'bg-ink text-paper' : 'text-slate hover:bg-paper hover:text-ink',
      )}
    >
      {label}
    </Link>
  );
}
