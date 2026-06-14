import { getBusinessPhaseHint } from '@/lib/coach/journey';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import { getBusinessSemesterTaskOverlay } from '@/lib/quiz/roadmap-business-overlays';
import {
  buildDenseDailyTasks,
  buildLegalExitTasks,
  resolveSpecialDayKey,
} from '@/lib/quiz/roadmap-legal-exit';

const TASK_BANK = [
  'Bloquez 45 min focus. Téléphone en silencieux.',
  'Notez le résultat mesurable attendu avant de commencer.',
  'Documentez ce qui a marché pour réutiliser demain.',
  'Partagez un blocage au coach IA si vous êtes coincé.',
] as const;

/** Tâches explicites pour les jours à titre fixe (mois 2–6). */
const TITLE_TASKS: Record<string, string[]> = {
  'Audit du premier mois': [
    'Listez tout ce que vous avez lancé (page, offre, contacts, ventes)',
    'Classez chaque action : à garder / à améliorer / à abandonner',
    'Notez votre KPI #1 du mois 1 (ventes, essais, RDV…)',
  ],
  'Ce qui a converti': [
    'Identifiez le canal ou message qui a généré le plus de réponses positives',
    'Recopiez le script ou contenu gagnant. Versionnez-le',
    'Planifiez 3 répétitions de cette action cette semaine',
  ],
  'Ce qui a bloqué': [
    'Listez les 3 freins principaux (peur, temps, offre, technique…)',
    'Pour chaque frein : 1 micro-action de contournement demain',
    'Demandez un retour externe sur le blocage #1',
  ],
  'Chiffre du pipeline': [
    'Comptez prospects chauds / tièdes / froids dans un tableau simple',
    'Estimez la valeur totale du pipeline sur 30 jours',
    'Identifiez les 5 dossiers à closer en priorité',
  ],
  'Relances personnalisées': [
    'Relancez 5 prospects tièdes avec un angle nouveau (cas, insight, offre)',
    'Personnalisez chaque message. Pas de copier-coller générique',
    'Planifiez relance J+7 pour ceux sans réponse',
  ],
  'Audit canal #1': [
    'Exportez ou notez les stats de votre meilleur canal (30 derniers jours)',
    'Calculez taux de réponse ou conversion approximatif',
    'Fixez un objectif chifré +20 % sur ce canal ce mois',
  ],
  '10 nouveaux messages': [
    'Envoyez 10 messages outbound qualifiés aujourd\'hui',
    'Variez accroche et CTA sur 2 versions',
    'Notez heure d\'envoi et taux de réponse en fin de journée',
  ],
  'Calculer marge par client / vente': [
    'Pour 3 clients ou ventes récentes : revenu − coûts directs = marge',
    'Identifiez la marge % moyenne',
    'Repérez 1 poste de coût à réduire sans dégrader la qualité',
  ],
  'Tableau de bord marge simple': [
    'Créez un Google Sheet : CA, coûts, marge par mois',
    'Ajoutez une formule marge % automatique',
    'Partagez-vous un rappel mensuel pour le mettre à jour',
  ],
  'Automatiser ou déléguer 1 tâche': [
    'Choisissez la tâche répétitive la plus chronophage',
    'Décidez : outil no-code, template ou freelance',
    'Mettez en place la version 1 aujourd\'hui. Pas la version parfaite',
  ],
  '5 retours clients récurrents': [
    'Contactez 5 clients fidèles. Appel 15 min ou message voice',
    'Posez : « Qu\'est-ce qui manque ? » et « Que recommanderiez-vous ? »',
    'Notez les demandes récurrentes non couvertes',
  ],
  'Calculer LTV simple': [
    'LTV ≈ panier moyen × fréquence d\'achat annuelle × durée relation (estimée)',
    'Comparez LTV à votre coût d\'acquisition approximatif',
    'Décidez si vous pouvez investir plus en acquisition',
  ],
  'Tableau de bord semestre (CA, marge)': [
    'Consolidez CA et marge mois 1 à 6 dans un seul document',
    'Visualisez la courbe. Tendance hausse, plat ou baisse ?',
    'Notez le mois le plus fort et le plus faible. Pourquoi',
  ],
  'Interview 2 clients satisfaits': [
    'Préparez 5 questions (pourquoi vous, moment clé, amélioration)',
    'Menez 2 entretiens de 20 min',
    'Extrayez 2 citations utilisables en preuve sociale',
  ],
  'Vision à 6 mois (1 phrase)': [
    'Rédigez : « Dans 6 mois, mon business sera… » (1 phrase)',
    'Vérifiez alignement avec vos chiffres actuels. Réaliste ?',
    'Affichez cette phrase là où vous travaillez chaque jour',
  ],
  '3 priorités stratégiques S2': [
    'Listez 10 idées. Gardez seulement 3 priorités pour le semestre 2',
    'Pour chaque priorité : 1 KPI et deadline trimestre',
    'Coupez explicitement ce qui n\'entre pas dans le top 3',
  ],
};

function tasksFromTitlePattern(title: string): string[] | null {
  const t = title.toLowerCase();

  if (t.startsWith('bilan')) {
    return [
      'Listez 1 victoire concrète de la période',
      'Identifiez 1 blocage ou friction à traiter',
      'Fixez la priorité #1 de la semaine (ou période) suivante',
    ];
  }
  if (t.includes('objectif mois') || t.includes('objectif ca')) {
    return [
      'Fixez un chiffre CA ou clients cible pour le mois',
      'Décomposez en objectif hebdomadaire',
      'Identifiez l\'action quotidienne qui soutient cet objectif',
    ];
  }
  if (t.includes('préparer le mois')) {
    return [
      'Relisez les bilans du mois écoulé',
      'Choisissez 3 actions non négociables pour le mois suivant',
      'Bloquez les créneaux récurrents dans l\'agenda',
    ];
  }
  if (t.includes('relance') || t.includes('script')) {
    return [
      'Rédigez ou améliorez votre script en 3 parties : accroche, valeur, CTA',
      'Testez sur 3 prospects aujourd\'hui',
      'Ajustez selon les réponses reçues',
    ];
  }
  if (t.includes('pipeline') || t.includes('prospects')) {
    return [
      'Mettez à jour statut de chaque prospect (chaud / tiède / froid)',
      'Supprimez les contacts morts. Focus sur le top 20 %',
      'Planifiez la prochaine action par prospect chaud',
    ];
  }
  if (t.includes('contenu') || t.includes('publier')) {
    return [
      'Produisez 1 contenu utile pour votre cible (post, email, vidéo courte)',
      'Incluez un CTA clair vers votre offre',
      'Republiez ou recyclez un contenu performant passé',
    ];
  }
  if (t.includes('partenaire') || t.includes('parrainage')) {
    return [
      'Identifiez 3 partenaires complémentaires (même audience, offre différente)',
      'Rédigez une proposition win-win en 5 lignes',
      'Envoyez 2 messages de prise de contact',
    ];
  }
  if (t.includes('process') || t.includes('checklist') || t.includes('template')) {
    return [
      'Documentez les étapes de A à Z pour une livraison type',
      'Créez une checklist réutilisable',
      'Testez la checklist sur la prochaine mission ou commande',
    ];
  }
  if (t.includes('pricing') || t.includes('prix') || t.includes('packaging')) {
    return [
      'Comparez votre prix à 2 alternatives marché',
      'Testez une variation (palier, bundle ou essai) sur 3 prospects',
      'Notez les objections prix et vos réponses',
    ];
  }
  if (t.includes('délégu') || t.includes('externalis')) {
    return [
      'Listez toutes vos tâches récurrentes (30 min)',
      'Cerclez celles qu\'un autre pourrait faire à 80 % de la qualité',
      'Rédigez une fiche brief pour la 1ère tâche à déléguer',
    ];
  }

  return null;
}

export function buildSemesterDayTasks(
  businessId: BusinessId,
  month: number,
  dayInMonth: number,
  title: string,
  objective: string,
  phaseId: number
): string[] {
  const special = resolveSpecialDayKey(title);
  if (special?.startsWith('exit')) {
    return buildLegalExitTasks(businessId, special);
  }

  const profile = businessProfiles[businessId];
  const phaseHint = getBusinessPhaseHint(businessId, phaseId);
  const week = dayInMonth <= 7 ? 1 : dayInMonth <= 14 ? 2 : dayInMonth <= 21 ? 3 : 4;

  const businessOverlay = getBusinessSemesterTaskOverlay(
    businessId,
    month,
    week,
    title
  );

  const exact = TITLE_TASKS[title];
  const patterned = tasksFromTitlePattern(title);
  const core =
    businessOverlay ??
    exact ??
    patterned ?? [
      `Concrétisez : ${title}`,
      `Objectif du jour : ${objective}`,
      `Définissez le livrable terminé en fin de journée (doc, message, chiffre…)`,
    ];

  const baseTasks = [
    ...core,
    businessOverlay
      ? `Reliez cette action à votre KPI ${profile.name} : ${phaseHint || 'progression mesurable cette semaine'}.`
      : phaseHint
        ? `Focus ${profile.name} (étape ${phaseId}/8) : ${phaseHint}`
        : `Reliez cette action à votre modèle ${profile.name}.`,
    dayInMonth % 7 === 0
      ? 'Bilan hebdo : 1 victoire, 1 blocage, 1 priorité semaine prochaine.'
      : TASK_BANK[dayInMonth % TASK_BANK.length],
  ];

  return buildDenseDailyTasks(businessId, month, dayInMonth, title, objective, baseTasks);
}
