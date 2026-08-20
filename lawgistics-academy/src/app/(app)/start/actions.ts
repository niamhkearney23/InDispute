'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { declareStep } from '@/lib/onboarding/service';

export type DeclareState = { error: null | string; slug?: string };

/**
 * A person recording that they have done one of the things on their list.
 *
 * The user comes from the session and the step is looked up against what is
 * actually published to them, so the only thing a request decides is which of
 * their own items it is talking about. It cannot declare on anybody else's
 * behalf and it cannot name the date.
 */
export async function declare(
  _state: DeclareState,
  formData: FormData,
): Promise<DeclareState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const profile = await getLearnerProfile(user.id);
  if (!profile) return { error: 'You are not signed in.' };

  const slug = String(formData.get('slug') ?? '');
  if (!slug) return { error: 'That item could not be found.' };

  const result = await declareStep(user.id, profile.country, slug);
  if (result.error) return { error: result.error, slug };

  revalidatePath('/start');
  revalidatePath('/dashboard');
  return { error: null };
}
