import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface LeaderboardRow {
  position: number;
  firstName: string;
  xp: number;
  isMe: boolean;
}

/**
 * This week's table, or null when the firm has not switched it on.
 *
 * Read through the caller's own client: the function it calls runs as its
 * owner and decides for itself what to give back, which is first names and
 * numbers while the setting is on, and nothing while it is off. Nothing in
 * TypeScript re-decides that.
 */
export async function weeklyLeaderboard(): Promise<LeaderboardRow[] | null> {
  const supabase = await createSupabaseServerClient();
  const [{ data: settings }, { data: rows, error }] = await Promise.all([
    supabase.from('firm_settings').select('leaderboard_enabled').eq('id', true).maybeSingle(),
    supabase.rpc('weekly_leaderboard'),
  ]);
  if (!settings?.leaderboard_enabled) return null;
  if (error) {
    // Off and broken look the same on the page, so the difference goes to
    // the log: usually 0025 has not been applied yet.
    console.error('weekly_leaderboard failed:', error.message);
    return null;
  }
  return ((rows as Array<Record<string, unknown>> | null) ?? []).map((row) => ({
    position: Number(row.place),
    firstName: String(row.first_name ?? 'Someone'),
    xp: Number(row.xp),
    isMe: Boolean(row.is_me),
  }));
}

export async function leaderboardEnabled(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('firm_settings')
    .select('leaderboard_enabled')
    .eq('id', true)
    .maybeSingle();
  return Boolean(data?.leaderboard_enabled);
}
