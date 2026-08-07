import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerOverview } from '@/lib/learner-overview';
import { masteryBand } from '@/lib/learning/mastery';
import { QUESTIONS_PER_MINUTE_GOAL } from '@/lib/learning/config';
import {
  ButtonLink,
  Card,
  Pill,
  ScoreBar,
  SectionHeading,
  Stat,
} from '@/components/ui';
import { BeginSessionButton } from '../begin-session-button';
import { DailyBrief } from '@/components/daily-brief';
import { getFactOfTheDay } from '@/lib/facts/service';

export const metadata: Metadata = { title: 'Today' };

function greeting(date: Date, timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-AU', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(date),
  );
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const overview = await getLearnerOverview(user.id);
  if (!overview) redirect('/login');
  if (!overview.profile.onboardedAt) redirect('/onboarding');
  if (!overview.profile.diagnosticCompletedAt) redirect('/diagnostic');

  const { profile, level, skillMap } = overview;
  const fact = await getFactOfTheDay(profile.timezone);
  const questionCount =
    QUESTIONS_PER_MINUTE_GOAL[profile.dailyGoalMinutes] ?? QUESTIONS_PER_MINUTE_GOAL[10];

  const focusAreas = [...skillMap]
    .filter((entry) => entry.attempts > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">
          {greeting(new Date(), profile.timezone)}
          {profile.displayName ? `, ${profile.displayName}` : ''}
        </p>
        <h1 className="text-3xl sm:text-4xl">Ready to train like a lawyer?</h1>
      </section>

      <Card className="border-ink/15 bg-paper-raised">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2">Today’s training</p>
            <p className="font-serif text-3xl leading-none">
              {questionCount} questions
            </p>
            <p className="mt-2 text-sm text-slate">
              About {profile.dailyGoalMinutes} minutes
              {focusAreas.length > 0
                ? ` · Focus: ${focusAreas.map((f) => f.name).join(', ')}`
                : ''}
            </p>
          </div>
          <BeginSessionButton kind="daily" label="Begin training" />
        </div>
      </Card>

      {fact ? <DailyBrief fact={fact} /> : null}

      <section className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Stat
          label="Current level"
          value={level.level}
          hint={`${level.name}, game level`}
        />
        <Stat
          label="Streak"
          value={overview.currentStreak}
          hint={
            overview.currentStreak > 0
              ? `day${overview.currentStreak === 1 ? '' : 's'} in a row`
              : 'train today to start one'
          }
        />
        <Stat label="XP this week" value={overview.weeklyXp} hint={`${overview.totalXp} total`} />
        <Stat
          label="Due for review"
          value={overview.dueCount}
          hint={overview.dueCount === 0 ? 'nothing outstanding' : 'concepts'}
        />
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="eyebrow">Progress to {level.nextLevelName ?? 'the top'}</p>
          <p className="text-xs text-muted">
            {level.xpForNextLevel !== null
              ? `${level.xpForNextLevel} XP to go`
              : 'Master Litigator'}
          </p>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-paper-sunk"
          role="meter"
          aria-valuenow={level.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress within level ${level.level}`}
        >
          <div
            className="h-full rounded-full bg-burgundy transition-all duration-500"
            style={{ width: `${Math.max(level.progressPercent, 2)}%` }}
          />
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <Card>
          <SectionHeading title="Needs review" />
          {overview.needsReview.length === 0 ? (
            <p className="text-sm text-slate">
              Nothing is due right now. New concepts will keep appearing in your daily
              training.
            </p>
          ) : (
            <ul className="space-y-2">
              {overview.needsReview.map((name) => (
                <li key={name} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{name}</span>
                  <Pill tone="accent">Due</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeading title="Recently mastered" />
          {overview.recentlyMastered.length === 0 ? (
            <p className="text-sm text-slate">
              Nothing yet. A concept counts as mastered once you have answered it
              correctly and consistently.
            </p>
          ) : (
            <ul className="space-y-2">
              {overview.recentlyMastered.map((name) => (
                <li key={name} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{name}</span>
                  <Pill tone="correct">Strong</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <SectionHeading
          title="Skill map"
          action={
            <ButtonLink href="/skills" variant="ghost" size="sm">
              See detail
            </ButtonLink>
          }
        />
        <Card>
          <div className="divide-y divide-rule">
            {skillMap.map((entry) => (
              <ScoreBar
                key={entry.slug}
                label={entry.name}
                score={entry.score}
                band={masteryBand(entry.score)}
                sublabel={
                  entry.attempts === 0
                    ? 'Not yet assessed'
                    : `${entry.attempts} answer${entry.attempts === 1 ? '' : 's'}`
                }
              />
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
