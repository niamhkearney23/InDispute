import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { ButtonLink, Card, Notice, Pill, SectionHeading, Stat } from '@/components/ui';
import { JURISDICTION_SHORT, type Jurisdiction } from '@/lib/types';
import { pickForDay } from '@/lib/facts/service';
import { localDateString } from '@/lib/learning/progression';

export const metadata: Metadata = { title: 'Daily brief' };

export default async function AdminFactsPage() {
  await requireAdmin();
  const db = createServiceClient();

  const { data } = await db
    .from('daily_facts')
    .select('id, slug, title, jurisdiction, status, verification_status, sort_order')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  const facts = data ?? [];
  const published = facts.filter((f) => f.status === 'published');
  const unverified = published.filter((f) => f.verification_status !== 'human_verified');

  // Same rotation the dashboard uses, so an admin can see what learners see.
  const today = pickForDay(published, localDateString('Australia/Melbourne'));

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Daily brief</p>
          <h1 className="text-3xl">{facts.length} facts</h1>
          <p className="mt-2 max-w-xl text-slate">
            One published fact is shown to every learner each day, rotating in the order
            below. Nothing repeats until the whole published pool has been through — at{' '}
            {published.length} facts that is {published.length} days.
          </p>
        </div>
        <ButtonLink href="/admin/facts/new" variant="accent">
          New fact
        </ButtonLink>
      </section>

      {unverified.length > 0 ? (
        <Notice tone="warn">
          <strong>{unverified.length} published fact(s) have not been verified by a
          person.</strong>{' '}
          Seed content ships in this state deliberately. Work through the list and verify
          each one before real learners use this.
        </Notice>
      ) : null}

      <section className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        <Stat label="Published" value={published.length} hint="days of rotation" />
        <Stat label="Awaiting verification" value={unverified.length} />
        <Stat label="Drafts" value={facts.filter((f) => f.status === 'draft').length} />
      </section>

      {today ? (
        <Card className="bg-paper-sunk">
          <p className="eyebrow mb-2">Showing today</p>
          <Link href={`/admin/facts/${today.id}`} className="text-lg hover:underline">
            {today.title}
          </Link>
        </Card>
      ) : null}

      <section>
        <SectionHeading title="Rotation order" />
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-rule">
            {facts.map((fact) => (
              <li key={fact.id}>
                <Link
                  href={`/admin/facts/${fact.id}`}
                  className="block px-5 py-4 hover:bg-paper-sunk"
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Pill tone={fact.status === 'published' ? 'correct' : 'neutral'}>
                      {fact.status}
                    </Pill>
                    {fact.verification_status !== 'human_verified' ? (
                      <Pill tone="warn">Unverified</Pill>
                    ) : null}
                    <span className="text-xs text-muted">
                      #{fact.sort_order} ·{' '}
                      {JURISDICTION_SHORT[fact.jurisdiction as Jurisdiction]}
                    </span>
                  </div>
                  <p className="text-sm">{fact.title}</p>
                </Link>
              </li>
            ))}
            {facts.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-slate">
                No facts yet. Run <code className="font-mono">npm run seed</code> or create
                one.
              </li>
            ) : null}
          </ul>
        </Card>
      </section>
    </div>
  );
}
