import { getPlanFromCookie } from '@/lib/account/subscription';
import {
  clearSubscriptionCookies,
  setActiveSubscriptionCookies,
} from '@/lib/account/subscription-cookies';
import { resolveUserSubscription } from '@/lib/account/subscription-resolution';
import { MAX_ROADMAP_MONTHS } from '@/lib/account/subscription-storage';
import { isAdminEmail, PLAN_COOKIE, SUBSCRIPTION_COOKIE } from '@/lib/admin';
import type { PlanId } from '@/lib/stripe';
import { isTransientStripeError } from '@/lib/stripe/errors';
import { getStripeSubscriptionSnapshot } from '@/lib/stripe/subscription-sync';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function stripeUnavailableResponse(message: string) {
  return NextResponse.json(
    {
      active: false,
      transient: true,
      error: message,
      message:
        'Stripe est temporairement indisponible. Votre accès actuel est conservé. Réessayez dans quelques instants.',
    },
    { status: 503 }
  );
}

/**
 * Aligne les cookies d'abonnement avec Stripe, l'essai newsletter 24 h ou la simulation admin.
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

  let resolved;
  try {
    resolved = await resolveUserSubscription(
      supabase,
      user.id,
      user.email,
      subscriptionCookie,
      planCookie
    );
  } catch (err) {
    if (isTransientStripeError(err)) {
      return stripeUnavailableResponse(
        err instanceof Error ? err.message : 'Erreur Stripe temporaire'
      );
    }
    throw err;
  }

  if (resolved.stripeLookupFailed) {
    if (resolved.active && resolved.planId) {
      const response = NextResponse.json({
        active: true,
        planId: resolved.planId,
        period: 'monthly',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        roadmapMonthsPaid: MAX_ROADMAP_MONTHS,
        hasStripeCustomer: false,
        source: 'stripe',
        transient: true,
        message:
          'Stripe est temporairement indisponible. Votre accès actuel est conservé.',
      });
      setActiveSubscriptionCookies(response, resolved.planId);
      return response;
    }
    return stripeUnavailableResponse('Impossible de vérifier Stripe pour le moment.');
  }

  if (resolved.trialExpired) {
    const response = NextResponse.json({
      active: false,
      trialExpired: true,
      planId: null,
      period: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      roadmapMonthsPaid: 0,
      hasStripeCustomer: false,
      message: 'Votre essai Premium 24 h est terminé. Vous êtes repassé sur le plan Gratuit.',
    });
    clearSubscriptionCookies(response);
    return response;
  }

  if (resolved.active && resolved.source === 'stripe') {
    let snapshot;
    try {
      snapshot = await getStripeSubscriptionSnapshot(user.email);
    } catch (err) {
      if (isTransientStripeError(err)) {
        return stripeUnavailableResponse(
          err instanceof Error ? err.message : 'Erreur Stripe temporaire'
        );
      }
      throw err;
    }

    const planId: PlanId = snapshot.planId ?? resolved.planId ?? 'starter';
    const response = NextResponse.json({
      active: true,
      planId,
      period: snapshot.period,
      cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
      currentPeriodEnd: snapshot.currentPeriodEnd,
      roadmapMonthsPaid: snapshot.roadmapMonthsPaid,
      hasStripeCustomer: Boolean(snapshot.customerId),
      source: 'stripe',
    });
    setActiveSubscriptionCookies(response, planId);
    return response;
  }

  if (resolved.active && resolved.source === 'trial') {
    const response = NextResponse.json({
      active: true,
      planId: 'starter',
      period: 'monthly',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: resolved.trialEndsAt,
      roadmapMonthsPaid: MAX_ROADMAP_MONTHS,
      hasStripeCustomer: false,
      source: 'trial',
      trialEndsAt: resolved.trialEndsAt,
      isNewsletterTrial: true,
    });
    setActiveSubscriptionCookies(response, 'starter');
    return response;
  }

  if (resolved.active && resolved.source === 'admin') {
    const planId: PlanId = getPlanFromCookie(planCookie) ?? 'starter';
    return NextResponse.json({
      active: true,
      planId,
      period: 'monthly' as const,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      roadmapMonthsPaid: MAX_ROADMAP_MONTHS,
      hasStripeCustomer: false,
      adminSimulation: true,
      source: 'admin',
    });
  }

  let snapshot;
  try {
    snapshot = await getStripeSubscriptionSnapshot(user.email);
  } catch (err) {
    if (isTransientStripeError(err)) {
      return stripeUnavailableResponse(
        err instanceof Error ? err.message : 'Erreur Stripe temporaire'
      );
    }
    throw err;
  }

  const response = NextResponse.json({
    active: false,
    planId: snapshot.planId,
    period: snapshot.period,
    cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
    currentPeriodEnd: snapshot.currentPeriodEnd,
    roadmapMonthsPaid: snapshot.roadmapMonthsPaid,
    hasStripeCustomer: Boolean(snapshot.customerId),
  });
  clearSubscriptionCookies(response);
  return response;
}
