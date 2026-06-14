/** Durée du parcours premium : 6 mois × 30 jours = 180 jours. */
export const MAX_ROADMAP_MONTHS = 6;

/** Jours par chapitre (30 jours). */
export const ROADMAP_DAYS_PER_CHAPTER = 30;

/** Total du parcours complet (6 chapitres). */
export const TOTAL_ROADMAP_DAYS = MAX_ROADMAP_MONTHS * ROADMAP_DAYS_PER_CHAPTER;

export interface SemesterChapterMeta {
  month: number;
  label: string;
  arc: string;
  /** Étapes coach 8 phases dominantes ce mois (1 semaine = 1 phase dominante) */
  phaseIds: [number, number, number, number];
}

/**
 * Arc narratif du semestre. Structure finale 180 jours.
 *
 * Mois 1. Lancement (30 j). Phases coach 1→8 : problème, persona, offre, site, prix, 1ers clients.
 * Mois 2. Consolidation (30 j). Audit mois 1, rétention, pricing, pipeline.
 * Mois 3. Volume (30 j). Canal gagnant, contenu, partenariats, discipline commerciale.
 * Mois 4. Scale ops (30 j). Marge, process, automatisations, focus stratégique.
 * Mois 5. Marque & LTV (30 j). Offre #2, rétention, actifs revente (SaaS / digital).
 * Mois 6. Bilan (30 j). Chiffres, leçons, délégation, vision S2 + exit plan.
 *
 * Juridique : anticipé uniquement jour 5 du mois 1 (formalisation quand le business est monté).
 */
export const SEMESTER_CHAPTER_META: SemesterChapterMeta[] = [
  {
    month: 1,
    label: 'Lancement. 30 premiers jours',
    arc: 'Des 8 étapes coach : clarifier, valider, publier, prospecter et viser la 1ère vente.',
    phaseIds: [1, 3, 5, 8],
  },
  {
    month: 2,
    label: 'Consolider & accélérer l\'acquisition',
    arc: 'Mesurer le mois 1, fidéliser, ajuster l\'offre et structurer la prospection récurrente.',
    phaseIds: [8, 8, 6, 7],
  },
  {
    month: 3,
    label: 'Optimiser marges & volume',
    arc: 'Doubler le canal gagnant, crédibilité contenu, partenariats et rythme commercial.',
    phaseIds: [7, 7, 7, 6],
  },
  {
    month: 4,
    label: 'Élargir l\'offre & scaler',
    arc: 'Rentabilité par client, standardiser, automatiser et couper le non-essentiel.',
    phaseIds: [6, 6, 5, 5],
  },
  {
    month: 5,
    label: 'Marque, rétention & croissance',
    arc: 'Offre complémentaire, LTV, marque. Documenter les actifs pour scale ou revente.',
    phaseIds: [4, 3, 3, 7],
  },
  {
    month: 6,
    label: 'Bilan semestriel & vision 6 mois',
    arc: 'Tableau de bord, rétention, 1ère délégation. Priorités S2 et plan revente si pertinent.',
    phaseIds: [8, 6, 1, 1],
  },
];

export const DISPLAY_MONTH_LABELS: Record<number, string> = Object.fromEntries(
  SEMESTER_CHAPTER_META.map((c) => [c.month, c.label])
) as Record<number, string>;

export function getSemesterChapterMeta(month: number): SemesterChapterMeta | undefined {
  return SEMESTER_CHAPTER_META.find((c) => c.month === month);
}

export function getRoadmapMonthDayCount(_displayMonth?: number): number {
  return ROADMAP_DAYS_PER_CHAPTER;
}

export function getGlobalDayOffset(displayMonth: number): number {
  return (displayMonth - 1) * ROADMAP_DAYS_PER_CHAPTER;
}

export function getTotalUnlockedRoadmapDays(unlockedMonths: number): number {
  const capped = Math.min(MAX_ROADMAP_MONTHS, Math.max(0, unlockedMonths));
  return capped * ROADMAP_DAYS_PER_CHAPTER;
}

/** 4 semaines par chapitre (30 jours). */
export function weekForRoadmapMonthDay(dayInMonth: number, daysInMonth: number): number {
  const segment = Math.max(1, Math.ceil(daysInMonth / 4));
  return Math.min(4, Math.ceil(dayInMonth / segment));
}
