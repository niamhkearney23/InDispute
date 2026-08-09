import type { RiskLevel } from './triage';

/**
 * How long a sign-off holds.
 *
 * A verification is a statement that something was true when a named person
 * looked at it. It is not a statement that it will still be true in three
 * years, and the app should not quietly imply otherwise. So every sign-off
 * carries a date it runs out on, after which the item goes back into the queue
 * as needing another look.
 *
 * Pure and free of the database on purpose: this is the rule that decides
 * whether the firm can trust what it is being shown, and it should be readable
 * and testable without standing a Postgres up.
 */

/** What a reviewer may choose. Months. */
export const HOLD_CHOICES = [6, 12, 24] as const;
export type HoldMonths = (typeof HOLD_CHOICES)[number];

export function asHoldMonths(value: unknown): HoldMonths | null {
  const n = Number(value);
  return (HOLD_CHOICES as readonly number[]).includes(n) ? (n as HoldMonths) : null;
}

/**
 * The default offered when verifying, taken from the queue's own risk score.
 *
 * Only the default. The reviewer knows whether they have just checked that the
 * plaintiff bears the onus of proof or that a filing fee is a particular
 * figure, and a regular expression does not. Riskier content is offered a
 * shorter hold because those are the items whose wrongness is both likelier and
 * more expensive.
 */
export function defaultHold(level: RiskLevel): HoldMonths {
  if (level === 'high') return 6;
  if (level === 'medium') return 12;
  return 24;
}

/** The date a sign-off made today would run out, as YYYY-MM-DD. */
export function dueDateFrom(months: HoldMonths, today: Date = new Date()): string {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const targetMonth = d.getUTCMonth() + months;
  const candidate = new Date(Date.UTC(d.getUTCFullYear(), targetMonth, d.getUTCDate()));

  // 31 August plus six months is 31 February, which JavaScript rolls forward
  // into March. Pull it back to the last day of the intended month instead, so
  // a hold is never quietly a few days longer than the reviewer chose.
  if (candidate.getUTCMonth() !== ((targetMonth % 12) + 12) % 12) {
    candidate.setUTCDate(0);
  }
  return candidate.toISOString().slice(0, 10);
}

/**
 * Whether a sign-off has run out.
 *
 * Only a verified item can lapse. Something never verified is not lapsed, it is
 * simply unverified, and collapsing the two would lose the distinction between
 * "nobody has ever checked this" and "somebody checked it and it is due again".
 */
export function isLapsed(
  verificationStatus: string,
  reviewDueOn: string | null,
  today: string,
): boolean {
  if (verificationStatus !== 'human_verified') return false;
  if (!reviewDueOn) return false;
  return reviewDueOn <= today;
}

/** Days until a sign-off runs out. Negative once it has. */
export function daysUntilDue(reviewDueOn: string, today: string): number {
  const day = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, (m ?? 1) - 1, d ?? 1) / 86_400_000;
  };
  return day(reviewDueOn) - day(today);
}

/** Verified, not yet lapsed, but close enough to plan around. */
export function isDueSoon(
  verificationStatus: string,
  reviewDueOn: string | null,
  today: string,
  withinDays = 60,
): boolean {
  if (verificationStatus !== 'human_verified' || !reviewDueOn) return false;
  const days = daysUntilDue(reviewDueOn, today);
  return days > 0 && days <= withinDays;
}
