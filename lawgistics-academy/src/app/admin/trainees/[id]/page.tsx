import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireCoach } from '@/lib/admin/guard';
import { getLearnerProfile } from '@/lib/learner-overview';
import { DEFAULT_TIMEZONE } from '@/lib/types';
import { staffMayRead } from '@/lib/admin/supervision';
import { learnerDetail } from '@/lib/admin/answers';
import { Card, Pill, ScoreBar, SectionHeading } from '@/components/ui';
import { Avatar } from '@/components/avatar';
import { RoundsCalendar } from '@/components/rounds-calendar';
import { roundsHistory } from '@/lib/training/rounds-service';

export const metadata: Metadata = { title: 'Trainee' };
export const dynamic = 'force-dynamic';

/**
 * One person's answers: overall, module by module, the topics they are
 * weakest on, and the questions they most recently got wrong with what they
 * chose and what was right. A coach sees only people the firm supervises;
 * anybody else is not found, the same answer as somebody who does not exist.
 */
export default async function AdminTraineePage({ params }: { params: Promise<{ id: string }> }) {
  const { isAdmin, userId } = await requireCoach();
  // The reader's own clock: a 7am session in Kuala Lumpur is the evening
  // before in UTC, where the server keeps time.
  const timeZone = (await getLearnerProfile(userId))?.timezone ?? DEFAULT_TIMEZONE;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  if (!(await staffMayRead(id, isAdmin))) notFound();
  const person = await learnerDetail(id, isAdmin);
  if (!person) notFound();
  // Their mornings: four rounds a working day, and which were missed.
  const mornings = person.trainee ? await roundsHistory(id).catch(() => null) : null;
  const missed = mornings
    ? mornings.days.reduce((n, d) => n + d.rounds.filter((r) => r.state === 'missed').length, 0)
    : 0;

  const percent = person.totalAnswered
    ? Math.floor((person.totalRight / person.totalAnswered) * 100)
    : null;
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <Link href="/admin/trainees" className="-my-2 inline-block py-2 text-sm text-slate hover:text-ink">
          ← All trainees
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Avatar url={person.avatarUrl} cartoon={person.cartoon} name={person.name} size={48} />
          <h1 className="text-3xl">{person.name}</h1>
          {person.trainee ? <Pill tone="accent">Trainee</Pill> : null}
        </div>
        <p className="mt-2 text-slate tabular-nums">
          {person.totalAnswered === 0
            ? 'Has not answered any questions yet.'
            : `${person.totalAnswered} questions answered, ${person.totalRight} right (${percent}%).`}
        </p>
      </section>

      {mornings && mornings.days.length > 0 ? (
        <section>
          <SectionHeading
            eyebrow="Rounds, 7am to 11am Kuala Lumpur time"
            title={missed === 0 ? 'No rounds missed' : `${missed} round${missed === 1 ? '' : 's'} missed`}
          />
          <Card>
            <RoundsCalendar days={mornings.days} today={mornings.days[mornings.days.length - 1].date} />
          </Card>
        </section>
      ) : null}

      <section>
        <SectionHeading eyebrow="Required and optional" title="Modules" />
        {person.modules.length === 0 ? (
          <p className="text-sm text-slate">No module has published questions yet.</p>
        ) : (
          <Card>
            <ul className="space-y-4">
              {person.modules.map((m) => {
                const score = m.total ? Math.floor((m.correctOnce / m.total) * 100) : 0;
                return (
                  <li key={m.module.slug}>
                    <ScoreBar
                      label={`${m.module.name}${m.module.required ? ' (required)' : ''}: ${m.correctOnce} of ${m.total} done`}
                      score={score}
                      unit="%"
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
          <p className="text-sm text-slate">
            None to show: every topic they have answered twice or more is mastered, or they have
            not answered enough yet.
          </p>
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
