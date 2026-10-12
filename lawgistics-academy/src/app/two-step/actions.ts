'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { cleanCode, returnPath, twoStepProblem, verifiedFactors } from '@/lib/auth/two-step';

export type CodeState = { error: string | null };

/**
 * Today's code, after the password. Checked by Supabase, which marks the
 * session `aal2` and writes the new session into the cookies on the way back,
 * so the redirect below already carries it.
 *
 * The device must be one of the caller's own confirmed ones, read from the
 * user Supabase returns rather than from the form, so a made-up id gets the
 * same answer as a wrong code.
 */
export async function verifyTwoStepCode(_prev: CodeState, formData: FormData): Promise<CodeState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are signed out. Sign in again, then type the code.' };

  const code = cleanCode(formData.get('code'));
  if (!code) return { error: 'Type the six numbers your authenticator app shows.' };

  const devices = verifiedFactors(user.factors);
  const chosen = String(formData.get('factor') ?? '');
  const factor = devices.find((f) => f.id === chosen) ?? (devices.length === 1 ? devices[0] : null);
  if (!factor) {
    return {
      error: devices.length > 1 ? 'Choose the device you are using.' : 'This account has no authenticator app.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) return { error: twoStepProblem(error.code, error.status) };

  redirect(returnPath(formData.get('next')));
}
