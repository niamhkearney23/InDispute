import Link from 'next/link';
import { ModuleArt, artFor } from '@/components/module-art';
import { cn } from '@/components/ui';

/**
 * A required module, shown as something to finish rather than a warning.
 *
 * The facts are the same as the notice it replaces: which module, how many
 * answered correctly, how many left. What changes is the order they arrive
 * in. A yellow banner leads with "required", which reads as a bill; this
 * leads with the picture and the bar, which reads as a thing half done.
 */
export function QuestCard({
  slug,
  name,
  correctOnce,
  total,
}: {
  slug: string;
  name: string;
  correctOnce: number;
  total: number;
}) {
  const percent = total === 0 ? 0 : Math.round((correctOnce / total) * 100);
  const left = Math.max(total - correctOnce, 0);
  return (
    <Link
      href={`/modules/${slug}`}
      className="group flex items-stretch overflow-hidden rounded-xl border border-rule bg-paper-raised shadow-card transition-[box-shadow,border-color] hover:border-burgundy/40 hover:shadow-raised"
    >
      <ModuleArt kind={artFor(slug)} className="w-24 shrink-0 rounded-none sm:w-32" />
      <div className="min-w-0 flex-1 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="eyebrow text-burgundy">Required module</p>
          <p className="text-xs tabular-nums text-muted">
            {correctOnce} of {total}
          </p>
        </div>
        <p className="mt-0.5 font-serif text-xl leading-snug">{name}</p>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-paper-sunk"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name}: ${correctOnce} of ${total} answered correctly`}
        >
          <div
            className="bar-grow h-full rounded-full bg-gradient-to-r from-burgundy to-burgundy-soft"
            style={{ width: `${Math.max(percent, 3)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate">
          <span className={cn('font-medium text-ink')}>
            {left === 1 ? 'One to go.' : `${left} to go.`}
          </span>{' '}
          <span className="text-burgundy underline-offset-2 group-hover:underline">
            {correctOnce > 0 ? 'Finish it' : 'Start it'} →
          </span>
        </p>
      </div>
    </Link>
  );
}
