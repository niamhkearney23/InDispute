import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/access/service';
import { Notice } from '@/components/ui';
import { TutorThread } from '@/components/tutor-thread';
import { aiCompany } from '@/lib/ai/provider';
import { getLearnerProfile } from '@/lib/learner-overview';
import { moduleBySlug } from '@/content/seed/modules';
import { MODES, testProgress, tutorNotice } from '@/lib/tutor/rules';
import {
  conversation,
  explanationsFor,
  isSupervised,
  messages,
  verifiedQuestion,
} from '@/lib/tutor/service';
import { AnswerForm, ExplainForm, SkipForm } from '../forms';

export const metadata: Metadata = { title: 'Tutor' };

export default async function TutorConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/tutor');

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const convo = await conversation(id);
  // Coaches read conversations on their own page; this one is the learner's.
  if (!convo || convo.userId !== user.id) notFound();

  const [thread, supervised] = await Promise.all([messages(convo.id), isSupervised(user.id)]);
  const provider = aiCompany();

  let explanations: Record<string, string | null> = {};
  let current: string | null = null;
  let waiting: Awaited<ReturnType<typeof verifiedQuestion>> = null;
  // A test from a module of the other country, because the learner has
  // changed country since starting it: nothing more is asked or marked.
  let otherCountry = false;
  if (convo.mode === 'test') {
    const profile = await getLearnerProfile(user.id);
    const testModule = convo.moduleSlug ? moduleBySlug(convo.moduleSlug) : null;
    otherCountry = Boolean(profile && testModule && testModule.country !== profile.country);
    const progress = testProgress(thread);
    current = progress.current;
    const answered = thread.filter(
      (m) => m.role === 'learner' && m.questionVersionId && m.correct !== null,
    );
    [explanations, waiting] = await Promise.all([
      explanationsFor(answered.map((m) => m.questionVersionId!)),
      current && profile && !otherCountry ? verifiedQuestion(current, profile.country) : Promise.resolve(null),
    ]);
  }
  const last = thread[thread.length - 1];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section>
        <Link href="/tutor" className="-my-2 inline-block py-2 text-sm text-slate hover:text-ink">
          ← Tutor
        </Link>
        <p className="eyebrow mt-2 mb-2">{MODES[convo.mode].name}</p>
        <h1 className="text-3xl">{convo.topic}</h1>
      </section>

      <Notice tone="neutral">{tutorNotice({ supervised, provider })}</Notice>

      <TutorThread messages={thread} explanations={explanations} />

      <div className="border-t border-rule pt-5">
        {convo.mode === 'explain' ? (
          provider ? (
            <ExplainForm
              conversationId={convo.id}
              turn={thread.length}
              unanswered={last?.role === 'learner'}
            />
          ) : (
            <p className="text-sm text-slate">
              The tutor&rsquo;s AI is not switched on at the moment, so it cannot reply. Your
              conversation is kept; come back to it later.
            </p>
          )
        ) : otherCountry ? (
          <p className="text-sm text-slate">
            This test is from the other country&rsquo;s questions, and your account has changed
            country since it started.{' '}
            <Link href="/tutor" className="font-medium text-accent underline underline-offset-2">
              Start a new test
            </Link>{' '}
            from your own modules.
          </p>
        ) : current && waiting ? (
          <AnswerForm
            conversationId={convo.id}
            questionVersionId={current}
            options={waiting.options}
            turn={thread.length}
          />
        ) : current ? (
          <SkipForm conversationId={convo.id} questionVersionId={current} />
        ) : (
          <p className="text-sm text-slate">
            This test is finished.{' '}
            <Link href="/tutor" className="font-medium text-accent underline underline-offset-2">
              Start another
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
