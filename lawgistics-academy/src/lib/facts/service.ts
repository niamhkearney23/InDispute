import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { localDateString } from '@/lib/learning/progression';
import type { Country, Jurisdiction } from '@/lib/types';

/**
 * The daily brief.
 *
 * Everyone sees the same fact on the same day. That is deliberate, a shared
 * brief is something two people in the same cohort can talk about, which a
 * personalised one is not.
 *
 * Rotation is a plain modulo over a stable ordering, so nothing repeats until
 * the whole published pool has been through, and the same date always yields
 * the same fact. No state to store, and no way for it to drift.
 */

export interface DailyFact {
  id: string;
  title: string;
  body: string;
  whyItMatters: string | null;
  jurisdiction: Jurisdiction;
  court: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
}

/** Days since the Unix epoch, from a YYYY-MM-DD local date. */
export function dayNumber(localDate: string): number {
  const [year, month, day] = localDate.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/** Pure, so the rotation can be tested without a database. */
export function pickForDay<T>(pool: T[], localDate: string): T | null {
  if (pool.length === 0) return null;
  const index = ((dayNumber(localDate) % pool.length) + pool.length) % pool.length;
  return pool[index];
}

export async function getFactOfTheDay(
  timezone: string,
  country: Country,
  now: Date = new Date(),
): Promise<DailyFact | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('daily_facts')
    .select(
      'id, title, body, why_it_matters, jurisdiction, court, source_reference, source_url',
    )
    .eq('status', 'published')
    .eq('country', country)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  const chosen = pickForDay(data ?? [], localDateString(timezone, now));
  if (!chosen) return null;

  return {
    id: chosen.id,
    title: chosen.title,
    body: chosen.body,
    whyItMatters: chosen.why_it_matters,
    jurisdiction: chosen.jurisdiction,
    court: chosen.court,
    sourceReference: chosen.source_reference,
    sourceUrl: chosen.source_url,
  };
}
