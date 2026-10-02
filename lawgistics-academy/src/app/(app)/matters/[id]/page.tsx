import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import {
  matterForLearner,
  modelAnswerFor,
  signedUrlForRecording,
} from '@/lib/matters/service';
import type { Attempt } from '@/lib/matters/service';
import { describeLimit, matterLabel } from '@/lib/matters/rules';
import { Button, Card, Notice, Pill } from '@/components/ui';
import { startMatter } from '../../actions';
import { MatterWorkspace } from './matter-workspace';
import { CaseFile } from './case-file';

export const metadata: Metadata = { title: 'Matter' };
export const dynamic = 'force-dynamic';

const TASKS = [
  ['Identify the procedure', 'What the client needs, and the rule it comes from.'],
  ['Draft a short advice', 'What they should do, by when, and why.'],
  ['Explain it out loud', 'Up to three minutes, as you would to the client.'],
  ['Answer five follow-up questions', 'Asked about your own draft, the way a supervisor would.'],
] as const;

function when(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
}

/**
 * One matter. Three states, decided by the latest attempt: not started (the
 * tasks and the time limit, but not the facts), working (the file, the clock
 * and the tasks), and handed in (what they wrote, the lawyer's approach, and
 * the mark when it comes).
 */
export default async function MatterPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=/matters/${id}`);
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  const found = await matterForLearner(id, user.id);
  if (!found) notFound();
  const { matter, attempts } = found;
  const latest = attempts[0] ?? null;

  const back = (
    <p className="text-sm">
      <Link
        href="/matters"
        className="-mx-1 inline-flex min-h-11 items-center rounded-[5px] px-1 text-slate underline underline-offset-2 hover:bg-paper-sunk"
      >
        All matters
      </Link>
    </p>
  );

  if (latest?.stage === 'working') {
    const recordingUrl = latest.hasRecording ? await signedUrlForRecording(latest.id) : null;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {back}
        <MatterWorkspace attempt={latest} recordingUrl={recordingUrl} />
      </div>
    );
  }

  if (latest) {
    const [answer, recordingUrl] = await Promise.all([
      modelAnswerFor(latest.id),
      latest.hasRecording ? signedUrlForRecording(latest.id) : Promise.resolve(null),
    ]);
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {back}
        <HandedIn
          attempt={latest}
          modelAnswer={answer?.modelAnswer ?? ''}
          sources={answer?.sources ?? ''}
          recordingUrl={recordingUrl}
          timeZone={profile.timezone}
          canStartAgain={matter.published}
          matterId={matter.id}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {back}
      <section className="rise-in">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs font-semibold tracking-wider text-accent">
            {matterLabel(matter.number)}
          </span>
          {matter.area ? <Pill>{matter.area}</Pill> : null}
        </div>
        <h1 className="text-4xl sm:text-5xl">{matter.title}</h1>
        <p className="mt-4 max-w-xl text-slate">
          You have {describeLimit(matter.timeLimitMinutes)}. The facts open when you start the
          clock. Going over is allowed, but the record will say so.
        </p>
      </section>

      <Card>
        <p className="eyebrow mb-4">Your task</p>
        <ol className="space-y-4">
          {TASKS.map(([title, body], i) => (
            <li key={title} className="flex gap-3.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-wash font-serif text-accent">
                {i + 1}
              </span>
              <span>
                <span className="block font-medium">{title}</span>
                <span className="block text-sm text-slate">{body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-5 border-t border-rule pt-4 text-sm text-slate">
          Then you see how a lawyer would approach it, and a lawyer marks your work Good or
          Needs another go.
        </p>
      </Card>

      <form action={startMatter}>
        <input type="hidden" name="matterId" value={matter.id} />
        <Button type="submit" size="lg" variant="accent" className="h-14 w-full sm:w-auto sm:px-10">
          Start the clock
        </Button>
      </form>
    </div>
  );
}

function HandedIn({
  attempt,
  modelAnswer,
  sources,
  recordingUrl,
  timeZone,
  canStartAgain,
  matterId,
}: {
  attempt: Attempt;
  modelAnswer: string;
  sources: string;
  recordingUrl: string | null;
  timeZone: string;
  canStartAgain: boolean;
  matterId: string;
}) {
  return (
    <>
      <section className="rise-in">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs font-semibold tracking-wider text-accent">
            {matterLabel(attempt.snapshot.number)}
          </span>
          {attempt.stage === 'good' ? (
            <Pill tone="correct">Marked Good</Pill>
          ) : attempt.stage === 'again' ? (
            <Pill tone="warn">Needs another go</Pill>
          ) : (
            <Pill tone="accent">Handed in, waiting for a lawyer</Pill>
          )}
          {attempt.submittedLate ? <Pill tone="wrong">Over time</Pill> : null}
        </div>
        <h1 className="text-4xl sm:text-5xl">{attempt.snapshot.title}</h1>
        {attempt.submittedAt ? (
          <p className="mt-2 text-sm text-muted">Handed in {when(attempt.submittedAt, timeZone)}.</p>
        ) : null}
      </section>

      {attempt.feedback || attempt.verdict ? (
        <Notice tone={attempt.verdict === 'good' ? 'good' : 'warn'}>
          <span className="block font-medium">From the lawyer who marked it</span>
          <span className="mt-1 block whitespace-pre-line">{attempt.feedback || 'No note.'}</span>
        </Notice>
      ) : null}

      <section className="brief-open rounded-2xl border-2 border-accent/30 bg-accent-wash p-5 sm:p-7">
        <p className="eyebrow mb-1 text-accent">How a lawyer would approach it</p>
        <p className="mb-4 text-xs text-slate">
          Compare it with yours. There is more than one good answer; look for what you missed,
          not for the same words.
        </p>
        <div className="text-[0.9375rem] leading-relaxed whitespace-pre-line text-ink">
          {modelAnswer || 'The lawyer’s approach could not be loaded just now.'}
        </div>
        {sources ? <p className="mt-4 border-t border-accent/20 pt-3 text-xs text-slate">{sources}</p> : null}
      </section>

      <CaseFile snapshot={attempt.snapshot} collapsible />

      <Card>
        <p className="eyebrow mb-3">What you handed in</p>
        <h2 className="mb-1 text-lg">1. The procedure</h2>
        <p className="mb-5 text-sm whitespace-pre-line text-slate">{attempt.procedureAnswer}</p>
        <h2 className="mb-1 text-lg">2. Your advice</h2>
        <p className="mb-5 text-sm whitespace-pre-line text-slate">{attempt.draftAnswer}</p>
        <h2 className="mb-2 text-lg">3. Your explanation</h2>
        {recordingUrl ? (
          <audio controls src={recordingUrl} className="mb-5 w-full" />
        ) : (
          <p className="mb-5 text-sm text-muted">No recording.</p>
        )}
        <h2 className="mb-2 text-lg">4. The follow-up questions</h2>
        <ol className="space-y-3">
          {attempt.followUpQuestions.map((q, i) => (
            <li key={i} className="rounded-lg bg-paper-sunk px-4 py-3 text-sm">
              <p className="font-medium">{q}</p>
              <p className="mt-1 whitespace-pre-line text-slate">{attempt.followUpAnswers[i] ?? ''}</p>
            </li>
          ))}
        </ol>
      </Card>

      {canStartAgain ? (
        <form action={startMatter}>
          <input type="hidden" name="matterId" value={matterId} />
          <Button type="submit" variant="outline">
            Have another go
          </Button>
        </form>
      ) : null}
    </>
  );
}
