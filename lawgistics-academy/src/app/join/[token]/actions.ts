'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { acceptInvitation } from '@/lib/onboarding/invitations';

/**
 * Taking up an invitation.
 *
 * This is the one server action in the app with no signed-in caller, because
 * the whole point of it is that the caller does not have an account yet. What
 * stands in for a session is the invitation token, which is 32 bytes of
 * CSPRNG output, stored only as a SHA-256 hash, single use, and expiring.
 * `acceptInvitation` verifies it before anything is written, and everything
 * about the resulting account, the email, the name, the country, the start
 * date, comes from the invitation rather than from this form.
 *
 * The form therefore decides exactly one thing: the password. It cannot choose
 * who it is joining as, it cannot set a start date, and there is no path
 * through it that grants administrator rights.
 */

export type JoinState = { error: string | null };

const schema = z.object({
  token: z.string().min(20).max(200),
  // Supabase enforces a minimum too; this is here so somebody gets a sentence
  // rather than a provider error, and so the two cannot drift apart silently.
  password: z
    .string()
    .min(10, 'Use at least 10 characters. This is a law firm’s system.')
    .max(200),
});

export async function join(_state: JoinState, formData: FormData): Promise<JoinState> {
  const parsed = schema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const result = await acceptInvitation(parsed.data.token, parsed.data.password);
  // Compared against null rather than tested for truthiness, so the union
  // narrows: an empty error string would otherwise leave `email` possibly null.
  if (result.error !== null) return { error: result.error };

  // Sign them in through the cookie-writing client so they land on their list
  // already signed in rather than being asked to log in to the account they
  // have just this second created.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.email,
    password: parsed.data.password,
  });

  if (error) {
    // The account exists and is fine; only the sign-in failed. Sending them to
    // the login page is honest and recoverable, and losing the password they
    // just chose is not a thing that happens here.
    redirect('/login?joined=1');
  }

  redirect('/start');
}
