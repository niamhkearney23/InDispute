import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { getLearnerOverview } from '@/lib/learner-overview';
import { ButtonLink, Card, Stat } from '@/components/ui';
import { levelForXp } from '@/lib/learning/progression';
import { STREAK_MILESTONES, streakMilestoneLine } from '@/lib/learning/milestones';
import { LevelUp } from '../level-up';
import { moduleForSession } from '@/lib/modules/service';
import { requireAccess } from '@/lib/access/service';

export const metadata: Metadata = { title: 'Session complete' };

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await requireAccess();
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
  const moduleEntry = overview
    ? await moduleForSession(user.id, overview.profile.country, sessionId)
    : null;
  const accuracy =
    session.total_answered > 0
      ? Math.round((session.correct_count / session.total_answered) * 100)
      : 0;

  const perfect = session.total_answered > 0 && accuracy === 100;

  /* Did this session take them up a level?
   *
   * Worked out by subtraction rather than recorded: the level before is the
   * level the XP total was at before this session's XP was added. That needs no
   * new column and cannot drift out of step with the XP it describes, which a
   * separate "levelled up" flag eventually would. */
  const xpAwarded = session.xp_awarded ?? 0;
  const totalXp = overview?.totalXp ?? 0;
  const before = levelForXp(Math.max(0, totalXp - xpAwarded));
  const leveledUp = overview ? before.level < overview.level.level : false;

  /* Streak milestones, said once.
   *
   * Only on the first session finished today, because the streak does not move
   * again until tomorrow: without that, somebody who trains three times on the
   * day they hit thirty is congratulated three times, and the third one is
   * noise rather than a milestone.
   *
   * Nothing is nagged about in between. Seven, thirty and a hundred are worth
   * saying. A message every day about a streak you might lose is the kind of
   * pressure that makes people put an app down at work. */
  const streak = overview?.currentStreak ?? 0;
  const firstToday = overview?.sessionsToday === 1;
  const milestone =
    firstToday && (STREAK_MILESTONES as readonly number[]).includes(streak) ? streak : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <p className="eyebrow mb-2">Session complete</p>
        <h1 className="text-3xl sm:text-4xl">
          {perfect
            ? 'A clean sheet.'
            : accuracy >= 70
              ? 'Solid work.'
              : 'Work still to do.'}
        </h1>
        <p className="mt-3 text-slate">
          {perfect
            ? 'Every answer correct. The concepts you got right today will come back later, spaced out, not forgotten.'
            : accuracy >= 70
              ? 'The concepts you missed are already scheduled to come back tomorrow.'
              : 'Each question you got wrong is scheduled to return tomorrow. Meeting it again, at an interval, is how it becomes something you know rather than something you read.'}
        </p>
      </section>

      {/* A module session says where the module now stands, in numbers. The
          module is finished when every question in it has been answered
          correctly once. A sitting asks at most eight, so a module of thirteen
          cannot be finished in one: this says how many of the module's
          questions are done and how many are still to come, never "8 of 13
          right", which reads as five wrong to somebody who got all eight. */}
      {moduleEntry ? (
        <Card
          className={
            moduleEntry.complete ? 'border-verdict-correct/25 bg-verdict-correct-wash' : undefined
          }
        >
          <p className="eyebrow mb-2">{moduleEntry.module.name}</p>
          {moduleEntry.complete ? (
            <p className="text-sm">
              <strong>Module complete.</strong> Every question in it has now been answered
              correctly at least once, and the date is recorded.
            </p>
          ) : (
            (() => {
              const left = moduleEntry.total - moduleEntry.correctOnce;
              const missed = moduleEntry.answered - moduleEntry.correctOnce;
              return (
                <p className="text-sm">
                  <strong>
                    {moduleEntry.correctOnce} of the {moduleEntry.total} questions in this module
                    done.
                  </strong>{' '}
                  Each sitting asks up to eight, so {left === 1 ? 'one is' : `${left} are`} still
                  to come
                  {missed > 0
                    ? `, including ${missed === 1 ? 'one' : missed} you have tried but not yet got right`
                    : ''}
                  . Carry on to finish the module; it only asks the ones left.
                </p>
              );
            })()
          )}
        </Card>
      ) : null}

      {milestone ? (
        <Card className="border-verdict-correct/25 bg-verdict-correct-wash">
          <p className="eyebrow mb-2 text-verdict-correct">
            {milestone} days in a row
          </p>
          <p className="text-sm">{streakMilestoneLine(milestone)}</p>
        </Card>
      ) : null}

      {leveledUp && overview ? (
        <LevelUp
          level={overview.level.level}
          name={overview.level.name}
          blurb={overview.level.blurb}
        />
      ) : null}

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

      {overview?.level.xpForNextLevel && !leveledUp ? (
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm">
              <strong className="font-serif text-lg">{overview.level.xpForNextLevel}</strong>
              <span className="text-slate"> XP to {overview.level.nextLevelName}</span>
            </p>
            <p className="text-xs text-muted tabular-nums">
              {overview.level.progressPercent}% through {overview.level.name}
            </p>
          </div>
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paper-sunk"
            role="progressbar"
            aria-valuenow={overview.level.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress towards ${overview.level.nextLevelName}`}
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max(overview.level.progressPercent, 2)}%` }}
            />
          </div>
        </Card>
      ) : null}

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
        {moduleEntry && !moduleEntry.complete ? (
          <ButtonLink href={`/modules/${moduleEntry.module.slug}`} size="lg" variant="accent">
            Carry on with the module
          </ButtonLink>
        ) : null}
        <ButtonLink
          href="/dashboard"
          size="lg"
          variant={moduleEntry && !moduleEntry.complete ? 'outline' : 'accent'}
        >
          Back to today
        </ButtonLink>
        {moduleEntry && !moduleEntry.complete ? null : (
          <ButtonLink href="/skills" size="lg" variant="outline">
            See your skill map
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
