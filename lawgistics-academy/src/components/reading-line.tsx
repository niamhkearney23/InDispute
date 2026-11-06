import type { ReadingWeek } from '@/content/seed/reading';

/** A week's reading: the book, its chapters and pages, in a box under the week's heading. */
export function WeekReading({ reading, current = false }: { reading: ReadingWeek | undefined; current?: boolean }) {
  if (!reading) return null;
  return (
    <div className="mb-4 rounded-md border border-rule bg-paper-sunk px-4 py-3 text-sm">
      <p className="eyebrow mb-1">{current ? 'This week’s reading' : `Week ${reading.week}’s reading`}</p>
      <p className="font-serif text-base">
        <em>{reading.book.title}</em>
      </p>
      <p className="mt-1 text-slate">
        {reading.what}. Pages {reading.pages}.
      </p>
    </div>
  );
}
