import { resolveServerAppOrigin } from '@/lib/auth/callback-url';
import {
  formatStripeConfigError,
  getMissingStripeEnvKeys,
} from '@/lib/stripe/required-env';
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

    const missing = getMissingStripeEnvKeys(plan, period);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: formatStripeConfigError(missing, plan, period), missing },
        { status: 503 }
      );
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
    const isMissingPrice =
      message.includes('No such price') || message.includes('resource_missing');

    let error = message;
    if (isMissingPrice) {
      error =
        'Prix Stripe introuvable : la clé API (test/live) et les STRIPE_PRICE_* sur Vercel ne correspondent pas. Relancez npm.cmd run stripe:sync avec sk_live_..., mettez à jour Vercel, puis redeploy.';
    }

    return NextResponse.json(
      { error },
      { status: isMissingPrice ? 503 : 500 }
    );
  }
}
