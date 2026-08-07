'use client';

import { useState } from 'react';
import { CourtHierarchyDiagram } from '@/components/court-hierarchy-diagram';
import { Button, Card, cn } from '@/components/ui';
import type { SeedLesson } from '@/content/seed/lessons';
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
 */
export function LessonPlayer({
  lesson,
  country,
  moduleSlug,
  quizLabel,
}: {
  lesson: SeedLesson;
  country: Country;
  moduleSlug: string;
  quizLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const step = lesson.steps[index];
  const isLast = index === lesson.steps.length - 1;

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
            className="h-full rounded-full bg-burgundy transition-[width] duration-300"
            style={{ width: `${((index + 1) / lesson.steps.length) * 100}%` }}
          />
        </div>
        <p className="shrink-0 text-xs tabular-nums text-muted">
          {index + 1} of {lesson.steps.length}
        </p>
      </div>

      <Card>
        {/* Keyed on the index so each screen animates in rather than swapping
            in place, which is what makes it read as a sequence. */}
        <div key={index} className="rise-in">
          <p className="eyebrow mb-2 text-burgundy">{step.heading}</p>
          <p className="text-[1.0625rem] leading-relaxed sm:text-lg">{step.body}</p>

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
                'mt-5 border-l-2 border-burgundy pl-4 font-serif text-lg leading-snug',
                step.diagram && 'mt-6',
              )}
            >
              {step.takeaway}
            </p>
          ) : null}
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        {isLast ? (
          <StartModuleButton slug={moduleSlug} label={quizLabel} />
        ) : (
          <Button size="lg" variant="accent" onClick={() => setIndex(index + 1)}>
            Next
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
