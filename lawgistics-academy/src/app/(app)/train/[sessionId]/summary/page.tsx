import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { getLearnerOverview } from '@/lib/learner-overview';
import { ButtonLink, Card, Stat } from '@/components/ui';

export const metadata: Metadata = { title: 'Session complete' };

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createSupabaseServerClient();
  const { data: session } = await supabase
    .from('training_sessions')
    .select('id, kind, total_answered, correct_count, xp_awarded, completed_at')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) redirect('/dashboard');

  const overview = await getLearnerOverview(user.id);
  const accuracy =
    session.total_answered > 0
      ? Math.round((session.correct_count / session.total_answered) * 100)
      : 0;

  const perfect = session.total_answered > 0 && accuracy === 100;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <p className="eyebrow mb-2">Session complete</p>
        <h1 className="text-3xl sm:text-4xl">
          {perfect
            ? 'A clean sheet.'
            : accuracy >= 70
              ? 'Solid work.'
              : 'That is the useful kind of session.'}
        </h1>
        <p className="mt-3 text-slate">
          {perfect
            ? 'Every answer correct. The concepts you got right today will come back later, spaced out, not forgotten.'
            : accuracy >= 70
              ? 'The concepts you missed are already scheduled to come back tomorrow.'
              : 'Everything you got wrong has been scheduled to return tomorrow. That is exactly how this is meant to work.'}
        </p>
      </section>

      <Card>
        <div className="grid grid-cols-3 gap-5">
          <Stat
            label="Correct"
            value={`${session.correct_count}/${session.total_answered}`}
            hint={`${accuracy}% accuracy`}
          />
          <Stat label="XP earned" value={session.xp_awarded} />
          <Stat
            label="Streak"
            value={overview?.currentStreak ?? 0}
            hint={overview?.currentStreak === 1 ? 'day' : 'days'}
          />
        </div>
      </Card>

      {overview?.needsReview.length ? (
        <Card>
          <p className="eyebrow mb-3">Coming back for you</p>
          <ul className="space-y-1.5 text-sm">
            {overview.needsReview.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/dashboard" size="lg" variant="accent">
          Back to today
        </ButtonLink>
        <ButtonLink href="/skills" size="lg" variant="outline">
          See your skill map
        </ButtonLink>
      </div>
    </div>
  );
}
