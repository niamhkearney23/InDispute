import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { getLearnerOverview } from '@/lib/learner-overview';
import { masteryBand } from '@/lib/learning/mastery';
import { outstandingRequired } from '@/lib/modules/service';
import { outstandingFirmModules } from '@/lib/firm/service';
import { beforeYouBegin } from '@/lib/onboarding/service';
import { greeting, greetingName } from '@/lib/greeting';
import { longDate } from '@/lib/onboarding/rules';
import { essayTopic } from '@/content/seed/essay-topics';
import { homeworkForDay } from '@/content/seed/homework';
import { homeworkDay, lastArrivedDay } from '@/lib/homework/rules';
import { HomeworkForm } from '../homework-form';
import { QUESTIONS_PER_MINUTE_GOAL } from '@/lib/learning/config';
import { TOP_LEVEL_NAME } from '@/lib/learning/progression';
import { GoalRing } from '@/components/goal-ring';
import { AccentSurface } from '@/components/accent-surface';
import {
  BookIcon,
  BriefcaseIcon,
  CalendarIcon,
  FlameIcon,
  LevelIcon,
  RepeatIcon,
  SparkIcon,
} from '@/components/icons';
import { SessionCard } from '@/components/session-card';
import { leadSession, sessionsForLearner } from '@/lib/lessons/sessions';
import { isFull, postsForSession, workBoardFor } from '@/lib/work/service';
import {
  ButtonLink,
  Card,
  Notice,
  Pill,
  ScoreBar,
  SectionHeading,
  InlineLink,
} from '@/components/ui';
import { BeginSessionButton } from '../begin-session-button';
import { DailyBrief } from '@/components/daily-brief';
import { getFactOfTheDay } from '@/lib/facts/service';

export const metadata: Metadata = { title: 'Today' };


export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const overview = await getLearnerOverview(user.id);
  if (!overview) redirect('/login');
  if (!overview.profile.onboardedAt) redirect('/onboarding');
  if (!overview.profile.diagnosticCompletedAt) redirect('/diagnostic');

  const { profile, level, skillMap } = overview;
  const hasPlacement = Boolean(profile.startsOn || profile.endsOn);
  const supabase = await createSupabaseServerClient();
  const [
    fact,
    outstanding,
    firmOutstanding,
    joining,
    sessions,
    work,
    diagnosticSittings,
    homeworkRows,
  ] =
    await Promise.all([
      getFactOfTheDay(profile.timezone, profile.country),
      outstandingRequired(user.id, profile.country),
      outstandingFirmModules(user.id, profile.country),
      beforeYouBegin(user.id, profile.country),
      sessionsForLearner(profile.country),
      workBoardFor(user.id),
      hasPlacement
        ? supabase
            .from('diagnostic_results')
            .select('essay_topic_slug, completed_at')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: true })
        : Promise.resolve({ data: null }),
      profile.startsOn
        ? supabase.from('homework_declarations').select('day').eq('user_id', user.id)
        : Promise.resolve({ data: null }),
    ]);

  const sittingCount = diagnosticSittings.data?.length ?? 0;
  const assignedTopicSlug = diagnosticSittings.data?.[0]?.essay_topic_slug as string | undefined;
  const assignedTopic = assignedTopicSlug ? essayTopic(assignedTopicSlug) : undefined;

  const homework = homeworkDay(profile.startsOn, profile.endsOn, profile.timezone);
  const declaredDays = new Set((homeworkRows.data ?? []).map((r) => r.day as number));
  // Today's own day is offered its own button below, not counted as "earlier".
  const lastEarlierDay = homework.state === 'day' ? homework.day - 1 : lastArrivedDay(homework);
  const missedDays = [...Array(lastEarlierDay).keys()]
    .map((i) => i + 1)
    .filter((d) => !declaredDays.has(d)).length;

  /* Today in the learner's own timezone, not the server's. A coach in Kuala
     Lumpur dating a session for Tuesday means Tuesday there, and a session
     appearing a few hours early would give away the wrong morning's work. */
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: profile.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const lead = leadSession(sessions, today);
  const leadMaterials = lead ? await postsForSession(lead.id) : [];

  // The board, in three numbers. Only drawn when there is something on it
  // for this person, so a learner nobody has posted work for never sees an
  // empty card about it.
  const workTasks = work.filter((w) => w.post.kind === 'task');
  const workYours = workTasks.filter((w) => w.claimed && w.state !== 'good').length;
  const workOpen = workTasks.filter(
    (w) => !w.claimed && w.post.published && !isFull(w.post, w.claims),
  ).length;
  const workAgain = workTasks.filter((w) => w.state === 'again').length;
  const workReplies = work.filter((w) => w.replyWaiting).length;

  // The pre-start checklist supersedes the bare "you have not read the policy"
  // notice, because a reading step is already one line on it. Showing both
  // would put the same document in front of somebody twice and make the shorter
  // notice look like a second, different thing they had missed.
  const hasChecklist = joining.steps.length > 0;
  const questionCount =
    QUESTIONS_PER_MINUTE_GOAL[profile.dailyGoalMinutes] ?? QUESTIONS_PER_MINUTE_GOAL[10];
  const goalMet = overview.answeredToday >= questionCount;

  const focusAreas = [...skillMap]
    .filter((entry) => entry.attempts > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Above the training prompt, and its own notice rather than folded into
          the count below it. An unread firm policy is not one more module
          outstanding, it is the firm's own rules not yet in front of the person
          they apply to. */}
      {hasChecklist ? (
        joining.outstanding.length > 0 ? (
          <Notice tone="warn">
            <strong>
              {joining.outstanding.length === 1
                ? 'There is 1 thing to do before you begin.'
                : `There are ${joining.outstanding.length} things to do before you begin.`}
            </strong>{' '}
            <InlineLink href="/start">Open your list</InlineLink>
          </Notice>
        ) : !joining.cleared ? (
          <Notice>
            <strong>You have done everything on your list.</strong> Somebody at the firm still
            has to look over it. <InlineLink href="/start">See your list</InlineLink>
          </Notice>
        ) : null
      ) : firmOutstanding.length > 0 ? (
        <Notice tone="warn">
          <strong>
            {firmOutstanding.length === 1
              ? `The firm asks you to read "${firmOutstanding[0].name}" before you start.`
              : `The firm asks you to read ${firmOutstanding.length} things before you start.`}
          </strong>{' '}
          <InlineLink
            href={
              firmOutstanding.length === 1
                ? `/modules/firm/${firmOutstanding[0].slug}`
                : '/modules'
            }
          >
            {firmOutstanding.length === 1 ? 'Read it' : 'Open modules'}
          </InlineLink>
        </Notice>
      ) : null}

      {outstanding.length > 0 ? (
        <Notice tone="warn">
          <strong>
            {outstanding.length === 1
              ? `"${outstanding[0].module.name}" is required and you have not finished it.`
              : `${outstanding.length} required modules are outstanding.`}
          </strong>{' '}
          <InlineLink href="/modules">Open modules</InlineLink>
        </Notice>
      ) : null}

      {/* The greeting and today's training, together, on the accent: the
          one thing on the page with a time on it, spoken to by name. Being
          greeted is most of what makes this feel like somewhere somebody is
          expected, and the button is where their thumb should go next. */}
      <AccentSurface as="section" className="rounded-xl shadow-raised">
        <div className="px-6 py-7 sm:px-9 sm:py-9">
          <h1 className="text-[2rem] leading-tight sm:text-5xl">
            {greeting(new Date(), profile.timezone)}
            {greetingName(profile.displayName) ? `, ${greetingName(profile.displayName)}` : ''}.
          </h1>
          <p className="mt-2 text-lg text-paper/80">Ready to train like a lawyer?</p>

          <div className="mt-7 flex flex-col gap-5 rounded-lg bg-black/15 p-4 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-5">
              <GoalRing done={overview.answeredToday} goal={questionCount} light />
              <div>
                <p className="mb-1.5 text-[0.6875rem] font-semibold tracking-[0.16em] text-paper/70 uppercase">
                  Today’s training
                </p>
                <p className="font-serif text-3xl leading-none">
                  {goalMet
                    ? 'Done for today'
                    : overview.answeredToday > 0
                      ? `${Math.max(questionCount - overview.answeredToday, 0)} to go`
                      : `${questionCount} questions`}
                </p>
                <p className="mt-2 text-sm text-paper/75">
                  {goalMet
                    ? 'Anything more today is a bonus, and it still counts.'
                    : `About ${profile.dailyGoalMinutes} minutes`}
                  {focusAreas.length > 0 && !goalMet
                    ? ` · Focus: ${focusAreas.map((f) => f.name).join(', ')}`
                    : ''}
                </p>
              </div>
            </div>
            <BeginSessionButton
              kind="daily"
              variant="light"
              label={
                goalMet
                  ? 'Train again'
                  : overview.answeredToday > 0
                    ? 'Keep going'
                    : 'Begin training'
              }
            />
          </div>
        </div>
      </AccentSurface>

      {hasPlacement ? (
        <Card>
          <CardLabel icon={<CalendarIcon className="size-4" />} tone="slate">
            Your placement
          </CardLabel>
          <p className="text-slate">
            {profile.startsOn ? `Begins ${longDate(profile.startsOn)}.` : ''}
            {profile.startsOn && profile.endsOn ? ' ' : ''}
            {profile.endsOn ? `Ends ${longDate(profile.endsOn)}.` : ''}
          </p>
          {assignedTopic ? (
            <p className="mt-3 text-sm text-slate">
              <strong>Your comparison essay:</strong> {assignedTopic.prompt}
            </p>
          ) : null}
          {sittingCount >= 2 ? (
            <div className="mt-4">
              <ButtonLink href="/diagnostic/compare" variant="outline" size="sm">
                See your day one against your latest
              </ButtonLink>
            </div>
          ) : null}
        </Card>
      ) : null}

      {profile.startsOn ? (
        <Card>
          {homework.state === 'before' ? (
            <>
              <CardLabel icon={<BookIcon className="size-4" />}>Homework</CardLabel>
              <p className="text-slate">
                Your homework begins on {longDate(profile.startsOn)}. Twenty tasks, one for
                each working day.
              </p>
            </>
          ) : homework.state === 'weekend' ? (
            <>
              <CardLabel icon={<BookIcon className="size-4" />}>Homework</CardLabel>
              <p className="text-slate">
                No homework today. Day {homework.nextDay} picks up on Monday.
              </p>
            </>
          ) : homework.state === 'finished' ? (
            <>
              <CardLabel icon={<BookIcon className="size-4" />}>Homework</CardLabel>
              <p className="text-slate">You finished the four weeks.</p>
              <p className="mt-2 text-sm text-slate">{declaredDays.size} of 20 recorded.</p>
            </>
          ) : homework.state === 'day' ? (
            (() => {
              const task = homeworkForDay(homework.day);
              const done = declaredDays.has(homework.day);
              return (
                <>
                  <CardLabel icon={<BookIcon className="size-4" />}>
                    Homework, day {homework.day} of 20
                  </CardLabel>
                  {task ? (
                    <>
                      <p className="font-serif text-xl leading-snug">{task.title}</p>
                      <p className="mt-2 text-slate">{task.task}</p>
                      <p className="mt-2 text-sm text-muted">{task.why}</p>
                    </>
                  ) : null}
                  {done ? (
                    <div className="mt-4 flex items-center gap-2">
                      <Pill tone="correct">Done</Pill>
                    </div>
                  ) : (
                    <HomeworkForm day={homework.day} />
                  )}
                </>
              );
            })()
          ) : null}
          {missedDays > 0 ? (
            <p className="mt-3 text-sm text-slate">
              {missedDays} earlier {missedDays === 1 ? 'day is' : 'days are'} not ticked off.{' '}
              <InlineLink href="/homework">Catch up</InlineLink>
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">
              <InlineLink href="/homework">See all twenty</InlineLink>
            </p>
          )}
        </Card>
      ) : null}

      {/* The coach's own session comes before the daily brief and before the
          stats. The training runs seven to eight and this is the thing with a
          time on it; the questions will still be there at nine. */}
      {lead ? (
        <SessionCard session={lead} more={sessions.length - 1} materials={leadMaterials} />
      ) : null}

      {work.length > 0 ? (
        <Card>
          <CardLabel icon={<BriefcaseIcon className="size-4" />} tone="green">
            Work from your coach
          </CardLabel>
          {workAgain > 0 ? (
            <p className="text-slate">
              {workAgain === 1 ? 'One piece' : `${workAgain} pieces`} of your work{' '}
              {workAgain === 1 ? 'needs' : 'need'} another go. Your coach has said why.
            </p>
          ) : workYours > 0 ? (
            <p className="text-slate">
              {workYours === 1 ? 'One piece' : `${workYours} pieces`} of work with your name on{' '}
              {workYours === 1 ? 'it' : 'them'}.
              {workOpen > 0 ? ` ${workOpen} more open.` : ''}
            </p>
          ) : workOpen > 0 ? (
            <p className="text-slate">
              {workOpen === 1 ? 'One piece' : `${workOpen} pieces`} of work open. Put your name
              on one.
            </p>
          ) : (
            <p className="text-slate">Nothing waiting on you.</p>
          )}
          {workReplies > 0 ? (
            <p className="mt-2 text-sm text-slate">
              Your coach has replied on {workReplies === 1 ? 'one piece' : `${workReplies} pieces`}{' '}
              of work.
            </p>
          ) : null}
          <p className="mt-3 text-sm text-muted">
            <InlineLink href="/work">Open the board</InlineLink>
          </p>
        </Card>
      ) : null}

      {fact ? <DailyBrief fact={fact} /> : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<LevelIcon className="size-5" />}
          tone="burgundy"
          label="Current level"
          value={level.level}
          hint={`${level.name}, game level`}
        />
        <StatTile
          icon={<FlameIcon className="size-5" />}
          tone="amber"
          label="Streak"
          value={overview.currentStreak}
          hint={
            overview.currentStreak > 0
              ? `day${overview.currentStreak === 1 ? '' : 's'} in a row`
              : 'train today to start one'
          }
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
            className="h-full rounded-full bg-gradient-to-r from-burgundy to-burgundy-soft transition-all duration-500"
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

const TONES = {
  burgundy: 'bg-burgundy-wash text-burgundy',
  amber: 'bg-amber-50 text-amber-700',
  green: 'bg-verdict-correct-wash text-verdict-correct',
  slate: 'bg-paper-sunk text-slate',
} as const;

/** A card's label, with a small coloured badge so each card reads at a glance. */
function CardLabel({
  icon,
  tone = 'burgundy',
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
