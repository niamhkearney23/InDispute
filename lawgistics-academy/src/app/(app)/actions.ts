'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import {
  completeSession,
  getCoachNote,
  resumeOrStartSession,
  startModuleSession,
  submitAnswer,
} from '@/lib/training/service';
import { moduleBySlug } from '@/content/seed/modules';
import { HOMEWORK_DAYS, homeworkForDay } from '@/content/seed/homework';
import { homeworkDay, lastArrivedDay } from '@/lib/homework/rules';
import { getLearnerProfile } from '@/lib/learner-overview';
import { WORK_FILE_TYPES, workFileProblem } from '@/lib/work/links';
import {
  IMPROVEMENT_GOALS,
  JURISDICTION_COUNTRY,
  JURISDICTION_VALUES,
} from '@/lib/types';
import type { AnswerFeedback, SessionKind } from '@/lib/types';

const GOAL_SLUGS = IMPROVEMENT_GOALS.map((g) => g.slug);

const onboardingSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  careerStage: z.enum(['law_student', 'plt_student', 'graduate', 'junior_lawyer', 'other']),
  goals: z.array(z.string()).min(1).max(GOAL_SLUGS.length),
  dailyGoalMinutes: z.coerce.number().refine((n) => [5, 10, 15, 20].includes(n)),
  country: z.enum(['AU', 'MY']),
  track: z.enum(['general', 'litigation_trainee']),
  homeJurisdiction: z.enum(JURISDICTION_VALUES),
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
    country: formData.get('country'),
    track: formData.get('track') ?? 'general',
    homeJurisdiction: formData.get('homeJurisdiction'),
  });

  if (!parsed.success) {
    return { error: 'Please answer all five questions before continuing.' };
  }

  // The database refuses this pair too. Checked here so the person gets a
  // sentence rather than a constraint name.
  if (parsed.data.track === 'litigation_trainee' && parsed.data.country !== 'MY') {
    return { error: 'The litigation trainee programme is a Malaysian one.' };
  }

  // The form keeps these in step, but the form is not the boundary: this action
  // is a public endpoint and can be called with any pair. A learner recorded as
  // Malaysian with a Victorian home jurisdiction would be shown Malaysian
  // questions labelled with an Australian State, which is exactly the confusion
  // the whole country split exists to prevent.
  const { country } = parsed.data;
  if (JURISDICTION_COUNTRY[parsed.data.homeJurisdiction] !== country) {
    return { error: 'That jurisdiction does not belong to the country you chose.' };
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
      country,
      track: parsed.data.track,
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

export async function beginModule(slug: string): Promise<{ error: string } | undefined> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // The slug comes from the URL, so it is narrowed to a module that exists
  // before it is allowed to choose which questions get served.
  const definition = moduleBySlug(slug);
  if (!definition) redirect('/modules');

  let outcome: { sessionId: string } | { error: string };
  try {
    outcome = await startModuleSession(user.id, definition.domains);
  } catch (caught) {
    outcome = {
      error: caught instanceof Error ? caught.message : 'Could not start the module.',
    };
  }

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

const coachNoteSchema = z.object({
  sessionId: z.string().uuid(),
  questionVersionId: z.string().uuid(),
});

/**
 * Fetched separately from answerQuestion, on purpose: see the note on
 * getCoachNote in the training service for why. Nothing here is more
 * privileged than answerQuestion itself, it is just called later.
 */
export async function requestCoachNote(
  input: z.input<typeof coachNoteSchema>,
): Promise<{ coachNote: string | null } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const parsed = coachNoteSchema.safeParse(input);
  if (!parsed.success) return { error: 'That could not be read.' };

  return getCoachNote(user.id, parsed.data.sessionId, parsed.data.questionVersionId);
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

const homeworkSchema = z.object({
  day: z.coerce.number().int().min(1).max(HOMEWORK_DAYS),
});

export type HomeworkState = { error: string | null };

/**
 * A person recording that they have done one of their homework tasks.
 *
 * The user comes from the session and the task comes from the day number, so
 * the only thing the request decides is which of their own days it is
 * talking about. It cannot tick somebody else's day, name the date, or tick
 * a day that has not come round yet: a placement that looked, at the end,
 * like twenty days done in one afternoon would be worth nothing to a firm
 * reading it.
 *
 * A day already gone is fair game, weekend included: Friday's task is still
 * real on Saturday, and a record that refused to admit that would just teach
 * people to lie about which day it was.
 */
export async function declareHomework(
  _prev: HomeworkState,
  formData: FormData,
): Promise<HomeworkState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const parsed = homeworkSchema.safeParse({ day: formData.get('day') });
  if (!parsed.success) return { error: 'That day could not be read.' };

  const profile = await getLearnerProfile(user.id);
  if (!profile) return { error: 'Your profile could not be found.' };

  const arrived = lastArrivedDay(
    homeworkDay(profile.startsOn, profile.endsOn, profile.timezone),
  );
  if (parsed.data.day > arrived) {
    return { error: 'That day has not come round yet.' };
  }

  const task = homeworkForDay(parsed.data.day);
  if (!task) return { error: 'That day could not be found.' };

  // A learner recording their own homework needs no elevated privilege, go
  // through RLS, exactly as saveOnboarding does above.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('homework_declarations')
    .insert({ user_id: user.id, day: parsed.data.day, task_slug: task.slug });

  // Already there is the outcome that was asked for.
  if (error && error.code !== '23505') {
    return { error: 'That could not be recorded. Please try again.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/homework');
  return { error: null };
}

export type WorkState = { error: string | null; ok?: string };

const claimSchema = z.object({ postId: z.string().uuid() });

/**
 * Putting your name on a piece of work.
 *
 * The user comes from the session and everything else is decided by the
 * database: whether this person may see the post, whether it is a task,
 * whether somebody else got there first. This action only says which post,
 * and reports what the database said back in plain words.
 */
export async function claimWork(_prev: WorkState, formData: FormData): Promise<WorkState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const parsed = claimSchema.safeParse({ postId: formData.get('postId') });
  if (!parsed.success) return { error: 'That piece of work could not be found.' };

  // Their own name, through RLS, as saveOnboarding does.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('work_claims')
    .insert({ post_id: parsed.data.postId, user_id: user.id });

  if (error && error.code !== '23505') {
    // P0001 is a message the trigger wrote in our own words; anything else is
    // a policy saying no, which reads better as a sentence than as a code.
    return {
      error:
        error.code === 'P0001'
          ? error.message
          : 'You cannot put your name on that piece of work.',
    };
  }

  revalidatePath('/work');
  revalidatePath(`/work/${parsed.data.postId}`);
  revalidatePath('/dashboard');
  revalidatePath('/admin/work');
  revalidatePath(`/admin/work/${parsed.data.postId}`);
  return { error: null, ok: 'Your name is on it.' };
}

const submitSchema = z.object({
  postId: z.string().uuid(),
  note: z.string().trim().max(2000),
});

/**
 * Handing work in.
 *
 * The tick box is not decoration. Nothing that identifies a client may reach
 * this platform, and the box is the person saying, on the record, that they
 * took the names out. The database refuses a row without it, and this action
 * refuses first so the person gets a sentence rather than a constraint.
 *
 * The upload goes through the person's own client, so the bucket policy
 * (your own folder, nothing else) is what stands between one intern's work
 * and another's. The path is built from the session here, never read from
 * the form.
 */
export async function submitWork(_prev: WorkState, formData: FormData): Promise<WorkState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const parsed = submitSchema.safeParse({
    postId: formData.get('postId'),
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { error: 'That could not be read.' };

  if (formData.get('declaredClean') !== 'on') {
    return {
      error:
        'Tick the box to confirm there is nothing in the file that identifies a client. ' +
        'If there is, take it out first.',
    };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) return { error: 'Choose a file first.' };
  const problem = workFileProblem(file);
  if (problem) return { error: problem };

  const supabase = await createSupabaseServerClient();
  const path = `submissions/${user.id}/${parsed.data.postId}/${Date.now()}.${WORK_FILE_TYPES[file.type]}`;

  const { error: uploadError } = await supabase.storage
    .from('work')
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: 'The file could not be uploaded. Please try again.' };

  const { error } = await supabase.from('work_submissions').insert({
    post_id: parsed.data.postId,
    user_id: user.id,
    file_path: path,
    file_name: file.name.replace(/[\\/]/g, ' ').trim().slice(0, 200) || 'Handed in',
    note: parsed.data.note,
    declared_clean: true,
  });

  if (error) {
    return { error: 'That could not be handed in. Put your name on the work first.' };
  }

  revalidatePath('/work');
  revalidatePath(`/work/${parsed.data.postId}`);
  revalidatePath('/dashboard');
  revalidatePath('/admin/work');
  revalidatePath(`/admin/work/${parsed.data.postId}`);
  return { error: null, ok: 'Handed in.' };
}

const messageSchema = z.object({
  postId: z.string().uuid(),
  threadUserId: z.string().uuid(),
  body: z.string().trim().min(1, 'Write something first.').max(2000),
});

/**
 * A message on a piece of work: an intern asking their coach for more, or a
 * coach answering. One action for both, through the sender's own client,
 * because the database already knows who may write into which thread: an
 * intern into their own, a coach into any. The sender is always the person
 * signed in. The thread is whichever the form names, and a name the policy
 * does not allow is refused there, not here.
 */
export async function sendWorkMessage(_prev: WorkState, formData: FormData): Promise<WorkState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const parsed = messageSchema.safeParse({
    postId: formData.get('postId'),
    threadUserId: formData.get('threadUserId') || user.id,
    body: formData.get('body') ?? '',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'That could not be sent.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('work_messages').insert({
    post_id: parsed.data.postId,
    thread_user_id: parsed.data.threadUserId,
    sender_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { error: 'That could not be sent.' };

  revalidatePath('/work');
  revalidatePath(`/work/${parsed.data.postId}`);
  revalidatePath('/dashboard');
  revalidatePath('/admin/work');
  revalidatePath(`/admin/work/${parsed.data.postId}`);
  return { error: null, ok: 'Sent.' };
}
