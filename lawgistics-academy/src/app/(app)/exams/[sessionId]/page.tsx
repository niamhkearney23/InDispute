import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/access/service';
import { examReview } from '@/lib/exams/service';
import { diagnosticAreaCounts } from '@/lib/training/service';
import { durationLabel, examDetail, examTitle } from '@/lib/exams/rules';
import { optionLetter } from '@/lib/learning/option-order';
import { DOMAINS } from '@/content/seed/taxonomy';
import { ButtonLink, Card, PageHeader, cn } from '@/components/ui';

export const metadata: Metadata = { title: 'Exam result' };

/** One finished exam: the score, the time, each area, then every answer. */
export default async function ExamResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  await requireAccess();
  const { sessionId } = await params;
  if (!z.guid().safeParse(sessionId).success) notFound();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const result = await examReview(user.id, sessionId);
  if (!result) redirect('/exams');
  const { attempt, questions } = result;
  const tally = await diagnosticAreaCounts(user.id, sessionId);
  const areaName = (slug: string) => DOMAINS.find((d) => d.slug === slug)?.name ?? slug;

  const percent = attempt.questions > 0 ? Math.round((attempt.correct / attempt.questions) * 100) : 0;
  const unanswered = questions.filter((q) => q.selected === null).length;
  const taken = attempt.completedAt
    ? durationLabel(new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime())
    : null;

  return (
    <div className="space-y-9">
      <PageHeader
        eyebrow="Exam result"
        title={examTitle(attempt.settings, areaName)}
        description={examDetail(attempt.settings)}
        action={<ButtonLink href="/exams" variant="outline">Back to exams</ButtonLink>}
      />

      <section className="accent-surface grid gap-6 rounded-2xl px-6 py-7 text-paper sm:grid-cols-4 sm:px-8">
        <Stat label="Score" value={`${percent}%`} big />
        <Stat label="Right" value={`${attempt.correct} of ${attempt.questions}`} />
        <Stat label="Not answered" value={String(unanswered)} />
        <Stat label="Time taken" value={taken ?? 'n/a'} />
      </section>

      {tally.size > 0 ? (
        <section aria-labelledby="areas">
          <h2 id="areas" className="mb-4 text-xl">By area</h2>
          <Card>
            <ul className="space-y-3">
              {[...tally].map(([slug, t]) => (
                <li key={slug} className="flex items-center gap-4 text-sm">
                  <span className="w-44 shrink-0">{areaName(slug)}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-sunk">
                    <span
                      className="block h-full rounded-full bg-periwinkle"
                      style={{ width: `${t.of > 0 ? Math.round((t.right / t.of) * 100) : 0}%` }}
                    />
                  </span>
                  <span className="w-24 text-right tabular-nums text-slate">
                    {t.right} of {t.of} right
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="answers">
        <h2 id="answers" className="mb-4 text-xl">Your answers</h2>
        <ol className="space-y-4">
          {questions.map((q, i) => (
            <li key={q.position} className="panel rounded-lg border p-5 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-rule-strong px-2 py-0.5 tabular-nums text-muted">
                  {i + 1}
                </span>
                {q.domainName ? <span className="text-muted">{q.domainName}</span> : null}
                <span
                  className={cn(
                    'ml-auto rounded-full px-2.5 py-0.5 font-medium',
                    q.selected === null
                      ? 'bg-paper-sunk text-muted'
                      : q.isCorrect
                        ? 'bg-verdict-correct-wash text-verdict-correct'
                        : 'bg-verdict-wrong-wash text-verdict-wrong',
                  )}
                >
                  {q.selected === null ? 'Not answered' : q.isCorrect ? 'Right' : 'Wrong'}
                </span>
              </div>
              {q.scenario ? (
                <p className="mb-3 border-l-2 border-rule-strong pl-3 leading-relaxed">{q.scenario}</p>
              ) : null}
              <p className="mb-4 text-lg leading-snug font-medium">{q.stem}</p>
              <ul className="space-y-2">
                {q.options.map((o, idx) => {
                  const chosen = q.selected?.includes(o.id) ?? false;
                  const right = q.correct?.includes(o.id) ?? false;
                  return (
                    <li
                      key={o.id}
                      className={cn(
                        'flex items-start gap-3 rounded-md border px-3.5 py-2.5 text-sm',
                        right && 'border-verdict-correct/50 bg-verdict-correct-wash',
                        chosen && !right && 'border-verdict-wrong/50 bg-verdict-wrong-wash',
                        !right && !chosen && 'border-rule',
                      )}
                    >
                      <span className="w-4 shrink-0 font-semibold text-muted">{optionLetter(idx)}</span>
                      <span className="flex-1">{o.text}</span>
                      {chosen ? <span className="text-xs text-muted">Your answer</span> : null}
                    </li>
                  );
                })}
              </ul>
              {q.correct === null ? (
                <p className="mt-4 text-sm text-slate">
                  This question has been taken back for a lawyer to check again, so its answer and
                  explanation are not shown.
                </p>
              ) : q.explanation ? (
                <p className="mt-4 text-sm leading-relaxed text-slate">{q.explanation}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <p className="text-xs tracking-[0.12em] text-paper/60 uppercase">{label}</p>
      <p className={cn('mt-1 tabular-nums text-paper', big ? 'text-4xl' : 'text-2xl')}>{value}</p>
    </div>
  );
}
