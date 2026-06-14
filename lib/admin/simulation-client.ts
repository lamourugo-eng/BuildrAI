'use client';

import {
  applyAdminSubscriptionSimulation,
  clearAdminSubscriptionSimulation,
} from '@/lib/account/subscription-storage';
import type { BillingPeriod, PlanId } from '@/lib/stripe';

const CHECKOUT_PROCESSED_KEY = 'buildrai_checkout_processed';

export interface SimulateSubscriptionOptions {
  planId: PlanId;
  period: BillingPeriod;
  monthsPaid?: number;
}

export async function simulateAdminSubscription(options: SimulateSubscriptionOptions) {
  const res = await fetch('/api/admin/simulate-subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId: options.planId,
      period: options.period,
      monthsPaid: options.monthsPaid,
    }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    redirect?: string;
    planId?: PlanId;
    period?: BillingPeriod;
  };
  if (!res.ok) throw new Error(data.error || 'Erreur simulation');

  sessionStorage.removeItem(CHECKOUT_PROCESSED_KEY);
  applyAdminSubscriptionSimulation(options.planId, options.period, {
    monthsPaid: options.monthsPaid,
  });

  return data;
}

export async function revokeAdminSubscription() {
  const res = await fetch('/api/admin/simulate-subscribe', { method: 'DELETE' });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error || 'Erreur');

  sessionStorage.removeItem(CHECKOUT_PROCESSED_KEY);
  clearAdminSubscriptionSimulation();

  return data;
}
