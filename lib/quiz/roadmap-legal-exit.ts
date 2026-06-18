import type { BusinessId } from '@/lib/quiz/data';
import { withoutFocusBlockTasks } from '@/lib/quiz/roadmap-task-filters';

export interface LegalFormOption {
  form: string;
  when: string;
  pros: string;
}

export interface BusinessLegalGuide {
  headline: string;
  recommended: LegalFormOption[];
  caution: string;
  accountantNote: string;
}

export interface BusinessExitGuide {
  headline: string;
  /** Modèle où une revente d'actifs / SaaS est un scénario réaliste */
  resaleRelevant: boolean;
  valuationHint: string;
  channels: string[];
  assetChecklist: string[];
}

const LEGAL_GUIDES: Record<BusinessId, BusinessLegalGuide> = {
  saas: {
    headline: 'SaaS. Statut orienté croissance & revente',
    recommended: [
      {
        form: 'Micro-entreprise',
        when: 'Validation MVP, CA < plafonds, solo, peu de charges',
        pros: 'Démarrage rapide, faible charge admin. Idéal pour tester le marché',
      },
      {
        form: 'SASU (recommandé scale / revente)',
        when: 'Abonnements récurrents, B2B, besoin d\'investir ou de revendre un jour',
        pros: 'Responsabilité limitée, actions cessibles, image pro, due diligence plus simple',
      },
      {
        form: 'SAS (2+ associés)',
        when: 'Co-fondateurs ou levée prévue',
        pros: 'Gouvernance claire, pacte d\'associés, exit par rachat de parts',
      },
    ],
    caution:
      'Évite de mélanger compte perso et Stripe pro sans structure. Bloquant pour une revente. Propriété du code et du nom de domaine au nom de la société dès que possible.',
    accountantNote:
      'Consulte un expert-comptable avant dépassement des plafonds micro. Bascule SASU souvent au bon moment entre 2k€ et 5k€ MRR selon charges.',
  },
  freelance: {
    headline: 'Freelance / services. Simplicité puis structure',
    recommended: [
      {
        form: 'Micro-entreprise',
        when: 'Démarrage, missions ponctuelles, solo',
        pros: 'Comptabilité allégée, idéal pour valider le positionnement',
      },
      {
        form: 'EURL ou SASU',
        when: 'Missions récurrentes, TJM élevé, besoin de crédibilité B2B',
        pros: 'Protection patrimoniale, facturation pro, optimisation possible',
      },
    ],
    caution:
      'Le portage ou micro convient au test ; dès missions > 6 mois avec le même client, structure (EURL/SASU).',
    accountantNote: 'Vérifie le statut de non-salarié (pas de lien de subordination) sur missions longues.',
  },
  ecommerce: {
    headline: 'E-commerce. Stock, TVA et structure',
    recommended: [
      {
        form: 'Micro-entreprise',
        when: 'Test produit, faible volume, pas de stock lourd',
        pros: 'Lancement rapide. Attention plafonds CA vente marchandises',
      },
      {
        form: 'EURL / SASU',
        when: 'Stock, fournisseurs internationaux, pub paid, Shopify pro',
        pros: 'TVA, marge claire, revente boutique + marque possible',
      },
    ],
    caution: 'Stock et TVA intracommunautaire complexifient la micro. Anticipe le basculement.',
    accountantNote: 'Comptabilité stocks + TVA : expert-comptable recommandé dès 30k€ CA/an.',
  },
  agency: {
    headline: 'Agence. Marge équipe & contrats',
    recommended: [
      {
        form: 'SASU / EURL',
        when: 'Dès premières missions récurrentes ou sous-traitance',
        pros: 'Contrats cadre, RC pro, sous-traitance légale',
      },
      {
        form: 'SAS',
        when: 'Associé commercial + associé production',
        pros: 'Répartition rôles, croissance, cession parts',
      },
    ],
    caution: 'Micro possible en solo pur ; dès sous-traitants réguliers, structure société.',
    accountantNote: 'Clause de propriété intellectuelle sur livrables clients = essentiel.',
  },
  marketplace: {
    headline: 'Marketplace. Structure dès le MVP transactionnel',
    recommended: [
      {
        form: 'SASU puis SAS',
        when: 'Plateforme avec commissions, 2 faces marché',
        pros: 'Contrats vendeurs/acheteurs, KYC, responsabilité encadrée',
      },
    ],
    caution: 'Micro inadaptée dès commissions récurrentes et volume. CGU plateforme obligatoires.',
    accountantNote: 'Statut intermédiaire (agent vs mandataire) à valider avec avocat spécialisé.',
  },
  impact: {
    headline: 'Impact. Mission + modèle économique',
    recommended: [
      {
        form: 'SASU / SAS',
        when: 'Modèle hybride impact + revenus',
        pros: 'Accueil investisseurs impact, gouvernance, subventions',
      },
      {
        form: 'Association + activité économique',
        when: 'Mission sociale dominante, revenus accessoires',
        pros: 'Éligibilité financements. Limites sur distribution profits',
      },
    ],
    caution: 'Clarifie le statut dès le départ si tu vises le label ESUS ou des subventions.',
    accountantNote: 'Conseil juridique spécialisé ESS recommandé.',
  },
  consulting: {
    headline: 'Consulting. Crédibilité & protection',
    recommended: [
      {
        form: 'Micro-entreprise',
        when: 'Missions courtes, solo, test',
        pros: 'Simplicité',
      },
      {
        form: 'SASU / EURL',
        when: 'Missions longues, grands comptes, confidentialité',
        pros: 'NDA, RC pro, TJM élevé, image cabinet',
      },
    ],
    caution: 'Grands clients exigent souvent une société (pas micro) pour RFP.',
    accountantNote: 'Assurance RC pro avant première mission > 5k€.',
  },
  content: {
    headline: 'Créateur / contenu. Monétisation progressive',
    recommended: [
      {
        form: 'Micro-entreprise',
        when: 'Sponsoring, affiliations, premières ventes digitales',
        pros: 'Idéal pour tester monétisation audience',
      },
      {
        form: 'SASU',
        when: 'Formations, SaaS outil, équipe montée, revente chaîne',
        pros: 'Propriété IP contenu, contrats marques, exit média possible',
      },
    ],
    caution: 'Revenus plateformes (YouTube, etc.) : déclarez au bon endroit selon statut.',
    accountantNote: 'Séparez revenus BNC contenu vs vente produits selon activité dominante.',
  },
  ofm: {
    headline: 'OnlyFans Management. Discrétion, contrats & conformité',
    recommended: [
      {
        form: 'Micro-entreprise (activité adaptée)',
        when: 'Manager solo OFM, revenus modérés, conformité OnlyFans',
        pros: 'Discrétion relative, simplicité administrative',
      },
      {
        form: 'SASU',
        when: 'Agence OFM, plusieurs modèles, équipe chatters, revenus élevés',
        pros: 'Séparation patrimoine, contrats pros, scalabilité agence',
      },
    ],
    caution:
      'Respect strict CGU OnlyFans + contrats OFM clairs (consentement, limites, commission) + RGPD sur données.',
    accountantNote: 'Comptable habitué revenus OnlyFans / creator economy. Confidentialité.',
  },
};

const EXIT_GUIDES: Record<BusinessId, BusinessExitGuide> = {
  saas: {
    headline: 'Préparer la revente de ton SaaS (ou de tes actifs digitaux)',
    resaleRelevant: true,
    valuationHint:
      'Micro-SaaS : souvent 2,5× à 5× l\'ARR (revenu récurrent annuel) selon croissance, churn et dépendance au fondateur. Fourchette indicative, pas une promesse.',
    channels: [
      'MicroAcquire, Acquire.com, Flippa (SaaS)',
      'Réseau fondateurs, brokers spécialisés micro-SaaS',
      'Approche directe concurrents ou agences',
    ],
    assetChecklist: [
      'Code source documenté + repo propre (pas perso)',
      'MRR / churn / CAC exportés 12 mois (Stripe + analytics)',
      'Contrats clients, CGU/CGV, politique confidentialité',
      'Nom de domaine + comptes au nom société',
      'Documentation onboarding sans dépendance à toi seul',
    ],
  },
  marketplace: {
    headline: 'Préparer la cession d\'une marketplace',
    resaleRelevant: true,
    valuationHint: 'Valorisation sur GMV, take rate, rétention des deux côtés. Due diligence lourde.',
    channels: ['Brokers tech, acquéreurs stratégiques sectoriels'],
    assetChecklist: [
      'Historique transactions + taux de litige',
      'CGU vendeurs/acheteurs à jour',
      'Stack technique scalable documentée',
    ],
  },
  ecommerce: {
    headline: 'Revendre une boutique / marque e-commerce',
    resaleRelevant: true,
    valuationHint: 'Souvent 2× à 4× bénéfice net annuel ou multiple sur CA selon marge et dépendance pub.',
    channels: ['Flippa, Acquire.com, Empire Flippers, réseaux e-com FR'],
    assetChecklist: [
      'Historique CA marge par SKU',
      'Contrats fournisseurs transférables',
      'Actifs marque (logo, réseaux, email list)',
    ],
  },
  agency: {
    headline: 'Céder un portefeuille clients agence',
    resaleRelevant: true,
    valuationHint: 'Multiple sur EBITDA ou sur récurrence contrats. Earn-out fréquent.',
    channels: ['Réseau agences, cabinets M&A TPE, associé entrant'],
    assetChecklist: ['Contrats récurrents', 'Process delivery documentés', 'Équipe ou sous-traitants stables'],
  },
  content: {
    headline: 'Monétiser ou céder un actif média',
    resaleRelevant: true,
    valuationHint: 'Newsletter / chaîne : multiple sur revenus nets récurrents (sponsoring, abonnements).',
    channels: ['Acquire.com newsletter, réseaux créateurs, vente directe'],
    assetChecklist: ['Liste email propriétaire', 'Analytics 12 mois', 'Contrats sponsors'],
  },
  freelance: {
    headline: 'Transférer une activité de services',
    resaleRelevant: false,
    valuationHint: 'Revente rare ; plutôt transfert clientèle avec earn-out ou embauche successeur.',
    channels: ['Associé, repreneur métier, fusion'],
    assetChecklist: ['Contrats transférables', 'Documentation livrables', 'Relation client introduite'],
  },
  consulting: {
    headline: 'Céder un cabinet conseil TPE',
    resaleRelevant: true,
    valuationHint: 'Multiple faible si dépendance expert. Valoriser récurrence et méthodologie.',
    channels: ['Réseau consultants, Big4 boutiques, associé junior'],
    assetChecklist: ['Méthodologies propriétaires', 'Cas clients anonymisés', 'Pipeline récurrent'],
  },
  impact: {
    headline: 'Transmission structure impact',
    resaleRelevant: false,
    valuationHint: 'Reprise par association ou fonds impact. Pas logique PME classique.',
    channels: ['Fonds impact, reprise associative'],
    assetChecklist: ['Impact metrics', 'Gouvernance', 'Financement public documenté'],
  },
  ofm: {
    headline: 'Scaler ton agence OnlyFans Management',
    resaleRelevant: false,
    valuationHint:
      'Actif = portefeuille modèles sous contrat + process + équipe chatters ; valorisation agence OFM si revenus récurrents commission.',
    channels: ['Vente agence à repreneur OFM', 'Partenariat avec agence plus grande', 'Formation OFM'],
    assetChecklist: [
      'Contrats modèles OnlyFans + charte OFM',
      'Process chatting, acquisition, reporting documentés',
      'Stats revenus gérés 12 mois (anonymisées)',
      'CRM pipeline modèles',
    ],
  },
};

/** Jours dédiés juridique / exit (mois global, jour dans chapitre) */
export const LEGAL_EXIT_DAY_KEYS = new Set([
  'legal-diagnostic',
  'legal-compare',
  'legal-register',
  'legal-contracts',
  'legal-compliance',
  'exit-assets',
  'exit-metrics',
  'exit-data-room',
  'exit-plan',
]);

export function getLegalGuide(businessId: BusinessId): BusinessLegalGuide {
  return LEGAL_GUIDES[businessId];
}

export function getExitGuide(businessId: BusinessId): BusinessExitGuide {
  return EXIT_GUIDES[businessId];
}

export function formatLegalGuideTip(businessId: BusinessId): string {
  const g = getLegalGuide(businessId);
  const top = g.recommended[0];
  const scale = g.recommended[1];
  const target = scale?.form ?? top.form;
  return `${g.headline}. Anticipe en mois 1 ; formalise (${target}) une fois le business monté (clients, CA, récurrence). Phase test : ${top.form}.`;
}

export function formatExitGuideTip(businessId: BusinessId): string | undefined {
  const g = getExitGuide(businessId);
  if (!g.resaleRelevant) return undefined;
  return `${g.headline}. ${g.valuationHint}`;
}

type DayKey =
  | 'legal-diagnostic'
  | 'legal-compare'
  | 'legal-register'
  | 'legal-contracts'
  | 'legal-compliance'
  | 'exit-assets'
  | 'exit-metrics'
  | 'exit-data-room'
  | 'exit-plan';

/** Map titre normalisé → clé spéciale pour tâches enrichies */
export function resolveSpecialDayKey(title: string): DayKey | null {
  const t = title.toLowerCase();
  if (t.includes('forme juridique') && (t.includes('diagnostic') || t.includes('anticiper'))) {
    return 'legal-diagnostic';
  }
  if (t.includes('comparer') && t.includes('statut')) return 'legal-compare';
  if (t.includes('immatriculation') || t.includes('créer ton structure')) return 'legal-register';
  if (t.includes('contrats') || t.includes('cgv')) return 'legal-contracts';
  if (t.includes('conformité') || t.includes('rgpd')) return 'legal-compliance';
  if (t.includes('actifs numériques') || t.includes('actifs documentés')) return 'exit-assets';
  if (t.includes('mrr') || t.includes('métriques revente')) return 'exit-metrics';
  if (t.includes('data room') || t.includes('due diligence')) return 'exit-data-room';
  if (t.includes('plan revente') || t.includes('revente ou scale')) return 'exit-plan';
  return null;
}

export function buildLegalExitTasks(
  businessId: BusinessId,
  dayKey: DayKey
): string[] {
  const legal = getLegalGuide(businessId);
  const exit = getExitGuide(businessId);

  switch (dayKey) {
    case 'legal-diagnostic':
      return [
        `Lis les options pour ${legal.headline.split('.')[0].trim()} : ${legal.recommended.map((r) => r.form).join(', ')}`,
        'Priorité mois 1 : valider offre, site et premiers contacts. Pas d\'immatriculation ni de démarches admin aujourd\'hui',
        legal.recommended[1]
          ? `Statut cible à appliquer une fois le business monté : ${legal.recommended[1].form} (${legal.recommended[1].when})`
          : `Statut cible à appliquer plus tard : ${legal.recommended[0].form}`,
        'Liste 2–3 déclencheurs concrets (ex. 1er client payant, 3 ventes/mois, besoin de facturer en société)',
        `À garder en tête pour plus tard : ${legal.caution}`,
      ];
    case 'legal-compare':
      return legal.recommended.flatMap((r) => [
        `${r.form}. Quand : ${r.when}`,
        `Avantage : ${r.pros}`,
      ]).slice(0, 5);
    case 'legal-register':
      return [
        `Décide du statut retenu (priorité : ${legal.recommended[1]?.form ?? legal.recommended[0].form})`,
        'Liste documents : pièce identité, justificatif domicile, déclaration non-condamnation',
        'Guichet unique INPI (guichet-entreprises.fr) ou expert-comptable pour SASU/SAS',
        'Ouvre un compte bancaire pro dès immatriculation reçue',
        legal.accountantNote,
      ];
    case 'legal-contracts':
      return [
        'Rédige ou adapte CGV/CGU + mentions légales sur ton site',
        'Contrat type client / conditions abonnement (durée, résiliation, SLA si B2B)',
        'Clause propriété intellectuelle et confidentialité',
        businessId === 'saas'
          ? 'Annexe RGPD / DPA si clients pro traitent des données via ton outil'
          : 'Politique de confidentialité + cookies conformes',
        'Fais relire par un professionnel si CA > 30k€/an',
      ];
    case 'legal-compliance':
      return [
        'Registre des traitements RGPD (même simple)',
        'Factures conformes (mentions obligatoires)',
        'Assurance RC pro si pertinent à ton modèle',
        legal.caution,
        'Calendrier : date limite bascule statut si plafond micro approche',
      ];
    case 'exit-assets':
      if (!exit.resaleRelevant) {
        return [
          'Documente tes actifs clés (clients, process, IP) pour une reprise ou diversification',
          'Liste ce qui a de la valeur sans toi (templates, SOP, listes)',
          'Identifie un scénario : scale vs transmission vs pivot',
          legal.accountantNote,
          'Bilan : que pourrait reprendre un acquéreur demain ?',
        ];
      }
      return [
        ...exit.assetChecklist.slice(0, 3),
        `Canaux de revente possibles : ${exit.channels.slice(0, 2).join('. ')}`,
        exit.valuationHint,
      ];
    case 'exit-metrics':
      if (!exit.resaleRelevant) {
        return [
          'Tableau de bord revenus / marge sur 6 mois',
          'Identifie tes 3 KPIs de valeur métier',
          'Documente croissance mois par mois',
          'Prépare narratif « pourquoi ça marche »',
          legal.accountantNote,
        ];
      }
      return businessId === 'saas'
        ? [
            'Export Stripe : MRR, churn, nouveaux clients. 12 mois',
            'Calcul ARR = MRR × 12 ; note le churn mensuel %',
            'CAC approximatif (dépenses acquisition / nouveaux clients)',
            'Tableau : date, MRR, clients actifs, commentaire',
            exit.valuationHint,
          ]
        : [
            'Export revenus / marge par mois sur 12 mois',
            'Identifie top 20 % clients ou produits (Pareto)',
            'Documente croissance et saisonnalité',
            exit.valuationHint,
            `Canaux : ${exit.channels[0]}`,
          ];
    case 'exit-data-room':
      if (!exit.resaleRelevant) {
        return [
          'Dossier « reprise activité » : contrats, factures, process',
          'Organise Google Drive : Legal, Clients, Produit, Finances',
          'Checklist transfert : ce qu\'un repreneur doit recevoir en J1',
          legal.accountantNote,
          'Timeline : dans 12 mois, que doit contenir ce dossier ?',
        ];
      }
      return [
        'Crée dossier « Data room light » (Drive ou Notion)',
        ...exit.assetChecklist.map((item) => `Inclure : ${item}`),
        'Ajoute FAQ interne : stack, fournisseurs, procédures',
        'Simule : un acheteur a 2h. Que lit-il en premier ?',
        exit.valuationHint,
      ];
    case 'exit-plan':
      if (!exit.resaleRelevant) {
        return [
          'Scénario A : continuer solo. Scénario B : recruter. Scénario C : vendre/pivoter',
          'Critères objectifs pour choisir (CA, charge mentale, opportunité)',
          '3 actions ce trimestre vers le scénario retenu',
          legal.accountantNote,
          'Revue dans 90 jours',
        ];
      }
      return [
        `Objectif revente ou levée : horizon 18–36 mois (indicatif)`,
        `Canaux cibles : ${exit.channels.join('. ')}`,
        'Liste 5 améliorations produit/process qui augmentent la valorisation',
        'Identifie dépendance fondateur #1 et plan pour la réduire',
        businessId === 'saas'
          ? 'Rédige 1 paragraphe « teaser » : problème, solution, MRR, croissance. Pour future annonce'
          : 'Rédige teaser 1 paragraphe pour future annonce de cession',
      ];
    default:
      return [];
  }
}

export function buildDenseDailyTasks(
  businessId: BusinessId,
  month: number,
  dayInMonth: number,
  title: string,
  objective: string,
  baseTasks: string[]
): string[] {
  const special = resolveSpecialDayKey(title);
  if (special) {
    const isLegal = special.startsWith('legal');
    if (!isLegal || month === 1) {
      return buildLegalExitTasks(businessId, special);
    }
  }

  const extra: string[] = [];
  const exit = getExitGuide(businessId);

  if (dayInMonth % 7 === 0) {
    extra.push('Bilan hebdo : 1 victoire, 1 blocage, 1 priorité semaine prochaine.');
  }

  if (month >= 5 && exit.resaleRelevant && dayInMonth >= 18) {
    extra.push(`Rappel exit : ${exit.assetChecklist[0]}`);
  }

  const merged = [...baseTasks, ...extra];
  const unique = withoutFocusBlockTasks(
    [...new Set(merged.map((t) => t.trim()).filter(Boolean))]
  );
  return unique.slice(0, 6);
}
