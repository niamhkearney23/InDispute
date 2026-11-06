import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { brand } from '@/lib/brand';
import { OnboardingForm } from './onboarding-form';
import { AccentSurface } from '@/components/accent-surface';
import { acceptedInvitationFor } from '@/lib/onboarding/invitations';
import { trainingOpen } from '@/lib/training/service';
import { DIAGNOSTIC_QUESTION_COUNT } from '@/lib/learning/config';
import { FirstSteps } from './first-steps';

export const metadata: Metadata = { title: 'Getting started' };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  // Without a profile row the answers below would save to nothing and the
  // tour after them would have nobody to show, so say so here instead.
  if (!profile) redirect('/account-problem');

  // Reachable again with ?edit=1, because someone who trained on Australian
  // law and is now starting at a Malaysian firm has to be able to say so, and
  // that is the ordinary case here rather than an edge one.
  const { edit } = await searchParams;
  const editing = edit === '1';
  if (profile.onboardedAt && !editing) redirect('/dashboard');

  // The firm's invitation decided the country, so it is what the form shows
  // and what saveOnboarding keeps.
  const invitation = await acceptedInvitationFor(user.id);
  const country = invitation?.country ?? profile.country;
  const track = invitation?.track ?? profile.track;

  // The first visit: one question to a screen on the dark surface
  // (first-steps.tsx), ending on the diagnostic when there are questions.
  if (!editing) {
    // Sign-up names nobody (it asks only for an address), so the address's
    // own first part is not offered back as a name.
    const fromAddress = profile.email ? profile.email.split('@')[0] : null;
    return (
      <FirstSteps
        defaultName={profile.displayName && profile.displayName !== fromAddress ? profile.displayName : ''}
        defaultCountry={country}
        track={track}
        invited={Boolean(invitation)}
        questionsOpen={await trainingOpen(country)}
        diagnosticQuestions={DIAGNOSTIC_QUESTION_COUNT}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AccentSurface as="section" className="rise-in mb-8 rounded-2xl shadow-raised">
        <div className="px-6 py-8 sm:px-9 sm:py-10">
          <p className="mb-3 text-[0.6875rem] font-semibold tracking-[0.16em] text-paper/70 uppercase">
            Your settings
          </p>
          <h1 className="text-[2.25rem] leading-[1.05] sm:text-5xl">Your training</h1>
          {track === 'litigation_trainee' ? (
            <p className="mt-4 max-w-xl text-paper/85">
              You are on the {brand.traineeAcademy}. That was set when you joined and cannot be
              changed here; your name and how you train can.
            </p>
          ) : !invitation ? (
            <p className="mt-4 max-w-xl text-paper/85">
              Changing country changes which questions you are shown, because Australian and
              Malaysian law are different bodies of law. Everything you have already answered is
              kept.
            </p>
          ) : null}
        </div>
      </AccentSurface>

      <OnboardingForm
        defaultName={profile.displayName ?? ''}
        defaultCountry={country}
        defaultTrack={track}
        defaultJurisdiction={profile.homeJurisdiction}
        // What they chose last time, when they are changing it. These were
        // fixed values, so changing country quietly reset the rest.
        defaultStage={editing ? (profile.careerStage ?? undefined) : undefined}
        defaultGoals={editing ? profile.improvementGoals : undefined}
        defaultMinutes={editing ? profile.dailyGoalMinutes : undefined}
        editing={editing}
        invited={Boolean(invitation)}
      />
    </div>
  );
}
