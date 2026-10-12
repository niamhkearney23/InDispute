'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin, checkReviewer } from '@/lib/admin/guard';
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
  /**
   * The version the reviewer was shown. A sign-off is a statement about the
   * words somebody read, so it lands on that version or not at all: if the
   * question was edited while the card was open, the current version is one
   * they never saw.
   */
  versionId: z.string().uuid().optional(),
  /**
   * When what the reviewer read was last changed, as the card was given it.
   * Explanations and facts are corrected in place, so the version alone does
   * not say which words were on the screen; the update only lands while this
   * still matches, in the same statement.
   */
  seen: z.string().min(1).max(64),
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

const CHANGED = 'This changed while you were reading it. Read it again.';

export async function recordReviewDecision(
  input: z.input<typeof decisionSchema>,
): Promise<ReviewResult> {
  // A coach's decision, not an administrator's. Signing an item off is the
  // judgement the role exists for, and it is recorded against them by name.
  const adminId = await checkReviewer();
  if (!adminId) return { ok: false, error: 'Not authorised.' };

  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'That decision could not be read.' };

  const { kind, id, versionId, seen, decision, note, holdsForMonths } = parsed.data;

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
    const { data: current } = await db
      .from('question_versions')
      .select('id, created_by')
      .eq('question_id', id)
      .eq('is_current', true)
      .maybeSingle();
    if (!current) return { ok: false, error: 'That question could not be found.' };
    if (!versionId || current.id !== versionId) {
      return {
        ok: false,
        error:
          'This question was changed while you had it open. Reload the page to read the new wording before deciding.',
      };
    }
    // The role split exists so that nobody signs off their own rewrite with
    // the record showing an ordinary review. An administrator is a coach too,
    // so this is checked here rather than assumed from the role.
    if (decision === 'verify' && current.created_by === adminId) {
      return {
        ok: false,
        error: 'You wrote this version, so somebody else has to sign it off.',
      };
    }

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

    const { data: saved, error } = await db
      .from('question_versions')
      .update(patch)
      .eq('id', current.id)
      .eq('is_current', true)
      .eq('updated_at', seen)
      .select('id');

    if (error) return { ok: false, error: error.message };
    // Nothing updated means the words moved on since the card was drawn.
    // Reporting that as done would mark the question verified over a
    // sign-off that never landed.
    if (!saved || saved.length === 0) return { ok: false, error: CHANGED };

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
    if (decision === 'verify') {
      const { data: fact } = await db
        .from('daily_facts')
        .select('created_by')
        .eq('id', id)
        .maybeSingle();
      if (fact?.created_by && fact.created_by === adminId) {
        return {
          ok: false,
          error: 'You wrote this brief, so somebody else has to sign it off.',
        };
      }
    }
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

    const { data: saved, error } = await db
      .from('daily_facts')
      .update(patch)
      .eq('id', id)
      .eq('updated_at', seen)
      .select('id');
    if (error) return { ok: false, error: error.message };
    if (!saved || saved.length === 0) return { ok: false, error: CHANGED };
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
