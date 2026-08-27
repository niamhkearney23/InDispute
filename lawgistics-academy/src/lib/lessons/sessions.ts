import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { isEmbeddable } from './embed';
import type { Country } from '@/lib/types';

/**
 * The coach's own sessions: what they recorded, for their own people.
 *
 * Everything else a learner can open was written months earlier by somebody who
 * is not in the room. This is the one thing that is not: the coach records
 * something and it is there the next morning, without a developer and without a
 * deployment.
 *
 * Reads go through the service client, so Row Level Security is not what is
 * standing between a learner and an unpublished draft. The filters here are.
 * `forLearner` never returns anything unpublished; nothing else should be used
 * on a learner's page.
 */

export interface CoachSession {
  id: string;
  title: string;
  summary: string;
  url: string;
  country: Country | null;
  airsOn: string | null;
  published: boolean;
  publishedByName: string | null;
  publishedAt: string | null;
  position: number;
}

interface Row {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  country: string | null;
  airs_on: string | null;
  published: boolean;
  published_at: string | null;
  position: number;
  publisher?: { display_name: string | null; email: string } | null;
}

function first<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? (value[0] ?? null) : value) as T | null;
}

function toSession(row: Row): CoachSession {
  const publisher = first<{ display_name: string | null; email: string }>(row.publisher);
  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? '',
    url: row.url,
    country: (row.country as Country | null) ?? null,
    airsOn: row.airs_on,
    published: row.published,
    // The name if they gave one, otherwise nothing. Falling back to an email
    // address would put somebody's inbox on a page their whole cohort reads.
    publishedByName: publisher?.display_name ?? null,
    publishedAt: row.published_at,
    position: row.position,
  };
}

const SELECT =
  'id, title, summary, url, country, airs_on, published, published_at, position, ' +
  'publisher:profiles!coach_sessions_published_by_fkey(display_name, email)';

/**
 * What this learner may watch, newest morning first.
 *
 * Two filters, and both matter. Unpublished is never returned, because the
 * service client would happily hand over a draft. And a session tagged to the
 * other country is left out, because a Malaysian junior opening the app at
 * seven should not be shown a session about Australian practice; a session
 * tagged to neither country is for everybody and is always included.
 */
export async function sessionsForLearner(country: Country): Promise<CoachSession[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('coach_sessions')
    .select(SELECT)
    .eq('published', true)
    .or(`country.is.null,country.eq.${country}`)
    .order('airs_on', { ascending: false, nullsFirst: false })
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });

  return ((data ?? []) as unknown as Row[])
    .map(toSession)
    // A row whose host is not one we chose cannot be framed, and is dropped
    // rather than rendered as a broken player. The database constraint should
    // make this impossible; this is the second lock on the same door.
    .filter((s) => isEmbeddable(s.url));
}

/** Everything, drafts included. For the coach's own page only. */
export async function allSessions(): Promise<CoachSession[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('coach_sessions')
    .select(SELECT)
    .order('airs_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  return ((data ?? []) as unknown as Row[]).map(toSession);
}

/**
 * The one to lead with this morning.
 *
 * Today's if there is one, otherwise the most recent that has already aired.
 * Never one dated in the future: a session the coach has scheduled for Friday
 * appearing on Wednesday would give away the wrong morning's work.
 */
export function leadSession(sessions: CoachSession[], today: string): CoachSession | null {
  const aired = sessions.filter((s) => !s.airsOn || s.airsOn <= today);
  return aired[0] ?? null;
}
