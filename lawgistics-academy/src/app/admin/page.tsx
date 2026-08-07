import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { ButtonLink, Card, Notice, Pill, SectionHeading, Stat } from '@/components/ui';
import { JURISDICTION_SHORT, type Jurisdiction, type QuestionStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'Question bank' };

const STATUS_TONE: Record<QuestionStatus, 'neutral' | 'accent' | 'correct' | 'warn'> = {
  draft: 'neutral',
  requires_review: 'warn',
  verified: 'accent',
  published: 'correct',
  superseded: 'neutral',
  retired: 'neutral',
};

const STATUS_LABEL: Record<QuestionStatus, string> = {
  draft: 'Draft',
  requires_review: 'Requires review',
  verified: 'Verified',
  published: 'Published',
  superseded: 'Superseded',
  retired: 'Retired',
};

interface Row {
  id: string;
  slug: string;
  status: QuestionStatus;
  domain: string;
  stem: string;
  version: number;
  jurisdiction: Jurisdiction;
  verification: string;
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status: statusFilter } = await searchParams;

  const db = createServiceClient();

  const { data } = await db
    .from('questions')
    .select(
      'id, slug, status, domains(name), question_versions!inner(version, stem, jurisdiction, verification_status, is_current)',
    )
    .eq('question_versions.is_current', true)
    .order('created_at', { ascending: true });

  const rows: Row[] = (data ?? []).map((row) => {
    const version = first<{
      version: number;
      stem: string;
      jurisdiction: Jurisdiction;
      verification_status: string;
    }>(row.question_versions);
    return {
      id: row.id as string,
      slug: row.slug as string,
      status: row.status as QuestionStatus,
      domain: first<{ name: string }>(row.domains)?.name ?? 'Unassigned',
      stem: version?.stem ?? '',
      version: version?.version ?? 1,
      jurisdiction: version?.jurisdiction ?? 'AU_GENERAL',
      verification: version?.verification_status ?? 'unverified',
    };
  });

  const published = rows.filter((r) => r.status === 'published');
  const unverifiedPublished = published.filter((r) => r.verification !== 'human_verified');
  const awaitingReview = rows.filter(
    (r) => r.verification !== 'human_verified' && r.status !== 'retired',
  );

  const visible = statusFilter
    ? rows.filter((r) =>
        statusFilter === 'unverified'
          ? r.verification !== 'human_verified'
          : r.status === statusFilter,
      )
    : rows;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Question bank</p>
          <h1 className="text-3xl">{rows.length} questions</h1>
        </div>
        <ButtonLink href="/admin/questions/new" variant="accent">
          New question
        </ButtonLink>
      </section>

      {unverifiedPublished.length > 0 ? (
        <Notice tone="warn">
          <strong>{unverifiedPublished.length} published question(s) have not been
          verified by a person.</strong>{' '}
          Seed content ships in this state deliberately; it is drafted to be accurate but
          has not been signed off by an Australian legal practitioner. Work through the
          list below and verify each one before real learners use this.{' '}
          <Link
            href="/admin/review"
            className="font-medium underline underline-offset-2"
          >
            Work through them in the verification queue
          </Link>
        </Notice>
      ) : null}

      <section className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Stat label="Published" value={published.length} />
        <Stat label="Awaiting verification" value={awaitingReview.length} />
        <Stat label="Drafts" value={rows.filter((r) => r.status === 'draft').length} />
        <Stat label="Retired" value={rows.filter((r) => r.status === 'retired').length} />
      </section>

      <section>
        <SectionHeading
          title="All questions"
          action={
            <div className="flex flex-wrap gap-1 text-xs">
              <FilterLink label="All" href="/admin" active={!statusFilter} />
              <FilterLink
                label="Unverified"
                href="/admin?status=unverified"
                active={statusFilter === 'unverified'}
              />
              <FilterLink
                label="Published"
                href="/admin?status=published"
                active={statusFilter === 'published'}
              />
              <FilterLink
                label="Drafts"
                href="/admin?status=draft"
                active={statusFilter === 'draft'}
              />
            </div>
          }
        />

        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-rule">
            {visible.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/questions/${row.id}`}
                  className="block px-5 py-4 hover:bg-paper-sunk"
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Pill tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Pill>
                    {row.verification !== 'human_verified' ? (
                      <Pill tone="warn">Unverified</Pill>
                    ) : null}
                    <span className="text-xs text-muted">
                      {row.domain} · {JURISDICTION_SHORT[row.jurisdiction]} · v{row.version}
                    </span>
                  </div>
                  <p className="text-sm">{row.stem}</p>
                  <p className="mt-1 font-mono text-xs text-muted">{row.slug}</p>
                </Link>
              </li>
            ))}
            {visible.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-slate">
                Nothing here.
              </li>
            ) : null}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'rounded-full border border-ink bg-ink px-3 py-2 text-paper'
          : 'rounded-full border border-rule-strong px-3 py-2 text-slate hover:bg-paper-sunk'
      }
    >
      {label}
    </Link>
  );
}

function first<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? (value[0] ?? null) : value) as T | null;
}
