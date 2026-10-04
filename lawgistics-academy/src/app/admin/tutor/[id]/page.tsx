import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireCoach } from '@/lib/admin/guard';
import { TutorThread } from '@/components/tutor-thread';
import { MODES } from '@/lib/tutor/rules';
import { conversation, messages, personName, verifiedQuestion } from '@/lib/tutor/service';

export const metadata: Metadata = { title: 'Tutor conversation' };

/** One learner's conversation with the tutor, as they saw it. Read only. */
export default async function AdminTutorConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCoach();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const convo = await conversation(id);
  if (!convo) notFound();

  const [thread, name] = await Promise.all([messages(convo.id), personName(convo.userId)]);
  const answered = thread.filter((m) => m.role === 'learner' && m.questionVersionId);
  const checked = await Promise.all(answered.map((m) => verifiedQuestion(m.questionVersionId!)));
  const explanations = Object.fromEntries(
    answered.map((m, i) => [m.questionVersionId!, checked[i]?.explanation ?? null]),
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
      </section>
      <TutorThread messages={thread} learnerName={name} explanations={explanations} />
    </div>
  );
}
