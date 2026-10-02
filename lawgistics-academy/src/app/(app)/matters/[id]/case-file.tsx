import { matterLabel } from '@/lib/matters/rules';
import type { Attempt } from '@/lib/matters/service';

/**
 * The facts, set like a document on a file rather than a paragraph on a
 * web page: a header strip, a reference, ruled paper. The reference and
 * the "invented facts" line are there so nobody mistakes a training file
 * for a real one.
 */
export function CaseFile({
  snapshot,
  collapsible = false,
}: {
  snapshot: Attempt['snapshot'];
  collapsible?: boolean;
}) {
  const body = (
    <div className="case-paper px-5 py-5 sm:px-8 sm:py-7">
      <p className="ruled font-serif text-[1.0625rem] whitespace-pre-line text-ink">
        {snapshot.brief}
      </p>
    </div>
  );

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-paper-sunk px-5 py-3 sm:px-8">
      <span className="font-mono text-xs font-semibold tracking-wider text-burgundy">
        {matterLabel(snapshot.number)}
        {snapshot.area ? ` · ${snapshot.area}` : ''}
      </span>
      <span className="font-mono text-[0.6875rem] tracking-wider text-muted uppercase">
        Training file · invented facts
      </span>
    </div>
  );

  if (collapsible) {
    return (
      <details className="group overflow-hidden rounded-xl border border-rule bg-paper-raised shadow-card">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          {header}
          <p className="px-5 py-3 text-sm font-medium text-burgundy sm:px-8">
            <span className="group-open:hidden">Read the facts again</span>
            <span className="hidden group-open:inline">Hide the facts</span>
          </p>
        </summary>
        {body}
      </details>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-rule bg-paper-raised shadow-raised">
      {header}
      {body}
    </section>
  );
}
