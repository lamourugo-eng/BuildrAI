import { COACHING_PHASES } from '@/lib/coach/journey';
import type { BusinessId } from '@/lib/quiz/data';
import {
  formatExitGuideTip,
  formatLegalGuideTip,
  resolveSpecialDayKey,
} from '@/lib/quiz/roadmap-legal-exit';
import {
  getBusinessSemesterTip,
  resolveBusinessDayTitle,
  resolveBusinessWeekObjective,
} from '@/lib/quiz/roadmap-business-overlays';
import { buildSemesterDayTasks } from '@/lib/quiz/roadmap-semester-tasks';
import { withoutFocusBlockTasks } from '@/lib/quiz/roadmap-task-filters';
import { getSemesterChapterMeta } from '@/lib/quiz/roadmap-program';
import type { RoadmapDay } from '@/lib/quiz/premium-roadmap';

export interface MonthTheme {
  month: number;
  label: string;
  weekLabels: [string, string, string, string];
  dayTitles: string[];
  objectives: [string, string, string, string];
}

/** Parcours semestriel mois 2 à 6. 30 jours chacun, 4 semaines thématiques. */
export const SEMESTER_MONTH_THEMES: MonthTheme[] = [
  {
    month: 2,
    label: 'Consolider & accélérer l\'acquisition',
    weekLabels: [
      'Bilan mois 1 & pipeline',
      'Fidéliser & relancer',
      'Ajuster offre & pricing',
      'Préparer la montée en charge',
    ],
    dayTitles: [
      'Audit du premier mois', 'Ce qui a converti', 'Ce qui a bloqué', 'Chiffre du pipeline',
      'Nettoyer la liste prospects', 'Relances personnalisées', 'Script de relance J+7',
      'Bilan semaine. Rétention',
      'Cartographier le parcours client', 'Point de friction n°1', 'Réponse aux objections récurrentes',
      'Mini FAQ client', 'Email de suivi post-vente', 'Demande d\'avis ou témoignage',
      'Bilan offre actuelle',
      'Ajuster prix ou packaging', 'Test upsell léger', 'Bundle ou option premium',
      'Documenter ton process de vente', 'Checklist livraison', 'Modèle de proposition',
      'Bilan semaine. Offre',
      'Choisir 1 canal à doubler', 'Plan contenu ou prospection 7j', 'Automatiser 1 tâche répétitive',
      'Mesurer coût d\'acquisition', 'Objectif CA mois 2', 'Rituels hebdo (30 min)',
      'Préparer le mois 3', 'Bilan 60 jours',
    ],
    objectives: [
      'Mesurer ce qui a fonctionné au premier mois et nettoyer le pipeline.',
      'Transformer les prospects tièdes et sécuriser la satisfaction client.',
      'Ajuster offre, prix et packaging selon les retours terrain.',
      'Structurer la récurrence avant d\'accélérer le volume.',
    ],
  },
  {
    month: 3,
    label: 'Optimiser marges & volume',
    weekLabels: [
      'Doubler le canal gagnant',
      'Contenu & crédibilité',
      'Partenariats & bouche-à-oreille',
      'Volume & discipline commerciale',
    ],
    dayTitles: [
      'Audit canal #1', 'Objectif contacts semaine', '10 nouveaux messages',
      'Variante A/B message', 'Suivi des taux de réponse', 'Ajuster le script',
      'Bilan semaine acquisition',
      'Publier ou partager 1 contenu utile', 'Recycler un témoignage', 'Post ou email valeur',
      'Répondre aux commentaires / DM', 'Liste 5 idées contenu', 'Calendrier éditorial 2 sem.',
      'Bilan contenu',
      'Lister 10 partenaires possibles', '3 messages partenariat', 'Proposition win-win',
      'Activer le parrainage simple', 'Demander 2 introductions', 'Suivi partenaires',
      'Bilan partenariats',
      'Quota prospection quotidien', 'Pipeline visuel', 'Prioriser chaud / tiède / froid',
      '1 appel de vente minimum', 'Analyser pertes', 'Ajuster ciblage',
      'Objectif mois 3', 'Bilan 90 jours',
    ],
    objectives: [
      'Augmenter le volume sur le canal qui convertit le mieux.',
      'Renforcer la confiance par le contenu et les preuves sociales.',
      'Ouvrir des leviers de croissance indirects (partenaires, parrainage).',
      'Installer une discipline commerciale hebdomadaire mesurable.',
    ],
  },
  {
    month: 4,
    label: 'Élargir l\'offre & scaler',
    weekLabels: [
      'Rentabilité par client',
      'Process & gain de temps',
      'Outils & automatisations',
      'Focus stratégique',
    ],
    dayTitles: [
      'Calculer marge par client / vente', 'Identifier clients les plus rentables', 'Couper l\'offre non rentable',
      'Tableau de bord marge simple', 'Temps passé par mission / commande', 'Tâche à faible valeur n°1',
      'Bilan rentabilité semaine 1',
      'Cartographier process de A à Z', 'Standardiser 1 livrable récurrent', 'Modèle ou template réutilisable',
      'Délai moyen de livraison', 'Point de friction ops', 'Checklist qualité',
      'Bilan process semaine 2',
      'Lister 3 tâches répétitives', 'Automatiser ou déléguer 1 tâche', 'Outil no-code ou CRM léger',
      'Email ou séquence automatisée', 'Mesurer temps gagné', 'Documenter le nouveau process',
      'Bilan automatisations',
      'Revue des 3 objectifs trimestre', 'Couper 1 initiative non prioritaire', 'Renforcer le canal #1',
      'Plan d\'action 30 jours ciblé', 'Aligner pricing et capacité', 'Préparer montée en charge',
      'Objectif mois 4', 'Bilan 120 jours',
    ],
    objectives: [
      'Identifier clients et offres les plus rentables. Couper le reste.',
      'Réduire le temps passé sur les tâches à faible valeur.',
      'Automatiser ou simplifier 2 process clés.',
      'Couper ce qui ne sert pas tes objectifs du trimestre.',
    ],
  },
  {
    month: 5,
    label: 'Marque, rétention & croissance',
    weekLabels: [
      'Écouter le marché',
      'Offre complémentaire',
      'Pricing avancé & LTV',
      'Lancement soft & marque',
    ],
    dayTitles: [
      '5 retours clients récurrents', 'Demande non couverte n°1', 'Sondage rapide (5 questions)',
      'Analyser les patterns', 'Valider 1 opportunité', 'Esquisser offre #2',
      'Bilan écoute marché',
      'Nom & promesse offre complémentaire', 'Pricing palier premium', 'Pack ou abonnement récurrent',
      'Page ou section dédiée', 'Argumentaire différenciation', 'Test auprès de 3 clients fidèles',
      'Bilan offre #2',
      'Calculer LTV simple', 'Programme fidélité ou rétention', 'Email win-back inactifs',
      'Contenu marque (story, valeurs)', 'Preuves sociales à jour', 'Actifs numériques documentés (revente)',
      'Bilan rétention',
      'Soft launch offre #2', 'Mesurer taux d\'adoption', 'Ajuster selon feedback',
      'Campagne bouche-à-oreille', 'Renforcer identité visuelle / ton', 'Plan croissance mois 6',
      'Objectif mois 5', 'Bilan 150 jours',
    ],
    objectives: [
      'Collecter les demandes récurrentes non couvertes par l\'offre actuelle.',
      'Esquisser et tester une offre complémentaire rentable.',
      'Renforcer rétention, LTV et preuves de marque.',
      'Lancer en soft launch auprès de clients fidèles.',
    ],
  },
  {
    month: 6,
    label: 'Bilan semestriel & vision 6 mois',
    weekLabels: [
      'Chiffres & vérité',
      'Rétention & leçons',
      'Équipe & délégation',
      'Vision prochains 6 mois',
    ],
    dayTitles: [
      'Tableau de bord semestre (CA, marge)', 'Taux conversion par canal', 'Coût d\'acquisition réel',
      'Clients acquis vs objectif', 'Écarts : pourquoi ?', '3 décisions data-driven',
      'Bilan chiffres semaine 1',
      'Taux de rétention / réachat', 'Interview 2 clients satisfaits', 'Interview 1 client perdu',
      'Leçon produit n°1', 'Leçon vente n°1', 'Leçons ops & rétention. Synthèse',
      'Bilan rétention semestre',
      'Lister toutes tes tâches récurrentes', '1ère tâche à déléguer', 'Profil freelance / outil / associé',
      'Process documenté pour déléguer', 'Budget délégation mois 7', 'Risque n°1 si tu scales seul',
      'Bilan délégation',
      'Vision à 6 mois (1 phrase)', '3 priorités stratégiques S2 & objectifs chiffrés',
      'Roadmap trimestre 3 (high level)', 'Métriques revente. Export 12 mois', 'Data room light. Due diligence',
      'Plan revente ou scale. 18 mois', 'Bilan semestriel. 180 jours & lancement mois 7',
    ],
    objectives: [
      'Consolider un tableau de bord fiable (CA, marge, conversion).',
      'Comprendre pourquoi les clients restent ou partent.',
      'Identifier la première tâche à déléguer ou externaliser.',
      'Fixer 3 priorités claires pour le second semestre.',
    ],
  },
];

function weekForDayInMonth(dayInMonth: number): number {
  if (dayInMonth <= 7) return 1;
  if (dayInMonth <= 14) return 2;
  if (dayInMonth <= 21) return 3;
  return 4;
}

function phaseName(phaseId: number): string {
  return COACHING_PHASES.find((p) => p.id === phaseId)?.name ?? '';
}

function getMonthTheme(month: number): MonthTheme {
  const found = SEMESTER_MONTH_THEMES.find((m) => m.month === month);
  if (found) return found;
  return SEMESTER_MONTH_THEMES[0];
}

function weekObjective(theme: MonthTheme, week: number): string {
  return theme.objectives[week - 1] ?? theme.objectives[0];
}

function phaseForWeek(month: number, week: number): number {
  const meta = getSemesterChapterMeta(month);
  if (meta) return meta.phaseIds[week - 1] ?? meta.phaseIds[0];
  return 8;
}

function businessMonthTip(
  businessId: BusinessId,
  month: number,
  week: number,
  title: string,
  phaseId: number
): string | undefined {
  const special = resolveSpecialDayKey(title);
  if (special?.startsWith('legal') && month === 1) return formatLegalGuideTip(businessId);
  if (special?.startsWith('exit')) {
    return formatExitGuideTip(businessId) ?? getBusinessSemesterTip(businessId, month, week, title, phaseId);
  }
  return getBusinessSemesterTip(businessId, month, week, title, phaseId);
}

function buildTasksForDay(
  businessId: BusinessId,
  month: number,
  dayInMonth: number,
  title: string,
  objective: string,
  week: number
): string[] {
  const phaseId = phaseForWeek(month, week);
  return buildSemesterDayTasks(businessId, month, dayInMonth, title, objective, phaseId);
}

function dayTip(
  businessId: BusinessId,
  month: number,
  week: number,
  title: string,
  phaseId: number
): string | undefined {
  return businessMonthTip(businessId, month, week, title, phaseId);
}

export function buildMonthRoadmapDays(
  month: number,
  businessId: BusinessId
): RoadmapDay[] {
  const theme = getMonthTheme(month);

  if (process.env.NODE_ENV === 'development' && theme.dayTitles.length !== 30) {
    console.warn(
      `[roadmap] Chapitre ${month} : ${theme.dayTitles.length} titres (attendu 30). Vérifie SEMESTER_MONTH_THEMES.`
    );
  }

  return Array.from({ length: 30 }, (_, index) => {
    const dayInMonth = index + 1;
    const week = weekForDayInMonth(dayInMonth);
    const phaseId = phaseForWeek(month, week);
    const title = resolveBusinessDayTitle(
      businessId,
      theme.dayTitles[index] ?? `Jour ${dayInMonth}`
    );
    const objective = resolveBusinessWeekObjective(
      businessId,
      month,
      week,
      weekObjective(theme, week)
    );

    return {
      day: dayInMonth,
      month,
      dayInMonth,
      week,
      weekLabel: theme.weekLabels[week - 1],
      phaseId,
      phaseName: phaseName(phaseId),
      title,
      objective,
      tasks: withoutFocusBlockTasks(
        buildTasksForDay(businessId, month, dayInMonth, title, objective, week)
      ),
      tip: dayTip(businessId, month, week, title, phaseId),
    };
  });
}

export function getMonthLabel(month: number): string {
  return getMonthTheme(month).label;
}

/** @deprecated Utiliser SEMESTER_MONTH_THEMES */
export const EXTENDED_MONTH_THEMES = SEMESTER_MONTH_THEMES;
