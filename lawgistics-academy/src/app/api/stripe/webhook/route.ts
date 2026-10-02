import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { recordSubscription, stripe } from '@/lib/access/stripe';

/**
 * Where Stripe says a payment went through, renewed, failed or was cancelled.
 *
 * Off (404) unless the deployment has both Stripe secrets. Every message is
 * checked against Stripe's signature before anything is read from it, so a
 * request that did not come from Stripe changes nothing. This is the only
 * place a payment is recorded: the page somebody lands on after paying only
 * reads what this wrote.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return new NextResponse('Not found', { status: 404 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new NextResponse('Missing signature', { status: 400 });

  const body = await request.text();
  const client = stripe();
  let event: Stripe.Event;
  try {
    event = client.webhooks.constructEvent(body, signature, secret);
  } catch {
    return new NextResponse('Bad signature', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const id =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (id) await recordSubscription(await client.subscriptions.retrieve(id));
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await recordSubscription(event.data.object);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
