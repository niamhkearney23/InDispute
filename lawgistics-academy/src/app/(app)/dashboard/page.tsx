import Link from 'next/link';
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
import { leadSession, seesTraineeVideos, sessionsForLearner } from '@/lib/lessons/sessions';
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
import { trainingOpen } from '@/lib/training/service';
import { DailyBrief } from '@/components/daily-brief';
import { getFactOfTheDay } from '@/lib/facts/service';
import { brand } from '@/lib/brand';
import { PROGRAMME } from '@/content/programme';
import { PROGRAMME_WEEKS, weekOfDay } from '@/content/programme-plan';
import { programmeDay } from '@/content/programme-days';
import { conceptForDay } from '@/content/programme-concepts';
import { StreakCalendar } from '@/components/streak-calendar';
import { QuestCard } from '@/components/quest-card';
import { mattersForLearner } from '@/lib/matters/service';
import { MATTERS_FOR_CERTIFICATE, matterLabel } from '@/lib/matters/rules';
import { CountUp } from '@/components/count-up';
import { LeaderboardCard } from '@/components/leaderboard-card';
import { weeklyLeaderboard } from '@/lib/leaderboard';
import { requireAccess } from '@/lib/access/service';

export const metadata: Metadata = { title: 'Today' };


export default async function DashboardPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const overview = await getLearnerOverview(user.id);
  if (!overview) redirect('/login');
  if (!overview.profile.onboardedAt) redirect('/onboarding');

  // Only sent to the diagnostic when there are questions to sit it with.
  // Without them it cannot be finished, and redirecting there would hold a
  // new learner on a page they cannot get past, with their homework, work
  // and coach's sessions all waiting on the other side of it.
  const open = await trainingOpen(overview.profile.country);
  if (open && !overview.profile.diagnosticCompletedAt) redirect('/diagnostic');
  const staff = overview.profile.isAdmin || overview.profile.isCoach;
  const countryName = overview.profile.country === 'MY' ? 'Malaysia' : 'Australia';

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
    leaderboard,
    diagnosticSittings,
    homeworkRows,
    matters,
  ] =
    await Promise.all([
      getFactOfTheDay(profile.timezone, profile.country),
      outstandingRequired(user.id, profile.country),
      outstandingFirmModules(user.id, profile.country),
      beforeYouBegin(user.id, profile.country),
      sessionsForLearner(profile.country, seesTraineeVideos(profile)),
      workBoardFor(user.id),
      weeklyLeaderboard(),
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
      mattersForLearner(user.id),
    ]);

  const sittingCount = diagnosticSittings.data?.length ?? 0;
  const assignedTopicSlug = diagnosticSittings.data?.[0]?.essay_topic_slug as string | undefined;
  const assignedTopic = assignedTopicSlug ? essayTopic(assignedTopicSlug) : undefined;

  const homework = homeworkDay(profile.startsOn, profile.endsOn, profile.timezone);
  // Today's entry in the day plan, for the programme strip. Null outside a working day.
  const todayPlan = homework.state === 'day' ? programmeDay(homework.day) : null;
  // Which week of the month it is, for the programme strip. Null outside it.
  const programmeWeek =
    homework.state === 'day'
      ? weekOfDay(homework.day)
      : homework.state === 'weekend'
        ? weekOfDay(homework.nextDay)
        : null;
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
      {profile.track === 'litigation_trainee' && !profile.traineeConfirmed ? (
        <Notice>
          <strong>Waiting for your supervisor.</strong> They need to confirm you are on the
          trainee programme before the work posted for trainees appears. Everything else here
          works now.
        </Notice>
      ) : null}

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

      {/* With the number, always. "You have not finished it" to somebody who
          answered the module yesterday reads as the app losing their work;
          "6 of 8" says what is actually left. */}
      {outstanding.length > 0 ? (
        <div className="space-y-3">
          {outstanding.slice(0, 2).map((entry) => (
            <QuestCard
              key={entry.module.slug}
              slug={entry.module.slug}
              name={entry.module.name}
              correctOnce={entry.correctOnce}
              total={entry.total}
            />
          ))}
          {outstanding.length > 2 ? (
            <p className="text-sm text-slate">
              And {outstanding.length - 2} more.{' '}
              <InlineLink href="/modules">Open modules</InlineLink>
            </p>
          ) : null}
        </div>
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
          <p className="mt-2 text-lg text-paper/80">
            {overview.currentStreak > 0 && !goalMet
              ? `${overview.currentStreak} ${overview.currentStreak === 1 ? 'day' : 'days'} in a row. Today keeps it alive.`
              : goalMet
                ? 'Done for today. Your streak is safe.'
                : 'Ready to train like a lawyer?'}
          </p>

          {/* The stakes, beside the button that answers them: the chain, the
              level and how close the next one is, and what this week has
              earned. Everything here is also further down the page; up here
              it is the reason to press Begin. */}
          <ul className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <li className="rise-in rounded-lg bg-black/15 px-3 py-3 ring-1 ring-white/10 sm:px-4">
              <p className="flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-paper/70 uppercase">
                <FlameIcon className={overview.currentStreak > 0 ? 'flame-live size-3.5 text-amber-300' : 'size-3.5 opacity-60'} />
                Streak
              </p>
              <p className="mt-1 font-serif text-2xl leading-none tabular-nums sm:text-3xl">
                <CountUp value={overview.currentStreak} />
                <span className="ml-1 font-sans text-xs text-paper/70">
                  {overview.currentStreak === 1 ? 'day' : 'days'}
                </span>
              </p>
            </li>
            <li className="rise-in rounded-lg bg-black/15 px-3 py-3 ring-1 ring-white/10 [animation-delay:60ms] sm:px-4">
              <p className="flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-paper/70 uppercase">
                <LevelIcon className="size-3.5 text-amber-300" />
                Level
              </p>
              <p className="mt-1 flex items-baseline gap-2 font-serif leading-none">
                <span className="text-2xl tabular-nums sm:text-3xl">{level.level}</span>
                <span className="hidden truncate text-sm text-paper/80 sm:inline">{level.name}</span>
              </p>
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15"
                role="meter"
                aria-valuenow={level.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${level.progressPercent}% of the way to ${level.nextLevelName ?? 'the top'}`}
              >
                <div
                  className="bar-grow h-full rounded-full bg-amber-300"
                  style={{ width: `${Math.max(level.progressPercent, 3)}%` }}
                />
              </div>
            </li>
            <li className="rise-in rounded-lg bg-black/15 px-3 py-3 ring-1 ring-white/10 [animation-delay:120ms] sm:px-4">
              <p className="flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-paper/70 uppercase">
                <SparkIcon className="size-3.5 text-amber-300" />
                <span className="sm:hidden">Week</span>
                <span className="hidden sm:inline">This week</span>
              </p>
              <p className="mt-1 font-serif text-2xl leading-none tabular-nums sm:text-3xl">
                <CountUp value={overview.weeklyXp} />
                <span className="ml-1 font-sans text-xs text-paper/70">XP</span>
              </p>
            </li>
          </ul>

          {!open ? (
            <div className="mt-7 rounded-lg bg-black/15 p-4 ring-1 ring-white/10 sm:p-5">
              <p className="mb-1.5 text-[0.6875rem] font-semibold tracking-[0.16em] text-paper/70 uppercase">
                Today’s training
              </p>
              <p className="font-serif text-2xl leading-snug sm:text-3xl">
                The questions are not open yet.
              </p>
              <p className="mt-2 text-sm text-paper/80">
                {profile.isAdmin
                  ? `No ${countryName === 'Malaysia' ? 'Malaysian' : 'Australian'} questions are published yet. Sign off the ones you are sure of, then press “Publish everything signed off”, and daily training opens for everyone in ${countryName}.`
                  : profile.isCoach
                    ? `No ${countryName === 'Malaysia' ? 'Malaysian' : 'Australian'} questions are published yet. Sign off the ones you are sure of, and training opens for everyone in ${countryName} once an administrator publishes them.`
                    : `${profile.country === 'MY' ? 'Malaysian questions are published only once a lawyer has signed them off, and none have been yet.' : 'No questions have been published yet.'}${
                        profile.startsOn
                          ? ' Your homework and anything your coach has posted are below.'
                          : ' Anything your coach posts for you will appear below, and your homework starts once your supervisor sets your start date.'
                      }`}
              </p>
              {staff ? (
                <div className="mt-4">
                  <ButtonLink href="/admin/review" variant="light" size="lg">
                    Check the questions
                  </ButtonLink>
                </div>
              ) : null}
            </div>
          ) : (
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
                      : `About ${profile.dailyGoalMinutes} minutes${
                          level.xpForNextLevel !== null
                            ? `, ${level.xpForNextLevel} XP to ${level.nextLevelName}`
                            : ''
                        }`}
                  </p>
                  {focusAreas.length > 0 && !goalMet ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Today's focus">
                      {focusAreas.map((f) => (
                        <li
                          key={f.slug}
                          className="rounded-full bg-paper/12 px-2.5 py-0.5 text-xs font-medium text-paper ring-1 ring-paper/20"
                        >
                          {f.name}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {/* A target that moves with them. Yesterday's count is the
                      one number they already beat once, so it reads as a
                      dare rather than a demand. */}
                  {!goalMet &&
                  overview.answeredYesterday > 0 &&
                  overview.answeredToday <= overview.answeredYesterday ? (
                    <p className="mt-2 inline-block rounded-full bg-paper/15 px-2.5 py-1 text-xs font-semibold text-paper ring-1 ring-paper/25">
                      Beat yesterday: {overview.answeredYesterday} answered
                      {overview.answeredToday > 0 ? `, ${overview.answeredToday} so far` : ''}
                    </p>
                  ) : null}
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
          )}
        </div>
      </AccentSurface>

      {/* The programme, for the people on it: where the month is up to, today's
          concept when there is one, and the six places its work lives, as
          equal tiles rather than a pile of buttons. Below the greeting, so
          the page opens on the person and then the plan. */}
      {profile.track === 'litigation_trainee' ? (
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="eyebrow">Your programme · {brand.firm}</p>
            <p className="text-sm text-slate tabular-nums">
              {homework.state === 'day'
                ? `Day ${homework.day} of 20 · Week ${weekOfDay(homework.day)} of 4`
                : homework.state === 'weekend'
                  ? `Week ${weekOfDay(homework.nextDay)} of 4`
                  : homework.state === 'before'
                    ? `Starts ${longDate(profile.startsOn!)}`
                    : homework.state === 'finished'
                      ? 'Finished'
                      : 'Start date not set yet'}
            </p>
          </div>
          <h2 className="mt-2 text-2xl">
            {programmeWeek
              ? PROGRAMME_WEEKS[programmeWeek - 1].title
              : `${PROGRAMME.length}, ${PROGRAMME.days}, on one training file`}
          </h2>
          {todayPlan ? (
            <div className="mt-4 rounded-md border border-rule bg-paper-sunk px-4 py-3">
              <p className="eyebrow">Today&rsquo;s concept</p>
              <p className="mt-0.5 font-serif text-lg leading-snug">
                {conceptForDay(todayPlan.day)?.concept ?? todayPlan.title}
              </p>
              <p className="mt-1 text-sm">
                <span className="text-muted">Morning:</span> {todayPlan.morning}
              </p>
              <p className="text-sm">
                <span className="text-muted">Afternoon:</span> {todayPlan.afternoon}
              </p>
              {todayPlan.due.length > 0 ? (
                <p className="mt-1 text-sm font-medium">
                  Due today: {todayPlan.due.map((n) => `box ${n}`).join(' and ')}. Hand it in on the work board.
                </p>
              ) : null}
            </div>
          ) : null}
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(
              [
                ['The month', 'Week by week', '/programme'],
                ['The training file', 'The one case you work on', '/programme/file'],
                ['Homework', 'One task a day', '/homework'],
                ['Work board', 'From your supervisors', '/work'],
                ['Sessions', 'Your coach\u2019s videos', '/sessions'],
                ['Certificate', 'What earns it', '/certificate'],
              ] as const
            ).map(([label, hint, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex h-full min-h-16 flex-col justify-center rounded-md border border-rule bg-paper-sunk px-3 py-2.5 transition-colors hover:border-rule-strong hover:bg-paper-raised"
                >
                  <span className="font-medium leading-snug">{label}</span>
                  <span className="text-xs text-slate">{hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {matters.length > 0 ? (() => {
        const open = matters.find((m) => m.latest?.stage === 'working');
        const next = open ?? matters.find((m) => !m.latest) ?? null;
        const good = Math.min(matters.filter((m) => m.everGood).length, MATTERS_FOR_CERTIFICATE);
        return (
          <Card>
            <CardLabel icon={<BriefcaseIcon className="size-4" />}>Matters</CardLabel>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                {next ? (
                  <>
                    <p className="font-mono text-xs font-semibold text-accent">
                      {matterLabel(next.matter.number)}
                    </p>
                    <p className="font-serif text-2xl leading-snug">{next.matter.title}</p>
                    <p className="mt-1 text-sm text-slate">
                      {open ? 'You have this one open, and the clock is running.' : 'The problem first, then how a lawyer would do it.'}
                    </p>
                  </>
                ) : (
                  <p className="text-slate">You have tried every matter that is up. New ones appear here.</p>
                )}
                <p className="mt-3 text-xs text-muted">
                  {good} of {MATTERS_FOR_CERTIFICATE} marked Good towards your{' '}
                  <Link href="/certificate" className="-my-2 inline-block py-2 text-accent underline underline-offset-2">
                    certificate
                  </Link>
                  .
                </p>
              </div>
              <ButtonLink href={next ? `/matters/${next.matter.id}` : '/matters'} variant="accent">
                {open ? 'Carry on' : next ? 'Open the file' : 'See all matters'}
              </ButtonLink>
            </div>
          </Card>
        );
      })() : null}

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
                No homework today{homework.holiday ? ` (${homework.holiday})` : ''}. Day{' '}
                {homework.nextDay} picks up on{' '}
                {new Date(`${homework.resumesOn}T00:00:00Z`).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  timeZone: 'UTC',
                })}
                .
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
