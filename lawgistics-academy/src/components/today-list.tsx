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
  // Counted lines (a box that ticks) and the rest (a video, the reading,
  // work to put your name on, a practice file): two groups, each saying
  // what it is, so "0 of 1 done" sits beside the one thing it counts.
  const required = items.filter((i) => i.done !== null);
  const extra = items.filter((i) => i.done === null);
  let n = 0;

  const row = (item: TodayItem) => {
    const number = item.done === null ? null : ++n;
    const isNext = Boolean(upNext) && item.key === upNext;
    const startable = Boolean(item.start && startTraining) && !isNext;
    const rowClass =
      'pressable flex min-h-14 items-center gap-3.5 px-4 py-3 hover:bg-paper-sunk/60 active:bg-paper-sunk sm:px-5';
    const inner = (
      <>
        <span
          aria-hidden
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
            item.done
              ? 'bg-verdict-correct text-paper'
              : 'border-[1.5px] ' + (item.urgent ? 'border-ink text-ink' : 'border-rule-strong text-muted'),
          )}
        >
          {item.done ? <CheckIcon className="size-4" /> : (number ?? '▶')}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block font-semibold', item.done && 'text-muted')}>
            {item.label}
            {item.done ? <span className="sr-only"> (done)</span> : null}
          </span>
          <span className={cn('block text-sm', item.urgent ? 'text-verdict-wrong' : 'text-muted')}>{item.meta}</span>
        </span>
        {isNext ? (
          <span className="shrink-0 rounded-full bg-periwinkle-wash px-2.5 py-1 text-xs font-medium text-periwinkle-ink">
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
  };

  const group = 'divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-paper-raised';
  return (
    <section aria-labelledby="set-for-today" className="space-y-3">
      <h2 id="set-for-today" className="eyebrow">
        Set for today
      </h2>
      {items.length === 0 ? (
        // Said, not left blank: a new learner with nothing set yet should
        // know that is expected, and where it will come from.
        <p className="rounded-xl border border-rule bg-paper-raised px-4 py-4 text-sm text-slate sm:px-5">
          Nothing is set for today yet. When your coach sets work, or your training opens, it
          appears here.
        </p>
      ) : (
        <>
          {required.length > 0 ? (
            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <h3 className="font-sans text-sm font-semibold text-ink">Required</h3>
                <p className="text-xs font-medium text-muted tabular-nums">
                  {done} of {of} done
                </p>
              </div>
              <ol className={group}>{required.map(row)}</ol>
            </div>
          ) : null}
          {extra.length > 0 ? (
            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <h3 className="font-sans text-sm font-semibold text-ink">Also today</h3>
                <p className="text-xs text-muted">Not counted</p>
              </div>
              <ul className={group}>{extra.map(row)}</ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
