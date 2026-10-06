import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { brand } from '@/lib/brand';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-[5px] font-medium ' +
  'transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45 ' +
  'select-none touch-manipulation';

const BUTTON_VARIANTS = {
  primary: 'bg-ink text-paper shadow-button hover:bg-charcoal active:translate-y-px',
  accent: 'bg-accent text-paper shadow-button hover:bg-accent-soft active:translate-y-px',
  outline:
    'border border-rule-strong bg-paper-raised text-ink shadow-button hover:bg-paper-sunk active:translate-y-px',
  ghost: 'text-slate hover:text-ink hover:bg-paper-sunk',
  // On an accent-coloured surface, where the accent button would vanish.
  light: 'bg-paper text-accent shadow-button hover:bg-white active:translate-y-px',
} as const;

const BUTTON_SIZES = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-[0.9375rem]',
  lg: 'h-13 px-6 text-base w-full sm:w-auto',
} as const;

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
}) {
  return (
    <Link
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                   */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return (
    <Tag
      className={cn(
        'panel rounded-lg border border-rule bg-paper-raised p-5 shadow-card sm:p-6',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h2 className="text-xl sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/**
 * A link inside a sentence.
 *
 * Exists because an inline <a> is as tall as its text, which is 17px, and 17px
 * is not a thing you can reliably hit with a thumb. The padding makes the tap
 * area 32px without changing where the words sit, and inline-block is what lets
 * vertical padding count at all.
 */
export function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-block py-1.5 font-medium underline underline-offset-2"
    >
      {children}
    </Link>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/* -------------------------------------------------------------------------- */
/* Data display                                                               */
/* -------------------------------------------------------------------------- */

export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'correct' | 'wrong' | 'warn';
}) {
  const tones = {
    neutral: 'border-rule-strong text-slate',
    accent: 'border-accent/30 bg-accent-wash text-accent',
    correct: 'border-verdict-correct/30 bg-verdict-correct-wash text-verdict-correct',
    wrong: 'border-verdict-wrong/30 bg-verdict-wrong-wash text-verdict-wrong',
    warn: 'border-warn/30 bg-warn-wash text-warn',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-wide uppercase',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/**
 * The skill map bar. Colour carries meaning, so the numeric score is always
 * printed alongside it; the bar alone would not be accessible.
 */
export function ScoreBar({
  label,
  score,
  sublabel,
  band,
  unit = '/100',
  early = false,
  earlyText = 'Too early to say',
}: {
  label: string;
  score: number;
  sublabel?: string;
  band: 'weak' | 'developing' | 'strong';
  /** What the number is out of. A strength score is out of 100; a share is a percentage. */
  unit?: '/100' | '%';
  /**
   * Too few answers to say anything. No number and no coloured bar: a
   * strength score climbs a step per right answer, so after one right answer
   * it is still low, and showing that low number in the "weak" colour read
   * as a bad mark for getting it right.
   */
  early?: boolean;
  /** What to say instead of a number: "Not asked yet" when nothing has been asked. */
  earlyText?: string;
}) {
  const fill = {
    weak: 'bg-accent',
    developing: 'bg-slate',
    strong: 'bg-verdict-correct',
  }[band];

  return (
    <div className="py-2.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {early ? (
          <span className="shrink-0 text-xs text-muted">{earlyText}</span>
        ) : (
          <span className="shrink-0 font-serif text-base tabular-nums">
            {score}
            <span className="ml-0.5 font-sans text-xs text-muted">{unit === '%' ? '%' : ' out of 100'}</span>
          </span>
        )}
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-paper-sunk"
        role="meter"
        aria-valuenow={early ? 0 : score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={early ? `${label}: ${earlyText.toLowerCase()}` : `${label}: ${score}${unit === '%' ? ' percent' : ' out of 100'}`}
      >
        {early ? null : (
          <div
            className={cn('h-full rounded-full transition-all duration-500', fill)}
            style={{ width: `${Math.max(score, 1.5)}%` }}
          />
        )}
      </div>
      {sublabel ? <p className="mt-1 text-xs text-muted">{sublabel}</p> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <p className="eyebrow mb-1">{label}</p>
      <p className="font-serif text-2xl leading-none sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-rule-strong px-6 py-10 text-center">
      <h3 className="mb-1.5 text-lg">{title}</h3>
      <p className="mx-auto max-w-md text-sm text-slate">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Notice({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'good' | 'warn' | 'error';
  children: ReactNode;
}) {
  const tones = {
    neutral: 'border-rule bg-paper-sunk text-slate',
    // For a state that is genuinely settled rather than merely informational:
    // cleared to begin, signed off, nothing left outstanding. Uses the same
    // tokens as Pill's correct tone so the two agree on screen.
    good: 'border-verdict-correct/25 bg-verdict-correct-wash text-verdict-correct',
    warn: 'border-warn/35 bg-warn-wash text-warn',
    error: 'border-verdict-wrong/25 bg-verdict-wrong-wash text-verdict-wrong',
  } as const;

  return (
    <div className={cn('rounded-md border px-4 py-3 text-sm', tones[tone])}>{children}</div>
  );
}

/* -------------------------------------------------------------------------- */
/* Brand                                                                      */
/* -------------------------------------------------------------------------- */

export function Wordmark({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  /** On a dark or accent-coloured surface: the suffix goes pale rather than muted. */
  light?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-serif text-lg leading-none font-semibold tracking-tight">
        {brand.name}
      </span>
      {brand.suffix ? (
        <span
          className={cn(
            'text-[0.6875rem] font-medium tracking-[0.16em] uppercase',
            light ? 'text-paper/70' : 'text-muted',
            // The header is tight on a phone (see the app layout), so the
            // compact form drops the suffix there and keeps it where it fits.
            compact && 'hidden sm:inline',
          )}
        >
          {brand.suffix}
        </span>
      ) : null}
    </span>
  );
}
