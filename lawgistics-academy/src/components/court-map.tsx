'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COURT_HIERARCHIES, tiersOf, type Court } from '@/content/seed/court-hierarchies';
import { cn } from '@/components/ui';
import type { Country } from '@/lib/types';

/**
 * The court hierarchy, as something to explore rather than a wall to read.
 *
 * The quiz version of this diagram (court-hierarchy-diagram.tsx) exists to be
 * answered: it shows the courts a question offers and marks them right or
 * wrong. This exists to be looked up. There is no question, no right answer,
 * and nothing is scored, so it can afford to invite a tap instead of demanding
 * one: press a court and it opens, showing what it actually does and, because
 * that is the thing a hierarchy is *for*, the path an appeal from it takes on
 * the way to the top.
 *
 * Reuses the same tiered, top-down layout as the quiz diagram and the same
 * reason for it: rows survive a 360px phone, a left-to-right tree does not.
 */
export function CourtMap({
  country,
  quizHref,
}: {
  country: Country;
  /** Where "Test yourself" leads. Omitted if there is nowhere to send them. */
  quizHref: string | null;
}) {
  const hierarchy = COURT_HIERARCHIES[country];
  const tiers = tiersOf(hierarchy);
  const bySlug = new Map(hierarchy.courts.map((c) => [c.slug, c]));

  const [open, setOpen] = useState<string | null>(null);

  // The chain from the open court up to the apex, so it can be drawn as one
  // continuous trail rather than the learner having to trace it by eye.
  const path = new Set<string>();
  for (let slug = open; slug; ) {
    path.add(slug);
    slug = bySlug.get(slug)?.appealsTo ?? null;
  }

  return (
    <div>
      <div role="group" aria-label={`${hierarchy.name}, tap a court to open it`}>
        {tiers.map((row, tierIndex) => (
          <div key={row[0]?.tier ?? tierIndex}>
            <div className={cn('grid gap-2', row.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
              {row.map((court) => (
                <CourtNode
                  key={court.slug}
                  court={court}
                  isOpen={open === court.slug}
                  onPath={path.has(court.slug)}
                  onToggle={() => setOpen((current) => (current === court.slug ? null : court.slug))}
                />
              ))}
            </div>

            {tierIndex < tiers.length - 1 ? (
              <div aria-hidden className="flex justify-center">
                <span
                  className={cn(
                    'h-4 w-px transition-colors',
                    // Lit up when the line is part of the traced appeal path,
                    // so the trail reads as one line running through the
                    // diagram rather than a court lighting up in isolation.
                    row.some((c) => path.has(c.slug)) && tiers[tierIndex + 1]?.some((c) => path.has(c.slug))
                      ? 'bg-burgundy'
                      : 'bg-rule-strong',
                  )}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">
        Appeals run upwards. Courts drawn side by side are of equal standing, not
        one above the other. Tap a court to see what it does.
      </p>

      {quizHref ? (
        <Link
          href={quizHref}
          className="mt-5 inline-flex min-h-11 items-center rounded-[5px] border border-rule-strong px-4 text-sm font-medium hover:bg-paper-sunk"
        >
          Test yourself on this →
        </Link>
      ) : null}
    </div>
  );
}

function CourtNode({
  court,
  isOpen,
  onPath,
  onToggle,
}: {
  court: Court;
  isOpen: boolean;
  /** Whether this court sits on the traced route from the open court to the apex. */
  onPath: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-md border transition-colors',
        isOpen && 'border-burgundy bg-burgundy-wash',
        !isOpen && onPath && 'border-burgundy/40',
        !isOpen && !onPath && 'border-rule-strong hover:bg-paper-sunk',
      )}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex min-h-14 w-full flex-col justify-center px-3 py-2.5 text-center"
      >
        <span className="text-[0.8125rem] leading-snug font-medium">
          {court.short ?? court.name}
        </span>
      </button>

      {/* Height-animated open rather than a hard show/hide: a note that just
          appears reads as the layout jumping, and jumping content under a
          thumb is how a tap lands somewhere the person did not mean. */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 text-left text-[0.8125rem] leading-relaxed text-slate">
            {court.name !== court.short ? (
              <p className="font-medium text-ink">{court.name}</p>
            ) : null}
            {court.note ? <p className="mt-1">{court.note}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
