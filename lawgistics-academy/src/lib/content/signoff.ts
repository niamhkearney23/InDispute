import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { REFERENCE_ITEMS, referenceHash, type ReferenceItem } from '@/lib/content/wording';

/**
 * Sign-offs of the legal reference content that lives in the code: each
 * country's court map and the comparison essay topics (0046). The same idea
 * as lesson sign-offs (0032): a lawyer signs one wording, recorded with
 * their name and the database's time, and a change to any word in the code
 * means it needs signing again.
 *
 * Service-role reads and writes, so callers have established who is asking;
 * nothing here takes a person's id from a form.
 */

export interface ReferenceSignOff {
  name: string;
  signedAt: string;
}

/**
 * The sign-off covering each item's current wording, by key. A sign-off of
 * an earlier wording is not in here: it covers words nobody sees any more.
 */
export async function currentReferenceSignOffs(): Promise<Map<string, ReferenceSignOff>> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('content_signoffs')
    .select('content_key, content_hash, signed_by, signed_at');
  // A sign-off that cannot be read (a read failed, or the database is not
  // yet at 0046) is treated as not given: nothing unsigned reaches a learner
  // because something went wrong.
  if (error || !data) return new Map();

  const current = new Map(REFERENCE_ITEMS.map((item) => [item.key, referenceHash(item)]));
  const rows = data.filter((r) => current.get(r.content_key as string) === r.content_hash);
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
      r.content_key as string,
      { name: names.get(r.signed_by as string) ?? 'A reviewer', signedAt: r.signed_at as string },
    ]),
  );
}

/** Records a sign-off of an item as it stands now, under the signed-in reviewer. */
export async function signOffReference(item: ReferenceItem, reviewerId: string): Promise<boolean> {
  const db = createServiceClient();
  const { error } = await db
    .from('content_signoffs')
    .insert({ content_key: item.key, content_hash: referenceHash(item), signed_by: reviewerId });
  // Already signed in this wording counts as done.
  return !error || error.code === '23505';
}
