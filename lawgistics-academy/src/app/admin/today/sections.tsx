import 'server-only';

import Link from '@/components/app-link';
import type { ReactNode } from 'react';
import { Notice, Pill, cn } from '@/components/ui';
import { contentRows, waited, type StaffRoles } from '@/lib/admin/today';
import {
  contentCounts,
  markingQueue,
  peopleWaiting,
  teachingToday,
  traineesNeedingAttention,
  type QueueItem,
} from '@/lib/admin/today-service';
import { operationalProblems } from '@/lib/admin/operations';

/**
 * The sections of Admin Today. Each reads its own data, so the page can
 * stream them as they arrive (each is wrapped in Suspense) and one slow or
 * failed read never holds up or blanks the others. A failed read says so;
 * it is never shown as "nothing waiting".
 */

const SHOWN = 6;

function Shell({
  id,
  title,
  count,
  all,
  children,
}: {
  id: string;
  title: string;
  count?: number | null;
  all: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`today-${id}`} className="scroll-mt-24" id={id}>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={`today-${id}`} className="flex items-baseline gap-2.5 text-xl">
          {title}
          {count ? (
            <span className="rounded-full bg-accent px-2 py-0.5 font-sans text-xs font-semibold tabular-nums text-paper">
              {count}
            </span>
          ) : null}
        </h2>
        <Link
          href={all.href}
          className="-my-2 inline-flex min-h-11 items-center text-sm font-medium text-accent hover:underline"
        >
          {all.label} ›
        </Link>
      </div>
      {children}
    </section>
  );
}

function Rows({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-paper-raised shadow-card">
      {children}
    </ul>
  );
}

function Row({
  href,
  title,
  meta,
  action,
  urgent = false,
  done = false,
}: {
  href: string;
  title: ReactNode;
  meta?: ReactNode;
  action: string;
  urgent?: boolean;
  done?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className="pressable flex min-h-16 items-center gap-3.5 px-4 py-3 hover:bg-paper-sunk/60 active:bg-paper-sunk sm:px-5"
      >
        <span
          aria-hidden
          className={cn(
            'mt-2 size-2.5 shrink-0 self-start rounded-full',
            done ? 'bg-verdict-correct' : urgent ? 'bg-verdict-wrong' : 'bg-rule-strong',
          )}
        />
        <span className="min-w-0 flex-1">
          <span className={cn('block font-semibold', done && 'text-muted')}>{title}</span>
          {meta ? <span className="mt-0.5 block text-sm text-slate">{meta}</span> : null}
          {/* On a phone the action sits under the words, so they keep the width. */}
          <span className="mt-1 block text-sm font-medium text-accent sm:hidden">{action}</span>
        </span>
        <span className="hidden shrink-0 text-sm font-medium text-accent sm:inline">
          {action} <span aria-hidden>›</span>
        </span>
        <span aria-hidden className="shrink-0 text-muted sm:hidden">
          ›
        </span>
      </Link>
    </li>
  );
}

function Clear({ children }: { children: ReactNode }) {
  return (
    <li className="flex min-h-14 items-center gap-3.5 px-4 py-3 text-sm text-slate sm:px-5">
      <span aria-hidden className="text-verdict-correct">
        ✓
      </span>
      {children}
    </li>
  );
}

function More({ href, count, label }: { href: string; count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <li>
      <Link
        href={href}
        className="pressable flex min-h-12 items-center px-4 py-2.5 text-sm font-medium text-accent hover:bg-paper-sunk/60 sm:px-5"
      >
        and {count} more {label} ›
      </Link>
    </li>
  );
}

function Unreadable({ what }: { what: string }) {
  return (
    <Notice tone="warn">
      {what} could not be read just now. Reload the page; if it stays, open the page itself.
    </Notice>
  );
}

/** A grey stand-in while a section reads. */
export function SectionLoading({ title }: { title: string }) {
  return (
    <section aria-busy="true">
      <h2 className="mb-2.5 text-xl">{title}</h2>
      <div className="h-32 animate-pulse rounded-lg bg-rule/60 motion-reduce:animate-none" />
    </section>
  );
}

/* -------------------------------------------------------------------------- */

const QUEUE_WORDS: Record<QueueItem['kind'], { what: string; action: string }> = {
  work: { what: 'handed in', action: 'Mark work' },
  reply: { what: 'is waiting for a reply', action: 'Reply' },
  matter: { what: 'handed in a practice file', action: 'Mark work' },
  studio: { what: 'shared a Studio recording', action: 'Review' },
};

export async function WorkSection({ kinds }: { kinds: QueueItem['kind'][] }) {
  const queue = await markingQueue(kinds);
  const all = { href: '/admin/work', label: 'Work board' };
  if (!queue) {
    return (
      <Shell id="work" title="Work awaiting feedback" all={all}>
        <Unreadable what="The marking queue" />
      </Shell>
    );
  }
  const now = new Date();
  return (
    <Shell id="work" title="Work awaiting feedback" count={queue.length} all={all}>
      <Rows>
        {queue.length === 0 ? (
          <Clear>Nothing waiting. Everything handed in has been marked, and every message answered.</Clear>
        ) : (
          queue.slice(0, SHOWN).map((item, i) => {
            const days = waited(item.since, now);
            return (
              <Row
                key={`${item.kind}-${item.href}-${i}`}
                href={item.href}
                title={item.title}
                meta={`${item.person} ${QUEUE_WORDS[item.kind].what} · waiting ${days === 'today' ? 'since today' : days === 'yesterday' ? 'since yesterday' : days}`}
                action={QUEUE_WORDS[item.kind].action}
                urgent={days !== 'today' && days !== 'yesterday'}
              />
            );
          })
        )}
        <More href="/admin/work" count={queue.length - SHOWN} label="waiting" />
      </Rows>
    </Shell>
  );
}

export async function TraineesSection() {
  const list = await traineesNeedingAttention();
  const all = { href: '/admin/trainees', label: 'All trainees' };
  if (!list) {
    return (
      <Shell id="trainees" title="Trainees needing attention" all={all}>
        <Unreadable what="Trainee progress" />
      </Shell>
    );
  }
  return (
    <Shell id="trainees" title="Trainees needing attention" count={list.length} all={all}>
      <Rows>
        {list.length === 0 ? (
          <Clear>Nobody is behind: no rounds missed this week, no work overdue, no repeated mistakes.</Clear>
        ) : (
          list.slice(0, SHOWN).map((t) => (
            <Row
              key={t.id}
              href={`/admin/trainees/${t.id}`}
              title={t.name}
              meta={t.reasons.join(' · ')}
              action="View trainee"
              urgent={t.weight >= 3}
            />
          ))
        )}
        <More href="/admin/trainees" count={list.length - SHOWN} label="people" />
      </Rows>
    </Shell>
  );
}

export async function TeachingSection() {
  const teaching = await teachingToday();
  const all = { href: '/admin/intake', label: 'Prepare today' };
  if (!teaching) {
    return (
      <Shell id="teaching" title="Today's teaching" all={all}>
        <Unreadable what="Today's teaching" />
      </Shell>
    );
  }
  const toDo = [...teaching.lines, ...teaching.setup].filter((l) => !l.done).length;
  return (
    <Shell id="teaching" title="Today's teaching" count={toDo} all={all}>
      {teaching.heading || teaching.nextDay ? (
        <p className="mb-2.5 text-sm text-slate">{teaching.heading ?? teaching.nextDay}</p>
      ) : null}
      <Rows>
        {[...teaching.lines, ...teaching.setup].map((l) => (
          <Row
            key={l.key}
            href={l.href}
            title={l.label}
            meta={l.state}
            action={l.action}
            done={l.done}
            urgent={!l.done && teaching.setup.includes(l)}
          />
        ))}
      </Rows>
    </Shell>
  );
}

export async function PeopleSection() {
  const people = await peopleWaiting();
  const all = { href: '/admin/onboarding', label: 'Joining' };
  if (!people) {
    return (
      <Shell id="people" title="People awaiting confirmation" all={all}>
        <Unreadable what="People awaiting confirmation" />
      </Shell>
    );
  }
  const now = new Date();
  return (
    <Shell id="people" title="People awaiting confirmation" count={people.length} all={all}>
      <Rows>
        {people.length === 0 ? (
          <Clear>Nobody waiting: no trainee, code or joining step needs confirming.</Clear>
        ) : (
          people.slice(0, SHOWN).map((p) => (
            <Row
              key={p.key}
              href={p.href}
              title={p.name}
              meta={p.since ? `${p.reason} · waiting ${waited(p.since, now)}` : p.reason}
              action="Review person"
            />
          ))
        )}
        <More href="/admin/onboarding" count={people.length - SHOWN} label="people" />
      </Rows>
    </Shell>
  );
}

export async function ContentSection({ roles }: { roles: StaffRoles }) {
  const counts = await contentCounts();
  const all = { href: '/admin/review', label: 'Sign off' };
  if (!counts) {
    return (
      <Shell id="content" title="Content awaiting review" all={all}>
        <Unreadable what="The review queue" />
      </Shell>
    );
  }
  const rows = contentRows(counts, roles);
  return (
    <Shell id="content" title="Content awaiting review" count={rows.length} all={all}>
      {roles.admin ? (
        // An administrator writes the content as well as publishing it.
        <p className="mb-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href="/admin/questions/new" className="-my-2 inline-flex min-h-11 items-center font-medium text-accent hover:underline">
            New question
          </Link>
          <Link href="/admin/facts/new" className="-my-2 inline-flex min-h-11 items-center font-medium text-accent hover:underline">
            New fact
          </Link>
          <Link href="/admin/matters/new" className="-my-2 inline-flex min-h-11 items-center font-medium text-accent hover:underline">
            New matter
          </Link>
        </p>
      ) : null}
      <Rows>
        {rows.length === 0 ? (
          <Clear>Nothing waiting for a sign-off.</Clear>
        ) : (
          rows.map((r) => (
            <Row key={r.key} href={r.href} title={r.label} meta={r.why} action={r.action} urgent={r.urgent} />
          ))
        )}
      </Rows>
    </Shell>
  );
}

/**
 * Operations: at the top of the page when something is wrong, in its place
 * at the bottom saying all is well otherwise. Both placements read the same
 * cached checks, so asking twice reads once.
 */
export async function OperationsSection({ placement }: { placement: 'top' | 'inline' }) {
  const problems = await operationalProblems();
  if (placement === 'top' && problems.length === 0) return null;
  if (placement === 'inline' && problems.length > 0) return null;
  const all = { href: '/admin/deletions', label: 'Deletions' };
  return (
    <Shell id="operations" title="Operational problems" count={problems.length} all={all}>
      <Rows>
        {problems.length === 0 ? (
          <Clear>Everything is running: database up to date, server where it should be, deletions finished.</Clear>
        ) : (
          problems.map((p) =>
            p.href ? (
              <Row key={p.key} href={p.href} title={p.title} meta={p.detail} action="View issue" urgent={p.serious} />
            ) : (
              <li key={p.key} className="flex items-start gap-3.5 px-4 py-3 sm:px-5">
                <span
                  aria-hidden
                  className={cn('mt-2 size-2.5 shrink-0 rounded-full', p.serious ? 'bg-verdict-wrong' : 'bg-rule-strong')}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{p.title}</span>
                  <span className="mt-0.5 block text-sm text-slate">{p.detail}</span>
                </span>
                <Pill tone={p.serious ? 'wrong' : 'warn'}>{p.serious ? 'Fix' : 'Check'}</Pill>
              </li>
            ),
          )
        )}
      </Rows>
    </Shell>
  );
}
