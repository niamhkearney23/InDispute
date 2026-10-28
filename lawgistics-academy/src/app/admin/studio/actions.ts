'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkReviewer } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { logStudioAccess, sharedAttempt } from '@/lib/studio/service';
import { CommentDecisionsSchema, ScoreOverridesSchema } from '@/lib/studio/rules';
import type { AdminState } from '../actions';

/**
 * A coach's review of a recording a learner shared (0053). It is the
 * coach's own judgement under their own name, kept apart from the AI's
 * feedback: it never changes what the AI wrote, it is added beside it. A
 * review is never edited; a second thought is a second review.
 *
 * A lawyer's judgement about a person's advocacy, so checkReviewer: an
 * administrator or a coach, never a firm administrator on that flag alone.
 */

const schema = z.object({
  attemptId: z.string().uuid(),
  feedback: z.string().trim().min(1, 'Write your feedback first.').max(6000, 'Keep it under 6,000 characters.'),
  scoreOverrides: ScoreOverridesSchema,
  commentDecisions: CommentDecisionsSchema,
  followUp: z
    .string()
    .regex(/^[a-z0-9-]{3,80}$/)
    .nullable(),
});

function parseJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== 'string' || value === '') return {};
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function reviewStudioAttempt(_state: AdminState, formData: FormData): Promise<AdminState> {
  const reviewerId = await checkReviewer();
  if (!reviewerId) return { error: 'You are not signed in as a coach or administrator.' };

  const followUp = formData.get('followUp');
  const parsed = schema.safeParse({
    attemptId: formData.get('attemptId'),
    feedback: formData.get('feedback'),
    scoreOverrides: parseJson(formData.get('scoreOverrides')),
    commentDecisions: parseJson(formData.get('commentDecisions')),
    followUp: typeof followUp === 'string' && followUp !== '' ? followUp : null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Something in the form is not valid.' };
  }
  const values = parsed.data;

  const attempt = await sharedAttempt(values.attemptId);
  if (!attempt) return { error: 'That recording is no longer shared with the coaches.' };
  if (attempt.userId === reviewerId) return { error: 'Nobody reviews their own recording.' };

  const { error } = await createServiceClient().from('studio_reviews').insert({
    attempt_id: attempt.id,
    // Taken from the session, never from the form.
    reviewer_id: reviewerId,
    feedback: values.feedback,
    score_overrides: values.scoreOverrides,
    ai_comment_decisions: values.commentDecisions,
    follow_up_exercise_key: values.followUp,
  });
  if (error) {
    console.error('[studio] review could not be saved', error);
    return { error: 'That could not be saved. The learner may have stopped sharing it.' };
  }
  await logStudioAccess(attempt.id, reviewerId, 'reviewed');

  revalidatePath('/admin/studio');
  revalidatePath(`/admin/studio/${attempt.id}`);
  revalidatePath(`/studio/attempts/${attempt.id}`);
  return { error: null, ok: 'Saved. The learner sees it beside the AI feedback, under your name.' };
}
