'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
import { eraseAccount } from '@/lib/account/erasure';
import { CONFIRM_WORD, confirmsWord } from '@/lib/account/erasure-rules';

export interface EraseState {
  error: string | null;
  ok?: string;
}

/**
 * Deleting a learner's account for them (0043): somebody who asked the firm
 * rather than pressing the button themselves, or who can no longer sign in.
 * An administrator only, never a coach or the firm's administrator, because
 * it cannot be undone. The same erasure as the learner's own, and the
 * database refuses a staff account whoever asks.
 */
export async function eraseLearner(_prev: EraseState, formData: FormData): Promise<EraseState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const id = z.string().uuid().safeParse(formData.get('learnerId'));
  if (!id.success) return { error: 'That person could not be found.' };
  if (!confirmsWord(formData.get('confirmWord'))) {
    return { error: `Type ${CONFIRM_WORD} to delete this account.` };
  }

  const result = await eraseAccount(id.data);
  if (!result.ok) return { error: result.error };

  revalidatePath('/admin/trainees');
  revalidatePath(`/admin/trainees/${id.data}`);
  revalidatePath('/admin/reports');
  return {
    error: null,
    ok:
      result.filesLeft > 0
        ? `Deleted, but ${result.filesLeft} stored file${result.filesLeft === 1 ? '' : 's'} could not be removed. Press the button again to try once more.`
        : 'Deleted. The account can no longer be signed in to.',
  };
}
