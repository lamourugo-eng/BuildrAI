import { resolveServerAppOrigin } from '@/lib/auth/callback-url';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { findStripeCustomerIdByEmail } from '@/lib/stripe/subscription-sync';
import { NextResponse } from 'next/server';

/**
 * Ouvre le portail client Stripe (résiliation, factures, moyen de paiement).
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
    }

    const customerId = await findStripeCustomerIdByEmail(user.email);
    if (!customerId) {
      return NextResponse.json(
        {
          error:
            'Aucun abonnement Stripe trouvé pour ce compte. Si tu as souscrit avec un autre email, contacte le support.',
        },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const appUrl = resolveServerAppOrigin();
    const configuration = process.env.STRIPE_BILLING_PORTAL_CONFIG_ID?.trim();

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/espace?section=abonnement&billing=return`,
      ...(configuration ? { configuration } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    const isConfig =
      message.includes('manquant') ||
      message.includes('No configuration provided') ||
      message.includes('billing portal');

    return NextResponse.json(
      {
        error: isConfig
          ? 'Portail Stripe non configuré. Active le Customer Portal dans le Dashboard Stripe.'
          : message,
      },
      { status: isConfig ? 503 : 500 }
    );
  }
}
