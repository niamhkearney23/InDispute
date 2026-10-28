import type { Metadata } from 'next';
import Link from '@/components/app-link';
import { notFound } from 'next/navigation';
import { requireReviewer } from '@/lib/admin/guard';
import { asCountry } from '@/lib/types';
import { studioExercisesFor } from '@/lib/content/service';
import { logStudioAccess, playbackUrl, reviewsFor, sharedAttempt } from '@/lib/studio/service';
import { DIMENSION_LABELS, STATUS_LABELS, type FeedbackComment } from '@/lib/studio/rules';
import { Card, Notice, Pill } from '@/components/ui';
import { StudioReviewForm } from '../review-form';

export const metadata: Metadata = { title: 'Review a recording' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One shared recording, for a coach to watch and review. The opening is
 * written to the access log before anything is shown; if it cannot be
 * written, nothing is shown, because the learner was told it would be.
 */
export default async function AdminStudioAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireReviewer();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const attempt = await sharedAttempt(id);
  if (!attempt) notFound();

  if (!(await logStudioAccess(attempt.id, userId, 'opened'))) {
    return (
      <Notice tone="error">
        This recording cannot be shown just now, because opening it could not be recorded. Please
        try again.
      </Notice>
    );
  }

  const [staffView, learnerView, reviews, mediaUrl] = await Promise.all([
    studioExercisesFor('MY', true),
    studioExercisesFor(asCountry(attempt.learnerCountry), false),
    reviewsFor(attempt.id, true),
    playbackUrl(attempt.path),
  ]);
  const exercise = staffView.find((e) => e.exercise.slug === attempt.exerciseKey) ?? null;
  const feedback = attempt.feedback;
  const own = attempt.userId === userId;
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <section>
        <Link href="/admin/studio" className="inline-flex min-h-11 items-center text-sm text-slate underline underline-offset-4">
          All shared recordings
        </Link>
        <h1 className="mt-1 text-3xl">{attempt.learnerName}</h1>
        <p className="mt-2 text-slate">
          {exercise?.exercise.title ?? attempt.exerciseKey}, recorded {day(attempt.startedAt)}.{' '}
          {STATUS_LABELS[attempt.status]}.
        </p>
        {exercise && exercise.hash !== attempt.exerciseHash ? (
          <p className="mt-2 text-sm text-warn">
            The exercise&rsquo;s wording has changed since this was recorded.
          </p>
        ) : null}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-lg border border-rule bg-ink">
            {!mediaUrl ? (
              <div className="flex aspect-video items-center justify-center p-6 text-center text-paper/80">
                The recording could not be loaded just now.
              </div>
            ) : attempt.kind === 'audio' ? (
              <div className="flex aspect-video items-center justify-center p-6">
                <audio src={mediaUrl} controls className="w-full max-w-md" />
              </div>
            ) : (
              <video src={mediaUrl} controls playsInline className="aspect-video w-full bg-ink" />
            )}
          </div>

          {attempt.transcript ? (
            <details className="rounded-lg border border-rule bg-paper-raised" open>
              <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">Transcript</summary>
              <p className="border-t border-rule px-4 py-3 text-[0.9375rem] leading-relaxed whitespace-pre-line">
                {attempt.transcript}
              </p>
            </details>
          ) : (
            <p className="text-sm text-slate">No transcript: the learner did not ask for AI feedback on this one.</p>
          )}
        </div>

        <div className="space-y-6">
          {feedback ? (
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="font-sans text-lg font-semibold">The AI&rsquo;s feedback</h2>
                <Pill tone="warn">AI generated</Pill>
              </div>
              <p className="text-[0.9375rem]">{feedback.overall_summary}</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {feedback.scores.map((s) => (
                  <div key={s.dimension}>
                    <dt className="text-slate">{DIMENSION_LABELS[s.dimension]}</dt>
                    <dd className="font-medium tabular-nums">
                      {s.status === 'assessed' && s.score !== null ? `${s.score} of 10` : 'Not assessed'}
                    </dd>
                  </div>
                ))}
              </dl>
              <CommentList title="Strengths" comments={feedback.strengths} />
              <CommentList title="To work on" comments={feedback.areas_to_improve} />
            </Card>
          ) : null}

          {reviews.length ? (
            <section className="space-y-3">
              <h2 className="text-xl">Earlier reviews</h2>
              {reviews.map((r) => (
                <Card key={r.id}>
                  <p className="text-sm text-slate">
                    {r.reviewerName}, {day(r.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-line">{r.feedback}</p>
                </Card>
              ))}
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-xl">Your review</h2>
            {own ? (
              <Notice tone="neutral">This is your own recording. Somebody else reviews it.</Notice>
            ) : (
              <StudioReviewForm
                attemptId={attempt.id}
                dimensions={(exercise?.exercise.rubric ?? []).map((c) => {
                  const ai = feedback?.scores.find((s) => s.dimension === c.dimension);
                  return { dimension: c.dimension, ai: ai?.status === 'assessed' ? (ai.score ?? null) : null };
                })}
                comments={[...(feedback?.strengths ?? []), ...(feedback?.areas_to_improve ?? [])].map((c) => ({
                  id: c.id,
                  text: c.text,
                }))}
                exercises={learnerView.map((e) => ({ slug: e.exercise.slug, title: e.exercise.title }))}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function CommentList({ title, comments }: { title: string; comments: FeedbackComment[] }) {
  if (comments.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="eyebrow mb-2">{title}</h3>
      <ul className="space-y-2 text-sm">
        {comments.map((c) => (
          <li key={c.id}>
            {c.text}
            {c.evidence.map((e, i) => (
              <q key={i} className="mt-1 block text-slate">
                {e.quote}
              </q>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
