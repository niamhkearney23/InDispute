import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { requireAccess } from '@/lib/access/service';
import { asCountry } from '@/lib/types';
import { studioExercisesFor, viewerIsStaff } from '@/lib/content/service';
import { attemptsFor, latestConsent, ownAttempt, playbackUrl, reviewsFor } from '@/lib/studio/service';
import { NOTICE_VERSION } from '@/lib/studio/rules';
import { AttemptReview } from '@/components/advocacy-studio/attempt-review';

export const metadata: Metadata = { title: 'Your advocacy review' };

/** Transcription and feedback run from this page's button, and can take most of a minute. */
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One of the learner's own recordings: play it back, read the transcript,
 * the AI's feedback (once asked for), and any coach's review. Read through
 * the learner's own session, so the database's rules decide what is theirs.
 */
export default async function StudioAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAccess();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/studio/attempts/${id}`);
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');

  const attempt = await ownAttempt(user.id, id);
  if (!attempt) notFound();

  const staff = await viewerIsStaff(user.id);
  const [exercises, consent, history, reviews, mediaUrl] = await Promise.all([
    studioExercisesFor(asCountry(profile.country), staff),
    latestConsent(user.id),
    attemptsFor(user.id),
    reviewsFor(attempt.id),
    attempt.deletedAt || attempt.status === 'awaiting_upload' ? null : playbackUrl(attempt.path),
  ]);

  const titles = new Map(exercises.map((e) => [e.exercise.slug, e.exercise.title]));
  // The same exercise in the same wording, so "practise again" is the one recorded.
  const current = exercises.find((e) => e.exercise.slug === attempt.exerciseKey && e.hash === attempt.exerciseHash);
  const withFollowUp = (slug: string | null) =>
    slug && titles.has(slug) ? { slug, title: titles.get(slug)! } : null;

  // The last attempt at the same exercise before this one that has feedback.
  const previous =
    (history ?? []).find(
      (a) =>
        a.id !== attempt.id &&
        a.exerciseKey === attempt.exerciseKey &&
        a.startedAt < attempt.startedAt &&
        a.feedback !== null,
    ) ?? null;
  const previousScores = previous?.feedback
    ? Object.fromEntries(
        previous.feedback.scores
          .filter((s) => s.status === 'assessed' && s.score !== null)
          .map((s) => [s.dimension, s.score as number]),
      )
    : null;

  return (
    <AttemptReview
      attemptId={attempt.id}
      exerciseSlug={current ? current.exercise.slug : null}
      exerciseTitle={titles.get(attempt.exerciseKey) ?? 'Practice recording'}
      status={attempt.status}
      kind={attempt.kind}
      mediaUrl={mediaUrl}
      transcript={attempt.transcript}
      segments={attempt.segments}
      feedback={attempt.feedback}
      failure={attempt.failure}
      aiProcessing={attempt.aiProcessing}
      shared={attempt.sharedWithTrainer}
      mayShare={Boolean(consent?.trainerSharing && consent.noticeVersion === NOTICE_VERSION)}
      previousScores={previousScores}
      previousAttemptId={previous?.id ?? null}
      nextExercise={withFollowUp(attempt.feedback?.next_exercise ?? null)}
      reviews={reviews.map((r) => ({ ...r, followUp: withFollowUp(r.followUp) }))}
    />
  );
}
