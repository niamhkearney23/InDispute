'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The corner clock on a trainee's working morning: how long until the next
 * round opens, or how long the open one has left. When it reaches zero the
 * page refreshes, so the round that just opened can be started. It refreshes
 * once per moment, and again only after a pause: a phone whose clock runs
 * fast would otherwise reach zero before the server does and refresh every
 * second until the server caught up. It can be hidden, because something
 * that changes every second should be possible to put away.
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
  const refreshed = useRef<{ at: string; when: number } | null>(null);
  useEffect(() => {
    if (left === null || left > 0 || now === null) return;
    const last = refreshed.current;
    if (last && last.at === at && now - last.when < 15_000) return;
    refreshed.current = { at, when: now };
    router.refresh();
  }, [left, now, at, router]);

  const [hiddenFor, setHiddenFor] = useState<string | null>(null);

  if (left === null || left <= 0 || hiddenFor === at) return null;
  const minutes = Math.floor(left / 60_000);
  const seconds = Math.floor((left % 60_000) / 1000);
  const clock =
    minutes >= 60
      ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
      : `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className="fixed right-3 bottom-3 z-40 flex items-center rounded-full border border-rule-strong bg-paper-raised px-3.5 py-2 text-sm shadow-raised"
      role="timer"
      aria-live="off"
    >
      {/* A non-breaking space, not a plain one: the box is a flex row, and
          a flex item's trailing space is dropped, which printed "closes
          in44:59". */}
      <span className="text-slate">{label} in{'\u00a0'}</span>
      <span className="font-semibold tabular-nums">{clock}</span>
      <button
        type="button"
        onClick={() => setHiddenFor(at)}
        aria-label="Hide the clock until the next round"
        className="-my-2 -mr-2 ml-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-slate hover:text-ink"
      >
        ×
      </button>
    </div>
  );
}
