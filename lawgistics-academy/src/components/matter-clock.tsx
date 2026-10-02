'use client';

import { useEffect, useState } from 'react';

/**
 * The clock on the example matter on the front page. It counts down so the
 * card reads as a file somebody is working on rather than a picture of one.
 * It is an example: nothing is timed, saved or sent.
 */
export function MatterClock({
  startSeconds,
  totalSeconds,
}: {
  startSeconds: number;
  totalSeconds: number;
}) {
  const [left, setLeft] = useState(startSeconds);

  useEffect(() => {
    const timer = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : startSeconds)), 1000);
    return () => clearInterval(timer);
  }, [startSeconds]);

  const minutes = Math.floor(left / 60);
  const seconds = String(left % 60).padStart(2, '0');
  const used = Math.round(((totalSeconds - left) / totalSeconds) * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.14em] text-slate uppercase">Time left</p>
        <p className="font-mono text-2xl font-semibold tabular-nums text-ink" aria-hidden>
          {minutes}:{seconds}
        </p>
        <span className="sr-only">About {minutes} minutes left of 45</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-rule">
        <div
          className="h-full rounded-full bg-wine transition-[width] duration-1000 ease-linear"
          style={{ width: `${used}%` }}
        />
      </div>
    </div>
  );
}
