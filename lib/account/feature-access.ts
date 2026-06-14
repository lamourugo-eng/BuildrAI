import type { PlanId } from '@/lib/stripe';
import type { SubscriptionMeta } from '@/lib/account/subscription-storage';
import { loadSubscriptionMeta } from '@/lib/account/subscription-storage';
import type { DashboardSection } from '@/lib/dashboard/sections';
import { LOCKED_SECTIONS } from '@/lib/dashboard/sections';

export type SubscriptionTier = 'free' | 'starter' | 'growth';

export type GatedFeature =
  | 'coach'
  | 'roadmap_full'
  | 'city_full'
  | 'activity'
  | 'weekly_analysis'
  | 'resources';

/** Tier effectif : cookie serveur prioritaire, puis meta locale si abonné. */
export function resolveSubscriptionTier(
  isSubscribed: boolean,
  serverPlanId?: PlanId | null,
  meta?: SubscriptionMeta | null
): SubscriptionTier {
  if (!isSubscribed) return 'free';
  if (serverPlanId === 'growth') return 'growth';
  if (serverPlanId === 'starter') return 'starter';
  const m = meta ?? (typeof window !== 'undefined' ? loadSubscriptionMeta() : null);
  if (m?.activatedAt && m.planId === 'growth') return 'growth';
  if (m?.activatedAt) return 'starter';
  return 'starter';
}

/** Business Accelerator (99 €). Analyse hebdo + bibliothèque. */
export function hasGrowthAccess(
  isSubscribed: boolean,
  serverPlanId?: PlanId | null,
  meta?: SubscriptionMeta | null
): boolean {
  return resolveSubscriptionTier(isSubscribed, serverPlanId, meta) === 'growth';
}

export function canAccessFeature(
  feature: GatedFeature,
  isSubscribed: boolean,
  serverPlanId?: PlanId | null,
  meta?: SubscriptionMeta | null
): boolean {
  const tier = resolveSubscriptionTier(isSubscribed, serverPlanId, meta);
  switch (feature) {
    case 'coach':
    case 'roadmap_full':
    case 'city_full':
    case 'activity':
      return tier !== 'free';
    case 'weekly_analysis':
    case 'resources':
      return tier === 'growth';
    default:
      return false;
  }
}

export function getSectionNavHref(
  sectionId: DashboardSection,
  sectionHref: string,
  isSubscribed: boolean,
  serverPlanId?: PlanId | null,
  meta?: SubscriptionMeta | null
): { locked: boolean; href: string; growthBadge?: boolean } {
  const growthOnly = sectionId === 'analyse' || sectionId === 'ressources';
  const freeLocked = !isSubscribed && LOCKED_SECTIONS.has(sectionId);
  const growthLocked =
    isSubscribed && growthOnly && !hasGrowthAccess(isSubscribed, serverPlanId, meta);

  if (freeLocked) {
    return { locked: true, href: '/espace?section=abonnement' };
  }
  if (growthLocked) {
    return {
      locked: true,
      href: '/espace?section=abonnement&upgrade=growth',
      growthBadge: true,
    };
  }
  return { locked: false, href: sectionHref };
}
