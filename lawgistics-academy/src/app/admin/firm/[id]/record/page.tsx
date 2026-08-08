import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/guard';
import { getFirmModuleForAdmin, getFirmModuleRecord } from '@/lib/firm/service';
import { ButtonLink, Card, Notice, Pill, SectionHeading, Stat } from '@/components/ui';

export const metadata: Metadata = { title: 'Who has read it' };

/**
 * The record.
 *
 * This is the page a firm opens, so it lists everyone rather than only the
 * people who have complied. Who has read it is the easy half; the half worth
 * paying for is who has not, and a page that only shows names with ticks beside
 * them answers a question nobody was asking.
 */
export default async function FirmModuleRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [definition, rows] = await Promise.all([
    getFirmModuleForAdmin(id),
    getFirmModuleRecord(id),
  ]);
  if (!definition) notFound();

  const done = rows.filter((r) => r.acknowledgedAt);
  const outstanding = rows.filter((r) => !r.acknowledgedAt);
  const stale = outstanding.filter((r) => r.staleVersion !== null);

  const dateOf = (iso: string) =>
    new Date(iso).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">Firm induction</p>
        <h1 className="text-3xl">{definition.name}</h1>
        <p className="mt-2 text-slate">
          {definition.version
            ? `Version ${definition.version}${definition.published ? '' : ', not published'}`
            : 'No content yet'}
        </p>
      </section>

      {!definition.version ? (
        <Notice tone="warn">
          There is nothing to acknowledge yet, so there is nothing to record.
        </Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Has read the current version" value={String(done.length)} />
            <Stat label="Has not" value={String(outstanding.length)} />
            <Stat label="Read an earlier version" value={String(stale.length)} />
          </div>

          {stale.length > 0 ? (
            <Notice tone="warn">
              {stale.length === 1 ? 'One person has' : `${stale.length} people have`} read an
              earlier version of this and not the current one. They are counted as outstanding,
              because what they agreed to is not what it says now.
            </Notice>
          ) : null}

          <section>
            <SectionHeading
              eyebrow="People who still need to read it come first"
              title="Everyone"
            />
            <Card>
              <ul className="divide-y divide-rule">
                {[...outstanding, ...done].map((row) => (
                  <li
                    key={row.userId}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {row.displayName || row.email || 'Unnamed account'}
                      </p>
                      {row.displayName && row.email ? (
                        <p className="truncate text-xs text-muted">{row.email}</p>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      {row.acknowledgedAt ? (
                        <p className="text-sm tabular-nums text-slate">
                          {dateOf(row.acknowledgedAt)}
                        </p>
                      ) : row.staleVersion !== null ? (
                        <Pill tone="warn">Read version {row.staleVersion}</Pill>
                      ) : (
                        <Pill tone="warn">Outstanding</Pill>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <p className="max-w-2xl text-sm text-slate">
            A date here means a named person opened this text and said they had read it, stamped
            by the database rather than by the browser that sent it. It does not mean they
            understood it or that they will follow it, and it is worth more for not pretending
            to.
          </p>
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={`/admin/firm/${definition.id}`} variant="outline">
          Edit the words
        </ButtonLink>
        <ButtonLink href="/admin/firm" variant="ghost">
          All firm modules
        </ButtonLink>
      </div>
    </div>
  );
}
