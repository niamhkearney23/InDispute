'use client';

import { useState } from 'react';
import Link from '@/components/app-link';
import { cn } from '@/components/ui';

export interface AreaConcept {
  slug: string;
  name: string;
  score: number;
  attempts: number;
  /** How many of those answers were right. */
  correct: number;
  confidentAndWrong: number;
}

export interface Area {
  slug: string;
  name: string;
  score: number;
  attempts: number;
  concepts: AreaConcept[];
  /** A module that teaches this area, to practise it in, when there is one. */
  practice?: { href: string; label: string } | null;
}

/**
 * Progress by topic: one row per area with its accuracy and the number of
 * answers it rests on, so 100% of two answers never reads like 100% of
 * eighty. A row opens to the concepts underneath and a place to practise.
 */
export function AreaBreakdown({ areas }: { areas: Area[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-paper-raised">
      {areas.map((area) => {
        const open = openSlug === area.slug;
        const measured = area.concepts.filter((c) => c.attempts > 0);
        const panel = `area-${area.slug}`;
        return (
          <li key={area.slug}>
            <button
              type="button"
              onClick={() => setOpenSlug(open ? null : area.slug)}
              aria-expanded={open}
              aria-controls={panel}
              className="flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-paper-sunk/60 sm:px-5"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{area.name}</span>
                  <span className="shrink-0 text-sm tabular-nums text-ink">
                    {area.attempts === 0 ? <span className="text-muted">Not asked yet</span> : `${area.score}%`}
                  </span>
                </span>
                <span
                  className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-periwinkle-wash"
                  aria-hidden
                >
                  {area.attempts > 0 ? (
                    <span
                      className="block h-full rounded-full bg-periwinkle"
                      style={{ width: `${Math.max(area.score, 2)}%` }}
                    />
                  ) : null}
                </span>
                <span className="mt-1.5 block text-xs text-muted">
                  {area.attempts === 0
                    ? 'No questions answered here yet'
                    : `Right on ${area.score}% of ${area.attempts} ${area.attempts === 1 ? 'answer' : 'answers'} · ${measured.length} ${measured.length === 1 ? 'concept' : 'concepts'}`}
                </span>
              </span>
              <span aria-hidden className={cn('shrink-0 text-muted transition-transform', open && 'rotate-90')}>
                ›
              </span>
            </button>

            {open ? (
              <div id={panel} className="rise-in border-t border-rule bg-paper px-4 py-3 sm:px-5">
                {measured.length === 0 ? (
                  <p className="text-sm text-slate">Nothing measured here yet. It fills in as these concepts come up in training.</p>
                ) : (
                  <ul className="divide-y divide-rule">
                    {[...measured]
                      .sort((a, b) => a.score - b.score)
                      .map((concept) => (
                        <li key={concept.slug} className="flex items-center justify-between gap-3 py-2">
                          <span className="min-w-0">
                            <span className="block text-sm">{concept.name}</span>
                            <span className="block text-xs text-muted">
                              {concept.correct} of {concept.attempts} right
                              {/* Counted only when the answer was marked Certain. */}
                              {concept.confidentAndWrong > 0
                                ? ` · certain and wrong ${concept.confidentAndWrong} ${concept.confidentAndWrong === 1 ? 'time' : 'times'}`
                                : ''}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm tabular-nums">{concept.score}%</span>
                        </li>
                      ))}
                  </ul>
                )}
                {area.practice ? (
                  <Link
                    href={area.practice.href}
                    className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-periwinkle-ink hover:underline"
                  >
                    {area.practice.label} ›
                  </Link>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
