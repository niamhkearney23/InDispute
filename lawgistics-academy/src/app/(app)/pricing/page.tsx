import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { brand } from '@/lib/brand';
import { Button, Card, Notice, Pill } from '@/components/ui';
import { PRICES, formatPrice, traineeValue } from '@/lib/access/rules';
import { accessFor, paymentsOn } from '@/lib/access/service';
import { openBilling, startCheckout } from './actions';
import { CodeForm } from './code-form';

export const metadata: Metadata = { title: 'Your plan' };

/**
 * What somebody pays, or why they do not. Open to everybody signed in,
 * paid or not: it is where the gate on every training page sends people.
 */
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/pricing');
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');
  // The price depends on the country they train in, which onboarding asks.
  if (!profile.onboardedAt) redirect('/onboarding');

  const { paid } = await searchParams;
  const on = paymentsOn();
  const state = await accessFor(user.id);
  const prices = PRICES[profile.country];
  const month = formatPrice(prices.month);
  const year = formatPrice(prices.year);

  const freeBecause: Record<string, string> = {
    staff: 'You are staff here, so there is nothing to pay.',
    trainee: `You are a confirmed trainee with ${brand.firm}. ${traineeValue(on).line}`,
    invited: 'You joined through your firm, so there is nothing to pay.',
    firm: `${state.request?.label ?? 'Your firm'} has confirmed you, so there is nothing to pay.`,
  };

  const periodEnd = state.subscription?.periodEnd
    ? new Date(state.subscription.periodEnd).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const request = state.request;
  // Why they are free, if they are, whether or not anybody is charged yet.
  const free =
    state.standing && state.standing !== 'paid' && state.standing !== 'payments-off'
      ? state.standing
      : null;
  // Somebody who signed up as a trainee and is waiting for a supervisor is
  // never offered a plan: their month is free once confirmed, so the only
  // price they see is the yearly one it is worth.
  const pendingTrainee =
    !free && state.reason !== 'paid' && profile.track === 'litigation_trainee';
  const showCode =
    !pendingTrainee && free !== 'staff' && free !== 'trainee' && free !== 'invited';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section>
        <p className="eyebrow mb-2">Your plan</p>
        <h1 className="text-3xl sm:text-4xl">
          {free || state.reason === 'paid'
            ? 'You are all set'
            : pendingTrainee
              ? 'Your place'
              : 'Choose how to train'}
        </h1>
      </section>

      {paid === '1' && state.reason !== 'paid' ? (
        <Notice tone="good">
          Thank you. Stripe is confirming your payment, which usually takes a few seconds. Reload
          this page if it has not updated.
        </Notice>
      ) : null}

      {free ? (
        <Card>
          <p className="font-semibold">Free</p>
          <p className="mt-1 text-sm text-slate">{freeBecause[free]}</p>
        </Card>
      ) : pendingTrainee ? (
        <Card>
          <p className="font-semibold">
            {traineeValue(on).price} a year &middot; Free
          </p>
          <p className="mt-1 text-sm text-slate">Your supervisor confirms your place.</p>
        </Card>
      ) : !on ? (
        <Card>
          <p className="font-semibold">Free for now</p>
          <p className="mt-1 text-sm text-slate">
            Nothing is charged yet. When paid plans start they will be {month} a month or {year} a
            year. Anyone with a code from a firm or university we work with is free once they confirm it.
          </p>
        </Card>
      ) : state.reason === 'paid' ? (
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">You have a plan</p>
            {state.subscription?.status === 'past_due' ? (
              <Pill tone="warn">Card needs updating</Pill>
            ) : (
              <Pill tone="correct">Active</Pill>
            )}
          </div>
          {periodEnd ? <p className="mt-1 text-sm text-slate">Paid up to {periodEnd}.</p> : null}
          <form action={openBilling} className="mt-4">
            <Button type="submit" variant="outline">
              Change card or cancel
            </Button>
          </form>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ['month', 'Monthly', month, 'a month', 'Cancel any time.'],
              [
                'year',
                'Yearly',
                year,
                'a year',
                `About ${Math.round(100 - (prices.year.amount / (prices.month.amount * 12)) * 100)}% less than paying monthly.`,
              ],
            ] as const
          ).map(([plan, name, amount, per, note]) => (
            <Card key={plan} className="flex flex-col">
              <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-muted uppercase">
                {name}
              </p>
              <p className="mt-2">
                <span className="font-serif text-4xl">{amount}</span>{' '}
                <span className="text-slate">{per}</span>
              </p>
              <p className="mt-1 text-sm text-slate">{note}</p>
              <form action={startCheckout} className="mt-5">
                <input type="hidden" name="plan" value={plan} />
                <Button
                  type="submit"
                  variant={plan === 'year' ? 'accent' : 'outline'}
                  className="w-full"
                >
                  Choose {name.toLowerCase()}
                </Button>
              </form>
            </Card>
          ))}
          <p className="text-xs text-muted sm:col-span-2">
            You pay on Stripe&rsquo;s page; this site never sees your card. Prices are for training
            on {profile.country === 'MY' ? 'Malaysian' : 'Australian'} law.
          </p>
        </div>
      )}

      {showCode ? (
        <Card>
          <p className="font-semibold">With a firm or university?</p>
          <p className="mt-1 mb-4 text-sm text-slate">
            Enter the code they gave you. Once somebody there confirms you, it is free.
          </p>
          {request && request.codeActive && request.decision !== 'confirmed' ? (
            <div className="mb-4">
              {request.decision === 'declined' ? (
                <Notice tone="warn">
                  {request.label} said you are not with them. If that is wrong, ask them directly.
                </Notice>
              ) : (
                <Notice tone="neutral">Waiting for {request.label} to confirm you.</Notice>
              )}
            </div>
          ) : null}
          {request && !request.codeActive ? (
            <div className="mb-4">
              <Notice tone="warn">The code for {request.label} has been switched off.</Notice>
            </div>
          ) : null}
          {request?.decision === 'confirmed' && request.codeActive ? null : <CodeForm />}
        </Card>
      ) : null}
    </div>
  );
}
