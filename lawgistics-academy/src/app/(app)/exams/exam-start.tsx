'use client';

import { useActionState, useState } from 'react';
import { beginExam, type ExamStartState } from '@/app/(app)/actions';
import { Button, Notice, cn } from '@/components/ui';
import { useHydrated } from '@/lib/client/use-hydrated';
import {
  DIFFICULTY_LABELS,
  DRILL_COUNTS,
  DRILL_MINUTES,
  POOL_LABELS,
  type ExamDifficulty,
  type ExamPool,
} from '@/lib/exams/rules';

const initial: ExamStartState = { error: null };

/** The mock exam, and the drill builder: one choice at a time, then Start. */
export function ExamStart({
  mock,
  areas,
}: {
  mock: { count: number; minutes: number };
  areas: Array<{ slug: string; name: string }>;
}) {
  const [mockState, mockAction, mockPending] = useActionState(beginExam, initial);
  const [drillState, drillAction, drillPending] = useActionState(beginExam, initial);
  const hydrated = useHydrated();

  const [picked, setPicked] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<ExamDifficulty>('any');
  const [pool, setPool] = useState<ExamPool>('all');
  const [count, setCount] = useState<number>(20);
  const [minutes, setMinutes] = useState<number>(30);

  const toggle = (slug: string) =>
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      <section aria-labelledby="mock" className="panel flex flex-col rounded-lg border p-5 sm:p-6">
        <p className="eyebrow">Full paper</p>
        <h2 id="mock" className="mt-1.5 text-2xl">Mock exam</h2>
        <p className="mt-2 text-sm text-slate">
          Every area, from easier questions to harder ones, like a real paper. Answers are final and
          you see your marks at the end.
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border border-rule bg-paper-sunk px-3 py-2.5">
            <dt className="text-xs text-muted">Questions</dt>
            <dd className="mt-0.5 text-lg tabular-nums">{mock.count}</dd>
          </div>
          <div className="rounded-md border border-rule bg-paper-sunk px-3 py-2.5">
            <dt className="text-xs text-muted">Time</dt>
            <dd className="mt-0.5 text-lg tabular-nums">{mock.minutes} min</dd>
          </div>
        </dl>
        <form action={mockAction} className="mt-auto pt-6">
          <input type="hidden" name="mode" value="mock" />
          <Button type="submit" variant="accent" disabled={mockPending || !hydrated} className="w-full">
            {mockPending ? 'Setting the paper…' : 'Start the mock exam'}
          </Button>
          {mockState.error ? (
            <div className="mt-3">
              <Notice tone="error">{mockState.error}</Notice>
            </div>
          ) : null}
        </form>
      </section>

      <section aria-labelledby="drill" className="panel rounded-lg border p-5 sm:p-6">
        <p className="eyebrow">Build your own</p>
        <h2 id="drill" className="mt-1.5 text-2xl">Drill</h2>
        <form action={drillAction} className="mt-5 space-y-6">
          <input type="hidden" name="mode" value="drill" />

          <Choice legend="Areas" hint={picked.length === 0 ? 'None chosen: every area.' : `${picked.length} chosen`}>
            {areas.map((a) => (
              <Chip key={a.slug} on={picked.includes(a.slug)} onClick={() => toggle(a.slug)}>
                {a.name}
              </Chip>
            ))}
            {picked.map((slug) => (
              <input key={slug} type="hidden" name="areas" value={slug} />
            ))}
          </Choice>

          <Choice legend="Difficulty">
            {(Object.keys(DIFFICULTY_LABELS) as ExamDifficulty[]).map((d) => (
              <Chip key={d} on={difficulty === d} onClick={() => setDifficulty(d)}>
                {DIFFICULTY_LABELS[d]}
              </Chip>
            ))}
            <input type="hidden" name="difficulty" value={difficulty} />
          </Choice>

          <Choice legend="Which questions">
            {(Object.keys(POOL_LABELS) as ExamPool[]).map((p) => (
              <Chip key={p} on={pool === p} onClick={() => setPool(p)}>
                {POOL_LABELS[p]}
              </Chip>
            ))}
            <input type="hidden" name="pool" value={pool} />
          </Choice>

          <div className="grid gap-6 sm:grid-cols-2">
            <Choice legend="How many">
              {DRILL_COUNTS.map((n) => (
                <Chip key={n} on={count === n} onClick={() => setCount(n)}>
                  {n}
                </Chip>
              ))}
              <input type="hidden" name="count" value={count} />
            </Choice>
            <Choice legend="Time">
              {DRILL_MINUTES.map((m) => (
                <Chip key={m} on={minutes === m} onClick={() => setMinutes(m)}>
                  {m === 0 ? 'Untimed' : `${m} min`}
                </Chip>
              ))}
              <input type="hidden" name="minutes" value={minutes} />
            </Choice>
          </div>

          <Button type="submit" variant="accent" disabled={drillPending || !hydrated}>
            {drillPending ? 'Setting the drill…' : 'Start the drill'}
          </Button>
          {drillState.error ? <Notice tone="error">{drillState.error}</Notice> : null}
        </form>
      </section>
    </div>
  );
}

function Choice({ legend, hint, children }: { legend: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 flex w-full items-baseline justify-between text-sm font-medium">
        <span>{legend}</span>
        {hint ? <span className="text-xs font-normal text-muted">{hint}</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
        on
          ? 'border-periwinkle bg-periwinkle-wash text-periwinkle-ink'
          : 'border-rule-strong text-slate hover:border-periwinkle/60 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
