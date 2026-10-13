import type { ErasureJob } from '@/lib/account/erasure';
import { ERASURE_STEPS, STEP_LABEL, type ErasureStep } from '@/lib/account/erasure-rules';

/** When each step of a deletion finished, or that it has not, in words. */
export function StepList({ job, timeZone }: { job: ErasureJob; timeZone: string }) {
  const at: Record<ErasureStep, string | null> = {
    database: job.databaseDoneAt,
    sessions: job.sessionsDoneAt,
    signIn: job.authDoneAt,
    files: job.storageDoneAt,
  };
  const when = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    });
  return (
    <ul className="mt-3 space-y-1 text-sm">
      {ERASURE_STEPS.map((step) => (
        <li key={step} className="flex flex-wrap gap-x-2">
          <span className={at[step] ? 'text-verdict-correct' : 'text-warn'}>
            {at[step] ? 'Done' : 'Not yet'}
          </span>
          <span>{STEP_LABEL[step]}</span>
          {at[step] ? <span className="text-muted">({when(at[step] as string)})</span> : null}
        </li>
      ))}
    </ul>
  );
}
