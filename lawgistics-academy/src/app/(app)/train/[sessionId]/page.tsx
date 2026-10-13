import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { completeSession, getSessionPlan } from '@/lib/training/service';
import { SessionRunner } from '@/components/session-runner';
import { requireAccess } from '@/lib/access/service';
import { courtMapsFor, viewerIsStaff } from '@/lib/content/service';

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

  // The court diagram for a court question is the court map, so it is sent
  // only when a lawyer has signed that map off; otherwise the question is
  // answered from a plain list of the courts it offers.
  const maps = plan.questions.some((q) => q.questionType === 'court_hierarchy')
    ? await courtMapsFor(await viewerIsStaff(user.id))
    : {};
  const courtMaps = Object.fromEntries(
    Object.entries(maps).map(([country, map]) => [
      country,
      { hierarchy: map.item, checked: map.checked },
    ]),
  );

  return (
    <SessionRunner
      sessionId={plan.sessionId}
      kind={plan.kind}
      questions={plan.questions}
      startIndex={plan.resumeIndex}
      courtMaps={courtMaps}
    />
  );
}
