'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin, checkCoach } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { normaliseCode } from '@/lib/access/rules';
import type { AdminState } from '../actions';

function refresh() {
  revalidatePath('/admin/access');
  revalidatePath('/pricing');
  revalidatePath('/dashboard');
}

/**
 * Saying whether somebody who entered a firm's code really is with the firm.
 * A decision about a person, under the coach's name, like confirming a
 * trainee. Nobody decides their own, which the database refuses too.
 */
export async function decideAccess(_state: AdminState, formData: FormData): Promise<AdminState> {
  const coachId = await checkCoach();
  if (!coachId) return { error: 'You are not signed in as a coach or administrator.' };

  const userId = String(formData.get('userId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  if (!z.string().uuid().safeParse(userId).success)
    return { error: 'That person could not be found.' };
  if (decision !== 'confirmed' && decision !== 'declined') {
    return { error: 'That is not a decision this records.' };
  }
  if (userId === coachId) return { error: 'Somebody else has to confirm you.' };

  const db = createServiceClient();
  const { data, error } = await db
    .from('access_grants')
    .update({ decision, decided_by: coachId })
    .eq('user_id', userId)
    .is('decision', null)
    .select('user_id');
  if (error) return { error: 'That could not be saved. Please try again.' };
  if (!data?.length) return { error: 'Somebody has already decided this one.' };

  refresh();
  return {
    error: null,
    ok:
      decision === 'confirmed' ? 'Confirmed. It is free for them now.' : 'Marked as not with you.',
  };
}

/** A new code for a firm or university. Administrators only. */
export async function saveAccessCode(_state: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const code = normaliseCode(String(formData.get('code') ?? ''));
  const label = String(formData.get('label') ?? '').trim();
  if (!code) return { error: 'A code is 4 to 32 letters, numbers or hyphens.' };
  if (!label || label.length > 120)
    return { error: 'Say who the code is for, such as the firm’s name.' };

  const db = createServiceClient();
  const { error } = await db.from('access_codes').insert({ code, label, created_by: adminId });
  if (error) {
    return {
      error: /duplicate|unique/i.test(error.message)
        ? 'That code is already in use.'
        : 'That could not be saved.',
    };
  }

  refresh();
  return { error: null, ok: `${code} is ready to hand out.` };
}

/**
 * Switching a code on or off. Off stops it for new people and ends it for
 * everybody it already made free, which is what a firm leaving looks like.
 * Codes are never deleted, so the record of who was confirmed stays.
 */
export async function setAccessCodeActive(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const id = String(formData.get('id') ?? '');
  const active = formData.get('active') === 'true';
  if (!z.string().uuid().safeParse(id).success) return { error: 'That code could not be found.' };

  const db = createServiceClient();
  const { error } = await db.from('access_codes').update({ active }).eq('id', id);
  if (error) return { error: 'That could not be saved.' };

  refresh();
  return { error: null, ok: active ? 'Switched on.' : 'Switched off.' };
}
