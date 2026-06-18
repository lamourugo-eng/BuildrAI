import { getSiteToolRecommendation } from '@/lib/coach/tools';
import type { BusinessId } from '@/lib/quiz/data';

export interface ContextualToolRecommendation {
  name: string;
  url: string;
  why: string;
  cost: string;
  firstStep: string;
}

export interface ContextualToolsContext {
  userMessage?: string;
  reply?: string;
  businessId?: BusinessId | null;
  techLevel?: string;
  coachingPhase?: number;
}

const VAGUE_TOOL_PATTERNS = [
  /\bforums?\b(?!.*reddit)/i,
  /\bsur internet\b/i,
  /\ben ligne\b/i,
  /\bdes outils\b/i,
  /\bune plateforme\b/i,
  /\boutil de ton choix\b/i,
  /\brecherche en ligne\b/i,
  /\bgroupes?\s+(?:en\s+ligne|facebook)\b/i,
];

function getBusinessForumTools(businessId: BusinessId): ContextualToolRecommendation[] {
  const forums: Record<BusinessId, ContextualToolRecommendation[]> = {
    saas: [
      {
        name: 'Reddit r/SaaS',
        url: 'https://www.reddit.com/r/SaaS/',
        why: 'Retours fondateurs SaaS, pricing, acquisition early-stage',
        cost: 'Gratuit',
        firstStep: 'Lire les posts « feedback » du mois, puis poster ton problème en 5 lignes',
      },
      {
        name: 'Indie Hackers',
        url: 'https://www.indiehackers.com/',
        why: 'Communauté produits indie, études de cas et validation marché',
        cost: 'Gratuit',
        firstStep: 'Chercher un produit proche du tien dans « Products »',
      },
    ],
    freelance: [
      {
        name: 'Reddit r/freelance',
        url: 'https://www.reddit.com/r/freelance/',
        why: 'Retours pricing, prospection et positionnement freelance',
        cost: 'Gratuit',
        firstStep: 'Filtrer par flair « Advice » avant de poster',
      },
      {
        name: 'Reddit r/Entrepreneur',
        url: 'https://www.reddit.com/r/Entrepreneur/',
        why: 'Discussions large spectre solo business et side projects',
        cost: 'Gratuit',
        firstStep: 'Poser 1 question précise avec ton contexte (niche + offre)',
      },
    ],
    ecommerce: [
      {
        name: 'Reddit r/ecommerce',
        url: 'https://www.reddit.com/r/ecommerce/',
        why: 'Feedback boutique, ads, supply et conversion',
        cost: 'Gratuit',
        firstStep: 'Chercher « store review » ou « ROAS » selon ton blocage',
      },
      {
        name: 'Reddit r/shopify',
        url: 'https://www.reddit.com/r/shopify/',
        why: 'Astuces Shopify, apps et thèmes',
        cost: 'Gratuit',
        firstStep: 'Lire le wiki du subreddit puis poser ta question technique',
      },
    ],
    agency: [
      {
        name: 'Reddit r/marketing',
        url: 'https://www.reddit.com/r/marketing/',
        why: 'Stratégies acquisition et positionnement agence',
        cost: 'Gratuit',
        firstStep: 'Chercher « agency pricing » ou « first clients »',
      },
      {
        name: 'Reddit r/smallbusiness',
        url: 'https://www.reddit.com/r/smallbusiness/',
        why: 'Problèmes concrets PME = bon proxy pour tes futurs clients agence',
        cost: 'Gratuit',
        firstStep: 'Lire 10 posts récents pour repérer les douleurs récurrentes',
      },
    ],
    marketplace: [
      {
        name: 'Reddit r/startups',
        url: 'https://www.reddit.com/r/startups/',
        why: 'Validation marketplace two-sided et early adopters',
        cost: 'Gratuit',
        firstStep: 'Poster un post « market research » avec ta niche',
      },
      {
        name: 'Indie Hackers',
        url: 'https://www.indiehackers.com/',
        why: 'Retours sur liquidité offre/demande et MVP marketplace',
        cost: 'Gratuit',
        firstStep: 'Chercher « marketplace » dans les discussions',
      },
    ],
    impact: [
      {
        name: 'Reddit r/socialentrepreneur',
        url: 'https://www.reddit.com/r/socialentrepreneur/',
        why: 'Modèles économiques impact + monétisation',
        cost: 'Gratuit',
        firstStep: 'Chercher des projets proches de ta mission',
      },
      {
        name: 'Facebook Groups « Social Entrepreneurship »',
        url: 'https://www.facebook.com/groups/',
        why: 'Communautés impact, partenariats et retours terrain',
        cost: 'Gratuit',
        firstStep: 'Rejoindre 1 groupe actif et observer 1 semaine avant de poster',
      },
    ],
    consulting: [
      {
        name: 'Reddit r/consulting',
        url: 'https://www.reddit.com/r/consulting/',
        why: 'Positionnement conseil, pricing mission et crédibilité',
        cost: 'Gratuit',
        firstStep: 'Lire les threads « solo consulting »',
      },
      {
        name: 'LinkedIn (groupes métier)',
        url: 'https://www.linkedin.com/groups/',
        why: 'Prospection et crédibilité B2B conseil',
        cost: 'Gratuit',
        firstStep: 'Rejoindre 2 groupes de ta niche et commenter 5 posts/semaine',
      },
    ],
    content: [
      {
        name: 'Reddit r/NewTubers',
        url: 'https://www.reddit.com/r/NewTubers/',
        why: 'Feedback chaîne, hooks et stratégie contenu',
        cost: 'Gratuit',
        firstStep: 'Poster une review de ta chaîne ou landing',
      },
      {
        name: 'Reddit r/ContentCreation',
        url: 'https://www.reddit.com/r/ContentCreation/',
        why: 'Formats, monétisation et croissance créateurs',
        cost: 'Gratuit',
        firstStep: 'Chercher ton format (newsletter, YouTube, TikTok)',
      },
    ],
    ofm: [
      {
        name: 'Reddit r/onlyfansadvice',
        url: 'https://www.reddit.com/r/onlyfansadvice/',
        why: 'Retours modèles OnlyFans, acquisition et ops (charte éthique)',
        cost: 'Gratuit',
        firstStep: 'Lire le wiki du subreddit avant toute question modèle',
      },
      {
        name: 'Reddit r/CreatorServices',
        url: 'https://www.reddit.com/r/CreatorServices/',
        why: 'Services autour de créateurs (chatting, promo) — filtrer avec prudence',
        cost: 'Gratuit',
        firstStep: 'Observer les offres/agences avant de recruter',
      },
    ],
  };

  return forums[businessId];
}

interface IntentRule {
  id: string;
  priority: number;
  patterns: RegExp[];
  tools: (ctx: ContextualToolsContext) => ContextualToolRecommendation[];
}

const INTENT_RULES: IntentRule[] = [
  {
    id: 'forums',
    priority: 10,
    patterns: [
      /\bforums?\b/i,
      /\bcommunaut/i,
      /\breddit\b/i,
      /\bindie hackers?\b/i,
      /\bgroupes?\s+(?:facebook|linkedin|en ligne)\b/i,
      /\bdiscussions?\s+(?:en ligne|publiques?)\b/i,
      /\béchanges?\s+(?:avec\s+)?(?:des\s+)?(?:pairs?|fondateurs?|entrepreneurs?)\b/i,
    ],
    tools: ({ businessId }) =>
      businessId ? getBusinessForumTools(businessId) : [
        {
          name: 'Reddit r/Entrepreneur',
          url: 'https://www.reddit.com/r/Entrepreneur/',
          why: 'Communauté généraliste entrepreneurs',
          cost: 'Gratuit',
          firstStep: 'Poster 1 question précise avec contexte + objectif',
        },
        {
          name: 'Indie Hackers',
          url: 'https://www.indiehackers.com/',
          why: 'Validation idée et retours fondateurs',
          cost: 'Gratuit',
          firstStep: 'Chercher un cas proche de ton projet',
        },
      ],
  },
  {
    id: 'validation',
    priority: 9,
    patterns: [
      /\bvalid(?:er|ation)\b/i,
      /\bsondage\b/i,
      /\binterview/i,
      /\bfeedback\b/i,
      /\bprobl[eè]me\s+client\b/i,
      /\bbesoin\s+(?:march[eé]|client)\b/i,
      /\btest(?:er)?\s+(?:mon\s+)?id[eé]e\b/i,
    ],
    tools: ({ businessId }) => {
      const base: ContextualToolRecommendation[] = [
        {
          name: 'Typeform',
          url: 'https://www.typeform.com/',
          why: 'Sondage rapide pour valider problème / willingness to pay',
          cost: 'Gratuit (10 réponses/mois)',
          firstStep: 'Créer un formulaire 5 questions max et partager le lien',
        },
        {
          name: 'Tally',
          url: 'https://tally.so/',
          why: 'Alternative gratuite illimitée pour interviews async',
          cost: 'Gratuit',
          firstStep: 'Dupliquer un template « customer discovery »',
        },
      ];
      if (businessId) {
        base.push(...getBusinessForumTools(businessId).slice(0, 1));
      }
      return base;
    },
  },
  {
    id: 'prospection',
    priority: 8,
    patterns: [
      /\bprospect/i,
      /\bprospection\b/i,
      /\bcold\s+(?:email|dm|message)\b/i,
      /\boutreach\b/i,
      /\bpremiers?\s+clients?\b/i,
      /\btrouver\s+des\s+clients?\b/i,
      /\blinkedin\b/i,
    ],
    tools: () => [
      {
        name: 'LinkedIn Sales Navigator (essai)',
        url: 'https://www.linkedin.com/sales/',
        why: 'Cibler décideurs par niche et titre',
        cost: 'Essai gratuit puis payant',
        firstStep: 'Créer une liste « 50 prospects » avec filtres niche + taille',
      },
      {
        name: 'Lemlist',
        url: 'https://www.lemlist.com/',
        why: 'Séquences cold email personnalisées',
        cost: 'Essai 14 jours',
        firstStep: 'Importer 20 prospects et rédiger 1 séquence 3 emails',
      },
      {
        name: 'Apollo.io',
        url: 'https://www.apollo.io/',
        why: 'Base emails B2B + filtres secteur',
        cost: 'Gratuit (crédits limités)',
        firstStep: 'Chercher 30 contacts dans ta niche et exporter',
      },
    ],
  },
  {
    id: 'email',
    priority: 7,
    patterns: [
      /\bnewsletter\b/i,
      /\bemail(?:ing)?\b/i,
      /\bmailing\b/i,
      /\bs[eé]quence\s+(?:email|nurture)\b/i,
      /\brelance\s+email\b/i,
    ],
    tools: () => [
      {
        name: 'Brevo (ex-Sendinblue)',
        url: 'https://www.brevo.com/fr/',
        why: 'Newsletter + automation, adapté FR/EU',
        cost: 'Gratuit (300 emails/jour)',
        firstStep: 'Créer une liste et importer tes premiers contacts',
      },
      {
        name: 'Substack',
        url: 'https://substack.com/',
        why: 'Newsletter + monétisation intégrée pour créateurs',
        cost: 'Gratuit',
        firstStep: 'Publier un premier post « manifeste » de ta niche',
      },
    ],
  },
  {
    id: 'scheduling',
    priority: 6,
    patterns: [
      /\brdv\b/i,
      /\brendez-vous\b/i,
      /\bcalendrier\b/i,
      /\bprise de rendez/i,
      /\bbooking\b/i,
      /\bcall\s+de\s+(?:vente|discovery)\b/i,
    ],
    tools: () => [
      {
        name: 'Cal.com',
        url: 'https://cal.com/',
        why: 'Prise de RDV open-source, branding pro',
        cost: 'Gratuit',
        firstStep: 'Créer un type d\'événement « Diagnostic 20 min »',
      },
      {
        name: 'Calendly',
        url: 'https://calendly.com/',
        why: 'Standard marché, intégrations nombreuses',
        cost: 'Gratuit (1 type d\'événement)',
        firstStep: 'Connecter Google Calendar et partager le lien en bio',
      },
    ],
  },
  {
    id: 'payment',
    priority: 6,
    patterns: [
      /\bpaiement\b/i,
      /\bstripe\b/i,
      /\bfactur/i,
      /\bcheckout\b/i,
      /\bencaiss/i,
      /\babonnement\b/i,
    ],
    tools: () => [
      {
        name: 'Stripe',
        url: 'https://stripe.com/fr',
        why: 'Paiement en ligne + abonnements SaaS/e-commerce',
        cost: 'Commission par transaction',
        firstStep: 'Créer un compte et activer le mode test',
      },
      {
        name: 'Qonto',
        url: 'https://qonto.com/fr',
        why: 'Compte pro + facturation FR intégrée',
        cost: 'À partir de ~11 €/mois',
        firstStep: 'Ouvrir un compte pro et créer un modèle de facture',
      },
    ],
  },
  {
    id: 'ads',
    priority: 7,
    patterns: [
      /\bpub\b/i,
      /\bads\b/i,
      /\bfacebook ads\b/i,
      /\bmeta ads\b/i,
      /\bgoogle ads\b/i,
      /\btiktok ads\b/i,
      /\bcampagne\s+(?:pub|ads)\b/i,
      /\broas\b/i,
    ],
    tools: () => [
      {
        name: 'Meta Ads Manager',
        url: 'https://www.facebook.com/adsmanager/',
        why: 'Campagnes Instagram/Facebook, idéal B2C et créateurs',
        cost: 'Budget pub variable',
        firstStep: 'Installer le Pixel + lancer 1 campagne test 5 €/jour',
      },
      {
        name: 'Google Ads',
        url: 'https://ads.google.com/',
        why: 'Intent search : capter la demande existante',
        cost: 'Budget pub variable',
        firstStep: 'Créer 1 campagne Search sur 5 mots-clés niche',
      },
    ],
  },
  {
    id: 'seo',
    priority: 6,
    patterns: [
      /\bseo\b/i,
      /\br[eé]f[eé]rencement\b/i,
      /\bmots-cl[eé]s\b/i,
      /\bgoogle search\b/i,
      /\btrafic organique\b/i,
    ],
    tools: () => [
      {
        name: 'Google Search Console',
        url: 'https://search.google.com/search-console/',
        why: 'Suivre indexation et requêtes Google sur ton site',
        cost: 'Gratuit',
        firstStep: 'Ajouter ton domaine et soumettre le sitemap',
      },
      {
        name: 'Ubersuggest',
        url: 'https://neilpatel.com/fr/ubersuggest/',
        why: 'Recherche mots-clés et idées de contenu',
        cost: 'Gratuit (limité)',
        firstStep: 'Analyser 3 mots-clés de ta niche',
      },
    ],
  },
  {
    id: 'analytics',
    priority: 5,
    patterns: [
      /\banalytics\b/i,
      /\bmetrics?\b/i,
      /\bsuivi\s+(?:trafic|conversion)\b/i,
      /\btaux de conversion\b/i,
      /\bheatmap\b/i,
    ],
    tools: () => [
      {
        name: 'Plausible',
        url: 'https://plausible.io/',
        why: 'Analytics simple, RGPD-friendly',
        cost: 'Essai 30 jours puis ~9 €/mois',
        firstStep: 'Installer le script sur ta landing',
      },
      {
        name: 'Hotjar',
        url: 'https://www.hotjar.com/',
        why: 'Heatmaps et enregistrements session pour optimiser conversion',
        cost: 'Gratuit (limité)',
        firstStep: 'Installer sur ta page principale et regarder 5 sessions',
      },
    ],
  },
  {
    id: 'crm',
    priority: 5,
    patterns: [
      /\bcrm\b/i,
      /\bpipeline\b/i,
      /\bsuivi\s+(?:client|lead)\b/i,
      /\brelance\s+(?:client|prospect)\b/i,
    ],
    tools: () => [
      {
        name: 'HubSpot CRM',
        url: 'https://www.hubspot.com/products/crm',
        why: 'CRM gratuit, pipeline deals et emails',
        cost: 'Gratuit',
        firstStep: 'Créer un pipeline « Prospection » avec 4 étapes',
      },
      {
        name: 'Notion (CRM template)',
        url: 'https://www.notion.so/templates/crm',
        why: 'CRM léger no-code, flexible solo founder',
        cost: 'Gratuit',
        firstStep: 'Dupliquer un template CRM et ajouter 10 prospects',
      },
    ],
  },
  {
    id: 'design',
    priority: 4,
    patterns: [
      /\blogo\b/i,
      /\bdesign\b/i,
      /\bvisuel/i,
      /\bidentit[eé]\s+visuelle\b/i,
      /\bmaquette\b/i,
      /\bcanva\b/i,
    ],
    tools: () => [
      {
        name: 'Canva',
        url: 'https://www.canva.com/',
        why: 'Visuels, logos, posts réseaux en 30 min',
        cost: 'Gratuit',
        firstStep: 'Chercher « logo [niche] » et personnaliser un template',
      },
      {
        name: 'Figma',
        url: 'https://www.figma.com/',
        why: 'Maquettes landing et design system',
        cost: 'Gratuit',
        firstStep: 'Dupliquer un template landing SaaS/agence',
      },
    ],
  },
  {
    id: 'legal-fr',
    priority: 5,
    patterns: [
      /\bjuridique\b/i,
      /\bmicro[- ]?entreprise\b/i,
      /\bsasu\b/i,
      /\beurl\b/i,
      /\bstatut\b/i,
      /\bimmatricul/i,
      /\bcgv\b/i,
      /\bmentions l[eé]gales\b/i,
    ],
    tools: () => [
      {
        name: 'Guichet unique (INPI)',
        url: 'https://procedures.inpi.fr/',
        why: 'Création d\'entreprise officielle en France',
        cost: 'Frais d\'immatriculation',
        firstStep: 'Simuler micro vs société selon ton CA prévisionnel',
      },
      {
        name: 'LegalPlace',
        url: 'https://www.legalplace.fr/',
        why: 'Accompagnement statut + docs (CGV, mentions légales)',
        cost: 'Variable',
        firstStep: 'Comparer micro-entreprise vs SASU avec leur simulateur',
      },
    ],
  },
  {
    id: 'automation',
    priority: 4,
    patterns: [
      /\bautomat/i,
      /\bworkflow\b/i,
      /\bzapier\b/i,
      /\bmake\b/i,
      /\bno-code\b/i,
    ],
    tools: () => [
      {
        name: 'Make (ex-Integromat)',
        url: 'https://www.make.com/',
        why: 'Automatisations visuelles entre apps (CRM, email, Notion)',
        cost: 'Gratuit (1000 ops/mois)',
        firstStep: 'Créer un scénario « formulaire → Notion → email »',
      },
      {
        name: 'Airtable',
        url: 'https://airtable.com/',
        why: 'Base données + automations pour ops early-stage',
        cost: 'Gratuit',
        firstStep: 'Créer une base « Clients » avec statuts pipeline',
      },
    ],
  },
  {
    id: 'freelance-platforms',
    priority: 6,
    patterns: [
      /\bmalt\b/i,
      /\bupwork\b/i,
      /\bcodeur\.com\b/i,
      /\bplateforme\s+freelance\b/i,
      /\bmissions?\s+freelance\b/i,
    ],
    tools: () => [
      {
        name: 'Malt',
        url: 'https://www.malt.fr/',
        why: 'Plateforme freelance FR, crédibilité et inbound',
        cost: 'Commission sur missions',
        firstStep: 'Optimiser profil + 3 études de cas',
      },
      {
        name: 'Codeur.com',
        url: 'https://www.codeur.com/',
        why: 'Appels d\'offres tech/marketing FR',
        cost: 'Abonnement ou crédits',
        firstStep: 'Répondre à 3 annonces niche avec proposition personnalisée',
      },
    ],
  },
  {
    id: 'social',
    priority: 5,
    patterns: [
      /\btiktok\b/i,
      /\binstagram\b/i,
      /\breels?\b/i,
      /\byoutube\b/i,
      /\bshorts\b/i,
      /\br[eé]seaux\s+sociaux\b/i,
      /\bcommunity manager\b/i,
    ],
    tools: () => [
      {
        name: 'CapCut',
        url: 'https://www.capcut.com/',
        why: 'Montage Reels/TikTok/Shorts rapide',
        cost: 'Gratuit',
        firstStep: 'Dupliquer un template « hook + démo + CTA »',
      },
      {
        name: 'Buffer',
        url: 'https://buffer.com/',
        why: 'Planifier posts multi-réseaux',
        cost: 'Gratuit (3 canaux)',
        firstStep: 'Connecter 1 réseau et planifier 5 posts semaine 1',
      },
    ],
  },
  {
    id: 'competitor',
    priority: 5,
    patterns: [
      /\bconcurrent/i,
      /\bbenchmark\b/i,
      /\banalyse\s+(?:march[eé]|concurrence)\b/i,
      /\b[eé]tude\s+de\s+march[eé]\b/i,
    ],
    tools: () => [
      {
        name: 'Product Hunt',
        url: 'https://www.producthunt.com/',
        why: 'Repérer produits similaires et positionnement',
        cost: 'Gratuit',
        firstStep: 'Chercher 5 produits de ta catégorie et noter leur promesse',
      },
      {
        name: 'SimilarWeb (free)',
        url: 'https://www.similarweb.com/',
        why: 'Estimer trafic et canaux des concurrents',
        cost: 'Gratuit (aperçu)',
        firstStep: 'Analyser 3 sites concurrents et leurs sources trafic',
      },
    ],
  },
];

function normalizeText(ctx: ContextualToolsContext): string {
  return `${ctx.userMessage ?? ''}\n${ctx.reply ?? ''}`.toLowerCase();
}

function toolAlreadyMentioned(text: string, tool: ContextualToolRecommendation): boolean {
  const nameParts = tool.name
    .toLowerCase()
    .split(/[\s/()]+/)
    .filter((part) => part.length > 3);
  const urlHost = tool.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  return (
    text.includes(urlHost.toLowerCase()) ||
    nameParts.some((part) => text.includes(part))
  );
}

function siteToolToContextual(
  businessId: BusinessId,
  techLevel?: string
): ContextualToolRecommendation {
  const site = getSiteToolRecommendation(businessId, techLevel);
  return {
    name: site.primary,
    url: site.url,
    why: site.why,
    cost: site.cost,
    firstStep: site.setupSteps[0] ?? 'Créer un compte et suivre l\'assistant',
  };
}

export function resolveContextualTools(ctx: ContextualToolsContext): ContextualToolRecommendation[] {
  const text = normalizeText(ctx);
  const matched = new Map<string, ContextualToolRecommendation>();

  const forceForums = VAGUE_TOOL_PATTERNS.some((pattern) => pattern.test(text));

  for (const rule of INTENT_RULES) {
    const hit = forceForums && rule.id === 'forums'
      ? true
      : rule.patterns.some((pattern) => pattern.test(text));

    if (!hit) continue;

    for (const tool of rule.tools(ctx)) {
      if (toolAlreadyMentioned(text, tool)) continue;
      matched.set(tool.url, tool);
    }
  }

  const phase = ctx.coachingPhase ?? 1;
  const mentionsSite =
    /\bsite|landing|vitrine|page web|shopify|carrd|notion|webflow|framer|mise en ligne\b/i.test(
      text
    );

  if (ctx.businessId && (phase >= 4 || mentionsSite)) {
    const siteTool = siteToolToContextual(ctx.businessId, ctx.techLevel);
    if (!toolAlreadyMentioned(text, siteTool)) {
      matched.set(siteTool.url, siteTool);
    }
  }

  return [...matched.values()]
    .slice(0, 4);
}

export function formatContextualToolLine(tool: ContextualToolRecommendation): string {
  return `**${tool.name}** — ${tool.url}
Pourquoi : ${tool.why}
Coût : ${tool.cost}
Premier pas : ${tool.firstStep}`;
}

export function formatContextualToolsBlock(tools: ContextualToolRecommendation[]): string {
  return tools.map((tool, index) => `${index + 1}. ${formatContextualToolLine(tool)}`).join('\n\n');
}

export function buildContextualToolsPromptReference(businessId?: BusinessId | null): string {
  const forumHint = businessId
    ? getBusinessForumTools(businessId)
        .slice(0, 2)
        .map((t) => `${t.name} (${t.url})`)
        .join(', ')
    : 'Reddit r/Entrepreneur, Indie Hackers';

  return `## Répertoire outils (OBLIGATOIRE : nommer des outils précis, jamais vague)
- Forums / retours marché → ${forumHint} (pas « cherche sur des forums »)
- Validation → Typeform, Tally + 5 interviews Reddit/LinkedIn
- Prospection → LinkedIn, Lemlist, Apollo.io
- Email / newsletter → Brevo, Substack
- RDV → Cal.com, Calendly
- Paiement / facturation → Stripe, Qonto
- Pub → Meta Ads Manager, Google Ads
- SEO → Google Search Console, Ubersuggest
- Analytics → Plausible, Hotjar
- CRM → HubSpot CRM, Notion
- Design → Canva, Figma
- Juridique FR → Guichet unique INPI, LegalPlace
- Automatisation → Make, Airtable
- Chaque recommandation = nom + URL + coût + 1er clic concret`;
}
