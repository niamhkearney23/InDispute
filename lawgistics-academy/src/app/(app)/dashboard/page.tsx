import Link from '@/components/app-link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { getLearnerOverview, getLearnerProfile } from '@/lib/learner-overview';
import { outstandingRequired } from '@/lib/modules/service';
import { outstandingFirmModules } from '@/lib/firm/service';
import { beforeYouBegin } from '@/lib/onboarding/service';
import { acceptedInvitationFor } from '@/lib/onboarding/invitations';
import { greeting, greetingName } from '@/lib/greeting';
import { homeworkForDay } from '@/content/seed/homework';
import { homeworkDay } from '@/lib/homework/rules';
import { longDate } from '@/lib/onboarding/rules';
import { DIAGNOSTIC_QUESTION_COUNT, QUESTIONS_PER_MINUTE_GOAL } from '@/lib/learning/config';
import { roundsToday } from '@/lib/training/rounds-service';
import { ROUND_SIZE, openRound } from '@/lib/training/rounds';
import { SessionCard } from '@/components/session-card';
import { leadSession, seesTraineeVideos, sessionsForLearner } from '@/lib/lessons/sessions';
import { viewerIsStaff } from '@/lib/content/service';
import { isFull, postsForSession, workBoardFor } from '@/lib/work/service';
import { ButtonLink } from '@/components/ui';
import { BeginSessionButton } from '../begin-session-button';
import { questionsPublished, trainingOpen } from '@/lib/training/service';
import { FirstTest } from '../diagnostic/first-test';
import { LEVEL_MIN_ANSWERS, SKILL_LEVELS, currentSkillLevel } from '@/lib/learning/skill-level';
import { DailyBrief } from '@/components/daily-brief';
import { speechConfigured } from '@/lib/speech/service';
import { getFactOfTheDay } from '@/lib/facts/service';
import { mattersForLearner } from '@/lib/matters/service';
import { requireAccess } from '@/lib/access/service';
import { scheduleForPerson } from '@/lib/training/cohorts';
import { morningNoteFor } from '@/lib/notes/service';
import { MorningNoteCard } from '@/components/morning-note';
import { NextTaskCard } from '@/components/next-task';
import { LearnerTour } from '@/components/learner-tour';
import { nextTask, recentlyMarkedGood } from '@/lib/homework/next-task';
import { homeworkLines, todaysHomework } from '@/lib/homework/today-list';
import { TodayList } from '@/components/today-list';
import { readingForWeek, readingWeekOf, startsAWeek } from '@/content/seed/reading';

export const metadata: Metadata = { title: 'Today' };


export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string }>;
}) {
  await requireAccess();
  // Already read by requireAccess and the layout; cached for this page view.
  const user = await getCurrentUser();
  // "Help: quick tour" in the account menu comes here with ?tour=1.
  const tourAsked = (await searchParams).tour === '1';
  if (!user) redirect('/login');

  // The profile alone decides where this person goes and what else to ask
  // for, so it comes first; the scores and streaks (the overview) are asked
  // for with everything else.
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');
  if (!profile.onboardedAt) redirect('/onboarding');
  const staff = profile.isAdmin || profile.isCoach || profile.isFirmAdmin;
  // The first visit (first-steps.ts): until the diagnostic is done, Today is
  // only the diagnostic (the owner, November 2026: "today, all it has is the
  // diagnostic, obviously"), and nothing else is read for it.
  if (!staff && !profile.diagnosticCompletedAt && (await questionsPublished(profile.country)) === true) {
    return <FirstTest />;
  }
  const countryName = profile.country === 'MY' ? 'Malaysia' : 'Australia';
  const isTrainee = profile.track === 'litigation_trainee' && profile.traineeConfirmed;

  /* Today in the learner's own timezone, not the server's. A coach in Kuala
     Lumpur dating a session for Tuesday means Tuesday there, and a session
     appearing a few hours early would give away the wrong morning's work. */
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: profile.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  // Everything below depends only on the profile, so it is asked for at
  // once rather than one thing after another: each ask is a trip to the
  // database, and in a row they were most of the wait for this page.
  // Trainee-only notes and videos for staff only with the code typed (0047).
  const sees = (staff ? viewerIsStaff(user.id) : Promise.resolve(false)).then((staffView) =>
    seesTraineeVideos(profile, staffView),
  );
  const sessionsLoad = sees.then((s) => sessionsForLearner(profile.country, s));
  const supabase = await createSupabaseServerClient();
  const [
    overview,
    open,
    invitation,
    fact,
    outstanding,
    firmOutstanding,
    joining,
    sessions,
    leadMaterials,
    work,
    homeworkRows,
    matters,
    schedule,
    rounds,
    note,
  ] = await Promise.all([
    getLearnerOverview(user.id),
    trainingOpen(profile.country),
    // Asked only of somebody it could matter for (see `supervised`).
    !staff && !profile.startsOn && profile.track !== 'litigation_trainee'
      ? acceptedInvitationFor(user.id)
      : Promise.resolve(null),
    getFactOfTheDay(profile.timezone, profile.country),
    outstandingRequired(user.id, profile.country),
    outstandingFirmModules(user.id, profile.country),
    beforeYouBegin(user.id, profile.country),
    sessionsLoad,
    sessionsLoad.then((all) => {
      const first = leadSession(all, today);
      return first ? postsForSession(first.id) : [];
    }),
    workBoardFor(user.id),
    profile.startsOn
      ? supabase.from('homework_declarations').select('day').eq('user_id', user.id)
      : Promise.resolve({ data: null }),
    mattersForLearner(user.id),
    scheduleForPerson(user.id),
    // A confirmed trainee's working morning is four rounds of ten (rounds.ts),
    // in place of the daily goal. The calendar of every morning is on Programme.
    isTrainee ? roundsToday(user.id).catch(() => null) : Promise.resolve(null),
    // The coach first, then the homework they set (0050).
    sees
      .then((s) => morningNoteFor({ country: profile.country, seesTraineeNotes: s }, today))
      .catch(() => null),
  ]);

  if (!overview) redirect('/account-problem');
  // The level in a word (skill-level.ts), from every answer by area.
  const answeredAll = overview.skillMap.reduce((sum, a) => sum + a.attempts, 0);
  const rightAll = overview.skillMap.reduce((sum, a) => sum + Math.round((a.score * a.attempts) / 100), 0);
  const skill = overview.areaScoresUnavailable ? null : currentSkillLevel(rightAll, answeredAll);

  // Somebody who has not sat the diagnostic is asked to, at the top of the
  // page, rather than sent to it. Today used to redirect them there, which
  // held a new learner on the diagnostic with their homework, the work board,
  // their coach's sessions, the list of things to do before they begin and a
  // trainee's "waiting for your supervisor" all on the other side of it. Only
  // when there are questions to sit it with: without them it cannot be done.
  const needsDiagnostic = open && !profile.diagnosticCompletedAt;
  // Somebody with a supervisor: on the trainee programme, or invited by the
  // firm. Only they are told a supervisor will set their start date, because
  // a learner on their own has nobody who will.
  const supervised =
    !open && !staff && !profile.startsOn
      ? profile.track === 'litigation_trainee' || Boolean(invitation)
      : false;

  const homework = homeworkDay(
    profile.startsOn,
    profile.endsOn,
    profile.timezone,
    new Date(),
    schedule.holidays,
  );
  const openNow = rounds ? openRound(rounds.rounds) : null;
  const declaredDays = new Set((homeworkRows.data ?? []).map((r) => r.day as number));
  // The homework lines: today's task, or what the day is when it has none,
  // and earlier days not ticked off (homeworkLines, tested on its own).
  const { note: homeworkNote, missed: missedHomework } = homeworkLines({
    startsOn: profile.startsOn,
    day: homework,
    declared: declaredDays,
    longDate,
  });
  const lead = leadSession(sessions, today);

  // Work this person took on, for the checklist.
  const workTasks = work.filter((w) => w.post.kind === 'task');

  // The pre-start checklist supersedes the bare "you have not read the policy"
  // notice, because a reading step is already one line on it. Showing both
  // would put the same document in front of somebody twice and make the shorter
  // notice look like a second, different thing they had missed.
  const hasChecklist = joining.steps.length > 0;
  const questionCount =
    QUESTIONS_PER_MINUTE_GOAL[profile.dailyGoalMinutes] ?? QUESTIONS_PER_MINUTE_GOAL[10];

  const todayTask = homework.state === 'day' && profile.startsOn ? homeworkForDay(homework.day) : undefined;
  // The week's reading, said once, on the first working day of the week
  // ("Welcome to week 1"), not every day (the owner, November 2026). It is
  // on Homework and Reading all week.
  const weekReading =
    homework.state === 'day' && profile.startsOn && startsAWeek(homework.day)
      ? readingForWeek(readingWeekOf(homework.day))
      : undefined;
  // What the firm needs first: the joining list, or the firm's own reading.
  const firstThing = hasChecklist
    ? joining.outstanding.length > 0
      ? {
          label: 'Your joining list',
          meta:
            joining.outstanding.length === 1
              ? '1 thing to do before you begin'
              : `${joining.outstanding.length} things to do before you begin`,
          href: '/start',
        }
      : !joining.cleared
        ? { label: 'Your joining list', meta: 'All done · somebody at the firm will look it over', href: '/start' }
        : null
    : firmOutstanding.length > 0
      ? {
          label:
            firmOutstanding.length === 1
              ? `Read "${firmOutstanding[0].name}"`
              : `Read the firm's ${firmOutstanding.length} documents`,
          meta: 'The firm asks you to read this before you start',
          href:
            firmOutstanding.length === 1 ? `/modules/firm/${firmOutstanding[0].slug}` : '/modules',
        }
      : null;
  const openMatter = matters.find((m) => m.latest?.stage === 'working') ?? null;
  const untriedMatter = matters.find((m) => !m.latest) ?? null;
  const setForToday = todaysHomework({
    today,
    diagnosticQuestions: DIAGNOSTIC_QUESTION_COUNT,
    beforeYouBegin: firstThing,
    matter: openMatter ? { id: openMatter.matter.id, title: openMatter.matter.title } : null,
    needsDiagnostic,
    trainingOpen: open,
    rounds: rounds ? rounds.rounds : null,
    roundSize: ROUND_SIZE,
    goal: { questions: questionCount, answered: overview.answeredToday },
    homework:
      todayTask && homework.state === 'day'
        ? { day: homework.day, title: todayTask.title, done: declaredDays.has(homework.day) }
        : null,
    reading: weekReading
      ? {
          label: `Welcome to week ${weekReading.week}: this week’s reading`,
          detail: `${weekReading.book.title}, pages ${weekReading.pages}`,
        }
      : null,
    homeworkNote,
    missedHomework,
    work: workTasks
      .filter((w) => w.claimed)
      .map((w) => ({
        id: w.post.id,
        title: w.post.title,
        dueOn: w.post.dueOn,
        state: w.state,
        replyWaiting: w.replyWaiting,
      })),
    workOpen: workTasks.filter((w) => !w.claimed && w.post.published && !isFull(w.post, w.claims)).length,
    nextMatter: untriedMatter ? { id: untriedMatter.matter.id, title: untriedMatter.matter.title } : null,
    // A trainee's mornings are on Programme; anybody else trains from the
    // list's own button, and Learn is where the questions come from.
    trainingHref: isTrainee ? '/programme' : '/modules',
    session: lead && lead.airsOn === today ? { title: lead.title } : null,
    nextModule: outstanding[0]
      ? {
          slug: outstanding[0].module.slug,
          name: outstanding[0].module.name,
          correctOnce: outstanding[0].correctOnce,
          total: outstanding[0].total,
        }
      : null,
  });


  // One action above the checklist: what to do next, when, and where the
  // feedback is. Work sent back comes before anything new (next-task.ts).
  const myWork = workTasks
    .filter((w) => w.claimed)
    .map((w) => ({
      id: w.post.id,
      title: w.post.title,
      dueOn: w.post.dueOn,
      state: w.state,
      replyWaiting: w.replyWaiting,
      markedAt: w.latest?.markedAt ?? null,
    }));
  const roundNow = rounds?.rounds.find((r) => r.state === 'open') ?? null;
  const roundNext = rounds?.rounds.find((r) => r.state === 'upcoming') ?? null;
  const returned = matters.find((m) => m.latest?.stage === 'again') ?? null;
  const firstTask = nextTask({
    today,
    beforeYouBegin:
      firstThing && (hasChecklist ? joining.outstanding.length > 0 : firmOutstanding.length > 0)
        ? firstThing
        : null,
    needsDiagnostic,
    openRound:
      open && roundNow
        ? { number: roundNow.number, closesLabel: roundNow.closesLabel, left: Math.max(0, ROUND_SIZE - roundNow.answered) }
        : null,
    nextRound: open && roundNext ? { number: roundNext.number, opensLabel: roundNext.opensLabel } : null,
    openMatter: openMatter ? { id: openMatter.matter.id, title: openMatter.matter.title } : null,
    returnedMatter: returned ? { id: returned.matter.id, title: returned.matter.title } : null,
    work: myWork,
    homework:
      todayTask && homework.state === 'day'
        ? { day: homework.day, title: todayTask.title, done: declaredDays.has(homework.day) }
        : null,
    goal: rounds ? null : { questions: questionCount, answered: overview.answeredToday },
    trainingOpen: open && !needsDiagnostic,
  });
  const markedGood = recentlyMarkedGood(myWork, new Date());

  const trainingLine = setForToday.find((i) => i.key === 'training');
  const startLabel = (short: string) =>
    openNow
      ? `${short === 'Carry on' ? 'Carry on' : 'Start'} round ${openNow.number}`
      : short === 'More'
        ? 'Train again'
        : short;

  const tile =
    'pressable flex flex-col gap-1 rounded-xl border border-rule bg-paper-raised p-4 hover:border-rule-strong sm:p-5';

  return (
    <div className="space-y-6">
      {/* Who it is for, and when: compact, so the next action is in view. */}
      <header>
        <p className="eyebrow mb-1">
          {new Intl.DateTimeFormat('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: profile.timezone,
          }).format(new Date())}
          {homework.state === 'day' && profile.startsOn ? ` · Day ${homework.day} of 20` : ''}
        </p>
        <h1 id="main-title" tabIndex={-1} className="text-[1.75rem] leading-tight break-words focus:outline-none sm:text-[2rem]">
          {greeting(new Date(), profile.timezone)}
          {greetingName(profile.displayName) ? `, ${greetingName(profile.displayName)}` : ''}
        </h1>
      </header>

      {/* Four places, what each is for, and only what this person has. */}
      <LearnerTour
        userId={user.id}
        forceOpen={tourAsked}
        steps={[
          {
            title: 'Today: your next task',
            text: 'The navy card is what to do now, when it is due and where the feedback appears. Below it, what is required today and what is not counted.',
            href: '/dashboard#next-task',
            action: 'See your next task',
          },
          {
            title: 'Learn: optional, at your own pace',
            text: 'Modules teach for a few minutes, then ask. Practice files, the reading and the courts sit underneath.',
            href: '/modules',
            action: 'Open Learn',
          },
          {
            title: 'Work: assignments and feedback',
            text:
              profile.track === 'litigation_trainee' && !profile.traineeConfirmed
                ? 'Work your coaches set, and their feedback on it. Trainee work appears once your supervisor confirms you.'
                : 'Work your coaches set. Put your name on a task, hand it in, and read their feedback there.',
            href: '/work',
            action: 'Open Work',
          },
          {
            title: 'Progress: behind your picture',
            text: 'Tap your picture, top right, then Progress: your level, how often you are right in each topic, and what to practise next.',
            href: '/skills',
            action: 'Open Progress',
          },
        ]}
      />

      {profile.track === 'litigation_trainee' && !profile.traineeConfirmed ? (
        // A status, not an alarm: say what is waiting and what works now.
        <p className="flex items-start gap-2.5 rounded-lg border border-rule bg-paper-raised px-4 py-2.5 text-sm text-slate">
          <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-warn" />
          <span>
            <strong className="font-semibold text-ink">Programme confirmation pending.</strong>{' '}
            Modules, questions and practice files work now. Trainee work appears once your
            supervisor confirms you.
          </span>
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          {note ? <MorningNoteCard note={note} timezone={profile.timezone} /> : null}

          <NextTaskCard
            task={firstTask}
            markedGood={markedGood}
            start={
              // Starting training is a real action, not a link: the card carries
              // the same button the list would have, so there is one Start.
              firstTask?.startsTraining && trainingLine?.start ? (
                <BeginSessionButton kind="daily" variant="light" label={startLabel(trainingLine.start)} />
              ) : undefined
            }
          />

          <div id="training" className="scroll-mt-24">
            <TodayList
              items={setForToday}
              upNext={firstTask?.listKey ?? null}
              startTraining={
                trainingLine?.start
                  ? (label) => (
                      <BeginSessionButton kind="daily" variant="accent" compact label={startLabel(label)} />
                    )
                  : undefined
              }
            />
            {!open && !needsDiagnostic ? (
              // No training line on the list until questions are published: say
              // why, and to staff, what opens it.
              <p className="mt-3 text-sm text-slate">
                {profile.isAdmin
                  ? `No ${countryName === 'Malaysia' ? 'Malaysian' : 'Australian'} questions are published yet. Sign off the ones you are sure of, then press “Publish everything signed off”, and daily training opens for everyone in ${countryName}.`
                  : profile.isCoach
                    ? `No ${countryName === 'Malaysia' ? 'Malaysian' : 'Australian'} questions are published yet. Sign off the ones you are sure of, and training opens for everyone in ${countryName} once an administrator publishes them.`
                    : `${profile.country === 'MY' ? 'Malaysian questions are published only once a lawyer has signed them off, and none have been yet.' : 'No questions have been published yet.'}${
                        profile.startsOn
                          ? ''
                          : supervised
                            ? ' Anything your coach posts for you will appear here, and your homework starts once your supervisor sets your start date.'
                            : ' Anything posted for you will appear here.'
                      }`}
              </p>
            ) : null}
            {!open && !needsDiagnostic && staff ? (
              <div className="mt-3">
                <ButtonLink href="/admin/review" variant="outline" size="sm" className="min-h-11">
                  Check the questions
                </ButtonLink>
              </div>
            ) : null}
          </div>

          {/* The coach's own session: the thing with a time on it. */}
          {lead ? (
            <div id="session" className="scroll-mt-24">
              <SessionCard session={lead} more={sessions.length - 1} materials={leadMaterials} />
            </div>
          ) : null}
        </div>

        {/* Beside the main task on a wide screen, under it otherwise: where
            they stand, the programme, and the day's fact. */}
        <aside aria-label="Your progress and programme" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {/* Everything about how they are doing lives on Progress; here, a summary. */}
          <Link href="/skills" className={tile}>
            <span className="eyebrow">Your progress</span>
            <span className="mt-1 text-[0.9375rem] font-semibold text-ink">
              {skill ? `${SKILL_LEVELS[skill].name} level` : `Your level shows after ${LEVEL_MIN_ANSWERS} answers`}
            </span>
            <span className="text-sm text-muted">
              {overview.answeredToday} answered today · {overview.currentStreak}-day streak
            </span>
            <span className="mt-2 text-sm font-medium text-periwinkle-ink">See your progress ›</span>
          </Link>
          {profile.track === 'litigation_trainee' ? (
            <Link href="/programme" className={tile}>
              <span className="eyebrow">Your programme</span>
              <span className="mt-1 text-[0.9375rem] font-semibold text-ink">
                Today&rsquo;s concept and your mornings
              </span>
              <span className="text-sm text-muted">The training file and the month ahead</span>
              <span className="mt-2 text-sm font-medium text-periwinkle-ink">Open the programme ›</span>
            </Link>
          ) : null}
          {fact ? (
            <div className="sm:col-span-2 lg:col-span-1">
              <DailyBrief fact={fact} listen={speechConfigured()} />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
