import {
  businessCostBand,
  businessProfiles,
  dimensionLabels,
  investmentSummaries,
  levelSummaries,
  personalityMap,
  profileLabels,
  quizQuestions,
  type BusinessId,
  type InvestmentBand,
  type LevelDimension,
  type PersonalityId,
} from './data';

export type BudgetFit = 'ideal' | 'possible' | 'stretch';

export interface QuizLevels {
  entrepreneurial: { label: string; desc: string };
  tech: { label: string; desc: string };
  investment: { label: string; desc: string };
}

const INVESTMENT_BANDS: InvestmentBand[] = ['minimal', 'moderate', 'substantial'];

const BUDGET_FIT_MATRIX: Record<
  InvestmentBand,
  Record<'low' | 'medium' | 'high', BudgetFit>
> = {
  minimal: { low: 'ideal', medium: 'stretch', high: 'stretch' },
  moderate: { low: 'ideal', medium: 'ideal', high: 'possible' },
  substantial: { low: 'ideal', medium: 'ideal', high: 'ideal' },
};

const BUDGET_FIT_LABELS: Record<BudgetFit, string> = {
  ideal: 'Aligné avec ton budget',
  possible: 'Faisable avec un lancement progressif',
  stretch: 'À adapter à ton budget actuel',
};

const BUDGET_ADVICE: Record<BusinessId, Record<InvestmentBand, string>> = {
  freelance: {
    minimal: 'Idéal avec moins de 100 € : lance-toi avec ton expertise et des outils gratuits.',
    moderate: 'Avec 100 à 1 000 €, professionnalisez ton image (site, portfolio, outils pro).',
    substantial: 'Au-delà de 1 000 €, accélérez la prospection (pub ciblée, formations, assistant).',
  },
  consulting: {
    minimal: 'Moins de 100 € suffit : ton crédibilité et ton réseau sont tes premiers atouts.',
    moderate: 'Avec 100 à 1 000 €, investissez dans un site pro et des supports pour rassurer tes clients.',
    substantial: 'Au-delà de 1 000 €, financez contenu expert, événements et acquisition ciblée.',
  },
  content: {
    minimal: 'Moins de 100 € : smartphone, outils gratuits et régularité suffisent pour démarrer.',
    moderate: 'Avec 100 à 1 000 €, améliorez la qualité (micro, montage, site) pour monétiser plus vite.',
    substantial: 'Au-delà de 1 000 €, accélérez avec sponsoring, formations ou une petite équipe éditoriale.',
  },
  agency: {
    minimal: 'Moins de 100 € : démarrez en solo sur une niche. Le relationnel compte plus que le budget.',
    moderate: 'Avec 100 à 1 000 €, financez un site crédible et tes premiers outils de delivery.',
    substantial: 'Au-delà de 1 000 €, recrutez en freelance et investissez dans l\'acquisition commerciale.',
  },
  ecommerce: {
    minimal: 'Moins de 100 € : testez une micro-collection ou du dropshipping sans stock au départ.',
    moderate: 'Avec 100 à 1 000 €, lancez site, premiers stocks et pub ciblée sur une niche.',
    substantial: 'Au-delà de 1 000 €, construisez une vraie marque avec stock, pub et identité visuelle.',
  },
  impact: {
    minimal: 'Moins de 100 € : validez l\'impact avec un pilote local avant d\'investir davantage.',
    moderate: 'Avec 100 à 1 000 €, structurez l\'offre et touchez tes premiers bénéficiaires.',
    substantial: 'Au-delà de 1 000 €, scalez l\'impact tout en renforçant le modèle économique.',
  },
  saas: {
    minimal: 'Moins de 100 € : prototype no-code ou offre de conseil pour financer le produit.',
    moderate: 'Avec 100 à 1 000 €, lancez un MVP léger (no-code ou dev ciblé) avant une grosse V1.',
    substantial: 'Au-delà de 1 000 €, développez, testez et acquérez tes premiers utilisateurs.',
  },
  marketplace: {
    minimal: 'Moins de 100 € : lancez manuellement sur une micro-niche avant de coder la plateforme.',
    moderate: 'Avec 100 à 1 000 €, financez une V1 simple sur un marché très ciblé.',
    substantial: 'Au-delà de 1 000 €, construisez la plateforme et amorcez offre et demande.',
  },
  ofm: {
    minimal:
      'Moins de 100 € : démarrez en solo OFM avec charte, Notion et prospection modèles OnlyFans (Twitter/X).',
    moderate:
      'Avec 100 à 1 000 €, professionnalisez contrats OFM, CRM et page agence pour signer tes premiers modèles OnlyFans.',
    substantial:
      'Au-delà de 1 000 €, structurez chatters + process acquisition abonnés OnlyFans avec reporting transparent.',
  },
};

const BUDGET_FIRST_STEPS: Partial<Record<BusinessId, Partial<Record<BudgetFit, string>>>> = {
  saas: {
    stretch: 'Avec un budget limité, valider le problème via entretiens clients et un prototype no-code avant tout développement coûteux.',
    possible: 'Prioriser un MVP minimal (une fonctionnalité clé) pour tester la willingness-to-pay avant d\'investir davantage.',
  },
  marketplace: {
    stretch: 'Concilier ton budget en lançant d\'abord la mise en relation à la main sur une niche très précise.',
    possible: 'Démarrer sur un seul segment (une ville, un métier) pour limiter les coûts techniques.',
  },
  ecommerce: {
    stretch: 'Réduire le risque avec des précommandes ou une collection test avant d\'investir dans le stock.',
  },
};

export interface RankedResult {
  id: BusinessId;
  score: number;
  percent: number;
}

export function calculateScores(answers: number[]): RankedResult[] {
  const scores = Object.keys(businessProfiles).reduce(
    (acc, key) => ({ ...acc, [key]: 0 }),
    {} as Record<BusinessId, number>
  );

  answers.forEach((answerIndex, qIndex) => {
    const option = quizQuestions[qIndex]?.options[answerIndex];
    if (option?.scores) {
      Object.entries(option.scores).forEach(([biz, pts]) => {
        scores[biz as BusinessId] = (scores[biz as BusinessId] || 0) + pts;
      });
    }
  });

  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({ id: id as BusinessId, score }));

  return applyCompatibilityPercents(ranked);
}

/** Score max théorique : 9 questions × 3 points max */
const MAX_QUIZ_SCORE = 27;

/** Cibles moyennes : #1 ≈ 87 %, #2 ≈ 78 %, #3 ≈ 65 %, #4 ≈ 55 %. Ajustées par les réponses */
const ANCHORS = [87, 78, 65, 55] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function applyCompatibilityPercents(
  ranked: { id: BusinessId; score: number }[]
): RankedResult[] {
  const top = ranked[0]?.score ?? 0;
  const second = ranked[1]?.score ?? 0;
  const third = ranked[2]?.score ?? 0;
  const fourth = ranked[3]?.score ?? 0;

  const fit = top / MAX_QUIZ_SCORE;
  const dominance = (top - second) / MAX_QUIZ_SCORE;
  const gap23 = (second - third) / MAX_QUIZ_SCORE;
  const gap34 = (third - fourth) / MAX_QUIZ_SCORE;
  const ratio2 = top > 0 ? second / top : 0;
  const ratio3 = top > 0 ? third / top : 0;
  const ratio4 = top > 0 ? fourth / top : 0;

  const top4Percents: number[] = [];

  // Choix #1. Autour de 87 %, monte si profil très net, baisse si serré
  top4Percents[0] = clamp(
    ANCHORS[0] +
      (fit - 0.72) * 14 +
      dominance * 9 -
      (1 - ratio2) * 6,
    83,
    91
  );

  // Choix #2. Autour de 78 %, suit l'écart avec le #1
  top4Percents[1] = clamp(
    ANCHORS[1] +
      (ratio2 - 0.85) * 14 -
      dominance * 10 +
      gap23 * 6,
    72,
    top4Percents[0] - 7
  );

  // Choix #3. Autour de 65 %
  top4Percents[2] = clamp(
    ANCHORS[2] +
      (ratio3 - 0.68) * 12 -
      gap23 * 7 +
      (1 - dominance) * 4,
    58,
    top4Percents[1] - 7
  );

  // Choix #4. Autour de 55 %
  top4Percents[3] = clamp(
    ANCHORS[3] +
      (ratio4 - 0.58) * 10 -
      gap34 * 6 +
      (1 - dominance) * 3,
    48,
    top4Percents[2] - 7
  );

  // Écarts minimum entre les 4 premiers
  if (top4Percents[1] > top4Percents[0] - 8) {
    top4Percents[1] = top4Percents[0] - 8;
  }
  if (top4Percents[2] > top4Percents[1] - 9) {
    top4Percents[2] = top4Percents[1] - 9;
  }
  if (top4Percents[3] > top4Percents[2] - 8) {
    top4Percents[3] = top4Percents[2] - 8;
  }

  return ranked.map((item, index) => {
    let percent: number;

    if (index < 4) {
      percent = Math.round(top4Percents[index]);
    } else {
      const gapFromTop = top - item.score;
      percent = Math.round(clamp(ANCHORS[2] - gapFromTop * 3.5 - index * 3, 35, 57));
    }

    return { ...item, percent };
  });
}

export function getInvestmentAnswerIndex(answers: number[]): number | null {
  const qIndex = quizQuestions.findIndex((q) => q.levelDimension === 'investment');
  if (qIndex < 0 || answers[qIndex] === undefined) return null;
  return answers[qIndex];
}

export function getInvestmentBand(investmentIndex: number): InvestmentBand {
  return INVESTMENT_BANDS[Math.min(investmentIndex, INVESTMENT_BANDS.length - 1)] ?? 'moderate';
}

export function getQuizLevels(answers: number[]): QuizLevels {
  const fallback = { label: 'Non renseigné', desc: '' };

  function pickLevel(dimension: Exclude<LevelDimension, 'investment'>) {
    const qIndex = quizQuestions.findIndex((q) => q.levelDimension === dimension);
    if (qIndex < 0) return fallback;
    const answerIndex = answers[qIndex];
    const option = quizQuestions[qIndex]?.options[answerIndex];
    if (!option) return fallback;
    const levelIndex = Math.min(answerIndex, levelSummaries[dimension].length - 1);
    return {
      label: option.label,
      desc: levelSummaries[dimension][levelIndex]?.desc ?? option.desc,
    };
  }

  function pickInvestment() {
    const qIndex = quizQuestions.findIndex((q) => q.levelDimension === 'investment');
    if (qIndex < 0) return fallback;
    const answerIndex = answers[qIndex];
    const option = quizQuestions[qIndex]?.options[answerIndex];
    if (!option) return fallback;
    const levelIndex = Math.min(answerIndex, investmentSummaries.length - 1);
    return {
      label: option.label,
      desc: investmentSummaries[levelIndex]?.desc ?? option.desc,
    };
  }

  return {
    entrepreneurial: pickLevel('entrepreneurial'),
    tech: pickLevel('tech'),
    investment: pickInvestment(),
  };
}

export function getBudgetFit(
  businessId: BusinessId,
  investmentIndex: number
): { fit: BudgetFit; title: string; advice: string } {
  const band = getInvestmentBand(investmentIndex);
  const cost = businessCostBand[businessId];
  const fit = BUDGET_FIT_MATRIX[band][cost];

  return {
    fit,
    title: BUDGET_FIT_LABELS[fit],
    advice: BUDGET_ADVICE[businessId][band],
  };
}

export function getAdaptedFirstSteps(
  businessId: BusinessId,
  investmentIndex: number | null
): string[] {
  const base = [...businessProfiles[businessId].firstSteps];
  if (investmentIndex === null) return base;

  const { fit } = getBudgetFit(businessId, investmentIndex);
  const prefix = BUDGET_FIRST_STEPS[businessId]?.[fit];
  return prefix ? [prefix, ...base] : base;
}

export function getPersonalityType(topBusiness: BusinessId) {
  const id = personalityMap[topBusiness] || 'builder';
  return { id, ...profileLabels[id as PersonalityId] };
}

export function getAlignmentReasons(businessId: BusinessId, answers: number[]) {
  const reasons: string[] = [];
  answers.forEach((answerIndex, qIndex) => {
    const question = quizQuestions[qIndex];
    const option = question?.options[answerIndex];
    const pts = option?.scores?.[businessId] || 0;
    if (pts >= 2) {
      const dimLabel =
        question?.levelDimension === 'entrepreneurial'
          ? 'Niveau entrepreneurial'
          : question?.levelDimension === 'tech'
            ? 'Niveau informatique'
            : question?.levelDimension === 'investment'
              ? 'Budget de lancement'
              : dimensionLabels[qIndex]?.label ?? 'Profil';
      reasons.push(`${dimLabel} : ${option.label}`);
    }
  });
  return reasons.slice(0, 4);
}

export function getMatchLabel(percent: number) {
  if (percent >= 85) return 'Excellent match';
  if (percent >= 75) return 'Très bon match';
  if (percent >= 65) return 'Bon match';
  return 'Match possible';
}

export const resultBadges = [
  'Choix n°1. Le plus adapté',
  'Choix n°2. Très bon match',
  'Choix n°3. À regarder aussi',
  'Choix n°4. Piste intéressante',
];
