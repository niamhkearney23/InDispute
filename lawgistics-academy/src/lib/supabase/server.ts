import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { publicEnv, requirePublicEnv } from '@/lib/env';

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
 * The authenticated user, or null. Always verified against the auth server.
 *
 * Returns null rather than throwing when Supabase is not configured, so a fresh
 * clone renders the landing page and the setup instructions instead of a stack
 * trace.
 */
export async function getCurrentUser() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
