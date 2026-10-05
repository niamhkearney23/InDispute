'use client';

import { useState } from 'react';
import { CourtHierarchyDiagram } from '@/components/court-hierarchy-diagram';
import { Button, Card, cn } from '@/components/ui';
import type { SeedLesson } from '@/content/seed/lessons';
import { isEmbeddable } from '@/lib/lessons/embed';
import { deliveryOrder, optionLetter } from '@/lib/learning/option-order';
import type { Country } from '@/lib/types';
import { StartModuleButton } from '../start-module-button';

/**
 * A lesson, one screen at a time.
 *
 * What this borrows from video is pacing: an idea arrives, you take it in, you
 * ask for the next one. What it deliberately does not borrow is being a video,
 * because a recording of a court hierarchy cannot be corrected when a court is
 * renamed and cannot be checked by anything.
 *
 * Back is always available. A learner who has lost the thread and cannot return
 * to the previous screen stops reading and starts tapping, and at that point
 * the lesson is a loading bar.
 *
 * A lesson can follow a client (the scene, shown first) and ask a guess
 * before a screen: the learner commits to an answer, sees whether it was
 * right, and only then reads why. A guess is never scored or saved; it is
 * there to make the next paragraph something they want to read.
 */
export function LessonPlayer({
  lesson,
  country,
  moduleSlug,
  quizLabel,
  preview = false,
}: {
  lesson: SeedLesson;
  country: Country;
  moduleSlug: string;
  quizLabel: string;
  /** Staff reading it before sign-off: no button that starts the questions. */
  preview?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [guesses, setGuesses] = useState<Record<number, string>>({});
  const step = lesson.steps[index];
  const isLast = index === lesson.steps.length - 1;
  const guess = step.guess;
  const guessed = guess ? guesses[index] : undefined;
  // Until they have guessed, the screen is the question; the teaching waits.
  const showBody = !guess || guessed !== undefined;
  // Shown shuffled, fixed per screen: the guesses were written with the
  // right answer second nine times in ten. Letters are places on the screen.
  const shown = guess ? deliveryOrder(guess.options, `${lesson.slug}:${index}`) : [];
  const rightAt = shown.findIndex((o) => guess && o.id === guess.answer);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div
          className="h-1 flex-1 overflow-hidden rounded-full bg-rule"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={lesson.steps.length}
          aria-label="Lesson progress"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${((index + 1) / lesson.steps.length) * 100}%` }}
          />
        </div>
        <p className="shrink-0 text-xs tabular-nums text-muted">
          {index + 1} of {lesson.steps.length}
        </p>
      </div>

      {lesson.scene && index === 0 ? (
        <div className="rise-in rounded-xl bg-accent px-5 py-4 text-paper">
          <p className="mb-1 text-[0.6875rem] font-semibold tracking-[0.14em] uppercase opacity-80">
            Your file · {lesson.scene.who}
          </p>
          <p className="leading-relaxed">{lesson.scene.setup}</p>
        </div>
      ) : null}

      <Card>
        {/* Keyed on the index so each screen animates in rather than swapping
            in place, which is what makes it read as a sequence. */}
        <div key={index} className="rise-in">
          <p className="eyebrow mb-2 text-accent">{step.heading}</p>

          {guess ? (
            <fieldset className="mb-5">
              <legend className="mb-3 font-serif text-xl leading-snug">{guess.prompt}</legend>
              <div className="space-y-2">
                {shown.map((o, at) => {
                  const chosen = guessed === o.id;
                  const isRight = o.id === guess.answer;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={guessed !== undefined}
                      onClick={() => setGuesses({ ...guesses, [index]: o.id })}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors',
                        guessed === undefined
                          ? 'border-rule bg-paper-raised hover:border-accent'
                          : isRight
                            ? 'border-verdict-correct bg-verdict-correct-wash'
                            : chosen
                              ? 'border-verdict-wrong/60 bg-paper-sunk'
                              : 'border-rule bg-paper-raised opacity-60',
                      )}
                    >
                      <span className="font-semibold">{optionLetter(at)}.</span>
                      <span>{o.text}</span>
                    </button>
                  );
                })}
              </div>
              {guessed ? (
                <p
                  className={cn(
                    'mt-3 text-sm font-semibold',
                    guessed === guess.answer ? 'text-verdict-correct' : 'text-verdict-wrong',
                  )}
                  role="status"
                >
                  {guessed === guess.answer
                    ? 'Good instinct. Here is why.'
                    : `Not quite: it is ${optionLetter(rightAt)}. Here is why.`}
                </p>
              ) : null}
            </fieldset>
          ) : null}

          {showBody ? (
            <p className="text-[1.0625rem] leading-relaxed sm:text-lg">{step.body}</p>
          ) : null}

          {showBody ? (
            <>
              {step.video && isEmbeddable(step.video.url) ? (
                <figure className="mt-5">
                  <div className="aspect-video w-full overflow-hidden rounded-md border border-rule bg-paper-sunk">
                    <iframe
                      src={step.video.url}
                      title={step.video.caption ?? step.heading}
                      allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="size-full"
                    />
                  </div>
                  {step.video.caption ? (
                    <figcaption className="mt-2 text-xs text-muted">
                      {step.video.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}

              {step.diagram ? (
                <div className="mt-6 border-t border-rule pt-6">
                  <CourtHierarchyDiagram
                    country={country}
                    options={[]}
                    selected={[]}
                    correctOptionIds={null}
                    answered={false}
                    disabled
                    onSelect={() => {}}
                  />
                </div>
              ) : null}

              {step.takeaway ? (
                <p
                  className={cn(
                    'mt-5 border-l-2 border-accent pl-4 font-serif text-lg leading-snug',
                    step.diagram && 'mt-6',
                  )}
                >
                  {step.takeaway}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        {isLast ? (
          preview ? null : (
            <StartModuleButton slug={moduleSlug} label={quizLabel} />
          )
        ) : (
          <Button
            size="lg"
            variant={showBody ? 'accent' : 'outline'}
            onClick={() =>
              showBody ? setIndex(index + 1) : setGuesses({ ...guesses, [index]: '' })
            }
          >
            {showBody ? 'Next' : 'Just show me'}
          </Button>
        )}

        {index > 0 ? (
          <Button size="lg" variant="outline" onClick={() => setIndex(index - 1)}>
            Back
          </Button>
        ) : null}
      </div>
    </div>
  );
}
