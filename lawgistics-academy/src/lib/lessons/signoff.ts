import 'server-only';
import { createHash } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { ALL_LESSONS, lessonContent, type SeedLesson } from '@/content/seed/lessons';

/**
 * Lesson sign-offs: which lessons a lawyer has read and signed, as they
 * stand now. Service-role reads, so callers have established who is asking;
 * nothing here takes a person's id from a form.
 */

/** The fingerprint a sign-off is pinned to. */
export function lessonHash(lesson: SeedLesson): string {
  return createHash('sha256').update(lessonContent(lesson)).digest('hex');
}

export interface LessonSignOff {
  name: string;
  signedAt: string;
}

/**
 * The sign-off covering each lesson's current wording, by slug. A lesson
 * signed off in an earlier wording is not in here: that sign-off covers
 * words nobody sees any more.
 */
export async function currentSignOffs(): Promise<Map<string, LessonSignOff>> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('lesson_signoffs')
    .select('lesson_slug, content_hash, signed_by, signed_at');
  // A sign-off that cannot be read is treated as not given, so an unsigned
  // rewrite never reaches a learner because a read failed.
  if (error || !data) return new Map();

  const current = new Map(ALL_LESSONS.map((l) => [l.slug, lessonHash(l)]));
  const rows = data.filter((r) => current.get(r.lesson_slug as string) === r.content_hash);
  if (rows.length === 0) return new Map();

  const { data: people } = await db
    .from('profiles')
    .select('id, display_name, email')
    .in('id', [...new Set(rows.map((r) => r.signed_by as string))]);
  const names = new Map(
    (people ?? []).map((p) => [
      p.id as string,
      ((p.display_name as string | null) || (p.email as string | null) || 'A reviewer') as string,
    ]),
  );
  return new Map(
    rows.map((r) => [
      r.lesson_slug as string,
      { name: names.get(r.signed_by as string) ?? 'A reviewer', signedAt: r.signed_at as string },
    ]),
  );
}

/** Records a sign-off of a lesson as it stands now, under the signed-in reviewer. */
export async function signOff(lesson: SeedLesson, reviewerId: string): Promise<boolean> {
  const db = createServiceClient();
  const { error } = await db
    .from('lesson_signoffs')
    .insert({ lesson_slug: lesson.slug, content_hash: lessonHash(lesson), signed_by: reviewerId });
  // Already signed in this wording counts as done.
  return !error || error.code === '23505';
}
