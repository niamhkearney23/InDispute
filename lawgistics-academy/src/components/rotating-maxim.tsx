'use client';

import { useEffect, useState } from 'react';

/**
 * The programme's twenty one-line rules, one at a time, turning over every
 * few seconds. Something to read while the page is open that is worth
 * reading: these are the lines the trainees are meant to carry out of the
 * month. Paused for anybody who has asked for less motion, and the current
 * line is announced politely rather than on every change.
 */

/** One rule, as the server hands it over once it is signed off. */
export interface MaximRule {
  day: number;
  concept: string;
  line: string;
}

/**
 * The rules come from the server, and only once a lawyer has signed off
 * their wording (0046's rule); this file never imports them, or every
 * visitor's browser would be sent them signed or not.
 */
export function RotatingMaxim({ className, rules }: { className?: string; rules: MaximRule[] }) {
  const RULES = rules;
  const count = rules.length;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), 5200);
    return () => window.clearInterval(timer);
  }, [count]);

  const rule = RULES[index];
  if (!rule) return null;

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
