import { Card, Pill } from '@/components/ui';
import { JURISDICTION_LABELS, JURISDICTION_SHORT } from '@/lib/types';
import type { DailyFact } from '@/lib/facts/service';

/**
 * One fact a day, on the dashboard. Deliberately quiet: it sits below the call
 * to train, because the training loop is the product and this is a reason to
 * open the app on a day you weren't going to.
 */
export function DailyBrief({ fact }: { fact: DailyFact }) {
  return (
    <Card className="border-ink/12 bg-paper-sunk">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="eyebrow">Daily brief</p>
        <Pill tone={fact.jurisdiction === 'AU_GENERAL' ? 'neutral' : 'accent'}>
          <span title={JURISDICTION_LABELS[fact.jurisdiction]}>
            {JURISDICTION_SHORT[fact.jurisdiction]}
          </span>
        </Pill>
        {fact.court ? <span className="text-xs text-muted">{fact.court}</span> : null}
      </div>

      <h2 className="mb-3 text-xl leading-snug sm:text-2xl">{fact.title}</h2>

      <p className="text-[0.9375rem] leading-relaxed text-slate">{fact.body}</p>

      {fact.whyItMatters ? (
        <div className="mt-4">
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
    </Card>
  );
}
