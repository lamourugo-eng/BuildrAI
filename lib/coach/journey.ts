import { formatSiteToolBlock } from '@/lib/coach/tools';
import type { BusinessId } from '@/lib/quiz/data';

export interface CoachingPhase {
  id: number;
  key: string;
  name: string;
  goal: string;
  deliverables: string[];
  coachRole: string;
}

/** Parcours universel BuildrAI. 8 étapes, tous modèles business */
export const COACHING_PHASES: CoachingPhase[] = [
  {
    id: 1,
    key: 'vision',
    name: 'Vision & problème',
    goal: 'Clarifier l\'idée, le problème précis et la transformation promise',
    deliverables: ['Phrase problème client', 'Phrase promesse / transformation', 'Hypothèse de marché'],
    coachRole: 'Formuler 2-3 phrases prêtes à valider',
  },
  {
    id: 2,
    key: 'icp',
    name: 'Client idéal',
    goal: 'Définir le segment cible, persona et contexte d\'achat',
    deliverables: ['Persona nommé', '3 critères pour le reconnaître', 'Où le trouver (canaux)'],
    coachRole: 'Livrer fiche persona structurée',
  },
  {
    id: 3,
    key: 'offer',
    name: 'Offre & promesse',
    goal: 'Structurer l\'offre : résultat, format, livrables, différenciation',
    deliverables: ['Nom de l\'offre', 'Résultat promis', 'Format + durée', '3 différenciateurs'],
    coachRole: 'Rédiger l\'offre en bloc structuré',
  },
  {
    id: 4,
    key: 'positioning',
    name: 'Positionnement & pitch',
    goal: 'Message clair, accroche, proposition de valeur unique',
    deliverables: ['Pitch 30 secondes', 'Accroche hero', '3 bullets bénéfices'],
    coachRole: 'Livrer textes copy-paste',
  },
  {
    id: 5,
    key: 'presence',
    name: 'Supports & présence en ligne',
    goal: 'Créer site/landing/vitrine. Outil choisi, section par section',
    deliverables: [
      'Outil choisi + justification',
      'Structure page (liste sections)',
      'Texte de chaque section',
      'Guide mise en ligne',
    ],
    coachRole: 'Nommer l\'outil, rédiger chaque section, guider les clics',
  },
  {
    id: 6,
    key: 'pricing',
    name: 'Pricing & modèle économique',
    goal: 'Prix, formules, première offre commerciale chiffrée',
    deliverables: ['2-3 formules nommées', 'Prix chiffrés', 'Argumentaire valeur/prix'],
    coachRole: 'Proposer grille avec justification',
  },
  {
    id: 7,
    key: 'launch',
    name: 'Lancement & acquisition',
    goal: 'Premiers contacts, scripts, canaux, séquence de prospection',
    deliverables: ['3 canaux prioritaires', 'Script message/email', 'Liste 10 prospects types'],
    coachRole: 'Rédiger scripts mot pour mot',
  },
  {
    id: 8,
    key: 'clients',
    name: 'Premiers clients & itération',
    goal: 'Closer, livrer, collecter feedback, ajuster l\'offre',
    deliverables: ['Script appel closing', 'Checklist livraison', '3 questions feedback'],
    coachRole: 'Accompagner chaque interaction',
  },
];

const BUSINESS_PHASE_HINTS: Partial<Record<BusinessId, Record<number, string>>> = {
  saas: {
    1: 'Problème B2B (workflow entreprise) ou B2C (besoin individuel). Choisis un seul pour la v1.',
    2: 'Persona = utilisateur quotidien + décideur budget si B2B.',
    3: 'Offre v1 : 1 job-to-be-done, 3 features max, format abonnement ou essai.',
    4: 'Pitch : problème → solution → essai 14j. Pas une liste de features.',
    5: 'Landing 6 sections : Hero, Problème, Solution, Features (3 max), Social proof, CTA essai/démo',
    6: 'Freemium / Essai 14j / 3 paliers mensuels. Justifier par valeur utilisateur',
    7: 'Canaux : LinkedIn outbound, communautés niche, Product Hunt, SEO problème.',
    8: 'Premier oui = essai activé ou démo bookée. Documente onboarding.',
  },
  freelance: {
    1: 'Problème = situation où le client externalise (deadline, compétence manquante, surcharge).',
    2: 'Persona = décideur qui mandate (dirigeant, marketing, ops) + budget mission.',
    3: 'Forfait signature : résultat + durée + livrables. Évite « je fais tout ».',
    4: 'Headline = « J\'aide [cible] à [résultat] en [délai] ». Pas ton métier seul.',
    5: 'Page 5 blocs : Headline résultat, 3 services, Process, Preuves, CTA RDV 30min',
    6: 'Package Découverte + Mission + Rétainer. Prix TJM ou forfait',
    7: 'Canaux : réseau, LinkedIn ciblé, Malt, partenaires complémentaires.',
    8: 'Premier oui = acompte signé. Checklist livraison dès J1.',
  },
  ecommerce: {
    1: 'Problème = frustration produit ou aspiration lifestyle que ton marque adresse.',
    2: 'Persona acheteur : moment d\'achat (impulsion, cadeau, récurrent).',
    3: 'Produit pilote unique + promesse marque. Pas un catalogue fourre-tout.',
    4: 'Storytelling marque + bénéfice produit star en accroche.',
    5: 'Fiche : Hero marque, Histoire, Produit star, Avis, Livraison/retours, CTA achat',
    6: 'Prix = coût x2.5 minimum, bundle 2+1, frais port offerts seuil',
    7: 'Canaux : Instagram/TikTok, influence micro, SEO niche, lancement communauté.',
    8: 'Premier oui = précommande ou 3 ventes. Mesure panier et CAC.',
  },
  agency: {
    1: 'Problème récurrent client : visibilité, conversion, recrutement, ops…. Une niche.',
    2: 'Persona = décideur projet + freins internes (budget, timing, priorité).',
    3: 'Prestation phare + process 4 étapes documenté. Delivery reproductible.',
    4: 'Pitch = niche + résultat projet + cas type + CTA audit gratuit.',
    5: 'Site : Niche + 3 services + Méthode 4 étapes + Cas type + CTA audit gratuit',
    6: 'Setup fee + mensuel récurrent OU forfait projet. Montrer ROI client',
    7: 'Canaux : réseau, LinkedIn, partenariats, événements sectoriels.',
    8: 'Premier oui = audit signé ou mission forfait. Standardise le process.',
  },
  marketplace: {
    1: 'Problème des deux côtés : offreurs (visibilité) et demandeurs (trouver/confiance).',
    2: 'Lance un côté en premier. Persona early adopter de ce côté.',
    3: 'Transaction type claire : matching, paiement, confiance. Pas toute la plateforme.',
    4: 'Deux accroches si 2 faces. Ou une accroche forte pour le côté #1.',
    5: 'Landing 2 faces : valeur fournisseurs / valeur acheteurs + Comment ça marche (3 étapes)',
    6: 'Commission % par transaction + incitation early adopters (gratuit 3 mois)',
    7: 'Recrutement manuel early adopters. Pas de pub massive au départ.',
    8: 'Premier oui = 5 users actifs ou 1ère transaction. Note friction #1.',
  },
  impact: {
    1: 'Problème social lié à un besoin concret que quelqu\'un paie pour résoudre.',
    2: 'Qui paie (client, donateur, institution) vs qui bénéficie. Les deux doivent exister.',
    3: 'Offre = produit/service + impact mesurable. Pas mission seule.',
    4: 'Mission 1 phrase + bénéfice client concret + preuve impact.',
    5: 'Page : Mission 1 phrase + Impact chiffré + Offre + Transparence + CTA',
    6: 'Modèle mixte : vente produit + % reversé OU abonnement mission',
    7: 'Canaux : communauté mission, partenaires, presse locale, réseau engagé.',
    8: 'Premier oui = client payeur + impact mesuré. Documente les deux.',
  },
  consulting: {
    1: 'Problème business précis : CA, marge, org, stratégie, digital…',
    2: 'Persona = dirigeant en contexte (croissance, crise, pivot). Déclencheur d\'achat.',
    3: 'Diagnostic payant porte d\'entrée → mission projet. Méthode 3 phases.',
    4: 'Pitch : enjeu CEO + méthode + résultat chiffré type + CTA diagnostic 45min.',
    5: 'Page : Problème CEO/cible + Méthode 3 phases + Résultats + CTA diagnostic 45min',
    6: 'Audit fixe + Mission projet + Accompagnement trimestriel',
    7: 'Canaux : réseau dirigeants, LinkedIn, conférences, contenu expertise.',
    8: 'Premier oui = diagnostic payé. Script closing structuré.',
  },
  content: {
    1: 'Manque audience : info, inspiration, compétence. Niche précise.',
    2: 'Persona consommateur contenu : habitudes, plateformes, willingness to pay.',
    3: '1er produit monétisable : formation, template, sponsoring, abonnement premium.',
    4: 'Bio 2 lignes + promesse audience + CTA vers offre ou newsletter.',
    5: 'Hub : Bio 2 lignes + Promesse + Liens offres + Lead magnet + Newsletter',
    6: 'Sponsoring / Formation / Abonnement premium. 1 canal principal au départ',
    7: 'Canaux : plateforme #1, newsletter, collaborations, SEO niche.',
    8: 'Premier oui = vente produit ou sponsoring. Même symbolique compte.',
  },
  ofm: {
    1: 'Problème modèle OnlyFans : croissance abonnés, organisation (chatting, contenu, planning), monétisation PPV/tips. Sans promesses de revenus garantis.',
    2: 'Persona modèle : niche OnlyFans, revenus actuels ($/mois), blocages (acquisition, chatting, contenu), limites claires.',
    3: 'Offre OFM : acquisition fans, chatting, stratégie contenu, ops OnlyFans. Commission % transparente sur revenus plateforme.',
    4: 'Pitch agence OFM : professionnalisme + charte éthique + résultats mesurables (croissance abonnés, revenus). Pas de « get rich quick ».',
    5: 'Page agence OFM : Mission, services (chatting, acquisition, ops), charte modèle, process onboarding, CTA RDV. Ton pro et discret.',
    6: 'Commission 20–40 % sur revenus OnlyFans gérés. Afficher la part modèle en premier ; options chatting vs full management.',
    7: 'Prospection modèles OnlyFans : DM respectueux (Twitter/X, Instagram), charte jointe, zéro promesse de revenus fixes.',
    8: 'Premier oui = contrat OFM signé + onboarding (accès, planning, reporting). Le modèle valide chaque contenu.',
  },
};

export function getPhaseById(id: number): CoachingPhase | undefined {
  return COACHING_PHASES.find((p) => p.id === id);
}

export function getBusinessPhaseHint(businessId: BusinessId, phaseId: number): string {
  return BUSINESS_PHASE_HINTS[businessId]?.[phaseId] ?? '';
}

export function buildJourneyPromptBlock(
  businessId?: BusinessId,
  techLevel?: string
): string {
  const phasesList = COACHING_PHASES.map((p) => {
    const deliverables = p.deliverables.map((d) => `      • ${d}`).join('\n');
    return `  ${p.id}. ${p.name}\n     Objectif : ${p.goal}\n     Livrables attendus :\n${deliverables}`;
  }).join('\n\n');

  const hints = businessId
    ? COACHING_PHASES.map((p) => {
        const hint = getBusinessPhaseHint(businessId, p.id);
        return hint ? `  Étape ${p.id} : ${hint}` : null;
      })
        .filter(Boolean)
        .join('\n')
    : '';

  const toolBlock =
    businessId ? `\n${formatSiteToolBlock(businessId, techLevel)}\n` : '';

  return `## Parcours structuré BuildrAI (8 étapes. Suis l'ordre strictement)

${phasesList}

${hints ? `### Précisions modèle ${businessId} :\n${hints}\n` : ''}${toolBlock}
### Règles de clarté (CRITIQUE)
- Chaque réponse doit être PRÉCISE : listes numérotées, livrables nommés, pas de flou.
- Section 🛠️ OUTIL & MÉTHODE : OBLIGATOIRE à l'étape 5 dès le 1er message (outil, URL, coût, 3 premiers clics).
- Section 📋 PLAN VISIBLE : liste numérotée des sous-étapes restantes dans l'étape actuelle + aperçu étapes suivantes.
- Une sous-étape par échange. Ne regroupe pas plusieurs sections site en un message.

### Interdit
- « Crée un site » sans nommer l'outil (Carrd, Shopify, Notion, Webflow…).
- Plans vagues (« améliore ta présence en ligne »).
- Sauter la sous-étape 5.1 (choix outil) même si le client veut le texte directement.`;
}

export function parsePhaseFromReply(reply: string): number | null {
  const match = reply.match(/[ÉE]tape\s*(\d)\s*\/\s*8/i);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 8) return n;
  }
  return null;
}

export function clampPhase(phase: number | null | undefined): number {
  if (!phase || phase < 1) return 1;
  if (phase > 8) return 8;
  return phase;
}
