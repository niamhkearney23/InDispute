import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/supabase/server';
import { requireAccess } from '@/lib/access/service';
import { Notice } from '@/components/ui';
import { TutorThread } from '@/components/tutor-thread';
import { MODES, TUTOR_NOTICE, testProgress } from '@/lib/tutor/rules';
import { conversation, messages, verifiedQuestion } from '@/lib/tutor/service';
import { AnswerForm, ExplainForm } from '../forms';

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

  const thread = await messages(convo.id);

  let explanations: Record<string, string | null> = {};
  let waiting: Awaited<ReturnType<typeof verifiedQuestion>> = null;
  if (convo.mode === 'test') {
    const progress = testProgress(thread);
    const answered = thread.filter((m) => m.role === 'learner' && m.questionVersionId);
    const checked = await Promise.all(answered.map((m) => verifiedQuestion(m.questionVersionId!)));
    explanations = Object.fromEntries(
      answered.map((m, i) => [m.questionVersionId!, checked[i]?.explanation ?? null]),
    );
    waiting = progress.current ? await verifiedQuestion(progress.current) : null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section>
        <Link href="/tutor" className="-my-2 inline-block py-2 text-sm text-slate hover:text-ink">
          ← Tutor
        </Link>
        <p className="eyebrow mt-2 mb-2">{MODES[convo.mode].name}</p>
        <h1 className="text-3xl">{convo.topic}</h1>
      </section>

      <Notice tone="neutral">{TUTOR_NOTICE}</Notice>

      <TutorThread messages={thread} explanations={explanations} />

      <div className="border-t border-rule pt-5">
        {convo.mode === 'explain' ? (
          <ExplainForm conversationId={convo.id} turn={thread.length} />
        ) : waiting ? (
          <AnswerForm conversationId={convo.id} options={waiting.options} turn={thread.length} />
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
