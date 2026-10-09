'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkFirmAdmin } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import {
  holidaysToRow,
  knownTimezone,
  readHolidays,
  readRoundHours,
  realDate,
} from '@/lib/training/schedule';
import type { AdminState } from '../actions';

function refresh(id?: string) {
  revalidatePath('/admin/cohorts');
  if (id) revalidatePath(`/admin/cohorts/${id}`);
  revalidatePath('/admin/intake');
  revalidatePath('/admin/trainees');
  revalidatePath('/dashboard');
  revalidatePath('/programme');
  revalidatePath('/homework');
  revalidatePath('/trainee');
}

/**
 * Making or changing a cohort: its name, first and last day, timezone, the
 * hours its rounds open at and the holidays it skips. The firm's decision,
 * so an administrator or the firm's administrator. Changing a cohort's
 * dates moves everybody in it, because a person's dates are what their
 * homework and rounds read.
 */
export async function saveCohort(_state: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkFirmAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator or firm administrator.' };

  const id = String(formData.get('id') ?? '');
  if (id && !z.string().uuid().safeParse(id).success) return { error: 'That cohort could not be found.' };

  const name = String(formData.get('name') ?? '').trim();
  const startsOn = String(formData.get('startsOn') ?? '');
  const endsOn = String(formData.get('endsOn') ?? '');
  const timezone = String(formData.get('timezone') ?? '');
  if (!name || name.length > 80) return { error: 'Give the cohort a name of up to 80 characters.' };
  if (!realDate(startsOn) || !realDate(endsOn)) return { error: 'Choose the first and the last day.' };
  if (endsOn < startsOn) return { error: 'The last day is before the first.' };
  if (!knownTimezone(timezone)) return { error: 'Choose the city whose clock the rounds run on.' };
  const roundHours = readRoundHours(formData.getAll('roundHours'));
  if (!roundHours) return { error: 'Choose between one and eight round times.' };
  const holidays = readHolidays(String(formData.get('holidays') ?? ''));
  if (!holidays.ok) return { error: holidays.error };

  const row = {
    name,
    starts_on: startsOn,
    ends_on: endsOn,
    timezone,
    round_hours: roundHours,
    holidays: holidaysToRow(holidays.holidays),
  };

  const db = createServiceClient();
  if (!id) {
    const { data, error } = await db
      .from('cohorts')
      .insert({ ...row, created_by: adminId })
      .select('id')
      .single();
    if (error || !data) {
      return {
        error:
          'The cohort could not be saved. If the database has not had the latest update applied, run UPDATE.sql first.',
      };
    }
    refresh();
    redirect(`/admin/cohorts/${data.id}`);
  }

  const { data, error } = await db.from('cohorts').update(row).eq('id', id).select('id');
  if (error || !data?.length) return { error: 'The cohort could not be saved. Please try again.' };

  // Everybody in it follows its dates.
  const { error: moveError } = await db
    .from('profiles')
    .update({ starts_on: startsOn, ends_on: endsOn })
    .eq('cohort_id', id);
  if (moveError) {
    return { error: 'The cohort was saved, but its people could not be moved to its dates. Save it again.' };
  }

  refresh(id);
  return { error: null, ok: 'Saved. Everybody in this cohort is on these dates and times.' };
}

/**
 * Putting confirmed trainees into a cohort, or taking them out. In: they
 * take the cohort's dates. Out: they keep the dates they had and go back to
 * the programme's own clock.
 */
export async function assignCohort(_state: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkFirmAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator or firm administrator.' };

  const cohortId = String(formData.get('cohortId') ?? '');
  if (!z.string().uuid().safeParse(cohortId).success) return { error: 'That cohort could not be found.' };
  const remove = formData.get('action') === 'remove';
  const ids = formData
    .getAll('userId')
    .map(String)
    .filter((v) => z.string().uuid().safeParse(v).success);
  if (ids.length === 0) return { error: 'Tick at least one person first.' };
  if (ids.length > 500) return { error: 'That is more than 500 people at once.' };

  const db = createServiceClient();
  const { data: cohort } = await db
    .from('cohorts')
    .select('id, starts_on, ends_on')
    .eq('id', cohortId)
    .maybeSingle();
  if (!cohort) return { error: 'That cohort could not be found.' };

  const { data, error } = remove
    ? await db
        .from('profiles')
        .update({ cohort_id: null })
        .in('id', ids)
        .eq('cohort_id', cohortId)
        .select('id')
    : await db
        .from('profiles')
        .update({ cohort_id: cohortId, starts_on: cohort.starts_on, ends_on: cohort.ends_on })
        .in('id', ids)
        .eq('track', 'litigation_trainee')
        .not('trainee_approved_at', 'is', null)
        .select('id');
  if (error) return { error: 'That could not be saved. Please try again.' };

  refresh(cohortId);
  const n = data?.length ?? 0;
  return {
    error: null,
    ok: remove
      ? `${n} ${n === 1 ? 'person' : 'people'} taken out of this cohort.`
      : `${n} ${n === 1 ? 'trainee' : 'trainees'} put in this cohort, on its dates.`,
  };
}
