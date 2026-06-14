import type { BusinessId } from '@/lib/quiz/data';

export interface SiteToolRecommendation {
  primary: string;
  url: string;
  why: string;
  cost: string;
  setupSteps: string[];
  alternatives: string;
}

type TechBand = 'beginner' | 'intermediate' | 'advanced';

function techBand(techLevel: string | undefined): TechBand {
  const level = (techLevel ?? '').toLowerCase();
  if (level.includes('avancé') || level.includes('avance')) return 'advanced';
  if (level.includes('intermédiaire') || level.includes('intermediaire')) return 'intermediate';
  return 'beginner';
}

const SITE_TOOLS: Record<TechBand, Record<BusinessId, SiteToolRecommendation>> = {
  beginner: {
    saas: {
      primary: 'Carrd',
      url: 'https://carrd.co',
      why: 'Landing page pro en 1h, sans code, idéal pour valider un SaaS avant de développer',
      cost: 'Gratuit (3 sites) ou 19$/an Pro',
      setupSteps: [
        'Créer un compte sur carrd.co',
        'Choisir le template « Landing » ou « Startup »',
        'Renommer les sections : Hero, Problème, Solution, CTA',
      ],
      alternatives: 'Framer (gratuit) si vous voulez plus de design',
    },
    freelance: {
      primary: 'Notion (page publique)',
      url: 'https://notion.so',
      why: 'Vitrine rapide + portfolio, zéro code, vous éditez le texte comme un document',
      cost: 'Gratuit',
      setupSteps: [
        'Créer une page Notion « Mon offre »',
        'Cliquer Partager → Publier sur le web',
        'Structurer : Headline, Services, Process, CTA Cal.com',
      ],
      alternatives: 'Canva Sites ou profil Malt optimisé',
    },
    ecommerce: {
      primary: 'Shopify',
      url: 'https://shopify.com',
      why: 'Boutique clé en main, paiement et stock intégrés, essai 1€/mois',
      cost: '1€/mois les 3 premiers mois puis ~27€/mois',
      setupSteps: [
        'Créer boutique Shopify (essai)',
        'Ajouter 1 produit test avec photos',
        'Configurer paiement Stripe/PayPal dans Shopify',
      ],
      alternatives: 'Etsy si vous testez sans créer de marque',
    },
    agency: {
      primary: 'Carrd',
      url: 'https://carrd.co',
      why: 'Site agence pro en une page, rapide à mettre à jour',
      cost: 'Gratuit ou 19$/an',
      setupSteps: [
        'Template « Agency » ou « Business » sur Carrd',
        'Sections : Spécialisation, Services, Process 3 étapes, CTA',
        'Publier et connecter domaine (optionnel)',
      ],
      alternatives: 'Webflow (gratuit) si intermédiaire',
    },
    marketplace: {
      primary: 'Carrd + Typeform',
      url: 'https://carrd.co',
      why: 'Landing pour capturer offre ET demande avant de coder la plateforme',
      cost: 'Gratuit / Typeform gratuit',
      setupSteps: [
        'Landing Carrd avec 2 CTA : « Je suis fournisseur » / « Je cherche »',
        'Lier chaque CTA à un Typeform de pré-inscription',
        'Collecter 10 inscriptions avant de développer',
      ],
      alternatives: 'Notion + Tally.so pour les formulaires',
    },
    impact: {
      primary: 'Carrd',
      url: 'https://carrd.co',
      why: 'Page mission claire, storytelling impact + CTA don/adhésion/achat',
      cost: 'Gratuit ou 19$/an',
      setupSteps: [
        'Template simple, hero avec mission en 1 phrase',
        'Section impact chiffré + section offre',
        'CTA clair (acheter, soutenir, s\'inscrire)',
      ],
      alternatives: 'Notion page publique',
    },
    consulting: {
      primary: 'Notion (page publique) + Cal.com',
      url: 'https://notion.so',
      why: 'Page expertise + prise de RDV en 30 min de setup',
      cost: 'Gratuit',
      setupSteps: [
        'Page Notion : expertise, méthode en 3 étapes, résultats',
        'Publier sur le web',
        'Ajouter bouton Cal.com « Réserver un diagnostic »',
      ],
      alternatives: 'Carrd + Calendly',
    },
    content: {
      primary: 'Beacons ou Linktree + Carrd',
      url: 'https://beacons.ai',
      why: 'Hub créateur : bio, liens, newsletter, offres. Mobile-first',
      cost: 'Gratuit',
      setupSteps: [
        'Créer profil Beacons avec bio et liens principaux',
        'Ajouter lien newsletter (Substack/Brevo gratuit)',
        'Page Carrd pour offre premium si besoin',
      ],
      alternatives: 'Notion hub + Substack',
    },
    ofm: {
      primary: 'Carrd',
      url: 'https://carrd.co',
      why: 'Vitrine agence OnlyFans Management : mission, services OFM, charte modèle et prise de contact',
      cost: 'Gratuit ou 19$/an',
      setupSteps: [
        'Template « Business ». Hero agence OFM professionnelle',
        'Sections : Services (chatting, acquisition), Charte modèle OnlyFans, Process, CTA contact',
        'Publier et lier Cal.com ou formulaire candidature modèle',
      ],
      alternatives: 'Notion page publique + Tally',
    },
  },
  intermediate: {
    saas: {
      primary: 'Framer',
      url: 'https://framer.com',
      why: 'Landing animée pro, bon pour SaaS B2B, hébergement inclus',
      cost: 'Gratuit (sous-domaine) ou ~15€/mois',
      setupSteps: ['Dupliquer template SaaS Framer', 'Personnaliser sections', 'Publier'],
      alternatives: 'Webflow ou WordPress + Elementor',
    },
    freelance: {
      primary: 'Webflow',
      url: 'https://webflow.com',
      why: 'Portfolio pro, CMS pour études de cas',
      cost: 'Gratuit (2 projets) ou ~14€/mois',
      setupSteps: ['Template portfolio', '3 études de cas', 'Formulaire contact'],
      alternatives: 'Framer ou WordPress',
    },
    ecommerce: {
      primary: 'Shopify',
      url: 'https://shopify.com',
      why: 'Standard e-commerce, thèmes pro, apps marketing',
      cost: '~27€/mois',
      setupSteps: ['Thème Dawn', 'Collections', 'Checkout optimisé'],
      alternatives: 'WooCommerce si WordPress',
    },
    agency: {
      primary: 'Webflow',
      url: 'https://webflow.com',
      why: 'Site agence crédible, CMS blog/cas clients',
      cost: 'Gratuit ou ~14€/mois',
      setupSteps: ['Template agence', 'Pages services', 'CMS cas clients'],
      alternatives: 'Framer',
    },
    marketplace: {
      primary: 'Webflow + Airtable',
      url: 'https://webflow.com',
      why: 'Landing pro + base pour gérer inscriptions early adopters',
      cost: 'Gratuit / Airtable gratuit',
      setupSteps: ['Landing two-sided Webflow', 'Formulaires → Airtable', 'Email auto'],
      alternatives: 'Bubble.io pour MVP no-code',
    },
    impact: {
      primary: 'Webflow',
      url: 'https://webflow.com',
      why: 'Storytelling impact, blog, transparence',
      cost: 'Gratuit ou ~14€/mois',
      setupSteps: ['Template ONG/impact', 'Page mission + impact', 'Blog'],
      alternatives: 'WordPress',
    },
    consulting: {
      primary: 'Webflow + Cal.com',
      url: 'https://webflow.com',
      why: 'Crédibilité conseil, contenus, prise de RDV',
      cost: 'Gratuit ou ~14€/mois',
      setupSteps: ['Page expertise', 'Articles/insights', 'CTA Cal.com'],
      alternatives: 'Framer',
    },
    content: {
      primary: 'Framer',
      url: 'https://framer.com',
      why: 'Site créateur moderne, newsletter intégrée',
      cost: 'Gratuit ou ~15€/mois',
      setupSteps: ['Template creator', 'Bio + offres', 'Newsletter embed'],
      alternatives: 'Ghost (blog + newsletter)',
    },
    ofm: {
      primary: 'Webflow',
      url: 'https://webflow.com',
      why: 'Site agence OnlyFans Management crédible + page charte OFM détaillée',
      cost: 'Gratuit ou ~14€/mois',
      setupSteps: [
        'Template agence',
        'Page services OFM + charte modèle OnlyFans',
        'Formulaire candidature modèle',
      ],
      alternatives: 'Framer',
    },
  },
  advanced: {
    saas: {
      primary: 'Next.js + Vercel (ou Webflow en attendant le produit)',
      url: 'https://vercel.com',
      why: 'Contrôle total, évolutif vers le vrai produit',
      cost: 'Gratuit (hobby)',
      setupSteps: ['Deploy template Next.js landing', 'Domaine custom', 'Analytics'],
      alternatives: 'Webflow si délai court',
    },
    freelance: {
      primary: 'Next.js ou Webflow',
      url: 'https://vercel.com',
      why: 'Portfolio sur-mesure ou Webflow pour rapidité',
      cost: 'Gratuit',
      setupSteps: ['Setup repo ou Webflow', 'Deploy', 'SEO meta'],
      alternatives: 'Astro + Vercel',
    },
    ecommerce: {
      primary: 'Shopify ou WooCommerce',
      url: 'https://shopify.com',
      why: 'Shopify = rapide, WooCommerce = contrôle',
      cost: 'Variable',
      setupSteps: ['Choisir selon marge/tech', 'Paiements', 'Analytics'],
      alternatives: 'Medusa (headless) si custom',
    },
    agency: {
      primary: 'Webflow ou Next.js',
      url: 'https://webflow.com',
      why: 'Agence = crédibilité + CMS cas clients',
      cost: 'Variable',
      setupSteps: ['Architecture pages', 'CMS', 'SEO'],
      alternatives: 'WordPress + custom theme',
    },
    marketplace: {
      primary: 'Bubble.io ou code custom',
      url: 'https://bubble.io',
      why: 'MVP marketplace no-code puis migration',
      cost: 'Gratuit / ~25€/mois',
      setupSteps: ['Modèle données', 'Flows offre/demande', 'Paiement Stripe'],
      alternatives: 'Next.js + Supabase',
    },
    impact: {
      primary: 'Webflow ou WordPress',
      url: 'https://webflow.com',
      why: 'CMS riche pour contenu impact',
      cost: 'Variable',
      setupSteps: ['Structure contenu', 'Donations Stripe', 'Blog'],
      alternatives: 'Next.js',
    },
    consulting: {
      primary: 'Webflow ou Next.js',
      url: 'https://webflow.com',
      why: 'Authority site + lead gen',
      cost: 'Variable',
      setupSteps: ['Pages expertise', 'Lead magnets', 'CRM connect'],
      alternatives: 'HubSpot CMS',
    },
    content: {
      primary: 'Ghost ou Next.js',
      url: 'https://ghost.org',
      why: 'Blog + newsletter + memberships natifs',
      cost: 'Gratuit self-hosted ou ~9€/mois',
      setupSteps: ['Setup Ghost', 'Thème', 'Stripe memberships'],
      alternatives: 'Substack + site Framer',
    },
    ofm: {
      primary: 'Webflow ou Next.js',
      url: 'https://webflow.com',
      why: 'Site agence OFM + espace ressources modèles OnlyFans (charte, onboarding, reporting)',
      cost: 'Variable',
      setupSteps: [
        'Architecture pages agence OFM',
        'Charte modèle OnlyFans PDF téléchargeable',
        'CRM pipeline modèles / Notion ops',
      ],
      alternatives: 'Notion + Carrd',
    },
  },
};

/** Sous-étapes détaillées de l'étape 5 (site / présence en ligne) */
export const PRESENCE_SUBSTEPS = [
  { id: '5.1', label: 'Choisir l\'outil et justifier le choix' },
  { id: '5.2', label: 'Définir la structure complète de la page (liste des sections)' },
  { id: '5.3', label: 'Rédiger la section Hero (titre + sous-titre + CTA)' },
  { id: '5.4', label: 'Rédiger la section Problème client' },
  { id: '5.5', label: 'Rédiger la section Solution / Offre' },
  { id: '5.6', label: 'Rédiger preuves, bénéfices ou témoignages' },
  { id: '5.7', label: 'Rédiger CTA final + FAQ courte' },
  { id: '5.8', label: 'Guide mise en ligne (clics précis dans l\'outil choisi)' },
];

export function getSiteToolRecommendation(
  businessId: BusinessId,
  techLevel?: string
): SiteToolRecommendation {
  const band = techBand(techLevel);
  return SITE_TOOLS[band][businessId];
}

export function formatSiteToolBlock(
  businessId: BusinessId,
  techLevel?: string
): string {
  const tool = getSiteToolRecommendation(businessId, techLevel);
  const substeps = PRESENCE_SUBSTEPS.map((s) => `    ${s.id} ${s.label}`).join('\n');

  return `### Outil site OBLIGATOIRE pour ce client (${techLevel ?? 'Débutant'})
Recommandation principale : **${tool.primary}** (${tool.url})
- Pourquoi : ${tool.why}
- Coût : ${tool.cost}
- Premiers pas : ${tool.setupSteps.join(' → ')}
- Alternative : ${tool.alternatives}

Tu DOIS nommer cet outil (ou l'alternative si justifié) dès le début de l'étape 5.
Ne dis jamais « créez un site » sans dire QUEL outil et COMMENT démarrer.

### Sous-étapes étape 5 (dans l'ordre, une par échange) :
${substeps}`;
}
