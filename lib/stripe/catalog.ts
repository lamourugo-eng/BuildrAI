import type { BillingPeriod, PlanId } from '@/lib/stripe';
import {
  BILLING_PLANS,
  getSemesterTotalPrice,
  SEMESTER_BILLING_MONTHS,
  SEMESTER_DISCOUNT_PERCENT,
  type BillingPlan,
} from '@/lib/stripe/plans';

/** Montant facturé en centimes (EUR) pour Stripe Checkout. */
export function getStripePriceCents(planId: PlanId, period: BillingPeriod): number {
  const plan = BILLING_PLANS.find((p) => p.id === planId);
  if (!plan) {
    throw new Error(`Plan Stripe inconnu: ${planId}`);
  }
  const euros =
    period === 'monthly' ? plan.monthly : getSemesterTotalPrice(plan);
  return euros * 100;
}

export interface StripeCatalogPlan {
  id: PlanId;
  name: string;
  description: string;
  monthlyCents: number;
  semesterCents: number;
  semesterMonthlyEquivalent: number;
}

export function getStripeCatalog(): StripeCatalogPlan[] {
  return BILLING_PLANS.map((plan: BillingPlan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.desc,
    monthlyCents: plan.monthly * 100,
    semesterCents: getSemesterTotalPrice(plan) * 100,
    semesterMonthlyEquivalent: plan.semester,
  }));
}

export const STRIPE_PRICE_ENV_KEYS: Record<PlanId, Record<BillingPeriod, string>> = {
  starter: {
    monthly: 'STRIPE_PRICE_STARTER_MONTHLY',
    semester: 'STRIPE_PRICE_STARTER_SEMESTER',
  },
  growth: {
    monthly: 'STRIPE_PRICE_GROWTH_MONTHLY',
    semester: 'STRIPE_PRICE_GROWTH_SEMESTER',
  },
};

export const STRIPE_CATALOG_VERSION = `v3-semester-${SEMESTER_BILLING_MONTHS}m-${SEMESTER_DISCOUNT_PERCENT}pct`;
