import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';
import { getLearnerProfile } from '@/lib/learner-overview';
import { DEFAULT_TIMEZONE } from '@/lib/types';
import { listDeletions, listNightlyRuns } from '@/lib/account/erasure-admin';
import { NightlyRuns } from './nightly-runs';
import { STEP_LABEL } from '@/lib/account/erasure-rules';
import { Card, Notice, Pill, SectionHeading } from '@/components/ui';
import { RetryForm } from './forms';
import { StepList } from './step-list';

export const metadata: Metadata = { title: 'Deletions' };
export const dynamic = 'force-dynamic';

/**
 * Every account deletion that has not finished, every one whose review is
 * still open, and the rest from the last ninety days (0045). An
 * administrator's page: deleting cannot be undone, so finishing and
 * reviewing a deletion is theirs.
 */
export default async function DeletionsPage() {
  const { userId } = await requireAdmin();
  const timeZone = (await getLearnerProfile(userId))?.timezone ?? DEFAULT_TIMEZONE;
  const [{ rows, error }, nightly] = await Promise.all([listDeletions(), listNightlyRuns()]);
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone });

  const unfinished = rows.filter((r) => !r.job.completedAt);
  const toReview = rows.filter((r) => r.job.completedAt && !r.reviewClosedAt);
  const done = rows.filter((r) => r.job.completedAt && r.reviewClosedAt);

  const section = (title: string, eyebrow: string, list: typeof rows, empty: string) => (
    <section>
      <SectionHeading eyebrow={eyebrow} title={title} />
      {list.length === 0 ? (
        <p className="text-sm text-slate">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.job.userId}>
              <Card>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/deletions/${r.job.userId}`}
                    className="inline-flex min-h-11 items-center font-medium text-accent underline underline-offset-2"
                  >
                    Deleted account {r.job.userId.slice(0, 8)}
                  </Link>
                  {r.job.completedAt ? (
                    <Pill tone="correct">Every step finished</Pill>
                  ) : (
                    <Pill tone="warn">Not finished</Pill>
                  )}
                  {r.reviewClosedAt ? (
                    <Pill>Review closed</Pill>
                  ) : (
                    <Pill tone="accent">
                      Review open{r.undecided ? `, ${r.undecided} to decide` : ''}
                    </Pill>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate">
                  Asked {day(r.job.requestedAt)}
                  {r.requestedBy ? ` by ${r.requestedBy}` : ''}. Tried {r.job.attempts}{' '}
                  {r.job.attempts === 1 ? 'time' : 'times'}
                  {r.job.lastAttemptAt ? `, last on ${day(r.job.lastAttemptAt)}` : ''}.
                </p>
                <StepList job={r.job} timeZone={timeZone} />
                {r.job.lastError && !r.job.completedAt ? (
                  <p className="mt-2 text-sm text-warn">Last error: {r.job.lastError}</p>
                ) : null}
                {!r.job.completedAt ? (
                  <div className="mt-3">
                    <RetryForm userId={r.job.userId} />
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl">Deletions</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate">
          A deleted account can no longer be used as soon as its details leave the database: the
          database refuses it, whatever else happens. The other steps ({STEP_LABEL.signIn.toLowerCase()},
          and {STEP_LABEL.files.toLowerCase()}) are retried automatically once a day until they
          finish, or now with Retry. Each deletion also has a review: what the firm keeps may still
          identify the person, and certification records need a decision.
        </p>
      </div>
      {error ? <Notice tone="warn">The deletions could not be read just now. Reload to try again.</Notice> : null}
      {section('Not finished', 'Needs attention', unfinished, 'Every deletion has finished.')}
      <NightlyRuns runs={nightly.runs} error={nightly.error} timeZone={timeZone} />
      {section('Finished, review open', 'To review', toReview, 'No review is waiting.')}
      {section('Finished and reviewed', 'Last ninety days', done, 'None in the last ninety days.')}
    </div>
  );
}
