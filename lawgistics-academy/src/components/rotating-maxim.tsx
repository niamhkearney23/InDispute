'use client';

import { useEffect, useState } from 'react';
import { DAY_CONCEPTS } from '@/content/programme-concepts';

/**
 * The programme's twenty one-line rules, one at a time, turning over every
 * few seconds. Something to read while the page is open that is worth
 * reading: these are the lines the trainees are meant to carry out of the
 * month. Paused for anybody who has asked for less motion, and the current
 * line is announced politely rather than on every change.
 */
const RULES = DAY_CONCEPTS.map((c) => ({ day: c.day, concept: c.concept, line: c.remember }));

export function RotatingMaxim({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % RULES.length), 5200);
    return () => window.clearInterval(timer);
  }, []);

  const rule = RULES[index];

  return (
    <figure className={className}>
      <div className="rounded-2xl border border-paper/20 bg-paper/10 p-5 backdrop-blur-sm sm:p-6">
        <p className="mb-3 flex items-center justify-between gap-3 text-[0.6875rem] font-semibold tracking-[0.16em] text-paper/70 uppercase">
          <span>Rule {rule.day} of {RULES.length}</span>
          <span className="truncate normal-case tracking-normal">{rule.concept}</span>
        </p>
        <blockquote key={rule.day} className="maxim-in font-serif text-2xl leading-snug sm:text-[1.75rem]">
          {rule.line}
        </blockquote>
        <div className="mt-5 flex gap-1" aria-hidden>
          {RULES.map((r, i) => (
            <span
              key={r.day}
              className={
                i === index
                  ? 'h-1 flex-[3] rounded-full bg-paper transition-all duration-500'
                  : 'h-1 flex-1 rounded-full bg-paper/25 transition-all duration-500'
              }
            />
          ))}
        </div>
      </div>
      <figcaption className="sr-only">One of twenty rules for running a file</figcaption>
    </figure>
  );
}
