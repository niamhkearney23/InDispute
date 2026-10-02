import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { homeworkDay } from '@/lib/homework/rules';
import { PROGRAMME } from '@/content/programme';
import { PROGRAMME_WEEKS, weekOfDay } from '@/content/programme-plan';
import { daysOfWeek } from '@/content/programme-days';
import { conceptForDay } from '@/content/programme-concepts';
import { TRAINING_FILE } from '@/content/training-file';
import { brand } from '@/lib/brand';
import { ButtonLink, Card, Pill, cn } from '@/components/ui';

export const metadata: Metadata = { title: 'The month' };

/**
 * The month, week by week, for the people on it.
 *
 * Short on purpose: each week's title and its twenty days, one line each,
 * with the week and the day they are on marked. The detail of each day is on
 * the dashboard, on the day. Nothing here is
 * recorded: the homework page records days, the work board records what
 * was handed in, and the register records the supervisor's decision. This
 * is the map those three sit on.
 */
export default async function ProgrammePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');
  if (profile.track !== 'litigation_trainee') redirect('/dashboard');

  const homework = homeworkDay(profile.startsOn, profile.endsOn, profile.timezone);
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
          <ButtonLink href="/programme/file" variant="outline" size="sm">
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

      <ol className="space-y-4">
        {PROGRAMME_WEEKS.map((week) => {
          const isNow = currentWeek === week.number;
          const isPast = currentWeek !== null && currentWeek > week.number;
          return (
            <li key={week.number}>
              <Card
                className={cn(
                  isNow && 'border-burgundy/40 bg-burgundy-wash',
                  isPast && 'opacity-80',
                )}
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
