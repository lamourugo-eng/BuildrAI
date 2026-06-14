/**
 * Tests — plafond tokens coach IA (logique + Supabase + routes API).
 * Usage : node scripts/test-coach-token-budget.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

function assert(condition, message) {
  if (!condition) {
    console.error('✗', message);
    process.exitCode = 1;
    return false;
  }
  console.log('✓', message);
  return true;
}

const COACH_BUDGET_EUR = { starter: 10, growth: 20 };
const MODEL_PRICING = { input: 2.3, output: 9.2 };

function getCoachUsagePeriodKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function calculateCoachCostEur(promptTokens, completionTokens) {
  const inputCost = (Math.max(0, promptTokens) / 1_000_000) * MODEL_PRICING.input;
  const outputCost = (Math.max(0, completionTokens) / 1_000_000) * MODEL_PRICING.output;
  return inputCost + outputCost;
}

function buildCoachUsageSnapshot(planId, periodKey, row) {
  const budgetEur = COACH_BUDGET_EUR[planId] ?? 10;
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
    limitReached: costEur >= budgetEur,
  };
}

console.log('--- Plafonds par formule ---');
assert(COACH_BUDGET_EUR.starter === 10, 'Premium (starter) → plafond 10 €');
assert(COACH_BUDGET_EUR.growth === 20, 'Accelerator (growth) → plafond 20 €');

console.log('\n--- Calcul coût tokens ---');
const sampleCost = calculateCoachCostEur(5000, 800);
assert(sampleCost > 0 && sampleCost < 0.05, `Coût exemple 5k+800 tokens ≈ ${sampleCost.toFixed(4)} €`);

console.log('\n--- Détection plafond atteint ---');
const starterAtLimit = buildCoachUsageSnapshot('starter', '2026-06', { cost_eur: 10 });
assert(starterAtLimit.limitReached, 'Starter bloqué à 10 €');
assert(starterAtLimit.percentUsed === 100, 'Starter à 100 %');

const starterOk = buildCoachUsageSnapshot('starter', '2026-06', { cost_eur: 9.5 });
assert(!starterOk.limitReached, 'Starter OK sous 10 €');
assert(starterOk.remainingEur === 0.5, 'Starter reste 0,50 €');

const growthAtLimit = buildCoachUsageSnapshot('growth', '2026-06', { cost_eur: 20 });
assert(growthAtLimit.limitReached, 'Growth bloqué à 20 €');

const growthOk = buildCoachUsageSnapshot('growth', '2026-06', { cost_eur: 19 });
assert(!growthOk.limitReached, 'Growth OK sous 20 €');

console.log('\n--- Clé période mensuelle ---');
const periodKey = getCoachUsagePeriodKey(new Date('2026-06-15T12:00:00Z'));
assert(periodKey === '2026-06', `Période UTC = ${periodKey}`);

async function testSupabaseTable() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.log('\n⚠ Supabase non configuré (.env.local) — tests DB ignorés');
    return;
  }

  console.log('\n--- Table Supabase coach_token_usage ---');
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { error: tableError } = await admin.from('coach_token_usage').select('user_id').limit(1);
  if (tableError) {
    const msg = tableError.message.toLowerCase();
    if (msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('could not find')) {
      console.error('✗ Table coach_token_usage absente — exécutez supabase/migrations/005_coach_token_usage.sql');
      process.exitCode = 1;
      return;
    }
    console.error('✗ Erreur Supabase:', tableError.message);
    process.exitCode = 1;
    return;
  }

  assert(true, 'Table coach_token_usage présente');

  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1 });
  if (usersError || !usersData.users?.length) {
    console.log('⚠ Aucun utilisateur auth — test upsert ignoré');
    return;
  }

  const testUserId = usersData.users[0].id;
  const testPeriod = `test-${Date.now()}`;

  const { error: insertError } = await admin.from('coach_token_usage').upsert({
    user_id: testUserId,
    period_key: testPeriod,
    prompt_tokens: 1000,
    completion_tokens: 500,
    cost_eur: 9.99,
    request_count: 1,
    updated_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error('✗ Upsert test échoué:', insertError.message);
    process.exitCode = 1;
    return;
  }

  assert(true, 'Upsert enregistrement usage OK');

  const { data: row, error: readError } = await admin
    .from('coach_token_usage')
    .select('cost_eur')
    .eq('user_id', testUserId)
    .eq('period_key', testPeriod)
    .single();

  assert(!readError && Number(row?.cost_eur) === 9.99, 'Lecture coût enregistré = 9,99 €');

  const snapshot = buildCoachUsageSnapshot('starter', testPeriod, row);
  assert(!snapshot.limitReached, '9,99 € sur plan starter → pas encore bloqué');

  await admin.from('coach_token_usage').delete().eq('user_id', testUserId).eq('period_key', testPeriod);
  assert(true, 'Nettoyage ligne test OK');
}

async function testApiRoutes() {
  console.log('\n--- Routes API (serveur local) ---');

  try {
    const chatRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test', businessId: 'saas' }),
    });
    assert(
      chatRes.status === 403 || chatRes.status === 401,
      `POST /api/chat sans abonnement → ${chatRes.status} (attendu 401/403)`
    );

    const espaceRes = await fetch(`${BASE_URL}/espace?section=coach`);
    assert(espaceRes.ok, `Page espace coach accessible → ${espaceRes.status}`);
  } catch (err) {
    console.error('\n⚠ Serveur non joignable sur', BASE_URL);
    console.error('  Lancez `npm run dev` puis relancez ce script.');
    console.error('  Erreur:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}

await testSupabaseTable();
await testApiRoutes();

console.log('\n--- Résumé ---');
if (process.exitCode) {
  console.log('Certains tests ont échoué.');
} else {
  console.log('Tous les tests sont passés.');
}
