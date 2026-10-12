import 'server-only';

import { randomBytes } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { ERASED_BAN, erasedEmail } from './erasure-rules';

/**
 * A password nobody knows: 64 characters drawn from 48 random bytes. The
 * auth server refuses a password longer than 72 characters, so 64 random
 * bytes written out in full (88 characters in base64) would be turned away.
 */
export function unguessablePassword(): string {
  return randomBytes(48).toString('base64url');
}

/**
 * Deleting an account (0043). The owner's decision is to anonymise rather
 * than destroy: the firm keeps the answers, homework, work handed in,
 * matters, onboarding records and certificates, linked to an id that no
 * longer leads to a person, and everything that is the person goes. The
 * migration's header lists both halves.
 *
 * Service role throughout, so every caller has already decided whose
 * account this is: the person's own session, or an administrator. Nothing
 * here takes an id from a form.
 *
 * Three steps, in the order that keeps a failure safe to retry:
 *
 *   1. the database, in one transaction (erase_account): the profile
 *      cleared, the tutor conversations, wrong-code attempts and an
 *      undecided code request deleted, recordings emptied. If this fails
 *      nothing has changed.
 *   2. sign-in: an address that cannot receive mail, a password nobody
 *      knows, and a ban, so the account can never be signed in to again.
 *   3. the files: the photo, and every matter recording, by the paths the
 *      database just cleared and by listing the person's own folders, so a
 *      file a later upload replaced goes too.
 *
 * erase_account changes nothing on a second run, so after a failure at
 * step 2 or 3 an administrator can press the button again.
 */

export type ErasureResult = { ok: true; filesLeft: number } | { ok: false; error: string };

/** Every file in a folder and the folders inside it, one level down. */
async function filesUnder(bucket: string, folder: string): Promise<string[]> {
  const store = createServiceClient().storage.from(bucket);
  const { data, error } = await store.list(folder, { limit: 1000 });
  if (error || !data) return [];
  const files: string[] = [];
  for (const entry of data) {
    // Storage lists a folder as an entry with no id.
    if (entry.id) {
      files.push(`${folder}/${entry.name}`);
      continue;
    }
    const { data: inner } = await store.list(`${folder}/${entry.name}`, { limit: 1000 });
    for (const file of inner ?? []) {
      if (file.id) files.push(`${folder}/${entry.name}/${file.name}`);
    }
  }
  return files;
}

async function removeAll(bucket: string, paths: string[]): Promise<number> {
  if (paths.length === 0) return 0;
  const { error } = await createServiceClient().storage.from(bucket).remove(paths);
  return error ? paths.length : 0;
}

export async function eraseAccount(userId: string): Promise<ErasureResult> {
  const db = createServiceClient();

  const { data: profile } = await db
    .from('profiles')
    .select('is_admin, is_coach, is_firm_admin')
    .eq('id', userId)
    .maybeSingle();
  if (!profile) return { ok: false, error: 'That account could not be found.' };
  // The database refuses this too; asking first gives a sentence instead.
  if (profile.is_admin || profile.is_coach || profile.is_firm_admin) {
    return {
      ok: false,
      error: 'A staff account is not deleted here. Take the staff role off at Admin, Staff first.',
    };
  }

  const { data: cleared, error } = await db.rpc('erase_account', { uid: userId });
  if (error) {
    console.error('erase_account failed:', error.message);
    return { ok: false, error: 'The account could not be deleted. Nothing was changed. Please try again.' };
  }

  const { error: authError } = await db.auth.admin.updateUserById(userId, {
    email: erasedEmail(userId),
    email_confirm: true,
    password: unguessablePassword(),
    ban_duration: ERASED_BAN,
    // A key set to null is removed. The name typed at sign-up lives here as
    // well as on the profile.
    user_metadata: { display_name: null },
  });
  if (authError) {
    console.error('closing sign-in for an erased account failed:', authError.message);
    return {
      ok: false,
      error:
        'The details were removed, but signing in could not be closed off. Please try again: it is safe to.',
    };
  }

  const recordings = new Set<string>([
    ...((cleared as string[] | null) ?? []),
    ...(await filesUnder('matter-recordings', userId)),
  ]);
  const filesLeft =
    (await removeAll('avatars', await filesUnder('avatars', userId))) +
    (await removeAll('matter-recordings', [...recordings]));
  if (filesLeft > 0) console.error(`erasure left ${filesLeft} stored file(s) for ${userId}`);

  return { ok: true, filesLeft };
}
