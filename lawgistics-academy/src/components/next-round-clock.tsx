'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The corner clock on a trainee's working morning: how long until the next
 * round opens, or how long the open one has left. When it reaches zero the
 * page refreshes, so the round that just opened can be started.
 */
export function NextRoundClock({
  at,
  label,
}: {
  /** When the clock runs out: the next round opening, or the open one closing. */
  at: string;
  /** What happens then, e.g. "Round 3 opens" or "Round 2 closes". */
  label: string;
}) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);

  // Not read during render: the server's clock and the browser's differ, and
  // the first reading waits for the browser so the two pages agree.
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
    };
  }, []);

  const left = now === null ? null : new Date(at).getTime() - now;
  useEffect(() => {
    if (left !== null && left <= 0) router.refresh();
  }, [left, router]);

  if (left === null || left <= 0) return null;
  const minutes = Math.floor(left / 60_000);
  const seconds = Math.floor((left % 60_000) / 1000);
  const clock =
    minutes >= 60
      ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
      : `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className="fixed right-3 bottom-3 z-40 rounded-full border border-rule-strong bg-paper-raised px-3.5 py-2 text-sm shadow-raised"
      role="timer"
      aria-live="off"
    >
      <span className="text-slate">{label} in </span>
      <span className="font-semibold tabular-nums">{clock}</span>
    </div>
  );
}
