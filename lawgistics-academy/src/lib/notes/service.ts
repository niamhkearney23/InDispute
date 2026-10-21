import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import type { Country } from '@/lib/types';
import { noteForToday, type MorningNote, type NoteViewer } from './rules';

/**
 * Morning notes: a few lines from the coach at the top of Today (0050).
 *
 * Reads go through the service client, so the filter in rules.ts is what
 * stands between a learner and a note that is not for them, as with sessions.
 */

interface Row {
  id: string;
  body: string;
  for_date: string;
  country: string | null;
  trainees_only: boolean | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: { display_name: string | null } | Array<{ display_name: string | null }> | null;
}

const SELECT =
  'id, body, for_date, country, trainees_only, author_id, created_at, updated_at, ' +
  'author:profiles!morning_notes_author_id_fkey(display_name)';

function toNote(row: Row): MorningNote {
  const author = Array.isArray(row.author) ? (row.author[0] ?? null) : (row.author ?? null);
  return {
    id: row.id,
    body: row.body,
    forDate: row.for_date,
    country: (row.country as Country | null) ?? null,
    traineesOnly: Boolean(row.trainees_only),
    authorId: row.author_id,
    // The name if they gave one, never an email address.
    authorName: author?.display_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The note for this learner this morning, or null. A failed read is null. */
export async function morningNoteFor(viewer: NoteViewer, today: string): Promise<MorningNote | null> {
  const db = createServiceClient();
  const query = db
    .from('morning_notes')
    .select(SELECT)
    .eq('for_date', today)
    .or(`country.is.null,country.eq.${viewer.country}`);
  // Filtered here as well as in noteForToday, so a busy morning's
  // trainee-only notes cannot fill the twenty and hide one meant for everyone.
  const { data, error } = await (viewer.seesTraineeNotes ? query : query.eq('trainees_only', false))
    .order('created_at', { ascending: false })
    .limit(20);
  if (error || !data) return null;
  return noteForToday((data as unknown as Row[]).map(toNote), viewer, today);
}

/** Recent notes, every audience. For the coach's own page only. */
export async function recentNotes(limit = 30): Promise<MorningNote[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('morning_notes')
    .select(SELECT)
    .order('for_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as Row[]).map(toNote);
}

/** One note, for editing. */
export async function noteById(id: string): Promise<MorningNote | null> {
  const db = createServiceClient();
  const { data } = await db.from('morning_notes').select(SELECT).eq('id', id).maybeSingle();
  return data ? toNote(data as unknown as Row) : null;
}
