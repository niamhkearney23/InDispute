import { cn } from '@/components/ui';
import { FlameIcon } from '@/components/icons';
import { localDateString } from '@/lib/learning/progression';

/**
 * Five weeks of days, each one filled if a session was finished on it.
 *
 * The chain is the thing: a row of filled squares is more persuasive than
 * a number, and a gap in it is felt without anybody having to say "you are
 * about to lose your streak". Nothing here nags; the day that has not been
 * trained yet is simply outlined and waiting.
 */
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function StreakCalendar({
  trainedDays,
  timezone,
  streak,
}: {
  trainedDays: string[];
  timezone: string;
  streak: number;
}) {
  const today = localDateString(timezone);
  const trained = new Set(trainedDays);
  // End the grid on the Sunday of this week, so the rows are whole weeks
  // and today sits in the last row.
  const todayDow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  const end = shiftDate(today, 6 - todayDow);
  const start = shiftDate(end, -34);
  const days = Array.from({ length: 35 }, (_, i) => shiftDate(start, i));
  const trainedToday = trained.has(today);
  const shownCount = days.filter((day) => trained.has(day)).length;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            'grid place-items-center rounded-full bg-amber-50 text-amber-600',
            streak >= 30 ? 'size-14' : streak >= 7 ? 'size-12' : 'size-10',
          )}
        >
          <FlameIcon
            className={cn(
              streak > 0 && 'flame-live',
              streak >= 30 ? 'size-8' : streak >= 7 ? 'size-6' : 'size-5',
              streak === 0 && 'opacity-40',
            )}
          />
        </span>
        <div>
          <p className="font-serif text-3xl leading-none tabular-nums">
            {streak}
            <span className="ml-1.5 font-sans text-sm text-slate">
              day{streak === 1 ? '' : 's'} in a row
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {streak === 0
              ? 'Finish a session today to start a chain.'
              : trainedToday
                ? 'Today counts. Train again tomorrow to keep the chain.'
                : 'Not trained yet today. One session keeps the chain.'}
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-7 gap-1.5"
        role="img"
        aria-label={`${shownCount} ${shownCount === 1 ? 'day' : 'days'} trained in the last five weeks`}
      >
        {DAY_LETTERS.map((letter, i) => (
          <span key={i} className="text-center text-[0.625rem] font-semibold text-muted">
            {letter}
          </span>
        ))}
        {days.map((day) => {
          const done = trained.has(day);
          const isToday = day === today;
          const future = day > today;
          return (
            <span
              key={day}
              title={day}
              className={cn(
                'aspect-square rounded-[4px] transition-colors',
                done && 'bg-burgundy',
                !done && !future && !isToday && 'bg-paper-sunk',
                !done && isToday && 'border-2 border-dashed border-burgundy/60 bg-burgundy-wash',
                future && 'bg-transparent',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
