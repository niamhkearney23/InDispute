import type { Metadata } from 'next';
import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { allMattersForStaff } from '@/lib/matters/service';
import type { StaffMatterSummary } from '@/lib/matters/service';
import { describeLimit, matterLabel } from '@/lib/matters/rules';
import { ButtonLink, EmptyState, Pill } from '@/components/ui';

export const metadata: Metadata = { title: 'Matters' };
export const dynamic = 'force-dynamic';

/**
 * Every matter, sorted into what needs doing: signing off, fixing after a
 * flag, publishing, and marking. A coach sees the same list; only an
 * administrator can write one.
 */
export default async function AdminMattersPage() {
  const { isAdmin } = await requireCoach();
  const all = await allMattersForStaff();

  const flagged = all.filter((m) => m.matter.reviewFlagged);
  const unsigned = all.filter((m) => !m.matter.reviewFlagged && !m.matter.verifiedBy);
  const ready = all.filter((m) => m.matter.verifiedBy && !m.matter.published && !m.matter.reviewFlagged);
  const live = all.filter((m) => m.matter.published);
  const waiting = all.reduce((n, m) => n + m.waiting, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Matters</p>
          <h1 className="text-3xl">Practice files</h1>
          <p className="mt-2 max-w-2xl text-slate">
            A matter reaches learners only once somebody other than its writer has signed it
            off. Changing what it says takes it down until it is signed off again.
            {waiting > 0 ? ` ${waiting} handed in and waiting to be marked.` : ''}
          </p>
        </div>
        {isAdmin ? <ButtonLink href="/admin/matters/new">Write a matter</ButtonLink> : null}
      </div>

      {all.length === 0 ? (
        <EmptyState title="No matters yet" description="Write the first one." />
      ) : null}
      <Group title="Flagged" items={flagged} />
      <Group title="Waiting for sign-off" items={unsigned} />
      <Group title="Signed off, not up yet" items={ready} />
      <Group title="Up" items={live} />
    </div>
  );
}

function Group({ title, items }: { title: string; items: StaffMatterSummary[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <p className="eyebrow mb-3">
        {title} ({items.length})
      </p>
      <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-paper-raised">
        {items.map(({ matter, attempts, waiting }) => (
          <li key={matter.id}>
            <Link
              href={`/admin/matters/${matter.id}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3.5 hover:bg-paper-sunk sm:px-5"
            >
              <span className="font-mono text-xs font-semibold text-burgundy">{matterLabel(matter.number)}</span>
              <span className="min-w-0 flex-1 font-medium">{matter.title}</span>
              <Pill>{matter.country === 'MY' ? 'Malaysia' : 'Australia'}</Pill>
              <Pill>{describeLimit(matter.timeLimitMinutes)}</Pill>
              {!matter.createdBy ? <Pill tone="warn">AI draft</Pill> : null}
              {waiting > 0 ? <Pill tone="accent">{waiting} to mark</Pill> : null}
              {attempts > 0 ? <span className="text-xs text-muted">{attempts} attempts</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
