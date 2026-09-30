'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A number that counts up to its value when it appears. Small enough to be
 * felt rather than watched: XP after an answer, the tally on a summary.
 * Under reduced motion it simply shows the value.
 *
 * The moving digits are hidden from assistive technology and the settled
 * value sits beside them for it, so a screen reader hears "+20 XP" once
 * rather than forty numbers on the way there.
 */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  durationMs = 650,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(0);
  // Where the last run ended, so a value that changes mid-flight continues
  // from the number on screen rather than dropping to zero.
  const from = useRef(0);

  useEffect(() => {
    let frame = 0;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      frame = requestAnimationFrame(() => {
        from.current = value;
        setShown(value);
      });
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    const base = from.current;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // Ease out: fast at first, settling on the number.
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(base + (value - base) * eased);
      from.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return (
    <span className={className}>
      <span aria-hidden>
        {prefix}
        {shown}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {value}
        {suffix}
      </span>
    </span>
  );
}
