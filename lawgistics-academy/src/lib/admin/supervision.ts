import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Who the firm supervises, for the staff pages that show a person's own
 * work: their tutor conversations and their answers. Confirmed trainees,
 * people who took up the firm's invitation, and people a coach confirmed on
 * a firm code that is still switched on. Somebody who signed up and pays for
 * themselves is not a coach's to read; an administrator can read anybody.
 */
export async function supervisedIds(userIds?: string[]): Promise<Set<string>> {
  if (userIds && userIds.length === 0) return new Set();
  const db = createServiceClient();
  let trainees = db
    .from('profiles')
    .select('id')
    .eq('track', 'litigation_trainee')
    .not('trainee_approved_at', 'is', null);
  let invited = db.from('joiner_invitations').select('accepted_by').not('accepted_by', 'is', null);
  let coded = db
    .from('access_grants')
    .select('user_id, access_codes!inner(active)')
    .eq('decision', 'confirmed')
    .eq('access_codes.active', true);
  if (userIds) {
    trainees = trainees.in('id', userIds);
    invited = invited.in('accepted_by', userIds);
    coded = coded.in('user_id', userIds);
  }
  const [a, b, c] = await Promise.all([trainees, invited, coded]);
  const ids = new Set<string>();
  for (const r of a.data ?? []) ids.add(r.id as string);
  for (const r of b.data ?? []) ids.add(r.accepted_by as string);
  for (const r of (c.data ?? []) as unknown as Array<{
    user_id: string;
    access_codes: { active: boolean } | null;
  }>) {
    if (r.access_codes?.active) ids.add(r.user_id);
  }
  return ids;
}

/** Whether the firm supervises this person. */
export async function isSupervised(userId: string): Promise<boolean> {
  return (await supervisedIds([userId])).has(userId);
}

/** Whether this staff member may read this person's own work. */
export async function staffMayRead(userId: string, isAdmin: boolean): Promise<boolean> {
  return isAdmin || (await isSupervised(userId));
}
