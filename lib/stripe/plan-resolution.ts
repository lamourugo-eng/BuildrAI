import type { BillingPeriod, PlanId } from '@/lib/stripe';
import { getPriceId, normalizeBillingPeriod } from '@/lib/stripe';
import { STRIPE_PRICE_ENV_KEYS } from '@/lib/stripe/catalog';

export function planFromMetadata(
  metadata: Record<string, string> | null | undefined
): PlanId | null {
  const plan = metadata?.plan ?? metadata?.plan_id;
  if (plan === 'growth' || plan === 'starter') return plan;
  return null;
}

export function periodFromMetadata(
  metadata: Record<string, string> | null | undefined
): BillingPeriod | null {
  if (!metadata?.period) return null;
  return normalizeBillingPeriod(metadata.period);
}

export function planFromPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;

  for (const planId of ['starter', 'growth'] as PlanId[]) {
    for (const period of ['monthly', 'semester'] as BillingPeriod[]) {
      try {
        if (getPriceId(planId, period) === priceId) {
          return planId;
        }
      } catch {
        const envKey = STRIPE_PRICE_ENV_KEYS[planId][period];
        const legacyKey = envKey.replace('_SEMESTER', '_YEARLY');
        const legacyPriceId = process.env[legacyKey]?.trim();
        if (legacyPriceId && legacyPriceId === priceId) {
          return planId;
        }
      }
    }
  }

  return null;
}

export function periodFromStripeRecurring(
  interval: string | undefined,
  intervalCount: number | undefined
): BillingPeriod | null {
  if (interval === 'month' && intervalCount === 6) return 'semester';
  if (interval === 'year') return 'semester';
  if (interval === 'month' && (intervalCount ?? 1) === 1) return 'monthly';
  return null;
}

export function resolveStripePlanAndPeriod(input: {
  subscriptionMetadata?: Record<string, string> | null;
  priceMetadata?: Record<string, string> | null;
  productMetadata?: Record<string, string> | null;
  priceId?: string | null;
  recurringInterval?: string;
  recurringIntervalCount?: number;
}): { planId: PlanId | null; period: BillingPeriod } {
  const planId =
    planFromMetadata(input.subscriptionMetadata) ??
    planFromMetadata(input.priceMetadata) ??
    planFromMetadata(input.productMetadata) ??
    planFromPriceId(input.priceId) ??
    null;

  const period =
    periodFromMetadata(input.subscriptionMetadata) ??
    periodFromMetadata(input.priceMetadata) ??
    periodFromStripeRecurring(input.recurringInterval, input.recurringIntervalCount) ??
    'monthly';

  return { planId, period };
}
