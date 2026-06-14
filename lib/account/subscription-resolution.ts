import { getPlanFromCookie } from '@/lib/account/subscription';
import {
  expireTrialInDb,
  getUserProfile,
  isMissingUserProfileTable,
  isTrialExpired,
  isTrialWindowActive,
  type UserProfile,
} from '@/lib/account/user-profile';
import { isAdminEmail } from '@/lib/admin';
import type { PlanId } from '@/lib/stripe';
import { isTransientStripeError } from '@/lib/stripe/errors';
import { getStripeSubscriptionSnapshot } from '@/lib/stripe/subscription-sync';
import type { SupabaseClient } from '@supabase/supabase-js';

export type SubscriptionSource = 'stripe' | 'trial' | 'admin' | 'none';

export interface ResolvedSubscription {
  active: boolean;
  planId: PlanId | null;
  source: SubscriptionSource;
  trialEndsAt: string | null;
  trialExpired: boolean;
  newsletterOptIn: boolean;
  stripeLookupFailed?: boolean;
}

async function loadProfileSafe(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  try {
    return await getUserProfile(supabase, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (isMissingUserProfileTable(message)) return null;
    throw err;
  }
}

async function expireTrialSafe(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    await expireTrialInDb(supabase, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (isMissingUserProfileTable(message)) return;
    throw err;
  }
}

function resolvePlanFromCookies(planCookie: string | undefined): PlanId {
  return getPlanFromCookie(planCookie) ?? 'starter';
}

/**
 * Source de vérité serveur : Stripe > essai newsletter 24 h > simulation admin > gratuit.
 * Si l'essai est expiré, l'accès Premium est révoqué (même si le cookie est encore présent).
 */
export async function resolveUserSubscription(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  subscriptionCookie: string | undefined,
  planCookie: string | undefined
): Promise<ResolvedSubscription> {
  const inactive: ResolvedSubscription = {
    active: false,
    planId: null,
    source: 'none',
    trialEndsAt: null,
    trialExpired: false,
    newsletterOptIn: false,
  };

  const adminSimulated = isAdminEmail(email) && subscriptionCookie === '1';
  if (adminSimulated) {
    const planId = resolvePlanFromCookies(planCookie);
    return {
      active: true,
      planId,
      source: 'admin',
      trialEndsAt: null,
      trialExpired: false,
      newsletterOptIn: false,
    };
  }

  if (email) {
    try {
      const snapshot = await getStripeSubscriptionSnapshot(email);
      if (snapshot.active) {
        return {
          active: true,
          planId: snapshot.planId ?? 'starter',
          source: 'stripe',
          trialEndsAt: null,
          trialExpired: false,
          newsletterOptIn: false,
        };
      }
    } catch (err) {
      if (isTransientStripeError(err) && subscriptionCookie === '1') {
        return {
          active: true,
          planId: resolvePlanFromCookies(planCookie),
          source: 'stripe',
          trialEndsAt: null,
          trialExpired: false,
          newsletterOptIn: false,
          stripeLookupFailed: true,
        };
      }
      if (isTransientStripeError(err)) {
        return { ...inactive, stripeLookupFailed: true };
      }
    }
  }

  const profile = await loadProfileSafe(supabase, userId);
  const newsletterOptIn = profile?.newsletter_opt_in ?? false;

  if (profile && isTrialExpired(profile)) {
    await expireTrialSafe(supabase, userId);
    return {
      ...inactive,
      trialExpired: true,
      newsletterOptIn,
    };
  }

  if (profile && isTrialWindowActive(profile)) {
    return {
      active: true,
      planId: 'starter',
      source: 'trial',
      trialEndsAt: profile.trial_ends_at,
      trialExpired: false,
      newsletterOptIn,
    };
  }

  return { ...inactive, newsletterOptIn };
}
