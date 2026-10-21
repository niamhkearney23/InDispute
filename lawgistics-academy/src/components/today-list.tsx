import Link from "next/link";
import { cn } from "@/components/ui";
import { CheckIcon } from "@/components/icons";
import { doneCount, type TodayItem } from "@/lib/homework/today-list";

/** "Set for today": the day's homework as one checklist, each line a link. */
export function TodayList({
  items,
  startTraining,
}: {
  items: TodayItem[];
  /** The real start button for the training line, made by the page. */
  startTraining?: (label: string) => React.ReactNode;
}) {
  if (items.length === 0) return null;
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
      <ol className="divide-y divide-rule border-y border-rule">
        {items.map((item) => {
          const number = item.done === null ? null : ++n;
          const startable = Boolean(item.start && startTraining);
          const rowClass =
            "flex min-h-14 items-center gap-3.5 py-3 hover:bg-paper-sunk/60";
          const inner = (
            <>
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                  item.done
                    ? "bg-verdict-correct text-paper"
                    : "border-[1.5px] " +
                        (item.urgent
                          ? "border-ink text-ink"
                          : "border-rule-strong text-muted"),
                )}
              >
                {item.done ? <CheckIcon className="size-4" /> : (number ?? "▶")}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block font-semibold",
                    item.done && "text-muted",
                  )}
                >
                  {item.label}
                  {item.done ? <span className="sr-only"> (done)</span> : null}
                </span>
                <span
                  className={cn(
                    "block text-sm",
                    item.urgent ? "text-verdict-wrong" : "text-muted",
                  )}
                >
                  {item.meta}
                </span>
              </span>
              {startable ? (
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
                <Link href={item.href} className={rowClass}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
