'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';

export type AvatarState = { error: string | null };

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * One file per person, at `{user_id}/avatar.<ext>`, upsert on re-upload. The
 * bucket enforces the same type and size limit again on its side; checking
 * here as well means a rejected file gets a plain-language message instead of
 * a storage error nobody asked to read.
 */
export async function uploadAvatar(
  _prev: AvatarState,
  formData: FormData,
): Promise<AvatarState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const file = formData.get('avatar');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a photo first.' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'That needs to be a JPEG, PNG or WEBP image.' };
  }
  if (file.size > MAX_BYTES) {
    return { error: 'That photo is larger than 5MB. Try a smaller one.' };
  }

  const supabase = await createSupabaseServerClient();
  const path = `${user.id}/avatar.${EXTENSION[file.type]}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path);

  // A query string the storage path does not carry, so a browser that already
  // has last week's photo cached under this exact URL fetches the new one
  // instead of showing it stale.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
    .eq('id', user.id);
  if (profileError) return { error: profileError.message };

  revalidatePath('/dashboard');
  revalidatePath('/account');
  return { error: null };
}

// Both arguments are the shape useActionState requires of every action it
// drives, whether or not this one reads them.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function removeAvatar(_prev: AvatarState, _formData: FormData): Promise<AvatarState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const supabase = await createSupabaseServerClient();

  // Best effort: all three extensions, since an earlier upload may have used a
  // different one than whichever this person last chose.
  await supabase.storage
    .from('avatars')
    .remove(['jpg', 'png', 'webp'].map((ext) => `${user.id}/avatar.${ext}`));

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/account');
  return { error: null };
}
