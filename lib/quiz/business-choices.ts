import { businessProfiles, type BusinessId } from './data';

export const ALL_BUSINESS_IDS = Object.keys(businessProfiles) as BusinessId[];

export interface BusinessChoiceOption {
  id: BusinessId;
  name: string;
  percent: number | null;
  recommended: boolean;
}

export function isValidBusinessId(id: string | null | undefined): id is BusinessId {
  return !!id && id in businessProfiles;
}

export function getBusinessMatchPercent(
  top3: { id: BusinessId; percent: number }[],
  businessId: BusinessId
): number | null {
  return top3.find((item) => item.id === businessId)?.percent ?? null;
}

/** Tous les modèles business : top 4 du quiz en tête (avec %), puis le reste. */
export function buildBusinessChoiceOptions(
  top3: { id: BusinessId; name: string; percent: number }[]
): BusinessChoiceOption[] {
  const rankedIds = new Set(top3.map((item) => item.id));

  const recommended = top3.map((item) => ({
    id: item.id,
    name: item.name,
    percent: item.percent,
    recommended: true,
  }));

  const others = ALL_BUSINESS_IDS.filter((id) => !rankedIds.has(id)).map((id) => ({
    id,
    name: businessProfiles[id].name,
    percent: null,
    recommended: false,
  }));

  return [...recommended, ...others];
}
