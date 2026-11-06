import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { questionsPublished } from '@/lib/training/service';
import { REQUEST_PATH_HEADER } from '@/lib/auth/two-step';
import { FIRST_STEP_HOME, firstStepFor, openDuring, type FirstStep } from '@/lib/learning/first-steps';

/**
 * Which first step the signed-in person is on, or null (first-steps.ts).
 * Asked once per page view: the layout draws the plain shell from it and
 * every training page holds people to it through requireAccess. The
 * question count is held to a definite yes, so a failed read never shuts
 * somebody out of the academy.
 */
export const firstStepNow = cache(async (): Promise<FirstStep | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await getLearnerProfile(user.id);
  if (!profile) return null;
  const staff = profile.isAdmin || profile.isCoach || profile.isFirmAdmin;
  return firstStepFor({
    staff,
    onboarded: Boolean(profile.onboardedAt),
    diagnosticDone: Boolean(profile.diagnosticCompletedAt),
    questionsOpen:
      !staff && Boolean(profile.onboardedAt) && !profile.diagnosticCompletedAt
        ? (await questionsPublished(profile.country)) === true
        : false,
  });
});

/**
 * Sends somebody on a first step back to it from any page that is not open
 * during it. Called by requireAccess, which every training page calls, and
 * never from a layout: a redirect thrown by a layout while moving between
 * pages left the browser asking for the same page again and again.
 * Without the address (the middleware sets it on every request) nothing is
 * refused, rather than sending somebody round in a circle.
 */
export async function holdForFirstSteps(): Promise<void> {
  const step = await firstStepNow();
  if (!step) return;
  const requested = (await headers()).get(REQUEST_PATH_HEADER);
  if (requested && !openDuring(step, requested)) redirect(FIRST_STEP_HOME[step]);
}
