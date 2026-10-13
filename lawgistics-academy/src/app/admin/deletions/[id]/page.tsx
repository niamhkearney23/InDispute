import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/guard';
import { getLearnerProfile } from '@/lib/learner-overview';
import { DEFAULT_TIMEZONE } from '@/lib/types';
import { RECORD_KIND_LABEL, deletionDetail, recordHref } from '@/lib/account/erasure-admin';
import { Card, Notice, Pill, SectionHeading } from '@/components/ui';
import { CloseReviewForm, DecideForm, RedactForm, RetryForm } from '../forms';
import { StepList } from '../step-list';

export const metadata: Metadata = { title: 'Deletion' };
export const dynamic = 'force-dynamic';

/**
 * One deletion (0045): its steps, the certification records waiting for a
 * decision, and the procedure for finding what may still identify the
 * person. Searching for their former name works only while the review is
 * open, because closing it clears the name.
 */
export default async function DeletionPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId: adminId } = await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const detail = await deletionDetail(id);
  if (!detail) notFound();
  const timeZone = (await getLearnerProfile(adminId))?.timezone ?? DEFAULT_TIMEZONE;
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone });

  const { job, items, records } = detail;
  const undecided = items.filter((i) => !i.decision);
  const open = !detail.reviewClosedAt;
  // The register is decided in the queue below; everything else is listed.
  const others = records.filter((r) => !r.kind.startsWith('certification_'));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <Link href="/admin/deletions" className="-my-2 inline-block py-2 text-sm text-slate hover:text-ink">
          ← All deletions
        </Link>
        <h1 className="mt-2 text-3xl">Deleted account {job.userId.slice(0, 8)}</h1>
        <p className="mt-1 text-sm text-slate">
          Asked {day(job.requestedAt)}
          {detail.requestedBy ? ` by ${detail.requestedBy}` : ''}.{' '}
          <Link
            href={`/admin/trainees/${job.userId}`}
            className="inline-flex min-h-11 items-center text-accent underline underline-offset-2"
          >
            Their training record
          </Link>
        </p>
      </section>

      <section>
        <SectionHeading eyebrow="Steps" title={job.completedAt ? 'Every step finished' : 'Not finished'} />
        <Card>
          <StepList job={job} timeZone={timeZone} />
          <p className="mt-3 text-sm text-slate">
            Tried {job.attempts} {job.attempts === 1 ? 'time' : 'times'}
            {job.lastAttemptAt ? `, last on ${day(job.lastAttemptAt)}` : ''}.
            {job.completedAt
              ? ''
              : ' Until every step has finished it is retried automatically once a day. The person cannot use the account in the meantime.'}
          </p>
          {job.lastError && !job.completedAt ? (
            <p className="mt-2 text-sm text-warn">Last error: {job.lastError}</p>
          ) : null}
          {!job.completedAt ? (
            <div className="mt-3">
              <RetryForm userId={job.userId} />
            </div>
          ) : null}
        </Card>
      </section>

      <section>
        <SectionHeading
          eyebrow="Review queue"
          title={items.length === 0 ? 'No certification records' : `Certification records (${undecided.length} to decide)`}
        />
        {items.length === 0 ? (
          <p className="text-sm text-slate">
            No register record was linked to this account. If one belongs to them, link it at
            Certification, on the trainee&rsquo;s page, while this review is open.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Card>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill>{item.kind === 'trainee' ? 'Register record' : 'Register entry'}</Pill>
                    {item.decision === 'redact' ? (
                      <Pill tone="correct">Redacted</Pill>
                    ) : item.decision === 'retain' ? (
                      <Pill tone="accent">Retained</Pill>
                    ) : (
                      <Pill tone="warn">To decide</Pill>
                    )}
                  </div>
                  <p className="mt-2 text-sm">{item.summary}</p>
                  {item.traineeId ? (
                    <Link
                      href={
                        item.entryId
                          ? `/admin/certification/${item.traineeId}/entries/${item.entryId}`
                          : `/admin/certification/${item.traineeId}`
                      }
                      className="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-2"
                    >
                      Open it in the register
                    </Link>
                  ) : null}
                  {item.decision ? (
                    <p className="mt-1 text-sm text-slate">
                      {item.decision === 'redact' ? 'Redacted' : 'Retained'}
                      {item.decidedBy ? ` by ${item.decidedBy}` : ''}
                      {item.decidedAt ? ` on ${day(item.decidedAt)}` : ''}
                      {item.reason ? `. Reason: ${item.reason}` : ''}.
                    </p>
                  ) : (
                    <DecideForm userId={job.userId} itemId={item.id} />
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading eyebrow="Finding what may identify them" title="What remains" />
        <div className="mb-4 max-w-2xl space-y-2 text-sm text-slate">
          <p>
            Their name, email and photo are gone. What is listed here stayed with the firm and may
            still identify them. Look at each one. Work-board text can be redacted here; written
            work, marks and certificates are the firm&rsquo;s training record and stay, so if one
            must go, that is a decision to take with whoever is responsible for the firm&rsquo;s
            data protection.
          </p>
          {open ? (
            detail.formerName ? (
              <p>
                Messages, comments and feedback are searched for the name they had,{' '}
                <strong>{detail.formerName}</strong>, and its first word. The name is kept only until
                this review closes.
              </p>
            ) : (
              <p>
                No former name was kept for this deletion (it was made before deletions were
                recorded), so other people&rsquo;s words that name them cannot be searched for
                here.
              </p>
            )
          ) : (
            <p>The review is closed and their former name has been cleared, so it is no longer searched for.</p>
          )}
        </div>
        {detail.recordsError ? (
          <Notice tone="warn">What remains could not be listed just now. Reload to try again.</Notice>
        ) : others.length === 0 ? (
          <p className="text-sm text-slate">Nothing found.</p>
        ) : (
          <ul className="space-y-3">
            {others.map((r) => {
              const href = recordHref(r, job.userId);
              const kind = r.kind.endsWith('comment') ? 'comment' : 'message';
              return (
                <li key={`${r.kind}-${r.recordId}`}>
                  <Card>
                    <p className="eyebrow mb-1">{RECORD_KIND_LABEL[r.kind] ?? r.kind}</p>
                    <p className="whitespace-pre-line text-sm">{r.excerpt || '(no text)'}</p>
                    <p className="mt-1 text-xs text-muted">
                      {r.at ? day(r.at) : null}
                      {href ? (
                        <>
                          {r.at ? ', ' : null}
                          <Link
                            href={href}
                            className="inline-flex min-h-11 items-center text-accent underline underline-offset-2"
                          >
                            see it in context
                          </Link>
                        </>
                      ) : null}
                    </p>
                    {r.canRedact ? <RedactForm userId={job.userId} recordId={r.recordId} kind={kind} /> : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading eyebrow="Closing" title={open ? 'Close the review' : 'Review closed'} />
        {open ? (
          <Card>
            <p className="mb-3 text-sm text-slate">
              Close it once every certification record is decided and you have been through what
              remains. Closing clears the name they had, which cannot be put back.
            </p>
            {undecided.length > 0 ? (
              <p className="mb-3 text-sm text-warn">
                {undecided.length} certification {undecided.length === 1 ? 'record is' : 'records are'} still
                to decide.
              </p>
            ) : null}
            <CloseReviewForm userId={job.userId} ready={undecided.length === 0} />
          </Card>
        ) : (
          <p className="text-sm text-slate">
            Closed on {day(detail.reviewClosedAt as string)}
            {detail.reviewClosedBy ? ` by ${detail.reviewClosedBy}` : ''}.
          </p>
        )}
      </section>
    </div>
  );
}
