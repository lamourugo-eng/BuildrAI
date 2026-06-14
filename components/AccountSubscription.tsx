'use client';

import { loadSubscriptionMeta, mergeStripeRoadmapMonths, saveSubscriptionMeta, MAX_ROADMAP_MONTHS, clearSubscriptionLocal } from '@/lib/account/subscription-storage';
import type { BillingPeriod, PlanId } from '@/lib/stripe';
import {
  BILLING_PLANS,
  FREE_PLAN,
  getPlanById,
  getPlanPrice,
  SEMESTER_DISCOUNT_PERCENT,
  formatSemesterBillingHint,
} from '@/lib/stripe/plans';
import { normalizeBillingPeriod } from '@/lib/stripe';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AccountSubscriptionProps {
  email: string;
  isSubscribed: boolean;
}

export default function AccountSubscription({
  email,
  isSubscribed,
}: AccountSubscriptionProps) {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [currentPlanId, setCurrentPlanId] = useState<PlanId>('starter');
  const [activatedAt, setActivatedAt] = useState('');
  const [trialEndsAt, setTrialEndsAt] = useState('');
  const [isNewsletterTrial, setIsNewsletterTrial] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState('');
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);
  const [cancelEndDate, setCancelEndDate] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  function refreshMeta() {
    const meta = loadSubscriptionMeta();
    setCurrentPlanId(meta.planId);
    setPeriod(meta.period);
    setActivatedAt(meta.activatedAt);
    setTrialEndsAt(meta.trialEndsAt ?? '');
    setIsNewsletterTrial(meta.isNewsletterTrial === true);
  }

  async function syncStripeStatus() {
    try {
      const res = await fetch('/api/subscription/sync-stripe', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) return;

      if (data.cancelAtPeriodEnd && data.currentPeriodEnd) {
        setCancelEndDate(
          new Date(data.currentPeriodEnd).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        );
      } else {
        setCancelEndDate(null);
      }

      if (!data.active) {
        if (data.trialExpired) {
          clearSubscriptionLocal();
        }
        setCancelNotice(
          data.trialExpired
            ? 'Ton essai Premium 24 h est terminé. Tu es repassé sur le plan Gratuit.'
            : 'Ton abonnement a été résilié. Tu es repassé sur le plan Gratuit.'
        );
        router.refresh();
        return;
      }

      if (data.isNewsletterTrial && data.trialEndsAt) {
        const meta = loadSubscriptionMeta();
        saveSubscriptionMeta({
          ...meta,
          planId: 'starter',
          period: 'monthly',
          activatedAt: meta.activatedAt || new Date().toISOString(),
          monthsPaid: MAX_ROADMAP_MONTHS,
          trialEndsAt: data.trialEndsAt,
          isNewsletterTrial: true,
        });
        refreshMeta();
      }

      if (data.planId && (data.planId === 'starter' || data.planId === 'growth')) {
        const meta = loadSubscriptionMeta();
        saveSubscriptionMeta(
          mergeStripeRoadmapMonths(
            {
              ...meta,
              planId: data.planId,
              period: normalizeBillingPeriod(data.period),
            },
            typeof data.roadmapMonthsPaid === 'number' ? data.roadmapMonthsPaid : meta.monthsPaid,
            data.currentPeriodEnd
          )
        );
        refreshMeta();
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    refreshMeta();
  }, []);

  useEffect(() => {
    if (!isSubscribed) return;
    void syncStripeStatus();
    if (searchParams.get('billing') === 'return') {
      setCancelNotice(
        'Si tu as résilié, ton accès Premium reste actif jusqu\'à la fin de la période payée.'
      );
    }
  }, [isSubscribed, searchParams]);

  const upgradeTarget = searchParams.get('upgrade') === 'growth' ? 'growth' : null;

  useEffect(() => {
    if (upgradeTarget !== 'growth') return;
    const timer = window.setTimeout(() => {
      document.getElementById('account-plan-growth')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [upgradeTarget]);

  const currentPlan = getPlanById(currentPlanId) ?? BILLING_PLANS[0];
  const statusLabel = isSubscribed
    ? isNewsletterTrial
      ? 'Essai Premium 24 h (29 €/mois)'
      : currentPlanId === 'growth'
        ? 'Business Accelerator actif'
        : 'Premium actif'
    : 'Plan Gratuit';
  const badgeLabel = isSubscribed
    ? currentPlanId === 'growth'
      ? 'Accelerator'
      : 'Premium'
    : 'Gratuit';

  async function handleCheckout(planId: PlanId) {
    setLoadingPlan(planId);
    setError('');

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, period }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de paiement');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingPlan(null);
    }
  }

  function handlePeriodChange(next: BillingPeriod) {
    setPeriod(next);
    const meta = loadSubscriptionMeta();
    saveSubscriptionMeta({ ...meta, period: next });
  }

  async function handleManageBilling() {
    setLoadingPortal(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/billing-portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible d\'ouvrir le portail de gestion.');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingPortal(false);
    }
  }

  const activatedLabel = activatedAt
    ? new Date(activatedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="account-panel account-subscription">
      <div className={`account-subscription-status${isSubscribed ? ' is-active' : ''}`}>
        <div>
          <span className="account-subscription-status-label">Statut</span>
          <p className="account-subscription-status-value">{statusLabel}</p>
          <p className="account-subscription-status-meta">
            Compte :{' '}
            <strong className="account-subscription-email">{email}</strong>
            {isSubscribed && activatedLabel && (
              <>
                {' '}
               . Actif depuis le {activatedLabel}
                {isNewsletterTrial && trialEndsAt && (
                  <>
                    {' '}
                   . Essai jusqu&apos;au{' '}
                    {new Date(trialEndsAt).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </>
                )}
              </>
            )}
            {!isSubscribed && <>. Quiz, profil et parcours aperçu inclus</>}
          </p>
        </div>
        <span className={`account-subscription-badge${isSubscribed ? '' : ' is-free'}`}>
          {badgeLabel}
        </span>
      </div>

      {!isSubscribed && (
        <article className="account-card account-card--wide account-subscription-current account-subscription-current--free">
          <h3>Formule actuelle. {FREE_PLAN.name}</h3>
          <p className="account-card-desc">{FREE_PLAN.desc}</p>
          <ul className="account-subscription-features">
            {FREE_PLAN.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="account-subscription-free-hint">
            Le parcours complet, le coach IA et le suivi d&apos;activité sont inclus dans les
            formules payantes.
          </p>
          <Link href="/espace" className="btn btn-primary btn-block">
            Accéder à mon espace
          </Link>
        </article>
      )}

      {isSubscribed && (
        <article className="account-card account-card--wide account-subscription-current">
          <h3>Formule actuelle</h3>
          <div className="account-subscription-current-row">
            <div>
              <p className="account-card-value">{currentPlan.name}</p>
              <p className="account-card-desc">{currentPlan.desc}</p>
            </div>
            <div className="account-subscription-current-price">
              <span className="currency">€</span>
              <strong>{getPlanPrice(currentPlan, period)}</strong>
              <span>/mois{period === 'semester' ? `. ${formatSemesterBillingHint()}` : ''}</span>
            </div>
          </div>
          <ul className="account-subscription-features">
            {currentPlan.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {!isNewsletterTrial && (
            <div className="account-subscription-current-actions">
              {cancelEndDate && (
                <p className="account-subscription-cancel-scheduled">
                  Résiliation programmée. Accès Premium jusqu&apos;au{' '}
                  <strong>{cancelEndDate}</strong>.
                </p>
              )}
              <button
                type="button"
                className="btn btn-outline account-subscription-resilier-btn"
                onClick={() => void handleManageBilling()}
                disabled={loadingPortal || loadingPlan !== null}
              >
                {loadingPortal ? 'Ouverture…' : 'Résilie'}
              </button>
              <p className="account-subscription-resilier-hint">
                Annulation en un clic via Stripe. Accès conservé jusqu&apos;à la fin de la période
                payée.
              </p>
            </div>
          )}
        </article>
      )}

      {upgradeTarget === 'growth' && currentPlanId === 'starter' && (
        <div className="account-subscription-upgrade-banner" role="status">
          <span className="account-subscription-upgrade-banner-icon" aria-hidden="true">
            🔒
          </span>
          <div>
            <strong>Passe à Business Accelerator. 79 €/mois</strong>
            <p>
              L&apos;analyse hebdomadaire et la bibliothèque de ressources sont incluses dans cette
              formule. Ton coach IA et ton parcours 180 jours restent actifs.
            </p>
          </div>
        </div>
      )}

      {upgradeTarget === 'growth' && !isSubscribed && (
        <div className="account-subscription-upgrade-banner" role="status">
          <span className="account-subscription-upgrade-banner-icon" aria-hidden="true">
            🔒
          </span>
          <div>
            <strong>Business Accelerator. 79 €/mois</strong>
            <p>
              Analyse hebdomadaire approfondie et bibliothèque complète de templates & prompts IA.
            </p>
          </div>
        </div>
      )}

      <div className="account-subscription-plans-header">
        <h3>{isSubscribed ? 'Changer de formule' : 'Choisir une formule'}</h3>
        <div className="account-subscription-toggle">
          <button
            type="button"
            className={period === 'monthly' ? 'is-active' : ''}
            onClick={() => handlePeriodChange('monthly')}
          >
            Mensuel
          </button>
          <button
            type="button"
            className={period === 'semester' ? 'is-active' : ''}
            onClick={() => handlePeriodChange('semester')}
          >
            Semestriel <em>-{SEMESTER_DISCOUNT_PERCENT}%</em>
          </button>
        </div>
      </div>

      <div className="account-subscription-plans">
        {BILLING_PLANS.map((plan) => {
          const isCurrent = isSubscribed && plan.id === currentPlanId;
          const price = getPlanPrice(plan, period);

          return (
            <article
              key={plan.id}
              id={plan.id === 'growth' ? 'account-plan-growth' : undefined}
              className={`account-subscription-plan${plan.popular ? ' is-popular' : ''}${isCurrent ? ' is-current' : ''}${upgradeTarget === plan.id ? ' is-upgrade-target' : ''}`}
            >
              {plan.popular && <span className="account-subscription-plan-tag">Populaire</span>}
              {isCurrent && <span className="account-subscription-plan-tag is-current">Actuelle</span>}
              <h4>{plan.name}</h4>
              <p className="account-subscription-plan-desc">{plan.desc}</p>
              <div className="account-subscription-plan-price">
                <span>€</span>
                <strong>{price}</strong>
                <span>/mois</span>
              </div>
              <ul className="account-subscription-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                type="button"
                className={`btn ${isCurrent ? 'btn-outline' : 'btn-primary'} btn-block`}
                onClick={() => void handleCheckout(plan.id)}
                disabled={loadingPlan !== null || isCurrent}
              >
                {loadingPlan === plan.id
                  ? 'Redirection…'
                  : isCurrent
                    ? 'Formule en cours'
                    : isSubscribed
                      ? `Passer sur ${plan.name}`
                      : `Choisir ${plan.name}`}
              </button>
            </article>
          );
        })}
      </div>

      {error && <p className="auth-error">{error}</p>}

      {cancelNotice && (
        <div className="account-subscription-notice" role="status">
          {cancelNotice}
        </div>
      )}

      {isSubscribed && !isNewsletterTrial && (
        <article className="account-card account-card--wide account-subscription-cancel">
          <div className="account-subscription-cancel-head">
            <span className="account-subscription-cancel-icon" aria-hidden="true">
              ⏸
            </span>
            <div>
              <h3>Besoin d&apos;aide pour résilier ?</h3>
              <p>
                Le bouton « Résilie » ci-dessus ouvre le portail Stripe : factures, carte
                bancaire et annulation d&apos;abonnement.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline account-subscription-cancel-btn"
            onClick={() => void handleManageBilling()}
            disabled={loadingPortal || loadingPlan !== null}
          >
            {loadingPortal ? 'Ouverture…' : 'Résilie mon abonnement'}
          </button>

          <p className="account-subscription-cancel-hint">
            Paiement sécurisé par Stripe. Pas de frais cachés.
          </p>
        </article>
      )}

      <div className="account-card account-card--muted account-subscription-help">
        <h3>Gestion & facturation</h3>
        <ul className="account-subscription-help-list">
          <li>Plan gratuit disponible sans carte bancaire pour découvrir ton profil.</li>
          <li>Résiliation en libre-service via le bouton « Résilie » (abonnements Stripe).</li>
          <li>
            Assistance par email (contact direct avec le créateur du site) :{' '}
            <a href="mailto:Buildraimail@gmail.com">Buildraimail@gmail.com</a>
          </li>
        </ul>
        <Link href="/#pricing" className="btn btn-ghost btn-sm">
          Voir les tarifs publics
        </Link>
      </div>
    </div>
  );
}
