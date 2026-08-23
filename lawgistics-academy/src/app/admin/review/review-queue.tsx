'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Button, Card, Notice, Pill, cn } from '@/components/ui';
import { JURISDICTION_COUNTRY, JURISDICTION_LABELS, JURISDICTION_SHORT } from '@/lib/types';
import type { Country } from '@/lib/types';
import { RISK_LABEL, type RiskLevel } from '@/lib/review/triage';
import { recordReviewDecision } from './actions';
import { HOLD_CHOICES, defaultHold, type HoldMonths } from '@/lib/review/expiry';
import type { ReviewItem } from '@/lib/review/service';

type Filter = 'outstanding' | 'live' | 'flagged' | 'done' | 'all';

/* Which country's law to work through.

   Verifying is done a body of law at a time, not a bank at a time. Somebody
   sitting down to sign off Malaysian questions should not have Australian ones
   between them, and the Malaysian bank matters more than most: it is the half
   that cannot publish itself, so it stays invisible to learners until a person
   has been through it one item at a time. Without this filter that person has
   to read 122 Australian questions to find 81 Malaysian ones. */
type Scope = 'all' | Country;

/**
 * Whether a key press is somebody typing rather than somebody driving.
 *
 * Without this, writing "the rule number is 19.7, not 19.6" into a flag note
 * would sign off five items and jump the page around, because every letter is
 * also a shortcut. Checked on the event target rather than on any state we
 * keep, so it stays right no matter what has focus.
 */
function isTyping(event: KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) return true;
  const el = event.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

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
  const [scope, setScope] = useState<Scope>('all');
  const [decided, setDecided] = useState<Record<string, 'verify' | 'flag' | 'retire'>>({});
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(0);
  const [showKeys, setShowKeys] = useState(false);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const key = (item: ReviewItem) => `${item.kind}:${item.id}`;

  const inScope = useCallback(
    (item: ReviewItem) => scope === 'all' || JURISDICTION_COUNTRY[item.jurisdiction] === scope,
    [scope],
  );

  const visible = useMemo(() => {
    return items.filter((item) => {
      if (!inScope(item)) return false;
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
  }, [items, filter, decided, inScope]);

  /* Counted within the chosen country, so the progress bar measures the job
     actually in front of the person rather than the whole bank. */
  const counts = useMemo(() => {
    let outstanding = 0;
    let done = 0;
    let total = 0;
    for (const item of items) {
      if (!inScope(item)) continue;
      total += 1;
      const outcome = decided[key(item)];
      if (isSignedOff(item, outcome)) done += 1;
      else if (outcome !== 'retire') outstanding += 1;
    }
    return { outstanding, done, total };
  }, [items, decided, inScope]);

  /* How many are left in each country, so the chips say what choosing one
     would cost before it is chosen. */
  const byCountry = useMemo(() => {
    const left: Record<Country, number> = { AU: 0, MY: 0 };
    for (const item of items) {
      const outcome = decided[key(item)];
      if (isSignedOff(item, outcome) || outcome === 'retire') continue;
      const c = JURISDICTION_COUNTRY[item.jurisdiction];
      if (c) left[c] += 1;
    }
    return left;
  }, [items, decided]);

  const progress = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;

  /**
   * Keep the focused card on screen.
   *
   * 'nearest' rather than 'center': the header is sticky, and centring would
   * scroll a card that is already perfectly readable, which is disorienting
   * when you are moving quickly and looking at the text rather than the page.
   */
  const reveal = useCallback((index: number) => {
    cardRefs.current[index]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  const move = useCallback(
    (delta: number) => {
      setFocused((current) => {
        const next = Math.min(Math.max(current + delta, 0), Math.max(visible.length - 1, 0));
        reveal(next);
        return next;
      });
    },
    [visible.length, reveal],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (isTyping(event)) return;

      if (event.key === 'j' || event.key === 'ArrowDown') {
        event.preventDefault();
        move(1);
      } else if (event.key === 'k' || event.key === 'ArrowUp') {
        event.preventDefault();
        move(-1);
      } else if (event.key === '?') {
        event.preventDefault();
        setShowKeys((s) => !s);
      } else if (event.key === 'Escape') {
        setShowKeys(false);
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [move]);

  /**
   * After a decision, go to the next one.
   *
   * This is the whole point of the keyboard: sign off, land on the next item,
   * never touch the mouse. Deciding does not remove the card from the list, so
   * the index still lines up and moving on by one is correct.
   */
  const advance = useCallback(() => {
    setFocused((current) => {
      const next = Math.min(current + 1, Math.max(visible.length - 1, 0));
      reveal(next);
      return next;
    });
  }, [visible.length, reveal]);

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mx-5 border-b border-rule bg-paper-sunk/95 px-5 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm">
            <strong className="font-serif text-lg tabular-nums">{counts.done}</strong>
            <span className="text-slate"> of {counts.total} signed off</span>
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

        {/* Country first, because it decides which body of law you are reading
            and there is no sense mixing two of them in one sitting. */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {(
            [
              ['all', 'Both countries'],
              ['MY', `Malaysia (${byCountry.MY} left)`],
              ['AU', `Australia (${byCountry.AU} left)`],
            ] as Array<[Scope, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setScope(value);
                setFocused(0);
              }}
              className={cn(
                'rounded-full border px-3 py-2',
                scope === value
                  ? 'border-burgundy bg-burgundy text-paper'
                  : 'border-rule-strong text-slate hover:bg-paper',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
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
              onClick={() => {
                // Reset focus here rather than in an effect watching `filter`:
                // changing the filter changes what is on screen, so a
                // remembered index would point at something else entirely.
                setFilter(value);
                setFocused(0);
              }}
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          Keyboard: <Key>j</Key> <Key>k</Key> to move, <Key>v</Key> to sign off,{' '}
          <Key>f</Key> to flag, <Key>?</Key> for the rest.
        </p>
        <button
          type="button"
          onClick={() => setShowKeys((s) => !s)}
          // py-2 rather than py-1.5: at text-xs the line box is 16px, so 6px of
          // padding either side lands on 28 and misses a thumb. 8px makes 32.
          className="rounded-[5px] px-2 py-2 text-xs font-medium text-burgundy underline underline-offset-2"
        >
          {showKeys ? 'Hide shortcuts' : 'Shortcuts'}
        </button>
      </div>

      {showKeys ? (
        <Card>
          <p className="eyebrow mb-3">Working through it without the mouse</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Shortcut keys={['j', '↓']}>Next item</Shortcut>
            <Shortcut keys={['k', '↑']}>Previous item</Shortcut>
            <Shortcut keys={['v']}>Correct, sign it off, move on</Shortcut>
            <Shortcut keys={['f']}>Needs a change, and start the note</Shortcut>
            <Shortcut keys={['1', '2', '3']}>Check again in 6, 12 or 24 months</Shortcut>
            <Shortcut keys={['?']}>Show or hide this</Shortcut>
          </dl>
          <p className="mt-3 text-xs text-muted">
            Nothing happens while you are typing in a box, so writing a note is safe.
            Removing an item entirely has no shortcut on purpose: it is permanent, and a
            single key that destroys content is a bad trade for the two seconds it saves.
          </p>
        </Card>
      ) : null}

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

      {visible.map((item, index) => (
        <ReviewCard
          key={key(item)}
          item={item}
          outcome={decided[key(item)]}
          isFocused={index === focused}
          onFocus={() => setFocused(index)}
          registerRef={(el) => {
            cardRefs.current[index] = el;
          }}
          onDecided={(outcome) => {
            setDecided((d) => ({ ...d, [key(item)]: outcome }));
            advance();
          }}
          onError={setError}
        />
      ))}
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-rule-strong border-b-2 px-1 font-mono text-[0.7rem] text-slate">
      {children}
    </kbd>
  );
}

function Shortcut({ keys, children }: { keys: string[]; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="flex shrink-0 gap-1">
        {keys.map((k) => (
          <Key key={k}>{k}</Key>
        ))}
      </dt>
      <dd className="text-slate">{children}</dd>
    </div>
  );
}

function ReviewCard({
  item,
  outcome,
  isFocused,
  onFocus,
  registerRef,
  onDecided,
  onError,
}: {
  item: ReviewItem;
  outcome?: 'verify' | 'flag' | 'retire';
  isFocused: boolean;
  onFocus: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
  onDecided: (outcome: 'verify' | 'flag' | 'retire') => void;
  onError: (message: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(item.reviewNote ?? '');
  const [noteOpen, setNoteOpen] = useState(false);
  /* The same failure, kept here as well as at the top of the list.
     The banner at the top is right for somebody looking at the first card and
     useless for anybody else: press sign off on the fortieth item and the
     explanation appears a screen and a half above, so the button looks as
     though it did nothing at all. */
  const [failure, setFailure] = useState<string | null>(null);
  // Defaulted from the risk score, changed by the person who just read it.
  const [holds, setHolds] = useState<HoldMonths>(defaultHold(item.risk.level));
  const noteRef = useRef<HTMLTextAreaElement | null>(null);

  function decide(decision: 'verify' | 'flag' | 'retire') {
    onError(null);
    setFailure(null);
    if (decision === 'flag' && !note.trim()) {
      setNoteOpen(true);
      const message = 'Say what is wrong with it, a flag without a note is a dead end.';
      onError(message);
      setFailure(message);
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
        setFailure(result.error);
        return;
      }
      onDecided(decision);
    });
  }

  /**
   * Decision keys, installed only on the focused card.
   *
   * Every card listening would mean one press signing off two hundred items.
   * Retiring is deliberately not here: it is destructive and rare, and a single
   * unmodified key that permanently removes content is a bad trade for the two
   * seconds it saves.
   */
  useEffect(() => {
    if (!isFocused || outcome) return;

    function onKey(event: KeyboardEvent) {
      if (isTyping(event)) return;

      if (event.key === 'v') {
        event.preventDefault();
        decide('verify');
      } else if (event.key === 'f') {
        event.preventDefault();
        setNoteOpen(true);
        // The note is required for a flag, so put the cursor in it rather than
        // making somebody reach for the mouse to say what is wrong.
        requestAnimationFrame(() => noteRef.current?.focus());
      } else if (event.key === '1' || event.key === '2' || event.key === '3') {
        event.preventDefault();
        setHolds(HOLD_CHOICES[Number(event.key) - 1]);
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    // The wrapper carries the ref and the click-to-focus, rather than teaching
    // the shared Card component to forward a ref. Card is used on nearly every
    // page and this is the only place that needs one.
    <div ref={registerRef} onMouseDown={onFocus} className="scroll-mt-32">
    <Card
      className={cn(
        isFocused && !outcome && 'ring-2 ring-burgundy/40',
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
              ref={noteRef}
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

          {failure ? (
            <div className="mt-4">
              <Notice tone="error">{failure}</Notice>
            </div>
          ) : null}

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
    </div>
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
