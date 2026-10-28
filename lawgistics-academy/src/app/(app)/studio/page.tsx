import type { Metadata } from 'next';
import Link from '@/components/app-link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { requireAccess } from '@/lib/access/service';
import { aiCompany } from '@/lib/ai/provider';
import { asCountry } from '@/lib/types';
import { studioExercisesFor, viewerIsStaff } from '@/lib/content/service';
import { attemptsFor, latestConsent } from '@/lib/studio/service';
import { transcriptionAvailable } from '@/lib/studio/transcribe';
import { NOTICE_VERSION, STATUS_LABELS, mayRecord, spokenLength } from '@/lib/studio/rules';
import { Card, Notice, Pill } from '@/components/ui';
import { StudioConsentForm } from '@/components/advocacy-studio/consent-form';

export const metadata: Metadata = { title: 'Advocacy Studio' };

const COMPANY = { openai: 'OpenAI', anthropic: 'Anthropic' } as const;

/**
 * The Advocacy Studio's front page: the consent first if it has not been
 * given on the current notice, then the exercises a lawyer has signed off,
 * then what this person recorded before.
 */
export default async function StudioPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/studio');
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');
  if (!profile.onboardedAt) redirect('/onboarding');

  const staff = await viewerIsStaff(user.id);
  const [consent, exercises, attempts] = await Promise.all([
    latestConsent(user.id),
    studioExercisesFor(asCountry(profile.country), staff),
    attemptsFor(user.id),
  ]);
  const provider = aiCompany();
  const company = provider ? COMPANY[provider] : null;
  const transcription = transcriptionAvailable();
  const ready = mayRecord(consent);
  const current = consent && consent.noticeVersion === NOTICE_VERSION ? consent : null;
  const titles = new Map(exercises.map((e) => [e.exercise.slug, e.exercise.title]));
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const consentForm = (
    <StudioConsentForm
      aiCompany={company}
      transcription={transcription}
      current={
        current
          ? { recording: current.recording, aiProcessing: current.aiProcessing, trainerSharing: current.trainerSharing }
          : null
      }
    />
  );

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">Advocacy Studio</p>
        <h1 className="text-3xl sm:text-4xl">Record. Review. Refine.</h1>
        <p className="mt-3 max-w-xl text-slate">
          Stand up, make a short submission to the camera, and watch it back with feedback that
          quotes what you actually said. Practice only: nothing here is marked or counted.
        </p>
      </section>

      {!ready ? (
        <Card>
          <h2 className="mb-1 font-sans text-xl font-semibold">Before you record</h2>
          {consent && consent.noticeVersion !== NOTICE_VERSION ? (
            <p className="mb-4 text-sm text-slate">
              What happens to recordings has changed since you last chose, so please choose again.
            </p>
          ) : null}
          {consentForm}
        </Card>
      ) : null}

      <section aria-labelledby="studio-exercises">
        <h2 id="studio-exercises" className="mb-3 text-xl">
          Exercises
        </h2>
        {exercises.length === 0 ? (
          <Notice tone="neutral">
            No exercise has been checked by a lawyer yet. They appear here once one has signed
            them off.
          </Notice>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {exercises.map(({ exercise, checked }) => (
              <li key={exercise.slug}>
                <Card className="flex h-full flex-col">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="eyebrow">Up to {spokenLength(exercise.maxSeconds)}</span>
                    {!checked ? <Pill tone="warn">Not yet checked by a lawyer</Pill> : null}
                  </div>
                  <h3 className="font-sans text-lg font-semibold">{exercise.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-slate">{exercise.task}</p>
                  {ready ? (
                    <Link
                      href={`/studio/${exercise.slug}`}
                      className="mt-4 inline-flex min-h-11 items-center font-medium underline underline-offset-4"
                    >
                      Open the exercise
                    </Link>
                  ) : (
                    <p className="mt-4 text-sm text-muted">Make your choices above to record.</p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="studio-history">
        <h2 id="studio-history" className="mb-3 text-xl">
          Your recordings
        </h2>
        {attempts === null ? (
          <Notice tone="warn">Your recordings could not be read just now. Please try again.</Notice>
        ) : attempts.length === 0 ? (
          <p className="text-sm text-slate">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y divide-rule rounded-lg border border-rule bg-paper-raised">
            {attempts.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/studio/attempts/${a.id}`}
                  className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 hover:bg-paper-sunk"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {titles.get(a.exerciseKey) ?? 'Practice recording'}
                    </span>
                    <span className="text-xs text-slate">
                      {STATUS_LABELS[a.status]}
                      {a.sharedWithTrainer && !a.deletedAt ? ' · Shared with your coaches' : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{day(a.startedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ready ? (
        <details className="rounded-lg border border-rule bg-paper-raised">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">
            Your choices about recordings
          </summary>
          <div className="border-t border-rule px-4 py-4">{consentForm}</div>
        </details>
      ) : null}
    </div>
  );
}
