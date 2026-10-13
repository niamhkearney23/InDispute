import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { CourtMap } from '@/components/court-map';
import { moduleBySlug } from '@/content/seed/modules';
import { getModuleProgress } from '@/lib/modules/service';
import { requireAccess } from '@/lib/access/service';
import { courtMapFor } from '@/lib/content/service';
import { isStaff } from '@/lib/content/gate';
import { ButtonLink, Notice, Pill } from '@/components/ui';

export const metadata: Metadata = { title: 'Court map' };

/** The court-system module for each country, kept in one place so a module
    renamed or retired shows up here rather than as a dead link nobody notices. */
const QUIZ_MODULE: Record<string, string> = {
  MY: 'courts-my',
  AU: 'courts-au',
};

export default async function CourtsPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');

  const staff = isStaff(profile);
  // Decided on the server: a learner whose country's map is not signed off
  // is never sent it, so there is nothing in the page to find.
  const map = await courtMapFor(profile.country, staff);

  const quizSlug = QUIZ_MODULE[profile.country];
  // Only offered when the module has something in it. "Test yourself"
  // leading to a page that says there is nothing to test was a dead end.
  const progress = quizSlug ? await getModuleProgress(user.id, profile.country) : [];
  const quizReady = progress.some((p) => p.module.slug === quizSlug && p.total > 0);
  const quizHref =
    quizSlug && moduleBySlug(quizSlug) && quizReady ? `/modules/${quizSlug}` : null;

  if (!map) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <section>
          <p className="eyebrow mb-2">Reference</p>
          <h1 className="text-3xl sm:text-4xl">Court map</h1>
        </section>
        <Notice>
          This part is waiting for a lawyer&rsquo;s check. The court map appears here once a
          qualified lawyer has read it and signed it off.
        </Notice>
        <div className="flex flex-col gap-3 sm:flex-row">
          {quizHref ? (
            <ButtonLink href={quizHref} size="lg" variant="outline">
              Practise the court questions
            </ButtonLink>
          ) : null}
          <ButtonLink href="/dashboard" size="lg" variant="outline">
            Back to Today
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Reference</p>
        <h1 className="text-3xl sm:text-4xl">{map.item.name}</h1>
        <p className="mt-3 max-w-xl text-slate">
          Where a matter starts, and where it goes if somebody appeals. Tap any court to
          open it.
        </p>
        {/* Only staff ever see an unchecked map, and it says so. */}
        {!map.checked ? (
          <p className="mt-3 text-sm text-slate">
            <Pill tone="warn">Not yet checked by a lawyer</Pill>{' '}
            Learners do not see this map until a lawyer signs it off
            {profile.isAdmin || profile.isCoach ? (
              <>
                {' '}
                at{' '}
                <Link
                  href="/admin/reference"
                  className="inline-block py-1.5 underline underline-offset-2 hover:text-ink"
                >
                  Admin, Reference
                </Link>
              </>
            ) : null}
            .
          </p>
        ) : null}
      </section>

      <CourtMap hierarchy={map.item} quizHref={quizHref} />
    </div>
  );
}
