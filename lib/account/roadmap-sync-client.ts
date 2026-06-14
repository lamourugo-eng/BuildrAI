import {
  getUnlockedRoadmapMonths,
  loadSubscriptionMeta,
  mergeStripeRoadmapMonths,
  saveSubscriptionMeta,
} from '@/lib/account/subscription-storage';
import { normalizeBillingPeriod } from '@/lib/stripe';

/** Aligne monthsPaid local avec les factures Stripe payées (renouvellements). */
export async function syncRoadmapMonthsFromStripe(): Promise<number> {
  const meta = loadSubscriptionMeta();

  try {
    const res = await fetch('/api/subscription/sync-stripe', { method: 'POST' });
    const data = (await res.json()) as {
      active?: boolean;
      planId?: string;
      period?: string;
      roadmapMonthsPaid?: number;
      currentPeriodEnd?: string | null;
    };

    if (!res.ok || !data.active || typeof data.roadmapMonthsPaid !== 'number') {
      return getUnlockedRoadmapMonths(meta);
    }

    const merged = mergeStripeRoadmapMonths(
      {
        ...meta,
        planId:
          data.planId === 'growth' || data.planId === 'starter' ? data.planId : meta.planId,
        period: normalizeBillingPeriod(data.period),
      },
      data.roadmapMonthsPaid,
      data.currentPeriodEnd
    );
    saveSubscriptionMeta(merged);
    return getUnlockedRoadmapMonths(merged);
  } catch {
    return getUnlockedRoadmapMonths(meta);
  }
}
