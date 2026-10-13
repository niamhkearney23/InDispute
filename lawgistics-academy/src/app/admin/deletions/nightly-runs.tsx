import { Card, Notice, Pill, SectionHeading } from '@/components/ui';
import type { RecordedRun } from '@/lib/account/erasure-monitor-store';
import { waitedFor, type RunStatus } from '@/lib/account/erasure-monitoring';

const STATUS: Record<RunStatus, { label: string; tone: 'correct' | 'warn' | 'wrong' }> = {
  ok: { label: 'All finished', tone: 'correct' },
  warning: { label: 'Warning', tone: 'warn' },
  escalate: { label: 'Needs action', tone: 'wrong' },
};

/** What one run found, in a sentence. Counts only. */
export function runSummary(run: RecordedRun): string {
  if (run.outstanding === null) {
    return `Tried ${run.tried ?? 0}, finished ${run.completed ?? 0}. The unfinished deletions could not be read.`;
  }
  if (run.outstanding === 0) {
    return `Nothing left unfinished. Tried ${run.tried ?? 0}, finished ${run.completed ?? 0}.`;
  }
  const parts = [`${run.outstanding} unfinished. Tried ${run.tried ?? 0}, finished ${run.completed ?? 0}.`];
  if (run.notAttempted) parts.push(`${run.notAttempted} not attempted.`);
  if (run.repeatedlyFailing) parts.push(`${run.repeatedlyFailing} failing repeatedly.`);
  if (run.oldestOutstandingHours !== null) {
    parts.push(`Oldest waiting ${waitedFor(run.oldestOutstandingHours)}.`);
  }
  return parts.join(' ');
}

/** The nightly check's last few runs on Admin, Deletions (0049). */
export function NightlyRuns({
  runs,
  error,
  timeZone,
}: {
  runs: RecordedRun[];
  error: boolean;
  timeZone: string;
}) {
  const when = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    });
  return (
    <section>
      <SectionHeading eyebrow="Every night" title="The nightly check" />
      <p className="mb-3 max-w-2xl text-sm text-slate">
        Each night the unfinished deletions are tried again and the result is recorded here. A run
        that leaves anything unfinished is marked failed in Vercel and, when an alert address is
        set, sends an alert.
      </p>
      {error ? (
        <Notice tone="warn">The nightly runs could not be read just now. Reload to try again.</Notice>
      ) : runs.length === 0 ? (
        <p className="text-sm text-slate">No run is recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {runs.map((run) => (
            <li key={run.id}>
              <Card>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{when(run.startedAt)}</span>
                  <Pill tone={STATUS[run.status].tone}>{STATUS[run.status].label}</Pill>
                </div>
                <p className="mt-1 text-sm text-slate">{runSummary(run)}</p>
                {run.status !== 'ok' || run.alertSent ? (
                  <p className="mt-1 text-sm text-muted">
                    {run.alertSent ? 'Alert sent.' : (run.alertError ?? 'No alert sent.')}
                  </p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
