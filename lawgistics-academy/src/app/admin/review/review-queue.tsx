'use client';

import { useMemo, useState, useTransition } from 'react';
import { Button, Card, Notice, Pill, cn } from '@/components/ui';
import { JURISDICTION_LABELS, JURISDICTION_SHORT } from '@/lib/types';
import { RISK_LABEL, type RiskLevel } from '@/lib/review/triage';
import { recordReviewDecision } from './actions';
import { HOLD_CHOICES, defaultHold, type HoldMonths } from '@/lib/review/expiry';
import type { ReviewItem } from '@/lib/review/service';

type Filter = 'outstanding' | 'live' | 'flagged' | 'done' | 'all';

const RISK_TONE: Record<RiskLevel, 'wrong' | 'warn' | 'neutral'> = {
  high: 'wrong',
  medium: 'warn',
  low: 'neutral',
};

/**
 * Whether an item counts as signed off right now.
 *
 * One definition, used by the filter and the counter alike, because two
 * definitions is how a queue comes to say "233 of 233 done" while showing you
 * things to do. A sign-off that has run out is not a sign-off: an item whose
 * verification expired is back in the pile, which is the entire point of giving
 * verifications an expiry.
 */
function isSignedOff(item: ReviewItem, outcome?: 'verify' | 'flag' | 'retire'): boolean {
  if (outcome) return outcome === 'verify';
  return item.verificationStatus === 'human_verified' && !item.lapsed;
}

export function ReviewQueue({ items }: { items: ReviewItem[] }) {
  const [filter, setFilter] = useState<Filter>('outstanding');
  const [decided, setDecided] = useState<Record<string, 'verify' | 'flag' | 'retire'>>({});
  const [error, setError] = useState<string | null>(null);

  const key = (item: ReviewItem) => `${item.kind}:${item.id}`;

  const visible = useMemo(() => {
    return items.filter((item) => {
      const outcome = decided[key(item)];
      const verified = isSignedOff(item, outcome);
      const flagged = outcome === 'flag' || (!outcome && item.reviewFlagged);

      switch (filter) {
        case 'outstanding':
          return !verified && !flagged && outcome !== 'retire';
        case 'live':
          return item.liveToLearners && !outcome;
        case 'flagged':
          return flagged;
        case 'done':
          return verified;
        default:
          return true;
      }
    });
  }, [items, filter, decided]);

  const counts = useMemo(() => {
    let outstanding = 0;
    let done = 0;
    for (const item of items) {
      const outcome = decided[key(item)];
      if (isSignedOff(item, outcome)) done += 1;
      else if (outcome !== 'retire') outstanding += 1;
    }
    return { outstanding, done };
  }, [items, decided]);

  const progress = items.length ? Math.round((counts.done / items.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mx-5 border-b border-rule bg-paper-sunk/95 px-5 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm">
            <strong className="font-serif text-lg tabular-nums">{counts.done}</strong>
            <span className="text-slate"> of {items.length} signed off</span>
          </p>
          <p className="text-xs text-muted tabular-nums">{counts.outstanding} to go</p>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-paper"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Review progress"
        >
          <div
            className="h-full rounded-full bg-verdict-correct transition-all duration-500"
            style={{ width: `${Math.max(progress, 1)}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {(
            [
              ['outstanding', 'To review'],
              ['live', 'Live but unverified'],
              ['flagged', 'Flagged'],
              ['done', 'Signed off'],
              ['all', 'Everything'],
            ] as Array<[Filter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                'rounded-full border px-3 py-2',
                filter === value
                  ? 'border-ink bg-ink text-paper'
                  : 'border-rule-strong text-slate hover:bg-paper',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {visible.length === 0 ? (
        <Card className="text-center">
          <p className="text-slate">
            {filter === 'outstanding'
              ? 'Nothing left to review. Every item has been signed off or set aside.'
              : 'Nothing here.'}
          </p>
        </Card>
      ) : null}

      {visible.map((item) => (
        <ReviewCard
          key={key(item)}
          item={item}
          outcome={decided[key(item)]}
          onDecided={(outcome) => setDecided((d) => ({ ...d, [key(item)]: outcome }))}
          onError={setError}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  item,
  outcome,
  onDecided,
  onError,
}: {
  item: ReviewItem;
  outcome?: 'verify' | 'flag' | 'retire';
  onDecided: (outcome: 'verify' | 'flag' | 'retire') => void;
  onError: (message: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(item.reviewNote ?? '');
  const [noteOpen, setNoteOpen] = useState(false);
  // Defaulted from the risk score, changed by the person who just read it.
  const [holds, setHolds] = useState<HoldMonths>(defaultHold(item.risk.level));

  function decide(decision: 'verify' | 'flag' | 'retire') {
    onError(null);
    if (decision === 'flag' && !note.trim()) {
      setNoteOpen(true);
      onError('Say what is wrong with it, a flag without a note is a dead end.');
      return;
    }

    startTransition(async () => {
      const result = await recordReviewDecision({
        kind: item.kind,
        id: item.id,
        decision,
        note: note.trim() || undefined,
        holdsForMonths: decision === 'verify' ? holds : undefined,
      });
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onDecided(decision);
    });
  }

  return (
    <Card
      className={cn(
        outcome === 'verify' && 'border-verdict-correct/40 bg-verdict-correct-wash',
        outcome === 'flag' && 'border-verdict-wrong/40 bg-verdict-wrong-wash',
        outcome === 'retire' && 'opacity-55',
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pill tone={RISK_TONE[item.risk.level]}>{RISK_LABEL[item.risk.level]}</Pill>
        <Pill>{item.kind === 'fact' ? 'Daily brief' : (item.domainName ?? 'Question')}</Pill>
        <Pill tone={item.jurisdiction === 'AU_GENERAL' ? 'neutral' : 'accent'}>
          <span title={JURISDICTION_LABELS[item.jurisdiction]}>
            {JURISDICTION_SHORT[item.jurisdiction]}
          </span>
        </Pill>
        {item.liveToLearners && !outcome ? <Pill tone="wrong">Live now</Pill> : null}
        {item.lapsed && !outcome ? <Pill tone="wrong">Sign-off expired</Pill> : null}
        {item.dueSoon && !outcome ? <Pill tone="warn">Due again soon</Pill> : null}
        {outcome ? (
          <Pill tone={outcome === 'verify' ? 'correct' : 'wrong'}>
            {outcome === 'verify' ? 'Signed off' : outcome === 'flag' ? 'Flagged' : 'Retired'}
          </Pill>
        ) : null}
      </div>

      {item.scenario ? (
        <p className="mb-3 border-l-2 border-rule-strong pl-3 text-sm text-slate">
          {item.scenario}
        </p>
      ) : null}

      <h2 className="mb-3 text-lg leading-snug">{item.heading}</h2>

      {item.body ? <p className="mb-3 text-[0.9375rem] text-slate">{item.body}</p> : null}

      {item.options.length > 0 ? (
        <ul className="mb-3 space-y-1 text-sm">
          {item.options.map((option) => {
            const correct = item.correctOptionIds.includes(option.id);
            return (
              <li
                key={option.id}
                className={cn('flex gap-2', correct ? 'font-medium' : 'text-slate')}
              >
                <span className="text-muted uppercase">{option.id}</span>
                <span>{option.text}</span>
                {correct ? <span className="text-verdict-correct">← keyed correct</span> : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {item.explanation ? (
        <Block label="Explanation given to the learner">{item.explanation}</Block>
      ) : null}
      {item.whyItMatters ? <Block label="Why this matters">{item.whyItMatters}</Block> : null}
      {item.commonMisconception ? (
        <Block label="Often confused with">{item.commonMisconception}</Block>
      ) : null}
      {item.memoryTrick ? <Block label="Memory trick">{item.memoryTrick}</Block> : null}

      <div className="mt-4 rounded-md bg-paper-sunk px-3 py-2.5 text-xs">
        <p className="eyebrow mb-1">Source</p>
        {item.sourceReference || item.sourceUrl ? (
          <p>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {item.sourceReference ?? item.sourceUrl}
              </a>
            ) : (
              item.sourceReference
            )}
            {item.sourceCheckedOn ? (
              <span className="text-muted"> · checked {item.sourceCheckedOn}</span>
            ) : null}
          </p>
        ) : (
          <p className="text-verdict-wrong">None recorded.</p>
        )}
      </div>

      {item.risk.reasons.length > 0 && !outcome ? (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate">
          {item.risk.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      {!outcome ? (
        <>
          {noteOpen ? (
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              placeholder="What is wrong with it? e.g. “rule number is 19.7, not 19.6”"
              className="mt-4 w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2 text-base outline-none focus:border-burgundy"
            />
          ) : null}

          {/* How long the sign-off holds. Sits with the button rather than in a
              settings screen, because it is a judgement about the item just
              read: a filing fee and the onus of proof do not age alike. */}
          <fieldset className="mt-4">
            <legend className="eyebrow mb-1.5">Check it again in</legend>
            <div className="inline-flex rounded-[5px] border border-rule-strong p-0.5">
              {HOLD_CHOICES.map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setHolds(months)}
                  aria-pressed={holds === months}
                  className={cn(
                    'rounded-[4px] px-3 py-1.5 text-sm font-medium',
                    holds === months ? 'bg-ink text-paper' : 'text-slate hover:bg-paper-sunk',
                  )}
                >
                  {months === 24 ? '2 years' : `${months} months`}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="primary" disabled={pending} onClick={() => decide('verify')}>
              {pending ? 'Saving…' : 'Correct and sign off'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => (noteOpen ? decide('flag') : setNoteOpen(true))}
            >
              {noteOpen ? 'Save flag' : 'Needs a change'}
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => decide('retire')}>
              Remove entirely
            </Button>
          </div>
        </>
      ) : null}

      {outcome === 'flag' && note ? (
        <p className="mt-3 text-sm">
          <span className="eyebrow">Your note</span>
          <br />
          {note}
        </p>
      ) : null}
    </Card>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-sm text-slate">{children}</p>
    </div>
  );
}
