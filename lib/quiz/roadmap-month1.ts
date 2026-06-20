import { COACHING_PHASES, getBusinessPhaseHint } from '@/lib/coach/journey';
import { getSiteToolRecommendation } from '@/lib/coach/tools';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import type { MarketSegment } from '@/lib/quiz/market-segment';
import { businessUsesMarketSegment } from '@/lib/quiz/market-segment';
import {
  applyMarketSegmentToObjective,
  applyMarketSegmentToTasks,
} from '@/lib/quiz/market-segment-tasks';
import {
  buildMonth1TasksFromBlueprint,
} from '@/lib/quiz/month1-task-overlays';
import {
  buildDenseDailyTasks,
  formatExitGuideTip,
  formatLegalGuideTip,
  resolveSpecialDayKey,
} from '@/lib/quiz/roadmap-legal-exit';

export const MONTH1_WEEK_LABELS: Record<number, string> = {
  1: 'Étape 1-2. Vision & client idéal',
  2: 'Étape 3-4. Offre & positionnement',
  3: 'Étape 5-6. Présence en ligne & pricing',
  4: 'Étape 7-8. Lancement & premiers clients',
};

export interface Month1DayBlueprint {
  day: number;
  phaseId: number;
  title: string;
  objective: string;
  baseTasks: string[];
  /** Tâches complètes par modèle. Prioritaire sur baseTasks + focus */
  businessTasks?: Partial<Record<BusinessId, string[]>>;
  /** 3e tâche contextualisée au modèle business */
  businessFocus: Record<BusinessId, string>;
}

function weekForDay(day: number): number {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

function phaseName(phaseId: number): string {
  return COACHING_PHASES.find((p) => p.id === phaseId)?.name ?? '';
}

/** Contenu jour 15-18 : présence en ligne avec outil recommandé */
function presenceTasks(businessId: BusinessId, step: 'choose' | 'hero' | 'solution' | 'publish'): string[] {
  const tool = getSiteToolRecommendation(businessId);
  const hint = getBusinessPhaseHint(businessId, 5);

  if (businessId === 'ofm') {
    switch (step) {
      case 'choose':
        return [
          `Compare ${tool.primary} (${tool.url}) pour ta page agence OnlyFans Management`,
          `Crée le compte sur ${tool.primary}. Coût : ${tool.cost}`,
          hint || 'Liste sections : Mission, Services OFM, Charte modèle OnlyFans, Process, Contact',
        ];
      case 'hero':
        return [
          'Rédige le hero agence OFM : promesse management pro + transparence commission',
          'Le modèle OnlyFans doit comprendre tes services en 10 secondes',
          'CTA : candidature modèle ou call découverte (ton professionnel, discret)',
        ];
      case 'solution':
        return [
          'Détaille services OFM : chatting, acquisition abonnés, ops contenu OnlyFans',
          'Affiche charte éthique et commission % sur revenus OnlyFans',
          hint ? `Structure page : ${hint.split('.')[0]?.trim()}` : 'Relis. Rassurant pour un modèle sceptique du secteur ?',
        ];
      case 'publish':
        return [
          `Intègre les textes dans ${tool.primary}`,
          'Vérifie mobile + formulaire contact modèle OnlyFans',
          'Partage à 2 modèles de ta niche pour feedback (anonyme si besoin)',
        ];
    }
  }

  switch (step) {
    case 'choose':
      return [
        `Compare ${tool.primary} (${tool.url}) avec ${tool.alternatives.split(' ou ')[0] ?? 'une alternative'}`,
        `Crée le compte sur ${tool.primary}. Coût : ${tool.cost}`,
        hint || `Liste les sections de ta page ${businessProfiles[businessId].name}`,
      ];
    case 'hero':
      return [
        'Rédige le bloc hero : accroche + sous-titre + CTA principal',
        'Le visiteur doit comprendre ta promesse en 10 secondes',
        `Adapte le hero au parcours d'achat typique ${businessProfiles[businessId].name}`,
      ];
    case 'solution':
      return [
        'Détaille ton solution, bénéfices et preuves (process, features ou cas)',
        'Place un appel à l\'action clair (RDV, essai, achat, inscription)',
        hint ? `Respecte la structure : ${hint.split('.')[0]?.trim()}` : 'Relis à voix haute. Clair pour un novice ?',
      ];
    case 'publish':
      return [
        `Intègre les textes dans ${tool.primary}`,
        'Vérifie affichage mobile + lien contact ou paiement',
        'Partage la page à 2 personnes de ton cible pour feedback rapide',
      ];
  }
}

/** Contenu jour 19-20 : pricing par modèle */
function pricingTasks(businessId: BusinessId, step: 'grid' | 'argument'): string[] {
  const hint = getBusinessPhaseHint(businessId, 6);
  if (step === 'grid') {
    return [
      'Propose 2 à 3 formules nommées avec prix chiffrés',
      'Justifie chaque palier par la valeur délivrée',
      hint || `Définis une offre d'entrée à faible friction pour ${businessProfiles[businessId].name}`,
    ];
  }
  return [
    'Calcule le ROI ou le gain client (temps, CA, risque évité)',
    'Prépare une réponse à « C\'est trop cher »',
    hint ? `Argumentaire ${businessProfiles[businessId].name} : ${hint}` : 'Décide d\'une politique de remise. Ou non. Et pourquoi',
  ];
}

export const MONTH1_DAY_BLUEPRINTS: Month1DayBlueprint[] = [
  {
    day: 1,
    phaseId: 1,
    title: 'Clarifier le problème',
    objective: 'Formuler le problème client que ton modèle résout.',
    baseTasks: [
      'Note 3 frustrations concrètes de ton client cible',
      'Rédige « Mon client galère parce que… »',
      'Vérifie que le problème est fréquent et payant',
    ],
    businessFocus: {
      saas: 'Précise si le problème touche plutôt une entreprise (B2B) ou un particulier (B2C).',
      freelance: 'Identifie 3 situations où un client a besoin de ton expertise immédiatement.',
      ecommerce: 'Décris la frustration produit ou lifestyle que ton marque adresse.',
      agency: 'Cible un problème récurrent chez tes clients idéaux (visibilité, conversion, recrutement…).',
      marketplace: 'Formule le problème des deux côtés : offreurs et demandeurs.',
      impact: 'Lie le problème social à un besoin concret que quelqu\'un paierait pour résoudre.',
      consulting: 'Nomme le problème business que ton expertise résout (CA, ops, stratégie…).',
      content: 'Décris le manque d\'information, d\'inspiration ou de compétence de ton audience.',
      ofm: 'Formule le problème modèle OnlyFans : croissance abonnés, organisation (chatting, planning contenu), monétisation PPV/tips.',
    },
  },
  {
    day: 2,
    phaseId: 1,
    title: 'Définir la transformation',
    objective: 'Décrire le résultat promis après ton solution.',
    baseTasks: [
      'Écris « Après mon offre, mon client… »',
      'Liste 3 bénéfices mesurables (temps, argent, sérénité)',
      'Compare avec une solution existante. Quelle différence ?',
    ],
    businessFocus: {
      saas: 'Promets un résultat mesurable : gain de temps, revenus ou réduction d\'erreurs.',
      freelance: 'Quantifie le résultat livré (livraison, CA, image) en fin de mission.',
      ecommerce: 'Décris la transformation émotionnelle + fonctionnelle après l\'achat.',
      agency: 'Promets un résultat projet clair (site live, leads, recrutement validé…).',
      marketplace: 'Décris la valeur créée pour chaque côté de la plateforme.',
      impact: 'Chiffre l\'impact attendu (bénéficiaires, CO₂, inclusion…) + bénéfice client.',
      consulting: 'Promets une décision ou un KPI amélioré en fin de mission.',
      content: 'Décris ce que ton audience saura, fera ou ressentira après t\'avoir suivie.',
      ofm: 'Promets un résultat modèle OnlyFans : croissance abonnés/revenus, régularité contenu, ops chatting structurées.',
    },
  },
  {
    day: 3,
    phaseId: 2,
    title: 'Hypothèse de marché',
    objective: 'Cadrer le segment prioritaire pour les 30 prochains jours.',
    baseTasks: [
      'Choisis un segment précis (secteur, taille, situation)',
      'Note où ce segment se trouve en ligne et hors ligne',
      'Définis un critère pour reconnaître un bon prospect',
    ],
    businessFocus: {
      saas: 'Choisis B2B ou B2C pour la v1. Un seul segment, une seule géographie.',
      freelance: 'Cible un secteur + taille d\'entreprise où ton TJM se justifie.',
      ecommerce: 'Définis niche, persona acheteur et canal principal (Instagram, SEO, ads…).',
      agency: 'Spécialise secteur + type de prestation (web, ads, RH…) pour ce sprint.',
      marketplace: 'Décide quel côté lancer en premier (offre ou demande) et pourquoi.',
      impact: 'Identifie qui paie (client, donateur, institution) et qui bénéficie.',
      consulting: 'Cible secteur + taille entreprise + enjeu (croissance, pivot, crise).',
      content: 'Définis niche d\'audience, format principal et plateforme #1.',
      ofm: 'Cible un type de modèles OnlyFans (niche, niveau revenus, objectifs) alignés avec ton charte OFM.',
    },
  },
  {
    day: 4,
    phaseId: 2,
    title: 'Persona & contexte d\'achat',
    objective: 'Donner un visage à ton client idéal.',
    baseTasks: [
      'Nomme ton persona et décris son quotidien',
      'Liste ses objections avant d\'acheter',
      'Identifie le déclencheur qui le pousse à agir maintenant',
    ],
    businessFocus: {
      saas: 'Décris qui signe le budget (CEO, ops, particulier) et son cycle d\'achat.',
      freelance: 'Précise qui mandate la mission (dirigeant, marketing, RH) et pourquoi maintenant.',
      ecommerce: 'Décris le moment d\'achat (impulsion, cadeau, besoin récurrent).',
      agency: 'Identifie le décideur projet et les freins internes (budget, timing, priorité).',
      marketplace: 'Crée un persona pour chaque côté si tu cibles les deux. Ou approfondis le côté #1.',
      impact: 'Lie les valeurs du persona à ta mission. Pourquoi il te choisirait.',
      consulting: 'Décris le contexte entreprise (croissance, crise, pivot) qui déclenche l\'appel.',
      content: 'Décris les habitudes de consommation contenu de ton persona.',
      ofm: 'Décris le profil modèle OnlyFans : abonnés actuels, revenus $/mois, blocages (acquisition, chatting, contenu).',
    },
  },
  {
    day: 5,
    phaseId: 2,
    title: 'Forme juridique. Anticiper (appliquer plus tard)',
    objective: 'Repérer le statut idéal pour ton modèle. Sans immatriculer tant que l\'offre n\'est pas validée.',
    baseTasks: [
      'Liste les statuts possibles pour ton activité (micro, SASU, EURL…). Lecture seule',
      'Note 2–3 signaux « business monté » qui déclencheront la formalisation (1er client payant, CA récurrent…)',
      'Fixe le statut cible à appliquer plus tard. Pas d\'action admin aujourd\'hui',
    ],
    businessFocus: {
      saas: 'Statut cible probable : SASU une fois MRR ou clients B2B. D\'abord valide le produit.',
      freelance: 'Micro ou portage en test ; EURL/SASU quand missions récurrentes et TJM confirmé.',
      ecommerce: 'Micro pour tester ; société quand stock, TVA ou volume le justifient.',
      agency: 'Société dès sous-traitance ou contrats cadre. Pas avant la première mission signée.',
      marketplace: 'Anticipe SASU. Formalise quand les premières transactions sont récurrentes.',
      impact: 'Clarifie le statut cible (ASS, SAS…) une fois le modèle économique prouvé.',
      consulting: 'Micro en validation ; SASU/EURL quand grands comptes ou missions longues.',
      content: 'Micro pour premiers revenus ; SASU si produits, équipe ou revente média envisagée.',
      ofm: 'Micro en phase test OFM ; SASU si plusieurs modèles OnlyFans et équipe chatters.',
    },
  },
  {
    day: 6,
    phaseId: 2,
    title: 'Échanges terrain',
    objective: 'Valider tes hypothèses avec de vraies personnes.',
    baseTasks: [
      'Contacte 3 personnes du segment cible',
      'Pose 5 questions ouvertes (problème, solutions essayées, budget)',
      'Note les mots exacts utilisés par tes interlocuteurs',
    ],
    businessFocus: {
      saas: 'Interroge des utilisateurs potentiels sur leur workflow actuel et budget logiciel.',
      freelance: 'Parle à 3 prospects sur leur dernier projet externalisé ou non.',
      ecommerce: 'Sonde des acheteurs sur leur marque actuelle et critères d\'achat.',
      agency: 'Échange avec des dirigeants sur leurs derniers projets confiés ou ratés.',
      marketplace: 'Interview des offreurs OU des demandeurs selon ton côté prioritaire.',
      impact: 'Parle à bénéficiaires et payeurs. Valide que les deux existent.',
      consulting: 'Mène 3 entretiens diagnostic light (15 min) avec ton réseau.',
      content: 'Sonde ton audience cible sur le contenu qu\'ils consomment et paieraient.',
      ofm: 'Échange avec 3 modèles OnlyFans sur leurs blocages business (sans pitch agressif ni promesse de $).',
    },
  },
  {
    day: 7,
    phaseId: 2,
    title: 'Synthèse terrain & bilan semaine 1',
    objective: 'Ajuster le cap et verrouiller la semaine 2.',
    baseTasks: [
      'Résume les 3 insights les plus importants des échanges',
      'Relis problème, promesse et persona. Cohérence ?',
      'Fixe 1 objectif mesurable pour la semaine 2',
    ],
    businessFocus: {
      saas: 'Objectif S2 : offre + landing structure validées par 1 prospect.',
      freelance: 'Objectif S2 : offre forfaitaire + pitch prêt à envoyer.',
      ecommerce: 'Objectif S2 : produit pilote + page produit rédigée.',
      agency: 'Objectif S2 : offre signature + cas type documenté.',
      marketplace: 'Objectif S2 : proposition de valeur 2 faces + liste early adopters.',
      impact: 'Objectif S2 : offre + preuve d\'impact chiffrée sur la page.',
      consulting: 'Objectif S2 : offre diagnostic + pitch 30 secondes.',
      content: 'Objectif S2 : hub créateur + 1er lead magnet défini.',
      ofm: 'Objectif S2 : offre OnlyFans Management + charte modèle OFM rédigée.',
    },
  },
  {
    day: 8,
    phaseId: 3,
    title: 'Structurer l\'offre',
    objective: 'Définir ce que tu vendez concrètement.',
    baseTasks: [
      'Nomme ton offre en une ligne',
      'Liste livrables, format et durée',
      'Précise ce qui est inclus / exclu',
    ],
    businessTasks: {
      saas: [
        'Nomme ton offre (ex. « Essai 14j. [Fonction core] »)',
        'Liste 3 fonctionnalités v1 + ce qui est hors scope',
        'Définis format : abonnement mensuel, essai ou freemium',
      ],
      freelance: [
        'Crée un forfait signature : résultat + durée + livrables',
        'Fixe une fourchette TJM ou forfait cible',
        'Liste ce qui est inclus (révisions, support) et exclu',
      ],
      ecommerce: [
        'Sélectionne ton produit pilote (1 SKU ou collection mini)',
        'Définis angle marque + promesse produit',
        'Précise livraison, retours et garantie',
      ],
      agency: [
        'Définis une prestation phare avec process en 4 étapes',
        'Liste livrables par phase (audit, production, livraison, suivi)',
        'Précise durée typique et prérequis client',
      ],
      marketplace: [
        'Décris la transaction type sur ton plateforme',
        'Liste ce que tu facilites (matching, paiement, confiance)',
        'Définis la promesse pour le côté que tu lances en premier',
      ],
      impact: [
        'Structure offre : produit/service + impact associé mesurable',
        'Précise qui paie et comment l\'impact est suivi',
        'Liste livrables concrets pour le client',
      ],
      consulting: [
        'Structure un diagnostic payant comme porte d\'entrée (durée, livrable)',
        'Définis mission projet #2 si diagnostic converti',
        'Liste méthode en 3 phases avec résultats attendus',
      ],
      content: [
        'Définis ton 1er produit monétisable (formation, template, sponsoring…)',
        'Précise format, prix cible et canal de vente',
        'Liste ce que l\'acheteur reçoit concrètement',
      ],
      ofm: [
        'Formalise offre OnlyFans Management : chatting, acquisition abonnés, ops contenu OnlyFans',
        'Affiche commission % sur revenus OnlyFans + part modèle en premier',
        'Liste charte OFM : consentement, limites contenu, confidentialité, clause sortie',
      ],
    },
    businessFocus: {
      saas: 'Aligne l\'offre sur un job-to-be-done unique. Pas 10 features.',
      freelance: 'Un forfait clair vaut mieux que « je fais tout ».',
      ecommerce: 'Mieux vaut une gamme serrée qu\'un catalogue fourre-tout.',
      agency: 'Une prestation phare facilite la vente et la delivery.',
      marketplace: 'Commence par une transaction simple, pas toute la plateforme.',
      impact: 'L\'impact doit être mesurable. Pas seulement inspirant.',
      consulting: 'Le diagnostic payant filtre les bons clients.',
      content: 'Monétise tôt. Même un petit produit valide la demande.',
      ofm: 'Le modèle OnlyFans reste décisionnaire sur le contenu. Tu structures l\'ops et la croissance.',
    },
  },
  {
    day: 9,
    phaseId: 3,
    title: 'Différenciation',
    objective: 'Expliquer pourquoi toi plutôt qu\'une alternative.',
    baseTasks: [
      'Liste 3 différenciateurs honnêtes',
      'Transforme chacun en bénéfice client',
      'Prépare une réponse à « Pourquoi pas un concurrent ? »',
    ],
    businessFocus: {
      saas: 'Différencie-toi sur niche, UX, intégration ou pricing. Pas « on fait pareil ».',
      freelance: 'Mets en avant spécialisation, méthode ou garantie résultat.',
      ecommerce: 'Différenciation = histoire marque + qualité perçue + communauté.',
      agency: 'Spécialisation secteur + process propriétaire + preuves cas clients.',
      marketplace: 'Confiance, curation ou niche géographique. Pas « un Airbnb de plus ».',
      impact: 'Transparence impact + qualité produit. Les deux comptent.',
      consulting: 'Expertise pointue + méthode éprouvée + réseau sectoriel.',
      content: 'Voix unique + format signature + preuve d\'audience engagée.',
      ofm: 'Professionnalisme agence OFM, charte éthique et résultats mesurables vs agences opaques du secteur.',
    },
  },
  {
    day: 10,
    phaseId: 4,
    title: 'Pitch & accroche',
    objective: 'Rendre ton message mémorable en 30 secondes.',
    baseTasks: [
      'Rédige un pitch oral de 30 secondes',
      'Crée une accroche type headline (site, LinkedIn, bio)',
      'Ajoute 3 bullets bénéfices client',
    ],
    businessFocus: {
      saas: 'Pitch : problème → solution → essai/démo. Pas une liste de features.',
      freelance: 'Headline = résultat client, pas ton titre (« J\'aide X à Y en Z jours »).',
      ecommerce: 'Accroche = promesse marque + bénéfice produit star.',
      agency: 'Pitch = niche + résultat projet + preuve sociale.',
      marketplace: 'Deux accroches si 2 faces. Ou une accroche pour ton côté #1.',
      impact: 'Mission en 1 phrase + bénéfice client concret.',
      consulting: 'Pitch = problème CEO + méthode + résultat chiffré type.',
      content: 'Bio 2 lignes + promesse audience + CTA principal.',
      ofm: 'Pitch OFM = management pro OnlyFans + transparence commission + croissance abonnés/revenus.',
    },
  },
  {
    day: 11,
    phaseId: 4,
    title: 'Preuves & crédibilité',
    objective: 'Rassurer avant même la première vente.',
    baseTasks: [
      'Liste preuves disponibles (expérience, démo, cas d\'usage)',
      'Rédige 2 mini cas ou scénarios « avant / après »',
      'Prépare une FAQ des 5 objections fréquentes',
    ],
    businessFocus: {
      saas: 'Démo, screenshots, témoignage beta ou métriques d\'usage si disponibles.',
      freelance: 'Portfolio, recommandations LinkedIn, étude de cas même fictive structurée.',
      ecommerce: 'Photos pro, avis, garantie retour, storytelling fondateur.',
      agency: 'Cas type détaillé, logos clients, process documenté.',
      marketplace: 'Early adopters, waitlist, partenaires. Preuve de traction.',
      impact: 'Impact chiffré, labels, partenaires mission, transparence.',
      consulting: 'Références secteur, méthodologie, contenus d\'expertise.',
      content: 'Stats audience, engagement, extraits contenu à forte valeur.',
      ofm: 'Charte publique OFM, process onboarding modèle OnlyFans, témoignage (anonymisé si besoin).',
    },
  },
  {
    day: 12,
    phaseId: 4,
    title: 'Supports de vente',
    objective: 'Préparer les documents pour convaincre.',
    baseTasks: [
      'Crée un one-pager ou deck court (5 slides max)',
      'Rédige un message d\'introduction personnalisable',
      'Prépare un script pour un appel de 15 minutes',
    ],
    businessFocus: {
      saas: 'Deck : problème, solution, démo, pricing, CTA essai.',
      freelance: 'One-pager : offre, process, tarifs, témoignage, CTA RDV.',
      ecommerce: 'Fiche produit complète + visuels + argumentaire vente.',
      agency: 'Deck : niche, méthode 4 étapes, cas type, CTA audit gratuit.',
      marketplace: 'Deck 2 faces ou one-pager selon côté prioritaire + waitlist.',
      impact: 'One-pager mission + offre + impact chiffré + CTA.',
      consulting: 'Deck diagnostic : enjeu, méthode, livrables, CTA 45 min.',
      content: 'Media kit ou page offres avec liens, stats et CTA.',
      ofm: 'Deck agence OFM : services (chatting, acquisition), charte, process, commission transparente.',
    },
  },
  {
    day: 13,
    phaseId: 4,
    title: 'Choix des canaux',
    objective: 'Sélectionner 2 canaux d\'acquisition réalistes.',
    baseTasks: [
      'Liste 5 canaux possibles pour ton modèle',
      'Note effort / coût / délai pour chacun',
      'Retiens 2 canaux à tester en semaine 4',
    ],
    businessFocus: {
      saas: 'Priorise LinkedIn outbound, SEO niche, Product Hunt ou communautés pro.',
      freelance: 'Réseau, LinkedIn, Malt, bouche-à-oreille, partenaires complémentaires.',
      ecommerce: 'Instagram, TikTok, SEO, influence micro, ads test budget serré.',
      agency: 'Réseau, LinkedIn, partenariats, événements sectoriels.',
      marketplace: 'Recrutement manuel côté #1, communautés, partenariats locaux.',
      impact: 'Communauté mission, partenaires, presse locale, réseau engagé.',
      consulting: 'Réseau dirigeants, LinkedIn, conférences, contenu expertise.',
      content: 'Plateforme #1, newsletter, SEO, collaborations créateurs.',
      ofm: 'Prospection modèles OnlyFans (Twitter/X, Instagram), réseau OFM, contenu éducatif pro.',
    },
  },
  {
    day: 14,
    phaseId: 4,
    title: 'Bilan semaine 2',
    objective: 'Valider que l\'offre est claire et vendable.',
    baseTasks: [
      'Relis offre + pitch à voix haute',
      'Fais relire par une personne de confiance',
      'Note les 3 ajustements prioritaires',
    ],
    businessFocus: {
      saas: 'Un prospect comprend-il en 30 s ce que fait ton SaaS et combien ça coûte ?',
      freelance: 'Ton forfait est-il achetable sans appel de clarification ?',
      ecommerce: 'Ta page produit donne-t-elle envie d\'acheter maintenant ?',
      agency: 'Ton offre signature est-elle différenciée vs 3 concurrents ?',
      marketplace: 'Ton proposition 2 faces (ou 1 face) est-elle claire ?',
      impact: 'Mission + offre + prix. Les trois sont-ils cohérents ?',
      consulting: 'Ton diagnostic se vend-il seul ou demande-t-il trop d\'explication ?',
      content: 'Ton hub oriente-t-il vers une action monétisable ?',
      ofm: 'Ton charte OFM rassure-t-elle un modèle OnlyFans sceptique du secteur ?',
    },
  },
  {
    day: 15,
    phaseId: 5,
    title: 'Outil & structure web',
    objective: 'Choisir où présenter ton offre en ligne.',
    baseTasks: [],
    businessTasks: Object.fromEntries(
      (['saas', 'freelance', 'ecommerce', 'agency', 'marketplace', 'impact', 'consulting', 'content', 'ofm'] as BusinessId[]).map(
        (id) => [id, presenceTasks(id, 'choose')]
      )
    ) as Record<BusinessId, string[]>,
    businessFocus: {
      saas: '', freelance: '', ecommerce: '', agency: '', marketplace: '', impact: '', consulting: '', content: '', ofm: '',
    },
  },
  {
    day: 16,
    phaseId: 5,
    title: 'Rédaction page. Hero & problème',
    objective: 'Rédiger les 2 premières sections de ton vitrine.',
    baseTasks: [],
    businessTasks: Object.fromEntries(
      (['saas', 'freelance', 'ecommerce', 'agency', 'marketplace', 'impact', 'consulting', 'content', 'ofm'] as BusinessId[]).map(
        (id) => [id, presenceTasks(id, 'hero')]
      )
    ) as Record<BusinessId, string[]>,
    businessFocus: {
      saas: '', freelance: '', ecommerce: '', agency: '', marketplace: '', impact: '', consulting: '', content: '', ofm: '',
    },
  },
  {
    day: 17,
    phaseId: 5,
    title: 'Rédaction page. Solution & preuves',
    objective: 'Compléter le contenu persuasif.',
    baseTasks: [],
    businessTasks: Object.fromEntries(
      (['saas', 'freelance', 'ecommerce', 'agency', 'marketplace', 'impact', 'consulting', 'content', 'ofm'] as BusinessId[]).map(
        (id) => [id, presenceTasks(id, 'solution')]
      )
    ) as Record<BusinessId, string[]>,
    businessFocus: {
      saas: '', freelance: '', ecommerce: '', agency: '', marketplace: '', impact: '', consulting: '', content: '', ofm: '',
    },
  },
  {
    day: 18,
    phaseId: 5,
    title: 'Mise en ligne',
    objective: 'Publier une première version. Imparfaite mais live.',
    baseTasks: [],
    businessTasks: Object.fromEntries(
      (['saas', 'freelance', 'ecommerce', 'agency', 'marketplace', 'impact', 'consulting', 'content', 'ofm'] as BusinessId[]).map(
        (id) => [id, presenceTasks(id, 'publish')]
      )
    ) as Record<BusinessId, string[]>,
    businessFocus: {
      saas: '', freelance: '', ecommerce: '', agency: '', marketplace: '', impact: '', consulting: '', content: '', ofm: '',
    },
  },
  {
    day: 19,
    phaseId: 6,
    title: 'Grille tarifaire',
    objective: 'Fixer des prix cohérents avec la valeur délivrée.',
    baseTasks: [],
    businessTasks: Object.fromEntries(
      (['saas', 'freelance', 'ecommerce', 'agency', 'marketplace', 'impact', 'consulting', 'content', 'ofm'] as BusinessId[]).map(
        (id) => [id, pricingTasks(id, 'grid')]
      )
    ) as Record<BusinessId, string[]>,
    businessFocus: {
      saas: '', freelance: '', ecommerce: '', agency: '', marketplace: '', impact: '', consulting: '', content: '', ofm: '',
    },
  },
  {
    day: 20,
    phaseId: 6,
    title: 'Argumentaire prix',
    objective: 'Savoir défendre tes tarifs.',
    baseTasks: [],
    businessTasks: Object.fromEntries(
      (['saas', 'freelance', 'ecommerce', 'agency', 'marketplace', 'impact', 'consulting', 'content', 'ofm'] as BusinessId[]).map(
        (id) => [id, pricingTasks(id, 'argument')]
      )
    ) as Record<BusinessId, string[]>,
    businessFocus: {
      saas: '', freelance: '', ecommerce: '', agency: '', marketplace: '', impact: '', consulting: '', content: '', ofm: '',
    },
  },
  {
    day: 21,
    phaseId: 6,
    title: 'Bilan semaine 3',
    objective: 'Vérifier que tu es prêt à prospecter.',
    baseTasks: [
      'Teste le parcours complet : page → contact → offre',
      'Corrige les frictions identifiées',
      'Prépare ta liste de 20 prospects types',
    ],
    businessFocus: {
      saas: 'Parcours test : landing → CTA essai/démo → email de bienvenue.',
      freelance: 'Parcours test : page → Calendly → proposition forfait.',
      ecommerce: 'Parcours test : page → panier → paiement test → confirmation.',
      agency: 'Parcours test : site → CTA audit → formulaire qualifiant.',
      marketplace: 'Parcours test : landing → inscription waitlist → email confirmation.',
      impact: 'Parcours test : page → achat/soutien → reçu + preuve impact.',
      consulting: 'Parcours test : page → RDV diagnostic → page merci.',
      content: 'Parcours test : hub → lead magnet → email → offre.',
      ofm: 'Parcours test : site agence OFM → formulaire modèle OnlyFans → charte envoyée.',
    },
  },
  {
    day: 22,
    phaseId: 7,
    title: 'Liste de prospects',
    objective: 'Constituer un pipeline concret.',
    baseTasks: [
      'Liste 20 noms ou entreprises cibles',
      'Priorise les 10 plus chauds',
      'Note pour chacun un angle de personnalisation',
    ],
    businessFocus: {
      saas: 'Cible décideurs + utilisateurs finaux selon B2B/B2C.',
      freelance: 'Mix réseau chaud + LinkedIn ciblé sur ta niche.',
      ecommerce: 'Influenceurs micro, communautés niche, clients lookalike.',
      agency: 'Entreprises secteur cible avec signaux d\'achat (recrutement, refonte…).',
      marketplace: '20 early adopters côté prioritaire. Nom, contact, besoin.',
      impact: 'Clients payeurs + partenaires mission + prescripteurs.',
      consulting: 'Dirigeants avec problème visible (croissance, pivot, crise).',
      content: 'Marques partenaires, audience lookalike, clients formation.',
      ofm: '20 modèles OnlyFans niche avec abonnés existants et blocage business clair (acquisition ou chatting).',
    },
  },
  {
    day: 23,
    phaseId: 7,
    title: 'Séquence de prospection',
    objective: 'Lancer les premiers contacts.',
    baseTasks: [
      'Rédige un message initial court (email ou DM)',
      'Prépare un message de relance J+3',
      'Envoie 5 premiers messages personnalisés',
    ],
    businessFocus: {
      saas: 'Message : problème spécifique + lien démo/essai. Pas pitch générique.',
      freelance: 'Message : résultat concret + cas similaire + CTA RDV 20 min.',
      ecommerce: 'DM/partnership ou lancement communauté. Pas spam massif.',
      agency: 'Message : audit gratuit limité + cas secteur identique.',
      marketplace: 'Recrutement manuel : valeur plateforme + onboarding simple.',
      impact: 'Message aligné mission. Pas culpabilisation, proposition claire.',
      consulting: 'Message : insight sectoriel + offre diagnostic 45 min.',
      content: 'Collaboration, valeur gratuite d\'abord, puis offre.',
      ofm: getBusinessPhaseHint('ofm', 7) || 'Message respectueux, charte jointe, zéro promesse irréaliste.',
    },
  },
  {
    day: 24,
    phaseId: 7,
    title: 'Relances & conversations',
    objective: 'Transformer les envois en échanges.',
    baseTasks: [
      'Relance les prospects sans réponse',
      'Propose un créneau d\'appel de 15–20 min',
      'Note objections et questions récurrentes',
    ],
    businessFocus: {
      saas: 'Relance avec ressource utile (article, checklist) + lien démo.',
      freelance: 'Relance avec mini audit gratuit ou question ciblée.',
      ecommerce: 'Relance communauté / teasing lancement / early bird.',
      agency: 'Relance avec exemple livrable ou insight sectoriel.',
      marketplace: 'Relance early adopters avec bénéfice concret d\'être parmi les premiers.',
      impact: 'Relance avec preuve impact + invitation événement ou essai.',
      consulting: 'Relance avec question provocante sur leur enjeu #1.',
      content: 'Relance avec contenu à forte valeur + CTA soft.',
      ofm: 'Relance avec ressource éducative OFM + proposition call découverte modèle OnlyFans.',
    },
  },
  {
    day: 25,
    phaseId: 8,
    title: 'Appels de découverte',
    objective: 'Mener des entretiens orientés vente.',
    baseTasks: [
      'Réalisez au moins 2 appels cette semaine',
      'Utilise un script : contexte, problème, next step',
      'Termine chaque appel par une proposition claire',
    ],
    businessFocus: {
      saas: 'Script : workflow actuel → douleur → démo → essai booké.',
      freelance: 'Script : besoin → scope → forfait → date de démarrage.',
      ecommerce: 'Calls B2B wholesale ou feedback clients early. Selon modèle.',
      agency: 'Script : audit express → gap → proposition mission.',
      marketplace: 'Calls onboarding early adopters. Comprendre friction.',
      impact: 'Script : mission → fit → achat/soutien → mesure impact.',
      consulting: 'Script diagnostic : enjeu → méthode → proposition mission.',
      content: 'Script : audience → offre → partenariat ou vente directe.',
      ofm: 'Script : objectifs modèle OnlyFans → services OFM → commission % → prochaine étape contrat.',
    },
  },
  {
    day: 26,
    phaseId: 8,
    title: 'Proposition & closing',
    objective: 'Formaliser une offre commerciale.',
    baseTasks: [
      'Envoie une proposition écrite à un prospect chaud',
      'Inclue prix, délais, livrables et prochaine étape',
      'Planifie un point de décision sous 48 h',
    ],
    businessFocus: {
      saas: 'Proposition : plan, prix, onboarding, date début essai/pilote.',
      freelance: 'Proposition : scope, livrables, calendrier, acompte 30–50 %.',
      ecommerce: 'Offre lancement : bundle, code promo limité, précommande.',
      agency: 'Proposition : phases, livrables, timeline, setup + récurrent.',
      marketplace: 'Accord early adopter : conditions, commission, engagement.',
      impact: 'Proposition : offre + impact associé + reporting.',
      consulting: 'Proposition mission : diagnostic + phases + honoraires.',
      content: 'Proposition partenariat ou vente formation/package.',
      ofm: 'Contrat OFM draft : services, commission sur revenus OnlyFans, durée, clause sortie.',
    },
  },
  {
    day: 27,
    phaseId: 8,
    title: 'Première vente ou validation',
    objective: 'Obtenir un premier oui (même symbolique).',
    baseTasks: [
      'Identifie l\'action la plus simple pour un premier oui',
      'Propose une offre de lancement limitée si utile',
      'Documente ce qui a fonctionné',
    ],
    businessTasks: {
      saas: ['Vise essai activé, démo bookée ou préinscription payante.', 'Offre fondateur -30 % les 10 premiers si besoin.', 'Note le canal et le message qui ont converti.'],
      freelance: ['Vise acompte signé ou mission confirmée par email.', 'Offre lancement : -15 % ou bonus livrable.', 'Documente le profil client idéal qui a dit oui.'],
      ecommerce: ['Vise précommande ou 3 premières ventes.', 'Code lancement ou livraison offerte.', 'Note canal et angle qui convertissent.'],
      agency: ['Vise audit signé ou 1ère mission forfait.', 'Setup fee réduit early client.', 'Documente process de vente gagnant.'],
      marketplace: ['Vise 5 inscriptions actives ou 1ère transaction.', 'Incitation early : gratuit 3 mois côté offreurs.', 'Note friction #1 à corriger.'],
      impact: ['Vise 1er client payeur ou partenaire mission.', 'Offre découverte à impact mesurable.', 'Documente preuve sociale obtenue.'],
      consulting: ['Vise diagnostic payé ou mission signée.', 'Forfait découverte limité dans le temps.', 'Note objection #1 et réponse efficace.'],
      content: ['Vise 1ère vente lead magnet, formation ou sponsoring.', 'Offre early bird audience fidèle.', 'Documente canal conversion.'],
      ofm: [
        'Vise signature 1er modèle OnlyFans avec contrat OFM transparent.',
        'Période test 30 j avec commission réduite si utile.',
        'Note critères modèle OnlyFans idéal confirmés.',
      ],
    },
    businessFocus: {
      saas: 'Un essai activé compte comme victoire semaine 4.',
      freelance: 'Un acompte reçu valide ton pricing.',
      ecommerce: '3 ventes prouvent product-market fit initial.',
      agency: 'Une mission signée valide niche + offre.',
      marketplace: '5 users actifs > vanity metrics.',
      impact: 'Un payeur + impact mesuré = modèle viable.',
      consulting: 'Diagnostic payé filtre et valide.',
      content: '1 € gagné prouve la monétisation.',
      ofm: 'Contrat OFM signé > promesses verbales de revenus OnlyFans.',
    },
  },
  {
    day: 28,
    phaseId: 8,
    title: 'Livraison & feedback',
    objective: 'Exécuter et apprendre du premier client.',
    baseTasks: [
      'Livre (ou lance) avec une checklist simple',
      'Collecte 3 questions de feedback structurées',
      'Note ce qui a pris plus de temps que prévu',
    ],
    businessFocus: {
      saas: 'Onboarding checklist : compte, 1ère action, support.',
      freelance: 'Checklist livraison + point mi-parcours client.',
      ecommerce: 'Expédition, unboxing, email post-achat, demande avis.',
      agency: 'Kick-off projet + livrable intermédiaire + validation client.',
      marketplace: 'Accompagnez 1ère transaction bout en bout.',
      impact: 'Livre + mesure impact réalisé vs promis.',
      consulting: 'Livrable diagnostic + recommandations actionnables.',
      content: 'Livre produit + demande témoignage ou UGC.',
      ofm: 'Onboarding modèle OnlyFans : accès, calendrier contenu, shifts chatting, reporting revenus.',
    },
  },
  {
    day: 29,
    phaseId: 8,
    title: 'Itération offre',
    objective: 'Ajuster selon les retours terrain.',
    baseTasks: [
      'Mets à jour offre ou page selon le feedback',
      'Ajuste prix ou packaging si nécessaire',
      'Identifie la prochaine amélioration prioritaire',
    ],
    businessFocus: {
      saas: 'Itérez feature hero ou onboarding selon feedback beta.',
      freelance: 'Ajuste forfait, scope ou pricing selon 1ère mission.',
      ecommerce: 'Ajuste fiche produit, prix ou bundle.',
      agency: 'Standardise process delivery après 1ère mission.',
      marketplace: 'Corrige la friction #1 identifiée sur la plateforme.',
      impact: 'Renforcez preuve impact sur la page.',
      consulting: 'Affine diagnostic → mission conversion.',
      content: 'Double sur format/contenu qui convertit.',
      ofm: 'Affine charte OFM et services selon le 1er modèle OnlyFans signé.',
    },
  },
  {
    day: 30,
    phaseId: 8,
    title: 'Bilan 30 jours & suite',
    objective: 'Capitaliser et planifier le mois suivant.',
    baseTasks: [
      'Mesure : prospects contactés, appels, ventes, validation',
      'Liste 3 victoires et 3 axes d\'amélioration',
      'Fixe 1 objectif principal pour le mois 2',
    ],
    businessFocus: {
      saas: 'KPIs : essais, activations, MRR visé mois 2.',
      freelance: 'KPIs : missions signées, TJM moyen, pipeline.',
      ecommerce: 'KPIs : ventes, panier moyen, CAC organique.',
      agency: 'KPIs : missions, marge, taux conversion audit→mission.',
      marketplace: 'KPIs : users actifs, transactions, rétention.',
      impact: 'KPIs : clients, impact chiffré, marge.',
      consulting: 'KPIs : diagnostics, missions, panier moyen.',
      content: 'KPIs : abonnés, ventes produit, revenus divers.',
      ofm: 'KPIs OFM : modèles signés, commission $, croissance abonnés/revenus OnlyFans.',
    },
  },
];

export function buildMonth1DayTasks(
  businessId: BusinessId,
  blueprint: Month1DayBlueprint,
  marketSegment?: MarketSegment | null
): string[] {
  const custom = blueprint.businessTasks?.[businessId];
  if (custom?.length) {
    let tasks = custom;
    if (marketSegment && businessUsesMarketSegment(businessId)) {
      tasks = applyMarketSegmentToTasks(custom, businessId, marketSegment, blueprint.title);
    }
    return tasks;
  }

  let tasks = buildMonth1TasksFromBlueprint(
    businessId,
    blueprint.title,
    blueprint.baseTasks,
    blueprint.businessFocus[businessId] ?? ''
  );

  if (marketSegment && businessUsesMarketSegment(businessId)) {
    tasks = applyMarketSegmentToTasks(tasks, businessId, marketSegment, blueprint.title);
  }

  return tasks;
}

export function buildMonth1DayTip(businessId: BusinessId, phaseId: number): string | undefined {
  const hint = getBusinessPhaseHint(businessId, phaseId);
  if (hint) return hint;
  const phase = COACHING_PHASES.find((p) => p.id === phaseId);
  if (phase) return `Étape coach ${phaseId}/8. ${phase.name} : ${phase.goal}`;
  return undefined;
}

export function buildMonth1RoadmapDay(
  businessId: BusinessId,
  blueprint: Month1DayBlueprint,
  marketSegment?: MarketSegment | null
) {
  const week = weekForDay(blueprint.day);
  const profile = businessProfiles[businessId];
  const baseTasks = buildMonth1DayTasks(businessId, blueprint, marketSegment);
  const tasks = buildDenseDailyTasks(
    businessId,
    1,
    blueprint.day,
    blueprint.title,
    blueprint.objective,
    baseTasks
  );

  const special = resolveSpecialDayKey(blueprint.title);
  let tip = buildMonth1DayTip(businessId, blueprint.phaseId);
  if (special?.startsWith('legal') && blueprint.day === 5) {
    tip = formatLegalGuideTip(businessId);
  } else if (special?.startsWith('exit')) {
    tip = formatExitGuideTip(businessId) ?? tip;
  }

  let objective = blueprint.objective.replace(/ton modèle/gi, profile.name);
  if (marketSegment && businessUsesMarketSegment(businessId)) {
    objective = applyMarketSegmentToObjective(
      objective,
      businessId,
      marketSegment,
      blueprint.title
    );
  }

  return {
    day: blueprint.day,
    month: 1,
    dayInMonth: blueprint.day,
    week,
    weekLabel: MONTH1_WEEK_LABELS[week],
    phaseId: blueprint.phaseId,
    phaseName: phaseName(blueprint.phaseId),
    title: blueprint.title,
    objective,
    tasks,
    tip,
  };
}
