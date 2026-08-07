'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { answerQuestion, finishSession } from '@/app/(app)/actions';
import { CourtHierarchyDiagram } from '@/components/court-hierarchy-diagram';
import { JURISDICTION_COUNTRY } from '@/lib/types';
import { Button, Notice, Pill, cn } from '@/components/ui';
import {
  CONFIDENCE_LABELS,
  JURISDICTION_LABELS,
  JURISDICTION_SHORT,
  type AnswerFeedback,
  type ConfidenceLevel,
  type DeliveredQuestion,
  type SessionKind,
} from '@/lib/types';

const CONFIDENCE_ORDER: ConfidenceLevel[] = ['guess', 'somewhat_sure', 'certain'];

export function SessionRunner({
  sessionId,
  kind,
  questions,
  startIndex,
}: {
  sessionId: string;
  kind: SessionKind;
  questions: DeliveredQuestion[];
  startIndex: number;
}) {
  const [index, setIndex] = useState(Math.min(startIndex, questions.length - 1));
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [finishing, startFinishing] = useTransition();
  // Counted for this sitting only. A resumed session starts partway through, so
  // deriving the tally from the question index would report it wrong.
  const [correctSoFar, setCorrectSoFar] = useState(0);
  const [answeredThisSitting, setAnsweredThisSitting] = useState(0);

  // Set on mount and on every question change by the effect below, reading the
  // clock during render would be impure.
  const shownAt = useRef<number>(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const answered = feedback !== null;

  useEffect(() => {
    shownAt.current = Date.now();
    headingRef.current?.focus();
  }, [index]);

  const submit = useCallback(
    (confidence: ConfidenceLevel) => {
      if (selected.length === 0 || answered || pending) return;
      setError(null);

      const responseMs = shownAt.current
        ? Math.min(Date.now() - shownAt.current, 1000 * 60 * 60)
        : null;

      startTransition(async () => {
        const result = await answerQuestion({
          sessionId,
          questionVersionId: question.questionVersionId,
          selectedOptionIds: selected,
          confidence,
          responseMs,
        });

        if ('error' in result) {
          setError(result.error);
          return;
        }

        setFeedback(result);
        setAnsweredThisSitting((n) => n + 1);
        if (result.isCorrect) setCorrectSoFar((n) => n + 1);
      });
    },
    [answered, pending, question, selected, sessionId],
  );

  function next() {
    if (isLast) {
      startFinishing(() => finishSession(sessionId));
      return;
    }
    setFeedback(null);
    setSelected([]);
    setIndex((i) => i + 1);
  }

  const progress = useMemo(
    () => Math.round(((index + (answered ? 1 : 0)) / questions.length) * 100),
    [index, answered, questions.length],
  );

  if (!question) {
    return (
      <Notice tone="warn">
        This session has no questions left to answer. Return to your dashboard.
      </Notice>
    );
  }

  return (
    <div>
      {/* Progress ------------------------------------------------------- */}
      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="eyebrow">
            {kind === 'diagnostic' ? 'Diagnostic' : 'Daily training'}
          </span>
          <span className="text-muted tabular-nums">
            {index + 1} of {questions.length}
          </span>
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-paper-sunk"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Session progress"
        >
          <div
            className="h-full rounded-full bg-ink transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question -------------------------------------------------------- */}
      <article key={question.questionVersionId} className="rise-in">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Pill>{question.domainName}</Pill>
          <Pill tone={question.jurisdiction === 'AU_GENERAL' ? 'neutral' : 'accent'}>
            <span title={JURISDICTION_LABELS[question.jurisdiction]}>
              {JURISDICTION_SHORT[question.jurisdiction]}
            </span>
          </Pill>
          {question.court ? (
            <span className="text-xs text-muted">{question.court}</span>
          ) : null}
        </div>

        {question.scenario ? (
          <div className="mb-5 border-l-2 border-rule-strong pl-4 text-[0.9375rem] text-slate">
            {question.scenario}
          </div>
        ) : null}

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mb-6 text-xl leading-snug outline-none sm:text-2xl"
        >
          {question.stem}
        </h1>

        {question.questionType === 'court_hierarchy' ? (
          <CourtHierarchyDiagram
            country={JURISDICTION_COUNTRY[question.jurisdiction]}
            options={question.options}
            selected={selected}
            correctOptionIds={feedback?.correctOptionIds ?? null}
            answered={answered}
            disabled={answered || pending}
            onSelect={(optionId) => setSelected([optionId])}
          />
        ) : (
        <div className="space-y-2.5" role="group" aria-label="Answer options">
          {question.options.map((option) => {
            const isSelected = selected.includes(option.id);
            const isCorrectOption = feedback?.correctOptionIds.includes(option.id);
            const isWrongChoice = answered && isSelected && !isCorrectOption;

            return (
              <button
                key={option.id}
                type="button"
                disabled={answered || pending}
                aria-pressed={isSelected}
                onClick={() => setSelected([option.id])}
                className={cn(
                  'flex w-full items-start gap-3 rounded-md border px-4 py-3.5 text-left text-[0.9375rem] transition-colors',
                  !answered && isSelected && 'border-ink bg-paper-sunk',
                  !answered && !isSelected && 'border-rule-strong hover:bg-paper-sunk',
                  answered &&
                    isCorrectOption &&
                    'border-verdict-correct bg-verdict-correct-wash',
                  isWrongChoice && 'border-verdict-wrong bg-verdict-wrong-wash',
                  answered && !isCorrectOption && !isWrongChoice && 'border-rule opacity-55',
                  'disabled:cursor-default',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-semibold',
                    !answered && isSelected && 'border-ink bg-ink text-paper',
                    !answered && !isSelected && 'border-rule-strong text-muted',
                    answered &&
                      isCorrectOption &&
                      'border-verdict-correct bg-verdict-correct text-paper',
                    isWrongChoice && 'border-verdict-wrong bg-verdict-wrong text-paper',
                    answered && !isCorrectOption && !isWrongChoice && 'border-rule text-muted',
                  )}
                  aria-hidden
                >
                  {option.id.length === 1 ? option.id.toUpperCase() : ''}
                </span>
                <span>{option.text}</span>
              </button>
            );
          })}
        </div>
        )}

        {/* Confidence, asked before the verdict, deliberately ----------- */}
        {!answered && selected.length > 0 ? (
          <div className="mt-7 rise-in">
            <p className="mb-3 text-sm font-medium">How sure are you?</p>
            <div className="grid grid-cols-3 gap-2">
              {CONFIDENCE_ORDER.map((level) => (
                <button
                  key={level}
                  type="button"
                  disabled={pending}
                  onClick={() => submit(level)}
                  className="rounded-md border border-rule-strong px-3 py-3 text-sm transition-colors hover:border-burgundy hover:bg-burgundy-wash disabled:opacity-50"
                >
                  {CONFIDENCE_LABELS[level]}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-xs text-muted">
              Answer honestly. Being certain and wrong tells us far more than an admitted
              guess, and it changes what we test you on next.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-5">
            <Notice tone="error">{error}</Notice>
          </div>
        ) : null}

        {/* Feedback ------------------------------------------------------ */}
        {feedback ? <FeedbackPanel feedback={feedback} /> : null}
      </article>

      {/* Sticky rather than fixed, so it stays in the document flow and cannot
          sit on top of the page footer when scrolled to the bottom. The
          safe-area padding is not decoration either: without it the iPhone home
          indicator covers "Next question", the only control on this screen. */}
      {answered ? (
        <div className="sticky bottom-0 z-30 -mx-5 mt-8 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:-mx-8">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
            <p className="text-sm text-slate tabular-nums">
              {correctSoFar} of {answeredThisSitting} correct
            </p>
            <Button onClick={next} variant="accent" disabled={finishing}>
              {finishing ? 'Finishing…' : isLast ? 'Finish session' : 'Next question'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FeedbackPanel({ feedback }: { feedback: AnswerFeedback }) {
  return (
    <section
      className="mt-7 rise-in"
      aria-live="polite"
      aria-label={feedback.isCorrect ? 'Correct' : 'Incorrect'}
    >
      <div
        className={cn(
          'rounded-lg border p-5 sm:p-6',
          feedback.isCorrect
            ? 'border-verdict-correct/25 bg-verdict-correct-wash'
            : 'border-verdict-wrong/25 bg-verdict-wrong-wash',
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            className={cn(
              'text-xl',
              feedback.isCorrect ? 'text-verdict-correct' : 'text-verdict-wrong',
            )}
          >
            {feedback.isCorrect ? 'Correct.' : 'Not quite.'}
          </h2>
          {feedback.xpAwarded > 0 ? (
            <span className="font-serif text-sm tabular-nums">
              +{feedback.xpAwarded} XP
            </span>
          ) : null}
        </div>

        <div className="space-y-5 text-[0.9375rem] leading-relaxed">
          <p>{feedback.explanation}</p>

          {!feedback.isCorrect && feedback.commonMisconception ? (
            <Block label="What this is often confused with">
              {feedback.commonMisconception}
            </Block>
          ) : null}

          {feedback.whyItMatters ? (
            <Block label="Why this matters in practice">{feedback.whyItMatters}</Block>
          ) : null}

          {feedback.memoryTrick ? (
            <Block label="Worth remembering">{feedback.memoryTrick}</Block>
          ) : null}

          {feedback.isCorrect && feedback.commonMisconception ? (
            <Block label="The trap here">{feedback.commonMisconception}</Block>
          ) : null}

          {feedback.coachNote ? (
            <Block label="Your coach">{feedback.coachNote}</Block>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-current/10 pt-4 text-xs text-slate">
          <span>{JURISDICTION_LABELS[feedback.jurisdiction]}</span>
          {feedback.court ? <span>{feedback.court}</span> : null}
          {feedback.sourceReference ? (
            <span>
              {feedback.sourceUrl ? (
                <a
                  href={feedback.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {feedback.sourceReference}
                </a>
              ) : (
                feedback.sourceReference
              )}
            </span>
          ) : null}
          {feedback.nextReviewLabel ? (
            <span className="ml-auto">{feedback.nextReviewLabel}</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-1.5">{label}</p>
      <p>{children}</p>
    </div>
  );
}
