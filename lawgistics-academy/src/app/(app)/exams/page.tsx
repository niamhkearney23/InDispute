import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from '@/components/app-link';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { requireAccess } from '@/lib/access/service';
import { trainingOpen } from '@/lib/training/service';
import { listExams } from '@/lib/exams/service';
import { MOCK_EXAM, durationLabel, examDetail, examTitle } from '@/lib/exams/rules';
import { DOMAINS } from '@/content/seed/taxonomy';
import { ButtonLink, Card, Notice, PageHeader } from '@/components/ui';
import { ExamStart } from './exam-start';

export const metadata: Metadata = { title: 'Exams' };

/**
 * Exams (0056; the owner, November 2026: "this idea too. like how it can
 * help for law school"): a mock exam, a drill the learner builds, and every
 * attempt afterwards with its score and its answers.
 */
export default async function ExamsPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');

  const [open, attempts] = await Promise.all([trainingOpen(profile.country), listExams(user.id)]);
  const running = attempts.find((a) => a.status === 'in_progress') ?? null;
  const finished = attempts.filter((a) => a.status === 'completed');
  const areaName = (slug: string) => DOMAINS.find((d) => d.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Exams"
        description="Sit a mock exam against the clock, or build a drill on what you want to practise. Every question has been checked by a lawyer, and you see your marks and the answers at the end."
      />

      {running ? (
        <section className="accent-surface rounded-xl px-5 py-5 text-paper sm:px-7">
          <p className="text-xs tracking-[0.12em] text-paper/60 uppercase">In progress</p>
          <h2 className="mt-1.5 text-xl text-paper">{examTitle(running.settings, areaName)}</h2>
          <p className="mt-1 text-sm text-paper/75">
            {running.answered} of {running.questions} answered
            {running.endsAt ? ' · the clock is running' : ''}
          </p>
          <div className="mt-4">
            <ButtonLink href={`/train/${running.sessionId}`} variant="light">
              Carry on
            </ButtonLink>
          </div>
        </section>
      ) : null}

      {!open ? (
        <Notice>
          Exams open once a lawyer has signed off questions for your country.
        </Notice>
      ) : running ? null : (
        <ExamStart
          mock={{ count: MOCK_EXAM.count, minutes: MOCK_EXAM.minutes }}
          areas={DOMAINS.map((d) => ({ slug: d.slug, name: d.name }))}
        />
      )}

      <section aria-labelledby="history">
        <h2 id="history" className="mb-4 text-xl">Your exams</h2>
        {finished.length === 0 ? (
          <Card>
            <p className="text-slate">Nothing yet. Your attempts appear here with their scores.</p>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {finished.map((a) => {
              const right = a.correct;
              const asked = a.questions;
              const percent = asked > 0 ? Math.round((right / asked) * 100) : 0;
              const taken =
                a.completedAt ? durationLabel(new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime()) : null;
              return (
                <li key={a.sessionId} className="panel rounded-lg border p-5">
                  <p className="eyebrow">
                    {new Date(a.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <h3 className="mt-1.5 font-sans text-base font-semibold">{examTitle(a.settings, areaName)}</h3>
                  <p className="mt-0.5 text-xs text-muted">{examDetail(a.settings)}</p>
                  <div className="mt-4 flex items-baseline justify-between text-sm">
                    <span className="text-verdict-correct">{right} right</span>
                    <span className="text-2xl tabular-nums">{percent}%</span>
                    <span className="text-verdict-wrong">{asked - right} wrong or unanswered</span>
                  </div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-paper-sunk" aria-hidden>
                    <div className="bg-verdict-correct" style={{ width: `${percent}%` }} />
                    <div className="bg-verdict-wrong/70" style={{ width: `${100 - percent}%` }} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted">{taken ? `Time taken ${taken}` : null}</span>
                    <Link href={`/exams/${a.sessionId}`} className="text-periwinkle-ink hover:underline">
                      See answers ›
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
