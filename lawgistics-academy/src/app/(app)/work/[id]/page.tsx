import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import {
  isFull,
  signedUrlForMemo,
  signedUrlForPost,
  signedUrlForSubmission,
  workPostFor,
} from '@/lib/work/service';
import { describeMinutes, isLate, slotsLabel } from '@/lib/work/links';
import { Card, Notice, Pill } from '@/components/ui';
import { MessageThread } from '@/components/message-thread';
import { ClaimForm, SubmitForm } from '../work-forms';
import { MessageForm } from '../message-form';

export const metadata: Metadata = { title: 'Work' };
export const dynamic = 'force-dynamic';

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

function when(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/**
 * One piece of work: what to do, the coach's memo, the file or link, where
 * this person stands on it, and a thread to the coach. The upload form,
 * with the rule above the box, appears only once their name is on it.
 */
export default async function WorkPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=/work/${id}`);

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  const found = await workPostFor(id, user.id);
  if (!found) notFound();
  const { post, claimed, claims, state, submissions, messages } = found;

  const [fileUrl, memoUrl, ...submissionUrls] = await Promise.all([
    post.fileName ? signedUrlForPost(post.id) : Promise.resolve(null),
    post.hasMemo ? signedUrlForMemo(post.id) : Promise.resolve(null),
    ...submissions.map((s) => signedUrlForSubmission(s.id)),
  ]);

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: profile.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const full = post.kind === 'task' && !claimed && isFull(post, claims);
  const canClaim = post.kind === 'task' && !claimed && !full && post.published;
  const canSubmit = post.kind === 'task' && claimed && state !== 'good';
  const placesLeft = post.maxClaims !== null ? post.maxClaims - claims : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="text-sm">
        <Link
          href="/work"
          className="-mx-1 inline-flex min-h-11 items-center rounded-[5px] px-1 text-slate underline underline-offset-2 hover:bg-paper-sunk"
        >
          All work
        </Link>
      </p>

      <section>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <p className="eyebrow">{post.kind === 'task' ? 'Work to do' : 'To read'}</p>
          {post.kind === 'task' ? <Pill>{slotsLabel(post.maxClaims)}</Pill> : null}
          {post.expectedMinutes ? <Pill>{describeMinutes(post.expectedMinutes)}</Pill> : null}
          {!post.published ? <Pill>Taken down</Pill> : null}
        </div>
        <h1 className="text-3xl">{post.title}</h1>
        {post.dueOn && post.kind === 'task' ? (
          <p className="mt-2 text-sm text-slate">
            Due {longDate(post.dueOn)}
            {isLate(post.dueOn, today) && state !== 'good' ? ', which has passed' : ''}.
          </p>
        ) : null}
        {post.expectedMinutes ? (
          <p className="mt-1 text-sm text-slate">
            Your coach expects this to take {describeMinutes(post.expectedMinutes)}. If it is
            taking a lot longer, say so below rather than pushing on.
          </p>
        ) : null}
      </section>

      {memoUrl ? (
        <Card>
          <p className="eyebrow mb-2">Your coach, in their own words</p>
          <audio controls src={memoUrl} className="w-full" />
        </Card>
      ) : null}

      {post.instructions ? (
        <Card>
          <p className="whitespace-pre-line text-slate">{post.instructions}</p>
        </Card>
      ) : null}

      {post.fileName || post.linkUrl ? (
        <Card>
          <p className="eyebrow mb-2">{post.kind === 'task' ? 'What you are working from' : 'The reading'}</p>
          <div className="space-y-1">
            {post.fileName ? (
              fileUrl ? (
                <p>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center text-burgundy underline underline-offset-2"
                  >
                    Open {post.fileName}
                  </a>
                </p>
              ) : (
                <p className="text-sm text-muted">The file could not be opened just now.</p>
              )
            ) : null}
            {post.linkUrl ? (
              <p>
                <a
                  href={post.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-burgundy underline underline-offset-2"
                >
                  Open in Google Drive
                </a>
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {post.kind === 'task' ? (
        <Card>
          {state === 'good' ? (
            <>
              <Pill tone="correct">Good</Pill>
              <p className="mt-2 text-slate">Your coach was happy with this one.</p>
            </>
          ) : state === 'again' ? (
            <>
              <Pill tone="warn">Needs another go</Pill>
              <p className="mt-2 text-slate">
                Read what your coach said below, then hand in your next go.
              </p>
            </>
          ) : state === 'waiting' ? (
            <>
              <Pill tone="accent">Handed in</Pill>
              <p className="mt-2 text-slate">
                Waiting for your coach to look at it. You can hand in a newer version if you
                spot something.
              </p>
            </>
          ) : claimed ? (
            <>
              <Pill tone="accent">Yours</Pill>
              <p className="mt-2 text-slate">Your name is on this. Hand it in when it is done.</p>
            </>
          ) : full ? (
            <>
              <Pill>Taken</Pill>
              <p className="mt-2 text-slate">
                {post.maxClaims === 1
                  ? 'Somebody else put their name on this one first.'
                  : 'This one has all the names it can take.'}
              </p>
            </>
          ) : !post.published ? (
            <p className="text-slate">This has been taken down.</p>
          ) : (
            <p className="text-slate">
              {placesLeft === null
                ? 'Everyone does their own. Say you will do it, and hand it in when it is done.'
                : placesLeft === 1 && claims === 0
                  ? 'Nobody has this yet. Put your name on it and it is yours.'
                  : `${placesLeft} place${placesLeft === 1 ? '' : 's'} left. Put your name on it if you want one.`}
            </p>
          )}

          {canClaim ? <ClaimForm postId={post.id} everyone={post.maxClaims === null} /> : null}
          {canSubmit ? <SubmitForm postId={post.id} again={state === 'again'} /> : null}
        </Card>
      ) : null}

      {submissions.length > 0 ? (
        <section>
          <p className="eyebrow mb-3">What you handed in</p>
          <div className="space-y-3">
            {submissions.map((s, i) => (
              <Card key={s.id}>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate">
                  <span>{when(s.submittedAt)}</span>
                  {submissionUrls[i] ? (
                    <a
                      href={submissionUrls[i] ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center text-burgundy underline underline-offset-2"
                    >
                      {s.fileName}
                    </a>
                  ) : (
                    <span>{s.fileName}</span>
                  )}
                  {s.verdict === 'good' ? (
                    <Pill tone="correct">Good</Pill>
                  ) : s.verdict === 'again' ? (
                    <Pill tone="warn">Needs another go</Pill>
                  ) : (
                    <Pill>Not yet marked</Pill>
                  )}
                </div>
                {s.note ? <p className="mt-2 text-sm text-muted">You said: {s.note}</p> : null}
                {s.feedback ? (
                  <div className="mt-3">
                    <Notice tone={s.verdict === 'good' ? 'good' : 'neutral'}>
                      <span className="whitespace-pre-line">{s.feedback}</span>
                    </Notice>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <Card>
        <p className="eyebrow mb-1">Message your coach</p>
        <p className="mb-3 text-sm text-slate">
          Not sure what is wanted, or whether to take it? Ask here. Only you and the coaches see
          this.
        </p>
        <MessageThread
          messages={messages.map((m) => ({
            id: m.id,
            body: m.body,
            sentAt: m.sentAt,
            mine: m.senderId === user.id,
            from: m.senderId === user.id ? 'You' : 'Your coach',
          }))}
          empty="Nothing asked yet."
        />
        <MessageForm
          postId={post.id}
          threadUserId={user.id}
          placeholder="Message your coach for more information"
        />
      </Card>
    </div>
  );
}
