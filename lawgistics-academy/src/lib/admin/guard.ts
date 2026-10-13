import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { verifiedAal } from '@/lib/auth/two-step-server';
import {
  REQUEST_PATH_HEADER,
  codePathFor,
  setupPathFor,
  staffReturnPath,
  twoStepDecision,
  twoStepEnforced,
  verifiedFactors,
  type TwoStepDecision,
} from '@/lib/auth/two-step';
import { MAINTENANCE_PATH, siteAccess, staffAreaOpen } from '@/lib/security/site-access';

/**
 * Server-side authorisation for the three staff roles.
 *
 * Hiding a link in the navigation is presentation, not security. Every staff
 * page and every staff action must call one of these, because the write paths
 * use the service role client, which bypasses Row Level Security entirely, so
 * these checks are the only thing standing between a signed-in learner and the
 * question bank.
 *
 * Three roles, and the differences matter to a firm.
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
 *   A FIRM ADMINISTRATOR (0037) is the firm's own person who runs their
 *   people: invitations, the joining checklist, the firm's documents and
 *   codes, programme dates, the work board and the firm's figures. They never
 *   write or publish content, and they sign nothing off unless they are also a
 *   coach, because a sign-off is a lawyer's statement.
 *
 * An administrator is always a coach as well, so `requireCoach` lets them
 * through. A firm administrator passes `requireCoach` too, for the people and
 * the work board; signing off, marking a matter and grading the register ask
 * `checkReviewer`, which only an administrator or a coach passes. Nothing asks
 * "is this person only a coach".
 *
 * Every one of them also asks for two-step sign-in (`src/lib/auth/two-step.ts`)
 * once the role check has passed: a staff member with no authenticator app is
 * sent to add one, and one whose session has only had a password is sent to
 * type today's code. The check functions refuse instead, so an action returns
 * its error. This is the control; the middleware's redirect to the code step
 * only saves a page load.
 *
 * Before any of that, every one of them asks the site access switch
 * (`src/lib/security/site-access.ts`). When the owner has closed the staff
 * area (`SITE_ACCESS` is `staff-closed`, `closed` or anything unrecognised),
 * the page guards send the person to the maintenance page and the check
 * functions refuse, whoever is asking. The middleware closes /admin too, but
 * a server action can be posted to any page's address, so this is the check
 * that holds for actions. It only ever refuses: nothing here is skipped
 * because of it.
 */

/** Whether the owner has closed the staff area. Asked first by every guard. */
function staffAreaClosed(): boolean {
  return !staffAreaOpen(siteAccess());
}

/**
 * Where this staff member stands on two-step sign-in. Called only once the
 * role check has passed, so the person is staff.
 *
 * The devices come from the user Supabase just returned to `getCurrentUser`,
 * not from the cookie, and the level comes from the signed token
 * (`verifiedAal`), so neither can be written by the browser.
 */
async function staffTwoStep(user: User): Promise<TwoStepDecision> {
  const enforced = twoStepEnforced();
  if (!enforced) return 'allow';
  const verifiedFactorCount = verifiedFactors(user.factors).length;
  // With no device the answer is "add one" whatever the level says, so the
  // token is not read at all.
  const aal = verifiedFactorCount > 0 ? await verifiedAal(user.id) : null;
  return twoStepDecision({ isStaff: true, verifiedFactorCount, aal, enforced });
}

/**
 * For the page guards: sends staff to add a device or type a code, then back
 * to the staff page they asked for, or to `home` when that cannot be told.
 */
async function requireStaffTwoStep(user: User, home: string): Promise<void> {
  const decision = await staffTwoStep(user);
  if (decision === 'allow') return;
  const back = staffReturnPath((await headers()).get(REQUEST_PATH_HEADER), home);
  if (decision === 'setup') redirect(setupPathFor(back));
  if (decision === 'code') redirect(codePathFor(back));
}

/** For the action guards: true only when this staff member may act now. */
async function passesStaffTwoStep(user: User): Promise<boolean> {
  return (await staffTwoStep(user)) === 'allow';
}

/** Administrator: may write content and change the firm's setup. */
export async function requireAdmin(): Promise<{ userId: string }> {
  if (staffAreaClosed()) redirect(MAINTENANCE_PATH);
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin');

  const profile = await getLearnerProfile(user.id);
  if (!profile?.isAdmin) redirect('/dashboard');
  await requireStaffTwoStep(user, '/admin');

  return { userId: user.id };
}

/** Non-redirecting variant, for server actions that return an error instead. */
export async function checkAdmin(): Promise<string | null> {
  if (staffAreaClosed()) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getLearnerProfile(user.id);
  if (!profile?.isAdmin) return null;
  return (await passesStaffTwoStep(user)) ? user.id : null;
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
export async function requireCoach(): Promise<{
  userId: string;
  isAdmin: boolean;
  /** May run the firm's own setup: an administrator or a firm administrator. */
  isFirmAdmin: boolean;
  /** May sign content off: an administrator or a coach, never a firm administrator alone. */
  isReviewer: boolean;
}> {
  if (staffAreaClosed()) redirect(MAINTENANCE_PATH);
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin/review');

  const profile = await getLearnerProfile(user.id);
  if (!profile?.isAdmin && !profile?.isCoach && !profile?.isFirmAdmin) redirect('/dashboard');
  await requireStaffTwoStep(user, '/admin/work');

  return {
    userId: user.id,
    isAdmin: Boolean(profile?.isAdmin),
    isFirmAdmin: Boolean(profile?.isAdmin || profile?.isFirmAdmin),
    isReviewer: Boolean(profile?.isAdmin || profile?.isCoach),
  };
}

/** Non-redirecting variant, for server actions that return an error instead. */
export async function checkCoach(): Promise<string | null> {
  if (staffAreaClosed()) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getLearnerProfile(user.id);
  if (!profile?.isAdmin && !profile?.isCoach && !profile?.isFirmAdmin) return null;
  return (await passesStaffTwoStep(user)) ? user.id : null;
}

/**
 * A lawyer's judgement: signing a question, a matter or a lesson off, marking
 * a matter, grading the certification register. An administrator or a coach,
 * never a firm administrator on that flag alone.
 */
export async function requireReviewer(): Promise<{ userId: string; isAdmin: boolean }> {
  if (staffAreaClosed()) redirect(MAINTENANCE_PATH);
  // requireCoach has already asked for two-step sign-in.
  const staff = await requireCoach();
  if (!staff.isReviewer) redirect('/admin/trainees');
  return { userId: staff.userId, isAdmin: staff.isAdmin };
}

/** Non-redirecting variant, for server actions that return an error instead. */
export async function checkReviewer(): Promise<string | null> {
  if (staffAreaClosed()) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getLearnerProfile(user.id);
  if (!profile?.isAdmin && !profile?.isCoach) return null;
  return (await passesStaffTwoStep(user)) ? user.id : null;
}

/**
 * Firm administrator: runs the firm's own people and setup, never content.
 * An administrator passes too.
 */
export async function requireFirmAdmin(): Promise<{ userId: string; isAdmin: boolean }> {
  if (staffAreaClosed()) redirect(MAINTENANCE_PATH);
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin');

  const profile = await getLearnerProfile(user.id);
  if (!profile?.isAdmin && !profile?.isFirmAdmin) redirect('/dashboard');
  await requireStaffTwoStep(user, '/admin/work');

  return { userId: user.id, isAdmin: Boolean(profile?.isAdmin) };
}

/** Non-redirecting variant, for server actions that return an error instead. */
export async function checkFirmAdmin(): Promise<string | null> {
  if (staffAreaClosed()) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getLearnerProfile(user.id);
  if (!profile?.isAdmin && !profile?.isFirmAdmin) return null;
  return (await passesStaffTwoStep(user)) ? user.id : null;
}
