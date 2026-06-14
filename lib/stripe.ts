import Stripe from 'stripe';
import { STRIPE_PRICE_ENV_KEYS } from '@/lib/stripe/catalog';

let stripe: Stripe | null = null;

/**
 * Instance Stripe singleton (côté serveur uniquement).
 */
export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY manquant dans .env.local');
    }
    stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  }
  return stripe;
}

export type PlanId = 'starter' | 'growth';
export type BillingPeriod = 'monthly' | 'semester';

/** Compatibilité anciennes URLs / métadonnées « yearly ». */
export function normalizeBillingPeriod(raw: string | null | undefined): BillingPeriod {
  if (raw === 'semester' || raw === 'yearly') return 'semester';
  return 'monthly';
}

export function isSemesterBilling(period: BillingPeriod): boolean {
  return period === 'semester';
}

export function getPriceId(plan: PlanId, period: BillingPeriod): string {
  const envKey = STRIPE_PRICE_ENV_KEYS[plan][period];
  let priceId = process.env[envKey];
  if (!priceId && period === 'semester') {
    const legacyKey = envKey.replace('_SEMESTER', '_YEARLY');
    priceId = process.env[legacyKey];
  }
  if (!priceId) {
    throw new Error(`${envKey} manquant dans .env.local`);
  }
  return priceId;
}
