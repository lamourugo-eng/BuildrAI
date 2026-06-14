import { isAdminEmail, PLAN_COOKIE, SUBSCRIPTION_COOKIE } from '@/lib/admin';
import type { PlanId } from '@/lib/stripe';

export function hasActiveSubscription(
  email: string | null | undefined,
  cookieValue: string | undefined
): boolean {
  if (isAdminEmail(email) && cookieValue === '1') return true;
  if (cookieValue === '1') return true;
  return false;
}

export function getPlanFromCookie(planCookie: string | undefined): PlanId | null {
  if (planCookie === 'growth' || planCookie === 'starter') return planCookie;
  return null;
}

/** Analyse hebdomadaire approfondie. Réservée au plan Business Accelerator (79 €/mois). */
export function hasGrowthSubscription(
  email: string | null | undefined,
  subscriptionCookie: string | undefined,
  planCookie: string | undefined
): boolean {
  if (!hasActiveSubscription(email, subscriptionCookie)) return false;
  return getPlanFromCookie(planCookie) === 'growth';
}
