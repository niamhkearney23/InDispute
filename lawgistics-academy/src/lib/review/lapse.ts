import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';

export interface LapseReturn {
  questions: number;
  facts: number;
}

/**
 * Takes every question and daily fact whose sign-off has run out back to the
 * review queue, recording what the sign-off was first (0052). Learners stop
 * being given them the day the date passes whatever happens here (0051);
 * this is what puts them in front of a reviewer. Null when it could not run.
 */
export async function returnLapsedContent(
  db: SupabaseClient = createServiceClient(),
): Promise<LapseReturn | null> {
  const { data, error } = await db.rpc('return_lapsed_content');
  if (error || !data) {
    if (error) console.error('[review] lapsed sign-offs could not be returned', error);
    return null;
  }
  const result = data as { questions?: number; facts?: number };
  return { questions: Number(result.questions ?? 0), facts: Number(result.facts ?? 0) };
}
