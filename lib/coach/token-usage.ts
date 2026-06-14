import {
  buildCoachUsageSnapshot,
  calculateCoachCostEur,
  getCoachUsagePeriodKey,
  type CoachUsageSnapshot,
} from '@/lib/coach/token-budget';
import type { PlanId } from '@/lib/stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

export function isMissingCoachTokenUsageTable(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('coach_token_usage') &&
    (lower.includes('does not exist') ||
      lower.includes('schema cache') ||
      lower.includes('could not find'))
  );
}

export async function loadCoachTokenUsage(
  supabase: SupabaseClient,
  userId: string,
  planId: PlanId,
  periodKey = getCoachUsagePeriodKey()
): Promise<CoachUsageSnapshot> {
  const { data, error } = await supabase
    .from('coach_token_usage')
    .select('cost_eur, prompt_tokens, completion_tokens, request_count')
    .eq('user_id', userId)
    .eq('period_key', periodKey)
    .maybeSingle();

  if (error) throw error;
  return buildCoachUsageSnapshot(planId, periodKey, data);
}

export async function recordCoachTokenUsage(
  supabase: SupabaseClient,
  userId: string,
  planId: PlanId,
  model: string,
  usage: { prompt_tokens?: number | null; completion_tokens?: number | null },
  periodKey = getCoachUsagePeriodKey()
): Promise<CoachUsageSnapshot> {
  const promptTokens = Math.max(0, usage.prompt_tokens ?? 0);
  const completionTokens = Math.max(0, usage.completion_tokens ?? 0);
  const deltaCost = calculateCoachCostEur(model, promptTokens, completionTokens);

  const existing = await loadCoachTokenUsage(supabase, userId, planId, periodKey);

  const next = {
    user_id: userId,
    period_key: periodKey,
    prompt_tokens: existing.promptTokens + promptTokens,
    completion_tokens: existing.completionTokens + completionTokens,
    cost_eur: existing.costEur + deltaCost,
    request_count: existing.requestCount + 1,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('coach_token_usage')
    .upsert(next, { onConflict: 'user_id,period_key' })
    .select('cost_eur, prompt_tokens, completion_tokens, request_count')
    .single();

  if (error) throw error;
  return buildCoachUsageSnapshot(planId, periodKey, data);
}

export async function canUseCoachBudget(
  supabase: SupabaseClient,
  userId: string,
  planId: PlanId,
  periodKey = getCoachUsagePeriodKey()
): Promise<CoachUsageSnapshot> {
  try {
    const snapshot = await loadCoachTokenUsage(supabase, userId, planId, periodKey);
    return snapshot;
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (isMissingCoachTokenUsageTable(message)) {
      return buildCoachUsageSnapshot(planId, periodKey, null);
    }
    throw err;
  }
}
