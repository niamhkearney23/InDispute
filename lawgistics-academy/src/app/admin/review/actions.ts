'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * The three outcomes of reviewing an item.
 *
 * Verifying is a statement by a named person, recorded against the version, that
 * the legal content is correct. Flagging takes the item out of circulation and
 * records why. Retiring removes it for good.
 */

const decisionSchema = z.object({
  kind: z.enum(['question', 'fact']),
  id: z.string().uuid(),
  decision: z.enum(['verify', 'flag', 'retire']),
  note: z.string().trim().max(2000).optional(),
});

export type ReviewResult = { ok: true } | { ok: false; error: string };

export async function recordReviewDecision(
  input: z.input<typeof decisionSchema>,
): Promise<ReviewResult> {
  const adminId = await checkAdmin();
  if (!adminId) return { ok: false, error: 'Not authorised.' };

  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'That decision could not be read.' };

  const { kind, id, decision, note } = parsed.data;

  if (decision === 'flag' && !note) {
    return { ok: false, error: 'Say what is wrong with it, a flag without a note is a dead end.' };
  }

  const db = createServiceClient();
  const now = new Date().toISOString();

  const reviewFields = {
    review_note: note ?? null,
    review_flagged: decision === 'flag',
    reviewed_by: adminId,
    reviewed_at: now,
  };

  if (kind === 'question') {
    const patch =
      decision === 'verify'
        ? {
            ...reviewFields,
            verification_status: 'human_verified' as const,
            verified_by: adminId,
            verified_at: now,
          }
        : { ...reviewFields, verification_status: 'requires_review' as const };

    const { error } = await db
      .from('question_versions')
      .update(patch)
      .eq('question_id', id)
      .eq('is_current', true);

    if (error) return { ok: false, error: error.message };

    // The question's own status follows the decision. Verifying does not publish
    // on its own, publishing stays a separate, deliberate act.
    if (decision === 'retire') {
      await db
        .from('questions')
        .update({ status: 'retired', retired_at: now })
        .eq('id', id);
    } else if (decision === 'verify') {
      await db
        .from('questions')
        .update({ status: 'verified' })
        .eq('id', id)
        .neq('status', 'published');
    }
    // Flagging withdraws a published question automatically, by database trigger.
  } else {
    const patch =
      decision === 'verify'
        ? {
            ...reviewFields,
            verification_status: 'human_verified' as const,
            verified_by: adminId,
            verified_at: now,
            status: 'verified' as const,
          }
        : decision === 'retire'
          ? { ...reviewFields, verification_status: 'requires_review' as const, status: 'retired' as const }
          : { ...reviewFields, verification_status: 'requires_review' as const };

    const { error } = await db.from('daily_facts').update(patch).eq('id', id);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath('/admin/review');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Publishes everything a person has verified. Safe in a way that a bulk
 * *verify* would not be: it acts only on items that already carry a named
 * sign-off, so it cannot be used to wave content through unread.
 */
export async function publishAllVerified(): Promise<ReviewResult> {
  const adminId = await checkAdmin();
  if (!adminId) return { ok: false, error: 'Not authorised.' };

  const db = createServiceClient();

  const { data: verifiedVersions } = await db
    .from('question_versions')
    .select('question_id')
    .eq('is_current', true)
    .eq('verification_status', 'human_verified')
    .eq('review_flagged', false);

  const ids = (verifiedVersions ?? []).map((v) => v.question_id as string);

  if (ids.length > 0) {
    const { error } = await db
      .from('questions')
      .update({ status: 'published' })
      .in('id', ids)
      .neq('status', 'retired');
    if (error) return { ok: false, error: error.message };
  }

  const { error: factError } = await db
    .from('daily_facts')
    .update({ status: 'published' })
    .eq('verification_status', 'human_verified')
    .eq('review_flagged', false)
    .neq('status', 'retired');

  if (factError) return { ok: false, error: factError.message };

  revalidatePath('/admin/review');
  revalidatePath('/admin');
  return { ok: true };
}

/**
 * Takes every unverified item out of circulation at once.
 *
 * The honest button: if you are not comfortable with unreviewed content being
 * in front of learners, this is one click rather than a hundred.
 */
export async function withdrawAllUnverified(): Promise<ReviewResult> {
  const adminId = await checkAdmin();
  if (!adminId) return { ok: false, error: 'Not authorised.' };

  const db = createServiceClient();

  const { data: unverified } = await db
    .from('question_versions')
    .select('question_id')
    .eq('is_current', true)
    .neq('verification_status', 'human_verified');

  const ids = (unverified ?? []).map((v) => v.question_id as string);

  if (ids.length > 0) {
    const { error } = await db
      .from('questions')
      .update({ status: 'requires_review' })
      .in('id', ids)
      .eq('status', 'published');
    if (error) return { ok: false, error: error.message };
  }

  const { error: factError } = await db
    .from('daily_facts')
    .update({ status: 'requires_review' })
    .neq('verification_status', 'human_verified')
    .eq('status', 'published');

  if (factError) return { ok: false, error: factError.message };

  revalidatePath('/admin/review');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { ok: true };
}
