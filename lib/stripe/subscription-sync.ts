import type { BillingPeriod, PlanId } from '@/lib/stripe';
import { normalizeBillingPeriod } from '@/lib/stripe';
import { getStripe } from '@/lib/stripe';
import { MAX_ROADMAP_MONTHS } from '@/lib/account/subscription-storage';

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

function planFromMetadata(
  metadata: Record<string, string> | null | undefined
): PlanId | null {
  const plan = metadata?.plan;
  if (plan === 'growth' || plan === 'starter') return plan;
  return null;
}

function periodFromMetadata(
  metadata: Record<string, string> | null | undefined
): BillingPeriod | null {
  if (!metadata?.period) return null;
  return normalizeBillingPeriod(metadata.period);
}

function periodFromStripeRecurring(
  interval: string | undefined,
  intervalCount: number | undefined
): BillingPeriod | null {
  if (interval === 'month' && intervalCount === 6) return 'semester';
  if (interval === 'year') return 'semester';
  if (interval === 'month' && (intervalCount ?? 1) === 1) return 'monthly';
  return null;
}

export async function findStripeCustomerIdByEmail(
  email: string
): Promise<string | null> {
  const stripe = getStripe();
  const customers = await stripe.customers.list({
    email: email.trim().toLowerCase(),
    limit: 1,
  });
  return customers.data[0]?.id ?? null;
}

/** Compte les mois payés. Dès 1 facture payée, le parcours complet (6 ch.) est débloqué. */
export async function countStripePaidRoadmapMonths(
  customerId: string,
  subscriptionId: string,
  period: BillingPeriod
): Promise<number> {
  if (period === 'semester') return MAX_ROADMAP_MONTHS;

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

  try {
    const customerId = await findStripeCustomerIdByEmail(email);
    if (!customerId) return empty;

    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    const sub =
      subscriptions.data.find((s) => s.status === 'active' || s.status === 'trialing') ??
      null;

    if (!sub) {
      return { ...empty, customerId };
    }

    const recurring = sub.items.data[0]?.price?.recurring;

    const planId =
      planFromMetadata(sub.metadata) ??
      planFromMetadata(sub.items.data[0]?.price?.metadata) ??
      null;
    const period =
      periodFromMetadata(sub.metadata) ??
      periodFromMetadata(sub.items.data[0]?.price?.metadata) ??
      periodFromStripeRecurring(recurring?.interval, recurring?.interval_count) ??
      'monthly';

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
  } catch {
    return empty;
  }
}
