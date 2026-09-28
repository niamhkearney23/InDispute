'use client';

import { useEffect, useState } from 'react';

/**
 * A number that counts up to its value when it appears. Small enough to be
 * felt rather than watched: XP after an answer, the tally on a summary.
 * Under reduced motion it simply shows the value.
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

  useEffect(() => {
    let frame = 0;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      frame = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // Ease out: fast at first, settling on the number.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return (
    <span className={className}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
