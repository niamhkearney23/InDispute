'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
import { conversationOfMessage, redactMessage } from '@/lib/tutor/service';

export interface RedactState {
  error: string | null;
}

/**
 * Blanking one tutor message: somebody typed a client's name, or the AI
 * repeated it. An administrator only, because it changes the record a
 * coach reads. The words are replaced, never the fact that something was
 * said, and the database keeps who did it and when.
 */
export async function redactTutorMessage(
  _prev: RedactState,
  formData: FormData,
): Promise<RedactState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };
  const id = z.string().uuid().safeParse(formData.get('messageId'));
  if (!id.success) return { error: 'That message could not be found.' };
  const conversationId = await conversationOfMessage(id.data);
  if (!conversationId) return { error: 'That message could not be found.' };
  if (!(await redactMessage(id.data, adminId))) {
    return { error: 'That could not be removed. It may have been removed already.' };
  }
  revalidatePath(`/admin/tutor/${conversationId}`);
  revalidatePath(`/tutor/${conversationId}`);
  return { error: null };
}
