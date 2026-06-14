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
            'Aucun abonnement Stripe trouvé pour ce compte. Si vous avez souscrit avec un autre email, contactez le support.',
        },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const appUrl = resolveServerAppOrigin();

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/espace?section=abonnement&billing=return`,
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
          ? 'Portail Stripe non configuré. Activez le Customer Portal dans le Dashboard Stripe.'
          : message,
      },
      { status: isConfig ? 503 : 500 }
    );
  }
}
