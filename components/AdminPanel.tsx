'use client';

import {
  revokeAdminSubscription,
  simulateAdminSubscription,
} from '@/lib/admin/simulation-client';
import { loadSubscriptionMeta } from '@/lib/account/subscription-storage';
import { BILLING_PLANS, getPlanById, getPlanPrice } from '@/lib/stripe/plans';
import type { BillingPeriod, PlanId } from '@/lib/stripe';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminPanelProps {
  email: string;
  isSubscribed: boolean;
  currentPlanId: PlanId | null;
}

type SimulationPreset = {
  id: string;
  label: string;
  hint: string;
  planId: PlanId;
  period: BillingPeriod;
};

const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'starter-monthly',
    label: 'Premium. 29 €/mois',
    hint: 'Coach IA, parcours 180 j (6 chapitres), Ma ville',
    planId: 'starter',
    period: 'monthly',
  },
  {
    id: 'starter-semester',
    label: 'Premium. Semestriel',
    hint: 'Parcours 180 jours débloqué (6 chapitres)',
    planId: 'starter',
    period: 'semester',
  },
  {
    id: 'growth-monthly',
    label: `Accelerator. ${BILLING_PLANS.find((p) => p.id === 'growth')!.monthly} €/mois`,
    hint: 'Premium + analyse hebdo + ressources',
    planId: 'growth',
    period: 'monthly',
  },
  {
    id: 'growth-semester',
    label: 'Accelerator. Semestriel',
    hint: 'Tout débloqué sur 6 mois',
    planId: 'growth',
    period: 'semester',
  },
];

function formatSimulationStatus(isSubscribed: boolean, planId: PlanId | null): string {
  if (!isSubscribed) return 'Plan gratuit (simulation inactive)';
  const plan = planId ? getPlanById(planId) : null;
  return plan ? `${plan.name}. Simulation active` : 'Abonnement simulé (plan inconnu)';
}

export default function AdminPanel({ email, isSubscribed, currentPlanId }: AdminPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [customPlanId, setCustomPlanId] = useState<PlanId>(currentPlanId ?? 'starter');
  const [customPeriod, setCustomPeriod] = useState<BillingPeriod>('monthly');
  const [customMonths, setCustomMonths] = useState(1);
  const [localMeta, setLocalMeta] = useState(() =>
    typeof window !== 'undefined' ? loadSubscriptionMeta() : null
  );

  useEffect(() => {
    setLocalMeta(loadSubscriptionMeta());
    if (currentPlanId) setCustomPlanId(currentPlanId);
  }, [currentPlanId, isSubscribed]);

  async function applySimulation(
    planId: PlanId,
    period: BillingPeriod,
    monthsPaid?: number,
    presetId?: string
  ) {
    setLoading(presetId ?? 'custom');
    setError('');
    try {
      const data = await simulateAdminSubscription({ planId, period, monthsPaid });
      setLocalMeta(loadSubscriptionMeta());
      router.push(data.redirect ?? '/espace?checkout=success&admin=1');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setLoading(null);
    }
  }

  async function applyFreePlan() {
    setLoading('free');
    setError('');
    try {
      await revokeAdminSubscription();
      setLocalMeta(loadSubscriptionMeta());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(null);
    }
  }

  const activePresetId =
    isSubscribed && currentPlanId
      ? SIMULATION_PRESETS.find(
          (p) => p.planId === currentPlanId && p.period === localMeta?.period
        )?.id
      : null;

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <span className="section-tag">Mode administrateur</span>
        <h1>Panneau admin</h1>
        <p>
          Connecté en tant que <strong>{email}</strong>. Simule n&apos;importe quelle formule
          d&apos;abonnement sans Stripe pour tester l&apos;espace client.
        </p>
      </div>

      <div className="admin-status-card">
        <span>Statut abonnement (simulation)</span>
        <strong className={isSubscribed ? 'admin-status--active' : 'admin-status--inactive'}>
          {formatSimulationStatus(isSubscribed, currentPlanId)}
        </strong>
      </div>

      {localMeta?.activatedAt && isSubscribed && (
        <p className="admin-simulation-meta">
          Période locale : <strong>{localMeta.period === 'semester' ? 'Semestriel' : 'Mensuel'}</strong>
          {'. '}
          Chapitres débloqués : <strong>{localMeta.monthsPaid}/6</strong>
        </p>
      )}

      <section className="admin-simulation">
        <div className="admin-simulation-head">
          <h2>Simuler un abonnement</h2>
          <p>Choisis une formule. Tu peux changer à tout moment sans repasser par Stripe.</p>
        </div>

        <div className="admin-simulation-presets">
          <button
            type="button"
            className={`admin-simulation-preset${!isSubscribed ? ' is-active' : ''}`}
            onClick={() => void applyFreePlan()}
            disabled={loading !== null}
          >
            <span className="admin-simulation-preset-tier admin-simulation-preset-tier--free">
              Gratuit
            </span>
            <strong>Plan gratuit</strong>
            <span>Quiz, profil, aperçu parcours. Sans abonnement</span>
            {loading === 'free' ? 'Application…' : 'Appliquer'}
          </button>

          {SIMULATION_PRESETS.map((preset) => {
            const plan = getPlanById(preset.planId)!;
            const price = getPlanPrice(plan, preset.period);
            const isActive = activePresetId === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                className={`admin-simulation-preset${isActive ? ' is-active' : ''}`}
                onClick={() =>
                  void applySimulation(preset.planId, preset.period, undefined, preset.id)
                }
                disabled={loading !== null}
              >
                <span
                  className={`admin-simulation-preset-tier admin-simulation-preset-tier--${preset.planId}`}
                >
                  {preset.planId === 'growth' ? `${getPlanById('growth')!.monthly} €` : '29 €'}
                </span>
                <strong>{preset.label}</strong>
                <span>{preset.hint}</span>
                <em>
                  {loading === preset.id
                    ? 'Activation…'
                    : `${price} €/mois${preset.period === 'semester' ? '. Semestriel' : ''}`}
                </em>
              </button>
            );
          })}
        </div>

        <details className="admin-simulation-advanced">
          <summary>Options avancées. Chapitres parcours débloqués</summary>
          <div className="admin-simulation-advanced-body">
            <div className="admin-simulation-advanced-row">
              <label htmlFor="admin-sim-plan">Formule</label>
              <select
                id="admin-sim-plan"
                value={customPlanId}
                onChange={(e) => setCustomPlanId(e.target.value as PlanId)}
              >
                {BILLING_PLANS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-simulation-advanced-row">
              <span>Période</span>
              <div className="admin-simulation-period-toggle">
                <button
                  type="button"
                  className={customPeriod === 'monthly' ? 'is-active' : ''}
                  onClick={() => setCustomPeriod('monthly')}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  className={customPeriod === 'semester' ? 'is-active' : ''}
                  onClick={() => setCustomPeriod('semester')}
                >
                  Semestriel
                </button>
              </div>
            </div>
            <div className="admin-simulation-advanced-row">
              <label htmlFor="admin-sim-months">
                Chapitres parcours débloqués ({customMonths}/6)
              </label>
              <input
                id="admin-sim-months"
                type="range"
                min={1}
                max={6}
                value={customMonths}
                onChange={(e) => setCustomMonths(Number(e.target.value))}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                void applySimulation(customPlanId, customPeriod, customMonths, 'custom')
              }
              disabled={loading !== null}
            >
              {loading === 'custom' ? 'Application…' : 'Appliquer cette simulation'}
            </button>
          </div>
        </details>
      </section>

      <div className="admin-actions-grid">
        <article className="admin-action-card">
          <h3>Espace client</h3>
          <p>Coach IA, parcours, ville, analyse et ressources selon la formule simulée.</p>
          <Link href="/espace" className="btn btn-outline">
            Ouvrir /espace
          </Link>
          {isSubscribed && (
            <Link href="/espace?checkout=success" className="btn btn-ghost btn-sm">
              Avec bannière bienvenue
            </Link>
          )}
        </article>

        <article className="admin-action-card">
          <h3>Parcours complet</h3>
          <p>Tester le funnel depuis le questionnaire jusqu&apos;au paiement.</p>
          <Link href="/?landing=1" className="btn btn-outline">
            Page d&apos;accueil
          </Link>
          <Link href="/subscribe?plan=growth&period=monthly" className="btn btn-ghost btn-sm">
            Page paiement Accelerator
          </Link>
        </article>

        <article className="admin-action-card admin-action-card--muted">
          <h3>Raccourci</h3>
          <p>
            Sur la page paiement, le bouton admin simule la formule affichée (plan + période
            sélectionnés).
          </p>
          <Link href="/subscribe?plan=starter&period=monthly" className="btn btn-ghost btn-sm">
            Paiement Premium 29 €
          </Link>
        </article>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <p className="admin-note">
        Configure ton email dans <code>ADMIN_EMAILS</code> du fichier <code>.env.local</code>.
      </p>
    </div>
  );
}
