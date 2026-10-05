'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COURT_HIERARCHIES, type Court } from '@/content/seed/court-hierarchies';
import { CourtTiers } from '@/components/court-tiers';
import { cn } from '@/components/ui';
import type { Country } from '@/lib/types';

/**
 * A picture of a building for each court, so the map reads as a place rather
 * than a spreadsheet. Generated once as illustrations of invented buildings,
 * one per kind of court, and kept in public/courts. They carry no text and
 * no fact: every name, rung and appeal line is still drawn by the code from
 * court-hierarchies.ts, so a picture can be wrong only about how a building
 * looks, never about where an appeal goes. Courts of the same kind share one.
 * A court with no entry here simply shows no picture.
 */
const COURT_PICTURES: Record<string, string> = {
  // Malaysia
  'federal-court': 'apex-domed',
  'court-of-appeal': 'appellate',
  'high-court-malaya': 'high-court',
  'high-court-sabah-sarawak': 'high-court',
  'sessions-court': 'intermediate',
  'magistrates-court': 'local',
  // Australia
  hca: 'apex-monumental',
  fca: 'federal',
  'supreme-court': 'supreme-court',
  fcfcoa: 'federal',
  intermediate: 'intermediate',
  magistrates: 'local',
};

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
  const queue = open ? [open] : [];
  while (queue.length > 0) {
    const slug = queue.shift()!;
    if (path.has(slug)) continue;
    path.add(slug);
    const court = bySlug.get(slug);
    if (court?.appealsTo) queue.push(court.appealsTo);
    if (court?.alsoAppealsTo) queue.push(court.alsoAppealsTo);
  }

  return (
    <div>
      {/* A faint skyline behind the whole map. Decorative only: the cards
          sit on solid paper, and at this opacity the row labels still pass
          AA (about 5:1) over the darkest pixel of the skyline. */}
      <div className="relative isolate overflow-hidden rounded-xl border border-rule bg-paper px-3 pb-4 pt-3 sm:px-5 sm:pb-6 sm:pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/courts/backdrop.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 w-full object-cover object-bottom opacity-40 [mask-image:linear-gradient(to_bottom,black_75%,transparent)] sm:h-96"
        />
        <CourtTiers
          hierarchy={hierarchy}
          lit={path}
          label={`${hierarchy.name}. Choose a court to see what it does.`}
          renderCourt={(court) => (
            // Capped and centred so a court alone on its row is a building,
            // not a banner. The appeal lines meet the centre of the cell,
            // which is still the centre of the card.
            <div className="mx-auto max-w-[20rem]">
              <CourtNode
                court={court}
                appealsTo={[court.appealsTo, court.alsoAppealsTo]
                  .map((slug) => (slug ? bySlug.get(slug) : undefined))
                  .filter((c): c is Court => Boolean(c))}
                hearsFrom={hierarchy.courts.filter(
                  (c) => c.appealsTo === court.slug || c.alsoAppealsTo === court.slug,
                )}
                isOpen={open === court.slug}
                onPath={path.has(court.slug)}
                onToggle={() => setOpen((current) => (current === court.slug ? null : court.slug))}
              />
            </div>
          )}
        />
      </div>

      <p className="mt-4 text-xs text-slate">
        Lines are appeal routes and run upwards. Courts drawn side by side do not hear appeals
        from each other, though they may not rank equally. Choose a court to see what it does.
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
  appealsTo: Court[];
  hearsFrom: Court[];
  isOpen: boolean;
  /** Whether this court sits on the traced route from the open court to the apex. */
  onPath: boolean;
  onToggle: () => void;
}) {
  const apex = court.tier === 0;
  const picture = COURT_PICTURES[court.slug];
  return (
    <div
      className={cn(
        'court-box overflow-hidden rounded-lg border bg-paper transition-[border-color,box-shadow,background-color]',
        isOpen && 'border-accent bg-accent-wash shadow-raised',
        !isOpen && onPath && 'border-accent/50 bg-accent-wash/40',
        !isOpen && !onPath && 'border-rule-strong shadow-sm hover:border-ink/40',
        apex && 'court-box-apex',
      )}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex min-h-14 w-full flex-col justify-center text-center focus-visible:outline-offset-[-3px]"
      >
        {picture ? (
          // Decorative: the button is named by the court's name below it.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/courts/${picture}.webp`}
            alt=""
            width={720}
            height={480}
            loading="lazy"
            decoding="async"
            className={cn(
              'block aspect-[2/1] w-full border-b object-cover object-[50%_75%] transition-opacity',
              isOpen || onPath ? 'border-accent/20' : 'border-rule',
            )}
          />
        ) : null}
        <span
          className={cn(
            'block px-3 py-2.5 font-serif text-[0.9375rem] leading-snug',
            isOpen || onPath ? 'text-accent' : 'text-ink',
          )}
        >
          {court.short ?? court.name}
        </span>
      </button>

      {/* Height-animated open rather than a hard show/hide: a note that just
          appears reads as the layout jumping, and jumping content under a
          thumb is how a tap lands somewhere the person did not mean. */}
      <div
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-accent/15 px-3 pb-3 pt-2.5 text-left text-[0.8125rem] leading-relaxed text-slate">
            {court.name !== court.short ? (
              <p className="font-medium text-ink">{court.name}</p>
            ) : null}
            {court.note ? <p className="mt-1">{court.note}</p> : null}
            <dl className="mt-2.5 space-y-1 border-t border-accent/15 pt-2.5 text-xs">
              <div className="flex gap-2">
                <dt className="shrink-0 text-muted">Appeals go to</dt>
                <dd className="text-ink">
                  {appealsTo.length === 0
                    ? 'Nowhere. This is the top.'
                    : appealsTo.map((c) => c.short ?? c.name).join(', or ')}
                </dd>
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
