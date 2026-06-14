import { getPlanFromCookie } from '@/lib/account/subscription';
import { setActiveSubscriptionCookies } from '@/lib/account/subscription-cookies';
import { isAdminEmail, PLAN_COOKIE, SUBSCRIPTION_COOKIE } from '@/lib/admin';
import type { PlanId } from '@/lib/stripe';
import { getStripeSubscriptionSnapshot } from '@/lib/stripe/subscription-sync';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Active les cookies d'abonnement uniquement si Stripe confirme un abonnement actif
 * (ou simulation admin déjà posée).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const subscriptionCookie = cookieStore.get(SUBSCRIPTION_COOKIE)?.value;
  const planCookie = cookieStore.get(PLAN_COOKIE)?.value;
  const adminSimulated =
    isAdminEmail(user.email) && subscriptionCookie === '1';

  const snapshot = await getStripeSubscriptionSnapshot(user.email);

  if (!snapshot.active && !adminSimulated) {
    return NextResponse.json(
      { error: 'Aucun abonnement actif. Finalisez le paiement Stripe ou contactez le support.' },
      { status: 403 }
    );
  }

  const planId: PlanId = snapshot.active
    ? snapshot.planId ?? 'starter'
    : getPlanFromCookie(planCookie) ?? 'starter';

  const response = NextResponse.json({
    ok: true,
    planId,
    period: snapshot.period,
    active: true,
  });

  setActiveSubscriptionCookies(response, planId);
  return response;
}
