'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { confirmStep, recordDecision } from '@/lib/onboarding/service';
import type { AdminState } from '../actions';

/**
 * Overseeing the pre-start checklist.
 *
 * Every write in this file takes the acting administrator's id from their
 * session and puts it in the row. That is the only reason any of these records
 * are worth keeping: "the NDA was confirmed" is an assertion nobody can stand
 * behind, and "Matthew confirmed the NDA on 3 September" is one somebody can.
 *
 * These run through the service role, which bypasses Row Level Security, so the
 * policies that pin confirmed_by and decided_by to auth.uid() do not apply here.
 * checkAdmin() plus passing the caller's own id is what stands in their place,
 * and the policies remain as the second lock on the same door.
 */

const stepSchema = z
  .object({
    stepId: z.string().uuid().optional().or(z.literal('')),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(120)
      .regex(/^[a-z0-9-]+$/, 'Use lower-case letters, numbers and hyphens only'),
    title: z.string().trim().min(2).max(200),
    detail: z.string().trim().max(2000).optional().or(z.literal('')),
    kind: z.enum(['read', 'sign', 'task']),
    firmModuleId: z.string().uuid().optional().or(z.literal('')),
    needsFirmCheck: z.coerce.boolean(),
    country: z.enum(['ALL', 'AU', 'MY']),
    required: z.coerce.boolean(),
    position: z.coerce.number().int().min(0).max(99),
    published: z.coerce.boolean(),
  })
  // The same two rules the database enforces, checked here so somebody filling
  // in a form gets a sentence rather than a constraint violation.
  .refine((v) => v.kind !== 'read' || Boolean(v.firmModuleId), {
    message: 'Pick which of the firm’s documents this step is asking them to read.',
  })
  .refine((v) => v.kind === 'read' || !v.firmModuleId, {
    message: 'Only a reading step points at one of the firm’s documents.',
  });

export async function saveStep(_state: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const parsed = stepSchema.safeParse({
    stepId: formData.get('stepId') ?? '',
    slug: formData.get('slug'),
    title: formData.get('title'),
    detail: formData.get('detail') ?? '',
    kind: formData.get('kind'),
    firmModuleId: formData.get('firmModuleId') ?? '',
    needsFirmCheck: formData.get('needsFirmCheck') === 'on',
    country: formData.get('country'),
    required: formData.get('required') === 'on',
    position: formData.get('position') ?? 0,
    published: formData.get('published') === 'on',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Something in the form is not valid.' };
  }

  const values = parsed.data;

  const fields = {
    slug: values.slug,
    title: values.title,
    detail: values.detail ?? '',
    kind: values.kind,
    firm_module_id: values.kind === 'read' ? values.firmModuleId : null,
    // Nobody confirms that somebody else read something, so this is forced off
    // for a reading step rather than left to whatever the form posted.
    needs_firm_check: values.kind === 'read' ? false : values.needsFirmCheck,
    country: values.country === 'ALL' ? null : values.country,
    required: values.required,
    position: values.position,
    published: values.published,
  };

  const db = createServiceClient();

  if (values.stepId) {
    const { error } = await db.from('firm_steps').update(fields).eq('id', values.stepId);
    if (error) return { error: 'That could not be saved. Is the slug already in use?' };
  } else {
    const { error } = await db.from('firm_steps').insert(fields);
    if (error) return { error: 'That could not be created. Is the slug already in use?' };
  }

  revalidatePath('/admin/onboarding');
  revalidatePath('/admin/onboarding/steps');
  revalidatePath('/start');
  redirect('/admin/onboarding/steps');
}

/** The firm confirming one person's item, in the name of whoever is signed in. */
export async function confirm(_state: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const userId = String(formData.get('userId') ?? '');
  const stepId = String(formData.get('stepId') ?? '');
  if (!userId || !stepId) return { error: 'That item could not be found.' };

  const result = await confirmStep(adminId, userId, stepId);
  if (result.error) return { error: result.error };

  revalidatePath(`/admin/onboarding/${userId}`);
  revalidatePath('/admin/onboarding');
  revalidatePath('/start');
  return { error: null, ok: 'Confirmed.' };
}

/**
 * Clearing somebody to begin, or withdrawing that.
 *
 * The count of what was outstanding is taken at the moment of the decision by
 * the service, not from this form. A page left open while somebody publishes a
 * new policy must not be able to record that the list was empty.
 */
export async function decide(_state: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const userId = String(formData.get('userId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const note = String(formData.get('note') ?? '');

  if (!userId) return { error: 'That person could not be found.' };
  if (decision !== 'cleared' && decision !== 'withdrawn') {
    return { error: 'That is not a decision this records.' };
  }

  const result = await recordDecision(adminId, userId, decision, note);
  if (result.error) return { error: result.error };

  revalidatePath(`/admin/onboarding/${userId}`);
  revalidatePath('/admin/onboarding');
  revalidatePath('/start');
  return {
    error: null,
    ok: decision === 'cleared' ? 'Recorded as cleared to begin.' : 'Clearance withdrawn.',
  };
}

const startDateSchema = z.object({
  userId: z.string().uuid(),
  // An empty string clears it. A person whose start date was entered wrongly
  // should not have to be given a fictional one to get rid of it.
  startsOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker')
    .optional()
    .or(z.literal('')),
});

export async function setStartDate(_state: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const parsed = startDateSchema.safeParse({
    userId: formData.get('userId'),
    startsOn: formData.get('startsOn') ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'That date is not valid.' };
  }

  const db = createServiceClient();
  const { error } = await db
    .from('profiles')
    .update({ starts_on: parsed.data.startsOn || null })
    .eq('id', parsed.data.userId);

  if (error) return { error: 'That could not be saved.' };

  revalidatePath(`/admin/onboarding/${parsed.data.userId}`);
  revalidatePath('/admin/onboarding');
  return { error: null, ok: 'Start date saved.' };
}
