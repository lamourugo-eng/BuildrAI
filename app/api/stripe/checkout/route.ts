import { resolveServerAppOrigin } from '@/lib/auth/callback-url';
import { NextResponse } from 'next/server';
import { getPriceId, getStripe, type BillingPeriod, type PlanId } from '@/lib/stripe';

/**
 * Crée une session Stripe Checkout.
 * POST { plan: 'starter' | 'growth', period: 'monthly' | 'semester', email?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const plan = body.plan as PlanId;
    const period = (body.period as BillingPeriod) || 'monthly';
    const email = body.email as string | undefined;

    if (!['starter', 'growth'].includes(plan)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    const stripe = getStripe();
    const priceId = getPriceId(plan, period);
    const appUrl = resolveServerAppOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/espace?checkout=success`,
      cancel_url: `${appUrl}/#pricing`,
      customer_email: email,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { plan, period },
      },
      metadata: { plan, period },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    const isConfig = message.includes('manquant') || message.includes('non configuré');
    const isMissingPrice =
      message.includes('No such price') || message.includes('resource_missing');

    let error = message;
    if (isConfig) {
      error = 'Stripe non configuré. Renseignez les variables dans .env.local';
    } else if (isMissingPrice) {
      error =
        'Prix Stripe introuvable : la clé API (test/live) et les STRIPE_PRICE_* sur Vercel ne correspondent pas. Utilisez sk_live_... avec les price_... live, ou relancez npm.cmd run stripe:sync.';
    }

    return NextResponse.json(
      { error },
      { status: isConfig ? 503 : isMissingPrice ? 503 : 500 }
    );
  }
}
