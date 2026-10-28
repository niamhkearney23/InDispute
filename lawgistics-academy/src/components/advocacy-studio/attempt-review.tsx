'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/app-link';
import {
  deleteStudioRecording,
  requestStudioFeedback,
  setStudioSharing,
} from '@/app/(app)/studio/actions';
import { Button, ButtonLink, Notice, Pill, cn } from '@/components/ui';
import {
  DIMENSION_LABELS,
  STATUS_LABELS,
  type AttemptStatus,
  type DimensionScore,
  type Evidence,
  type FeedbackComment,
  type StudioFeedback,
  type TranscriptSegment,
} from '@/lib/studio/rules';

export interface ReviewProps {
  attemptId: string;
  /** Null when the exercise has been withdrawn or changed since. */
  exerciseSlug: string | null;
  exerciseTitle: string;
  status: AttemptStatus;
  kind: 'video' | 'audio' | null;
  mediaUrl: string | null;
  transcript: string | null;
  segments: TranscriptSegment[] | null;
  feedback: StudioFeedback | null;
  failure: string | null;
  aiProcessing: boolean;
  shared: boolean;
  mayShare: boolean;
  previousScores: Partial<Record<string, number>> | null;
  previousAttemptId: string | null;
  nextExercise: { slug: string; title: string } | null;
  reviews: Array<{
    id: string;
    reviewerName: string;
    feedback: string;
    scoreOverrides: Record<string, number | 'not_assessed'>;
    commentDecisions: Record<string, 'approved' | 'rejected'>;
    followUp: { slug: string; title: string } | null;
    createdAt: string;
  }>;
}

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export function AttemptReview(props: ReviewProps) {
  const router = useRouter();
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const latest = props.reviews[0] ?? null;

  const seek = (at: number) => {
    const el = mediaRef.current;
    if (!el) return;
    el.currentTime = at;
    el.play().catch(() => {});
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const run = (fn: () => Promise<{ error: string } | object>) =>
    startTransition(async () => {
      setMessage(null);
      const result = await fn();
      if ('error' in result) setMessage((result as { error: string }).error);
      router.refresh();
    });

  const deleted = props.status === 'deleted';

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
      {/* The recording and its transcript ----------------------------------- */}
      <section aria-label="Your recording" className="space-y-5">
        <div className="overflow-hidden rounded-lg border border-rule bg-ink">
          {deleted || !props.mediaUrl ? (
            <div className="flex aspect-video items-center justify-center p-6 text-center text-paper/80">
              {deleted ? 'You deleted this recording.' : 'The recording could not be loaded just now.'}
            </div>
          ) : props.kind === 'audio' ? (
            <div className="flex aspect-video items-center justify-center p-6">
              <audio ref={mediaRef} src={props.mediaUrl} controls className="w-full max-w-md" />
            </div>
          ) : (
            <video ref={mediaRef} src={props.mediaUrl} controls playsInline className="aspect-video w-full bg-ink" />
          )}
        </div>

        {props.transcript ? (
          <details className="group rounded-lg border border-rule bg-paper-raised" open>
            <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 font-medium">
              Transcript
              <span className="text-sm text-slate group-open:hidden">Show</span>
            </summary>
            <div className="border-t border-rule px-4 py-3 text-[0.9375rem] leading-relaxed">
              {props.segments ? (
                <ol className="space-y-2">
                  {props.segments.map((seg, i) => (
                    <li key={i} className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => seek(seg.start)}
                        className="min-h-11 shrink-0 font-mono text-xs text-slate underline-offset-2 hover:text-ink hover:underline"
                        aria-label={`Play from ${clock(seg.start)}`}
                      >
                        {clock(seg.start)}
                      </button>
                      <span className="pt-3">{seg.text}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="whitespace-pre-line">{props.transcript}</p>
              )}
              <p className="mt-3 text-xs text-slate">
                Made by machine transcription. It can mishear names and legal terms.
              </p>
            </div>
          </details>
        ) : null}

        {!deleted ? (
          <div className="space-y-3 rounded-lg border border-rule bg-paper-raised p-4 text-sm">
            <p className="eyebrow">Who can see this</p>
            <p className="text-slate">
              {props.shared
                ? 'You and the academy’s coaches. Each time a coach opens it, that is recorded.'
                : 'Only you.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {props.shared ? (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setStudioSharing(props.attemptId, false))}>
                  Stop sharing with coaches
                </Button>
              ) : props.mayShare ? (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setStudioSharing(props.attemptId, true))}>
                  Share with my coaches
                </Button>
              ) : null}
              {confirmDelete ? (
                <>
                  <Button size="sm" variant="primary" disabled={pending} onClick={() => run(() => deleteStudioRecording(props.attemptId))}>
                    Yes, delete it for good
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                    Keep it
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
                  Delete this recording
                </Button>
              )}
            </div>
          </div>
        ) : null}
        {message ? <Notice tone="error">{message}</Notice> : null}
      </section>

      {/* The review ---------------------------------------------------------- */}
      <section aria-labelledby="review-heading" className="space-y-8">
        <header className="space-y-2">
          <p className="eyebrow">{props.exerciseTitle}</p>
          <h1 id="review-heading" className="font-serif text-4xl leading-[1.05] sm:text-5xl">
            Your advocacy review
          </h1>
        </header>

        {props.status === 'feedback' && props.feedback ? (
          <AiFeedback
            feedback={props.feedback}
            previous={props.previousScores}
            decisions={latest?.commentDecisions ?? {}}
            onSeek={seek}
          />
        ) : (
          <StatusPanel
            status={props.status}
            failure={props.failure}
            aiProcessing={props.aiProcessing}
            pending={pending}
            onRequest={() => run(() => requestStudioFeedback(props.attemptId))}
          />
        )}

        {props.reviews.length > 0 ? (
          <section aria-labelledby="trainer-heading" className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 id="trainer-heading" className="text-2xl">
                Trainer feedback
              </h2>
              <Pill tone="accent">Written by a person</Pill>
            </div>
            {props.reviews.map((r, i) => (
              <article key={r.id} className={cn('rounded-lg border bg-paper-raised p-5', i === 0 ? 'border-accent/30' : 'border-rule opacity-90')}>
                <p className="text-sm text-slate">
                  {r.reviewerName},{' '}
                  {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {i > 0 ? ' (an earlier review)' : ''}
                </p>
                <p className="mt-2 whitespace-pre-line leading-relaxed">{r.feedback}</p>
                {Object.keys(r.scoreOverrides).length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                    {Object.entries(r.scoreOverrides).map(([dim, v]) => (
                      <li key={dim} className="rounded-full border border-rule-strong px-3 py-1">
                        {DIMENSION_LABELS[dim as keyof typeof DIMENSION_LABELS] ?? dim}: {v === 'not_assessed' ? 'not assessed' : `${v} of 10`}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {r.followUp ? (
                  <p className="mt-3 text-sm">
                    Practise next:{' '}
                    <Link href={`/studio/${r.followUp.slug}`} className="font-medium underline underline-offset-2">
                      {r.followUp.title}
                    </Link>
                  </p>
                ) : null}
              </article>
            ))}
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-rule pt-6">
          {props.exerciseSlug ? (
            <ButtonLink href={`/studio/${props.exerciseSlug}`} variant="accent">
              Practise again
            </ButtonLink>
          ) : null}
          {props.previousAttemptId ? (
            <ButtonLink href={`/studio/attempts/${props.previousAttemptId}`} variant="outline">
              Your previous attempt
            </ButtonLink>
          ) : null}
          {props.nextExercise ? (
            <ButtonLink href={`/studio/${props.nextExercise.slug}`} variant="outline">
              Next: {props.nextExercise.title}
            </ButtonLink>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StatusPanel({
  status,
  failure,
  aiProcessing,
  pending,
  onRequest,
}: {
  status: AttemptStatus;
  failure: string | null;
  aiProcessing: boolean;
  pending: boolean;
  onRequest: () => void;
}) {
  if (status === 'deleted') return <Notice>This recording was deleted, with its transcript and feedback.</Notice>;
  if (!aiProcessing) {
    return (
      <Notice>
        You chose not to send this recording for AI feedback. Watch it back, and share it with your
        coaches if you would like a person to review it.
      </Notice>
    );
  }
  if (status === 'processing') {
    return (
      <div className="space-y-3">
        <Notice>Your feedback is being prepared. This page shows it once it is ready.</Notice>
        <Button variant="outline" onClick={() => location.reload()}>
          Check again
        </Button>
      </div>
    );
  }
  if (status === 'not_configured') {
    return (
      <Notice tone="warn">
        AI feedback is not switched on for this academy yet, so none was made. Your recording is kept,
        and you can share it with your coaches for a person&rsquo;s review.
      </Notice>
    );
  }
  return (
    <div className="space-y-3">
      {status === 'failed' ? (
        <Notice tone="error">{failure ?? 'Feedback could not be prepared.'} You can try again.</Notice>
      ) : (
        <p className="text-slate">{STATUS_LABELS[status]}.</p>
      )}
      {status === 'uploaded' || status === 'failed' ? (
        <Button variant="accent" disabled={pending} onClick={onRequest}>
          {pending ? 'Preparing your feedback…' : status === 'failed' ? 'Try again' : 'Get my feedback'}
        </Button>
      ) : null}
    </div>
  );
}

function EvidenceList({ evidence, onSeek }: { evidence: Evidence[]; onSeek: (at: number) => void }) {
  if (evidence.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {evidence.map((e, i) => (
        <li key={i} className="flex items-start gap-2 text-[0.9375rem]">
          {e.at !== null ? (
            <button
              type="button"
              onClick={() => onSeek(e.at!)}
              className="min-h-11 shrink-0 rounded-[4px] border border-rule-strong px-2 font-mono text-xs text-slate hover:bg-paper-sunk hover:text-ink"
              aria-label={`Play from ${clock(e.at)}`}
            >
              {clock(e.at)}
            </button>
          ) : null}
          <q className={cn('italic text-charcoal', e.at !== null && 'pt-3')}>{e.quote}</q>
        </li>
      ))}
    </ul>
  );
}

function CommentList({
  title,
  comments,
  decisions,
  onSeek,
}: {
  title: string;
  comments: FeedbackComment[];
  decisions: Record<string, 'approved' | 'rejected'>;
  onSeek: (at: number) => void;
}) {
  if (comments.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-2xl">{title}</h2>
      <ul className="space-y-4">
        {comments.map((c) => (
          <li key={c.id} className="border-l-2 border-citron pl-4">
            <p className={cn('leading-relaxed', decisions[c.id] === 'rejected' && 'text-slate line-through')}>{c.text}</p>
            {decisions[c.id] === 'rejected' ? (
              <p className="mt-1 text-sm text-slate">Your trainer disagreed with this comment.</p>
            ) : decisions[c.id] === 'approved' ? (
              <p className="mt-1 text-sm text-slate">Your trainer agreed with this comment.</p>
            ) : null}
            <EvidenceList evidence={c.evidence} onSeek={onSeek} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ScoreRow({ s, previous, onSeek }: { s: DimensionScore; previous: number | undefined; onSeek: (at: number) => void }) {
  return (
    <li className="rounded-lg border border-rule bg-paper-raised p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium">{DIMENSION_LABELS[s.dimension]}</h3>
        {s.status === 'assessed' ? (
          <p className="font-serif text-2xl tabular-nums">
            {s.score}
            <span className="text-base text-slate"> of 10</span>
            {previous !== undefined ? (
              <span className="ml-2 font-sans text-sm text-slate">last time {previous}</span>
            ) : null}
          </p>
        ) : (
          <Pill>Not assessed</Pill>
        )}
      </div>
      <p className="mt-1 text-sm text-slate">{s.criterion}</p>
      {s.status === 'assessed' ? (
        <>
          <EvidenceList evidence={s.evidence} onSeek={onSeek} />
          {s.improvement ? <p className="mt-3 leading-relaxed"><span className="font-medium">Next time: </span>{s.improvement}</p> : null}
          {s.uncertainty ? <p className="mt-2 text-sm text-slate">{s.uncertainty}</p> : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-slate">{s.reason}</p>
      )}
    </li>
  );
}

function AiFeedback({
  feedback,
  previous,
  decisions,
  onSeek,
}: {
  feedback: StudioFeedback;
  previous: Partial<Record<string, number>> | null;
  decisions: Record<string, 'approved' | 'rejected'>;
  onSeek: (at: number) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Pill tone="neutral">AI-generated feedback</Pill>
        {feedback.overall_summary ? (
          <p className="font-serif text-2xl leading-snug">{feedback.overall_summary}</p>
        ) : null}
      </div>

      <CommentList title="What worked" comments={feedback.strengths} decisions={decisions} onSeek={onSeek} />
      <CommentList title="What needs attention" comments={feedback.areas_to_improve} decisions={decisions} onSeek={onSeek} />

      <section className="space-y-3">
        <h2 className="text-2xl">Against the rubric</h2>
        <p className="text-sm text-slate">
          Each mark is out of 10 and stands on its own: there is no total. A mark is given only where
          your words support it.
        </p>
        <ul className="space-y-3">
          {feedback.scores.map((s) => (
            <ScoreRow key={s.dimension} s={s} previous={previous?.[s.dimension]} onSeek={onSeek} />
          ))}
        </ul>
      </section>

      {feedback.delivery.wordsPerMinute !== null ? (
        <section className="space-y-1">
          <h2 className="text-2xl">Pace</h2>
          <p className="leading-relaxed">
            {feedback.delivery.words} words in {clock(feedback.delivery.seconds)}: about{' '}
            {feedback.delivery.wordsPerMinute} words a minute. Counted from the transcript, not judged
            by the AI.
          </p>
        </section>
      ) : null}

      <details className="rounded-lg border border-rule bg-paper-raised">
        <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">
          What this feedback can and cannot tell you
        </summary>
        <ul className="list-disc space-y-1.5 border-t border-rule px-4 py-3 pl-9 text-sm leading-relaxed text-slate">
          {feedback.confidence_limitations.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
          {feedback.dropped > 0 ? (
            <li>
              {feedback.dropped} {feedback.dropped === 1 ? 'comment or quotation' : 'comments or quotations'} the
              AI offered {feedback.dropped === 1 ? 'was' : 'were'} not shown, because your recording did not
              support {feedback.dropped === 1 ? 'it' : 'them'}.
            </li>
          ) : null}
          <li>Prepared in {(feedback.processing_time_ms / 1000).toFixed(1)} seconds.</li>
        </ul>
      </details>
    </div>
  );
}
