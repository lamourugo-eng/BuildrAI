import { getPlanFromCookie, hasActiveSubscription } from '@/lib/account/subscription';
import { setActiveSubscriptionCookies } from '@/lib/account/subscription-cookies';
import { isAdminEmail, PLAN_COOKIE, SUBSCRIPTION_COOKIE } from '@/lib/admin';
import type { PlanId } from '@/lib/stripe';
import { getStripeSubscriptionSnapshot } from '@/lib/stripe/subscription-sync';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Aligne le cookie plan avec Stripe. Ne fait jamais confiance au body client.
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

  if (!hasActiveSubscription(user.email, subscriptionCookie)) {
    return NextResponse.json({ error: 'Abonnement requis' }, { status: 403 });
  }

  const snapshot = await getStripeSubscriptionSnapshot(user.email);
  const adminSimulated =
    isAdminEmail(user.email) && subscriptionCookie === '1';

  let planId: PlanId = 'starter';

  if (snapshot.active && snapshot.planId) {
    planId = snapshot.planId;
  } else if (adminSimulated) {
    planId = getPlanFromCookie(planCookie) ?? 'starter';
  } else {
    planId = getPlanFromCookie(planCookie) ?? 'starter';
  }

  const response = NextResponse.json({ ok: true, planId, source: snapshot.active ? 'stripe' : 'cookie' });
  setActiveSubscriptionCookies(response, planId);
  return response;
}
