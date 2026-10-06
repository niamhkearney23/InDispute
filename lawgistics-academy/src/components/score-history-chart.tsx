import type { ScoreDay } from '@/lib/learning/score-history';

/**
 * The overall score as a line, one point per day something was answered.
 *
 * The line is drawn in SVG stretched to the box; the points, labels and
 * tooltips are ordinary HTML laid over it, so they stay round and readable
 * at any width rather than shrinking with the drawing on a phone. Each point
 * says on hover or focus where the overall score stood that day and how the
 * day itself went, and the same figures are in a list underneath for anyone
 * who would rather read than point.
 */

const HEIGHT = 160;

function shortDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export function ScoreHistoryChart({ days }: { days: ScoreDay[] }) {
  if (days.length === 0) return null;
  const latest = days[days.length - 1];
  const totalAnswered = days.reduce((n, d) => n + d.answered, 0);
  const totalRight = days.reduce((n, d) => n + d.right, 0);

  // One day sits in the middle; more spread across, a little in from each
  // edge so the end points are not cut in half.
  const x = (i: number) => (days.length === 1 ? 50 : 3 + (i / (days.length - 1)) * 94);
  const y = (score: number) => 100 - score;
  const line = days.map((d, i) => `${x(i)},${y(d.overall)}`).join(' ');

  return (
    <div>
      <p className="font-serif text-4xl leading-none tabular-nums">{latest.overall}%</p>
      <p className="mt-1.5 text-sm text-slate tabular-nums">
        {totalRight} of {totalAnswered} answers right, over {days.length}{' '}
        {days.length === 1 ? 'day' : 'days'}.
      </p>

      <div className="mt-6 flex gap-2">
        {/* The scale: 100, 50 and 0, beside their gridlines. */}
        <div
          className="relative w-9 shrink-0 text-right text-xs text-muted tabular-nums"
          style={{ height: HEIGHT }}
          aria-hidden
        >
          {[100, 50, 0].map((v) => (
            <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${y(v)}%` }}>
              {v}%
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1" style={{ height: HEIGHT }}>
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {[0, 50, 100].map((v) => (
              <line
                key={v}
                x1="0"
                x2="100"
                y1={y(v)}
                y2={y(v)}
                stroke="var(--color-rule)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {days.length > 1 ? (
              <polyline
                points={line}
                fill="none"
                stroke="var(--color-ice, var(--color-accent))"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </svg>

          <ol className="absolute inset-0" aria-label="Overall score by day">
            {days.map((d, i) => {
              const last = i === days.length - 1;
              return (
                <li
                  key={d.date}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x(i)}%`, top: `${y(d.overall)}%` }}
                >
                  {/* The hit area is bigger than the dot, for a finger. */}
                  <span
                    tabIndex={0}
                    className="grid size-6 cursor-default place-items-center rounded-full outline-none"
                  >
                    <span
                      className="size-2.5 rounded-full border-2 border-paper-raised group-hover:scale-125 group-focus-within:scale-125"
                      style={{ background: 'var(--color-ice, var(--color-accent))' }}
                    />
                    <span className="sr-only">
                      {shortDate(d.date)}: overall {d.overall}%. That day {d.right} of {d.answered}{' '}
                      right.
                    </span>
                  </span>
                  {/* Opens towards the middle, so it never runs off a phone screen. */}
                  <span
                    role="presentation"
                    className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden ${x(i) > 50 ? 'right-0' : 'left-0'} rounded-[5px] border border-rule-strong bg-paper-raised px-2.5 py-1.5 text-xs whitespace-nowrap text-ink shadow-sm group-focus-within:block group-hover:block`}
                  >
                    <span className="block font-medium">{shortDate(d.date)}</span>
                    <span className="block tabular-nums">Overall {d.overall}%</span>
                    <span className="block text-slate tabular-nums">
                      That day {d.right} of {d.answered} right
                    </span>
                  </span>
                  {last ? (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 text-xs font-medium text-ink tabular-nums"
                    >
                      {d.overall}%
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="mt-6 flex justify-between pl-11 pr-1 text-xs text-muted" aria-hidden>
        <span>{shortDate(days[0].date)}</span>
        {days.length > 1 ? <span>{shortDate(latest.date)}</span> : null}
      </div>

      <details className="mt-4 text-sm">
        <summary className="-my-2 inline-block cursor-pointer py-2 text-slate underline underline-offset-4 hover:text-ink">
          See each day
        </summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1.5 font-normal">Day</th>
              <th className="py-1.5 font-normal">That day</th>
              <th className="py-1.5 text-right font-normal">Overall</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {[...days].reverse().map((d) => (
              <tr key={d.date}>
                <td className="py-1.5">{shortDate(d.date)}</td>
                <td className="py-1.5 text-slate">
                  {d.right} of {d.answered} right
                </td>
                <td className="py-1.5 text-right">{d.overall}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
