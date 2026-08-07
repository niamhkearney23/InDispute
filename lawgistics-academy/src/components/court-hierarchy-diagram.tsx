'use client';

import { COURT_HIERARCHIES, tiersOf, type Court } from '@/content/seed/court-hierarchies';
import { cn } from '@/components/ui';
import type { Country, QuestionOption } from '@/lib/types';

/**
 * The court hierarchy, drawn, with the courts as the answer options.
 *
 * Laid out as rows from the apex down, because that is the shape of the thing
 * being taught and because a column of rows is the only arrangement that
 * survives a 360px phone. A left-to-right tree would need horizontal scrolling,
 * and a diagram you have to drag around to read is worse than a list.
 *
 * Courts the question does not offer are still drawn, greyed and inert. The
 * point of a hierarchy question is placing a court among the others, so hiding
 * the ones that are not answers would remove the thing being tested.
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
  const tiers = tiersOf(hierarchy);

  return (
    <div role="group" aria-label={`${hierarchy.name}, choose one`}>
      {tiers.map((row, tierIndex) => (
        <div key={row[0]?.tier ?? tierIndex}>
          <div
            className={cn(
              'grid gap-2',
              row.length > 1 ? 'grid-cols-2' : 'grid-cols-1',
            )}
          >
            {row.map((court) => (
              <CourtBox
                key={court.slug}
                court={court}
                label={selectable.get(court.slug) ?? court.short ?? court.name}
                offered={selectable.has(court.slug)}
                isSelected={selected.includes(court.slug)}
                isCorrect={correctOptionIds?.includes(court.slug) ?? false}
                answered={answered}
                disabled={disabled}
                onSelect={() => onSelect(court.slug)}
              />
            ))}
          </div>

          {/* The line down to the next row, which is what makes it a hierarchy
              rather than a list. Omitted after the last row. */}
          {tierIndex < tiers.length - 1 ? (
            <div aria-hidden className="flex justify-center">
              <span className="h-4 w-px bg-rule-strong" />
            </div>
          ) : null}
        </div>
      ))}

      <p className="mt-4 text-xs text-muted">
        Appeals run upwards. Courts drawn side by side are of equal standing, not
        one above the other.
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
    'flex min-h-14 w-full flex-col justify-center rounded-md border px-3 py-2.5 text-center',
    !offered && 'border-dashed border-rule bg-paper text-muted',
    offered && !answered && isSelected && 'border-ink bg-paper-sunk',
    offered && !answered && !isSelected && 'border-rule-strong hover:bg-paper-sunk',
    offered && answered && isCorrect && 'border-verdict-correct bg-verdict-correct-wash',
    wrongChoice && 'border-verdict-wrong bg-verdict-wrong-wash',
    offered && answered && !isCorrect && !wrongChoice && 'border-rule opacity-55',
  );

  const body = (
    <>
      <span className="text-[0.8125rem] leading-snug font-medium">{label}</span>
      {answered && offered && court.note ? (
        <span className="mt-1 text-[0.6875rem] leading-snug text-slate">{court.note}</span>
      ) : null}
    </>
  );

  // A court the question does not offer is scenery, so it is not a button: a
  // screen reader should not announce six things you cannot press.
  if (!offered) {
    return (
      <div className={classes} aria-hidden={false}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(classes, 'transition-colors disabled:cursor-default')}
    >
      {body}
    </button>
  );
}
