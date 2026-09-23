import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireCoach } from '@/lib/admin/guard';
import { allSessions } from '@/lib/lessons/sessions';
import {
  signedUrlForMemo,
  signedUrlForPost,
  signedUrlForSubmission,
  workPostForCoach,
} from '@/lib/work/service';
import type { NamedSubmission } from '@/lib/work/service';
import { describeMinutes, isLate, slotsLabel } from '@/lib/work/links';
import { Card, Pill, SectionHeading } from '@/components/ui';
import { MessageThread } from '@/components/message-thread';
import { MessageForm } from '@/app/(app)/work/message-form';
import { saveWorkPost } from '../actions';
import { WorkPostForm } from '../work-post-form';
import { MarkForm } from '../mark-form';
import { CopyLink } from '../copy-link';

export const metadata: Metadata = { title: 'Work' };
export const dynamic = 'force-dynamic';

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
 * One post, from the coach's side: every intern who has touched it, each
 * with their name on it or not, what they handed in, the marking form, and
 * the thread between them and the coaches. Then the post itself, to edit.
 */
export default async function WorkPostAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireCoach();
  const { id } = await params;

  const found = await workPostForCoach(id);
  if (!found) notFound();
  const { post, claims, submissions, threads, names } = found;

  const [sessions, fileUrl, memoUrl, ...submissionUrls] = await Promise.all([
    allSessions(),
    post.fileName ? signedUrlForPost(post.id) : Promise.resolve(null),
    post.hasMemo ? signedUrlForMemo(post.id) : Promise.resolve(null),
    ...submissions.map((s) => signedUrlForSubmission(s.id)),
  ]);
  const urlFor = new Map(submissions.map((s, i) => [s.id, submissionUrls[i] ?? null]));

  // Everybody who appears anywhere: a name on it, something handed in, or a
  // question asked. Newest submission per person first.
  const submissionsBy = new Map<string, NamedSubmission[]>();
  for (const s of submissions) {
    submissionsBy.set(s.userId, [...(submissionsBy.get(s.userId) ?? []), s]);
  }
  const claimedAt = new Map(claims.map((c) => [c.userId, c.claimedAt]));
  const people = [
    ...new Set([...claims.map((c) => c.userId), ...submissionsBy.keys(), ...threads.keys()]),
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <p className="eyebrow">{post.kind === 'task' ? 'Task' : 'Reading'}</p>
          {post.kind === 'task' ? <Pill>{slotsLabel(post.maxClaims)}</Pill> : null}
          {post.expectedMinutes ? <Pill>{describeMinutes(post.expectedMinutes)}</Pill> : null}
          {!post.published ? <Pill>Draft</Pill> : null}
        </div>
        <h1 className="text-3xl">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-burgundy underline underline-offset-2"
            >
              Open {post.fileName}
            </a>
          ) : null}
          <CopyLink path={`/work/${post.id}`} />
        </div>
        <p className="mt-1 text-xs text-muted">
          Send the link to whoever you like. They sign in, see the post, and put their name on
          it.
        </p>
        {memoUrl ? (
          <figure className="m-0 mt-3 max-w-xl">
            <figcaption className="mb-1 text-xs text-muted">Your memo, as they hear it</figcaption>
            <audio controls src={memoUrl} className="w-full" />
          </figure>
        ) : null}
      </div>

      {post.kind === 'task' ? (
        <section>
          <SectionHeading title="Who is on it" />
          {people.length === 0 ? (
            <p className="mb-4 text-sm text-slate">
              Nobody has put their name on this or asked about it yet.
            </p>
          ) : null}

          <div className="space-y-3">
            {people.map((personId) => {
              const [current, ...earlier] = submissionsBy.get(personId) ?? [];
              const thread = threads.get(personId) ?? [];
              const name = names.get(personId) ?? 'Somebody';
              return (
                <Card key={personId}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg">{name}</h2>
                    {current?.verdict === 'good' ? (
                      <Pill tone="correct">Good</Pill>
                    ) : current?.verdict === 'again' ? (
                      <Pill tone="warn">Needs another go</Pill>
                    ) : current ? (
                      <Pill tone="accent">Waiting to be marked</Pill>
                    ) : claimedAt.has(personId) ? (
                      <Pill tone="accent">Name on it</Pill>
                    ) : (
                      <Pill>Asked about it</Pill>
                    )}
                    {current && isLate(post.dueOn, current.submittedAt.slice(0, 10)) ? (
                      <Pill tone="wrong">Late</Pill>
                    ) : null}
                  </div>

                  {current ? (
                    <>
                      <p className="mt-2 text-sm text-slate">
                        Handed in {when(current.submittedAt)}.{' '}
                        {urlFor.get(current.id) ? (
                          <a
                            href={urlFor.get(current.id) ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center text-burgundy underline underline-offset-2"
                          >
                            Open {current.fileName}
                          </a>
                        ) : (
                          <span className="text-muted">The file could not be opened just now.</span>
                        )}
                      </p>
                      {current.note ? (
                        <p className="mt-1 text-sm text-slate">
                          <span className="text-muted">They said:</span> {current.note}
                        </p>
                      ) : null}

                      <MarkForm
                        submissionId={current.id}
                        verdict={current.verdict}
                        feedback={current.feedback}
                      />

                      {earlier.length > 0 ? (
                        <details className="mt-3 text-sm">
                          <summary className="cursor-pointer text-muted">
                            {earlier.length} earlier attempt{earlier.length === 1 ? '' : 's'}
                          </summary>
                          <ul className="mt-2 space-y-1.5 text-slate">
                            {earlier.map((s) => (
                              <li key={s.id}>
                                {when(s.submittedAt)}:{' '}
                                {s.verdict === 'good'
                                  ? 'good'
                                  : s.verdict === 'again'
                                    ? 'needs another go'
                                    : 'not marked'}
                                {s.feedback ? ` (${s.feedback})` : ''}
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </>
                  ) : claimedAt.has(personId) ? (
                    <p className="mt-2 text-sm text-slate">Nothing handed in yet.</p>
                  ) : null}

                  <div className="mt-4 border-t border-rule pt-3">
                    <p className="eyebrow mb-2">Messages</p>
                    <MessageThread
                      messages={thread.map((m) => ({
                        id: m.id,
                        body: m.body,
                        sentAt: m.sentAt,
                        mine: m.senderId === userId,
                        from: m.fromCoach ? `${m.senderName} (coach)` : m.senderName,
                      }))}
                      empty="No messages yet."
                    />
                    <MessageForm
                      postId={post.id}
                      threadUserId={personId}
                      placeholder={`Reply to ${name}`}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeading title="Edit the post" />
        <p className="mb-4 max-w-2xl text-sm text-slate">
          Changing this changes what anybody who opens it from now on sees. Anything already
          handed in stays exactly as it was.
        </p>
        <WorkPostForm
          action={saveWorkPost}
          sessions={sessions.map((s) => ({ id: s.id, title: s.title }))}
          submitLabel="Save"
          initial={{
            id: post.id,
            kind: post.kind,
            title: post.title,
            instructions: post.instructions,
            fileName: post.fileName,
            linkUrl: post.linkUrl ?? '',
            hasMemo: post.hasMemo,
            maxClaims: post.maxClaims,
            expectedMinutes: post.expectedMinutes,
            traineesOnly: post.traineesOnly,
            country: post.country ?? 'ALL',
            dueOn: post.dueOn ?? '',
            sessionId: post.sessionId ?? '',
            homeworkDay: post.homeworkDay,
            published: post.published,
          }}
        />
      </section>
    </div>
  );
}
