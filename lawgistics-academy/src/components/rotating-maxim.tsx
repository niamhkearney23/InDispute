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
      {/* A quiet line at the foot of the sign-in pages: the rule in the
          serif, and which of the twenty it is, nothing boxed. */}
      <blockquote key={rule.day} className="maxim-in font-serif text-lg leading-snug text-paper/70 italic">
        {rule.line}
      </blockquote>
      <p className="mt-2 text-xs text-paper/35">
        Rule {rule.day} of {RULES.length} · {rule.concept}
      </p>
      <figcaption className="sr-only">One of twenty rules for running a file</figcaption>
    </figure>
  );
}
