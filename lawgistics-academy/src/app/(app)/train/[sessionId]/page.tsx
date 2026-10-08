import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { completeSession, getSessionPlan } from '@/lib/training/service';
import { SessionRunner } from '@/components/session-runner';
import { requireAccess } from '@/lib/access/service';

export const metadata: Metadata = { title: 'Training' };

export default async function TrainPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await requireAccess();
  const { sessionId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const plan = await getSessionPlan(user.id, sessionId);
  if (!plan) redirect('/dashboard');

  // Everything answered already, go straight to the summary. Somebody who
  // answered the last question and closed the tab before pressing Finish
  // left the session open; finish it now (it is safe to finish twice), or
  // every Train again would bring them back here with no XP and no streak.
  if (plan.resumeIndex >= plan.questions.length) {
    if (plan.kind !== 'diagnostic') await completeSession(user.id, sessionId);
    redirect(
      plan.kind === 'diagnostic'
        ? `/diagnostic/results?session=${sessionId}`
        : `/train/${sessionId}/summary`,
    );
  }

  return (
    <SessionRunner
      sessionId={plan.sessionId}
      kind={plan.kind}
      questions={plan.questions}
      startIndex={plan.resumeIndex}
    />
  );
}
