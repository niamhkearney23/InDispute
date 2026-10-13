'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
import { runErasure } from '@/lib/account/erasure';
import { CONFIRM_WORD, adminErasureMessage, confirmsWord } from '@/lib/account/erasure-rules';

export interface EraseState {
  error: string | null;
  ok?: string;
}

/**
 * Deleting a learner's account for them (0043, 0045): somebody who asked the
 * firm rather than pressing the button themselves, or who can no longer sign
 * in. An administrator only, never a coach or the firm's administrator,
 * because it cannot be undone. The same erasure as the learner's own, and the
 * database refuses a staff account whoever asks.
 *
 * "Deleted" is said only when every step finished. Otherwise the message
 * says what is outstanding, and the job waits at Admin, Deletions and for the
 * daily retry.
 */
export async function eraseLearner(_prev: EraseState, formData: FormData): Promise<EraseState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const id = z.string().uuid().safeParse(formData.get('learnerId'));
  if (!id.success) return { error: 'That person could not be found.' };
  if (!confirmsWord(formData.get('confirmWord'))) {
    return { error: `Type ${CONFIRM_WORD} to delete this account.` };
  }

  const outcome = await runErasure(id.data, { requestedBy: adminId });
  const said = adminErasureMessage(outcome);

  if (outcome.kind !== 'refused') {
    revalidatePath('/admin/trainees');
    revalidatePath(`/admin/trainees/${id.data}`);
    revalidatePath('/admin/reports');
    revalidatePath('/admin/deletions');
  }
  return said.ok ? { error: null, ok: said.text } : { error: said.text };
}
