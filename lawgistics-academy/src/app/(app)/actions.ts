'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import {
  completeSession,
  resumeOrStartSession,
  submitAnswer,
} from '@/lib/training/service';
import { IMPROVEMENT_GOALS } from '@/lib/types';
import type { AnswerFeedback, SessionKind } from '@/lib/types';

const GOAL_SLUGS = IMPROVEMENT_GOALS.map((g) => g.slug);

const onboardingSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  careerStage: z.enum(['law_student', 'plt_student', 'graduate', 'junior_lawyer', 'other']),
  goals: z.array(z.string()).min(1).max(GOAL_SLUGS.length),
  dailyGoalMinutes: z.coerce.number().refine((n) => [5, 10, 15, 20].includes(n)),
  homeJurisdiction: z.enum([
    'AU_GENERAL',
    'CTH',
    'NSW',
    'VIC',
    'QLD',
    'WA',
    'SA',
    'TAS',
    'ACT',
    'NT',
  ]),
});

export type OnboardingState = { error: string | null };

export async function saveOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const parsed = onboardingSchema.safeParse({
    displayName: formData.get('displayName') || undefined,
    careerStage: formData.get('careerStage'),
    goals: formData.getAll('goals').map(String),
    dailyGoalMinutes: formData.get('dailyGoalMinutes'),
    homeJurisdiction: formData.get('homeJurisdiction'),
  });

  if (!parsed.success) {
    return { error: 'Please answer all four questions before continuing.' };
  }

  const goals = parsed.data.goals.filter((slug) => GOAL_SLUGS.includes(slug as never));
  if (goals.length === 0) return { error: 'Choose at least one area to improve.' };

  // A learner editing their own profile needs no elevated privilege, go
  // through RLS. The trigger on `profiles` blocks any attempt to set is_admin.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.displayName ?? null,
      career_stage: parsed.data.careerStage,
      improvement_goals: goals,
      daily_goal_minutes: parsed.data.dailyGoalMinutes,
      home_jurisdiction: parsed.data.homeJurisdiction,
      onboarded_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  redirect('/diagnostic');
}

const SESSION_KINDS: SessionKind[] = ['diagnostic', 'daily', 'review', 'practice'];

export async function beginSession(
  kind: SessionKind,
): Promise<{ error: string } | undefined> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!SESSION_KINDS.includes(kind)) redirect('/dashboard');

  let outcome: { sessionId: string } | { error: string };

  try {
    outcome = await resumeOrStartSession(user.id, kind);
  } catch (caught) {
    // Starting a session is the first thing that touches the service-role key,
    // so a deployment missing SUPABASE_SERVICE_ROLE_KEY fails here and nowhere
    // earlier. Left unhandled, the thrown error reaches the browser as a
    // scrubbed server error and the button simply sits there saying
    // "Preparing", which is indistinguishable from nothing happening at all.
    outcome = {
      error: caught instanceof Error ? caught.message : 'Could not start the session.',
    };
  }

  // Deliberately returned rather than redirected: the message belongs next to
  // the button that was pressed, not on a page the learner did not ask for.
  if ('error' in outcome) return { error: outcome.error };

  redirect(`/train/${outcome.sessionId}`);
}

const answerSchema = z.object({
  sessionId: z.string().uuid(),
  questionVersionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().max(40)).min(1).max(10),
  confidence: z.enum(['guess', 'somewhat_sure', 'certain']).nullable(),
  responseMs: z.number().int().min(0).max(1000 * 60 * 60).nullable(),
});

export async function answerQuestion(
  input: z.input<typeof answerSchema>,
): Promise<AnswerFeedback | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { error: 'That answer could not be read.' };

  return submitAnswer({
    userId: user.id,
    sessionId: parsed.data.sessionId,
    questionVersionId: parsed.data.questionVersionId,
    selectedOptionIds: parsed.data.selectedOptionIds,
    confidence: parsed.data.confidence,
    responseMs: parsed.data.responseMs,
  });
}

export async function finishSession(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!z.string().uuid().safeParse(sessionId).success) redirect('/dashboard');

  const result = await completeSession(user.id, sessionId);
  if ('error' in result) redirect('/dashboard');

  revalidatePath('/dashboard');
  redirect(
    result.kind === 'diagnostic'
      ? `/diagnostic/results?session=${sessionId}`
      : `/train/${sessionId}/summary`,
  );
}
