import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { brand } from '@/lib/brand';
import { OnboardingForm } from './onboarding-form';

export const metadata: Metadata = { title: 'Getting started' };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);

  // Reachable again with ?edit=1, because someone who trained on Australian
  // law and is now starting at a Malaysian firm has to be able to say so, and
  // that is the ordinary case here rather than an edge one.
  const { edit } = await searchParams;
  const editing = edit === '1';
  if (profile?.onboardedAt && !editing) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow mb-3">
        {editing ? 'Your settings' : `Welcome to ${brand.fullName}`}
      </p>
      <h1 className="mb-3 text-3xl sm:text-4xl">
        {editing ? 'Change what you are training on' : 'Train like a lawyer.'}
      </h1>
      <p className="mb-9 text-slate">
        {editing
          ? 'Changing country changes which questions you are shown, because Australian and Malaysian law are different bodies of law. Everything you have already answered is kept.'
          : 'Five quick questions, then a diagnostic of about thirty questions. After that you will have a skill map and a daily session shaped around it.'}
      </p>

      <OnboardingForm
        defaultName={profile?.displayName ?? ''}
        defaultCountry={profile?.country ?? 'AU'}
        defaultJurisdiction={profile?.homeJurisdiction ?? 'AU_GENERAL'}
      />
    </div>
  );
}
