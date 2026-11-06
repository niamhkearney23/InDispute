import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLearnerProfile } from "@/lib/learner-overview";
import { requireAccess } from "@/lib/access/service";
import { homeworkDay } from "@/lib/homework/rules";
import { scheduleForPerson } from "@/lib/training/cohorts";
import { PROGRAMME_BOOK, READING_BY_WEEK, readingWeekOf } from "@/content/seed/reading";
import { Card, Notice, Pill } from "@/components/ui";

export const metadata: Metadata = { title: "Reading" };

/**
 * The reading, one week at a time (the owner, November 2026: "welcome to
 * week 1, this week's reading, then have that book ... but don't say it
 * daily"). A list of chapters and pages only: learners read from their own
 * copy or the firm's, and no copy of the book is shown or linked here.
 */
export default async function ReadingPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/reading");
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect("/account-problem");

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
  const thisWeek = today?.state === "day" ? readingWeekOf(today.day) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <p className="eyebrow mb-2">Reading</p>
        <h1 className="text-3xl sm:text-4xl">Each week&rsquo;s reading</h1>
        <p className="mt-3 text-slate">
          One reading a week, set with what you are learning that week, so not always in the
          book&rsquo;s order. Read from your own copy or the firm&rsquo;s.
        </p>
      </section>

      <Notice tone="neutral">
        <em>{PROGRAMME_BOOK.title}</em>, {PROGRAMME_BOOK.author}, {PROGRAMME_BOOK.edition}.{" "}
        {PROGRAMME_BOOK.note}
      </Notice>

      <ol className="space-y-3">
        {READING_BY_WEEK.map((w) => (
          <li key={w.week}>
            <Card className={w.week === thisWeek ? "border-accent" : undefined}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">Week {w.week}</p>
                {w.week === thisWeek ? <Pill tone="accent">This week</Pill> : null}
              </div>
              <h2 className="mt-1 text-xl">{w.theme}</h2>
              <p className="mt-2 font-serif">
                <em>{w.book.title}</em>
              </p>
              <p className="mt-1 text-slate">{w.what}.</p>
              <p className="mt-1 text-sm text-slate">Pages {w.pages}</p>
            </Card>
          </li>
        ))}
      </ol>

      <p className="text-xs text-muted">
        Page numbers are from the eighth edition. With another edition, follow
        the chapters.
      </p>
    </div>
  );
}
