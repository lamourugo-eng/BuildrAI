import type { BillingPeriod, PlanId } from '@/lib/stripe';
import { normalizeBillingPeriod } from '@/lib/stripe';
import { MAX_ROADMAP_MONTHS } from '@/lib/quiz/roadmap-program';

export const SUBSCRIPTION_META_KEY = 'buildrai_subscription_meta';

export { MAX_ROADMAP_MONTHS };

export interface SubscriptionMeta {
  planId: PlanId;
  period: BillingPeriod;
  activatedAt: string;
  /** Mois de parcours payés (suivi Stripe / renouvellements). Le parcours complet (6 ch.) est accessible dès le 1er paiement. */
  monthsPaid: number;
  /** Fin de période Stripe en cours (ISO). Prochain renouvellement. */
  currentPeriodEnd?: string;
  /** Essai newsletter 24 h. Fin ISO */
  trialEndsAt?: string;
  /** true si l'accès actuel vient de l'essai newsletter (pas Stripe) */
  isNewsletterTrial?: boolean;
}

const EMPTY_META: SubscriptionMeta = {
  planId: 'starter',
  period: 'monthly',
  activatedAt: '',
  monthsPaid: 0,
};

export function loadSubscriptionMeta(): SubscriptionMeta {
  if (typeof window === 'undefined') return EMPTY_META;
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_META_KEY);
    if (!raw) return EMPTY_META;
    const parsed = JSON.parse(raw) as Partial<SubscriptionMeta>;
    const rawPlanId =
      (parsed.planId as string | undefined) === 'scale' ? 'growth' : parsed.planId;
    if (!rawPlanId || !['starter', 'growth'].includes(rawPlanId)) {
      return EMPTY_META;
    }
    return {
      planId: rawPlanId as PlanId,
      period: normalizeBillingPeriod(parsed.period),
      activatedAt: parsed.activatedAt ?? '',
      monthsPaid: parsed.activatedAt
        ? MAX_ROADMAP_MONTHS
        : typeof parsed.monthsPaid === 'number' && parsed.monthsPaid > 0
          ? parsed.monthsPaid
          : 0,
      currentPeriodEnd:
        typeof parsed.currentPeriodEnd === 'string' ? parsed.currentPeriodEnd : undefined,
      trialEndsAt:
        typeof parsed.trialEndsAt === 'string' ? parsed.trialEndsAt : undefined,
      isNewsletterTrial: parsed.isNewsletterTrial === true,
    };
  } catch {
    return EMPTY_META;
  }
}

export function saveSubscriptionMeta(meta: SubscriptionMeta): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUBSCRIPTION_META_KEY, JSON.stringify(meta));
}

/** @deprecated Ne plus utiliser pour débloquer le parcours. Réservé à l'affichage ancienneté. */
export function getTenureMonthsFromActivation(activatedAt: string): number {
  if (!activatedAt) return 1;
  const start = new Date(activatedAt);
  if (Number.isNaN(start.getTime())) return 1;
  const days = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return Math.min(MAX_ROADMAP_MONTHS, Math.floor(days / 30) + 1);
}

/**
 * Nombre de mois de roadmap débloqués.
 * Dès le premier paiement (mensuel ou semestriel), les 6 chapitres (180 jours) sont accessibles.
 */
export function getUnlockedRoadmapMonths(meta: SubscriptionMeta): number {
  if (!meta.activatedAt) return 0;
  return MAX_ROADMAP_MONTHS;
}

/** Mois débloqués pour l'UI quand l'abonnement serveur est actif (meta locale parfois en retard). */
export function getEffectiveUnlockedRoadmapMonths(isSubscribed: boolean): number {
  if (!isSubscribed) return 0;
  const fromMeta = getUnlockedRoadmapMonths(loadSubscriptionMeta());
  return fromMeta > 0 ? fromMeta : MAX_ROADMAP_MONTHS;
}

/** Met à jour le compteur de mois depuis Stripe (ne réduit jamais le local). */
export function mergeStripeRoadmapMonths(
  meta: SubscriptionMeta,
  stripeMonthsPaid: number,
  currentPeriodEnd?: string | null
): SubscriptionMeta {
  const nextPaid = Math.min(
    MAX_ROADMAP_MONTHS,
    Math.max(meta.monthsPaid > 0 ? meta.monthsPaid : 0, stripeMonthsPaid)
  );
  return {
    ...meta,
    monthsPaid: nextPaid > 0 ? nextPaid : meta.monthsPaid,
    currentPeriodEnd: currentPeriodEnd ?? meta.currentPeriodEnd,
  };
}

export function recordSubscriptionActivation(planId: PlanId, period: BillingPeriod): void {
  const existing = loadSubscriptionMeta();
  const now = new Date().toISOString();

  if (existing.activatedAt) {
    saveSubscriptionMeta({
      planId,
      period,
      activatedAt: existing.activatedAt,
      monthsPaid: Math.min(
        MAX_ROADMAP_MONTHS,
        (existing.monthsPaid > 0 ? existing.monthsPaid : 1) + 1
      ),
    });
    return;
  }

  saveSubscriptionMeta({
    planId,
    period,
    activatedAt: now,
    monthsPaid: MAX_ROADMAP_MONTHS,
  });
}

/** Simulation admin. Définit le plan sans simuler un renouvellement Stripe. */
export function applyAdminSubscriptionSimulation(
  planId: PlanId,
  period: BillingPeriod,
  options?: { monthsPaid?: number }
): void {
  const existing = loadSubscriptionMeta();
  const now = new Date().toISOString();
  const defaultMonths = MAX_ROADMAP_MONTHS;

  let monthsPaid: number;
  if (typeof options?.monthsPaid === 'number') {
    monthsPaid = Math.min(MAX_ROADMAP_MONTHS, Math.max(1, options.monthsPaid));
  } else if (existing.activatedAt && existing.monthsPaid > 0) {
    monthsPaid = existing.monthsPaid;
  } else {
    monthsPaid = defaultMonths;
  }

  saveSubscriptionMeta({
    planId,
    period,
    activatedAt: existing.activatedAt || now,
    monthsPaid,
  });
}

export function clearAdminSubscriptionSimulation(): void {
  saveSubscriptionMeta({
    planId: 'starter',
    period: 'monthly',
    activatedAt: '',
    monthsPaid: 0,
  });
}

/**
 * Plan Accelerator côté client. Nécessite une activation enregistrée
 * (évite un plan growth par défaut sans abonnement).
 */
export function isGrowthPlan(meta?: SubscriptionMeta | null): boolean {
  const m = meta ?? loadSubscriptionMeta();
  return Boolean(m.activatedAt && m.planId === 'growth');
}

export function hasActivatedSubscriptionMeta(meta?: SubscriptionMeta | null): boolean {
  return Boolean((meta ?? loadSubscriptionMeta()).activatedAt);
}

export function clearSubscriptionLocal(): void {
  saveSubscriptionMeta({
    planId: 'starter',
    period: 'monthly',
    activatedAt: '',
    monthsPaid: 0,
    trialEndsAt: undefined,
    isNewsletterTrial: undefined,
  });
}

/** Active l'essai newsletter 24 h côté client (complète les cookies posés par l'API). */
export function applyNewsletterTrialLocal(trialEndsAt: string): void {
  saveSubscriptionMeta({
    planId: 'starter',
    period: 'monthly',
    activatedAt: new Date().toISOString(),
    monthsPaid: MAX_ROADMAP_MONTHS,
    trialEndsAt,
    isNewsletterTrial: true,
  });
}

export function formatNextRoadmapUnlock(_meta: SubscriptionMeta): string | null {
  return null;
}

export function isNewsletterTrialExpiredLocal(meta?: SubscriptionMeta | null): boolean {
  const m = meta ?? loadSubscriptionMeta();
  if (!m.isNewsletterTrial || !m.trialEndsAt) return false;
  return new Date(m.trialEndsAt).getTime() <= Date.now();
}
