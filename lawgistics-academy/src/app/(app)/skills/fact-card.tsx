'use client';

import { useState } from 'react';
import { Card, cn } from '@/components/ui';

/**
 * A fact you open rather than one you scroll past.
 *
 * The title is written to be surprising on its own; the body is the actual
 * point. Holding the body back is not a trick to manufacture a click: an
 * unanswered question is remembered better than the same sentence read
 * passively, which is the same reason the app asks before it explains.
 */
export function FactCard({
  title,
  body,
  whyItMatters,
  source,
}: {
  title: string;
  body: string;
  whyItMatters: string | null;
  source: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="eyebrow mb-2 block text-burgundy">Worth knowing</span>
          <span className="block font-serif text-lg leading-snug sm:text-xl">{title}</span>
        </span>
        <span
          aria-hidden
          className={cn(
            'mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border border-rule-strong text-sm transition-transform',
            open && 'rotate-45',
          )}
        >
          +
        </span>
      </button>

      {open ? (
        <div className="rise-in mt-4 border-t border-rule pt-4">
          <p className="text-[0.9375rem] leading-relaxed text-slate">{body}</p>
          {whyItMatters ? (
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate">{whyItMatters}</p>
          ) : null}
          {source ? <p className="mt-3 text-xs text-muted">{source}</p> : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">Tap to read it.</p>
      )}
    </Card>
  );
}
