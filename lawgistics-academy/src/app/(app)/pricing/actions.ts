'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getLearnerProfile } from '@/lib/learner-overview';
import { publicEnv } from '@/lib/env';
import { brand } from '@/lib/brand';
import { PRICES, asPlan, normaliseCode } from '@/lib/access/rules';
import { accessFor, paymentsOn } from '@/lib/access/service';
import { stripe } from '@/lib/access/stripe';

/** Where this request came from, so Stripe sends people back to the same site. */
async function siteOrigin(): Promise<string> {
  const origin = (await headers()).get('origin');
  return (origin && /^https?:\/\//.test(origin) ? origin : publicEnv.siteUrl).replace(/\/+$/, '');
}

/**
 * Sending the signed-in person to Stripe's checkout to pay. The price is
 * the one for their country, read from their profile on the server; the
 * form says only monthly or yearly. Who it is for is written into the
 * subscription itself, so the payment can only ever land on this account.
 */
export async function startCheckout(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/pricing');
  if (!paymentsOn()) redirect('/pricing');

  const plan = asPlan(formData.get('plan'));
  if (!plan) redirect('/pricing');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');
  const price = PRICES[profile.country][plan];
  const state = await accessFor(user.id);
  const origin = await siteOrigin();

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: price.currency,
          unit_amount: price.amount,
          recurring: { interval: plan },
          product_data: { name: `${brand.fullName}, ${plan === 'month' ? 'monthly' : 'yearly'}` },
        },
      },
    ],
    ...(state.subscription?.customerId
      ? { customer: state.subscription.customerId }
      : { customer_email: user.email ?? undefined }),
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${origin}/pricing?paid=1`,
    cancel_url: `${origin}/pricing`,
  });

  if (!session.url) redirect('/pricing');
  redirect(session.url);
}

/** Stripe's own page for changing the card or cancelling. */
export async function openBilling(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/pricing');
  if (!paymentsOn()) redirect('/pricing');

  const state = await accessFor(user.id);
  const customer = state.subscription?.customerId;
  if (!customer) redirect('/pricing');

  const portal = await stripe().billingPortal.sessions.create({
    customer,
    return_url: `${await siteOrigin()}/pricing`,
  });
  redirect(portal.url);
}

/** Wrong codes allowed in CODE_WINDOW_MS before the form stops looking codes up. */
const CODE_ATTEMPTS_PER_HOUR = 10;
const CODE_WINDOW_MS = 60 * 60 * 1000;

export interface CodeState {
  error: string | null;
  ok?: string;
}

/**
 * Entering a code from a firm or university. This only asks: somebody at
 * the firm confirms the person before it makes anything free, because a
 * code gets passed around. The code is looked up on the server, one at a
 * time, so nobody can list which codes exist.
 */
export async function redeemCode(_prev: CodeState, formData: FormData): Promise<CodeState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };

  const code = normaliseCode(String(formData.get('code') ?? ''));
  if (!code)
    return { error: 'That does not look like a code. Check it with whoever gave it to you.' };

  const db = createServiceClient();

  // Codes are short enough to guess by trying, and a right guess is a
  // request to a firm the person is not with. Ten wrong ones in an hour and
  // the form stops looking codes up until the oldest of them is an hour old.
  // A count that cannot be read counts as the limit reached, as the tutor's
  // does: a broken counter must not become no limit.
  const since = new Date(Date.now() - CODE_WINDOW_MS).toISOString();
  const { count, error: countError } = await db
    .from('code_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('attempted_at', since);
  if (countError || count === null || count >= CODE_ATTEMPTS_PER_HOUR) {
    return {
      error:
        'That is too many codes that did not match for now. Wait an hour, or check the code ' +
        'with whoever gave it to you.',
    };
  }

  const { data: found } = await db
    .from('access_codes')
    .select('id, label')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();
  if (!found) {
    // Only a wrong code counts; a typo caught by the shape check above, or a
    // right code entered twice, does not.
    await db.from('code_attempts').insert({ user_id: user.id });
    return { error: 'That code was not recognised. Check it with whoever gave it to you.' };
  }

  const { data: existing } = await db
    .from('access_grants')
    .select('code_id, decision')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing?.code_id === found.id && existing?.decision === 'declined') {
    return {
      error: `${found.label} has said you are not with them. If that is wrong, ask them directly.`,
    };
  }
  if (existing?.code_id === found.id && existing?.decision === 'confirmed') {
    return { error: null, ok: `${found.label} has already confirmed you.` };
  }

  const { error } = await db
    .from('access_grants')
    .upsert({ user_id: user.id, code_id: found.id }, { onConflict: 'user_id' });
  if (error) return { error: 'That could not be saved. Please try again.' };

  revalidatePath('/pricing');
  revalidatePath('/admin/access');
  return {
    error: null,
    ok: `Thanks. Somebody at ${found.label} will confirm you, and then it is free.`,
  };
}
