'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin, checkCoach } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { confirmStep, recordDecision } from '@/lib/onboarding/service';
import {
  createAccountDirectly,
  createInvitation,
  revokeInvitation,
} from '@/lib/onboarding/invitations';
import { practiceChoiceFor } from '@/lib/types';
import type { LearnerTrack } from '@/lib/types';
import { publicEnv } from '@/lib/env';
import type { AdminState } from '../actions';

/**
 * Overseeing the pre-start checklist.
 *
 * Every write in this file takes the acting person's id from their session and
 * puts it in the row. That is the only reason any of these records are worth
 * keeping: "the NDA was confirmed" is an assertion nobody can stand behind, and
 * "Matthew confirmed the NDA on 3 September" is one somebody can.
 *
 * Two roles reach this file. Confirming an item and deciding somebody is ready
 * are supervisor judgements, so a coach may record them. Writing the checklist
 * itself, setting start dates and issuing invitations shape what the firm asks
 * of people, so those stay with an administrator.
 *
 * These run through the service role, which bypasses Row Level Security, so the
 * policies that pin confirmed_by and decided_by to auth.uid() do not apply here.
 * The guard plus passing the caller's own id is what stands in their place, and
 * the policies remain as the second lock on the same door.
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
  // A supervisor's act, so a coach records it. Their id is what goes into the
  // record, which is the point of asking who is signed in rather than trusting
  // the form.
  const adminId = await checkCoach();
  if (!adminId) return { error: 'You are not signed in as a coach or administrator.' };

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
  // Deciding somebody is ready to be put in front of a client is the judgement
  // the coach role exists for. It is recorded against them by name, with the
  // count of what was still outstanding when they decided.
  const adminId = await checkCoach();
  if (!adminId) return { error: 'You are not signed in as a coach or administrator.' };

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

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker')
  .optional()
  .or(z.literal(''));

const placementDatesSchema = z
  .object({
    userId: z.string().uuid(),
    // An empty string clears it. A person whose date was entered wrongly
    // should not have to be given a fictional one to get rid of it.
    startsOn: dateField,
    endsOn: dateField,
  })
  .refine(
    (v) => !v.startsOn || !v.endsOn || v.endsOn >= v.startsOn,
    { message: 'The end date is before the start date.', path: ['endsOn'] },
  );

/** A placement's first and last day, e.g. for a fixed-length program. */
export async function setPlacementDates(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const parsed = placementDatesSchema.safeParse({
    userId: formData.get('userId'),
    startsOn: formData.get('startsOn') ?? '',
    endsOn: formData.get('endsOn') ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'That date is not valid.' };
  }

  const db = createServiceClient();
  const { error } = await db
    .from('profiles')
    .update({
      starts_on: parsed.data.startsOn || null,
      ends_on: parsed.data.endsOn || null,
    })
    .eq('id', parsed.data.userId);

  if (error) return { error: 'That could not be saved.' };

  revalidatePath(`/admin/onboarding/${parsed.data.userId}`);
  revalidatePath('/admin/onboarding');
  revalidatePath('/dashboard');
  return { error: null, ok: 'Dates saved.' };
}

// -----------------------------------------------------------------------------
// Inviting somebody to join
// -----------------------------------------------------------------------------

export type InviteState = { error: string | null; link?: string; email?: string };

const inviteSchema = z.object({
  email: z.string().trim().email('That does not look like an email address.').max(200),
  displayName: z.string().trim().max(120).optional().or(z.literal('')),
  startsOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker')
    .optional()
    .or(z.literal('')),
  choice: z.enum(['AU', 'MY', 'MY_TRAINEE']),
});

/**
 * Create an invitation and hand back the link.
 *
 * The link is returned to the administrator to send, rather than emailed from
 * here, because this deployment has no SMTP configured and a joining flow that
 * silently depended on it would fail on the one day it mattered. It is shown
 * once and is not recoverable afterwards: only its hash is stored.
 */
export async function invite(_state: InviteState, formData: FormData): Promise<InviteState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    displayName: formData.get('displayName') ?? '',
    startsOn: formData.get('startsOn') ?? '',
    choice: formData.get('choice') ?? 'AU',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Something in the form is not valid.' };
  }

  const { country, track } = choiceToProgramme(parsed.data.choice);
  const result = await createInvitation({
    invitedBy: adminId,
    email: parsed.data.email,
    displayName: parsed.data.displayName ?? '',
    startsOn: parsed.data.startsOn || null,
    country,
    track,
  });

  if (result.error) return { error: result.error };

  revalidatePath('/admin/onboarding');
  return {
    error: null,
    email: parsed.data.email,
    // Trailing slashes in the configured origin would produce a double
    // slash in a link somebody is about to paste into an email.
    link: `${publicEnv.siteUrl.replace(/\/+$/, '')}/join/${result.token}`,
  };
}

/** The three-way choice on the form, as a country and a programme. */
function choiceToProgramme(choice: 'AU' | 'MY' | 'MY_TRAINEE'): {
  country: 'AU' | 'MY';
  track: LearnerTrack;
} {
  const found = practiceChoiceFor(
    choice === 'AU' ? 'AU' : 'MY',
    choice === 'MY_TRAINEE' ? 'litigation_trainee' : 'general',
  );
  return { country: found.country, track: found.track };
}

export type AccountState = { error: string | null; email?: string; password?: string };

/**
 * Making the account outright, with a temporary password to hand over.
 *
 * The other way in for a firm that would rather not send a link. The
 * password is shown once, here, and the person is made to choose their own
 * the first time they sign in, so the one the administrator saw stops
 * working at that moment. Administrator only, like inviting: this decides
 * who is a member of the firm's deployment.
 */
export async function createAccount(
  _state: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    displayName: formData.get('displayName') ?? '',
    startsOn: formData.get('startsOn') ?? '',
    choice: formData.get('choice') ?? 'AU',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Something in the form is not valid.' };
  }

  const { country, track } = choiceToProgramme(parsed.data.choice);
  const result = await createAccountDirectly({
    invitedBy: adminId,
    email: parsed.data.email,
    displayName: parsed.data.displayName ?? '',
    startsOn: parsed.data.startsOn || null,
    country,
    track,
  });

  if (result.password === null) return { error: result.error };

  revalidatePath('/admin/onboarding');
  return { error: null, email: parsed.data.email, password: result.password };
}

export async function revoke(_state: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const id = String(formData.get('invitationId') ?? '');
  if (!id) return { error: 'That invitation could not be found.' };

  const result = await revokeInvitation(id);
  if (result.error) return { error: result.error };

  revalidatePath('/admin/onboarding');
  return { error: null, ok: 'Invitation called back.' };
}
