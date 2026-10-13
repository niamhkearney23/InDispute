import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { publicEnv, requirePublicEnv } from '@/lib/env';
import { erasedByCheck, signInRefused } from '@/lib/auth/refused';
import { signedInUseOpen, siteAccess } from '@/lib/security/site-access';

type CookiesToSet = Array<{ name: string; value: string; options: CookieOptions }>;

/**
 * Request-scoped client that carries the signed-in user's identity, so every
 * query it makes is subject to Row Level Security. This is the default, reach
 * for the service client only where a genuine privilege escalation is required.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = requirePublicEnv();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Whether the signed-in person's account has been deleted, asked of the
 * database with their own session (0045). One primary key lookup, asked at
 * most once per request.
 */
const accountErased = cache(async (): Promise<boolean> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('caller_erased');
  return erasedByCheck(data, error);
});

/**
 * The authenticated user, or null. Always verified against the auth server.
 *
 * Returns null rather than throwing when Supabase is not configured, so a fresh
 * clone renders the landing page and the setup instructions instead of a stack
 * trace.
 *
 * A deleted account counts as nobody, so every action, all of which start
 * here, refuses it even while its last token is valid. Two things say so: the
 * auth server's ban (0043), and the profile's `erased_at` (0045), which is
 * set even when the call to the auth server failed and the ban never
 * happened.
 *
 * While the owner has closed the whole site (`SITE_ACCESS=closed`, or any
 * value it does not recognise; src/lib/security/site-access.ts) it answers
 * nobody before reading anything, so every server action refuses, wherever
 * it was posted. The middleware shows the maintenance page as well; this is
 * the check that holds for an action posted to an address it lets through.
 */
export async function getCurrentUser() {
  if (!signedInUseOpen(siteAccess())) return null;
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || signInRefused(user)) return null;
  return (await accountErased()) ? null : user;
}
