import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { homeworkDay } from '@/lib/homework/rules';
import { PROGRAMME } from '@/content/programme';
import { PROGRAMME_WEEKS, weekOfDay } from '@/content/programme-plan';
import { daysOfWeek, programmeDay } from '@/content/programme-days';
import { conceptForDay } from '@/content/programme-concepts';
import { TRAINING_FILE } from '@/content/training-file';
import { brand } from '@/lib/brand';
import { ButtonLink, Card, Pill, cn } from '@/components/ui';
import { requireAccess } from '@/lib/access/service';
import { scheduleForPerson } from '@/lib/training/cohorts';
import Link from '@/components/app-link';
import { RoundsCalendar } from '@/components/rounds-calendar';
import { roundsHistory } from '@/lib/training/rounds-service';

export const metadata: Metadata = { title: 'The month' };

/**
 * The month, week by week, for the people on it.
 *
 * Short on purpose: each week's title and its twenty days, one line each,
 * with the week and the day they are on marked. Today's concept and its
 * morning and afternoon are above the weeks. Nothing here is
 * recorded: the homework page records days, the work board records what
 * was handed in, and the register records the supervisor's decision. This
 * is the map those three sit on.
 */
export default async function ProgrammePage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');
  if (profile.track !== 'litigation_trainee') redirect('/dashboard');

  const homework = homeworkDay(
      profile.startsOn,
      profile.endsOn,
      profile.timezone,
      new Date(),
      (await scheduleForPerson(user.id)).holidays,
    );
  // Today's plan, the shortcut tiles and the calendar of mornings, moved here
  // from Today when it became the coach's note and the day's homework.
  const todayPlan = homework.state === 'day' ? programmeDay(homework.day) : null;
  const confirmed = profile.traineeConfirmed;
  const roundDays = confirmed ? await roundsHistory(user.id).catch(() => null) : null;
  const currentWeek =
    homework.state === 'day'
      ? weekOfDay(homework.day)
      : homework.state === 'weekend'
        ? weekOfDay(homework.nextDay)
        : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <p className="eyebrow mb-2">Your programme · {brand.firm}</p>
        <h1 className="text-3xl sm:text-4xl">The month, week by week</h1>
        <p className="mt-3 text-slate">
          {PROGRAMME.length}, {PROGRAMME.days}, on one file.
        </p>
        <p className="mt-3 text-sm">
          <ButtonLink href="/programme/file" variant="outline" size="sm" className="min-h-11">
            {TRAINING_FILE.shortName}: the matter you work on
          </ButtonLink>
        </p>
        {homework.state === 'before' ? (
          <p className="mt-2 text-sm text-muted">
            Starts in {homework.daysUntilStart} {homework.daysUntilStart === 1 ? 'day' : 'days'}.
          </p>
        ) : homework.state === 'finished' ? (
          <p className="mt-2 text-sm text-muted">The month is over. The plan stays here.</p>
        ) : homework.state === 'none' ? (
          <p className="mt-2 text-sm text-muted">
            Your supervisor sets your dates when they confirm you.
          </p>
        ) : null}
      </section>

      {todayPlan ? (
        <Card>
          <p className="eyebrow">Today&rsquo;s concept · Day {todayPlan.day} of 20</p>
          <p className="mt-1 font-serif text-xl leading-snug">
            {conceptForDay(todayPlan.day)?.concept ?? todayPlan.title}
          </p>
          <p className="mt-2 text-sm">
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
        </Card>
      ) : null}

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(
          [
            ['The training file', 'The one case you work on', '/programme/file'],
            ['Homework', 'One task a day', '/homework'],
            ['From your coach', 'Work and marking', '/work'],
            ['Sessions', 'Your coach\u2019s videos', '/sessions'],
            ['Certificate', 'What earns it', '/certificate'],
            ['Your progress', 'Streak, level, scores', '/skills'],
          ] as const
        ).map(([label, hint, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full min-h-16 flex-col justify-center rounded-md border border-rule bg-paper-raised px-3 py-2.5 transition-colors hover:border-rule-strong hover:bg-paper-sunk"
            >
              <span className="font-medium leading-snug">{label}</span>
              <span className="text-xs text-slate">{hint}</span>
            </Link>
          </li>
        ))}
      </ul>

      {roundDays && roundDays.days.length > 0 ? (
        <Card>
          <p className="eyebrow mb-3">Your mornings</p>
          <RoundsCalendar days={roundDays.days} today={roundDays.days[roundDays.days.length - 1].date} />
        </Card>
      ) : null}

      <ol className="space-y-4">
        {PROGRAMME_WEEKS.map((week) => {
          const isNow = currentWeek === week.number;
          const isPast = currentWeek !== null && currentWeek > week.number;
          return (
            <li key={week.number}>
              <Card
                // A past week is marked Done rather than faded: fading the
                // card took its small labels below the 4.5:1 contrast AA
                // asks for (axe, October 2026).
                className={cn(isNow && 'border-accent/40 bg-accent-wash')}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="eyebrow">Week {week.number}</p>
                  {isNow ? <Pill tone="accent">This week</Pill> : null}
                  {isPast ? <Pill>Done</Pill> : null}
                </div>
                <h2 className="mt-1 text-2xl">{week.title}</h2>
                <ol className="mt-3 space-y-1.5">
                  {daysOfWeek(week.number).map((d) => {
                    const isToday = homework.state === 'day' && homework.day === d.day;
                    return (
                      <li key={d.day} className="flex flex-wrap items-baseline gap-x-2.5">
                        <span className="w-12 shrink-0 font-serif text-sm text-muted tabular-nums">
                          Day {d.day}
                        </span>
                        <span className={cn(isToday && 'font-medium')}>
                          {conceptForDay(d.day)?.concept ?? d.title}
                        </span>
                        {isToday ? <Pill tone="accent">Today</Pill> : null}
                      </li>
                    );
                  })}
                </ol>
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/homework" size="lg" variant="accent">
          This week&rsquo;s homework
        </ButtonLink>
        <ButtonLink href="/work" size="lg" variant="outline">
          Work from your supervisors
        </ButtonLink>
        <ButtonLink href="/dashboard" size="lg" variant="outline">
          Back to today
        </ButtonLink>
      </div>
    </div>
  );
}
