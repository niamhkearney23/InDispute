import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { trainingOpen } from '@/lib/training/service';
import { requireAccess } from '@/lib/access/service';
import { tourFinish, tourSteps } from '@/content/tour';
import { scheduleForPerson } from '@/lib/training/cohorts';
import { Tour } from '@/components/tour';

export const metadata: Metadata = { title: 'How it works' };

/**
 * The tour: what each part of the academy is and where to find it. Joining
 * ends here rather than on Today, so everybody sees it once; it is open again
 * from the account page for anybody who skipped it.
 */
export default async function WelcomePage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');
  if (!profile.onboardedAt) redirect('/onboarding');

  const open = await trainingOpen(profile.country);
  const who = {
    // Only a confirmed trainee has rounds and the work board; until a coach
    // confirms them, somebody who signed up as a trainee gets the general tour.
    trainee: profile.track === 'litigation_trainee' && profile.traineeConfirmed,
    open,
    needsDiagnostic: !profile.diagnosticCompletedAt,
    schedule: await scheduleForPerson(user.id),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <section className="mb-7">
        <p className="eyebrow mb-2">How it works</p>
        <h1 className="text-3xl sm:text-4xl">A quick tour</h1>
        <p className="mt-3 text-slate">
          What each part of the academy is, and where to find it. About a minute.
        </p>
      </section>
      <Tour steps={tourSteps(who)} finish={tourFinish(who)} />
    </div>
  );
}
