import type { Metadata } from 'next';
import Link from 'next/link';
import { requireReviewer } from '@/lib/admin/guard';
import { ALL_LESSONS, DRAFT_LESSONS } from '@/content/seed/lessons';
import { moduleBySlug } from '@/content/seed/modules';
import { currentSignOffs } from '@/lib/lessons/signoff';
import { Pill } from '@/components/ui';

export const metadata: Metadata = { title: 'Lessons' };
export const dynamic = 'force-dynamic';

/**
 * Every lesson and whether a lawyer has signed it off as it stands. A
 * rewrite waiting here is shown to no learner until it is signed off; the
 * lessons already live show learners that they are not yet checked.
 */
export default async function AdminLessonsPage() {
  await requireReviewer();
  const signed = await currentSignOffs();
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const waiting = DRAFT_LESSONS.filter((l) => !signed.has(l.slug));

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Lessons</p>
        <h1 className="text-3xl">Lessons to read and sign off</h1>
        <p className="mt-3 max-w-2xl text-slate">
          The teaching before each module&rsquo;s questions. Open one, read every screen, and sign
          it off if the law in it is right. A rewrite reaches learners only once it is signed off;
          changing any word afterwards means it needs signing again.
          {waiting.length > 0
            ? ` ${waiting.length} ${waiting.length === 1 ? 'rewrite is' : 'rewrites are'} waiting.`
            : ''}
        </p>
      </section>

      <ul className="divide-y divide-rule rounded-lg border border-rule bg-paper-raised">
        {ALL_LESSONS.map((lesson) => {
          const signOff = signed.get(lesson.slug);
          const draft = Boolean(lesson.replaces);
          return (
            <li key={lesson.slug}>
              <Link
                href={`/admin/lessons/${lesson.slug}`}
                className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 hover:bg-paper-sunk"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{lesson.title}</span>
                  <span className="text-sm text-slate">
                    {moduleBySlug(lesson.moduleSlug)?.name ?? lesson.moduleSlug} ·{' '}
                    {lesson.country === 'MY' ? 'Malaysia' : 'Australia'}
                    {draft ? ' · rewrite' : ''}
                  </span>
                </span>
                <span className="shrink-0">
                  {signOff ? (
                    <Pill tone="correct">
                      Signed off by {signOff.name}, {day(signOff.signedAt)}
                    </Pill>
                  ) : draft ? (
                    <Pill tone="warn">Waiting: not shown to learners</Pill>
                  ) : (
                    <Pill tone="neutral">Live, not yet checked</Pill>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
