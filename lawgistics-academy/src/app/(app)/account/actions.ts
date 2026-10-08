'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { strictCartoon } from '@/lib/avatar/cartoon';

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

export type CartoonState = { error: string | null; ok?: string };

/**
 * Saving the cartoon you built. Only choices from the app's own lists are
 * accepted, all of them or nothing, through your own session, so it can only
 * ever be your own profile.
 */
export async function saveCartoon(
  _prev: CartoonState,
  formData: FormData,
): Promise<CartoonState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  let raw: unknown = null;
  try {
    raw = JSON.parse(String(formData.get('style') ?? ''));
  } catch {
    raw = null;
  }
  const style = strictCartoon(raw);
  if (!style) return { error: 'That cartoon could not be saved. Reload the page and try again.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_style: style })
    .eq('id', user.id);
  if (error) return { error: 'That cartoon could not be saved. Please try again.' };

  revalidatePath('/', 'layout');
  return { error: null, ok: 'Saved. Your cartoon now shows beside your name.' };
}

// The shape useActionState requires, as removeAvatar.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function clearCartoon(_prev: CartoonState, _formData: FormData): Promise<CartoonState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_style: null })
    .eq('id', user.id);
  if (error) return { error: 'That could not be removed. Please try again.' };

  revalidatePath('/', 'layout');
  return { error: null, ok: 'Your cartoon is gone.' };
}

export type PasswordState = { error: string | null };

const passwordSchema = z
  .object({
    // Ten, the same as joining by invitation: one rule for one firm's system.
    password: z.string().min(10, 'Use at least 10 characters.').max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'The two passwords do not match.' });

/**
 * Choosing your own password.
 *
 * Through the person's own session, so it can only ever be their own
 * account. The first-password flag is then cleared by the server, and only
 * once the new password is saved: since 0040 the database refuses the flag
 * coming off any other way, so it cannot be cleared without a new password.
 */
export async function changePassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const parsed = passwordSchema.safeParse({
    password: formData.get('password') ?? '',
    confirm: formData.get('confirm') ?? '',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'That password could not be used.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      error: /same/i.test(error.message)
        ? 'That is the password you already have. Choose a different one.'
        : 'That password could not be saved. Please try again.',
    };
  }

  const { error: flagError } = await createServiceClient()
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', user.id);
  // Left unchecked, a failure here put the same "choose your password" screen
  // back in front of somebody who had just done it, with no reason given.
  if (flagError) {
    return {
      error:
        'Your new password is saved, but the app could not record it. Reload the page and sign in with the new one.',
    };
  }

  revalidatePath('/dashboard');
  revalidatePath('/account');
  redirect('/dashboard');
}

export type LeaderboardState = { error: string | null; ok?: string };

/**
 * Taking yourself off the firm's leaderboard, or putting yourself back.
 * Your own row, through your own session, and nobody else's business.
 */
export async function setLeaderboardOptOut(
  _prev: LeaderboardState,
  formData: FormData,
): Promise<LeaderboardState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const optOut = formData.get('optOut') === 'on';
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({ leaderboard_opt_out: optOut })
    .eq('id', user.id);
  if (error) return { error: 'That could not be saved. Please try again.' };

  revalidatePath('/account');
  revalidatePath('/dashboard');
  return {
    error: null,
    ok: optOut ? 'You are off the leaderboard.' : 'You are back on the leaderboard.',
  };
}
