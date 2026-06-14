'use client';

import { saveSubscriptionMeta } from '@/lib/account/subscription-storage';
import type { BillingPeriod, PlanId } from '@/lib/stripe';
import { getPlanById, getPlanPrice, formatSemesterBillingHint } from '@/lib/stripe/plans';
import Link from 'next/link';
import { useState } from 'react';

interface SubscribeCheckoutProps {
  plan: PlanId;
  period: BillingPeriod;
  email: string;
}

export default function SubscribeCheckout({ plan, period, email }: SubscribeCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const details = getPlanById(plan);
  const price = details ? getPlanPrice(details, period) : 0;

  async function handleCheckout() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, period }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de paiement');

      saveSubscriptionMeta({
        planId: plan,
        period,
        activatedAt: '',
        monthsPaid: 0,
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  if (!details) return null;

  return (
    <div className="subscribe-card">
      <div className="subscribe-plan">
        <span className="section-tag">Ta formule</span>
        <h2>{details.name}</h2>
        <p>{details.desc}</p>
        <div className="subscribe-price">
          <span className="currency">€</span>
          <span className="amount">{price}</span>
          <span className="period">
            /mois{period === 'semester' ? ` (${formatSemesterBillingHint()})` : ''}
          </span>
        </div>
        <p className="subscribe-trial">Annulation à tout moment. Plan gratuit disponible sans carte bancaire</p>
      </div>

      <p className="subscribe-email">
        Compte : <strong>{email}</strong>
      </p>

      <button
        type="button"
        className="btn btn-primary btn-lg btn-block"
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? 'Redirection…' : 'Payer avec Stripe'}
      </button>

      {error && <p className="auth-error">{error}</p>}

      <Link href="/#pricing" className="btn btn-ghost btn-block subscribe-change">
        Changer de formule
      </Link>
    </div>
  );
}
