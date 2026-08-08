'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { acknowledgeFirmModule } from '@/lib/firm/service';

export type AcknowledgeState = { error: string | null };

/**
 * Record that this person has read the firm's module.
 *
 * The user comes from the session and the version comes from the database.
 * Neither is taken from the request, so the only thing the browser gets to
 * decide is which module, and the only thing it can do is say it read one that
 * was published to it.
 */
export async function acknowledge(
  _state: AcknowledgeState,
  formData: FormData,
): Promise<AcknowledgeState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const profile = await getLearnerProfile(user.id);
  if (!profile) return { error: 'You are not signed in.' };

  const slug = String(formData.get('slug') ?? '');
  if (!slug) return { error: 'That module could not be found.' };

  const result = await acknowledgeFirmModule(user.id, profile.country, slug);
  if (result.error) return result;

  revalidatePath(`/modules/firm/${slug}`);
  revalidatePath('/modules');
  revalidatePath('/dashboard');
  return { error: null };
}
