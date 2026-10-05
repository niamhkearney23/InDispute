import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireCoach } from '@/lib/admin/guard';
import { TutorThread } from '@/components/tutor-thread';
import { MODES } from '@/lib/tutor/rules';
import {
  conversation,
  explanationsFor,
  messages,
  personName,
  staffMayRead,
} from '@/lib/tutor/service';
import { RedactButton } from '../redact-button';

export const metadata: Metadata = { title: 'Tutor conversation' };

/**
 * One learner's conversation with the tutor, as they saw it. A coach reads
 * only the conversations of people the firm supervises; anybody else's is
 * not found, the same answer as one that does not exist. An administrator
 * can remove a message that should not have been typed.
 */
export default async function AdminTutorConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isAdmin } = await requireCoach();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const convo = await conversation(id);
  if (!convo || !(await staffMayRead(convo.userId, isAdmin))) notFound();

  const [thread, name] = await Promise.all([messages(convo.id), personName(convo.userId)]);
  const explanations = await explanationsFor(
    thread
      .filter((m) => m.role === 'learner' && m.questionVersionId && m.correct !== null)
      .map((m) => m.questionVersionId!),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section>
        <Link
          href="/admin/tutor"
          className="-my-2 inline-block py-2 text-sm text-slate hover:text-ink"
        >
          ← All conversations
        </Link>
        <p className="eyebrow mt-2 mb-2">
          {name} · {MODES[convo.mode].name}
        </p>
        <h1 className="text-3xl">{convo.topic}</h1>
        {isAdmin ? (
          <p className="mt-3 text-sm text-slate">
            If a message names a client or holds anything that should not be here, remove it. The
            words go for good; the record keeps that you removed them, and when.
          </p>
        ) : null}
      </section>
      <TutorThread
        messages={thread}
        learnerName={name}
        explanations={explanations}
        tools={isAdmin ? (m) => (m.redacted ? null : <RedactButton messageId={m.id} />) : undefined}
      />
    </div>
  );
}
