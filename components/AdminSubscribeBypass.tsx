'use client';

import { simulateAdminSubscription } from '@/lib/admin/simulation-client';
import { getPlanById, getPlanPrice } from '@/lib/stripe/plans';
import type { BillingPeriod, PlanId } from '@/lib/stripe';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AdminSubscribeBypassProps {
  planId: PlanId;
  period: BillingPeriod;
}

export default function AdminSubscribeBypass({ planId, period }: AdminSubscribeBypassProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const plan = getPlanById(planId);
  const price = plan ? getPlanPrice(plan, period) : null;

  async function handleBypass() {
    setLoading(true);
    try {
      const data = await simulateAdminSubscription({ planId, period });
      router.push(data.redirect ?? '/espace?checkout=success&admin=1');
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="admin-subscribe-bypass">
      <span className="section-tag">Admin</span>
      <p>
        Simuler <strong>{plan?.name ?? planId}</strong>
        {price != null && (
          <>
            {' '}
           . {price} €/mois{period === 'semester' ? ' (semestriel)' : ''}
          </>
        )}{' '}
        sans passer par Stripe.
      </p>
      <button
        type="button"
        className="btn btn-outline btn-block"
        onClick={() => void handleBypass()}
        disabled={loading}
      >
        {loading ? 'Activation…' : `Simuler ${plan?.name ?? 'abonnement'}`}
      </button>
    </div>
  );
}
