import type { Metadata } from 'next';
import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { RECENT_DAYS, learnerList } from '@/lib/admin/answers';
import { Pill } from '@/components/ui';

export const metadata: Metadata = { title: 'Trainees' };
export const dynamic = 'force-dynamic';

/**
 * How everybody is getting on with the questions, one line each: how many
 * they answered lately, how many right, when they last trained and what
 * they are weakest on. A coach sees the people the firm supervises; an
 * administrator everybody who is not staff.
 */
export default async function AdminTraineesPage() {
  const { isAdmin } = await requireCoach();
  const rows = await learnerList(isAdmin);
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

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

      {rows.length === 0 ? (
        <p className="text-slate">Nobody to show yet.</p>
      ) : (
        <ul className="divide-y divide-rule rounded-lg border border-rule bg-paper-raised">
          {rows.map((r) => {
            const percent = r.answered ? Math.round((r.right / r.answered) * 100) : null;
            return (
              <li key={r.id}>
                <Link
                  href={`/admin/trainees/${r.id}`}
                  className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 hover:bg-paper-sunk"
                >
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {r.name}
                      {r.trainee ? <Pill tone="accent">Trainee</Pill> : null}
                    </span>
                    <span className="text-sm text-slate">
                      {r.weakest ? `Weakest: ${r.weakest}` : 'Not enough answers to say yet'}
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
