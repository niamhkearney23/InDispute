import type { Metadata } from 'next';
import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { allWorkPosts } from '@/lib/work/service';
import { describeMinutes, slotsLabel } from '@/lib/work/links';
import { ButtonLink, Card, EmptyState, Pill } from '@/components/ui';
import { COUNTRY_LABELS } from '@/lib/types';

export const metadata: Metadata = { title: 'Work' };
export const dynamic = 'force-dynamic';

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export default async function WorkBoardAdminPage() {
  await requireCoach();
  const posts = await allWorkPosts();

  const waiting = posts.reduce((n, p) => n + p.waiting, 0);
  const unanswered = posts.reduce((n, p) => n + p.unanswered, 0);

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">Work</p>
            <h1 className="text-3xl">What you give them to do</h1>
          </div>
          <ButtonLink href="/admin/work/new" variant="accent">
            Post work
          </ButtonLink>
        </div>
        <p className="mt-3 max-w-2xl text-slate">
          A piece of work, or something to read. Record a memo or type it, say how many people
          can take it, and send the link. Interns put their name on a task, hand it in here,
          and you mark it: good, or needs another go, and why. Nothing with a client&apos;s
          name in it, on either side.
        </p>
        {waiting > 0 || unanswered > 0 ? (
          <p className="mt-2 text-sm text-burgundy">
            {waiting > 0
              ? `${waiting} piece${waiting === 1 ? '' : 's'} of work waiting to be marked. `
              : ''}
            {unanswered > 0
              ? `${unanswered} message${unanswered === 1 ? '' : 's'} waiting for a reply.`
              : ''}
          </p>
        ) : null}
      </section>

      {posts.length === 0 ? (
        <EmptyState
          title="Nothing posted yet"
          description="Post a task or a reading. It takes about a minute, and it is in front of your trainees as soon as you put it up."
        />
      ) : null}

      <div className="space-y-3">
        {posts.map(({ post, claims, submissions, waiting: toMark, unanswered: toAnswer }) => (
          <Card key={post.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <Pill tone={post.published ? 'correct' : 'neutral'}>
                    {post.published ? 'Up' : 'Draft'}
                  </Pill>
                  <Pill tone="accent">{post.kind === 'task' ? 'Task' : 'Reading'}</Pill>
                  {post.kind === 'task' ? <Pill>{slotsLabel(post.maxClaims)}</Pill> : null}
                  {post.expectedMinutes ? <Pill>{describeMinutes(post.expectedMinutes)}</Pill> : null}
                  <Pill>
                    {post.traineesOnly ? 'Trainees' : 'All learners'}
                    {post.country ? `, ${COUNTRY_LABELS[post.country]}` : ''}
                  </Pill>
                  {post.dueOn ? <Pill>Due {shortDate(post.dueOn)}</Pill> : null}
                  {post.hasMemo ? <Pill>Memo</Pill> : null}
                  {toMark > 0 ? <Pill tone="warn">{toMark} to mark</Pill> : null}
                  {toAnswer > 0 ? <Pill tone="warn">{toAnswer} to answer</Pill> : null}
                </div>
                <h2 className="text-lg">{post.title}</h2>
                {post.kind === 'task' ? (
                  <p className="mt-1 text-sm text-muted">
                    {claims} name{claims === 1 ? '' : 's'} on it
                    {post.maxClaims !== null ? ` of ${post.maxClaims}` : ''}, {submissions} handed
                    in
                  </p>
                ) : null}
              </div>

              <Link
                href={`/admin/work/${post.id}`}
                className="shrink-0 rounded-[5px] border border-rule-strong px-3 py-2 text-sm text-slate hover:bg-paper hover:text-ink"
              >
                {toMark > 0 || toAnswer > 0 ? 'Open' : 'Edit'}
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
