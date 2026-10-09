import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { brand } from '@/lib/brand';
import { OnboardingForm } from './onboarding-form';
import { AccentSurface } from '@/components/accent-surface';
import { acceptedInvitationFor } from '@/lib/onboarding/invitations';
import { trainingOpen } from '@/lib/training/service';

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

  // What comes after the button, as it is: the tour, then the diagnostic
  // when there are questions to sit it with. The button used to say "Start
  // my diagnostic" and led to the tour.
  const steps = (await trainingOpen(country))
    ? ['Five questions', 'A quick tour', 'Diagnostic']
    : ['Five questions', 'A quick tour'];

  return (
    <div className="mx-auto max-w-2xl">
      <AccentSurface as="section" className="rise-in mb-8 rounded-2xl shadow-raised">
        <div className="px-6 py-8 sm:px-9 sm:py-10">
          <p className="mb-3 text-[0.6875rem] font-semibold tracking-[0.16em] text-paper/70 uppercase">
            {editing ? 'Your settings' : `Welcome to ${brand.fullName}`}
          </p>
          <h1 className="text-[2.25rem] leading-[1.05] sm:text-5xl">
            {editing ? 'Change what you are training on' : 'Train like a lawyer.'}
          </h1>
          {editing && !invitation ? (
            <p className="mt-4 max-w-xl text-paper/85">
              Changing country changes which questions you are shown, because Australian and
              Malaysian law are different bodies of law. Everything you have already answered is
              kept.
            </p>
          ) : null}
          {editing ? null : (
            <ol className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="What happens next">
              {steps.map((step, i) => (
                <li
                  key={step}
                  className={
                    i === 0
                      ? 'rounded-full bg-paper px-3.5 py-1.5 font-semibold text-accent'
                      : 'rounded-full bg-paper/10 px-3.5 py-1.5 text-paper/80 ring-1 ring-paper/25'
                  }
                >
                  {i + 1}. {step}
                </li>
              ))}
            </ol>
          )}
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
