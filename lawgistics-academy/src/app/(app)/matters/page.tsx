import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { mattersForLearner } from '@/lib/matters/service';
import type { MatterListItem } from '@/lib/matters/service';
import {
  MATTERS_FOR_CERTIFICATE,
  describeLimit,
  matterLabel,
  minutesLeft,
} from '@/lib/matters/rules';
import { AccentSurface } from '@/components/accent-surface';
import { EmptyState, Pill } from '@/components/ui';
import { ArrowIcon } from '@/components/icons';
import { requireAccess } from '@/lib/access/service';

export const metadata: Metadata = { title: 'Matters' };
export const dynamic = 'force-dynamic';

/**
 * The matters, from the learner's side.
 *
 * The problem comes first. Each card says how long it takes and where the
 * learner stands, and nothing about the answer: the facts themselves are
 * only shown once the clock is started.
 */
export default async function MattersPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/matters');
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  const items = await mattersForLearner(user.id);
  const good = items.filter((i) => i.everGood).length;
  const now = new Date();

  return (
    <div className="space-y-8">
      <AccentSurface as="section" className="rise-in rounded-2xl shadow-raised">
        <div className="px-6 py-8 sm:px-9 sm:py-10">
          <p className="mb-3 text-[0.6875rem] font-semibold tracking-[0.16em] text-paper/70 uppercase">
            Matters
          </p>
          <h1 className="max-w-2xl text-[2.25rem] leading-[1.05] sm:text-5xl">
            The problem first. Then how a lawyer would do it.
          </h1>
          <p className="mt-4 max-w-xl text-paper/85">
            Each matter is a short file on invented facts. Start the clock, work out the
            procedure, draft your advice, explain it out loud, and answer five questions about
            your own draft. Then see the lawyer&rsquo;s approach, and get marked.
          </p>
          <div className="mt-6 max-w-md">
            <div className="flex items-baseline justify-between text-sm text-paper/85">
              <span>Marked Good by a lawyer</span>
              <span className="font-semibold tabular-nums text-paper">
                {Math.min(good, MATTERS_FOR_CERTIFICATE)} of {MATTERS_FOR_CERTIFICATE}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper/20">
              <div
                className="bar-grow h-full rounded-full bg-paper"
                style={{ width: `${Math.max(4, (Math.min(good, MATTERS_FOR_CERTIFICATE) / MATTERS_FOR_CERTIFICATE) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-paper/70">
              Five matters marked Good, with every required module finished, earns your{' '}
              <Link href="/certificate" className="-my-2 inline-block py-2 underline underline-offset-2">
                certificate
              </Link>
              .
            </p>
          </div>
        </div>
      </AccentSurface>

      {items.length === 0 ? (
        <EmptyState
          title="No matters yet"
          description="Matters appear here once a lawyer has checked and signed them off."
        />
      ) : (
        <ol className="grid gap-4 sm:grid-cols-2">
          {items.map((item, i) => (
            <MatterCard key={item.matter.id} item={item} now={now} index={i} />
          ))}
        </ol>
      )}
    </div>
  );
}

function MatterCard({ item, now, index }: { item: MatterListItem; now: Date; index: number }) {
  const { matter, latest } = item;
  const working = latest?.stage === 'working';
  const left = working && latest ? minutesLeft(latest.deadlineAt, now) : null;

  return (
    <li className="rise-in" style={{ animationDelay: `${index * 60}ms` }}>
      <Link
        href={`/matters/${matter.id}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-rule bg-paper-raised p-5 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-raised sm:p-6"
      >
        {/* A file tab, so the card reads as a file rather than a tile. */}
        <span
          aria-hidden
          className="absolute top-0 right-6 h-2 w-16 rounded-b-md bg-accent/80"
        />
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs font-semibold tracking-wider text-accent">
            {matterLabel(matter.number)}
          </span>
          {matter.area ? <Pill>{matter.area}</Pill> : null}
          <Pill>{describeLimit(matter.timeLimitMinutes)}</Pill>
        </div>
        <h2 className="text-2xl leading-snug">{matter.title}</h2>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          {item.everGood ? (
            <Pill tone="correct">Marked Good</Pill>
          ) : latest?.stage === 'again' ? (
            <Pill tone="warn">Needs another go</Pill>
          ) : latest?.stage === 'handed_in' ? (
            <Pill tone="accent">Handed in</Pill>
          ) : working ? (
            <Pill tone={left === 0 ? 'wrong' : 'accent'}>
              {left === 0 ? 'Over time, still open' : `In progress, ${left} min left`}
            </Pill>
          ) : (
            <span className="text-sm text-slate">Not started</span>
          )}
          <span className="grid size-9 place-items-center rounded-full bg-accent text-paper transition-transform duration-200 group-hover:translate-x-1">
            <ArrowIcon className="size-4" />
          </span>
        </div>
      </Link>
    </li>
  );
}
