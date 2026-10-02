import { Pill } from '@/components/ui';
import { JURISDICTION_LABELS, JURISDICTION_SHORT } from '@/lib/types';
import type { DailyFact } from '@/lib/facts/service';

/**
 * One fact a day, on the dashboard, as a reveal.
 *
 * The headline arrives on its own with "think about it first", and the
 * rest stays folded until it is opened. Five seconds of guessing before
 * reading is what turns a paragraph somebody skims into one they
 * remember. A native disclosure, so it works without script, with a
 * keyboard, and with a screen reader announcing it as expandable.
 */
export function DailyBrief({ fact }: { fact: DailyFact }) {
  return (
    <details className="brief group rounded-xl border border-ink/12 bg-paper-sunk shadow-card">
      <summary className="cursor-pointer list-none rounded-xl p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="eyebrow">Did you know?</p>
          <Pill tone={fact.jurisdiction === 'AU_GENERAL' ? 'neutral' : 'accent'}>
            <span title={JURISDICTION_LABELS[fact.jurisdiction]}>
              {JURISDICTION_SHORT[fact.jurisdiction]}
            </span>
          </Pill>
          {fact.court ? <span className="text-xs text-muted">{fact.court}</span> : null}
        </div>
        <h2 className="text-xl leading-snug sm:text-2xl">{fact.title}</h2>
        <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent">
          <span className="group-open:hidden">Think about why for five seconds, then tap to see.</span>
          <span className="hidden group-open:inline">Hide it</span>
          <span
            aria-hidden
            className="inline-block transition-transform duration-200 group-open:rotate-180"
          >
            ▾
          </span>
        </p>
      </summary>

      <div className="brief-body px-5 pb-5 sm:px-6 sm:pb-6">
        <p className="text-[0.9375rem] leading-relaxed text-slate">{fact.body}</p>

        {fact.whyItMatters ? (
          <div className="mt-4 rounded-lg border-l-2 border-accent bg-paper px-4 py-3">
            <p className="eyebrow mb-1.5">Why this matters in practice</p>
            <p className="text-[0.9375rem] leading-relaxed text-slate">{fact.whyItMatters}</p>
          </div>
        ) : null}

        {fact.sourceReference ? (
          <p className="mt-4 border-t border-rule pt-3 text-xs text-muted">
            {fact.sourceUrl ? (
              <a
                href={fact.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {fact.sourceReference}
              </a>
            ) : (
              fact.sourceReference
            )}
          </p>
        ) : null}
      </div>
    </details>
  );
}
