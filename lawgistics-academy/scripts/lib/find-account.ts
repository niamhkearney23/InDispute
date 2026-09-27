import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The sign-in account for an email address, found through the login system
 * itself.
 *
 * Not through profiles.email. That column was, for a while, something a
 * person could change about themselves, so looking a person up by it could
 * find somebody else who had simply typed that address in: and these scripts
 * hand out staff rights. The login system's own record of the address is the
 * one a person proves by signing in with it.
 */
export async function findAccountId(db: SupabaseClient, email: string): Promise<string | null> {
  const wanted = email.trim().toLowerCase();
  for (let page = 1; page < 1000; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((u) => (u.email ?? '').toLowerCase() === wanted);
    if (match) return match.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}
