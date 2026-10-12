'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { brand } from '@/lib/brand';
import { verifiedAal } from '@/lib/auth/two-step-server';
import { qrImageSource } from '@/lib/auth/two-step-qr';
import {
  MAX_DEVICES,
  TWO_STEP_SETUP_PATH,
  canAddDevice,
  canRemoveDevice,
  cleanCode,
  deviceName,
  isStaff,
  returnPath,
  twoStepEnforced,
  twoStepProblem,
  verifiedFactors,
} from '@/lib/auth/two-step';

export type StartState = {
  error: string | null;
  enrolment: { factorId: string; qr: string | null; secret: string } | null;
};
export type ConfirmState = { error: string | null };
export type RemoveState = { error: string | null };

/**
 * Starts adding an authenticator app: Supabase makes a new secret and the
 * picture of it to scan. Nothing is switched on until `confirmTwoStepSetup`
 * has a code from it, so a setup abandoned halfway changes nothing.
 *
 * Done on a button press, never when the page loads, so opening the page
 * does not make anything.
 */
// Both arguments are the shape useActionState requires of every action it
// drives, whether or not this one reads them.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function startTwoStepSetup(_prev: StartState, _formData: FormData): Promise<StartState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are signed out. Sign in again first.', enrolment: null };

  const devices = verifiedFactors(user.factors);
  const aal = devices.length > 0 ? await verifiedAal(user.id) : null;
  if (!canAddDevice({ verifiedFactorCount: devices.length, aal })) {
    return {
      error:
        devices.length >= MAX_DEVICES
          ? `You already have ${MAX_DEVICES} devices, the most there can be. Remove one first.`
          : 'Type the code from the device you already have first, then add another.',
      enrolment: null,
    };
  }

  const supabase = await createSupabaseServerClient();

  // A setup somebody started and never finished is still on the account,
  // unconfirmed. Clear those first: each holds a secret nobody is using, and
  // they count towards Supabase's own limit on devices.
  for (const factor of user.factors ?? []) {
    if (factor.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    // What the authenticator app lists the entry under, beside the email.
    issuer: brand.name,
    friendlyName: deviceName(devices, new Date()),
  });
  if (error || !data) {
    return {
      error: error?.code
        ? twoStepProblem(error.code, error.status)
        : 'The code could not be made just now. Try again in a minute.',
      enrolment: null,
    };
  }

  return {
    error: null,
    enrolment: {
      factorId: data.id,
      qr: qrImageSource(data.totp.qr_code),
      secret: data.totp.secret,
    },
  };
}

/**
 * Finishes adding an app: the first code from it proves it holds the right
 * secret. Supabase then marks the device confirmed and the session `aal2`,
 * so a staff member goes straight on to the staff pages.
 */
export async function confirmTwoStepSetup(
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are signed out. Sign in again first.' };

  const code = cleanCode(formData.get('code'));
  if (!code) return { error: 'Type the six numbers your authenticator app shows.' };

  // Only a setup of the caller's own that is still waiting for its code.
  const factorId = String(formData.get('factorId') ?? '');
  const pending = (user.factors ?? []).find((f) => f.id === factorId && f.status !== 'verified');
  if (!pending) return { error: 'That setup has expired. Press the button to start again.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { error: twoStepProblem(error.code, error.status) };

  revalidatePath(TWO_STEP_SETUP_PATH);
  const next = formData.get('next');
  redirect(next ? returnPath(next, TWO_STEP_SETUP_PATH) : `${TWO_STEP_SETUP_PATH}?added=1`);
}

/**
 * Removes one of the caller's own devices. Supabase refuses this from a
 * session that has not typed a code, and so does `canRemoveDevice`, which
 * also keeps a staff member's last device while two-step sign-in is required
 * of them.
 */
export async function removeTwoStepDevice(_prev: RemoveState, formData: FormData): Promise<RemoveState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are signed out. Sign in again first.' };

  const devices = verifiedFactors(user.factors);
  const factorId = String(formData.get('factorId') ?? '');
  if (!devices.some((d) => d.id === factorId)) return { error: 'That device is not on your account.' };

  const profile = await getLearnerProfile(user.id);
  const aal = await verifiedAal(user.id);
  const allowed = canRemoveDevice({
    isStaff: isStaff(profile),
    verifiedFactorCount: devices.length,
    aal,
    enforced: twoStepEnforced(),
  });
  if (!allowed) {
    return {
      error:
        aal !== 'aal2'
          ? "Type today's code first, then remove the device."
          : 'Staff keep at least one device. Add the new one first, then remove the old one.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { error: twoStepProblem(error.code, error.status) };

  revalidatePath(TWO_STEP_SETUP_PATH);
  redirect(`${TWO_STEP_SETUP_PATH}?removed=1`);
}
