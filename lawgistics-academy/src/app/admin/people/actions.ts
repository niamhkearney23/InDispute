'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { findAccountId } from '@/lib/admin/staff';
import type { AdminState } from '../actions';

const schema = z.object({
  email: z.string().trim().email('That is not an email address.').max(320),
  role: z.enum(['coach', 'firm_admin']),
  on: z.enum(['on', 'off']),
});

/**
 * Giving somebody a staff role, or taking it away. Administrators only: a
 * firm administrator runs the firm's people but does not decide who else
 * gets staff rights. The person must already have signed up with that
 * address, because every decision they record carries their name and that
 * is worth nothing if the account was not theirs.
 */
export async function setStaffRole(_state: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const parsed = schema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
    on: formData.get('on'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form.' };
  const { email, role, on } = parsed.data;

  const accountId = await findAccountId(email);
  if (!accountId) {
    return {
      error: `Nobody has signed up as ${email} yet. Ask them to sign up, then try again.`,
    };
  }
  if (accountId === adminId) return { error: 'Somebody else has to change your own roles.' };

  const db = createServiceClient();
  const column = role === 'coach' ? 'is_coach' : 'is_firm_admin';
  const { data, error } = await db
    .from('profiles')
    .update({ [column]: on === 'on' })
    .eq('id', accountId)
    .select('id');
  if (error || !data?.length) {
    return {
      error:
        'That could not be saved. If the database has not had the latest update applied, run UPDATE.sql first.',
    };
  }

  revalidatePath('/admin/people');
  const name = role === 'coach' ? 'a coach' : 'a firm administrator';
  return {
    error: null,
    ok: on === 'on' ? `${email} is now ${name}.` : `${email} is no longer ${name}.`,
  };
}
