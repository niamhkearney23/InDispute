/**
 * Who pays, and how much. Pure, so it is tested directly; the part that reads
 * the database is in service.ts.
 *
 * Somebody training on their own pays. Somebody the academy reaches through
 * a firm does not: staff, confirmed trainees, people a firm invited, and
 * people who entered a firm's code and were confirmed by somebody there.
 * While payments are switched off, which is the default, nobody pays.
 */
import type { Country } from '@/lib/types';

export type Plan = 'month' | 'year';

export interface Price {
  /** In the smallest unit, as Stripe wants it: sen or cents. */
  amount: number;
  currency: 'myr' | 'aud';
}

/** The owner's prices. Malaysia in ringgit, Australia in dollars. */
export const PRICES: Record<Country, Record<Plan, Price>> = {
  MY: { month: { amount: 4900, currency: 'myr' }, year: { amount: 39000, currency: 'myr' } },
  AU: { month: { amount: 2900, currency: 'aud' }, year: { amount: 24900, currency: 'aud' } },
};

/** "RM 49" or "A$249". Whole units, because none of the prices have cents. */
export function formatPrice(price: Price): string {
  const units = price.amount / 100;
  const shown = Number.isInteger(units) ? String(units) : units.toFixed(2);
  return price.currency === 'myr' ? `RM ${shown}` : `A$${shown}`;
}

export function asPlan(value: unknown): Plan | null {
  return value === 'month' || value === 'year' ? value : null;
}

/**
 * A code as typed, made into a code as stored: capitals, spaces and
 * underscores as hyphens, anything else dropped. Null when what is left is
 * not a code at all, so the page can say so rather than look one up.
 */
export function normaliseCode(input: string): string | null {
  const code = input
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return /^[A-Z0-9-]{4,32}$/.test(code) ? code : null;
}

/**
 * Whether a subscription is paying for today. Stripe keeps retrying a card
 * that failed ("past_due"), and somebody whose renewal is being retried keeps
 * what they paid for until the period they paid for ends.
 */
export function subscriptionLive(
  status: string | null,
  periodEnd: string | null,
  now: Date,
): boolean {
  if (status === 'active' || status === 'trialing') return true;
  if (status === 'past_due' && periodEnd) return Date.parse(periodEnd) > now.getTime();
  return false;
}

export type AccessReason = 'payments-off' | 'staff' | 'trainee' | 'invited' | 'firm' | 'paid';

export interface AccessFacts {
  paymentsOn: boolean;
  isStaff: boolean;
  traineeConfirmed: boolean;
  joinedByInvitation: boolean;
  /** Confirmed by somebody at the firm, on a code that is still switched on. */
  firmConfirmed: boolean;
  paid: boolean;
}

/** Why this person is in, or null when they need to pay or be confirmed. */
export function accessReason(f: AccessFacts): AccessReason | null {
  if (!f.paymentsOn) return 'payments-off';
  if (f.isStaff) return 'staff';
  if (f.traineeConfirmed) return 'trainee';
  if (f.joinedByInvitation) return 'invited';
  if (f.firmConfirmed) return 'firm';
  if (f.paid) return 'paid';
  return null;
}

/**
 * What a trainee's free place is worth, said truthfully: the real yearly
 * price somebody training on their own pays, and no other number. While
 * payments are off nobody pays it yet, so it says "will pay"; a price that
 * nobody has ever been charged is not described as what the training costs.
 */
export function traineeValue(paymentsOn: boolean): { price: string; line: string } {
  const price = formatPrice(PRICES.MY.year);
  return {
    price,
    line: `Students on their own ${paymentsOn ? 'pay' : 'will pay'} ${price} a year for the Academy. For trainees it is included free.`,
  };
}
