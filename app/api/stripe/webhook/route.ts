import { getStripe } from '@/lib/stripe';
import {
  planFromMetadata,
  periodFromMetadata,
  resolveStripePlanAndPeriod,
} from '@/lib/stripe/plan-resolution';
import type Stripe from 'stripe';
import { NextResponse } from 'next/server';

async function repairSubscriptionMetadata(
  subscriptionId: string,
  hints?: { plan?: string | null; period?: string | null }
) {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  });

  const price = sub.items.data[0]?.price;
  const product =
    price?.product && typeof price.product === 'object' ? price.product : null;

  const resolved = resolveStripePlanAndPeriod({
    subscriptionMetadata: sub.metadata,
    priceMetadata: price?.metadata,
    productMetadata:
      product && 'metadata' in product
        ? (product.metadata as Record<string, string>)
        : null,
    priceId: price?.id,
    recurringInterval: price?.recurring?.interval,
    recurringIntervalCount: price?.recurring?.interval_count,
  });

  const nextPlan =
    planFromMetadata(sub.metadata) ??
    (hints?.plan === 'growth' || hints?.plan === 'starter' ? hints.plan : null) ??
    resolved.planId;
  const nextPeriod =
    periodFromMetadata(sub.metadata) ??
    (hints?.period ? periodFromMetadata({ period: hints.period }) : null) ??
    resolved.period;

  const metadata: Record<string, string> = { ...sub.metadata };
  let changed = false;

  if (nextPlan && metadata.plan !== nextPlan) {
    metadata.plan = nextPlan;
    changed = true;
  }
  if (nextPlan && metadata.plan_id !== nextPlan) {
    metadata.plan_id = nextPlan;
    changed = true;
  }
  if (nextPeriod && metadata.period !== nextPeriod) {
    metadata.period = nextPeriod;
    changed = true;
  }

  if (changed) {
    await stripe.subscriptions.update(subscriptionId, { metadata });
    console.log('[stripe] metadata réparée', subscriptionId, metadata);
  }
}

/**
 * Webhook Stripe. À configurer dans le Dashboard Stripe.
 * Répare les métadonnées plan/période pour garantir la bonne résolution côté app.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET manquant' },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (subscriptionId) {
          await repairSubscriptionMetadata(subscriptionId, {
            plan: session.metadata?.plan ?? null,
            period: session.metadata?.period ?? null,
          });
        }
        console.log('[stripe] checkout completed', session.id);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        if (event.type !== 'customer.subscription.deleted') {
          await repairSubscriptionMetadata(subscription.id);
        }
        console.log('[stripe] subscription', event.type, subscription.id);
        break;
      }
      default:
        console.log('[stripe] event ignoré', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur webhook';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
