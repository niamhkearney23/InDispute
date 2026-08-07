import 'server-only';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';

/**
 * Server-side admin authorisation.
 *
 * Hiding the admin link in the navigation is presentation, not security. Every
 * admin page and every admin action must call this, the admin write paths use
 * the service role client, which bypasses Row Level Security entirely, so this
 * check is the only thing standing between a signed-in learner and the question
 * bank.
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin');

  const profile = await getLearnerProfile(user.id);
  if (!profile?.isAdmin) redirect('/dashboard');

  return { userId: user.id };
}

/** Non-redirecting variant, for server actions that return an error instead. */
export async function checkAdmin(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getLearnerProfile(user.id);
  return profile?.isAdmin ? user.id : null;
}
