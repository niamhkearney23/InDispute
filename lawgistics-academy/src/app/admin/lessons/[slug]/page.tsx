import type { Metadata } from 'next';
import { longAnswerCue } from '@/lib/review/answer-cue';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireReviewer } from '@/lib/admin/guard';
import { lessonBySlug } from '@/content/seed/lessons';
import { moduleBySlug } from '@/content/seed/modules';
import { currentSignOffs, lessonHash } from '@/lib/lessons/signoff';
import { Card, Notice, Pill, cn } from '@/components/ui';
import { LessonPlayer } from '@/app/(app)/modules/[slug]/lesson-player';
import { SignOffForm } from './sign-off-form';

export const metadata: Metadata = { title: 'Lesson' };
export const dynamic = 'force-dynamic';

/**
 * One lesson laid out flat for a reviewer: the story, every screen, every
 * guess with the answer it marks right. Then the same lesson as a learner
 * sees it, and the sign-off.
 */
export default async function AdminLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireReviewer();
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) notFound();
  const signOff = (await currentSignOffs()).get(lesson.slug);
  const replaced = lesson.replaces ? lessonBySlug(lesson.replaces) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <Link
          href="/admin/lessons"
          className="-my-2 inline-block py-2 text-sm text-slate hover:text-ink"
        >
          ← All lessons
        </Link>
        <p className="eyebrow mt-2 mb-2">
          {moduleBySlug(lesson.moduleSlug)?.name ?? lesson.moduleSlug} ·{' '}
          {lesson.country === 'MY' ? 'Malaysia' : 'Australia'}
        </p>
        <h1 className="text-3xl">{lesson.title}</h1>
        <div className="mt-3">
          {signOff ? (
            <Pill tone="correct">
              Signed off by {signOff.name},{' '}
              {new Date(signOff.signedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Pill>
          ) : lesson.replaces ? (
            <Pill tone="warn">
              Not signed off: learners still see &ldquo;{replaced?.title}&rdquo;
            </Pill>
          ) : (
            <Pill tone="neutral">Live, not yet checked by a lawyer</Pill>
          )}
        </div>
      </section>

      {lesson.replaces ? (
        <Notice tone="warn">
          Drafted with AI help. Read it as you would a junior&rsquo;s first draft: every statement
          of law, every guess and every answer marked right.
        </Notice>
      ) : null}

      {lesson.scene ? (
        <Card>
          <p className="eyebrow mb-2">The story · {lesson.scene.who}</p>
          <p>{lesson.scene.setup}</p>
        </Card>
      ) : null}

      <ol className="space-y-4">
        {lesson.steps.map((step, i) => (
          <li key={step.heading}>
            <Card>
              <p className="eyebrow mb-2 text-accent">
                Screen {i + 1}: {step.heading}
              </p>
              {step.guess ? (
                <div className="mb-4 rounded-lg border border-rule bg-paper-sunk p-4">
                  <p className="mb-2 text-sm font-semibold">Guess first: {step.guess.prompt}</p>
                  <ul className="space-y-1 text-sm">
                    {step.guess.options.map((o) => (
                      <li
                        key={o.id}
                        className={cn(
                          o.id === step.guess!.answer && 'font-semibold text-verdict-correct',
                        )}
                      >
                        {o.id.toUpperCase()}. {o.text}
                        {o.id === step.guess!.answer ? ' (marked right)' : ''}
                      </li>
                    ))}
                  </ul>
                  {longAnswerCue(step.guess.options, [step.guess.answer]) ? (
                    <p className="mt-2 text-sm text-warn">
                      The right answer is much longer than the others, which gives it away. Even
                      the lengths out before you sign this off.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <p className="leading-relaxed">{step.body}</p>
              {step.takeaway ? (
                <p className="mt-3 border-l-2 border-accent pl-4 font-serif">{step.takeaway}</p>
              ) : null}
            </Card>
          </li>
        ))}
      </ol>

      <section>
        <h2 className="mb-3 text-xl">As a learner sees it</h2>
        <LessonPlayer
          lesson={lesson}
          country={lesson.country}
          moduleSlug={lesson.moduleSlug}
          quizLabel=""
          preview
        />
      </section>

      <section className="border-t border-rule pt-6">
        {signOff ? (
          <p className="text-sm text-slate">
            Signed off in this wording. If any of it changes, it comes back here to be signed again.
          </p>
        ) : (
          <SignOffForm slug={lesson.slug} hash={lessonHash(lesson)} />
        )}
      </section>
    </div>
  );
}
