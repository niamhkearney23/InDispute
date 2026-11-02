import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { requireAccess } from '@/lib/access/service';
import { homeworkDay } from '@/lib/homework/rules';
import { scheduleForPerson } from '@/lib/training/cohorts';
import { PROGRAMME_BOOK, READING_DAYS } from '@/content/seed/reading';
import { Card, Notice, Pill } from '@/components/ui';

export const metadata: Metadata = { title: 'Reading' };

/**
 * The programme's book, a few pages each working day. A list of chapters and
 * pages only: learners read from their own copy or the firm's, and no copy
 * of the book is shown or linked here.
 */
export default async function ReadingPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/reading');
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');

  // Today's day of the placement, for somebody who has one.
  const today = profile.startsOn
    ? homeworkDay(
        profile.startsOn,
        profile.endsOn,
        profile.timezone,
        new Date(),
        (await scheduleForPerson(user.id)).holidays,
      )
    : null;
  const todayDay = today?.state === 'day' ? today.day : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <p className="eyebrow mb-2">Reading</p>
        <h1 className="text-3xl sm:text-4xl">
          <em>{PROGRAMME_BOOK.title}</em>
        </h1>
        <p className="mt-3 text-slate">
          {PROGRAMME_BOOK.author}, {PROGRAMME_BOOK.edition}. A few pages each working day, from
          the first day to the twentieth. Read from your own copy or the firm&rsquo;s.
        </p>
      </section>

      <Notice tone="neutral">{PROGRAMME_BOOK.note}</Notice>

      <ol className="space-y-3">
        {READING_DAYS.map((r) => (
          <li key={r.day}>
            <Card className={r.day === todayDay ? 'border-accent' : undefined}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">Day {r.day}</p>
                {r.day === todayDay ? <Pill tone="accent">Today</Pill> : null}
              </div>
              <p className="mt-1.5">{r.what}</p>
              <p className="mt-1 text-sm text-slate">Pages {r.pages}</p>
            </Card>
          </li>
        ))}
      </ol>

      <p className="text-xs text-muted">
        Page numbers are from the eighth edition. With another edition, follow the chapters.
      </p>
    </div>
  );
}
