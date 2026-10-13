'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { runErasure } from '@/lib/account/erasure';
import { adminErasureMessage } from '@/lib/account/erasure-rules';
import type { AdminState } from '../actions';

/**
 * Admin, Deletions (0045). Every action here is an administrator's alone,
 * never a coach's or the firm administrator's: they finish, review and close
 * the deletion of a person's account, which cannot be undone. Each asks
 * `checkAdmin` before anything else, and the database functions they call
 * check again that the id they are given belongs to an administrator.
 */

const uuid = z.string().uuid();

function refresh(userId: string) {
  revalidatePath('/admin/deletions');
  revalidatePath(`/admin/deletions/${userId}`);
}

/** Runs whatever is unfinished of one deletion, now. */
export async function retryErasure(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const id = uuid.safeParse(formData.get('userId'));
  if (!id.success) return { error: 'That deletion could not be found.' };

  const db = createServiceClient();
  const { data: job } = await db
    .from('account_erasures')
    .select('user_id')
    .eq('user_id', id.data)
    .maybeSingle();
  // Retry finishes a deletion somebody started; it never starts one.
  if (!job) return { error: 'That deletion could not be found.' };

  const said = adminErasureMessage(await runErasure(id.data));
  refresh(id.data);
  return said.ok ? { error: null, ok: said.text } : { error: said.text };
}

const decisionSchema = z.object({
  userId: uuid,
  itemId: uuid,
  decision: z.enum(['redact', 'retain']),
  reason: z.string().trim().max(500),
});

/** Redact or retain one certification record, with a reason to retain. */
export async function decideErasureReview(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const parsed = decisionSchema.safeParse({
    userId: formData.get('userId'),
    itemId: formData.get('itemId'),
    decision: formData.get('decision'),
    reason: formData.get('reason') ?? '',
  });
  if (!parsed.success) return { error: 'Choose redact or retain.' };
  if (parsed.data.decision === 'retain' && parsed.data.reason.length < 3) {
    return { error: 'Say why it is retained, for example "regulatory record".' };
  }

  const { error } = await createServiceClient().rpc('decide_erasure_review_item', {
    item: parsed.data.itemId,
    decision: parsed.data.decision,
    reason: parsed.data.decision === 'retain' ? parsed.data.reason : null,
    by_whom: adminId,
  });
  if (error) {
    console.error('deciding a review item failed:', error.message);
    return { error: 'That could not be saved. It may already have been decided: reload the page.' };
  }
  refresh(parsed.data.userId);
  return { error: null, ok: parsed.data.decision === 'redact' ? 'Redacted.' : 'Retained, with your reason.' };
}

const redactSchema = z.object({
  userId: uuid,
  recordId: uuid,
  kind: z.enum(['message', 'comment']),
});

/** Replaces one work-board message or comment found in the review with a notice. */
export async function redactIdentifyingRecord(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const parsed = redactSchema.safeParse({
    userId: formData.get('userId'),
    recordId: formData.get('recordId'),
    kind: formData.get('kind'),
  });
  if (!parsed.success) return { error: 'That record could not be found.' };

  const { data, error } = await createServiceClient().rpc('redact_work_board_record', {
    kind: parsed.data.kind,
    record: parsed.data.recordId,
    by_whom: adminId,
  });
  if (error) {
    console.error('redacting a record failed:', error.message);
    return { error: 'That could not be removed. Please try again.' };
  }
  refresh(parsed.data.userId);
  return data
    ? { error: null, ok: 'Removed. It now reads as removed by an administrator.' }
    : { error: null, ok: 'It had already been removed.' };
}

/** Closes the review once every certification record is decided; clears the former name. */
export async function closeErasureReview(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const id = uuid.safeParse(formData.get('userId'));
  if (!id.success) return { error: 'That deletion could not be found.' };

  const { error } = await createServiceClient().rpc('close_erasure_review', {
    uid: id.data,
    by_whom: adminId,
  });
  if (error) {
    return {
      error: /decided/.test(error.message)
        ? 'Every certification record has to be redacted or retained before the review closes.'
        : 'The review could not be closed. Please try again.',
    };
  }
  refresh(id.data);
  return { error: null, ok: 'Review closed. Their former name has been cleared.' };
}
