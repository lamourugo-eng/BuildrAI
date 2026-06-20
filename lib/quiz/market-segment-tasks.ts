import type { BusinessId } from '@/lib/quiz/data';
import type { MarketSegment } from '@/lib/quiz/market-segment';

type SegmentDayTasks = Partial<Record<string, string[]>>;

const SAAS_B2B_TASKS: SegmentDayTasks = {
  'Clarifier le problème': [
    'Note 3 frustrations ops/métier vécues par des entreprises (pas des particuliers)',
    'Rédige « Mon client entreprise galère parce que… »',
    'Vérifie que des PME/ETI paient déjà pour résoudre ce problème',
  ],
  'Hypothèse de marché': [
    'Choisis B2B : secteur, taille d\'entreprise (PME/ETI) et pays v1',
    'Liste 10 entreprises cibles avec décideur identifiable (LinkedIn)',
    'Critère prospect : budget logiciel + douleur mesurable en équipe',
  ],
  'Persona & contexte d\'achat': [
    'Nomme ton persona décideur (rôle, KPI, outils actuels)',
    'Liste objections B2B : sécurité, intégration, ROI, changement d\'outil',
    'Identifie le déclencheur d\'achat (audit, croissance, nouveau responsable…)',
  ],
  '10 nouveaux messages': [
    'Envoie 10 messages LinkedIn ou cold emails à des décideurs qualifiés',
    'Varie accroche : douleur métier + preuve + CTA démo 20 min',
    'Note taux de réponse et secteurs les plus réactifs',
  ],
  'Relances personnalisées': [
    'Relance 5 comptes tièdes avec un cas client ou chiffre métier',
    'Personnalise par secteur / taille d\'entreprise',
    'Planifie relance J+7 avec nouvel angle ROI',
  ],
  'Script de relance J+7': [
    'Rédige un script J+7 B2B : rappel contexte + valeur ROI + CTA démo',
    'Teste sur 3 décideurs tièdes',
    'Ajuste selon les réponses (sécurité, pricing, timing)',
  ],
  'Chiffre du pipeline': [
    'Comptez comptes : démo bookée / essai / négociation / perdu',
    'Estime MRR ou ACV potentiel sur 30 jours',
    'Priorise 5 comptes à closer avec next step daté',
  ],
  'Nettoyer la liste prospects': [
    'Archive comptes sans réponse depuis 30+ jours',
    'Requalifie : ICP fit / hors cible / timing',
    'Garde uniquement les comptes avec décideur identifié',
  ],
  'Audit canal #1': [
    'Mesure taux de réponse LinkedIn / email / outbound sur 30 jours',
    'Calcule coût par démo ou essai activé',
    'Fixe objectif +20 % de RDV qualifiés ce mois',
  ],
  'Variante A/B message': [
    'Teste 2 accroches B2B (douleur vs ROI chiffré) sur 10 décideurs',
    'Même CTA : démo ou essai',
    'Garde la version avec le meilleur taux de réponse',
  ],
  'Quota prospection quotidien': [
    'Fixe un quota : ex. 5 messages ou 2 RDV découverte / jour',
    'Prépare ta liste ICP la veille (LinkedIn Sales Nav ou équivalent)',
    'Coche chaque jour dans un tableau',
  ],
  'Pipeline visuel': [
    'CRM ou sheet : compte → étape (contact, démo, essai, closing)',
    'Mets à jour chaque compte chaud',
    'Planifie next step par compte en négociation',
  ],
  '1 appel de vente minimum': [
    'Book ou mène 1 démo / discovery call B2B aujourd\'hui',
    'Prépare questions : stack actuel, budget, décideurs, timeline',
    'Note objections et prochaine étape (POC, essai, devis)',
  ],
};

const SAAS_B2C_TASKS: SegmentDayTasks = {
  'Clarifier le problème': [
    'Note 3 frustrations vécues par des particuliers (usage quotidien)',
    'Rédige « Mon utilisateur galère parce que… »',
    'Vérifie que des gens paient déjà (apps, abos) pour ce type de problème',
  ],
  'Hypothèse de marché': [
    'Choisis B2C : niche particuliers, usage et canal v1 (store, social, SEO…)',
    'Liste 10 communautés ou hashtags où ta cible est active',
    'Critère utilisateur : fréquence du problème + willingness to pay',
  ],
  'Persona & contexte d\'achat': [
    'Nomme ton persona utilisateur (âge, job, habitudes app)',
    'Liste objections B2C : prix, « une app de plus », confiance',
    'Identifie le déclencheur (nouvelle habitude, recommandation, promo…)',
  ],
  '10 nouveaux messages': [
    'Engage dans 10 conversations communauté (Reddit, Discord, commentaires…)',
    'Apporte de la valeur avant de mentionner ton produit',
    'Note plateformes et accroches qui génèrent des réponses',
  ],
  'Relances personnalisées': [
    'Relance 5 utilisateurs tièdes (email ou DM) avec bénéfice concret',
    'Inclus capture écran ou mini démo si pertinent',
    'Planifie relance J+7 avec nouveauté ou preuve sociale',
  ],
  'Chiffre du pipeline': [
    'Comptez : visiteurs → inscription → activation → payant',
    'Estime conversions par étape sur 30 jours',
    'Identifie la plus grosse fuite du funnel',
  ],
  'Audit canal #1': [
    'Mesure CAC ou coût par install / inscription par canal',
    'Compare organique vs paid vs referral',
    'Fixe objectif +20 % sur le canal le plus rentable',
  ],
  'Publier ou partager 1 contenu utile': [
    'Publie 1 contenu où ta cible traîne (TikTok, IG, YouTube, newsletter…)',
    'Hook 3 secondes + valeur + CTA essai ou liste d\'attente',
    'Mesure vues, clics, inscriptions',
  ],
  'Soft launch offre #2': [
    'Propose la feature / offre #2 à 10 early users existants',
    'Collecte feedback in-app ou DM',
    'Mesure taux d\'adoption et rétention J7',
  ],
};

const MARKETPLACE_B2B_TASKS: SegmentDayTasks = {
  'Hypothèse de marché': [
    'Choisis un marché B2B : secteur pro, géographie, taille des acteurs',
    'Décide quel côté lancer en premier (fournisseurs pro ou acheteurs entreprises)',
    'Critère early adopter : volume transactions + confiance B2B',
  ],
  'Persona & contexte d\'achat': [
    'Persona côté #1 : responsable achat / ops / dirigeant PME',
    'Objections : confiance plateforme, commission, migration',
    'Déclencheur : nouveau fournisseur, appel d\'offres, gain de temps',
  ],
  'Chiffre du pipeline': [
    'Comptez offreurs pro et acheteurs entreprises par statut',
    'Estime GMV potentiel si les deux côtés activent',
    'Priorise 5 comptes à activer cette semaine',
  ],
  '10 nouveaux messages': [
    'Contacte 10 offreurs ou acheteurs pro qualifiés',
    'Pitch : liquidité, gain de temps, cas métier concret',
    'Note qui répond et pourquoi',
  ],
};

const MARKETPLACE_B2C_TASKS: SegmentDayTasks = {
  'Hypothèse de marché': [
    'Choisis une niche grand public : qui offre, qui achète, où ils sont en ligne',
    'Décide quel côté lancer en premier (offre ou demande particuliers)',
    'Critère early adopter : usage fréquent + confiance paiement',
  ],
  'Persona & contexte d\'achat': [
    'Persona utilisateur grand public des deux côtés si besoin',
    'Objections : confiance, frais, qualité, délais',
    'Déclencheur : besoin immédiat, recommandation, promo',
  ],
  'Chiffre du pipeline': [
    'Comptez vendeurs/particuliers et acheteurs actifs par statut',
    'Estime transactions/semaine si liquidité minimale atteinte',
    'Priorise 5 profils à activer cette semaine',
  ],
  '10 nouveaux messages': [
    'Contacte 10 early adopters (vendeurs ou acheteurs particuliers)',
    'Pitch simple : bénéfice immédiat + preuve sociale locale',
    'Note taux de réponse par canal (IG, FB, bouche-à-oreille…)',
  ],
};

const ECOMMERCE_B2B_TASKS: SegmentDayTasks = {
  'Hypothèse de marché': [
    'Cible B2B : revendeurs, boutiques, grossistes ou entreprises acheteuses',
    'Définis MOQ, catalogue pro et conditions de paiement',
    'Liste 10 comptes pro à approcher',
  ],
  '10 nouveaux messages': [
    'Contacte 10 revendeurs ou acheteurs pro (email, LinkedIn, salon)',
    'Propose catalogue, marges revendeur et conditions',
    'Note taux de réponse et objections (MOQ, délais)',
  ],
  'Relances personnalisées': [
    'Relance 5 comptes pro tièdes avec offre lancement ou échantillons',
    'Personnalise par type de revendeur',
    'Planifie relance J+7',
  ],
  'Mesurer coût d\'acquisition': [
    'CAC B2B = coût prospection pro ÷ comptes ouverts',
    'Compare salon / LinkedIn / email / recommandation',
    'Fixe plafond CAC vs marge wholesale',
  ],
};

const ECOMMERCE_B2C_TASKS: SegmentDayTasks = {
  'Hypothèse de marché': [
    'Cible D2C : niche, persona acheteur, canal #1 (Instagram, TikTok, SEO…)',
    'Définis promesse marque et panier moyen cible',
    'Liste 10 communautés ou créateurs où ta cible achète',
  ],
  '10 nouveaux messages': [
    'Publie ou engage 10 fois auprès de ta cible (posts, DMs, UGC…)',
    'Teste 2 accroches produit + CTA boutique',
    'Note clics et ajouts panier',
  ],
  'Mesurer coût d\'acquisition': [
    'CAC D2C = budget pub ÷ commandes',
    'ROAS par campagne Meta / TikTok / Google',
    'Coupe campagnes sous ROAS 2 (ou ton seuil)',
  ],
  'Campagne bouche-à-oreille': [
    'Rédige un message partageable pour clients satisfaits',
    'Inclus code parrain ou cadeau',
    'Envoie à 10 clients avec CTA simple',
  ],
};

const SEGMENT_DAY_TASKS: Partial<
  Record<BusinessId, Partial<Record<MarketSegment, SegmentDayTasks>>>
> = {
  saas: { b2b: SAAS_B2B_TASKS, b2c: SAAS_B2C_TASKS },
  marketplace: { b2b: MARKETPLACE_B2B_TASKS, b2c: MARKETPLACE_B2C_TASKS },
  ecommerce: { b2b: ECOMMERCE_B2B_TASKS, b2c: ECOMMERCE_B2C_TASKS },
};

const MONTH1_FOCUS_OVERRIDES: Partial<
  Record<BusinessId, Partial<Record<MarketSegment, Record<number, string>>>>
> = {
  saas: {
    b2b: {
      1: 'Précise la douleur métier en entreprise (équipe, process, budget logiciel).',
      3: 'Choisis B2B pour la v1 : secteur, taille PME/ETI, pays unique.',
      4: 'Décideur budget + utilisateur quotidien : rôles et cycle d\'achat.',
    },
    b2c: {
      1: 'Précise la douleur individuelle (habitude, frustration perso, app existante).',
      3: 'Choisis B2C pour la v1 : niche particuliers, usage, canal d\'acquisition.',
      4: 'Utilisateur final : habitudes mobile/web et moment d\'achat.',
    },
  },
  marketplace: {
    b2b: {
      3: 'Marché B2B : quel côté pro lancer en premier (fournisseurs ou acheteurs entreprises).',
      4: 'Persona pro : responsable achat, ops ou dirigeant PME.',
    },
    b2c: {
      3: 'Marché grand public : quel côté lancer en premier (particuliers offreurs ou acheteurs).',
      4: 'Persona grand public : habitudes d\'achat et confiance plateforme.',
    },
  },
  ecommerce: {
    b2b: {
      3: 'Cible wholesale : revendeurs, boutiques pro, MOQ et conditions.',
      4: 'Acheteur pro : critères marge, réassort, délais.',
    },
    b2c: {
      3: 'Cible D2C : niche, persona, canal social ou SEO #1.',
      4: 'Acheteur particulier : moment d\'achat (impulsion, cadeau, récurrence).',
    },
  },
};

function adaptTaskWording(
  task: string,
  businessId: BusinessId,
  segment: MarketSegment
): string {
  if (segment === 'b2b' && businessId === 'saas') {
    return task
      .replace(/\bprospects\b/gi, 'comptes entreprises')
      .replace(/\bprospect\b/gi, 'compte entreprise')
      .replace(/\bclients fidèles\b/gi, 'comptes clients')
      .replace(/\bappel de vente\b/gi, 'démo / discovery call')
      .replace(/\bscript de vente\b/gi, 'script outbound B2B');
  }
  if (segment === 'b2c' && businessId === 'saas') {
    return task
      .replace(/\bprospects\b/gi, 'utilisateurs cibles')
      .replace(/\bprospect\b/gi, 'utilisateur cible')
      .replace(/\bappel de vente\b/gi, 'call utilisateur / feedback')
      .replace(/\bscript de vente\b/gi, 'message communauté ou onboarding');
  }
  if (segment === 'b2b' && businessId === 'ecommerce') {
    return task
      .replace(/\bprospects\b/gi, 'comptes pro / revendeurs')
      .replace(/\bclients\b/gi, 'comptes pro')
      .replace(/\bcommandes\b/gi, 'commandes wholesale');
  }
  if (segment === 'b2c' && businessId === 'ecommerce') {
    return task
      .replace(/\bprospects\b/gi, 'visiteurs / acheteurs')
      .replace(/\bB2B wholesale\b/gi, 'clients particuliers');
  }
  return task;
}

export function applyMarketSegmentToTasks(
  tasks: string[],
  businessId: BusinessId,
  segment: MarketSegment,
  baseTitle: string
): string[] {
  const override = SEGMENT_DAY_TASKS[businessId]?.[segment]?.[baseTitle];
  if (override?.length) return override;

  return tasks.map((task) => adaptTaskWording(task, businessId, segment));
}

export function applyMarketSegmentToMonth1Focus(
  businessId: BusinessId,
  segment: MarketSegment,
  dayInMonth: number,
  focus: string
): string {
  return MONTH1_FOCUS_OVERRIDES[businessId]?.[segment]?.[dayInMonth] ?? focus;
}

export function applyMarketSegmentToObjective(
  objective: string,
  businessId: BusinessId,
  segment: MarketSegment,
  baseTitle: string
): string {
  const prefix =
    segment === 'b2b'
      ? businessId === 'saas'
        ? '[B2B] '
        : businessId === 'marketplace'
          ? '[Marketplace pro] '
          : '[Wholesale / B2B] '
      : businessId === 'saas'
        ? '[B2C] '
        : businessId === 'marketplace'
          ? '[Grand public] '
          : '[D2C] ';

  if (objective.startsWith('[')) return objective;
  return `${prefix}${baseTitle} — ${objective}`;
}
