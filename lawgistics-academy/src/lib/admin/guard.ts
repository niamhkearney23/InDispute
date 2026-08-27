import 'server-only';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';

/**
 * Server-side authorisation for the two staff roles.
 *
 * Hiding a link in the navigation is presentation, not security. Every staff
 * page and every staff action must call one of these, because the write paths
 * use the service role client, which bypasses Row Level Security entirely, so
 * these checks are the only thing standing between a signed-in learner and the
 * question bank.
 *
 * Two roles, and the difference matters to a firm.
 *
 *   An ADMINISTRATOR owns the product. They write questions, edit the firm's
 *   documents, invite people and run setup.
 *
 *   A COACH is the lawyer who supervises the juniors. They decide whether
 *   content is sound and whether a person is ready. They log in every week, and
 *   they are deliberately not given the ability to write content: editing a
 *   question mints a new version and clears its sign-off, so somebody who could
 *   edit and verify could rewrite an item and sign their own rewrite with the
 *   audit trail showing an ordinary review. A coach who thinks an item is wrong
 *   flags it with a note, and somebody else changes it.
 *
 * An administrator is always a coach as well, so `requireCoach` lets them
 * through. Nothing asks "is this person only a coach".
 */

/** Administrator: may write content and change the firm's setup. */
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

/**
 * Coach: may sign content off and record supervisor decisions.
 *
 * Returns `isAdmin` as well so a page can render the same view for both and
 * leave out the parts a coach has no business pressing, rather than existing
 * twice. That flag decides what is drawn; it never decides what is allowed.
 * Anything an administrator may do and a coach may not still calls
 * `requireAdmin` or `checkAdmin` in the action itself.
 */
export async function requireCoach(): Promise<{ userId: string; isAdmin: boolean }> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin/review');

  const profile = await getLearnerProfile(user.id);
  if (!profile?.isAdmin && !profile?.isCoach) redirect('/dashboard');

  return { userId: user.id, isAdmin: Boolean(profile?.isAdmin) };
}

/** Non-redirecting variant, for server actions that return an error instead. */
export async function checkCoach(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getLearnerProfile(user.id);
  return profile?.isAdmin || profile?.isCoach ? user.id : null;
}
