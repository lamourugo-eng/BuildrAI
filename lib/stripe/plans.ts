import type { BillingPeriod, PlanId } from '@/lib/stripe';

export const SEMESTER_DISCOUNT_PERCENT = 30;
export const SEMESTER_BILLING_MONTHS = 6;

function semesterMonthlyEquivalent(monthly: number): number {
  return Math.round(monthly * (1 - SEMESTER_DISCOUNT_PERCENT / 100));
}

export interface BillingPlan {
  id: PlanId;
  name: string;
  desc: string;
  monthly: number;
  /** Équivalent €/mois affiché (avec −30 %). */
  semester: number;
  features: string[];
  popular: boolean;
}

export interface PublicPlan {
  id: PublicPlanId;
  name: string;
  desc: string;
  monthly: number;
  semester: number;
  features: string[];
  popular: boolean;
  isFree?: boolean;
  cta: string;
  ctaClass: 'btn-outline' | 'btn-primary' | 'btn-ghost';
  href: string;
}

export type PublicPlanId = PlanId | 'free';

export const FREE_PLAN_FEATURES = [
  'Questionnaire entrepreneurial complet (9 questions)',
  'Analyse de profil. Personnalité, budget, niveau',
  'Modèles business adaptés avec scores de compatibilité',
  'Espace personnel. Vue d\'ensemble, profil & bloc-notes',
  'Aperçu du parcours 180 jours (6 chapitres)',
] as const;

export const FREE_PLAN: PublicPlan = {
  id: 'free',
  name: 'Gratuit',
  desc: 'Découvre ton profil et les modèles qui te correspondent. Sans carte bancaire.',
  monthly: 0,
  semester: 0,
  features: [...FREE_PLAN_FEATURES],
  popular: false,
  isFree: true,
  cta: 'Créer un compte gratuit',
  ctaClass: 'btn-primary',
  href: '/login?redirect=/espace',
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'starter',
    name: 'Premium',
    desc: 'Ton coach IA au quotidien. Structuré, personnalisé et aligné sur tes objectifs.',
    monthly: 29,
    semester: semesterMonthlyEquivalent(29),
    features: [
      'Coach IA illimité avec mémoire (8 étapes)',
      'Parcours 180 jours. 6 chapitres, accessibles dès l\'abonnement',
      'Ma ville · Avatar, districts et empire isométrique',
      'Suivi d\'activité, streaks & bloc-notes',
      'Synchronisation coach ↔ parcours jour J',
      'Check-in quotidien & plan d\'action personnalisé',
    ],
    popular: true,
  },
  {
    id: 'growth',
    name: 'Premium. Business Accelerator',
    desc: 'Pour aller plus loin. Analyses poussées, ressources et parcours business avancé.',
    monthly: 79,
    semester: semesterMonthlyEquivalent(79),
    features: [
      'Tout Premium (29 €), plus :',
      'Analyse hebdomadaire IA. Synchronisée parcours & coach',
      'Bibliothèque 22+ ressources. Templates, scripts & prompts',
      'Guides d\'utilisation par phase coach et chapitre',
      'Priorité sur les nouvelles fonctionnalités',
    ],
    popular: false,
  },
];

export function getPlanById(planId: PlanId): BillingPlan | undefined {
  return BILLING_PLANS.find((p) => p.id === planId);
}

export function getPublicPlanById(planId: PublicPlanId): PublicPlan | BillingPlan | undefined {
  if (planId === 'free') return FREE_PLAN;
  return getPlanById(planId);
}

export function getPublicPricingPlans(period: BillingPeriod): PublicPlan[] {
  const paid: PublicPlan[] = BILLING_PLANS.map((plan) => ({
    ...plan,
    cta:
      plan.id === 'growth'
        ? 'Choisir Business Accelerator'
        : `Choisir ${plan.name}`,
    ctaClass: 'btn-primary',
    href: `/login?redirect=/subscribe&plan=${plan.id}&period=${period}`,
  }));

  return [FREE_PLAN, ...paid];
}

export function getPlanPrice(plan: BillingPlan, period: BillingPeriod): number {
  return period === 'semester' ? plan.semester : plan.monthly;
}

/** Montant total facturé tous les 6 mois (€). */
export function getSemesterTotalPrice(plan: BillingPlan): number {
  return plan.semester * SEMESTER_BILLING_MONTHS;
}

export function formatSemesterBillingHint(): string {
  return `facturé tous les ${SEMESTER_BILLING_MONTHS} mois`;
}
