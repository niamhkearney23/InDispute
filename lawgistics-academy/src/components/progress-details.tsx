import { Card, Pill, SectionHeading } from '@/components/ui';
import { FlameIcon, LevelIcon, RepeatIcon, SparkIcon } from '@/components/icons';
import { StreakCalendar } from '@/components/streak-calendar';
import { LeaderboardCard } from '@/components/leaderboard-card';
import { TOP_LEVEL_NAME } from '@/lib/learning/progression';
import type { getLearnerOverview } from '@/lib/learner-overview';
import type { weeklyLeaderboard } from '@/lib/leaderboard';

type Overview = NonNullable<Awaited<ReturnType<typeof getLearnerOverview>>>;

/**
 * The longer view of how somebody is doing: the streak, the firm's
 * leaderboard, the numbers, the level, what is due for review and what is
 * mastered. (Scores by area are Progress's own.) It used to sit under Today's training; since
 * Today became the coach's note and the day's homework (October 2026) it
 * lives on Progress, unchanged.
 */
export function ProgressDetails({
  overview,
  timezone,
  leaderboard,
  open,
}: {
  overview: Overview;
  timezone: string;
  leaderboard: Awaited<ReturnType<typeof weeklyLeaderboard>>;
  /** Questions are published for this person's country. */
  open: boolean;
}) {
  const { level } = overview;
  const profile = { timezone };
  return (
    <div className="space-y-8">
      <Card>
        <CardLabel icon={<FlameIcon className="size-4" />} tone="amber">
          Your streak
        </CardLabel>
        <StreakCalendar
          trainedDays={overview.trainedDays}
          timezone={profile.timezone}
          streak={overview.currentStreak}
        />
      </Card>

      {leaderboard ? <LeaderboardCard rows={leaderboard} /> : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<LevelIcon className="size-5" />}
          tone="accent"
          label="Current level"
          value={level.level}
          hint={`${level.name}, game level`}
        />
        <StatTile
          icon={<FlameIcon className="size-5" />}
          tone="amber"
          label="Longest streak"
          value={overview.longestStreak}
          hint={overview.longestStreak > 0 ? 'days, your record' : 'no streak yet'}
        />
        <StatTile
          icon={<SparkIcon className="size-5" />}
          tone="green"
          label="XP this week"
          value={overview.weeklyXp}
          hint={`${overview.totalXp} total`}
        />
        <StatTile
          icon={<RepeatIcon className="size-5" />}
          tone="slate"
          label="Due for review"
          value={overview.dueCount}
          hint={overview.dueCount === 0 ? 'nothing outstanding' : 'concepts'}
        />
      </section>

      <section className="rounded-lg border border-rule bg-paper-raised p-5 shadow-card">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <p className="eyebrow">Progress to {level.nextLevelName ?? 'the top'}</p>
          <p className="text-xs text-muted">
            {level.xpForNextLevel !== null
              ? `${level.xpForNextLevel} XP to go`
              : TOP_LEVEL_NAME}
          </p>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-paper-sunk"
          role="meter"
          aria-valuenow={level.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress within level ${level.level}`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-soft transition-all duration-500"
            style={{ width: `${Math.max(level.progressPercent, 2)}%` }}
          />
        </div>
        {/* The level's own line. It is the one place in the app allowed to be
            funny, and it is what makes a progress bar feel like it is worth
            filling rather than a number going up. */}
        <p className="mt-2 text-sm text-slate">{level.blurb}</p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <Card>
          <SectionHeading title="Needs review" />
          {overview.needsReview.length === 0 ? (
            <p className="text-sm text-slate">
              {open
                ? 'Nothing is due right now. New concepts will keep appearing in your daily training.'
                : 'Nothing is due right now.'}
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

    </div>
  );
}

const TONES = {
  accent: 'bg-accent-wash text-accent',
  amber: 'bg-warn-wash text-warn',
  green: 'bg-verdict-correct-wash text-verdict-correct',
  slate: 'bg-paper-sunk text-slate',
} as const;

/** A card's label, with a small coloured badge so each card reads at a glance. */
function CardLabel({
  icon,
  tone = 'accent',
  children,
}: {
  icon: React.ReactNode;
  tone?: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className={`grid size-8 place-items-center rounded-lg ${TONES[tone]}`}>{icon}</span>
      <p className="eyebrow">{children}</p>
    </div>
  );
}

/** One number, with its icon, its name and a line of context. */
function StatTile({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-rule bg-paper-raised p-4 shadow-card transition-transform hover:-translate-y-px">
      <span className={`mb-3 grid size-9 place-items-center rounded-lg ${TONES[tone]}`}>{icon}</span>
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-serif text-3xl leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 text-xs text-muted">{hint}</p>
    </div>
  );
}
