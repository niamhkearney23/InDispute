'use client';

import { useEffect, useRef, useState } from 'react';
import Link from '@/components/app-link';

export interface TourStep {
  title: string;
  text: string;
  href: string;
  action: string;
}

/**
 * A short, optional introduction on a person's first visit to Today: four
 * steps at most, each naming one place and what it is for (the owner's
 * design brief, November 2026). It sits on the page rather than over it, so
 * the page stays usable and readable without it. Skip or Finish remembers,
 * on this browser, that it was seen; "Help: quick tour" in the account menu
 * opens it again. Keyboard: the buttons are ordinary buttons, a new step
 * moves focus to its heading, and closing puts focus back on the page.
 */
export function LearnerTour({
  userId,
  steps,
  forceOpen = false,
}: {
  userId: string;
  steps: TourStep[];
  /** Opened from Help, whatever was remembered. */
  forceOpen?: boolean;
}) {
  const storageKey = `academy:learner-tour:v1:${userId}`;
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const region = useRef<HTMLElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(storageKey) === 'done';
    } catch {
      // No storage: show it, and it simply shows again next time.
    }
    // Read once on arrival: what was remembered on this browser decides.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (forceOpen || !seen) setOpen(true);
  }, [forceOpen, storageKey]);

  useEffect(() => {
    if (forceOpen && open) region.current?.scrollIntoView({ block: 'nearest' });
  }, [forceOpen, open]);

  if (!open || steps.length === 0) return null;
  const step = steps[Math.min(index, steps.length - 1)];
  const last = index >= steps.length - 1;

  function close() {
    try {
      localStorage.setItem(storageKey, 'done');
    } catch {
      // The tour still closes without storage.
    }
    setOpen(false);
    setIndex(0);
    document.getElementById('main-title')?.focus();
  }

  function move(next: number) {
    setIndex(next);
    requestAnimationFrame(() => heading.current?.focus());
  }

  const button =
    'inline-flex min-h-11 items-center justify-center rounded-[5px] px-4 text-sm font-medium transition-colors';

  return (
    <section
      ref={region}
      aria-label="Quick tour"
      className="rounded-xl border border-periwinkle/40 bg-periwinkle-wash/60 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-[0.12em] text-periwinkle-ink uppercase" aria-live="polite">
          Quick tour · {index + 1} of {steps.length}
        </p>
        <button type="button" onClick={close} className={`${button} -mr-2 px-2 text-slate hover:text-ink`}>
          Skip tour
        </button>
      </div>
      <h2 ref={heading} tabIndex={-1} className="mt-1 text-xl leading-snug focus:outline-none focus-visible:outline-2">
        {step.title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-slate">{step.text}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={step.href} className="inline-flex min-h-11 items-center text-sm font-medium text-periwinkle-ink hover:underline">
          {step.action} ›
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => move(index - 1)}
            className={`${button} border border-rule-strong bg-paper-raised text-ink hover:bg-paper-sunk disabled:opacity-40`}
          >
            Back
          </button>
          {last ? (
            <button type="button" onClick={close} className={`${button} bg-ink text-paper hover:bg-charcoal`}>
              Finish
            </button>
          ) : (
            <button type="button" onClick={() => move(index + 1)} className={`${button} bg-ink text-paper hover:bg-charcoal`}>
              Next
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
