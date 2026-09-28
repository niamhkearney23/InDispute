'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COURT_HIERARCHIES, type Court } from '@/content/seed/court-hierarchies';
import { CourtTiers } from '@/components/court-tiers';
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
 * the way to the top, drawn as one line up through the picture.
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
      <CourtTiers
        hierarchy={hierarchy}
        lit={path}
        label={`${hierarchy.name}, tap a court to open it`}
        renderCourt={(court) => (
          <CourtNode
            court={court}
            appealsTo={court.appealsTo ? (bySlug.get(court.appealsTo) ?? null) : null}
            hearsFrom={hierarchy.courts.filter((c) => c.appealsTo === court.slug)}
            isOpen={open === court.slug}
            onPath={path.has(court.slug)}
            onToggle={() => setOpen((current) => (current === court.slug ? null : court.slug))}
          />
        )}
      />

      <p className="mt-4 text-xs text-muted">
        Lines are appeal routes and run upwards. Courts drawn side by side are of equal
        standing, not one above the other. Tap a court to see what it does.
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
  appealsTo,
  hearsFrom,
  isOpen,
  onPath,
  onToggle,
}: {
  court: Court;
  appealsTo: Court | null;
  hearsFrom: Court[];
  isOpen: boolean;
  /** Whether this court sits on the traced route from the open court to the apex. */
  onPath: boolean;
  onToggle: () => void;
}) {
  const apex = court.tier === 0;
  return (
    <div
      className={cn(
        'court-box overflow-hidden rounded-lg border bg-paper transition-[border-color,box-shadow,background-color]',
        isOpen && 'border-burgundy bg-burgundy-wash shadow-raised',
        !isOpen && onPath && 'border-burgundy/50 bg-burgundy-wash/40',
        !isOpen && !onPath && 'border-rule-strong shadow-sm hover:border-ink/40',
        apex && 'court-box-apex',
      )}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex min-h-14 w-full flex-col justify-center px-3 py-2.5 text-center"
      >
        <span
          className={cn(
            'font-serif text-[0.9375rem] leading-snug',
            isOpen || onPath ? 'text-burgundy' : 'text-ink',
          )}
        >
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
          <div className="border-t border-burgundy/15 px-3 pb-3 pt-2.5 text-left text-[0.8125rem] leading-relaxed text-slate">
            {court.name !== court.short ? (
              <p className="font-medium text-ink">{court.name}</p>
            ) : null}
            {court.note ? <p className="mt-1">{court.note}</p> : null}
            <dl className="mt-2.5 space-y-1 border-t border-burgundy/15 pt-2.5 text-xs">
              <div className="flex gap-2">
                <dt className="shrink-0 text-muted">Appeals go to</dt>
                <dd className="text-ink">{appealsTo ? (appealsTo.short ?? appealsTo.name) : 'Nowhere. This is the top.'}</dd>
              </div>
              {hearsFrom.length > 0 ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted">Hears appeals from</dt>
                  <dd className="text-ink">{hearsFrom.map((c) => c.short ?? c.name).join(', ')}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
