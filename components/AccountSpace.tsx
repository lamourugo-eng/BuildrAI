'use client';

import Link from 'next/link';
import AccountDashboard from '@/components/AccountDashboard';
import { useEntrepreneurCopy } from '@/components/EntrepreneurCopyProvider';
import { hydrateUserDataFromServer } from '@/lib/account/user-data-sync';
import {
  consumeNewsletterTrialPending,
  processNewsletterTrialOptIn,
  syncSubscriptionAndHandleTrialExpiry,
} from '@/lib/account/newsletter-trial-client';
import { syncRoadmapMonthsFromStripe } from '@/lib/account/roadmap-sync-client';
import {
  loadSubscriptionMeta,
  recordSubscriptionActivation,
  saveSubscriptionMeta,
} from '@/lib/account/subscription-storage';
import type { PlanId } from '@/lib/stripe';
import { normalizeBillingPeriod } from '@/lib/stripe';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const CHECKOUT_PROCESSED_KEY = 'buildrai_checkout_processed';
const CHECKOUT_RETRY_ATTEMPTS = 6;
const CHECKOUT_RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function syncStripeAfterCheckout() {
  for (let attempt = 0; attempt < CHECKOUT_RETRY_ATTEMPTS; attempt += 1) {
    const syncRes = await fetch('/api/subscription/sync-stripe', { method: 'POST' });
    const syncData = (await syncRes.json()) as {
      active?: boolean;
      planId?: PlanId;
      period?: string;
      transient?: boolean;
    };

    if (syncRes.status === 503 && syncData.transient) {
      await sleep(CHECKOUT_RETRY_DELAY_MS);
      continue;
    }

    if (syncRes.ok && syncData.active) {
      return syncData;
    }

    if (attempt < CHECKOUT_RETRY_ATTEMPTS - 1) {
      await sleep(CHECKOUT_RETRY_DELAY_MS);
    }
  }

  return null;
}

interface AccountSpaceProps {
  email: string;
  isAdmin?: boolean;
  isSubscribed?: boolean;
  serverPlanId?: PlanId | null;
  isGrowth?: boolean;
  trialEndsAt?: string | null;
  trialExpired?: boolean;
}

function formatTrialCountdown(trialEndsAt: string): string {
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 'expiré';
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 1) return `${hours} h ${minutes} min restantes`;
  return `${minutes} min restantes`;
}

export default function AccountSpace({
  email,
  isAdmin = false,
  isSubscribed = false,
  serverPlanId = null,
  isGrowth = false,
  trialEndsAt = null,
  trialExpired = false,
}: AccountSpaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { copy } = useEntrepreneurCopy();
  const [welcome, setWelcome] = useState(false);
  const [trialNotice, setTrialNotice] = useState<string | null>(null);
  const [trialCountdown, setTrialCountdown] = useState<string | null>(
    trialEndsAt ? formatTrialCountdown(trialEndsAt) : null
  );

  useEffect(() => {
    void hydrateUserDataFromServer();
  }, []);

  useEffect(() => {
    if (trialExpired) {
      setTrialNotice(
        'Ton essai Premium 24 h est terminé. Tu es repassé sur le plan Gratuit.'
      );
    }
  }, [trialExpired]);

  useEffect(() => {
    if (!trialEndsAt || !isSubscribed) {
      setTrialCountdown(null);
      return;
    }
    const tick = () => setTrialCountdown(formatTrialCountdown(trialEndsAt));
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [trialEndsAt, isSubscribed]);

  useEffect(() => {
    void syncSubscriptionAndHandleTrialExpiry().then((result) => {
      if (result.trialExpired) {
        setTrialNotice(
          'Ton essai Premium 24 h est terminé. Tu es repassé sur le plan Gratuit.'
        );
      }
      if (!result.transient && (Boolean(result.active) !== isSubscribed || result.trialExpired)) {
        router.refresh();
      }
    });
  }, [isSubscribed, router]);

  useEffect(() => {
    if (!consumeNewsletterTrialPending()) return;
    void processNewsletterTrialOptIn().then((data) => {
      if (data?.trialGranted && data.trialEndsAt) {
        setTrialNotice(
          'Essai Premium 24 h activé. Profite du coach, du parcours complet et de Ma ville.'
        );
        router.refresh();
        return;
      }
      if (data?.error) {
        setTrialNotice(data.error);
      } else if (data?.message) {
        setTrialNotice(data.message);
      }
    });
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      void syncSubscriptionAndHandleTrialExpiry().then((result) => {
        if (result.trialExpired) {
          setTrialNotice(
            'Ton essai Premium 24 h est terminé. Tu es repassé sur le plan Gratuit.'
          );
          router.refresh();
        }
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (searchParams.get('checkout') !== 'success') return;
    if (sessionStorage.getItem(CHECKOUT_PROCESSED_KEY) === '1') return;

    async function processCheckout() {
      const syncData = await syncStripeAfterCheckout();

      if (!syncData?.active) {
        const activateRes = await fetch('/api/subscription/activate', { method: 'POST' });
        if (!activateRes.ok) return;
        const activateData = (await activateRes.json()) as { planId?: PlanId; period?: string };
        if (activateData.planId) {
          const meta = loadSubscriptionMeta();
          if (!meta.activatedAt) {
            recordSubscriptionActivation(
              activateData.planId,
              normalizeBillingPeriod(activateData.period)
            );
          }
        }
      } else {
        const planId =
          syncData.planId === 'growth' || syncData.planId === 'starter'
            ? syncData.planId
            : 'starter';
        const period = normalizeBillingPeriod(syncData.period);
        const meta = loadSubscriptionMeta();
        if (!meta.activatedAt) {
          recordSubscriptionActivation(planId, period);
        } else if (meta.planId !== planId || meta.period !== period) {
          saveSubscriptionMeta({ ...meta, planId, period, isNewsletterTrial: undefined, trialEndsAt: undefined });
        }
        await syncRoadmapMonthsFromStripe();
      }

      sessionStorage.setItem(CHECKOUT_PROCESSED_KEY, '1');
      router.replace('/espace?welcome=1');
      router.refresh();
    }

    void processCheckout();
  }, [searchParams, router]);

  useEffect(() => {
    if (
      searchParams.get('checkout') === 'success' ||
      searchParams.get('welcome') === '1' ||
      (isSubscribed && searchParams.get('admin') === '1')
    ) {
      setWelcome(true);
    }
  }, [searchParams, isSubscribed]);

  return (
    <div className="account-space account-space--dashboard account-space--live">
      {isAdmin && (
        <div className="dash-admin-strip">
          <span>Mode admin</span>
          <Link href="/admin" className="btn btn-ghost btn-sm">
            Panneau admin
          </Link>
          {!isSubscribed && (
            <span className="account-admin-hint">
              Abonnement non simulé. Active-le depuis le panneau admin.
            </span>
          )}
        </div>
      )}

      {trialNotice && (
        <div className="dash-trial-strip" role="status">
          <span>{trialNotice}</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setTrialNotice(null)}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}

      {isSubscribed && trialEndsAt && trialCountdown && !trialNotice && (
        <div className="dash-trial-strip dash-trial-strip--active" role="status">
          <span>
            <strong>Essai Premium 24 h</strong>. {trialCountdown}. Puis retour automatique au plan
            Gratuit.
          </span>
          <Link href="/espace?section=abonnement" className="btn btn-ghost btn-sm">
            Souscrire. 29 €/mois
          </Link>
        </div>
      )}

      {welcome && isSubscribed && (
        <div className="dash-welcome-strip">
          <span>{copy.welcomeStrip}</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setWelcome(false)}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}

      <AccountDashboard
        email={email}
        isSubscribed={isSubscribed}
        serverPlanId={serverPlanId}
        isGrowth={isGrowth}
      />
    </div>
  );
}
