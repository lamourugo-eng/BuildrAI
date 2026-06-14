import { businessProfiles, type BusinessId } from '@/lib/quiz/data';

export interface LibraryResource {
  id: string;
  title: string;
  description: string;
  /** Explication claire : quoi faire concrètement avec cette ressource. */
  howToUse: string;
  /** Durée indicative pour appliquer la ressource. */
  timeEstimate?: string;
  /** Phase coach 1–8 la plus liée (indicatif). */
  coachPhase?: number;
  /** Chapitre parcours 1–6 le plus lié (indicatif). */
  roadmapChapter?: number;
  items?: string[];
  template?: string;
  copyable?: boolean;
}

export interface LibraryCategory {
  id: string;
  icon: string;
  title: string;
  resources: LibraryResource[];
}

interface BusinessLibraryContext {
  label: string;
  nicheExamples: string[];
  modelHighlights: string[];
  clientType: string;
  offerType: string;
  channel: string;
}

const BUSINESS_CONTEXT: Record<BusinessId, BusinessLibraryContext> = {
  saas: {
    label: 'SaaS',
    nicheExamples: [
      'CRM pour artisans du bâtiment',
      'Outil de facturation pour freelances',
      'Dashboard analytics pour e-commerçants',
      'Gestion de réservations pour coachs',
      'Automatisation RH pour PME < 20 salariés',
    ],
    modelHighlights: [
      'Micro-SaaS B2B vertical',
      'SaaS B2C freemium',
      'API-as-a-service',
      'Plateforme no-code',
      'Outil IA métier',
    ],
    clientType: 'entreprises ou équipes',
    offerType: 'abonnement logiciel',
    channel: 'LinkedIn et cold email B2B',
  },
  freelance: {
    label: 'Freelance',
    nicheExamples: [
      'Rédaction web SEO pour SaaS',
      'Design UI pour startups',
      'Développement no-code Bubble',
      'Montage vidéo pour créateurs',
      'Community management local',
    ],
    modelHighlights: [
      'Prestation récurrente (retainer)',
      'Mission projet forfait',
      'Pack produit + service',
      'White-label pour agences',
      'Micro-agence solo',
    ],
    clientType: 'PME, startups ou indépendants',
    offerType: 'prestation sur mesure',
    channel: 'LinkedIn, Malt et recommandations',
  },
  ecommerce: {
    label: 'E-commerce',
    nicheExamples: [
      'Accessoires fitness éco-responsables',
      'Décoration minimaliste made in France',
      'Compléments bien-être niche',
      'Produits pour animaux premium',
      'Papeterie créative personnalisable',
    ],
    modelHighlights: [
      'Marque D2C Shopify',
      'Dropshipping test produit',
      'Print on demand',
      'Abonnement box mensuelle',
      'Marketplace + marque propre',
    ],
    clientType: 'acheteurs en ligne',
    offerType: 'produit physique ou digital',
    channel: 'Instagram, TikTok Shop et email',
  },
  agency: {
    label: 'Agence',
    nicheExamples: [
      'Acquisition leads B2B LinkedIn',
      'Performance ads pour e-commerce',
      'Branding pour restaurateurs',
      'SEO local pour professions libérales',
      'Social media pour immobilier',
    ],
    modelHighlights: [
      'Agence performance',
      'Agence créative',
      'Agence growth full-funnel',
      'Boutique spécialisée (1 canal)',
      'Agence white-label',
    ],
    clientType: 'entreprises avec budget marketing',
    offerType: 'accompagnement mensuel',
    channel: 'LinkedIn, études de cas et réseau',
  },
  marketplace: {
    label: 'Marketplace',
    nicheExamples: [
      'Mise en relation coachs / clients',
      'Location matériel événementiel local',
      'Freelances créatifs / marques',
      'Services à domicile géolocalisés',
      'Formation / mentorat par secteur',
    ],
    modelHighlights: [
      'Marketplace verticale B2B',
      'Place de marché locale',
      'Modèle commission',
      'Abonnement + commission',
      'Curated marketplace premium',
    ],
    clientType: 'offreurs et demandeurs de services',
    offerType: 'plateforme de mise en relation',
    channel: 'acquisition bi-côté (supply puis demand)',
  },
  impact: {
    label: 'Impact / ESS',
    nicheExamples: [
      'Recyclage / économie circulaire locale',
      'Insertion professionnelle',
      'Éducation / accès au numérique',
      'Alimentation durable et locale',
      'Mobilité douce en zone rurale',
    ],
    modelHighlights: [
      'Association + modèle hybride',
      'Coopérative',
      'Entreprise à mission',
      'Social business rentable',
      'Projet subventionné + revenus',
    ],
    clientType: 'bénéficiaires, partenaires et financeurs',
    offerType: 'solution à impact mesurable',
    channel: 'partenariats, subventions et storytelling',
  },
  consulting: {
    label: 'Consulting',
    nicheExamples: [
      'Stratégie digitale PME industrielles',
      'Organisation ops pour scale-ups',
      'Conformité / process pour cabinets',
      'Transformation IA métier',
      'Pricing & offre pour freelances',
    ],
    modelHighlights: [
      'Cabinet niche expert',
      'Consulting produit (framework)',
      'Diagnostic + implémentation',
      'Formation + conseil',
      'Interim management',
    ],
    clientType: 'dirigeants et décideurs',
    offerType: 'mission de conseil',
    channel: 'LinkedIn, conférences et réseau expert',
  },
  content: {
    label: 'Créateur de contenu',
    nicheExamples: [
      'Productivité pour entrepreneurs',
      'Finance perso pour jeunes actifs',
      'Tech no-code en français',
      'Bien-être & sport à domicile',
      'Voyage slow & remote work',
    ],
    modelHighlights: [
      'Newsletter premium',
      'Chaîne YouTube + sponsors',
      'Personal brand + formations',
      'Podcast + affiliation',
      'Créateur B2B (thought leader)',
    ],
    clientType: 'audience et sponsors',
    offerType: 'contenu + monétisation',
    channel: 'YouTube, newsletter et réseaux sociaux',
  },
  ofm: {
    label: 'OnlyFans Management (OFM)',
    nicheExamples: [
      'Modèles OnlyFans lifestyle débutantes',
      'Modèles fitness / wellness OnlyFans',
      'Modèles gaming / entertainment OnlyFans',
      'Modèles artistiques OnlyFans',
      'Modèles coachs / experts OnlyFans',
    ],
    modelHighlights: [
      'Agence OnlyFans Management',
      'Manager solo 2–5 modèles OnlyFans',
      'Spécialiste acquisition abonnés OnlyFans',
      'Ops chatting & contenu (back-office OFM)',
      'Partenariat revenue share transparent sur OnlyFans',
    ],
    clientType: 'modèles OnlyFans',
    offerType: 'OnlyFans Management (chatting, acquisition, ops)',
    channel: 'DM Twitter/X, Instagram et réseau modèles OnlyFans',
  },
};

const FIFTY_MODELS_BASE = [
  'Micro-SaaS B2B', 'SaaS B2C freemium', 'Marketplace verticale', 'Agence performance',
  'Agence créative', 'Freelance premium', 'Studio retainer', 'E-commerce D2C',
  'Dropshipping test', 'Print on demand', 'Box abonnement', 'Formation en ligne',
  'Coaching 1:1', 'Coaching groupe', 'Membership community', 'Newsletter payante',
  'Chaîne YouTube monétisée', 'Podcast + sponsors', 'Affiliation niche', 'White-label service',
  'Consulting diagnostic', 'Consulting implémentation', 'Interim management', 'Productized service',
  'No-code agency', 'Automatisation IA', 'API-as-a-service', 'Plugin / extension',
  'Template marketplace', 'Notion templates', 'Carrd landing packs', 'Done-for-you setup',
  'Lead gen local', 'SEO local service', 'Social media boutique', 'UGC agency',
  'Influence micro', 'OnlyFans Management (OFM)', 'Agence chatting OnlyFans', 'Event ticketing local',
  'Location matériel P2P', 'Services à domicile', 'Recrutement niche', 'Job board vertical',
  'Annuaire premium', 'Comparateur affilié', 'Marque private label', 'Import-export niche',
  'Social business', 'Franchise légère',
];

function fiftyModelsFor(businessId: BusinessId): string[] {
  const ctx = BUSINESS_CONTEXT[businessId];
  const prioritized = [
    ...ctx.modelHighlights,
    ...FIFTY_MODELS_BASE.filter((m) => !ctx.modelHighlights.includes(m)),
  ];
  return prioritized.slice(0, 50);
}

function ideaGrid(businessId: BusinessId): string[] {
  const ctx = BUSINESS_CONTEXT[businessId];
  return [
    `Problème précis : quel pain point pour ${ctx.clientType} ?`,
    `Client cible : qui paie, budget, urgence ?`,
    `Solution : en quoi votre ${ctx.offerType} est différent ?`,
    `Monétisation : prix, récurrence, marge ?`,
    `Acquisition : ${ctx.channel}. Coût réaliste ?`,
    `Validation : preuve en 7 jours (5 conversations) ?`,
    `Risques : réglementation, concurrence, dépendance plateforme ?`,
    `Score /10 : douleur client × volonté de payer × faisabilité.`,
  ];
}

function ideaChecklist(businessId: BusinessId): string[] {
  const ctx = BUSINESS_CONTEXT[businessId];
  return [
    `J'ai parlé à 5 ${ctx.clientType} cette semaine`,
    'Le problème est récurrent (pas un one-shot)',
    `Mon offre (${ctx.offerType}) se explique en 30 secondes`,
    'Je connais 3 concurrents et ma différence',
    'Un prospect a dit « je paierais pour ça »',
    `J'ai un canal d'acquisition réaliste (${ctx.channel})`,
    'Je peux livrer un MVP en moins de 30 jours',
    'Le modèle est rentable à 10 clients',
  ];
}

function buildLibrary(businessId: BusinessId): LibraryCategory[] {
  const biz = businessProfiles[businessId];
  const ctx = BUSINESS_CONTEXT[businessId];

  return [
    {
      id: 'idea',
      icon: '📚',
      title: 'Ressources pour trouver une idée de business',
      resources: [
        {
          id: 'models-50',
          title: 'Liste de 50 modèles de business',
          description: `50 modèles classés. Priorité ${ctx.label} et variantes proches.`,
          howToUse:
            'Parcourez la liste en 15 min. Retenez 3 modèles qui vous parlent, puis creusez un seul avec la grille d’analyse.',
          timeEstimate: '15–20 min',
          coachPhase: 1,
          roadmapChapter: 1,
          items: fiftyModelsFor(businessId),
        },
        {
          id: 'niches',
          title: 'Exemples de niches rentables',
          description: `Niches adaptées au modèle ${biz.name}.`,
          howToUse:
            'Choisissez une niche où vous avez un avantage (réseau, métier, passion). Discutez-en avec le coach pour la valider.',
          timeEstimate: '20 min',
          coachPhase: 2,
          roadmapChapter: 1,
          items: ctx.nicheExamples,
        },
        {
          id: 'grid',
          title: 'Grille pour analyser une idée',
          description: 'Évaluez votre idée en 8 critères avant de vous lancer.',
          howToUse:
            'Répondez par écrit à chaque ligne. Si le score global est faible, pivotez un critère à la fois. Ne abandonnez pas sans tester.',
          timeEstimate: '30–45 min',
          coachPhase: 1,
          roadmapChapter: 1,
          items: ideaGrid(businessId),
        },
        {
          id: 'checklist',
          title: 'Checklist « Est-ce que mon idée vaut le coup ? »',
          description: '8 validations minimum avant d\'investir temps et argent.',
          howToUse:
            'Cochez honnêtement. Moins de 5/8 ? Retournez sur la grille ou faites 5 conversations clients avant de continuer.',
          timeEstimate: '10 min',
          coachPhase: 1,
          roadmapChapter: 1,
          items: ideaChecklist(businessId),
        },
        {
          id: 'validation-7d',
          title: 'Plan validation 7 jours',
          description: 'Semaine type pour valider une idée sans construire un produit complet.',
          howToUse:
            'Suivez un jour à la fois. Notez les retours dans votre bloc-notes, puis partagez-les au coach le jour 7.',
          timeEstimate: '7 jours. 30 min/jour',
          coachPhase: 2,
          roadmapChapter: 1,
          items: [
            'J1 : Formuler problème + promesse en 2 phrases',
            'J2 : Lister 30 contacts ou prospects potentiels',
            'J3 : Préparer 5 questions de découverte (voir questionnaire client)',
            'J4 : 3 conversations réelles (appel ou DM)',
            'J5 : Synthèse. Le problème est-il confirmé ?',
            'J6 : Esquisser une offre MVP en une formule',
            'J7 : Décision GO / PIVOT / PAUSE. Bilan écrit',
          ],
        },
      ],
    },
    {
      id: 'launch',
      icon: '🛠️',
      title: 'Ressources pour lancer',
      resources: [
        {
          id: 'landing',
          title: 'Template de page de vente',
          description: `Structure landing page pour ${ctx.label}.`,
          howToUse:
            'Copiez le template, remplissez chaque section, publiez sur Carrd/Notion/Webflow. Demandez au coach de relire votre hero et CTA.',
          timeEstimate: '1–2 h',
          coachPhase: 5,
          roadmapChapter: 1,
          copyable: true,
          template: `## ${biz.name}. [Nom de l'offre]

**Accroche** : Résolvez [problème #1] pour ${ctx.clientType} en [délai].

### Le problème
- [Pain point 1]
- [Pain point 2]

### La solution (${ctx.offerType})
- [Bénéfice 1]
- [Bénéfice 2]
- [Bénéfice 3]

### Pour qui ?
${ctx.clientType} qui [situation précise].

### Offre & prix
- [Formule]. [Prix]€
- Garantie / engagement : [ex. Satisfait ou remboursé 14j]

### CTA
Réserver un appel / Commander / S'inscrire`,
        },
        {
          id: 'outreach',
          title: 'Script pour contacter des clients',
          description: `Script d'approche pour ${ctx.channel}.`,
          howToUse:
            'Personnalisez la 2e phrase pour chaque contact. Envoyez 5 messages par jour, notez les réponses dans le tableau KPI.',
          timeEstimate: '20 min / batch',
          coachPhase: 7,
          roadmapChapter: 2,
          copyable: true,
          template: `Bonjour [Prénom],

Je m'appelle [Nom] et j'aide ${ctx.clientType} à [résultat concret lié à ${ctx.offerType}].

J'ai vu que [observation personnalisée sur leur profil / entreprise].

Est-ce que [problème précis] fait partie de vos priorités en ce moment ?

Si oui, je peux partager [livrable gratuit : audit, checklist, démo] en 15 min. Sans engagement.

Bien à vous,
[Signature]`,
        },
        {
          id: 'email',
          title: 'Modèles d\'emails',
          description: '3 emails clés : premier contact, relance, closing.',
          howToUse:
            'Utilisez l’email 1 pour un premier contact froid. Relance uniquement si pas de réponse sous 72 h. Closing après un échange positif.',
          timeEstimate: '30 min',
          coachPhase: 7,
          roadmapChapter: 2,
          copyable: true,
          template: `--- Email 1 : Premier contact ---
Objet : [Prénom], question rapide sur [sujet]

Bonjour [Prénom],
[Script court personnalisé. Voir script outreach]

--- Email 2 : Relance J+3 ---
Objet : Re: [sujet]. Toujours d'actualité ?

Bonjour [Prénom],
Je me permets une relance courte. [1 phrase valeur].
Dispo pour 15 min cette semaine ?

--- Email 3 : Closing ---
Objet : Prochaine étape. [offre]

Bonjour [Prénom],
Suite à notre échange : [résumé besoin].
Je vous propose [offre ${ctx.offerType}] à [prix].
Lien / calendrier : [URL]`,
        },
        {
          id: 'social',
          title: 'Scripts LinkedIn / Instagram',
          description: `Messages DM et posts pour ${ctx.channel}.`,
          howToUse:
            'Commencez par 5 DM personnalisés. Publiez 1 post « 3 erreurs » par semaine pour crédibiliser votre expertise.',
          timeEstimate: '45 min / semaine',
          coachPhase: 7,
          roadmapChapter: 2,
          copyable: true,
          template: `--- LinkedIn DM ---
Salut [Prénom]. Ton post sur [sujet] m'a interpellé.
Je travaille avec ${ctx.clientType} sur [résultat]. Open à échanger 10 min ?

--- Instagram DM ---
Hey [Prénom] ! J'adore [contenu spécifique].
Je aide ${ctx.clientType} à [résultat]. Je peux t'envoyer [ressource gratuite] si ça t'intéresse ?

--- Post LinkedIn ---
J'ai analysé [X] ${ctx.clientType}.
3 erreurs qui freinent [résultat] :
1. [Erreur]
2. [Erreur]
3. [Erreur]
→ La solution : [votre approche ${ctx.label}]`,
        },
        {
          id: 'client-survey',
          title: 'Questionnaire client',
          description: 'Validez le besoin avant de construire l\'offre.',
          howToUse:
            'Posez ces questions en appel de 20 min (pas par email). Notez les réponses. Le coach peut vous aider à en tirer une offre.',
          timeEstimate: '20 min / appel',
          coachPhase: 2,
          roadmapChapter: 1,
          copyable: true,
          template: `Questionnaire découverte. ${biz.name}

1. Décrivez votre situation actuelle (contexte, taille, objectif)
2. Quel est votre problème #1 aujourd'hui ?
3. Qu'avez-vous déjà essayé ? Résultat ?
4. Si résolu, qu'est-ce que ça changerait (chiffre / temps / stress) ?
5. Budget ou enveloppe envisagée ?
6. Délai de décision ?
7. Qui décide ? Qui influence ?
8. Sur une échelle 1-10, urgence du problème ?
9. Préférence : [format adapté à ${ctx.offerType}]
10. OK pour un call de 20 min cette semaine ?`,
        },
        {
          id: 'pricing',
          title: 'Grille tarifaire (2–3 formules)',
          description: `Structurer vos prix pour ${ctx.offerType}.`,
          howToUse:
            'Remplissez les 3 colonnes. Gardez une formule d’entrée accessible et une premium crédible. Validez avec le coach phase 6.',
          timeEstimate: '45 min',
          coachPhase: 6,
          roadmapChapter: 2,
          copyable: true,
          template: `## Grille tarifaire. ${biz.name}

| | Entrée | Cœur de gamme | Premium |
|---|--------|---------------|---------|
| Nom | | | |
| Prix (€) | | | |
| Pour qui | ${ctx.clientType} | | |
| Livrables | | | |
| Délai | | | |
| Argument #1 | | | |

Règle : le cœur de gamme doit être celui que vous voulez vendre le plus.
Canal principal : ${ctx.channel}`,
        },
        {
          id: 'mvp-scope',
          title: 'Checklist cadrage MVP',
          description: 'Limitez le périmètre pour lancer en moins de 2 semaines.',
          howToUse:
            'Cochez chaque point. Si une case reste vide, réduisez le scope avant de coder ou d’acheter des outils.',
          timeEstimate: '20 min',
          coachPhase: 3,
          roadmapChapter: 1,
          items: [
            'Une seule promesse mesurable (pas 3)',
            'Un seul segment client pour la v1',
            'Livrable MVP listé en 5 bullet points max',
            'Prix de lancement fixé (même beta)',
            'Canal d’acquisition unique pour les 30 premiers jours',
            'Critère de succès chiffré (ex. 3 clients, 5 essais)',
            'Date de lancement dans les 14 jours',
            'Ce qui est volontairement EXCLU de la v1',
          ],
        },
      ],
    },
    {
      id: 'ai',
      icon: '🤖',
      title: 'Ressources IA',
      resources: [
        {
          id: 'prompt-content',
          title: 'Prompt. Trouver des idées de contenu',
          description: `Générer des idées de posts pour ${ctx.label}.`,
          howToUse:
            'Copiez dans ChatGPT ou demandez au coach « adapte ce prompt à ma niche ». Sélectionnez 5 idées, planifiez-les sur 2 semaines.',
          timeEstimate: '15 min',
          coachPhase: 7,
          roadmapChapter: 3,
          copyable: true,
          template: `Tu es expert marketing pour ${biz.name}.
Mon audience : ${ctx.clientType}.
Objectif : [notoriété / leads / ventes].

Génère 20 idées de contenu (LinkedIn + Instagram) avec :
- Titre accrocheur
- Angle / hook
- Format (carrousel, reel, post texte)
- CTA vers [${ctx.offerType}]

Contexte niche : ${ctx.nicheExamples[0]}.`,
        },
        {
          id: 'prompt-market',
          title: 'Prompt. Analyser un marché',
          description: 'Étude de marché rapide avant de lancer.',
          howToUse:
            'Complétez niche et zone, lancez le prompt, puis vérifiez 3 concurrents manuellement sur Google.',
          timeEstimate: '30 min',
          coachPhase: 1,
          roadmapChapter: 1,
          copyable: true,
          template: `Analyse le marché pour une offre ${ctx.label} ciblant ${ctx.clientType}.

Niche : [votre niche]
Zone : [pays / ville / online]

Structure ta réponse :
1. Taille et tendance du marché
2. 5 concurrents (forces / faiblesses)
3. Segments clients les plus rentables
4. Canaux d'acquisition (${ctx.channel})
5. Pricing benchmark
6. Risques et barrières à l'entrée
7. 3 opportunités de différenciation
8. Verdict : GO / PIVOT / NO-GO avec justification`,
        },
        {
          id: 'prompt-offer',
          title: 'Prompt. Créer une offre',
          description: `Structurer une offre ${ctx.offerType} claire et vendable.`,
          howToUse:
            'Remplissez problème et prix visé. Collez le résultat dans le coach pour affiner packages et objections.',
          timeEstimate: '20 min',
          coachPhase: 3,
          roadmapChapter: 1,
          copyable: true,
          template: `Crée une offre complète pour ${biz.name}.

Client cible : ${ctx.clientType}
Problème : [décrire]
Niveau de prix visé : [€]

Livrables :
1. Nom de l'offre + promesse
2. 3 packages (entrée / cœur / premium) avec prix
3. Ce qui est inclus / exclu
4. Preuves à collecter (témoignages, démos)
5. Objections fréquentes + réponses
6. Garantie ou réduction de risque
7. Script pitch 60 secondes`,
        },
        {
          id: 'prompt-sales-page',
          title: 'Prompt. Rédiger une page de vente',
          description: 'Copy complète pour landing page.',
          howToUse:
            'Générez le brouillon IA, puis transférez section par section dans le template « page de vente » de l’étape Lancer.',
          timeEstimate: '45 min',
          coachPhase: 5,
          roadmapChapter: 1,
          copyable: true,
          template: `Rédige une page de vente complète pour :

Offre : [nom]
Modèle : ${biz.name} (${ctx.offerType})
Cible : ${ctx.clientType}

Sections :
- Hero (titre + sous-titre + CTA)
- Problème (empathie)
- Solution (mécanisme unique)
- Bénéfices (3 blocs)
- Comment ça marche (3 étapes)
- Preuve sociale (placeholders)
- FAQ (5 questions)
- CTA final + urgence légère

Ton : professionnel, concret, pas de jargon.`,
        },
        {
          id: 'prompt-coach',
          title: 'Prompt. Travailler avec BuildrAI Coach',
          description: 'Demandez au coach d’adapter n’importe quelle ressource à votre cas.',
          howToUse:
            'Copiez ce texte dans l’onglet Coach IA (Premium). Remplacez [RESSOURCE] par ce que vous venez d’utiliser ici.',
          timeEstimate: '5 min',
          coachPhase: 1,
          copyable: true,
          template: `Je viens d'utiliser la ressource "[RESSOURCE]" de ma bibliothèque BuildrAI.

Mon modèle : ${biz.name}
Ma niche : [décrire en 1 phrase]
Mon niveau : [débutant / intermédiaire]

Adapte cette ressource à MA situation concrète :
1. Rédige les textes finaux (pas de placeholders)
2. Indique la prochaine micro-action 15–30 min
3. Dis-moi quel jour du parcours 180 jours cocher après`,
        },
        {
          id: 'prompt-roadmap',
          title: 'Prompt. Débloquer un jour du parcours',
          description: 'Obtenir un plan d’action détaillé pour un jour précis du parcours premium.',
          howToUse:
            'Remplacez J12 par votre jour actuel (visible dans Parcours). Collez dans le coach. Ou cliquez « Discuter » depuis le parcours.',
          timeEstimate: '5 min',
          roadmapChapter: 1,
          copyable: true,
          template: `Je travaille le jour J12 de mon parcours premium BuildrAI (${biz.name}).

Explique-moi concrètement :
1. Comment réaliser les actions du jour étape par étape
2. Un exemple adapté à mon niveau tech : ${'[votre niveau]'}
3. Les erreurs fréquentes à éviter
4. Un livrable copy-paste si pertinent (script, texte, checklist)

Budget de lancement : [serré / moyen / confortable]`,
        },
      ],
    },
    {
      id: 'growth',
      icon: '📈',
      title: 'Ressources croissance',
      resources: [
        {
          id: 'first-10',
          title: 'Plan « Trouver ses 10 premiers clients »',
          description: `Plan 14 jours pour ${ctx.label}.`,
          howToUse:
            'Suivez le calendrier jour par jour. Utilisez les scripts de l’étape Lancer. Objectif minimum : 2 clients signés.',
          timeEstimate: '14 jours',
          coachPhase: 8,
          roadmapChapter: 2,
          items: [
            'J1–2 : Lister 50 contacts qualifiés (' + ctx.clientType + ')',
            'J3 : Personnaliser script outreach (voir ressources lancement)',
            'J4–5 : Envoyer 20 messages / emails. Objectif 5 réponses',
            'J6 : 3 appels découverte (questionnaire client)',
            'J7 : Ajuster l\'offre selon retours',
            'J8–9 : Relances J+3 sur non-répondants',
            'J10 : Proposer offre pilote à 2 prospects chauds',
            'J11–12 : Closer 1–2 clients (prix intro acceptable)',
            'J13 : Demander témoignage + referral',
            'J14 : Bilan. Objectif : 2 clients signés, pipeline de 5',
          ],
        },
        {
          id: 'content-method',
          title: 'Méthode pour créer du contenu',
          description: `Système contenu adapté à ${ctx.channel}.`,
          howToUse:
            'Choisissez 3 piliers, planifiez 3 posts/semaine dans un doc. Recyclez 1 contenu long en 5 posts courts.',
          timeEstimate: '2 h setup + 1 h/sem',
          coachPhase: 7,
          roadmapChapter: 3,
          items: [
            'Pilier 1 : Éducation (résoudre un problème de ' + ctx.clientType + ')',
            'Pilier 2 : Preuve (cas, coulisses, chiffres)',
            'Pilier 3 : Offre (CTA soft vers ' + ctx.offerType + ')',
            'Rythme : 3 posts / semaine + 1 contenu long (newsletter ou vidéo)',
            'Recyclage : 1 contenu long → 5 posts courts',
            'Mesure : saves, DMs, clics. Pas seulement les likes',
          ],
        },
        {
          id: 'goals-tracker',
          title: 'Tableau de suivi des objectifs',
          description: 'KPIs hebdomadaires à synchroniser avec l’analyse hebdo Accelerator.',
          howToUse:
            'Copiez le tableau, mettez à jour chaque dimanche. Comparez avec votre analyse hebdomadaire si vous êtes en formule 99 €.',
          timeEstimate: '10 min / semaine',
          coachPhase: 8,
          roadmapChapter: 2,
          copyable: true,
          template: `## Tableau de suivi. ${biz.name}
Semaine du : [date]

| KPI | Objectif | Réalisé |
|-----|----------|---------|
| Outreach envoyés | 20 | |
| Réponses / DMs | 5 | |
| Appels découverte | 3 | |
| Propositions envoyées | 2 | |
| Clients signés | 1 | |
| CA semaine (€) | | |
| Contenus publiés | 3 | |
| Leads qualifiés | 5 | |

### Notes de la semaine
- Win :
- Blocage :
- Priorité semaine prochaine :

### Objectif mois
- CA cible :
- Clients cible :
- Canal principal : ${ctx.channel}`,
        },
        {
          id: 'legal-anticipation',
          title: 'Anticipation forme juridique (mois 1)',
          description: 'Préparer le statut cible sans immatriculer trop tôt. Aligné parcours J5 ch. 1.',
          howToUse:
            'Lisez les options, notez votre statut cible. Formalisez seulement quand vous avez clients et chiffre d’affaires récurrent.',
          timeEstimate: '30 min',
          coachPhase: 1,
          roadmapChapter: 1,
          items: [
            'Micro-entreprise : simplicité, plafonds CA. Idéal test marché',
            'EURL / SASU : crédibilité B2B, charges sociales. Si clients entreprises',
            'Ne pas immatriculer avant validation marché (sauf obligation métier)',
            'Lister coût annuel estimé + délais de création',
            'Anticiper compte pro et facturation (Stripe, Qonto, etc.)',
            'Revoir cette liste au ch. 2 quand CA > 500 €/mois',
          ],
        },
        {
          id: 'retention',
          title: 'Playbook fidélisation (premiers clients)',
          description: 'Transformer un premier oui en client récurrent ou ambassadeur.',
          howToUse:
            'Appliquez dès le 1er client signé. Une checklist par client dans votre bloc-notes.',
          timeEstimate: '1 h / client',
          coachPhase: 8,
          roadmapChapter: 3,
          items: [
            'Onboarding écrit (email ou doc). Attentes + prochaines étapes',
            'Point J+7 : satisfaction + 1 amélioration possible',
            'Demande témoignage ou étude de cas au J+14',
            'Proposition upsell ou renouvellement au J+30',
            'Demande referral : « connaissez-vous 1 personne avec le même problème ? »',
            'Mesurer churn et raisons de départ',
          ],
        },
        {
          id: 'exit-assets',
          title: 'Checklist actifs revente (SaaS / digital)',
          description: 'Documenter ce qui valorise un business. Parcours mois 5–6.',
          howToUse:
            'Cochez au fil des mois 4–6. Utile pour scale, levée ou revente. Pas urgent au début.',
          timeEstimate: '30 min / mois',
          coachPhase: 6,
          roadmapChapter: 5,
          items: [
            'MRR / revenus récurrents tracés (même petits)',
            'Liste clients + durée moyenne de relation',
            'Process documentés (vente, livraison, support)',
            'Stack technique et coûts listés',
            'Contenu / SEO / email list quantifiés',
            'Contrats types et CGV à jour',
            'Dépendance fondateur : que peut-on déléguer ?',
            'Fourchette valorisation cible (multiple ARR ou actifs)',
          ],
        },
      ],
    },
  ];
}

export function getBusinessResourceLibrary(businessId: BusinessId): LibraryCategory[] {
  return buildLibrary(businessId);
}
