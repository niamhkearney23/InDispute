import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { OnboardingForm } from './onboarding-form';

export const metadata: Metadata = { title: 'Getting started' };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (profile?.onboardedAt) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow mb-3">Welcome to Lawgistics Litigation Academy</p>
      <h1 className="mb-3 text-3xl sm:text-4xl">Train like a lawyer.</h1>
      <p className="mb-9 text-slate">
        Four quick questions, then a diagnostic of about thirty questions. After that you
        will have a skill map and a daily session shaped around it.
      </p>

      <OnboardingForm
        defaultName={profile?.displayName ?? ''}
        defaultJurisdiction={profile?.homeJurisdiction ?? 'AU_GENERAL'}
      />
    </div>
  );
}
