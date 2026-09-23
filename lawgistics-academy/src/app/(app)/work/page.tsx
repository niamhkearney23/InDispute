import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { isFull, workBoardFor } from '@/lib/work/service';
import type { WorkBoardItem } from '@/lib/work/service';
import { describeMinutes, isLate, slotsLabel } from '@/lib/work/links';
import { Card, EmptyState, Pill } from '@/components/ui';

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
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/work');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  const items = await workBoardFor(user.id);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: profile.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const tasks = items.filter((i) => i.post.kind === 'task');
  const reading = items.filter((i) => i.post.kind === 'material');
  const yours = tasks.filter((i) => i.claimed && i.state !== 'good');
  const done = tasks.filter((i) => i.claimed && i.state === 'good');
  const open = tasks.filter((i) => !i.claimed);

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">Work</p>
        <h1 className="text-3xl">From your coach</h1>
        <p className="mt-3 max-w-2xl text-slate">
          Real pieces of work, set by the lawyer who supervises you. Put your name on one, do
          it, hand it in, and they will tell you what they would have done differently. Not
          sure about something? Every piece has a place to message them.
        </p>
      </section>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing posted yet"
          description="When your coach posts a piece of work it will appear here, and on your dashboard."
        />
      ) : null}

      {yours.length > 0 ? <Pile title="Yours" items={yours} today={today} /> : null}
      {open.length > 0 ? <Pile title="Open" items={open} today={today} /> : null}
      {done.length > 0 ? <Pile title="Done" items={done} today={today} /> : null}
      {reading.length > 0 ? <Pile title="To read" items={reading} today={today} /> : null}
    </div>
  );
}

function Pile({ title, items, today }: { title: string; items: WorkBoardItem[]; today: string }) {
  return (
    <section>
      <p className="eyebrow mb-3">{title}</p>
      <div className="space-y-3">
        {items.map((item) => (
          <WorkRow key={item.post.id} item={item} today={today} />
        ))}
      </div>
    </section>
  );
}

function WorkRow({ item, today }: { item: WorkBoardItem; today: string }) {
  const { post } = item;
  const full = post.kind === 'task' && !item.claimed && isFull(post, item.claims);
  const late = item.claimed && item.state !== 'good' && isLate(post.dueOn, today);

  return (
    <Link href={`/work/${post.id}`} className="block rounded-md focus:outline-none">
      <Card className="transition hover:-translate-y-px hover:shadow-raised">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {post.kind === 'material' ? (
            <Pill tone="accent">{post.linkUrl && !post.fileName ? 'Link' : 'File'}</Pill>
          ) : item.state === 'good' ? (
            <Pill tone="correct">Good</Pill>
          ) : item.state === 'again' ? (
            <Pill tone="warn">Needs another go</Pill>
          ) : item.state === 'waiting' ? (
            <Pill tone="accent">Handed in</Pill>
          ) : item.claimed ? (
            <Pill tone="accent">Yours</Pill>
          ) : full ? (
            <Pill>Taken</Pill>
          ) : (
            <Pill>{slotsLabel(post.maxClaims)}</Pill>
          )}
          {post.expectedMinutes && post.kind === 'task' ? (
            <Pill>{describeMinutes(post.expectedMinutes)}</Pill>
          ) : null}
          {post.dueOn && post.kind === 'task' ? (
            <Pill tone={late ? 'wrong' : 'neutral'}>
              {late ? 'Late, due' : 'Due'} {shortDate(post.dueOn)}
            </Pill>
          ) : null}
          {post.hasMemo ? <Pill>Memo</Pill> : null}
          {item.replyWaiting ? <Pill tone="warn">Reply from your coach</Pill> : null}
          {!post.published ? <Pill>Taken down</Pill> : null}
        </div>
        <h2 className="text-lg">{post.title}</h2>
        {post.instructions ? (
          <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-slate">{post.instructions}</p>
        ) : null}
      </Card>
    </Link>
  );
}
