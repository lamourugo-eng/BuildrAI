import { getBusinessPhaseHint } from '@/lib/coach/journey';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';

export type BusinessFamily = 'product' | 'services' | 'commerce' | 'platform' | 'impact' | 'creator';

export const BUSINESS_FAMILY: Record<BusinessId, BusinessFamily> = {
  saas: 'product',
  marketplace: 'platform',
  freelance: 'services',
  consulting: 'services',
  agency: 'services',
  ecommerce: 'commerce',
  impact: 'impact',
  content: 'creator',
  ofm: 'creator',
};

interface BusinessKpi {
  pipeline: string;
  revenue: string;
  unit: string;
  acquisition: string;
  retention: string;
}

const BUSINESS_KPI: Record<BusinessId, BusinessKpi> = {
  saas: {
    pipeline: 'essais actifs & démos bookées',
    revenue: 'MRR',
    unit: 'compte / abonné',
    acquisition: 'CAC & taux d\'activation J7',
    retention: 'churn mensuel & usage hebdo',
  },
  freelance: {
    pipeline: 'devis en cours & missions signées',
    revenue: 'CA facturé',
    unit: 'mission / TJM',
    acquisition: 'taux de conversion devis → mission',
    retention: 'missions récurrentes & recommandations',
  },
  ecommerce: {
    pipeline: 'panier abandonné & commandes en attente',
    revenue: 'CA boutique',
    unit: 'commande / panier moyen',
    acquisition: 'CAC & ROAS pub',
    retention: 'taux de réachat & email repeat',
  },
  agency: {
    pipeline: 'audits & propositions en cours',
    revenue: 'CA projets + récurrent',
    unit: 'projet / client',
    acquisition: 'taux conversion audit → mission',
    retention: 'contrats mensuels & renouvellements',
  },
  marketplace: {
    pipeline: 'early adopters offre & demande',
    revenue: 'GMV & commissions',
    unit: 'transaction',
    acquisition: 'coût recrutement par côté',
    retention: 'rétention vendeurs & acheteurs actifs',
  },
  impact: {
    pipeline: 'clients payeurs & partenaires',
    revenue: 'CA + financements',
    unit: 'bénéficiaire / client',
    acquisition: 'coût acquisition client payeur',
    retention: 'impact mesuré & fidélisation mission',
  },
  consulting: {
    pipeline: 'diagnostics & missions en négociation',
    revenue: 'CA conseil',
    unit: 'mission / diagnostic',
    acquisition: 'taux conversion RDV → diagnostic payé',
    retention: 'accompagnements trimestriels',
  },
  content: {
    pipeline: 'leads newsletter & ventes produits',
    revenue: 'CA contenu (ads, ventes, sponsoring)',
    unit: 'abonné / vente produit',
    acquisition: 'coût par abonné ou par vente',
    retention: 'ouverture email & achats répétés',
  },
  ofm: {
    pipeline: 'modèles OnlyFans en discussion & sous contrat OFM',
    revenue: 'revenus OnlyFans gérés (commission agence)',
    unit: 'modèle OnlyFans actif',
    acquisition: 'coût recrutement modèle & taux conversion outreach → contrat',
    retention: 'durée contrat & croissance revenus modèle ($/mois)',
  },
};

const BUSINESS_TITLE_OVERLAYS: Partial<
  Record<BusinessId, Partial<Record<string, string>>>
> = {
  saas: {
    'Chiffre du pipeline': 'Pipeline SaaS : essais, démos & MRR potentiel',
    'Mesurer coût d\'acquisition': 'CAC SaaS & coût par essai activé',
    'Calculer marge par client / vente': 'Marge par compte & coût serveur/support',
    'Calculer LTV simple': 'LTV vs CAC. Ratio de viabilité SaaS',
    'Objectif CA mois 2': 'Objectif MRR mois 2',
    'Tableau de bord semestre (CA, marge)': 'Dashboard SaaS : MRR, churn, CAC, LTV',
  },
  freelance: {
    'Chiffre du pipeline': 'Pipeline missions : devis & RDV qualifiés',
    'Calculer marge par client / vente': 'Marge nette par mission (TJM − charges)',
    'Quota prospection quotidien': 'Quota outreach & relances missions',
  },
  ecommerce: {
    'Chiffre du pipeline': 'Pipeline e-commerce : paniers & commandes',
    'Mesurer coût d\'acquisition': 'CAC & ROAS par canal pub',
    'Calculer LTV simple': 'LTV client (panier × fréquence achat)',
  },
  agency: {
    'Chiffre du pipeline': 'Pipeline agence : audits & propositions',
    'Checklist livraison': 'Checklist delivery projet type',
  },
  marketplace: {
    'Chiffre du pipeline': 'Liquidité : offreurs & demandeurs actifs',
    'Mesurer coût d\'acquisition': 'Coût acquisition par early adopter',
  },
  ofm: {
    'Chiffre du pipeline': 'Pipeline OFM : modèles OnlyFans en discussion & contrats',
    'Relances personnalisées': 'Relance modèles OnlyFans tièdes (charte OFM jointe)',
    'Mesurer coût d\'acquisition': 'Coût recrutement modèle OnlyFans (temps + outils)',
    'Documenter ton process de vente': 'Process commercial agence OFM (call → contrat)',
    'Checklist livraison': 'Checklist ops modèle OnlyFans (chatting, contenu, reporting)',
    'Calculer marge par client / vente': 'Marge agence OFM (commission − chatters − outils)',
    'Contenu marque (story, valeurs)': 'Charte agence OFM & valeurs (éthique, transparence)',
  },
};

function buildTitleTaskOverlays(): Record<BusinessId, Record<string, string[]>> {
  const sharedAudit = (id: BusinessId, metrics: string[]) => [
    `Liste tout ce que tu as lancé ce mois 1 (${metrics.join(', ')})`,
    'Classe : à garder / à améliorer / à abandonner',
    `Fixe ton KPI #1 ${businessProfiles[id].name} pour le mois 2`,
  ];

  return {
    saas: {
      'Audit du premier mois': sharedAudit('saas', ['landing', 'essais', 'démos', 'MRR']),
      'Chiffre du pipeline': [
        'Comptez essais actifs & démos bookées dans un tableau',
        'Estime le MRR si 100 % des essais convertissent',
        'Identifie les 5 comptes à closer en priorité',
      ],
      'Mesurer coût d\'acquisition': [
        'CAC = dépenses acquisition ÷ nouveaux essais activés',
        'Compare CAC par canal (LinkedIn, SEO, communauté…)',
        'Fixe un plafond CAC acceptable vs LTV estimée',
      ],
      'Calculer LTV simple': [
        'LTV = ARPU mensuel × durée vie moyenne (mois)',
        'Compare LTV/CAC. Cible > 3',
        'Identifie 1 levier rétention (onboarding, email, feature)',
      ],
    },
    freelance: {
      'Audit du premier mois': sharedAudit('freelance', ['page', 'devis', 'RDV', 'missions']),
      'Chiffre du pipeline': [
        'Liste devis en attente avec montant et probabilité',
        'Calcule CA potentiel pipeline 30 jours',
        'Priorise 3 missions à closer cette semaine',
      ],
      'Relances personnalisées': [
        'Relance 5 prospects avec un angle nouveau (cas client, insight)',
        'Propose un créneau RDV 20 min. Pas seulement un email',
        'Planifie relance J+7 pour les sans réponse',
      ],
    },
    ecommerce: {
      'Audit du premier mois': sharedAudit('ecommerce', ['produits', 'pub', 'commandes', 'marge']),
      'Mesurer coût d\'acquisition': [
        'CAC = budget pub ÷ commandes attribuées',
        'ROAS par campagne. Coupez celle < 2',
        'Compare CAC organique vs paid',
      ],
      'Calculer marge par client / vente': [
        'Marge % = (prix vente − coût produit − livraison) / prix',
        'Identifie SKU le plus et le moins rentable',
        'Teste bundle pour augmenter panier moyen',
      ],
    },
    agency: {
      'Audit du premier mois': sharedAudit('agency', ['niche', 'audits', 'propositions', 'missions']),
      'Checklist livraison': [
        'Checklist projet type : kick-off, livrables, validation, facturation',
        'Assignez responsable client vs interne par étape',
        'Teste sur la prochaine mission',
      ],
    },
    marketplace: {
      'Audit du premier mois': sharedAudit('marketplace', ['offreurs', 'demandeurs', 'transactions']),
      'Chiffre du pipeline': [
        'Comptez early adopters actifs de chaque côté',
        'Ratio offre/demande. Où est le goulot ?',
        '5 actions pour débloquer le côté le plus faible',
      ],
    },
    impact: {
      'Audit du premier mois': sharedAudit('impact', ['offre', 'clients payeurs', 'impact mesuré']),
      '5 retours clients récurrents': [
        'Interviews : impact perçu + willingness to pay',
        'Mesure impact chiffré (bénéficiaires, emplois…)',
        'Note demandes non couvertes par l\'offre actuelle',
      ],
    },
    consulting: {
      'Audit du premier mois': sharedAudit('consulting', ['diagnostics', 'missions', 'CA']),
      'Modèle de proposition': [
        'Structure : enjeu → méthode 3 phases → livrables → prix',
        'Cas type chiffré (sans nom client)',
        'Template réutilisable. 80 % personnalisable',
      ],
    },
    content: {
      'Audit du premier mois': sharedAudit('content', ['contenu', 'audience', 'monétisation']),
      'Publier ou partager 1 contenu utile': [
        'Publie sur plateforme #1 avec CTA vers offre ou newsletter',
        'Hook 3 secondes + valeur + CTA en fin',
        'Mesure vues, clics, inscriptions',
      ],
    },
    ofm: {
      'Audit du premier mois': sharedAudit('ofm', [
        'page agence OFM',
        'modèles OnlyFans contactés',
        'contrats signés',
      ]),
      'Chiffre du pipeline': [
        'Liste modèles OnlyFans : discussion / essai / contrat actif',
        'Estime les revenus OnlyFans gérables sur 30 jours (commission agence)',
        'Priorise 3 modèles à closer avec charte OFM',
      ],
      'Relances personnalisées': [
        'Relance 5 modèles OnlyFans avec charte OFM éthique jointe',
        'Montre process pro (chatting, acquisition, reporting). Pas de promesse de $ fixe',
        'Propose call 20 min. Le modèle reste décisionnaire sur le contenu',
      ],
      'Documenter ton process de vente': [
        'Étapes : outreach → call découverte → contrat OFM → onboarding OnlyFans',
        'Template contrat : services, commission %, durée, clause sortie',
        'Checklist onboarding : accès, planning contenu, règles chatting',
      ],
      'Checklist livraison': [
        'Checklist ops hebdo : calendrier contenu, shifts chatting, stats OnlyFans',
        'Reporting modèle : abonnés, revenus, PPV. Transparence totale',
        'Teste sur le premier modèle signé',
      ],
      'Calculer marge par client / vente': [
        'Marge = commission OnlyFans − coût chatters − outils − temps manager',
        'Commission cible 20–40 % selon services (chatting seul vs full management)',
        'Affiche toujours la part nette du modèle en premier',
      ],
    },
  };
}

const TITLE_TASK_OVERLAYS = buildTitleTaskOverlays();

const WEEK_FOCUS_TASKS: Record<
  BusinessFamily,
  Record<number, Record<number, string[]>>
> = {
  product: {
    2: {
      1: ['Consolide métriques produit mois 1', 'Priorise 3 comptes ou essais chauds', 'Documente friction onboarding #1'],
      2: ['Améliore rétention J7 des nouveaux comptes', 'Email ou in-app pour utilisateurs inactifs', 'Collecte 3 retours utilisateurs'],
      3: ['Ajuste packaging ou pricing selon retours', 'Test A/B landing ou pricing page', 'Mesure impact sur conversion'],
      4: ['Automatise 1 étape onboarding ou support', 'Fixe objectif MRR mois suivant', 'Planifie rituels hebdo produit'],
    },
    3: {
      1: ['Double effort sur canal acquisition #1', '10 outbound ou contenus ciblés', 'Mesure taux conversion canal'],
      2: ['Publie contenu thought leadership niche', 'Recycle témoignage client produit', 'CTA vers essai ou démo'],
      3: ['Contacte 2 partenaires intégration ou revendeurs', 'Proposition co-marketing win-win', 'Suivi partenaires actifs'],
      4: ['Quota prospection ou contenu quotidien', 'Pipeline visuel MRR potentiel', '1 démo ou essai minimum / jour'],
    },
    4: {
      1: ['Calcule marge par compte (infra + support)', 'Identifie segment client le plus rentable', 'Coupez feature ou plan non rentable'],
      2: ['Documente process support & onboarding', 'Template réponse tickets fréquents', 'Réduisez temps résolution'],
      3: ['Automatise email lifecycle (essai, churn)', 'Intègre outil analytics produit', 'Mesure temps gagné'],
      4: ['Revue trimestre : garder 3 priorités produit', 'Coupez initiative non alignée MRR', 'Plan 30 jours ciblé'],
    },
    5: {
      1: ['5 interviews clients power users', 'Demande feature ou upsell non couverte', 'Priorise 1 opportunité expansion'],
      2: ['Esquissez offre upsell ou plan supérieur', 'Teste auprès 3 clients existants', 'Pricing expansion revenue'],
      3: ['Calcule NRR ou expansion MRR', 'Programme rétention ou success', 'Win-back comptes churnés'],
      4: ['Soft launch feature ou plan premium', 'Mesure adoption et feedback', 'Ajuste avant GA'],
    },
    6: {
      1: ['Dashboard MRR, churn, CAC, LTV consolidé', 'Tendance 6 mois. Insights clés', '3 décisions data-driven'],
      2: ['Analyse cohortes rétention', 'Interview churn + satisfait', 'Leçons produit & go-to-market'],
      3: ['Liste tâches à déléguer (support, sales)', 'Brief 1er recrutement ou freelance', 'Process documenté'],
      4: ['Vision 6 mois : MRR cible & roadmap', '3 priorités stratégiques S2', 'Plan scale ou préparation exit'],
    },
  },
  services: {
    2: {
      1: ['Bilan missions et devis mois 1', 'Pipeline CA 30 jours', 'Top 3 prospects à closer'],
      2: ['Relance prospects tièdes personnalisée', 'Email post-mission satisfaction', 'Demande témoignage ou recommandation'],
      3: ['Ajuste forfait ou TJM selon retours', 'Teste package découverte', 'Documente objections prix'],
      4: ['Automatise devis ou prise RDV', 'Objectif CA mois suivant', 'Rituel prospection hebdo'],
    },
    3: {
      1: ['Double canal qui génère le plus de RDV', '10 messages ou appels qualifiés', 'Mesure taux conversion'],
      2: ['Contenu expertise (LinkedIn, article)', 'Cas client anonymisé', 'CTA audit ou RDV'],
      3: ['3 partenaires complémentaires identifiés', 'Proposition co-référencement', 'Suivi introductions'],
      4: ['Quota prospection quotidien', 'Pipeline missions visualisé', '1 proposition minimum / semaine'],
    },
    4: {
      1: ['Marge par type de mission', 'Clients les plus rentables', 'Coupez offre sous marge'],
      2: ['Process delivery standardisé', 'Template livrable récurrent', 'Checklist qualité mission'],
      3: ['Automatise facturation ou reporting', 'Outil CRM ou Notion pipeline', 'Temps gagné mesuré'],
      4: ['Revue trimestre services', '3 priorités commerciales', 'Plan 30 jours acquisition'],
    },
    5: {
      1: ['5 retours clients missions récentes', 'Demande récurrente non couverte', 'Esquisse offre complémentaire'],
      2: ['Package premium ou rétainer', 'Test 3 clients fidèles', 'Argumentaire différenciation'],
      3: ['LTV client services (missions/an)', 'Programme fidélisation ou rétainer', 'Win-back clients inactifs'],
      4: ['Soft launch nouvelle offre', 'Mesure adoption', 'Ajuste pricing ou scope'],
    },
    6: {
      1: ['CA, marge, taux conversion consolidés', 'Canal le plus performant', '3 décisions stratégiques'],
      2: ['Pourquoi clients reviennent ou partent', '2 interviews + 1 lost deal', 'Leçons vente & delivery'],
      3: ['Tâches à déléguer ou sous-traiter', 'Brief freelance ou associé', 'Process délégation'],
      4: ['Vision CA 6 mois', '3 priorités S2', 'Plan croissance ou niche'],
    },
  },
  commerce: {
    2: {
      1: ['Bilan ventes et pub mois 1', 'SKU ou collection stars', 'Stock ou fournisseur à optimiser'],
      2: ['Relance paniers abandonnés', 'Email post-achat satisfaction', 'Demande avis produit'],
      3: ['Ajuste prix ou bundle', 'Test promo limitée', 'Marge par SKU'],
      4: ['Automatise email e-commerce', 'Objectif CA mois 2', 'Rituel analyse ROAS hebdo'],
    },
    3: {
      1: ['Double canal pub ou organique gagnant', '10 contenus produit ou UGC', 'Mesure ROAS'],
      2: ['Contenu marque ou lifestyle', 'Recycle avis client', 'CTA achat direct'],
      3: ['Partenariat influence micro', 'Code promo partenaire', 'Mesure ventes attribuées'],
      4: ['Quota contenu ou pub quotidien', 'Pipeline commandes', 'Optimise fiche produit #1'],
    },
    4: {
      1: ['Marge par SKU et panier', 'Coupez produit non rentable', 'Négociez fournisseur ou MOQ'],
      2: ['Process commande → expédition', 'Checklist qualité produit', 'Délai livraison moyen'],
      3: ['Automatise email lifecycle e-com', 'Outil inventory ou Shopify flow', 'Temps ops gagné'],
      4: ['Revue trimestre boutique', '3 priorités croissance', 'Plan stock & pub 30 jours'],
    },
    5: {
      1: ['5 retours clients acheteurs', 'Demande produit ou variante', 'Esquisse collection #2'],
      2: ['Soft launch nouvelle gamme', 'Pricing bundle ou abonnement', 'Test audience fidèle'],
      3: ['LTV acheteur & réachat', 'Programme fidélité ou email repeat', 'Win-back inactifs 90j'],
      4: ['Campagne lancement produit #2', 'Mesure adoption', 'Ajuste stock & pub'],
    },
    6: {
      1: ['CA, marge, CAC, ROAS 6 mois', 'Meilleur SKU et canal', '3 décisions data'],
      2: ['Taux réachat & satisfaction', 'Interview client + avis négatif', 'Leçons produit & marque'],
      3: ['Externaliser prépa commande ou SAV', 'Brief logistique ou VA', 'Process documenté'],
      4: ['Vision marque 6 mois', '3 priorités S2', 'Plan wholesale ou scale D2C'],
    },
  },
  platform: {
    2: {
      1: ['Bilan liquidité mois 1', 'Ratio offre/demande', 'Friction transaction #1'],
      2: ['Relance early adopters inactifs', 'Améliore onboarding côté faible', 'Feedback 3 utilisateurs'],
      3: ['Ajuste commission ou incitation', 'Test promo early adopter', 'Mesure transactions'],
      4: ['Automatise onboarding 1 côté', 'Objectif GMV mois 2', 'Rituel recrutement manuel'],
    },
    3: {
      1: ['Double recrutement côté prioritaire', '10 outreach manuels qualifiés', 'Mesure activation'],
      2: ['Contenu valeur pour early adopters', 'Success story 1 transaction', 'CTA rejoindre plateforme'],
      3: ['Partenariat apporteur d\'un côté', 'Programme parrainage', 'Suivi partenaires'],
      4: ['Quota recrutement quotidien', 'Pipeline utilisateurs actifs', '1 transaction minimum / semaine'],
    },
    4: {
      1: ['Take rate & coût par transaction', 'Segment le plus rentable', 'Coupez feature non utilisée'],
      2: ['Process modération ou matching', 'Checklist confiance & safety', 'Temps ops par transaction'],
      3: ['Automatise matching ou notification', 'Outil no-code workflow', 'Mesure temps gagné'],
      4: ['Revue trimestre plateforme', '3 priorités liquidité', 'Plan 30 jours recrutement'],
    },
    5: {
      1: ['5 retours utilisateurs actifs', 'Feature demandée non couverte', 'Esquisse v2 ou niche'],
      2: ['Offre premium ou commission tier', 'Test early adopters', 'Argumentaire confiance'],
      3: ['LTV & rétention 2 côtés', 'Programme fidélisation', 'Réactivez inactifs 30j'],
      4: ['Soft launch feature ou zone geo', 'Mesure GMV impact', 'Ajuste take rate'],
    },
    6: {
      1: ['GMV, take rate, CAC consolidés', 'Liquidité par cohorte', '3 décisions stratégiques'],
      2: ['Pourquoi users restent ou partent', 'Interview 2 actifs + 1 churn', 'Leçons produit marketplace'],
      3: ['Déléguer modération ou support', 'Brief ops ou community', 'Process scale'],
      4: ['Vision GMV 6 mois', '3 priorités S2', 'Plan levée ou expansion geo'],
    },
  },
  impact: {
    2: {
      1: ['Bilan impact + revenus mois 1', 'Clients payeurs vs bénéficiaires', 'KPI impact #1'],
      2: ['Relance partenaires ou clients', 'Story impact récente', 'Transparence utilisation fonds'],
      3: ['Ajuste modèle économique mixte', 'Test tarif ou don récurrent', 'Mesure viabilité'],
      4: ['Automatise reporting impact', 'Objectif mois 2', 'Rituel mesure impact hebdo'],
    },
    3: {
      1: ['Double canal mission ou B2B', '10 contacts institutions ou clients', 'Mesure conversion'],
      2: ['Contenu impact + transparence', 'Témoignage bénéficiaire', 'CTA soutien ou achat'],
      3: ['Partenariat ONG ou entreprise', 'Proposition co-impact', 'Suivi partenaires'],
      4: ['Quota outreach mission', 'Pipeline financements', '1 RDV partenaire / semaine'],
    },
    4: {
      1: ['Marge par offre impact', 'Mix revenus vs subventions', 'Coupez activité non viable'],
      2: ['Process mesure impact', 'Indicateurs reproductibles', 'Reporting donateurs/clients'],
      3: ['Automatise collecte données impact', 'Outil simple (Sheet, Typeform)', 'Temps gagné'],
      4: ['Revue trimestre ESS', '3 priorités impact + CA', 'Plan 30 jours'],
    },
    5: {
      1: ['5 retours bénéficiaires & payeurs', 'Besoin non couvert', 'Esquisse offre #2'],
      2: ['Offre complémentaire impact', 'Test communauté ou B2B', 'Pricing éthique'],
      3: ['LTV mixte & récurrence don', 'Programme ambassadeurs', 'Win-back soutiens'],
      4: ['Soft launch offre #2', 'Mesure impact + revenus', 'Ajuste communication'],
    },
    6: {
      1: ['Tableau impact + CA 6 mois', 'Tendance viabilité', '3 décisions stratégiques'],
      2: ['Fidélisation donateurs/clients', 'Interviews qualitatives', 'Leçons modèle ESS'],
      3: ['Déléguer ops ou communication', 'Brief bénévolat ou freelance', 'Process documenté'],
      4: ['Vision impact 6 mois chiffrée', '3 priorités S2', 'Plan financement ou scale'],
    },
  },
  creator: {
    2: {
      1: ['Bilan audience & monétisation mois 1', 'Plateforme #1 performance', 'Produit ou offre star'],
      2: ['Relance leads ou sponsors tièdes', 'Contenu valeur + CTA', 'Demande feedback audience'],
      3: ['Ajuste pricing produit ou pack', 'Test bundle contenu + offre', 'Mesure conversion'],
      4: ['Automatise email ou DM funnel', 'Objectif revenus mois 2', 'Rituel création hebdo'],
    },
    3: {
      1: ['Double publication plateforme #1', '10 posts ou emails qualité', 'Mesure engagement → leads'],
      2: ['Contenu signature creator', 'Recycle top performer', 'CTA produit ou newsletter'],
      3: ['Collab ou parrainage creator', 'Proposition win-win audience', 'Suivi collabs'],
      4: ['Quota création quotidien', 'Pipeline sponsors ou ventes', '1 vente ou deal minimum'],
    },
    4: {
      1: ['Revenus par canal (ads, ventes, sponsors)', 'Coupez canal non rentable', 'Focus monétisation #1'],
      2: ['Process création → publication', 'Template contenu réutilisable', 'Batch production'],
      3: ['Automatise scheduling ou email', 'Outil creator stack', 'Temps gagné'],
      4: ['Revue trimestre creator', '3 priorités croissance audience', 'Plan 30 jours contenu'],
    },
    5: {
      1: ['5 retours audience ou clients', 'Demande produit ou format', 'Esquisse offre #2'],
      2: ['Lancement produit ou tier premium', 'Test communauté close', 'Pricing creator-friendly'],
      3: ['LTV abonné ou acheteur', 'Programme membres ou email VIP', 'Win-back inactifs'],
      4: ['Soft launch offre #2', 'Mesure revenus & engagement', 'Ajuste positioning'],
    },
    6: {
      1: ['Revenus, audience, conversion 6 mois', 'Meilleur canal monétisation', '3 décisions data'],
      2: ['Fidélité audience', 'Interview fan + churn', 'Leçons contenu & offre'],
      3: ['Déléguer montage, community ou ops', 'Brief editor ou VA', 'Process creator business'],
      4: ['Vision creator 6 mois', '3 priorités S2', 'Plan équipe ou diversification revenus'],
    },
  },
};

const OFM_WEEK_FOCUS: Record<number, Record<number, string[]>> = {
  2: {
    1: ['Bilan mois 1 OFM : modèles contactés, contrats, revenus commission', 'Pipeline modèles OnlyFans 30 j', 'Top 3 modèles à closer'],
    2: ['Relance modèles OnlyFans tièdes avec charte OFM', 'Améliore onboarding ou reporting', 'Feedback 1 modèle actif'],
    3: ['Ajuste packages OFM ou commission %', 'Teste offre chatting seul vs full management', 'Documente objections modèles'],
    4: ['Automatise reporting revenus OnlyFans', 'Objectif modèles signés mois suivant', 'Rituel prospection Twitter/X hebdo'],
  },
  3: {
    1: ['Double outreach modèles OnlyFans sur canal #1', '10 DM qualifiés avec charte jointe', 'Mesure taux réponse → call'],
    2: ['Contenu pro agence OFM (éthique, process)', 'Témoignage modèle anonymisé', 'CTA candidature modèle'],
    3: ['Réseau managers OFM / recrutement chatters', 'Proposition partenariat win-win', 'Suivi introductions'],
    4: ['Quota prospection modèles quotidien', 'Pipeline visuel contrats OFM', '1 call découverte minimum / jour'],
  },
  4: {
    1: ['Marge par modèle OnlyFans (commission − chatters − outils)', 'Modèle le plus rentable pour l\'agence', 'Coupez service non rentable'],
    2: ['Process ops OFM : chatting, contenu, reporting', 'Template shift chatter', 'Checklist onboarding modèle'],
    3: ['Automatise reporting stats OnlyFans', 'Outil CRM modèles / Notion ops', 'Temps gagné mesuré'],
    4: ['Revue trimestre agence OFM', '3 priorités recrutement modèles', 'Plan 30 jours acquisition'],
  },
  5: {
    1: ['5 retours modèles OnlyFans actifs', 'Demande service non couverte', 'Esquisse offre OFM #2 (ex. Chatting premium)'],
    2: ['Package premium ou plus de modèles', 'Test 3 modèles fidèles', 'Argumentaire différenciation agence'],
    3: ['LTV modèle (revenus OnlyFans × durée contrat)', 'Rétention modèles & renouvellement contrat', 'Win-back modèles partis'],
    4: ['Soft launch nouveau service OFM', 'Mesure adoption', 'Ajuste commission ou scope'],
  },
  6: {
    1: ['Commission totale, modèles actifs, revenus gérés 6 mois', 'Canal recrutement le plus efficace', '3 décisions stratégiques OFM'],
    2: ['Pourquoi modèles restent ou partent', 'Interview modèle satisfait + churn', 'Leçons ops & acquisition OnlyFans'],
    3: ['Déléguer chatting ou acquisition', 'Brief chatter ou VA OFM', 'Process délégation documenté'],
    4: ['Vision agence OFM 6 mois', '3 priorités S2 (modèles, équipe, process)', 'Plan scale ou vente agence'],
  },
};

export function resolveBusinessDayTitle(
  businessId: BusinessId,
  baseTitle: string
): string {
  return BUSINESS_TITLE_OVERLAYS[businessId]?.[baseTitle] ?? baseTitle;
}

export function resolveBusinessWeekObjective(
  businessId: BusinessId,
  month: number,
  week: number,
  defaultObjective: string
): string {
  return defaultObjective.replace(/ton modèle/gi, businessProfiles[businessId].name);
}

export function getBusinessSemesterTaskOverlay(
  businessId: BusinessId,
  month: number,
  week: number,
  title: string
): string[] | null {
  const byTitle = TITLE_TASK_OVERLAYS[businessId]?.[title];
  if (byTitle?.length) return byTitle;

  if (businessId === 'ofm') {
    const ofmWeek = OFM_WEEK_FOCUS[month]?.[week];
    if (ofmWeek?.length) return ofmWeek;
  }

  const family = BUSINESS_FAMILY[businessId];
  const weekTasks = WEEK_FOCUS_TASKS[family]?.[month]?.[week];
  if (weekTasks?.length) return weekTasks;

  return null;
}

export function getBusinessSemesterTip(
  businessId: BusinessId,
  month: number,
  week: number,
  title: string,
  phaseId: number
): string | undefined {
  const phaseHint = getBusinessPhaseHint(businessId, phaseId);
  const profile = businessProfiles[businessId];

  const titleTips: Partial<Record<string, string>> = {
    'Audit du premier mois': `Compare pipeline vs objectif. Une seule métrique ${BUSINESS_KPI[businessId].revenue} à améliorer en priorité.`,
    'Mesurer coût d\'acquisition': `${profile.name} : suis ${BUSINESS_KPI[businessId].acquisition} avant d'augmenter le budget.`,
    'Calculer LTV simple': `LTV > 3× CAC = signal vert pour accélérer l'acquisition ${profile.name}.`,
  };

  if (titleTips[title]) return titleTips[title];
  if (phaseHint) return phaseHint;
  return profile.firstSteps[(month - 2 + week) % profile.firstSteps.length];
}

export function getBusinessKpi(businessId: BusinessId): BusinessKpi {
  return BUSINESS_KPI[businessId];
}
