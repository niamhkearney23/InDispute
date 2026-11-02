import { PROGRAMME_BOOK, type ReadingDay } from '@/content/seed/reading';

/** The day's pages of the programme's book, in a box under the day's task. */
export function ReadingLine({ reading }: { reading: ReadingDay | undefined }) {
  if (!reading) return null;
  return (
    <div className="mt-3 rounded-md border border-rule bg-paper-sunk px-3.5 py-2.5 text-sm">
      <p className="eyebrow mb-1">Read</p>
      <p>
        <em>{PROGRAMME_BOOK.title}</em>: {reading.what}, pages {reading.pages}.
      </p>
    </div>
  );
}
