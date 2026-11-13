import type { Metadata } from 'next';
import Link from '@/components/app-link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { isFull, workBoardFor } from '@/lib/work/service';
import type { WorkBoardItem } from '@/lib/work/service';
import { describeMinutes, isLate, slotsLabel } from '@/lib/work/links';
import { ButtonLink, EmptyState, PageHeader, Pill } from '@/components/ui';
import { PeopleOnPost } from '@/components/people-on-post';
import { requireAccess } from '@/lib/access/service';

export const metadata: Metadata = { title: 'Work' };
export const dynamic = 'force-dynamic';

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/**
 * The work board, from the intern's side.
 *
 * Three piles: what has your name on it, what is open, what is finished.
 * Something to read sits in its own list. A post that has all the names it
 * can take is shown as taken rather than hidden, so nobody wonders where
 * it went.
 */
export default async function WorkBoardPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/work');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');

  const items = await workBoardFor(user.id);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: profile.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const tasks = items.filter((i) => i.post.kind === 'task');
  const reading = items.filter((i) => i.post.kind === 'material');
  const mine = tasks.filter((i) => i.claimed);
  // Each piece of work in exactly one place, by what it needs from them.
  const feedback = mine.filter((i) => i.state === 'again' || (i.replyWaiting && i.state !== 'good'));
  const toDo = mine.filter((i) => i.state === 'none' && !i.replyWaiting);
  const awaiting = mine.filter((i) => i.state === 'waiting' && !i.replyWaiting);
  const done = mine.filter((i) => i.state === 'good');
  const open = tasks.filter((i) => !i.claimed);
  const pending = profile.track === 'litigation_trainee' && !profile.traineeConfirmed;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Work"
        title="Work from your lawyers"
        description="Work set by the lawyers supervising you. Put your name on a task, hand it in, and read their feedback here."
      />

      {/* Said first, because a trainee who signed themselves up and sees an
          empty board has no other way to know why. Work posted for everyone
          still shows below. */}
      {pending ? (
        <p className="flex items-start gap-2.5 rounded-lg border border-rule bg-paper-raised px-4 py-2.5 text-sm text-slate">
          <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-warn" />
          <span>
            <strong className="font-semibold text-ink">Programme confirmation pending.</strong>{' '}
            Work for trainees appears here once your supervisor confirms you.
            {items.length > 0 ? ' Work posted for everyone is below.' : ''}
          </span>
        </p>
      ) : null}

      {items.length === 0 ? (
        // Only claimed as empty when it is: a pending trainee may simply not
        // be able to see the trainees' work yet.
        <EmptyState
          title={pending ? 'Waiting for confirmation' : 'No work set yet'}
          description={
            pending
              ? 'Nothing posted for everyone yet either. Your modules and questions work now.'
              : 'When your coach posts a task, it appears here and on Today. Your modules work now.'
          }
          action={
            <ButtonLink href="/modules" variant="outline">
              Continue your modules
            </ButtonLink>
          }
        />
      ) : null}

      {feedback.length > 0 ? <Pile title="Feedback for you" hint="Read it, then act on it" items={feedback} today={today} /> : null}
      {toDo.length > 0 ? <Pile title="To do" hint="You put your name on these" items={toDo} today={today} /> : null}
      {awaiting.length > 0 ? <Pile title="Awaiting feedback" hint="Handed in" items={awaiting} today={today} /> : null}
      {open.length > 0 ? <Pile title="Open to take" items={open} today={today} /> : null}
      {reading.length > 0 ? <Pile title="To read" items={reading} today={today} /> : null}
      {done.length > 0 ? <Pile title="Done" hint="Marked Good" items={done} today={today} /> : null}
    </div>
  );
}

function Pile({
  title,
  hint,
  items,
  today,
}: {
  title: string;
  hint?: string;
  items: WorkBoardItem[];
  today: string;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-sans text-sm font-semibold text-ink">
          {title} <span className="font-normal text-muted tabular-nums">· {items.length}</span>
        </h2>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-paper-raised">
        {items.map((item) => (
          <WorkRow key={item.post.id} item={item} today={today} />
        ))}
      </ul>
    </section>
  );
}

function WorkRow({ item, today }: { item: WorkBoardItem; today: string }) {
  const { post } = item;
  const full = post.kind === 'task' && !item.claimed && isFull(post, item.claims);
  const late = item.claimed && item.state !== 'good' && item.state !== 'waiting' && isLate(post.dueOn, today);
  const facts = [
    post.dueOn && post.kind === 'task' ? `${late ? 'Was due' : 'Due'} ${shortDate(post.dueOn)}` : null,
    post.expectedMinutes && post.kind === 'task' ? describeMinutes(post.expectedMinutes) : null,
    post.hasMemo ? 'Voice memo' : null,
    item.comments > 0 ? `${item.comments} comment${item.comments === 1 ? '' : 's'}` : null,
  ].filter(Boolean);

  const badge =
    post.kind === 'material' ? (
      <Pill tone="accent">{post.linkUrl && !post.fileName ? 'Link' : 'File'}</Pill>
    ) : item.state === 'again' ? (
      <Pill tone="warn">Another go</Pill>
    ) : item.replyWaiting ? (
      <Pill tone="warn">Coach replied</Pill>
    ) : item.state === 'good' ? (
      <Pill tone="correct">Good</Pill>
    ) : item.state === 'waiting' ? (
      <Pill>Handed in</Pill>
    ) : item.claimed ? (
      <Pill tone={late ? 'wrong' : 'accent'}>{late ? 'Overdue' : 'To do'}</Pill>
    ) : full ? (
      <Pill>Taken</Pill>
    ) : (
      <Pill>{slotsLabel(post.maxClaims)}</Pill>
    );

  return (
    <li>
      <Link
        href={item.state === 'again' || item.state === 'good' ? `/work/${post.id}#feedback` : `/work/${post.id}`}
        className="pressable flex min-h-16 items-start gap-4 px-4 py-3.5 hover:bg-paper-sunk/60 sm:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-snug">{post.title}</span>
          {facts.length > 0 ? (
            <span className={`mt-0.5 block text-sm ${late ? 'text-verdict-wrong' : 'text-muted'}`}>{facts.join(' · ')}</span>
          ) : null}
          {post.kind === 'task' && item.people.length > 0 ? (
            <span className="mt-2 block">
              <PeopleOnPost people={item.people} size="sm" max={5} />
            </span>
          ) : null}
          {!post.published ? <span className="mt-1 block text-xs text-muted">Taken down by your coach</span> : null}
        </span>
        <span className="shrink-0 pt-0.5">{badge}</span>
      </Link>
    </li>
  );
}
