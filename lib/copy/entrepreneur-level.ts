import type { DashboardSection } from '@/lib/dashboard/sections';
import { TOTAL_ROADMAP_DAYS } from '@/lib/quiz/roadmap-program';

export type CopyTier = 'beginner' | 'intermediate' | 'experienced';

export function resolveCopyTier(entrepreneurialLevel: string | null | undefined): CopyTier {
  const level = (entrepreneurialLevel ?? '').trim().toLowerCase();
  if (!level || level === 'non renseigné') return 'intermediate';
  if (level.includes('débutant') || level.includes('debutant')) return 'beginner';
  if (level.includes('expérimenté') || level.includes('experimente')) return 'experienced';
  return 'intermediate';
}

export function pickCopy<T>(
  tier: CopyTier,
  variants: { beginner: T; intermediate: T; experienced: T }
): T {
  return variants[tier];
}

/** Remplace le jargon courant pour les débutants (affichage UI uniquement). */
export function simplifyTerms(text: string, tier: CopyTier): string {
  if (tier !== 'beginner') return text;

  const replacements: [RegExp, string][] = [
    [/\bICP\b/gi, 'clients idéaux'],
    [/\bKPIs?\b/gi, 'indicateurs'],
    [/\bMVP\b/gi, 'première version simple'],
    [/\bLTV\b/gi, 'valeur client sur la durée'],
    [/\bROI\b/gi, 'retour sur investissement'],
    [/\bCTA\b/gi, 'bouton d\'action'],
    [/\bSaaS\b/g, 'logiciel en ligne'],
    [/\bupsell\b/gi, 'offre plus complète'],
    [/\bdata room\b/gi, 'dossier de documents'],
    [/\bAccelerator\b/g, 'formule avancée'],
    [/\bsynchronis(?:ée?|és?)\b/gi, 'alignée'],
    [/\broadmap\b/gi, 'plan d\'action'],
    [/\bBusiness Accelerator\b/g, 'formule avancée (79 €)'],
  ];

  let out = text;
  for (const [pattern, replacement] of replacements) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export type SectionCopy = { label: string; description: string };

export type SiteCopy = {
  tier: CopyTier;
  tierLabel: string;
  sections: Record<DashboardSection, SectionCopy>;
  overview: {
    kicker: string;
    subscribedTitle: (businessName: string) => string;
    subscribedSubtitle: string;
    freeSubtitle: string;
    statRoadmap: string;
    statCoach: string;
    statStreak: string;
    statPlan: string;
    quickAccessTitle: string;
    quickAccessSubtitle: string;
  };
  coach: {
    eyebrow: string;
    subtitleFallback: string;
    roadmapBadge: string;
    phaseBadge: (phase: number) => string;
    growthBadge: string;
    quickPrompts: { label: string; message: string }[];
    welcomeNoProfile: string;
    welcomeWithProfile: (businessName: string) => string;
  };
  roadmap: {
    compactEyebrow: (month: number, businessName: string) => string;
    compactHint: string;
    heroEyebrow: string;
    heroDescription: (businessName: string) => string;
    statMonths: string;
    statDays: string;
    statPhase: string;
    statAccessibleDays: string;
    statTotalDays: string;
  };
  resources: {
    lockedKicker: string;
    lockedTitle: string;
    lockedBody: string;
  };
  weekly: {
    lockedKicker: string;
    lockedTitle: string;
    lockedBody: string;
  };
  welcomeStrip: string;
};

export function getSiteCopy(tier: CopyTier): SiteCopy {
  return {
    tier,
    tierLabel: pickCopy(tier, {
      beginner: 'Débutant. Mots simples',
      intermediate: 'Intermédiaire',
      experienced: 'Expérimenté',
    }),
    sections: {
      overview: pickCopy(tier, {
        beginner: {
          label: 'Vue d\'ensemble',
          description: 'Où vous en êtes, en un coup d\'œil',
        },
        intermediate: {
          label: 'Vue d\'ensemble',
          description: 'Résumé de votre progression',
        },
        experienced: {
          label: 'Vue d\'ensemble',
          description: 'Pilotage de votre progression et priorités',
        },
      }),
      coach: pickCopy(tier, {
        beginner: {
          label: 'Coach IA',
          description: 'Posez vos questions, avancez pas à pas',
        },
        intermediate: {
          label: 'Coach IA',
          description: 'Construisez votre projet étape par étape',
        },
        experienced: {
          label: 'Coach IA',
          description: 'Co-pilote stratégique. 8 phases structurées',
        },
      }),
      parcours: pickCopy(tier, {
        beginner: {
          label: 'Mon plan',
          description: 'Une petite action par jour, sur 6 mois',
        },
        intermediate: {
          label: 'Parcours',
          description: 'Plan 180 jours calibré sur votre modèle',
        },
        experienced: {
          label: 'Parcours',
          description: 'Roadmap 180 j (6 chapitres). Sync coach 8 étapes',
        },
      }),
      profil: pickCopy(tier, {
        beginner: {
          label: 'Mon profil',
          description: 'Résultats du questionnaire',
        },
        intermediate: {
          label: 'Profil',
          description: 'Votre profil entrepreneurial',
        },
        experienced: {
          label: 'Profil',
          description: 'Profil, modèle business et compatibilités',
        },
      }),
      analyse: pickCopy(tier, {
        beginner: {
          label: 'Bilan hebdo',
          description: 'Résumé chaque semaine. Formule 79 €',
        },
        intermediate: {
          label: 'Analyse hebdo',
          description: 'Bilan approfondi. Formule avancée (79 €)',
        },
        experienced: {
          label: 'Analyse hebdo',
          description: 'Bilan stratégique IA. Business Accelerator',
        },
      }),
      ressources: pickCopy(tier, {
        beginner: {
          label: 'Modèles & aides',
          description: 'Textes prêts à copier. Formule 79 €',
        },
        intermediate: {
          label: 'Ressources',
          description: 'Templates & prompts. Formule avancée',
        },
        experienced: {
          label: 'Ressources',
          description: 'Bibliothèque templates, scripts & prompts IA',
        },
      }),
      activite: pickCopy(tier, {
        beginner: {
          label: 'Mon suivi',
          description: 'Messages coach, régularité et série',
        },
        intermediate: {
          label: 'Activité',
          description: 'Coach, parcours, ville et régularité',
        },
        experienced: {
          label: 'Activité',
          description: 'Analytics coach, parcours et momentum',
        },
      }),
      abonnement: pickCopy(tier, {
        beginner: {
          label: 'Abonnement',
          description: 'Votre formule et les tarifs',
        },
        intermediate: {
          label: 'Abonnement',
          description: 'Formule, facturation et changement de plan',
        },
        experienced: {
          label: 'Abonnement',
          description: 'Gestion formule, upgrade et facturation',
        },
      }),
      ville: pickCopy(tier, {
        beginner: {
          label: 'Ma ville',
          description: 'Votre avatar et votre progression visuelle',
        },
        intermediate: {
          label: 'Ma ville',
          description: 'Créez votre personnage et suivez votre empire',
        },
        experienced: {
          label: 'Ma ville',
          description: 'Districts, étapes business et streaks',
        },
      }),
      blocnotes: pickCopy(tier, {
        beginner: {
          label: 'Bloc-notes',
          description: 'Vos idées et notes sauvegardées',
        },
        intermediate: {
          label: 'Bloc-notes',
          description: 'Notes personnelles sauvegardées',
        },
        experienced: {
          label: 'Bloc-notes',
          description: 'Notes persistantes. Idées, contacts, décisions',
        },
      }),
      assistance: pickCopy(tier, {
        beginner: {
          label: 'Aide',
          description: 'Questions fréquentes et contact',
        },
        intermediate: {
          label: 'Assistance',
          description: 'Aide, guides et contact avec le créateur',
        },
        experienced: {
          label: 'Assistance',
          description: 'Support, FAQ et contact direct',
        },
      }),
    },
    overview: {
      kicker: pickCopy(tier, {
        beginner: 'Vue d\'ensemble',
        intermediate: 'Vue d\'ensemble',
        experienced: 'Vue d\'ensemble',
      }),
      subscribedTitle: (name) =>
        pickCopy(tier, {
          beginner: name,
          intermediate: name,
          experienced: name,
        }),
      subscribedSubtitle: pickCopy(tier, {
        beginner:
          'Avancez à votre rythme : une action par jour, des réponses simples du coach, et votre ville qui grandit avec vous.',
        intermediate:
          'Poursuivez votre parcours 180 jours et votre coaching IA au rythme de votre projet.',
        experienced:
          'Pilotage parcours 180 j, coaching 8 phases et indicateurs de régularité.',
      }),
      freeSubtitle: pickCopy(tier, {
        beginner:
          'Faites le questionnaire pour personnaliser votre espace. Le coach et le plan complet s\'activent avec l\'abonnement.',
        intermediate:
          'Complétez le quiz pour personnaliser votre parcours et votre coach.',
        experienced:
          'Complétez le profil quiz pour calibrer parcours, coach et recommandations.',
      }),
      statRoadmap: pickCopy(tier, {
        beginner: 'Plan',
        intermediate: 'Parcours',
        experienced: 'Roadmap',
      }),
      statCoach: pickCopy(tier, {
        beginner: 'Coach',
        intermediate: 'Coach IA',
        experienced: 'Coach',
      }),
      statStreak: pickCopy(tier, {
        beginner: 'Série',
        intermediate: 'Série',
        experienced: 'Streak',
      }),
      statPlan: pickCopy(tier, {
        beginner: 'Formule',
        intermediate: 'Formule',
        experienced: 'Plan',
      }),
      quickAccessTitle: pickCopy(tier, {
        beginner: 'Accès rapide',
        intermediate: 'Accès rapide',
        experienced: 'Raccourcis',
      }),
      quickAccessSubtitle: pickCopy(tier, {
        beginner: 'Tout en un clic, sans jargon',
        intermediate: 'Profil, outils et ressources en un clic',
        experienced: 'Sections clés de votre espace',
      }),
    },
    coach: {
      eyebrow: pickCopy(tier, {
        beginner: 'Votre aide au quotidien',
        intermediate: 'Assistant personnel',
        experienced: 'Co-pilote stratégique',
      }),
      subtitleFallback: pickCopy(tier, {
        beginner: 'Je vous guide pas à pas',
        intermediate: 'Accompagnement entrepreneurial',
        experienced: 'Exécution structurée. 8 phases',
      }),
      roadmapBadge: pickCopy(tier, {
        beginner: 'Plan. J',
        intermediate: 'Parcours. J',
        experienced: 'Roadmap. J',
      }),
      phaseBadge: (phase) =>
        pickCopy(tier, {
          beginner: `Étape ${phase} sur 8`,
          intermediate: `Étape ${phase}/8`,
          experienced: `Phase ${phase}/8`,
        }),
      growthBadge: pickCopy(tier, {
        beginner: 'Formule avancée',
        intermediate: 'Accelerator',
        experienced: 'Accelerator',
      }),
      quickPrompts: pickCopy(tier, {
        beginner: [
          { label: 'Continuer', message: 'On continue là où on s\'était arrêté, en simple s\'il te plaît' },
          { label: 'Où j\'en suis', message: 'Où j\'en suis dans mon plan ? Quelle est la prochaine petite action ?' },
          { label: 'Mon site', message: 'Je veux une page web simple. Guide-moi pas à pas' },
        ],
        intermediate: [
          { label: 'Continuer', message: 'On continue là où on s\'était arrêté' },
          { label: 'Mon parcours', message: 'Où j\'en suis dans mon parcours ? Quelle est la prochaine étape ?' },
          { label: 'Créer mon site', message: 'Quel outil pour mon site ? Guide-moi étape par étape' },
        ],
        experienced: [
          { label: 'Reprendre', message: 'Reprends le fil. Où en sommes-nous et quelle est la prochaine micro-étape ?' },
          { label: 'Parcours', message: 'État du parcours 180j vs phase coach. Priorité du jour ?' },
          { label: 'Go-to-market', message: 'Canal d\'acquisition prioritaire cette semaine. Script et KPI' },
        ],
      }),
      welcomeNoProfile: pickCopy(tier, {
        beginner: `Bonjour ! Je vous aide à lancer votre projet, une petite étape à la fois.

Faites le questionnaire pour un accompagnement adapté, ou décrivez votre idée ci-dessous.`,
        intermediate: `Bonjour ! Je vous accompagne de l'idée jusqu'aux premiers clients, une étape à la fois.

Complétez le quiz pour un parcours personnalisé, ou décrivez votre projet ci-dessous.`,
        experienced: `Bonjour. Co-pilotage structuré de l'idée à l'exécution. Livrables concrets à chaque échange.

Complétez le profil quiz ou décrivez directement votre contexte et vos contraintes.`,
      }),
      welcomeWithProfile: (businessName) =>
        pickCopy(tier, {
          beginner: `Bonjour ! On avance ensemble sur votre ${businessName}. Je vous explique tout simplement.`,
          intermediate: `Bonjour ! On construit votre ${businessName} ensemble. Je rédige, vous validez.`,
          experienced: `Bonjour. Objectif : exécution sur ${businessName}. Livrables actionnables, une micro-étape à la fois.`,
        }),
    },
    roadmap: {
      compactEyebrow: (month, businessName) =>
        pickCopy(tier, {
          beginner: `Mois ${month}. ${businessName}`,
          intermediate: `Mois ${month}. ${businessName}`,
          experienced: `Ch. ${month}. ${businessName}`,
        }),
      compactHint: pickCopy(tier, {
        beginner: 'Votre prochaine petite action du jour.',
        intermediate: 'Prochaine étape de votre parcours personnalisé.',
        experienced: 'Prochaine micro-étape du parcours calibré.',
      }),
      heroEyebrow: pickCopy(tier, {
        beginner: 'Votre plan sur 6 mois',
        intermediate: 'Parcours semestriel',
        experienced: 'Roadmap semestrielle',
      }),
      heroDescription: (businessName) =>
        pickCopy(tier, {
          beginner: `6 mois pour lancer ${businessName} : une action par jour, expliquée simplement. Mois 1 = bases. Mois 2–3 = trouver des clients. Mois 4–6 = stabiliser et grandir.`,
          intermediate: `6 mois. 180 jours. Parcours structuré pour ${businessName}. Mois 1 : lancement. Mois 2–3 : clients. Mois 4–6 : rentabilité et vision.`,
          experienced: `${TOTAL_ROADMAP_DAYS} jours. 6 chapitres pour ${businessName}. M1 lancement (8 phases coach). M2–3 acquisition. M4–5 rentabilité & actifs. M6 bilan.`,
        }),
      statMonths: pickCopy(tier, {
        beginner: 'mois actifs',
        intermediate: 'mois actifs',
        experienced: 'chapitres',
      }),
      statDays: pickCopy(tier, {
        beginner: 'jours faits',
        intermediate: 'jours cochés',
        experienced: 'jours validés',
      }),
      statPhase: pickCopy(tier, {
        beginner: 'étape coach',
        intermediate: 'phase coach',
        experienced: 'phase',
      }),
      statAccessibleDays: pickCopy(tier, {
        beginner: 'jours ouverts',
        intermediate: 'jours accessibles',
        experienced: 'jours unlocked',
      }),
      statTotalDays: pickCopy(tier, {
        beginner: 'plan complet',
        intermediate: 'jours au total',
        experienced: 'total roadmap',
      }),
    },
    resources: {
      lockedKicker: pickCopy(tier, {
        beginner: 'Réservé formule 79 €',
        intermediate: 'Exclusif formule avancée',
        experienced: 'Business Accelerator',
      }),
      lockedTitle: pickCopy(tier, {
        beginner: 'Modèles et textes prêts à l\'emploi',
        intermediate: 'Bibliothèque de ressources',
        experienced: 'Bibliothèque de ressources',
      }),
      lockedBody: pickCopy(tier, {
        beginner:
          'Votre formule actuelle inclut déjà le coach et le plan jour par jour. Les modèles complets (emails, pages web, scripts) sont dans la formule à 79 €/mois.',
        intermediate:
          'Premium inclut coach et parcours 180 j. La bibliothèque complète est réservée à Business Accelerator (79 €/mois).',
        experienced:
          'Premium couvre coach + roadmap 180j. Bibliothèque complète (22+ assets). Upgrade Accelerator.',
      }),
    },
    weekly: {
      lockedKicker: pickCopy(tier, {
        beginner: 'Formule 79 €/mois',
        intermediate: 'Exclusif 79 €/mois',
        experienced: 'Business Accelerator',
      }),
      lockedTitle: pickCopy(tier, {
        beginner: 'Votre bilan de la semaine',
        intermediate: 'Débloquez l\'analyse hebdomadaire',
        experienced: 'Analyse hebdomadaire approfondie',
      }),
      lockedBody: pickCopy(tier, {
        beginner:
          'Chaque semaine, un résumé clair de ce que vous avez fait et quoi faire ensuite. Disponible avec la formule à 79 €/mois.',
        intermediate:
          'Votre formule Premium inclut coach et parcours. L\'analyse approfondie est réservée au plan Business Accelerator.',
        experienced:
          'Premium = coach + roadmap. L\'analyse hebdo stratégique (sync parcours/coach) requiert Accelerator.',
      }),
    },
    welcomeStrip: pickCopy(tier, {
      beginner: 'Bienvenue ! Votre espace est prêt. Avancez une étape à la fois.',
      intermediate: 'Bienvenue dans votre espace premium.',
      experienced: 'Espace premium activé. Bonne exécution.',
    }),
  };
}

export function getCoachLanguageBlock(tier: CopyTier): string {
  return pickCopy(tier, {
    beginner: `## Langage (niveau débutant)
- Vocabulaire SIMPLE : pas de jargon (ICP, KPI, MVP, CTA, LTV, SaaS…) sans explication immédiate entre parenthèses.
- Phrases courtes. Une idée à la fois. Analogies du quotidien.
- Définis tout terme business la première fois (« clients idéaux », « page d'accueil », « prix »).
- Rassure et décompose : « d'abord… ensuite… enfin… »`,
    intermediate: `## Langage (niveau intermédiaire)
- Clair et structuré. Jargon acceptable s'il est expliqué brièvement.
- Équilibre entre pédagogie et efficacité.`,
    experienced: `## Langage (niveau expérimenté)
- Direct, dense, orienté exécution. Jargon business accepté.
- Moins de rappels basiques. Focus priorités, trade-offs et livrables.`,
  });
}

export function getPhaseDisplayName(phaseKey: string, tier: CopyTier): string | null {
  const names: Record<string, { beginner: string; intermediate: string; experienced: string }> = {
    vision: {
      beginner: 'Clarifier votre idée',
      intermediate: 'Vision & problème',
      experienced: 'Vision & problème',
    },
    icp: {
      beginner: 'Qui sont vos clients',
      intermediate: 'Client idéal',
      experienced: 'ICP & segmentation',
    },
    offer: {
      beginner: 'Votre offre',
      intermediate: 'Offre & promesse',
      experienced: 'Offre & promesse',
    },
    positioning: {
      beginner: 'Comment vous présenter',
      intermediate: 'Positionnement & pitch',
      experienced: 'Positionnement & pitch',
    },
    presence: {
      beginner: 'Votre page web',
      intermediate: 'Supports & présence en ligne',
      experienced: 'Présence & distribution',
    },
    pricing: {
      beginner: 'Fixer vos prix',
      intermediate: 'Pricing & modèle économique',
      experienced: 'Pricing & unit economics',
    },
    launch: {
      beginner: 'Trouver vos premiers clients',
      intermediate: 'Lancement & acquisition',
      experienced: 'Go-to-market',
    },
    clients: {
      beginner: 'Améliorer avec les retours',
      intermediate: 'Premiers clients & itération',
      experienced: 'Delivery & itération',
    },
  };
  const entry = names[phaseKey];
  if (!entry) return null;
  return entry[tier];
}
