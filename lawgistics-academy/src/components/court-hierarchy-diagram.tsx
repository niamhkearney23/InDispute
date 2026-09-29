'use client';

import { COURT_HIERARCHIES, type Court } from '@/content/seed/court-hierarchies';
import { CourtTiers } from '@/components/court-tiers';
import { cn } from '@/components/ui';
import type { Country, QuestionOption } from '@/lib/types';

/**
 * The court hierarchy, drawn, with the courts as the answer options.
 *
 * Courts the question does not offer are still drawn, greyed and inert. The
 * point of a hierarchy question is placing a court among the others, so hiding
 * the ones that are not answers would remove the thing being tested.
 *
 * Once answered, the appeal route from the correct court to the apex lights
 * up, so the explanation that follows has the picture it is talking about.
 */
export function CourtHierarchyDiagram({
  country,
  options,
  selected,
  correctOptionIds,
  answered,
  disabled,
  onSelect,
}: {
  country: Country;
  options: QuestionOption[];
  selected: string[];
  correctOptionIds: string[] | null;
  answered: boolean;
  disabled: boolean;
  onSelect: (optionId: string) => void;
}) {
  const hierarchy = COURT_HIERARCHIES[country];
  const selectable = new Map(options.map((option) => [option.id, option.text]));
  const bySlug = new Map(hierarchy.courts.map((c) => [c.slug, c]));

  const lit = new Set<string>();
  if (answered && correctOptionIds?.length === 1) {
    const queue = [correctOptionIds[0]];
    while (queue.length > 0) {
      const slug = queue.shift()!;
      if (lit.has(slug)) continue;
      lit.add(slug);
      const court = bySlug.get(slug);
      if (court?.appealsTo) queue.push(court.appealsTo);
      if (court?.alsoAppealsTo) queue.push(court.alsoAppealsTo);
    }
  }

  return (
    <div>
      <CourtTiers
        hierarchy={hierarchy}
        lit={lit}
        label={`${hierarchy.name}, choose one`}
        renderCourt={(court) => (
          <CourtBox
            court={court}
            label={selectable.get(court.slug) ?? court.short ?? court.name}
            offered={selectable.has(court.slug)}
            isSelected={selected.includes(court.slug)}
            isCorrect={correctOptionIds?.includes(court.slug) ?? false}
            answered={answered}
            disabled={disabled}
            onSelect={() => onSelect(court.slug)}
          />
        )}
      />

      <p className="mt-4 text-xs text-muted">
        Lines are appeal routes and run upwards. Courts drawn side by side are of equal
        standing, not one above the other.
      </p>
    </div>
  );
}

function CourtBox({
  court,
  label,
  offered,
  isSelected,
  isCorrect,
  answered,
  disabled,
  onSelect,
}: {
  court: Court;
  label: string;
  offered: boolean;
  isSelected: boolean;
  isCorrect: boolean;
  answered: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const wrongChoice = answered && isSelected && !isCorrect;

  const classes = cn(
    'court-box flex min-h-14 w-full flex-col justify-center rounded-lg border px-3 py-2.5 text-center',
    court.tier === 0 && 'court-box-apex',
    !offered && 'border-dashed border-rule bg-paper text-muted',
    offered && !answered && isSelected && 'border-ink bg-paper-sunk shadow-raised',
    offered && !answered && !isSelected && 'border-rule-strong bg-paper shadow-sm hover:border-ink/40',
    offered && answered && isCorrect && 'answer-correct border-verdict-correct bg-verdict-correct-wash',
    wrongChoice && 'answer-wrong border-verdict-wrong bg-verdict-wrong-wash',
    offered && answered && !isCorrect && !wrongChoice && 'border-rule bg-paper opacity-55',
  );

  const body = (
    <>
      <span className="font-serif text-[0.9375rem] leading-snug">{label}</span>
      {answered && offered && (isCorrect || wrongChoice) ? (
        <span className="sr-only">{isCorrect ? 'Correct answer.' : 'Your answer.'}</span>
      ) : null}
      {answered && offered && court.note ? (
        <span className="mt-1 text-[0.6875rem] leading-snug text-slate">{court.note}</span>
      ) : null}
    </>
  );

  // A court the question does not offer is scenery, so it is not a button: a
  // screen reader should not announce six things you cannot press.
  if (!offered) {
    return <div className={classes}>{body}</div>;
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(classes, 'transition-[border-color,box-shadow] disabled:cursor-default')}
    >
      {body}
    </button>
  );
}
