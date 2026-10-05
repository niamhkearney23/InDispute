import type { Metadata } from 'next';
import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { intakeOverview } from '@/lib/intake/service';
import { boxTitle, intakeSchedule, sessionPrefill, workPrefill } from '@/lib/intake/plan';
import { PROGRAMME } from '@/content/programme';
import { PROGRAMME_WEEKS, weekOfDay } from '@/content/programme-plan';
import { todayIn } from '@/lib/onboarding/rules';
import { brand } from '@/lib/brand';
import { ButtonLink, Card, Notice, Pill, SectionHeading, cn } from '@/components/ui';
import { IntakeDatesButton } from './intake-dates-button';

export const metadata: Metadata = { title: 'Intake' };
export const dynamic = 'force-dynamic';

const KL = 'Asia/Kuala_Lumpur';

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/**
 * The intake, from the coach's side.
 *
 * One page that answers the questions a supervisor has on a Monday
 * morning: is everyone in, what is today, is today's video up, is this
 * week's work posted, and who is behind. Every gap has a button next to
 * it that opens the ordinary form already filled in from the plan, so
 * putting up a day's video is pasting one link, and posting a week's work
 * is pressing save.
 *
 * Nothing here is written by this page except the intake dates, which
 * only an administrator sees, through its own guarded action.
 */
export default async function IntakePage() {
  const { isAdmin } = await requireCoach();
  const overview = await intakeOverview();

  const schedule = intakeSchedule(PROGRAMME.intakeStartsOn);
  const today = todayIn(KL);
  const todayEntry = schedule.find((d) => d.date === today) ?? null;
  const dateOfBoxDue = new Map<number, { date: string; day: number }>();
  for (const d of schedule) for (const n of d.due) dateOfBoxDue.set(n, { date: d.date, day: d.day });

  const confirmed = overview.trainees.filter((t) => t.confirmed);
  const awaiting = overview.trainees.filter((t) => !t.confirmed);
  const undated = confirmed.filter((t) => !t.startsOn);
  // Dated for some other intake (the October dates, or the November dates
  // from before Deepavali moved the last day) and not started yet: their day plan and homework would run to
  // the wrong calendar.
  const elsewhere = confirmed.filter(
    (t) =>
      t.startsOn &&
      t.startsOn > today &&
      (t.startsOn !== PROGRAMME.intakeStartsOn || t.endsOn !== PROGRAMME.intakeEndsOn),
  );
  const videosUp = schedule.filter((d) => overview.sessionsByDate.has(d.date)).length;
  const allBoxes = [...new Set(schedule.flatMap((d) => d.due))];
  const workPosted = allBoxes.filter((n) => overview.workByBox.get(n)?.post.published).length;
  const questionsOpen = overview.publishedMalaysianQuestions > 0;

  const checks: Array<{ ok: boolean; label: string; detail: string; href?: string; cta?: string }> = [
    {
      ok: confirmed.length > 0 && awaiting.length === 0,
      label: `${confirmed.length} confirmed ${confirmed.length === 1 ? 'trainee' : 'trainees'}`,
      detail:
        awaiting.length > 0
          ? `${awaiting.length} signed up and waiting for you to confirm them.`
          : confirmed.length === 0
            ? 'Nobody has signed up yet. Send them the trainee page.'
            : 'Everyone who signed up is confirmed.',
      href: awaiting.length > 0 ? '/admin/onboarding' : undefined,
      cta: 'Confirm them',
    },
    {
      ok: confirmed.length > 0 && undated.length === 0 && elsewhere.length === 0,
      label: 'Start dates',
      detail:
        undated.length > 0
          ? `${undated.length} confirmed ${undated.length === 1 ? 'trainee has' : 'trainees have'} no start date, so their homework and day plan do not show yet.`
          : elsewhere.length > 0
            ? `${elsewhere.length} confirmed ${elsewhere.length === 1 ? 'trainee is' : 'trainees are'} on different dates (${elsewhere.map((t) => `${t.name}: ${shortDate(t.startsOn!)} to ${t.endsOn ? shortDate(t.endsOn) : 'no end date'}`).join('; ')}), so their day plan runs to the wrong calendar.`
            : confirmed.length === 0
            ? 'Nobody to date yet.'
            : 'Every confirmed trainee has dates.',
    },
    {
      ok: questionsOpen,
      label: 'Daily questions and the day-one diagnostic',
      detail: questionsOpen
        ? `${overview.publishedMalaysianQuestions} Malaysian questions published.`
        : 'No Malaysian questions are published, so the diagnostic and daily questions are off. A lawyer has to sign them off first.',
      href: questionsOpen ? undefined : '/admin/review',
      cta: 'Open the review queue',
    },
    {
      ok: videosUp === schedule.length,
      label: `${videosUp} of ${schedule.length} daily videos scheduled`,
      detail:
        videosUp === schedule.length
          ? 'A video for every day.'
          : 'Each day below has a button that opens the form already filled in. Paste the link and save.',
    },
    {
      ok: workPosted === allBoxes.length,
      label: `${workPosted} of ${allBoxes.length} pieces of work posted`,
      detail:
        workPosted === allBoxes.length
          ? 'Every certification piece is on the work board.'
          : 'Each piece below has a button that opens the work form already filled in. Check it and save.',
    },
  ];

  return (
    <div className="space-y-10">
      <section>
        <p className="eyebrow mb-2">{brand.traineeAcademy} · {brand.firm}</p>
        <h1 className="text-3xl sm:text-4xl">The {PROGRAMME.nextIntake} intake</h1>
        <p className="mt-3 max-w-2xl text-slate">
          {shortDate(PROGRAMME.intakeStartsOn)} to {shortDate(PROGRAMME.intakeEndsOn)},{' '}
          {PROGRAMME.days}. Everything you need to run it, and a button beside anything that
          is not done yet. Each day teaches one concept in a short video, then the trainees
          put it to work on the training file.{' '}
          <Link href="/programme/file" className="-my-2 inline-block py-2 underline underline-offset-2">
            Read the training file
          </Link>
          .
        </p>
      </section>

      <section>
        <SectionHeading eyebrow="Before Monday" title="Is it ready?" />
        <Card>
          <ul className="divide-y divide-rule">
            {checks.map((c) => (
              <li key={c.label} className="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold',
                    c.ok ? 'bg-verdict-correct-wash text-verdict-correct' : 'bg-warn-wash text-warn',
                  )}
                >
                  {c.ok ? '✓' : '!'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    <span className="sr-only">{c.ok ? 'Done: ' : 'Needs doing: '}</span>
                    {c.label}
                  </p>
                  <p className="text-sm text-slate">{c.detail}</p>
                </div>
                {!c.ok && c.href ? (
                  <div className="w-full pl-9 sm:w-auto sm:pl-0">
                    <ButtonLink href={c.href} size="sm" variant="outline">
                      {c.cta}
                    </ButtonLink>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {undated.length > 0 || elsewhere.length > 0 ? (
            <div className="mt-4 space-y-4 border-t border-rule pt-4">
              {isAdmin ? (
                <>
                  {undated.length > 0 ? (
                    <IntakeDatesButton
                      label={`Give ${undated.length === 1 ? 'them' : `all ${undated.length}`} the intake dates`}
                    />
                  ) : null}
                  {elsewhere.length > 0 ? (
                    <IntakeDatesButton
                      scope="move"
                      label={`Give ${elsewhere.length === 1 ? 'them' : `all ${elsewhere.length}`} ${shortDate(PROGRAMME.intakeStartsOn)} to ${shortDate(PROGRAMME.intakeEndsOn)}`}
                    />
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-slate">
                  An administrator sets start dates. Ask them to open this page and press the
                  button that appears here for them.
                </p>
              )}
            </div>
          ) : null}
        </Card>
      </section>

      {todayEntry ? (
        <section>
          <SectionHeading
            eyebrow={`Today · Day ${todayEntry.day} of 20 · Week ${weekOfDay(todayEntry.day)}`}
            title={todayEntry.concept}
          />
          <Card className="border-accent/30 bg-accent-wash">
            <p className="text-sm">
              <span className="text-muted">Video:</span> {todayEntry.video}{' '}
              {overview.sessionsByDate.has(todayEntry.date) ? (
                <Pill tone="correct">Up</Pill>
              ) : (
                <Link
                  href={`/admin/sessions/new?${sessionPrefill(todayEntry)}`}
                  className="font-medium text-accent underline underline-offset-2"
                >
                  Add today&rsquo;s video
                </Link>
              )}
            </p>
            {todayEntry.due.length > 0 ? (
              <p className="mt-1 text-sm">
                <span className="text-muted">Due today:</span>{' '}
                {todayEntry.due.map((n) => boxTitle(n)).join('; ')}
              </p>
            ) : null}
          </Card>
        </section>
      ) : null}

      <section>
        <SectionHeading eyebrow="Day by day" title="Videos and work" />
        <div className="space-y-6">
          {PROGRAMME_WEEKS.map((week) => (
            <div key={week.number}>
              <p className="eyebrow mb-2">
                Week {week.number} · {week.title}
              </p>
              <Card className="p-0 sm:p-0">
                <ol className="divide-y divide-rule">
                  {schedule
                    .filter((d) => weekOfDay(d.day) === week.number)
                    .map((d) => {
                      const videos = overview.sessionsByDate.get(d.date) ?? [];
                      const isToday = d.date === today;
                      return (
                        <li
                          key={d.day}
                          className={cn('px-4 py-3 sm:px-5', isToday && 'bg-accent-wash')}
                        >
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-serif text-sm text-muted tabular-nums">
                              Day {d.day} · {shortDate(d.date)}
                            </span>
                            <span className="font-medium">{d.concept}</span>
                            {isToday ? <Pill tone="accent">Today</Pill> : null}
                          </div>
                          <details className="mt-1 text-sm">
                            <summary className="-my-1 cursor-pointer py-1 text-slate">
                              Video outline
                            </summary>
                            <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-slate">
                              {d.talkingPoints.map((t) => (
                                <li key={t}>{t}</li>
                              ))}
                            </ol>
                            <p className="mt-1.5">
                              <span className="text-muted">End on:</span> {d.remember}
                            </p>
                          </details>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <span className="text-slate">Video: {d.video}</span>
                            {videos.length > 0 ? (
                              <Pill tone="correct">Scheduled</Pill>
                            ) : (
                              <Link
                                href={`/admin/sessions/new?${sessionPrefill(d)}`}
                                className="-my-2 inline-block py-2 font-medium text-accent underline underline-offset-2"
                              >
                                Add this day&rsquo;s video
                              </Link>
                            )}
                          </div>
                          {d.due.map((n) => {
                            const posted = overview.workByBox.get(n);
                            return (
                              <div
                                key={n}
                                className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                              >
                                <span className="text-slate">Due: {boxTitle(n)}</span>
                                {posted?.post.published ? (
                                  <Link
                                    href={`/admin/work/${posted.post.id}`}
                                    className="-my-2 inline-flex items-center gap-2 py-2"
                                  >
                                    <Pill tone="correct">Posted</Pill>
                                    <span className="text-xs text-muted">
                                      {posted.submissions} handed in
                                      {posted.waiting > 0 ? `, ${posted.waiting} to mark` : ''}
                                    </span>
                                  </Link>
                                ) : posted ? (
                                  <Link
                                    href={`/admin/work/${posted.post.id}`}
                                    className="-my-2 inline-block py-2 font-medium text-accent underline underline-offset-2"
                                  >
                                    Draft saved, publish it
                                  </Link>
                                ) : (
                                  <Link
                                    href={`/admin/work/new?${workPrefill(n, dateOfBoxDue.get(n)?.date ?? d.date, d.day)}`}
                                    className="-my-2 inline-block py-2 font-medium text-accent underline underline-offset-2"
                                  >
                                    Post this piece of work
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </li>
                      );
                    })}
                </ol>
              </Card>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="The trainees" title="Who is where" />
        {overview.trainees.length === 0 ? (
          <Notice>
            Nobody has signed up as a trainee yet. They sign up at the trainee page and you
            confirm them here.
          </Notice>
        ) : (
          <Card className="p-0 sm:p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule text-xs text-muted">
                  <th className="px-4 py-2.5 font-medium sm:px-5">Trainee</th>
                  <th className="px-2 py-2.5 font-medium sm:px-3">Status</th>
                  <th className="px-2 py-2.5 text-right font-medium sm:px-3">Homework</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Handed in</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Good</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">To mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {overview.trainees.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2.5 sm:px-5">
                      <Link href={`/admin/onboarding/${t.id}`} className="-my-2 inline-block py-2 font-medium hover:underline">
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      {!t.confirmed ? (
                        <Pill tone="warn">Waiting for you</Pill>
                      ) : !t.startsOn ? (
                        <Pill tone="warn">No dates</Pill>
                      ) : (
                        <Pill tone="correct">In</Pill>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{t.homeworkDone}/20</td>
                    <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">{t.handedIn}</td>
                    <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">{t.good}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums sm:px-5">
                      {t.waiting > 0 ? <strong>{t.waiting}</strong> : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
        <p className="mt-3 text-sm text-muted">
          Certification is recorded under{' '}
          <Link href="/admin/certification" className="-my-2 inline-block py-2 underline underline-offset-2">
            Certification
          </Link>
          , by the supervisor, on day 20.
        </p>
      </section>
    </div>
  );
}
