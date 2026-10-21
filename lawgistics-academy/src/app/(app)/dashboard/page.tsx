import Link from '@/components/app-link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { getLearnerOverview } from '@/lib/learner-overview';
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
import { isFull, postsForSession, workBoardFor } from '@/lib/work/service';
import { ButtonLink, Notice } from '@/components/ui';
import { BeginSessionButton } from '../begin-session-button';
import { trainingOpen } from '@/lib/training/service';
import { DailyBrief } from '@/components/daily-brief';
import { getFactOfTheDay } from '@/lib/facts/service';
import { mattersForLearner } from '@/lib/matters/service';
import { requireAccess } from '@/lib/access/service';
import { scheduleForPerson } from '@/lib/training/cohorts';
import { morningNoteFor } from '@/lib/notes/service';
import { MorningNoteCard } from '@/components/morning-note';
import { homeworkLines, todaysHomework } from '@/lib/homework/today-list';
import { TodayList } from '@/components/today-list';

export const metadata: Metadata = { title: 'Today' };


export default async function DashboardPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const overview = await getLearnerOverview(user.id);
  if (!overview) redirect('/account-problem');
  if (!overview.profile.onboardedAt) redirect('/onboarding');

  // Somebody who has not sat the diagnostic is asked to, at the top of the
  // page, rather than sent to it. Today used to redirect them there, which
  // held a new learner on the diagnostic with their homework, the work board,
  // their coach's sessions, the list of things to do before they begin and a
  // trainee's "waiting for your supervisor" all on the other side of it. Only
  // when there are questions to sit it with: without them it cannot be done.
  const open = await trainingOpen(overview.profile.country);
  const needsDiagnostic = open && !overview.profile.diagnosticCompletedAt;
  const staff =
    overview.profile.isAdmin || overview.profile.isCoach || overview.profile.isFirmAdmin;
  // Somebody with a supervisor: on the trainee programme, or invited by the
  // firm. Only they are told a supervisor will set their start date, because
  // a learner on their own has nobody who will. Read only for the card that
  // says it, since the invitation lookup is a query of its own.
  const supervised =
    !open && !staff && !overview.profile.startsOn
      ? overview.profile.track === 'litigation_trainee' ||
        Boolean(await acceptedInvitationFor(user.id))
      : false;
  const countryName = overview.profile.country === 'MY' ? 'Malaysia' : 'Australia';

  const { profile, level } = overview;
  const supabase = await createSupabaseServerClient();
  const [
    fact,
    outstanding,
    firmOutstanding,
    joining,
    sessions,
    work,
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
      profile.startsOn
        ? supabase.from('homework_declarations').select('day').eq('user_id', user.id)
        : Promise.resolve({ data: null }),
      mattersForLearner(user.id),
    ]);

  const homework = homeworkDay(
      profile.startsOn,
      profile.endsOn,
      profile.timezone,
      new Date(),
      (await scheduleForPerson(user.id)).holidays,
    );
  // A confirmed trainee's working morning is four rounds of ten (rounds.ts),
  // in place of the daily goal. The calendar of every morning is on Programme.
  const isTrainee = profile.track === 'litigation_trainee' && profile.traineeConfirmed;
  const rounds = isTrainee ? await roundsToday(user.id).catch(() => null) : null;
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

  // Work this person took on, for the checklist.
  const workTasks = work.filter((w) => w.post.kind === 'task');

  // The pre-start checklist supersedes the bare "you have not read the policy"
  // notice, because a reading step is already one line on it. Showing both
  // would put the same document in front of somebody twice and make the shorter
  // notice look like a second, different thing they had missed.
  const hasChecklist = joining.steps.length > 0;
  const questionCount =
    QUESTIONS_PER_MINUTE_GOAL[profile.dailyGoalMinutes] ?? QUESTIONS_PER_MINUTE_GOAL[10];

  // The coach first, then the homework they set (0050): a note for this
  // morning, and one checklist of the day built from what is already here.
  const note = await morningNoteFor(
    { country: profile.country, seesTraineeNotes: seesTraineeVideos(profile) },
    today,
  ).catch(() => null);
  const todayTask = homework.state === 'day' && profile.startsOn ? homeworkForDay(homework.day) : undefined;
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


  const trainingLine = setForToday.find((i) => i.key === 'training');
  const startLabel = (short: string) =>
    openNow
      ? `${short === 'Carry on' ? 'Carry on' : 'Start'} round ${openNow.number}`
      : short === 'More'
        ? 'Train again'
        : short;

  return (
    <div className="space-y-7">
      {/* Who it is for, and when: the day's greeting, then the coach. */}
      <header>
        <p className="eyebrow mb-1.5">
          {new Intl.DateTimeFormat('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: profile.timezone,
          }).format(new Date())}
          {homework.state === 'day' && profile.startsOn ? ` · Day ${homework.day} of 20` : ''}
        </p>
        <h1 className="text-3xl leading-tight break-words sm:text-4xl">
          {greeting(new Date(), profile.timezone)}
          {greetingName(profile.displayName) ? `, ${greetingName(profile.displayName)}` : ''}
        </h1>
      </header>

      {note ? <MorningNoteCard note={note} timezone={profile.timezone} /> : null}

      {profile.track === 'litigation_trainee' && !profile.traineeConfirmed ? (
        <Notice>
          <strong>Waiting for your supervisor.</strong> They need to confirm you are on the
          trainee programme before the work posted for trainees appears. Everything else here
          works now.
        </Notice>
      ) : null}

      <div id="training" className="scroll-mt-24">
        <TodayList
          items={setForToday}
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

      {fact ? <DailyBrief fact={fact} /> : null}

      {profile.track === 'litigation_trainee' ? (
        <Link
          href="/programme"
          className="panel flex items-center justify-between gap-4 rounded-lg border border-rule bg-paper-raised p-4 shadow-card hover:bg-paper-sunk/60"
        >
          <span className="min-w-0">
            <span className="eyebrow block">Your programme</span>
            <span className="mt-1 block text-sm text-muted">
              Today&rsquo;s concept, the training file, your mornings and the month
            </span>
          </span>
          <span className="shrink-0 text-sm font-semibold text-accent">Open ›</span>
        </Link>
      ) : null}

      {/* Everything about how they are doing lives on Progress; here, one line. */}
      <Link
        href="/skills"
        className="panel flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-rule bg-paper-raised p-4 shadow-card hover:bg-paper-sunk/60"
      >
        <span className="min-w-0">
          <span className="eyebrow block">Your progress</span>
          <span className="mt-1 block font-semibold">
            Level {level.level} · {level.name}
          </span>
          <span className="mt-0.5 block text-sm text-muted">
            {overview.currentStreak} {overview.currentStreak === 1 ? 'day' : 'days'} in a row ·{' '}
            {overview.weeklyXp} XP this week
            {level.xpForNextLevel !== null ? ` · ${level.xpForNextLevel} XP to the next level` : ''}
          </span>
        </span>
        <span className="text-sm font-semibold text-accent">See your progress ›</span>
      </Link>
    </div>
  );
}
