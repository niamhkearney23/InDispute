'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ButtonLink, cn } from '@/components/ui';
import {
  ArrowIcon,
  BookIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  LevelIcon,
  RepeatIcon,
  SparkIcon,
} from '@/components/icons';
import type { TourFinish, TourIcon, TourStep } from '@/content/tour';

const ICONS: Record<TourIcon, typeof SparkIcon> = {
  spark: SparkIcon,
  calendar: CalendarIcon,
  check: CheckIcon,
  book: BookIcon,
  level: LevelIcon,
  briefcase: BriefcaseIcon,
  repeat: RepeatIcon,
  arrow: ArrowIcon,
};

/**
 * One card at a time, with Back and Next, and a way out on every card. The
 * heading takes focus when the card changes, so a screen reader hears the new
 * card rather than nothing; the arrow keys move through it too.
 */
export function Tour({ steps, finish }: { steps: TourStep[]; finish: TourFinish }) {
  const [index, setIndex] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  const total = steps.length + 1;
  const last = index === total - 1;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select')) return;
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(total - 1, i + 1));
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  const step = last ? null : steps[index];
  const Icon = step ? ICONS[step.icon] : CheckIcon;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-slate tabular-nums" aria-live="polite">
          {index + 1} of {total}
        </p>
        {!last ? (
          <Link
            href={finish.href}
            className="-my-2 inline-block rounded-[5px] px-1 py-2 text-sm text-slate underline underline-offset-4 hover:text-ink"
          >
            Skip the tour
          </Link>
        ) : null}
      </div>

      <div className="mb-6 flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i <= index ? 'bg-accent' : 'bg-rule',
            )}
          />
        ))}
      </div>

      <section
        key={index}
        className="rise-in rounded-2xl border border-rule bg-paper-raised p-6 shadow-card sm:p-9"
      >
        <span className="mb-5 grid size-12 place-items-center rounded-full bg-accent-wash text-accent">
          <Icon className="size-6" />
        </span>
        {step ? <p className="eyebrow mb-2">{step.where}</p> : null}
        <h2
          ref={heading}
          tabIndex={-1}
          className="text-3xl outline-none sm:text-4xl"
        >
          {step ? step.title : finish.title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate sm:text-lg">
          {step ? step.body : finish.body}
        </p>
      </section>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="inline-flex min-h-11 items-center rounded-md px-4 text-[0.9375rem] font-medium text-slate hover:bg-paper-sunk hover:text-ink disabled:invisible"
        >
          Back
        </button>
        {last ? (
          <ButtonLink href={finish.href} variant="accent">
            {finish.label}
            <ArrowIcon className="ml-2 size-4" />
          </ButtonLink>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            className="inline-flex h-11 items-center rounded-md bg-accent px-5 text-[0.9375rem] font-medium text-paper shadow-button hover:bg-accent-soft"
          >
            Next
            <ArrowIcon className="ml-2 size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
