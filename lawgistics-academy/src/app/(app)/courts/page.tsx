import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { COURT_HIERARCHIES } from '@/content/seed/court-hierarchies';
import { CourtMap } from '@/components/court-map';
import { moduleBySlug } from '@/content/seed/modules';

export const metadata: Metadata = { title: 'Court map' };

/** The court-system module for each country, kept in one place so a module
    renamed or retired shows up here rather than as a dead link nobody notices. */
const QUIZ_MODULE: Record<string, string> = {
  MY: 'courts-my',
  AU: 'courts-au',
};

export default async function CourtsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  const hierarchy = COURT_HIERARCHIES[profile.country];
  const quizSlug = QUIZ_MODULE[profile.country];
  const quizHref = quizSlug && moduleBySlug(quizSlug) ? `/modules/${quizSlug}` : null;

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Reference</p>
        <h1 className="text-3xl sm:text-4xl">{hierarchy.name}</h1>
        <p className="mt-3 max-w-xl text-slate">
          Where a matter starts, and where it goes if somebody appeals. Tap any court to
          open it.
        </p>
      </section>

      <CourtMap country={profile.country} quizHref={quizHref} />
    </div>
  );
}
