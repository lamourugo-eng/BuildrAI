import type { PlanId } from '@/lib/stripe';

/** Crédit coach IA mensuel par formule (coût API max en €). */
export const COACH_BUDGET_EUR: Record<PlanId, number> = {
  starter: 10,
  growth: 20,
};

/** EUR par 1M tokens (input / output) — aligné sur la tarification OpenAI (~USD × 0,92). */
const MODEL_PRICING_EUR_PER_1M: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.3, output: 9.2 },
  'gpt-4o-mini': { input: 0.14, output: 0.55 },
  'gpt-4.1': { input: 1.84, output: 7.36 },
  'gpt-4.1-mini': { input: 0.37, output: 1.47 },
  'gpt-4-turbo': { input: 9.2, output: 27.6 },
};

const DEFAULT_PRICING = MODEL_PRICING_EUR_PER_1M['gpt-4o'];

export function getCoachBudgetEur(planId: PlanId): number {
  return COACH_BUDGET_EUR[planId] ?? COACH_BUDGET_EUR.starter;
}

export function getCoachUsagePeriodKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function resolveModelPricing(model: string) {
  const key = model.trim().toLowerCase();
  if (MODEL_PRICING_EUR_PER_1M[key]) return MODEL_PRICING_EUR_PER_1M[key];
  const prefix = Object.keys(MODEL_PRICING_EUR_PER_1M).find((name) => key.startsWith(name));
  if (prefix) return MODEL_PRICING_EUR_PER_1M[prefix];
  return DEFAULT_PRICING;
}

export function calculateCoachCostEur(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = resolveModelPricing(model);
  const inputCost = (Math.max(0, promptTokens) / 1_000_000) * pricing.input;
  const outputCost = (Math.max(0, completionTokens) / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

export function formatCoachCostEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export interface CoachUsageSnapshot {
  periodKey: string;
  planId: PlanId;
  budgetEur: number;
  costEur: number;
  remainingEur: number;
  percentUsed: number;
  promptTokens: number;
  completionTokens: number;
  requestCount: number;
  limitReached: boolean;
}

export function buildCoachUsageSnapshot(
  planId: PlanId,
  periodKey: string,
  row?: {
    cost_eur?: number | string | null;
    prompt_tokens?: number | string | null;
    completion_tokens?: number | string | null;
    request_count?: number | null;
  } | null
): CoachUsageSnapshot {
  const budgetEur = getCoachBudgetEur(planId);
  const costEur = Number(row?.cost_eur ?? 0);
  const remainingEur = Math.max(0, budgetEur - costEur);
  const percentUsed = budgetEur > 0 ? Math.min(100, Math.round((costEur / budgetEur) * 100)) : 100;

  return {
    periodKey,
    planId,
    budgetEur,
    costEur,
    remainingEur,
    percentUsed,
    promptTokens: Number(row?.prompt_tokens ?? 0),
    completionTokens: Number(row?.completion_tokens ?? 0),
    requestCount: Number(row?.request_count ?? 0),
    limitReached: costEur >= budgetEur,
  };
}

export const COACH_BUDGET_ERROR_CODE = 'COACH_BUDGET_EXCEEDED';

export function coachBudgetExceededMessage(_snapshot: CoachUsageSnapshot): string {
  return 'Tu as atteint la limite d\'utilisation du coach pour ce mois. Reprenez le mois prochain ou passez à une formule supérieure.';
}
