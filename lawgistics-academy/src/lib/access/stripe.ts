import 'server-only';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/service';
import { subscriptionLive } from './rules';

/**
 * Stripe, for taking payment. The secret key lives only in the deployment's
 * settings and is read here, on the server; nothing about it reaches the
 * browser, which is sent to Stripe's own checkout page to pay.
 */
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Payments are not set up: STRIPE_SECRET_KEY is missing.');
  return new Stripe(key);
}

/** The end of what has been paid for. Stripe keeps it on each item. */
export function periodEnd(subscription: Stripe.Subscription): string | null {
  const ends = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((n): n is number => typeof n === 'number');
  return ends.length ? new Date(Math.max(...ends) * 1000).toISOString() : null;
}

/**
 * Write what Stripe says about a subscription onto the person it is for.
 *
 * The person comes from the subscription's own metadata, which this app set
 * when it opened the checkout for the signed-in user, never from anything the
 * browser sends. A late message about an old, ended subscription does not
 * overwrite a newer one that is paying.
 */
export async function recordSubscription(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const db = createServiceClient();
  const { data: current } = await db
    .from('subscriptions')
    .select('stripe_subscription_id, status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  const end = periodEnd(subscription);
  const now = new Date();
  if (
    current?.stripe_subscription_id &&
    current.stripe_subscription_id !== subscription.id &&
    subscriptionLive(
      current.status as string | null,
      current.current_period_end as string | null,
      now,
    ) &&
    !subscriptionLive(subscription.status, end, now)
  ) {
    return;
  }

  const customer =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  await db.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: end,
    },
    { onConflict: 'user_id' },
  );
}
