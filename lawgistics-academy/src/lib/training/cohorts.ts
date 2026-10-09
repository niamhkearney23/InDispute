import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';
import { DEFAULT_SCHEDULE, scheduleFromRow, type Schedule } from './schedule';

/**
 * Cohorts (0041), read by the server. Service-role reads: the pages that list
 * them have checked the caller first, and a trainee's own pages ask only for
 * the cohort on their own profile.
 */

export interface Cohort {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  schedule: Schedule;
}

type CohortRow = {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  timezone: string;
  round_hours: number[];
  holidays: unknown;
};

const COLUMNS = 'id, name, starts_on, ends_on, timezone, round_hours, holidays';

function toCohort(row: CohortRow): Cohort {
  return {
    id: row.id,
    name: row.name,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    schedule: scheduleFromRow(row),
  };
}

/** Every cohort, the next to start first. Empty when there are none or the table is not there yet. */
export async function listCohorts(): Promise<Cohort[]> {
  const { data, error } = await createServiceClient()
    .from('cohorts')
    .select(COLUMNS)
    .order('starts_on', { ascending: true })
    .limit(200);
  if (error) return [];
  return ((data ?? []) as CohortRow[]).map(toCohort);
}

export async function getCohort(id: string): Promise<Cohort | null> {
  const { data } = await createServiceClient().from('cohorts').select(COLUMNS).eq('id', id).maybeSingle();
  return data ? toCohort(data as CohortRow) : null;
}

/**
 * The clock a person's mornings run on: their cohort's, or the programme's
 * own when they are in none, or when it cannot be read (a database that has
 * not had 0041 yet), so nobody's mornings stop because a lookup failed.
 */
export async function scheduleForCohort(
  db: SupabaseClient,
  cohortId: string | null | undefined,
): Promise<Schedule> {
  if (!cohortId) return DEFAULT_SCHEDULE;
  const { data, error } = await db
    .from('cohorts')
    .select('timezone, round_hours, holidays')
    .eq('id', cohortId)
    .maybeSingle();
  if (error || !data) return DEFAULT_SCHEDULE;
  return scheduleFromRow(data);
}

/** The schedule for a person, by their id. */
export async function scheduleForPerson(userId: string): Promise<Schedule> {
  const db = createServiceClient();
  const { data } = await db.from('profiles').select('*').eq('id', userId).maybeSingle();
  return scheduleForCohort(db, (data as { cohort_id?: string | null } | null)?.cohort_id);
}

/**
 * The cohort the public trainee page talks about: the next one that has not
 * finished yet, or null when there is none and the page keeps its own words.
 */
export async function upcomingCohort(today: string): Promise<Cohort | null> {
  const all = await listCohorts();
  return all.find((c) => c.endsOn >= today) ?? null;
}
