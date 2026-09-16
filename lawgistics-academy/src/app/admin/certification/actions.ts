'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkCoach } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import type { AdminState } from '../actions';

/**
 * The certification register.
 *
 * A coach's own record of their own trainees' real-world work, entirely
 * outside the question bank's review queue and sign-off machinery in the same
 * way coach_sessions is: see the note at the top of
 * supabase/migrations/0015_certification.sql for why a coach may write here
 * directly.
 */

const traineeSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  fullName: z.string().trim().min(1, 'Give them a name.').max(200),
  firmName: z.string().trim().min(1, 'Which firm are they at?').max(200),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export async function saveTrainee(_state: AdminState, formData: FormData): Promise<AdminState> {
  const coachId = await checkCoach();
  if (!coachId) return { error: 'You are not signed in as a coach or administrator.' };

  const parsed = traineeSchema.safeParse({
    id: formData.get('id') ?? '',
    fullName: formData.get('fullName'),
    firmName: formData.get('firmName'),
    notes: formData.get('notes') ?? '',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Something in the form is not valid.' };
  }
  const values = parsed.data;

  const fields = {
    full_name: values.fullName,
    firm_name: values.firmName,
    notes: values.notes ?? '',
    country: 'MY' as const,
  };

  const db = createServiceClient();

  if (values.id) {
    const { error } = await db.from('certification_trainees').update(fields).eq('id', values.id);
    if (error) return { error: 'That could not be saved.' };
    revalidatePath('/admin/certification');
    revalidatePath(`/admin/certification/${values.id}`);
    return { error: null, ok: 'Saved.' };
  }

  const { data, error } = await db
    .from('certification_trainees')
    .insert({ ...fields, created_by: coachId })
    .select('id')
    .single();
  if (error || !data) return { error: 'That could not be created.' };

  revalidatePath('/admin/certification');
  redirect(`/admin/certification/${data.id as string}`);
}

const entrySchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  traineeId: z.string().uuid(),
  boxNumber: z.coerce.number().int().min(1).max(15),
  caseNo: z.string().trim().min(1, 'Give it a case number or reference.').max(200),
  courtFileRef: z.string().trim().max(200).optional().or(z.literal('')),
  caseTypeStage: z.string().trim().max(200).optional().or(z.literal('')),
  dateIn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker.'),
  draftBack: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker.')
    .optional()
    .or(z.literal('')),
  grade: z.enum(['', 'l1_observed', 'l2_assisted', 'l3_independent']),
  screeningConfirmed: z.coerce.boolean(),
  note: z.string().trim().max(2000).optional().or(z.literal('')),
});

export async function saveCertificationEntry(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const coachId = await checkCoach();
  if (!coachId) return { error: 'You are not signed in as a coach or administrator.' };

  const parsed = entrySchema.safeParse({
    id: formData.get('id') ?? '',
    traineeId: formData.get('traineeId'),
    boxNumber: formData.get('boxNumber'),
    caseNo: formData.get('caseNo'),
    courtFileRef: formData.get('courtFileRef') ?? '',
    caseTypeStage: formData.get('caseTypeStage') ?? '',
    dateIn: formData.get('dateIn'),
    draftBack: formData.get('draftBack') ?? '',
    grade: formData.get('grade') ?? '',
    screeningConfirmed: formData.get('screeningConfirmed') === 'on',
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Something in the form is not valid.' };
  }
  const values = parsed.data;

  const fields = {
    trainee_id: values.traineeId,
    box_number: values.boxNumber,
    case_no: values.caseNo,
    court_file_ref: values.courtFileRef ?? '',
    case_type_stage: values.caseTypeStage ?? '',
    date_in: values.dateIn,
    draft_back: values.draftBack || null,
    grade: values.grade || null,
    screening_confirmed: values.screeningConfirmed,
    note: values.note ?? '',
  };

  const db = createServiceClient();

  if (values.id) {
    const { error } = await db.from('certification_entries').update(fields).eq('id', values.id);
    if (error) return { error: 'That could not be saved.' };
  } else {
    const { error } = await db
      .from('certification_entries')
      .insert({ ...fields, created_by: coachId });
    if (error) return { error: 'That could not be created.' };
  }

  revalidatePath(`/admin/certification/${values.traineeId}`);
  revalidatePath('/admin/certification');
  return { error: null, ok: 'Saved.' };
}
