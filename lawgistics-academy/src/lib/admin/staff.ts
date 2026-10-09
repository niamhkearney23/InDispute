import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';

/**
 * Who has a staff role, and the one lookup that finds a person to give one.
 * Service-role reads, so every caller has passed `requireAdmin` first.
 */

export type StaffRole = 'coach' | 'firm_admin';

export interface StaffRow {
  id: string;
  name: string;
  email: string | null;
  isAdmin: boolean;
  isCoach: boolean;
  isFirmAdmin: boolean;
}

export async function staffList(): Promise<StaffRow[]> {
  const db = createServiceClient();
  const { data } = await db
    .from('profiles')
    .select('id, display_name, email, is_admin, is_coach, is_firm_admin')
    .or('is_admin.eq.true,is_coach.eq.true,is_firm_admin.eq.true')
    .order('display_name', { ascending: true })
    .limit(500);
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.display_name ?? p.email ?? 'Unnamed',
    email: p.email,
    isAdmin: Boolean(p.is_admin),
    isCoach: Boolean(p.is_coach),
    isFirmAdmin: Boolean(p.is_firm_admin),
  }));
}

/**
 * The sign-in account for an email address, found through the login system
 * itself, never through profiles.email: a staff role goes to whoever proves
 * the address by signing in with it.
 */
export async function findAccountId(email: string): Promise<string | null> {
  const wanted = email.trim().toLowerCase();
  const db = createServiceClient();
  for (let page = 1; page < 1000; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) return null;
    const match = data.users.find((u) => (u.email ?? '').toLowerCase() === wanted);
    if (match) return match.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}
