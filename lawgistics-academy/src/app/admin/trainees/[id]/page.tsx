import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireCoach } from '@/lib/admin/guard';
import { staffMayRead } from '@/lib/admin/supervision';
import { learnerDetail } from '@/lib/admin/answers';
import { Card, Pill, ScoreBar, SectionHeading } from '@/components/ui';

export const metadata: Metadata = { title: 'Trainee' };
export const dynamic = 'force-dynamic';

/**
 * One person's answers: overall, module by module, the topics they are
 * weakest on, and the questions they most recently got wrong with what they
 * chose and what was right. A coach sees only people the firm supervises;
 * anybody else is not found, the same answer as somebody who does not exist.
 */
export default async function AdminTraineePage({ params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireCoach();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  if (!(await staffMayRead(id, isAdmin))) notFound();
  const person = await learnerDetail(id);
  if (!person) notFound();

  const percent = person.totalAnswered
    ? Math.round((person.totalRight / person.totalAnswered) * 100)
    : null;
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <Link href="/admin/trainees" className="-my-2 inline-block py-2 text-sm text-slate hover:text-ink">
          ← All trainees
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl">{person.name}</h1>
          {person.trainee ? <Pill tone="accent">Trainee</Pill> : null}
        </div>
        <p className="mt-2 text-slate tabular-nums">
          {person.totalAnswered === 0
            ? 'Has not answered any questions yet.'
            : `${person.totalAnswered} questions answered, ${person.totalRight} right (${percent}%).`}
        </p>
      </section>

      <section>
        <SectionHeading eyebrow="Required and optional" title="Modules" />
        {person.modules.length === 0 ? (
          <p className="text-sm text-slate">No module has published questions yet.</p>
        ) : (
          <Card>
            <ul className="space-y-4">
              {person.modules.map((m) => {
                const score = m.total ? Math.round((m.correctOnce / m.total) * 100) : 0;
                return (
                  <li key={m.module.slug}>
                    <ScoreBar
                      label={`${m.module.name}${m.module.required ? ' (required)' : ''}: ${m.correctOnce} of ${m.total} done`}
                      score={score}
                      band={m.complete ? 'strong' : score >= 50 ? 'developing' : 'weak'}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>

      <section>
        <SectionHeading eyebrow="From two or more answers each" title="Weakest topics" />
        {person.weak.length === 0 ? (
          <p className="text-sm text-slate">Not enough answers to say yet.</p>
        ) : (
          <Card>
            <ul className="divide-y divide-rule">
              {person.weak.map((w) => (
                <li key={w.name} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <span className="font-medium">{w.name}</span>
                  <span className="shrink-0 text-sm text-slate tabular-nums">
                    {w.correct} of {w.attempts} right · {w.mastery}%
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section>
        <SectionHeading eyebrow="Most recent first" title="Questions they got wrong" />
        {person.wrong.length === 0 ? (
          <p className="text-sm text-slate">None yet.</p>
        ) : (
          <ul className="space-y-3">
            {person.wrong.map((w, i) => (
              <li key={`${w.answeredAt}-${i}`}>
                <Card>
                  <p className="text-xs text-muted">{day(w.answeredAt)}</p>
                  <p className="mt-1 font-medium">{w.stem}</p>
                  <p className="mt-2 text-sm">
                    <span className="text-verdict-wrong">They chose:</span> {w.chose}
                  </p>
                  <p className="text-sm">
                    <span className="text-verdict-correct">Right answer:</span> {w.right}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
