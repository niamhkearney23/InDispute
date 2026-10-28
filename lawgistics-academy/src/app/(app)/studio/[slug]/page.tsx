import type { Metadata } from 'next';
import Link from '@/components/app-link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { requireAccess } from '@/lib/access/service';
import { asCountry } from '@/lib/types';
import { studioExerciseFor, viewerIsStaff } from '@/lib/content/service';
import { latestConsent } from '@/lib/studio/service';
import { DIMENSION_LABELS, NO_AUTHORITIES, mayRecord, spokenLength } from '@/lib/studio/rules';
import { Card, Notice, Pill } from '@/components/ui';
import { StudioRecorder } from '@/components/advocacy-studio/recorder';

export const metadata: Metadata = { title: 'Advocacy Studio' };

/** Feedback is asked for from this page as soon as the upload finishes. */
export const maxDuration = 60;

/**
 * One exercise: the task, the invented facts, how to prepare, what the
 * feedback looks for, and the recorder. Only an exercise this person may be
 * shown reaches the page (studioExerciseFor), and the recorder is given the
 * slug alone; the server looks the wording up again when the attempt starts.
 */
export default async function StudioExercisePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAccess();
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/studio/${encodeURIComponent(slug)}`);
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');
  if (!profile.onboardedAt) redirect('/onboarding');

  const [shown, consent] = await Promise.all([
    studioExerciseFor(slug, asCountry(profile.country), await viewerIsStaff(user.id)),
    latestConsent(user.id),
  ]);
  if (!shown) notFound();
  if (!mayRecord(consent)) redirect('/studio');
  const { exercise, checked } = shown;

  return (
    <div className="space-y-8">
      <section>
        <Link href="/studio" className="inline-flex min-h-11 items-center text-sm text-slate underline underline-offset-4">
          Advocacy Studio
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">{exercise.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="eyebrow">Up to {spokenLength(exercise.maxSeconds)}</span>
          {!checked ? <Pill tone="warn">Not yet checked by a lawyer</Pill> : null}
        </div>
        {!checked ? (
          <p className="mt-2 max-w-xl text-sm text-slate">
            You see this because you are staff. Learners do not see it until a lawyer signs it off
            at Admin, Courts and essays.
          </p>
        ) : null}
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
        <div className="space-y-6">
          <Card>
            <h2 className="eyebrow mb-2">Your task</h2>
            <p className="text-[1.0625rem] leading-relaxed">{exercise.task}</p>
          </Card>

          {exercise.facts.length ? (
            <section>
              <h2 className="mb-2 text-xl">The facts</h2>
              <ul className="list-disc space-y-2 pl-5 text-[0.9375rem] leading-relaxed">
                {exercise.facts.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {exercise.preparation.length ? (
            <section>
              <h2 className="mb-2 text-xl">Before you start</h2>
              <ol className="list-decimal space-y-2 pl-5 text-[0.9375rem] leading-relaxed">
                {exercise.preparation.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ol>
            </section>
          ) : null}

          {exercise.authorities.length ? (
            <section>
              <h2 className="mb-2 text-xl">Authorities you may cite</h2>
              <ul className="space-y-2 text-[0.9375rem]">
                {exercise.authorities.map((a) => (
                  <li key={a.citation}>
                    <span className="font-medium">{a.citation}</span>
                    <span className="block text-slate">{a.proposition}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="mb-2 text-xl">What the feedback looks for</h2>
            <dl className="space-y-3 text-[0.9375rem]">
              {exercise.rubric.map((c) => (
                <div key={c.dimension}>
                  <dt className="font-medium">{DIMENSION_LABELS[c.dimension]}</dt>
                  <dd className="text-slate">{c.criterion}</dd>
                </div>
              ))}
            </dl>
            {exercise.authorities.length === 0 ? (
              <p className="mt-3 text-sm text-slate">{NO_AUTHORITIES}</p>
            ) : null}
          </section>
        </div>

        <section aria-label="Record" className="space-y-4">
          <StudioRecorder
            exerciseSlug={exercise.slug}
            maxSeconds={exercise.maxSeconds}
            aiFeedback={consent!.aiProcessing}
          />
          <Notice tone="neutral">
            Use only the facts above. Never record anything about a real client or a real case.
          </Notice>
        </section>
      </div>
    </div>
  );
}
