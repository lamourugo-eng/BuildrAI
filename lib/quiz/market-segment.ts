import {
  loadRoadmapProgress,
  saveRoadmapProgress,
  type RoadmapProgress,
} from '@/lib/account/roadmap-storage';
import type { BusinessId } from '@/lib/quiz/data';

export type MarketSegment = 'b2b' | 'b2c';

/** Modèles où le parcours doit diverger selon B2B ou B2C. */
export const MARKET_SEGMENT_BUSINESS_IDS: BusinessId[] = ['saas', 'marketplace', 'ecommerce'];

export function businessUsesMarketSegment(businessId: BusinessId): boolean {
  return MARKET_SEGMENT_BUSINESS_IDS.includes(businessId);
}

export function marketSegmentLabel(segment: MarketSegment): string {
  return segment === 'b2b' ? 'B2B' : 'B2C';
}

export function marketSegmentDescription(businessId: BusinessId, segment: MarketSegment): string {
  if (businessId === 'saas') {
    return segment === 'b2b'
      ? 'Entreprises — cycles plus longs, tickets plus élevés, LinkedIn & démos'
      : 'Particuliers — volume, product-led, communautés & stores';
  }
  if (businessId === 'marketplace') {
    return segment === 'b2b'
      ? 'Place de marché pro — offreurs & acheteurs entreprises'
      : 'Place de marché grand public — particuliers des deux côtés';
  }
  return segment === 'b2b'
    ? 'Vente B2B — wholesale, revendeurs, catalogues pro'
    : 'Vente directe (D2C) — particuliers, réseaux sociaux & boutique en ligne';
}

/** Extrait B2B ou B2C d'un message client (livrable coach ou choix manuel). */
export function detectMarketSegmentFromText(text: string | undefined): MarketSegment | null {
  const raw = text?.trim() ?? '';
  if (!raw) return null;

  const t = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  const saysB2b =
    /\bb2b\b|business to business|marche b2b|marketplace b2b|plutot.*entreprise|vers les entreprises|pour les entreprises|des entreprises|aux entreprises|cible.*entreprise|je vise.*entreprise|wholesale|revendeurs|catalogue pro|decideurs|comptes entreprises/i.test(
      t
    );
  const saysB2c =
    /\bb2c\b|business to consumer|marche b2c|marketplace b2c|plutot.*particulier|vers les particuliers|pour les particuliers|particuliers|consommateurs|\bd2c\b|direct.*consommateur|cible.*particulier|je vise.*particulier|grand public/i.test(
      t
    );

  if (saysB2b && !saysB2c) return 'b2b';
  if (saysB2c && !saysB2b) return 'b2c';
  if (/\bentreprise/i.test(t) && !/\bparticulier/i.test(t)) return 'b2b';
  if (/\bparticulier/i.test(t) && !/\bentreprise/i.test(t)) return 'b2c';

  return null;
}

export function getMarketSegmentForBusiness(
  businessId: BusinessId,
  progress?: RoadmapProgress | null
): MarketSegment | null {
  if (!businessUsesMarketSegment(businessId)) return null;
  const stored = progress ?? loadRoadmapProgress();
  if (!stored || stored.businessId !== businessId) return null;
  return stored.marketSegment ?? null;
}

export function saveMarketSegment(
  businessId: BusinessId,
  segment: MarketSegment,
  progress?: RoadmapProgress | null
): RoadmapProgress {
  const existing = progress ?? loadRoadmapProgress();
  const base: RoadmapProgress =
    existing?.businessId === businessId
      ? existing
      : {
          businessId,
          completedDays: [],
          completedTasks: {},
          updatedAt: new Date().toISOString(),
        };

  const updated: RoadmapProgress = {
    ...base,
    marketSegment: segment,
    updatedAt: new Date().toISOString(),
  };
  saveRoadmapProgress(updated);
  return updated;
}
