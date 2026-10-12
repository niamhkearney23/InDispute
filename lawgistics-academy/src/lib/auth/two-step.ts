/**
 * Two-step sign-in: the rules, with nothing to fetch.
 *
 * Staff (an administrator, a coach or a firm administrator) can see every
 * learner's record and, through the service role, write to the question bank.
 * A password alone is one leaked spreadsheet away from all of that, so staff
 * also type a six-digit code from an authenticator app on their phone. The
 * code is Supabase Auth's own (TOTP), and a session that has passed it is
 * marked `aal2` in its signed token.
 *
 * Kept free of anything server-only so the middleware, the pages and the tests
 * all read the same decisions. Where a decision is a security control, the
 * caller (`src/lib/admin/guard.ts`) supplies facts it has verified.
 */

import { safeNext } from '@/lib/safe-next';

/**
 * The address a request asked for, written by the middleware so the admin
 * guard can send somebody back to the right staff page after two-step
 * sign-in. Pages cannot otherwise tell their own address on the server. The
 * middleware overwrites anything a browser sent under this name, and the
 * guard still passes it through `returnPath` and takes only /admin paths.
 */
export const REQUEST_PATH_HEADER = 'x-lg-request-path';

/** Where somebody adds an authenticator app. */
export const TWO_STEP_SETUP_PATH = '/account/two-step';

/** Where somebody who has one types today's code after their password. */
export const TWO_STEP_CODE_PATH = '/two-step';

/**
 * Supabase keeps no recovery codes for an authenticator app, so the spare is a
 * second device: a second phone, or a password manager that keeps codes. Two
 * is enough for that and few enough that a person can name both.
 */
export const MAX_DEVICES = 2;

/**
 * Whether staff must use two-step sign-in. On unless the deployment says
 * exactly `STAFF_TWO_STEP=off`.
 *
 * The switch exists for local development and the visual check's stand-in
 * Supabase, which cannot hand out codes. Anything other than the word `off`
 * leaves it on, so a typo fails safe. On Vercel's production deployment the
 * switch is ignored altogether, because a staff page reachable with a
 * password alone is not something a settings screen should be able to cause
 * by accident.
 */
export function twoStepEnforced(
  flag: string | undefined = process.env.STAFF_TWO_STEP,
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
): boolean {
  if (vercelEnv === 'production') return true;
  return (flag ?? '').trim().toLowerCase() !== 'off';
}

/** The three staff flags, any one of which makes a person staff. */
export function isStaff(
  profile: { isAdmin?: boolean; isCoach?: boolean; isFirmAdmin?: boolean } | null | undefined,
): boolean {
  return Boolean(profile?.isAdmin || profile?.isCoach || profile?.isFirmAdmin);
}

/** A factor as Supabase returns it on the user: only the fields read here. */
export interface FactorLike {
  id: string;
  status: string;
  factor_type: string;
  friendly_name?: string;
  created_at?: string;
}

/** Factors the person has confirmed with a code. An unfinished setup is not one. */
export function verifiedFactors<T extends FactorLike>(factors: readonly T[] | null | undefined): T[] {
  return (factors ?? []).filter((f) => f.status === 'verified');
}

/**
 * What the staff area does with this person.
 *
 * - `allow`: not staff, enforcement switched off, or staff who typed a code
 *   this session.
 * - `setup`: staff with no authenticator app yet. They are sent to add one.
 * - `code`: staff with an app whose session has only had a password.
 *
 * No app wins over a code-checked session: if an administrator removed a lost
 * device, the session that used it may still say `aal2`, and the person
 * should add a device rather than carry on without one.
 */
export type TwoStepDecision = 'allow' | 'setup' | 'code';

export function twoStepDecision(input: {
  isStaff: boolean;
  verifiedFactorCount: number;
  aal: string | null | undefined;
  enforced: boolean;
}): TwoStepDecision {
  if (!input.isStaff || !input.enforced) return 'allow';
  if (input.verifiedFactorCount < 1) return 'setup';
  if (input.aal !== 'aal2') return 'code';
  return 'allow';
}

/**
 * Whether somebody must type a code before any signed-in page, staff or not.
 * A learner who chose to add an app is asked for it too, otherwise adding one
 * would protect nothing. Somebody with no app is never asked.
 */
export function needsCodeNow(input: {
  verifiedFactorCount: number;
  aal: string | null | undefined;
  enforced: boolean;
}): boolean {
  return input.enforced && input.verifiedFactorCount > 0 && input.aal !== 'aal2';
}

/**
 * Whether a device may be removed by its owner. Removing a confirmed device
 * needs a code-checked session, which Supabase enforces as well. Staff keep
 * at least one while enforcement is on, because removing the last would only
 * send them straight back to add another; to replace a phone they add the new
 * one first. A learner may remove their only one, which turns two-step
 * sign-in off for them.
 */
export function canRemoveDevice(input: {
  isStaff: boolean;
  verifiedFactorCount: number;
  aal: string | null | undefined;
  enforced: boolean;
}): boolean {
  if (input.aal !== 'aal2') return false;
  if (input.isStaff && input.enforced && input.verifiedFactorCount <= 1) return false;
  return input.verifiedFactorCount > 0;
}

/** Whether another device may be added: below the limit, and code-checked if one exists. */
export function canAddDevice(input: {
  verifiedFactorCount: number;
  aal: string | null | undefined;
}): boolean {
  if (input.verifiedFactorCount >= MAX_DEVICES) return false;
  // Supabase refuses a second device from a session that has not used the
  // first, so the page asks for today's code before offering it.
  return input.verifiedFactorCount === 0 || input.aal === 'aal2';
}

/** A six-digit code, with the spaces and dashes people type or paste removed. */
export function cleanCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/[\s-]/g, '');
  return /^\d{6}$/.test(digits) ? digits : null;
}

/**
 * The secret, in groups of four, for somebody typing it into their app by
 * hand. The groups are there so a person can keep their place; the page tells
 * them the spaces are not part of the key.
 */
export function groupSecret(secret: string): string {
  return secret.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');
}

/** The address of the code step, coming back to `next` afterwards. */
export function codePathFor(next: string): string {
  return `${TWO_STEP_CODE_PATH}?next=${encodeURIComponent(next)}`;
}

/** The address of the setup page, coming back to `next` afterwards. */
export function setupPathFor(next: string): string {
  return `${TWO_STEP_SETUP_PATH}?next=${encodeURIComponent(next)}`;
}

/**
 * Where to go once the code is typed. Only a path on this site, and never the
 * code step itself, which would send somebody who has just passed it round in
 * a circle.
 */
export function returnPath(next: unknown, fallback = '/dashboard'): string {
  const target = safeNext(typeof next === 'string' ? next : null, fallback);
  const path = target.split(/[?#]/)[0];
  return path === TWO_STEP_CODE_PATH ? fallback : target;
}

/**
 * The staff page to come back to after two-step sign-in: the one asked for
 * (from `REQUEST_PATH_HEADER`) when it is a staff page on this site, or the
 * guard's own default when it is anything else or missing.
 */
export function staffReturnPath(requested: string | null | undefined, fallback: string): string {
  const target = returnPath(requested, fallback);
  const path = target.split(/[?#]/)[0];
  return path === '/admin' || path.startsWith('/admin/') ? target : fallback;
}

/**
 * The name a device is listed under. Supabase refuses two with the same name
 * on one account, and a person with two phones needs to tell them apart, so
 * it carries the day it was added and a number if that day already has one.
 */
export function deviceName(existing: readonly { friendly_name?: string }[], now: Date): string {
  const day = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(now);
  const base = `Authenticator app added ${day}`;
  const taken = new Set(existing.map((f) => f.friendly_name));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const name = `${base} (${n})`;
    if (!taken.has(name)) return name;
  }
}

/**
 * What a person is told when Supabase refuses a code or a setup, by the
 * error's code. Supabase's own words are for the logs: these say what to do.
 */
export function twoStepProblem(code: string | undefined, status?: number): string {
  if (code === 'over_request_rate_limit' || status === 429) {
    return 'Too many tries in a short time. Wait five minutes, then try again.';
  }
  if (code === 'mfa_challenge_expired') {
    return 'That took too long. Type the code showing now.';
  }
  if (code === 'mfa_totp_enroll_not_enabled' || code === 'mfa_totp_verify_not_enabled') {
    return (
      'Two-step sign-in is switched off for this site in Supabase. ' +
      'Ask your administrator to switch on the authenticator app option.'
    );
  }
  if (code === 'too_many_enrolled_mfa_factors') {
    return 'This account already has as many devices as it can. Remove one first.';
  }
  if (code === 'insufficient_aal') {
    return 'Type the code from a device you already have first, then try again.';
  }
  return (
    'That code did not work. The code changes every 30 seconds, so type the one ' +
    'showing now. If it still fails, check the phone sets its clock automatically.'
  );
}
