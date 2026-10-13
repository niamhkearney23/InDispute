'use server';

import { revalidatePath } from 'next/cache';
import { checkReviewer } from '@/lib/admin/guard';
import { referenceByKey, referenceHash } from '@/lib/content/wording';
import { signOffReference as recordSignOff } from '@/lib/content/signoff';

export interface ReferenceSignOffState {
  error: string | null;
  ok?: string;
}

/**
 * Signing off a court map or an essay topic: a lawyer saying it is right, as
 * it stands, under their own name. The same judgement and the same guard as
 * signing off a lesson. The form carries the fingerprint of the wording the
 * page showed, so something changed after the page was opened is not signed
 * off unread.
 */
export async function signOffReference(
  _prev: ReferenceSignOffState,
  formData: FormData,
): Promise<ReferenceSignOffState> {
  const reviewerId = await checkReviewer();
  if (!reviewerId) return { error: 'You are not signed in as a coach or administrator.' };
  if (formData.get('confirm') !== 'yes') {
    return { error: 'Tick the box to say you have read all of it.' };
  }
  const item = referenceByKey(String(formData.get('key') ?? ''));
  if (!item) return { error: 'That could not be found.' };
  if (formData.get('hash') !== referenceHash(item)) {
    return { error: 'This has changed since the page was opened. Reload it and read it again.' };
  }
  if (!(await recordSignOff(item, reviewerId))) {
    return { error: 'That could not be saved. Please try again.' };
  }
  revalidatePath('/admin/reference');
  revalidatePath(`/admin/reference/${item.key}`);
  revalidatePath('/courts');
  revalidatePath('/dashboard');
  return { error: null, ok: 'Signed off.' };
}
