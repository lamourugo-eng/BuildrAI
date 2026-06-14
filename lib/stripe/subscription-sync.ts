import type { BillingPeriod, PlanId } from '@/lib/stripe';
import { getStripe } from '@/lib/stripe';
import { MAX_ROADMAP_MONTHS } from '@/lib/account/subscription-storage';
import {
  StripeSubscriptionLookupError,
  toStripeSubscriptionLookupError,
} from '@/lib/stripe/errors';
import { resolveStripePlanAndPeriod } from '@/lib/stripe/plan-resolution';

export interface StripeSubscriptionSnapshot {
  active: boolean;
  customerId: string | null;
  subscriptionId: string | null;
  planId: PlanId | null;
  period: BillingPeriod | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  /** Mois de parcours débloqués selon factures Stripe payées */
  roadmapMonthsPaid: number;
}

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

export async function findStripeCustomerIdByEmail(
  email: string
): Promise<string | null> {
  try {
    const stripe = getStripe();
    const customers = await stripe.customers.list({
      email: email.trim().toLowerCase(),
      limit: 1,
    });
    return customers.data[0]?.id ?? null;
  } catch (err) {
    throw toStripeSubscriptionLookupError(err);
  }
}

/** Compte les mois payés. Dès 1 facture payée, le parcours complet (6 ch.) est débloqué. */
export async function countStripePaidRoadmapMonths(
  customerId: string,
  subscriptionId: string,
  period: BillingPeriod
): Promise<number> {
  if (period === 'semester') return MAX_ROADMAP_MONTHS;

  try {
    const stripe = getStripe();
    let paidCount = 0;
    let startingAfter: string | undefined;

    for (;;) {
      const page = await stripe.invoices.list({
        customer: customerId,
        subscription: subscriptionId,
        status: 'paid',
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      paidCount += page.data.filter((inv) => inv.amount_paid > 0).length;
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1]?.id;
    }

    return paidCount > 0 ? MAX_ROADMAP_MONTHS : 0;
  } catch (err) {
    throw toStripeSubscriptionLookupError(err);
  }
}

export async function getStripeSubscriptionSnapshot(
  email: string
): Promise<StripeSubscriptionSnapshot> {
  const empty: StripeSubscriptionSnapshot = {
    active: false,
    customerId: null,
    subscriptionId: null,
    planId: null,
    period: null,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    roadmapMonthsPaid: 0,
  };

  const customerId = await findStripeCustomerIdByEmail(email);
  if (!customerId) return empty;

  try {
    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
      expand: ['data.items.data.price.product'],
    });

    const sub =
      subscriptions.data.find((s) => ACTIVE_STATUSES.has(s.status)) ?? null;

    if (!sub) {
      return { ...empty, customerId };
    }

    const price = sub.items.data[0]?.price;
    const product =
      price?.product && typeof price.product === 'object' ? price.product : null;
    const recurring = price?.recurring;

    const { planId, period } = resolveStripePlanAndPeriod({
      subscriptionMetadata: sub.metadata,
      priceMetadata: price?.metadata,
      productMetadata:
        product && 'metadata' in product
          ? (product.metadata as Record<string, string>)
          : null,
      priceId: price?.id,
      recurringInterval: recurring?.interval,
      recurringIntervalCount: recurring?.interval_count,
    });

    const roadmapMonthsPaid = await countStripePaidRoadmapMonths(
      customerId,
      sub.id,
      period
    );

    return {
      active: true,
      customerId,
      subscriptionId: sub.id,
      planId,
      period,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      roadmapMonthsPaid,
    };
  } catch (err) {
    throw toStripeSubscriptionLookupError(err);
  }
}

export { StripeSubscriptionLookupError };
