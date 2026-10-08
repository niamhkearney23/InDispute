import { cn } from '@/components/ui';
import type { RoundDay } from '@/lib/training/rounds-service';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/**
 * A little calendar of the placement: one square per working day, filled
 * in by how many of that morning's four rounds were done. Weekends and the
 * programme's holidays are left out, so each row is a working week.
 */
export function RoundsCalendar({
  days,
  today,
}: {
  days: RoundDay[];
  today: string;
}) {
  if (days.length === 0) return null;
  // Pad the first week so Monday sits under Monday.
  const firstDow = (new Date(`${days[0].date}T00:00:00Z`).getUTCDay() + 6) % 7;
  const weeks: Array<Array<RoundDay | null>> = [];
  let week: Array<RoundDay | null> = Array(Math.min(firstDow, 5)).fill(null);
  let lastMonday = '';
  for (const day of days) {
    const dow = (new Date(`${day.date}T00:00:00Z`).getUTCDay() + 6) % 7;
    const monday = mondayOf(day.date);
    if (lastMonday && monday !== lastMonday) {
      while (week.length < 5) week.push(null);
      weeks.push(week);
      week = Array(dow).fill(null);
    }
    while (week.length < dow) week.push(null);
    week.push(day);
    lastMonday = monday;
  }
  while (week.length < 5) week.push(null);
  weeks.push(week);

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-5 gap-1.5 text-center text-[0.6875rem] font-semibold text-muted uppercase">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="space-y-1.5">
        {weeks.map((w, i) => (
          <div key={i} className="grid grid-cols-5 gap-1.5">
            {w.map((day, j) => {
              if (!day) return <span key={j} aria-hidden />;
              const done = day.rounds.filter((r) => r.state === 'done').length;
              const missed = day.rounds.filter((r) => r.state === 'missed').length;
              const isToday = day.date === today;
              return (
                <div
                  key={day.date}
                  className={cn(
                    'rounded-md border px-1 py-1.5 text-center',
                    isToday ? 'border-accent' : 'border-rule',
                    done === 4 && 'bg-verdict-correct-wash',
                  )}
                >
                  {/* aria-label on a plain div is not read out, so the
                      description is text a screen reader reaches. */}
                  <span className="sr-only">
                    {`${day.date}: ${done} of 4 rounds done${missed ? `, ${missed} missed` : ''}`}
                  </span>
                  <p className="text-xs tabular-nums" aria-hidden>
                    {Number(day.date.slice(8))}
                  </p>
                  <p className="mt-0.5 flex justify-center gap-0.5" aria-hidden>
                    {day.rounds.map((r) => (
                      <RoundMark
                        key={r.number}
                        state={
                          r.state === 'done' ? 'done' : r.state === 'missed' ? 'missed' : 'to-come'
                        }
                      />
                    ))}
                  </p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>Each mark is a round:</span>
        <span className="inline-flex items-center gap-1">
          <RoundMark state="done" /> a filled green dot, done
        </span>
        <span className="inline-flex items-center gap-1">
          <RoundMark state="missed" /> a red cross, missed
        </span>
        <span className="inline-flex items-center gap-1">
          <RoundMark state="to-come" /> a hollow grey ring, still to come
        </span>
      </p>
    </div>
  );
}

/**
 * One round, told apart by shape as well as colour: filled when done, a
 * cross when missed, hollow while it is still to come.
 */
function RoundMark({ state }: { state: 'done' | 'missed' | 'to-come' }) {
  return (
    <svg viewBox="0 0 8 8" className="size-2 shrink-0" aria-hidden>
      {state === 'done' ? (
        <circle cx="4" cy="4" r="3.5" className="fill-verdict-correct" />
      ) : state === 'missed' ? (
        <path
          d="M1.5 1.5l5 5M6.5 1.5l-5 5"
          className="stroke-verdict-wrong"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <circle cx="4" cy="4" r="3" className="stroke-rule-strong" strokeWidth="1.2" fill="none" />
      )}
    </svg>
  );
}

function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
