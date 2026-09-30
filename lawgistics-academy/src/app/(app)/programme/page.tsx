import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { homeworkDay } from '@/lib/homework/rules';
import { HOMEWORK_TASKS } from '@/content/seed/homework';
import { PROGRAMME } from '@/content/programme';
import { PROGRAMME_WEEKS, boxesForWeek, weekOfDay } from '@/content/programme-plan';
import { brand } from '@/lib/brand';
import { ButtonLink, Card, Pill, cn } from '@/components/ui';

export const metadata: Metadata = { title: 'The month' };

/**
 * The month, week by week, for the people on it.
 *
 * The same plan the front door shows, with the week they are in marked and
 * each week's homework days and work products listed. Nothing here is
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
          {PROGRAMME.length}, {PROGRAMME.days}, on one file that you carry from the first
          interview to the courtroom. Each week produces the pieces of work your supervisor
          grades for certification. Your supervisor may vary this; what they say goes.
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
          const days = HOMEWORK_TASKS.filter((t) => weekOfDay(t.day) === week.number);
          const boxes = boxesForWeek(week);
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
                <p className="mt-1.5 text-slate">{week.theme}</p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="eyebrow mb-2">What you do</p>
                    <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                      {week.trainee.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="eyebrow mb-2">From your coach</p>
                    <ul className="space-y-1.5 text-sm text-slate">
                      {week.coach.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 border-t border-rule pt-4">
                  <p className="eyebrow mb-2">What it produces</p>
                  <ul className="space-y-1 text-sm">
                    {boxes.map((box) => (
                      <li key={box.number} className="flex gap-2">
                        <span className="shrink-0 font-serif tabular-nums text-muted">
                          {box.number}.
                        </span>
                        <span>
                          {box.workProduct}
                          {box.isSpine ? (
                            <span className="text-muted"> (required)</span>
                          ) : box.isAdvocacy ? (
                            <span className="text-muted"> (advocacy)</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 border-t border-rule pt-4">
                  <p className="eyebrow mb-2">Homework, days {days[0]?.day} to {days.at(-1)?.day}</p>
                  <p className="text-sm text-slate">{days.map((t) => t.title).join(' · ')}</p>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      <p className="text-sm text-muted">
        Certification is ten pieces at the top grade, including all six marked required and
        at least one marked advocacy. Your supervisor grades them; nothing here is ticked by
        you.
      </p>

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
