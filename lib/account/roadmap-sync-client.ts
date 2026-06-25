import {
  getUnlockedRoadmapMonths,
  loadSubscriptionMeta,
  mergeStripeRoadmapMonths,
  MAX_ROADMAP_MONTHS,
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
        activatedAt: meta.activatedAt || new Date().toISOString(),
        monthsPaid: meta.monthsPaid > 0 ? meta.monthsPaid : MAX_ROADMAP_MONTHS,
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
