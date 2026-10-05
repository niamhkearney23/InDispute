import type { Metadata } from 'next';
import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { getLearnerProfile } from '@/lib/learner-overview';
import { DEFAULT_TIMEZONE } from '@/lib/types';
import { LIST_LIMIT, RECENT_DAYS, learnerList } from '@/lib/admin/answers';
import { Notice, Pill } from '@/components/ui';
import { Avatar } from '@/components/avatar';

export const metadata: Metadata = { title: 'Trainees' };
export const dynamic = 'force-dynamic';

/**
 * How everybody is getting on with the questions, one line each: how many
 * they answered lately, how many right, when they last trained and what
 * they are weakest on. A coach sees the people the firm supervises; an
 * administrator everybody who is not staff.
 */
export default async function AdminTraineesPage() {
  const { isAdmin, userId } = await requireCoach();
  // The reader's own clock: a 7am session in Kuala Lumpur is the evening
  // before in UTC, where the server keeps time.
  const timeZone = (await getLearnerProfile(userId))?.timezone ?? DEFAULT_TIMEZONE;
  const { rows, more, failed } = await learnerList(isAdmin);
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone });

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Trainees</p>
        <h1 className="text-3xl">How everyone is doing</h1>
        <p className="mt-3 max-w-2xl text-slate">
          Answers in the last {RECENT_DAYS} days, how many were right, and the topic each person is
          weakest on. Open someone to see their modules and the questions they got wrong.
          {isAdmin ? '' : ' You see the people the firm supervises.'}
        </p>
      </section>

      {failed ? (
        <Notice tone="warn">
          The answer figures could not be read just now, so nobody is shown as having answered.
          Reload the page to try again.
        </Notice>
      ) : null}
      {more ? (
        <p className="text-sm text-slate">
          Showing the first {LIST_LIMIT} people, by name.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-slate">{failed ? 'Nobody could be listed just now.' : 'Nobody to show yet.'}</p>
      ) : (
        <ul className="divide-y divide-rule rounded-lg border border-rule bg-paper-raised">
          {rows.map((r) => {
            const percent = r.answered ? Math.floor((r.right / r.answered) * 100) : null;
            return (
              <li key={r.id}>
                <Link
                  href={`/admin/trainees/${r.id}`}
                  className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 hover:bg-paper-sunk"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar url={r.avatarUrl} cartoon={r.cartoon} name={r.name} size={36} />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 font-medium">
                        {r.name}
                        {r.trainee ? <Pill tone="accent">Trainee</Pill> : null}
                      </span>
                      <span className="block text-sm text-slate">
                        {r.weakest ? `Weakest: ${r.weakest}` : 'Not enough answers to say yet'}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-sm tabular-nums">
                    <span className="block">
                      {r.answered === 0
                        ? 'None lately'
                        : `${r.answered} answered · ${percent}% right`}
                    </span>
                    <span className="text-xs text-muted">
                      {r.lastAnswered ? `Last ${day(r.lastAnswered)}` : `Not in ${RECENT_DAYS} days`}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
