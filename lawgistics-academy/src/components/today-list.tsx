import Link from '@/components/app-link';
import { cn } from '@/components/ui';
import { CheckIcon } from '@/components/icons';
import { doneCount, type TodayItem } from '@/lib/homework/today-list';

/** "Set for today": the day's homework as one checklist, each line a link. */
export function TodayList({
  items,
  startTraining,
  upNext,
}: {
  items: TodayItem[];
  /** The real start button for the training line, made by the page. */
  startTraining?: (label: string) => React.ReactNode;
  /**
   * The line the "Your next task" card above is about. It stays on the list,
   * which is the whole day's checklist, marked "Up next" and without a start
   * button of its own: the card carries it, so the page has one Start.
   */
  upNext?: string | null;
}) {
  const { done, of } = doneCount(items);
  let n = 0;
  return (
    <section aria-labelledby="set-for-today" className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 id="set-for-today" className="eyebrow">
          Set for today
        </h2>
        {of > 0 ? (
          <p className="text-xs font-semibold text-muted">
            {done} of {of} done
          </p>
        ) : null}
      </div>
      {items.length === 0 ? (
        // Said, not left blank: a new learner with nothing set yet should
        // know that is expected, and where it will come from.
        <p className="border-y border-rule py-4 text-sm text-slate">
          Nothing is set for today yet. When your coach sets work, or your training opens, it
          appears here.
        </p>
      ) : (
        <ol className="divide-y divide-rule border-y border-rule">
          {items.map((item) => {
            const number = item.done === null ? null : ++n;
            const isNext = Boolean(upNext) && item.key === upNext;
            const startable = Boolean(item.start && startTraining) && !isNext;
            const rowClass =
              'pressable flex min-h-14 items-center gap-3.5 py-3 hover:bg-paper-sunk/60 active:bg-paper-sunk';
            const inner = (
              <>
                <span
                  aria-hidden
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
                    item.done
                      ? 'bg-verdict-correct text-paper'
                      : 'border-[1.5px] ' +
                          (item.urgent ? 'border-ink text-ink' : 'border-rule-strong text-muted'),
                  )}
                >
                  {item.done ? <CheckIcon className="size-4" /> : (number ?? '▶')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block font-semibold', item.done && 'text-muted')}>
                    {item.label}
                    {item.done ? <span className="sr-only"> (done)</span> : null}
                  </span>
                  <span
                    className={cn(
                      'block text-sm',
                      item.urgent ? 'text-verdict-wrong' : 'text-muted',
                    )}
                  >
                    {item.meta}
                  </span>
                </span>
                {isNext ? (
                  <span className="shrink-0 rounded-full bg-paper-sunk px-2.5 py-1 text-xs font-medium text-slate">
                    Up next
                  </span>
                ) : startable ? (
                  startTraining!(item.start!)
                ) : (
                  <span aria-hidden className="text-muted">
                    ›
                  </span>
                )}
              </>
            );
            return (
              <li key={item.key}>
                {startable ? (
                  <div className={rowClass}>{inner}</div>
                ) : (
                  <Link href={isNext && item.start ? '#next-task' : item.href} className={rowClass}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
