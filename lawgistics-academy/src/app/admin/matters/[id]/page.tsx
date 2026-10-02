import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireCoach } from '@/lib/admin/guard';
import { getLearnerProfile } from '@/lib/learner-overview';
import { DEFAULT_TIMEZONE } from '@/lib/types';
import { matterForStaff, signedUrlForRecording } from '@/lib/matters/service';
import { describeLimit, matterLabel } from '@/lib/matters/rules';
import { Card, Notice, Pill, SectionHeading } from '@/components/ui';
import { DecisionForm, MatterForm, MatterMarkForm, PublishForm } from '../forms';

export const metadata: Metadata = { title: 'Matter' };
export const dynamic = 'force-dynamic';

function when(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
}

/**
 * One matter from the staff side: what it says, who signed it off, the
 * decision and publish controls, every attempt with a marking form, and, for
 * an administrator, the form to change it.
 */
export default async function AdminMatterPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId, isAdmin } = await requireCoach();
  const { id } = await params;
  const me = await getLearnerProfile(userId);
  const timeZone = me?.timezone ?? DEFAULT_TIMEZONE;

  const found = await matterForStaff(id);
  if (!found) notFound();
  const { matter, attempts } = found;
  const handedIn = attempts.filter((a) => a.submittedAt);
  const urls = await Promise.all(handedIn.map((a) => (a.hasRecording ? signedUrlForRecording(a.id) : null)));
  const wroteIt = matter.createdBy === userId;

  return (
    <div className="space-y-8">
      <p className="text-sm">
        <Link href="/admin/matters" className="inline-flex min-h-11 items-center text-slate underline underline-offset-2">
          All matters
        </Link>
      </p>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-burgundy">{matterLabel(matter.number)}</span>
          <Pill>{matter.country === 'MY' ? 'Malaysia' : 'Australia'}</Pill>
          {matter.area ? <Pill>{matter.area}</Pill> : null}
          <Pill>{describeLimit(matter.timeLimitMinutes)}</Pill>
          {matter.published ? <Pill tone="correct">Up</Pill> : <Pill>Not up</Pill>}
          {matter.reviewFlagged ? <Pill tone="wrong">Flagged</Pill> : null}
          {!matter.createdBy ? <Pill tone="warn">AI draft</Pill> : null}
        </div>
        <h1 className="text-3xl">{matter.title}</h1>
        <p className="mt-2 text-sm text-slate">
          {matter.verifiedBy
            ? `Signed off by ${matter.verifiedByName ?? 'a coach'}${matter.verifiedAt ? `, ${when(matter.verifiedAt, timeZone)}` : ''}.`
            : 'Not signed off.'}
        </p>
        {matter.reviewFlagged && matter.reviewNote ? (
          <div className="mt-3">
            <Notice tone="warn">Flagged: {matter.reviewNote}</Notice>
          </div>
        ) : null}
        {!matter.createdBy ? (
          <div className="mt-3">
            <Notice tone="warn">
              Drafted with AI assistance on invented facts. Read the facts and the approach
              line by line, correct anything wrong, and only then sign it off.
            </Notice>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <p className="eyebrow mb-3">Sign off</p>
          {wroteIt ? (
            <p className="text-sm text-slate">You wrote this version, so somebody else signs it off.</p>
          ) : (
            <DecisionForm id={matter.id} updatedAt={matter.updatedAt} />
          )}
        </Card>
        {isAdmin ? (
          <Card>
            <p className="eyebrow mb-3">Publish</p>
            <PublishForm
              id={matter.id}
              published={matter.published}
              canPublish={Boolean(matter.verifiedBy) && !matter.reviewFlagged}
            />
          </Card>
        ) : null}
      </div>

      <section>
        <SectionHeading title="What learners see" />
        <Card>
          <p className="font-serif text-[1.0625rem] leading-relaxed whitespace-pre-line">{matter.brief}</p>
          <ol className="mt-5 list-decimal space-y-1 border-t border-rule pt-4 pl-5 text-sm text-slate">
            <li>{matter.procedurePrompt}</li>
            <li>{matter.draftPrompt}</li>
            <li>{matter.speakPrompt}</li>
            <li>Five follow-up questions about their own draft.</li>
          </ol>
        </Card>
      </section>

      <section>
        <SectionHeading title="How a lawyer would approach it" />
        <Card className="border-burgundy/30 bg-burgundy-wash">
          <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line">{matter.modelAnswer}</p>
          {matter.sources ? <p className="mt-4 border-t border-burgundy/20 pt-3 text-xs text-slate">{matter.sources}</p> : null}
        </Card>
      </section>

      <section>
        <SectionHeading title={`Handed in (${handedIn.length})`} />
        {handedIn.length === 0 ? (
          <p className="text-sm text-muted">Nothing handed in yet.</p>
        ) : (
          <div className="space-y-4">
            {handedIn.map((a, i) => (
              <Card key={a.id}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-xs text-muted">{a.submittedAt ? when(a.submittedAt, timeZone) : ''}</span>
                  {a.submittedLate ? <Pill tone="wrong">Over time</Pill> : null}
                  {a.verdict === 'good' ? <Pill tone="correct">Good</Pill> : a.verdict === 'again' ? <Pill tone="warn">Needs another go</Pill> : <Pill tone="accent">To mark</Pill>}
                </div>
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-burgundy">Read their work</summary>
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="font-medium">Procedure</p>
                      <p className="whitespace-pre-line text-slate">{a.procedureAnswer}</p>
                    </div>
                    <div>
                      <p className="font-medium">Advice</p>
                      <p className="whitespace-pre-line text-slate">{a.draftAnswer}</p>
                    </div>
                    <div>
                      <p className="font-medium">Explanation</p>
                      {urls[i] ? <audio controls src={urls[i] ?? undefined} className="w-full" /> : <p className="text-muted">No recording.</p>}
                    </div>
                    <div>
                      <p className="font-medium">
                        Follow-up questions{a.followUpsByAi === false ? ' (standard set)' : ''}
                      </p>
                      <ol className="mt-1 space-y-2">
                        {a.followUpQuestions.map((q, n) => (
                          <li key={n}>
                            <p className="text-ink">{q}</p>
                            <p className="whitespace-pre-line text-slate">{a.followUpAnswers[n] ?? ''}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </details>
                <MatterMarkForm attemptId={a.id} verdict={a.verdict} feedback={a.feedback} />
              </Card>
            ))}
          </div>
        )}
      </section>

      {isAdmin ? (
        <section>
          <SectionHeading title="Change it" />
          <p className="mb-4 max-w-2xl text-sm text-slate">
            Changing what it says takes it down and clears the sign-off. Attempts already
            started keep the version they were given.
          </p>
          <MatterForm
            initial={{
              id: matter.id,
              number: matter.number,
              title: matter.title,
              country: matter.country,
              area: matter.area,
              brief: matter.brief,
              timeLimitMinutes: matter.timeLimitMinutes,
              procedurePrompt: matter.procedurePrompt,
              draftPrompt: matter.draftPrompt,
              speakPrompt: matter.speakPrompt,
              modelAnswer: matter.modelAnswer,
              sources: matter.sources,
            }}
          />
        </section>
      ) : null}
    </div>
  );
}
