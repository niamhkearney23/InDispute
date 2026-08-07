import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicEnv, requireServiceRoleKey } from '@/lib/env';

let cached: SupabaseClient | null = null;

/**
 * Bypasses Row Level Security. Used for exactly two things:
 *
 *   1. reading answer keys and explanations when grading, which learners are
 *      deliberately not permitted to read for themselves; and
 *   2. writing the XP ledger, which learners must not be able to forge.
 *
 * Every call site must first establish who the user is via `getCurrentUser()`
 * and must scope its own queries by that id. There is no RLS safety net here.
 */
export function createServiceClient(): SupabaseClient {
  if (cached) return cached;

  cached = createClient(publicEnv.supabaseUrl, requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
