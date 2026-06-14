/**
 * Affiche la checklist de mise en production et les variables Vercel à copier.
 * Usage : node scripts/print-production-checklist.mjs
 * Option : PROD_URL=https://usebuildrai.com node scripts/print-production-checklist.mjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const PROD_URL = (process.env.PROD_URL || 'https://usebuildrai.com').replace(/\/$/, '');

function loadEnvLocal() {
  const vars = {};
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!vars[key]) vars[key] = value;
    }
  } catch {
    console.error('⚠ .env.local introuvable — renseignez les variables manuellement.');
  }
  return vars;
}

const env = loadEnvLocal();

const vercelVars = [
  ['NEXT_PUBLIC_APP_URL', PROD_URL],
  ['NEXT_PUBLIC_SUPABASE_URL', env.NEXT_PUBLIC_SUPABASE_URL],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
  ['SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY],
  ['OPENAI_API_KEY', env.OPENAI_API_KEY],
  ['OPENAI_MODEL', env.OPENAI_MODEL || 'gpt-4o'],
  ['ADMIN_EMAILS', env.ADMIN_EMAILS],
  ['STRIPE_SECRET_KEY', env.STRIPE_SECRET_KEY],
  ['STRIPE_PRICE_STARTER_MONTHLY', env.STRIPE_PRICE_STARTER_MONTHLY],
  ['STRIPE_PRICE_STARTER_SEMESTER', env.STRIPE_PRICE_STARTER_SEMESTER],
  ['STRIPE_PRICE_GROWTH_MONTHLY', env.STRIPE_PRICE_GROWTH_MONTHLY],
  ['STRIPE_PRICE_GROWTH_SEMESTER', env.STRIPE_PRICE_GROWTH_SEMESTER],
  ['STRIPE_BILLING_PORTAL_CONFIG_ID', env.STRIPE_BILLING_PORTAL_CONFIG_ID],
  ['STRIPE_WEBHOOK_SECRET', env.STRIPE_WEBHOOK_SECRET || '(à créer — voir ci-dessous)'],
];

console.log(`
═══════════════════════════════════════════════════════════════
  BuildrAI — Checklist production
  URL : ${PROD_URL}
═══════════════════════════════════════════════════════════════

1) VERCEL — Settings → Environment Variables (Production)
   Copiez depuis votre .env.local sauf NEXT_PUBLIC_APP_URL :

`);

for (const [key, value] of vercelVars) {
  const status = value ? '✓' : '✗ MANQUANT';
  const preview =
    value && value.length > 12
      ? `${value.slice(0, 6)}…${value.slice(-4)}`
      : value || '';
  console.log(`   ${status}  ${key}${preview ? ` = ${preview}` : ''}`);
}

console.log(`
   ⚠ Gardez NEXT_PUBLIC_APP_URL=${PROD_URL} sur Vercel
   ⚠ Ne mettez PAS http://localhost:3000 en production

2) SUPABASE — Authentication → URL Configuration
   Site URL :
     ${PROD_URL}
   Redirect URLs (ajoutez les deux) :
     ${PROD_URL}/auth/callback/**
     http://localhost:3000/auth/callback/**

3) SUPABASE — SQL Editor (si pas encore fait)
   Exécutez dans l'ordre :
     supabase/migrations/001_coach_memory.sql
     supabase/migrations/002_coach_journey_phase.sql
     supabase/migrations/003_user_notepad.sql
     supabase/migrations/004_user_profiles.sql
     supabase/migrations/005_coach_token_usage.sql
   Ou : SUPABASE_DB_PASSWORD=xxx npm run db:apply-migrations

4) STRIPE — Webhooks (mode test pour l'instant)
   Endpoint : ${PROD_URL}/api/stripe/webhook
   Événements : checkout.session.completed, customer.subscription.*
   Copiez le signing secret → STRIPE_WEBHOOK_SECRET sur Vercel

5) Vérifications manuelles
   □ Inscription email → lien de confirmation ouvre ${PROD_URL}/auth/callback
   □ Essai newsletter 24 h (compte connecté)
   □ Checkout Premium → retour sur ${PROD_URL}/espace
   □ Coach IA répond (OPENAI_API_KEY configurée)

═══════════════════════════════════════════════════════════════
`);

const missing = vercelVars.filter(([key, value]) => !value || value.startsWith('('));
if (missing.length) {
  console.log(`Variables à compléter : ${missing.map(([k]) => k).join(', ')}\n`);
  process.exitCode = 1;
}
