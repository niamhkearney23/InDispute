import type { Metadata } from 'next';
import Link from '@/components/app-link';
import { requireReviewer } from '@/lib/admin/guard';
import { studioExercisesFor } from '@/lib/content/service';
import { sharedAttempts } from '@/lib/studio/service';
import { STATUS_LABELS } from '@/lib/studio/rules';
import { Notice, Pill } from '@/components/ui';

export const metadata: Metadata = { title: 'Advocacy Studio' };

/**
 * Recordings learners chose to share with their coaches, newest first.
 * Nothing a learner kept to themselves is listed or readable here, and a
 * recording they stop sharing or delete leaves this list at once.
 */
export default async function AdminStudioPage() {
  await requireReviewer();
  // Staff see every exercise, drafts included, so the country does not narrow it.
  const [attempts, exercises] = await Promise.all([sharedAttempts(), studioExercisesFor('MY', true)]);
  const titles = new Map(exercises.map((e) => [e.exercise.slug, e.exercise.title]));
  const when = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Advocacy Studio</p>
        <h1 className="text-3xl">Recordings shared with you</h1>
        <p className="mt-3 max-w-2xl text-slate">
          Learners share a recording with the coaches one at a time and can stop sharing it at any
          point. Each time you open one, that is recorded, and the learner is told so.
        </p>
      </section>

      {attempts === null ? (
        <Notice tone="warn">The recordings could not be read just now. Please try again.</Notice>
      ) : attempts.length === 0 ? (
        <p className="text-slate">Nobody has shared a recording yet.</p>
      ) : (
        <ul className="divide-y divide-rule rounded-lg border border-rule bg-paper-raised">
          {attempts.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/studio/${a.id}`}
                className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 hover:bg-paper-sunk"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{a.learnerName}</span>
                  <span className="text-sm text-slate">
                    {titles.get(a.exerciseKey) ?? a.exerciseKey} · {STATUS_LABELS[a.status]}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                  {a.reviewCount > 0 ? <Pill tone="correct">Reviewed</Pill> : <Pill>Not reviewed</Pill>}
                  {when(a.startedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
