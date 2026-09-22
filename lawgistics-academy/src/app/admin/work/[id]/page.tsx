import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireCoach } from '@/lib/admin/guard';
import { allSessions } from '@/lib/lessons/sessions';
import { signedUrlForPost, signedUrlForSubmission, workPostForCoach } from '@/lib/work/service';
import { isLate } from '@/lib/work/links';
import { Card, Pill, SectionHeading } from '@/components/ui';
import { saveWorkPost } from '../actions';
import { WorkPostForm } from '../work-post-form';
import { MarkForm } from '../mark-form';

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

export default async function WorkPostAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCoach();
  const { id } = await params;

  const found = await workPostForCoach(id);
  if (!found) notFound();
  const { post, claims, submissions } = found;

  const [sessions, fileUrl, ...submissionUrls] = await Promise.all([
    allSessions(),
    post.fileName ? signedUrlForPost(post.id) : Promise.resolve(null),
    ...submissions.map((s) => signedUrlForSubmission(s.id)),
  ]);
  const urlFor = new Map(submissions.map((s, i) => [s.id, submissionUrls[i] ?? null]));

  // Newest per person first, then that person's earlier attempts under it.
  const byPerson = new Map<string, typeof submissions>();
  for (const s of submissions) {
    byPerson.set(s.userId, [...(byPerson.get(s.userId) ?? []), s]);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-2">{post.kind === 'task' ? 'Task' : 'Reading'}</p>
        <h1 className="text-3xl">{post.title}</h1>
        {fileUrl ? (
          <p className="mt-2 text-sm">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-burgundy underline underline-offset-2"
            >
              Open {post.fileName}
            </a>
          </p>
        ) : null}
      </div>

      {post.kind === 'task' ? (
        <section>
          <SectionHeading title="Handed in" />
          {submissions.length === 0 ? (
            <p className="mb-4 text-sm text-slate">
              {claims.length === 0
                ? 'Nobody has put their name on this yet.'
                : `${claims.map((c) => c.name).join(', ')} ${claims.length === 1 ? 'has' : 'have'} put their name on it. Nothing handed in yet.`}
            </p>
          ) : null}

          <div className="space-y-3">
            {[...byPerson.values()].map((theirs) => {
              const [current, ...earlier] = theirs;
              return (
                <Card key={current.userId}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg">{current.name}</h2>
                    {current.verdict === 'good' ? (
                      <Pill tone="correct">Good</Pill>
                    ) : current.verdict === 'again' ? (
                      <Pill tone="warn">Needs another go</Pill>
                    ) : (
                      <Pill tone="accent">Waiting</Pill>
                    )}
                    {isLate(post.dueOn, current.submittedAt.slice(0, 10)) ? (
                      <Pill tone="wrong">Late</Pill>
                    ) : null}
                  </div>

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
            scope: post.scope,
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
