import Link from 'next/link';
import { Pill } from '@/components/ui';
import { StreakCalendar } from '@/components/streak-calendar';
import { TOP_LEVEL_NAME } from '@/lib/learning/progression';
import { LEVELS } from '@/lib/learning/config';
import type { getLearnerOverview } from '@/lib/learner-overview';

type Overview = NonNullable<Awaited<ReturnType<typeof getLearnerOverview>>>;

/**
 * The top of Progress: where somebody is, at a glance. The level and how far
 * to the next, then the three numbers that say how it is going: answers
 * right, the streak and this week's XP. Everything else on the page is
 * detail behind these.
 */
export function ProgressSummary({
  overview,
  overall,
  answered,
}: {
  overview: Overview;
  /** Share of every answer ever given that was right, or null before any. */
  overall: number | null;
  answered: number;
}) {
  const { level } = overview;
  return (
    <section
      aria-labelledby="at-a-glance"
      className="panel rounded-xl border border-rule bg-paper-raised p-5 shadow-card sm:p-7"
    >
      <h2 id="at-a-glance" className="sr-only">
        At a glance
      </h2>
      <p className="eyebrow">
        Level {level.level} of {LEVELS.length}
      </p>
      <p className="mt-1 font-serif text-[1.75rem] leading-tight sm:text-3xl">{level.name}</p>
      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-paper-sunk"
        role="meter"
        aria-valuenow={level.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress within level ${level.level}`}
      >
        <div
          className="h-full rounded-full bg-ice transition-all duration-500"
          style={{ width: `${Math.max(level.progressPercent, 2)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-muted">
        {level.xpForNextLevel !== null
          ? `${level.xpForNextLevel} XP to ${level.nextLevelName ?? 'the next level'}`
          : TOP_LEVEL_NAME}
      </p>

      <dl className="mt-6 grid grid-cols-3 divide-x divide-rule border-t border-rule pt-5">
        <div className="pr-3">
          <dt className="text-xs text-muted">Answers right</dt>
          <dd className="mt-1 font-serif text-[1.75rem] leading-none tabular-nums sm:text-3xl">
            {overall === null ? '–' : `${overall}%`}
          </dd>
          <dd className="mt-1.5 text-xs text-muted">
            {answered === 0 ? 'none yet' : `of ${answered} answered`}
          </dd>
        </div>
        <div className="px-3">
          <dt className="text-xs text-muted">Day streak</dt>
          <dd className="mt-1 font-serif text-[1.75rem] leading-none tabular-nums sm:text-3xl">
            {overview.currentStreak}
          </dd>
          <dd className="mt-1.5 text-xs text-muted">best {overview.longestStreak}</dd>
        </div>
        <div className="pl-3">
          <dt className="text-xs text-muted">This week</dt>
          <dd className="mt-1 font-serif text-[1.75rem] leading-none tabular-nums sm:text-3xl">
            {overview.weeklyXp}
          </dd>
          <dd className="mt-1.5 text-xs text-muted">XP · {overview.totalXp} in all</dd>
        </div>
      </dl>

      {overview.dueCount > 0 ? (
        <p className="mt-5 rounded-md bg-accent-wash px-3 py-2.5 text-sm">
          {overview.dueCount === 1 ? '1 concept is' : `${overview.dueCount} concepts are`} due for
          review. They come up in your training.{' '}
          <Link href="/dashboard" className="font-semibold text-accent underline underline-offset-2">
            Go to today
          </Link>
        </p>
      ) : null}
      <p className="mt-4 text-xs text-muted">{level.blurb}</p>
    </section>
  );
}

/** The streak as a calendar, for its own section. */
export function StreakSection({ overview, timezone }: { overview: Overview; timezone: string }) {
  return (
    <StreakCalendar trainedDays={overview.trainedDays} timezone={timezone} streak={overview.currentStreak} />
  );
}

/** What is due for review, and what is mastered, side by side on a wide screen. */
export function ReviewLists({ overview, open }: { overview: Overview; open: boolean }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <h3 className="mb-2 text-base font-semibold">Due for review</h3>
        {overview.needsReview.length === 0 ? (
          <p className="text-sm text-slate">
            {open
              ? 'Nothing is due right now. New concepts keep appearing in your daily training.'
              : 'Nothing is due right now.'}
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {overview.needsReview.map((name) => (
              <li key={name} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm">{name}</span>
                <Pill tone="accent">Due</Pill>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="mb-2 text-base font-semibold">Recently mastered</h3>
        {overview.recentlyMastered.length === 0 ? (
          <p className="text-sm text-slate">
            Nothing yet. A concept counts as mastered once you have answered it correctly and
            consistently.
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {overview.recentlyMastered.map((name) => (
              <li key={name} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm">{name}</span>
                <Pill tone="correct">Strong</Pill>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
