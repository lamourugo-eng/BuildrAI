import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';

export interface RoadmapTeaserStep {
  id: string;
  phase: string;
  title: string;
  teaser: string;
  locked: boolean;
}

const BUSINESS_TEASERS: Record<
  BusinessId,
  { validate: string; launch: string; accelerate: string }
> = {
  saas: {
    validate: 'Teste ton problème B2B ou B2C : 5 entretiens, signaux d\'intérêt pour un essai ou une démo.',
    launch: 'Structure MVP + landing 6 sections + pricing 3 paliers. Objectif : premiers essais activés.',
    accelerate: 'Parcours 180 jours calibré SaaS : activation, churn J7, MRR et canaux outbound/SEO.',
  },
  freelance: {
    validate: 'Valide ta niche : 5 RDV prospects, devis testés, ajuste l\'offre forfait ou TJM.',
    launch: 'Page 5 blocs + packages Découverte/Mission + scripts prospection LinkedIn et réseau.',
    accelerate: 'Pipeline missions, relances, marge par TJM et passage en rétainer récurrent.',
  },
  ecommerce: {
    validate: 'Teste produit star : précommandes ou 10 ventes, mesurez panier moyen et marge SKU.',
    launch: 'Fiche produit + storytelling marque + lancement Instagram/TikTok ou communauté niche.',
    accelerate: 'ROAS, CAC, email post-achat, réachat et préparation collection #2.',
  },
  agency: {
    validate: '5 audits ou RDV niche : valide problème récurrent et willingness to pay setup fee.',
    launch: 'Site niche + process 4 étapes + template proposition. Objectif 3 premiers clients.',
    accelerate: 'Delivery standardisé, récurrence mensuelle et partenariats apporteurs.',
  },
  marketplace: {
    validate: 'Recrutement manuel early adopters : choisis un côté, vise 5 users actifs.',
    launch: 'Landing 2 faces + onboarding + première transaction manuelle facilitée.',
    accelerate: 'Liquidité offre/demande, take rate, parrainage et friction transaction #1.',
  },
  impact: {
    validate: 'Valide modèle mixte : qui paie, qui bénéficie, impact mesurable dès le pilote.',
    launch: 'Page mission + transparence + offre payante ou partenariat institutionnel.',
    accelerate: 'KPI impact + viabilité économique, financements et storytelling ESS.',
  },
  consulting: {
    validate: '5 RDV dirigeants : valide enjeu, déclencheur d\'achat et pricing diagnostic.',
    launch: 'Page enjeu CEO + méthode 3 phases + CTA diagnostic 45 min payant.',
    accelerate: 'Pipeline diagnostics → missions, preuves sociales B2B et récurrence trimestrielle.',
  },
  content: {
    validate: 'Teste monétisation : lead magnet, 1 vente produit ou sponsoring symbolique.',
    launch: 'Hub creator + calendrier éditorial + CTA newsletter ou produit digital.',
    accelerate: 'Audience, RPM, collabs, diversification revenus (ads, ventes, premium).',
  },
  ofm: {
    validate:
      '5 conversations avec modèles OnlyFans (Twitter/X, Instagram) : valide commission, services OFM et limites de contenu.',
    launch:
      'Page agence OFM + charte éthique + process onboarding. Objectif : 1er contrat OnlyFans Management signé.',
    accelerate:
      'Parcours 180 jours OFM : pipeline modèles, chatting, acquisition abonnés, reporting revenus OnlyFans. Sans promesses irréalistes.',
  },
};

export function buildFreeRoadmap(snapshot: QuizProfileSnapshot | null): RoadmapTeaserStep[] {
  const businessId = (snapshot?.topBusinessId ?? 'saas') as BusinessId;
  const profile = businessProfiles[businessId] ?? businessProfiles.saas;
  const teasers = BUSINESS_TEASERS[businessId] ?? BUSINESS_TEASERS.saas;
  const personality = snapshot?.personalityLabel ?? 'ton profil';

  return [
    {
      id: 'clarify',
      phase: 'Étape 1',
      title: 'Définir ta direction',
      teaser: `À partir de ${personality.toLowerCase()} et du modèle ${profile.name}, définis le problème client précis et la transformation promise.`,
      locked: false,
    },
    {
      id: 'validate',
      phase: 'Étape 2',
      title: 'Valider l\'opportunité',
      teaser: teasers.validate,
      locked: true,
    },
    {
      id: 'launch',
      phase: 'Étape 3',
      title: 'Structurer le lancement',
      teaser: teasers.launch,
      locked: true,
    },
    {
      id: 'accelerate',
      phase: 'Étape 4',
      title: `Accélérer en ${profile.name}`,
      teaser: teasers.accelerate,
      locked: true,
    },
  ];
}
