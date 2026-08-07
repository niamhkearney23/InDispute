import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getSessionPlan } from '@/lib/training/service';
import { SessionRunner } from '@/components/session-runner';

export const metadata: Metadata = { title: 'Training' };

export default async function TrainPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const plan = await getSessionPlan(user.id, sessionId);
  if (!plan) redirect('/dashboard');

  // Everything answered already — go straight to the summary.
  if (plan.answeredCount >= plan.questions.length) {
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
      startIndex={plan.answeredCount}
    />
  );
}
