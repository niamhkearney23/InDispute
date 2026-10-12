import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * The assurance level of this request's session: `aal2` once a code has been
 * typed, `aal1` after a password alone, null when it cannot be told.
 *
 * Read with `getClaims`, which checks the token's signature (against the
 * project's published keys, or by asking Supabase when the project still
 * signs with a shared secret) before trusting anything in it. The cookie is
 * the browser's to edit, so a level decoded from it without that check would
 * be whatever somebody wrote there. The token must also belong to the user
 * the caller already verified; a token for anybody else counts as no level.
 *
 * Anything that goes wrong reads as null, which every caller treats as "has
 * not typed a code", so a failure asks for a code rather than letting
 * somebody through.
 */
export async function verifiedAal(userId: string): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data) return null;
    if (data.claims.sub !== userId) return null;
    return typeof data.claims.aal === 'string' ? data.claims.aal : null;
  } catch {
    return null;
  }
}
