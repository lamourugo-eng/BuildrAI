import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

/**
 * Webhook Stripe. À configurer dans le Dashboard Stripe.
 * Gère checkout.session.completed, customer.subscription.updated/deleted.
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
        // TODO: créer/mettre à jour l'abonnement dans Supabase
        const session = event.data.object;
        console.log('[stripe] checkout completed', session.id);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        // TODO: synchroniser le statut d'abonnement Supabase
        const subscription = event.data.object;
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
