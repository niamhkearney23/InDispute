'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { HOLD_CHOICES, dueDateFrom, type HoldMonths } from '@/lib/review/expiry';

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
  /**
   * How long this sign-off holds, in months. Only meaningful when verifying.
   *
   * Constrained to the three offered values rather than taken as any number:
   * this comes from a form, and a request that could name its own interval
   * could sign something off until 2099, which is the same as never checking it
   * again while looking as though somebody had decided otherwise.
   */
  holdsForMonths: z
    .union([z.literal(HOLD_CHOICES[0]), z.literal(HOLD_CHOICES[1]), z.literal(HOLD_CHOICES[2])])
    .optional(),
});

export type ReviewResult = { ok: true } | { ok: false; error: string };

export async function recordReviewDecision(
  input: z.input<typeof decisionSchema>,
): Promise<ReviewResult> {
  const adminId = await checkAdmin();
  if (!adminId) return { ok: false, error: 'Not authorised.' };

  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'That decision could not be read.' };

  const { kind, id, decision, note, holdsForMonths } = parsed.data;

  if (decision === 'flag' && !note) {
    return { ok: false, error: 'Say what is wrong with it, a flag without a note is a dead end.' };
  }

  const db = createServiceClient();
  const now = new Date().toISOString();

  // Twelve months when the form did not say. The database has the same backstop
  // in a trigger, so a verified row cannot exist without an expiry either way.
  const reviewDueOn =
    decision === 'verify' ? dueDateFrom((holdsForMonths ?? 12) as HoldMonths) : null;

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
            review_due_on: reviewDueOn,
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
            review_due_on: reviewDueOn,
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

/**
 * Put withdrawn content back in front of learners.
 *
 * The counterpart to `withdrawAllUnverified`, and the reason it exists is that
 * without it that action is a one-way door. Withdrawing sets everything
 * unverified to `requires_review`; the only way back was `publishAllVerified`,
 * which by design skips anything unverified. So a single click could take two
 * hundred items off the app with no way to restore them short of signing off
 * all two hundred, while the button describing itself as reversible sat next to
 * it. That was misleading and this is the fix.
 *
 * What this deliberately does not do is touch verification. Nothing here claims
 * anybody has read anything; it restores the state the app ships in, where seed
 * content is served while it waits to be checked, and the standing warning that
 * unverified material is live goes back to telling the truth about it.
 *
 * Flagged items are left alone. A flag is a person saying an item is wrong, and
 * restoring those in bulk would undo somebody's considered decision with a
 * button meant for undoing an accident.
 */
export async function restoreAllWithdrawn(): Promise<ReviewResult> {
  const adminId = await checkAdmin();
  if (!adminId) return { ok: false, error: 'Not authorised.' };

  const db = createServiceClient();

  // A question's flag lives on its current version, not on the question, so
  // the exclusion has to be looked up rather than expressed as a filter on the
  // row being updated. Getting this wrong would restore the items a person had
  // specifically said were wrong, which is the one outcome this must not have.
  const { data: flagged } = await db
    .from('question_versions')
    .select('question_id')
    .eq('is_current', true)
    .eq('review_flagged', true);

  const flaggedIds = (flagged ?? []).map((v) => v.question_id as string);

  let restoreQuestions = db
    .from('questions')
    .update({ status: 'published' })
    .eq('status', 'requires_review');

  if (flaggedIds.length > 0) {
    restoreQuestions = restoreQuestions.not('id', 'in', `(${flaggedIds.join(',')})`);
  }

  const { error: questionError } = await restoreQuestions;
  if (questionError) return { ok: false, error: questionError.message };

  const { error: factError } = await db
    .from('daily_facts')
    .update({ status: 'published' })
    .eq('status', 'requires_review')
    .eq('review_flagged', false);

  if (factError) return { ok: false, error: factError.message };

  revalidatePath('/admin/review');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { ok: true };
}
