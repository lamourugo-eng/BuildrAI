/**
 * Active la résiliation d'abonnement dans le portail client Stripe (live ou test).
 * Usage : npm.cmd run stripe:portal
 * Prérequis : STRIPE_SECRET_KEY dans .env.local
 */

import Stripe from 'stripe';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  const env = {};
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    console.error('❌ .env.local introuvable');
    process.exit(1);
  }
  return env;
}

const env = loadEnvLocal();
const secretKey = env.STRIPE_SECRET_KEY?.trim();

if (!secretKey || secretKey.includes('...')) {
  console.error('❌ STRIPE_SECRET_KEY manquant dans .env.local');
  process.exit(1);
}

const mode = secretKey.startsWith('sk_live_') ? 'live' : 'test';
const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });

const portalFeatures = {
  customer_update: {
    enabled: true,
    allowed_updates: ['email', 'address'],
  },
  invoice_history: { enabled: true },
  payment_method_update: { enabled: true },
  subscription_cancel: {
    enabled: true,
    mode: 'at_period_end',
    cancellation_reason: {
      enabled: true,
      options: [
        'too_expensive',
        'missing_features',
        'switched_service',
        'unused',
        'customer_service',
        'other',
      ],
    },
  },
  subscription_update: { enabled: false },
};

try {
  const existing = await stripe.billingPortal.configurations.list({ limit: 5 });
  let config = existing.data[0];

  if (config) {
    config = await stripe.billingPortal.configurations.update(config.id, {
      business_profile: {
        headline: 'BuildrAI — Gérer ton abonnement',
      },
      features: portalFeatures,
    });
    console.log(`✓ Portail client mis à jour (${mode}) : ${config.id}`);
  } else {
    config = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'BuildrAI — Gérer ton abonnement',
      },
      features: portalFeatures,
    });
    console.log(`✓ Portail client créé (${mode}) : ${config.id}`);
  }

  const envPath = resolve(process.cwd(), '.env.local');
  let envContent = '';
  try {
    envContent = readFileSync(envPath, 'utf8');
  } catch {
    envContent = '';
  }
  const envKey = 'STRIPE_BILLING_PORTAL_CONFIG_ID';
  const line = `${envKey}=${config.id}`;
  const regex = new RegExp(`^${envKey}=.*$`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, line);
  } else {
    if (envContent && !envContent.endsWith('\n')) envContent += '\n';
    envContent += `${line}\n`;
  }
  writeFileSync(envPath, envContent, 'utf8');
  console.log(`✓ ${envKey} enregistré dans .env.local`);

  console.log(`
Résiliation configurée :
  • Annulation en fin de période (accès Premium jusqu'au bout du mois payé)
  • Historique des factures + mise à jour carte bancaire

Côté site : Mon espace → Abonnement → « Gérer ou résilier mon abonnement »

Vérifier dans Stripe (${mode}) :
  https://dashboard.stripe.com/settings/billing/portal

Ajoute aussi sur Vercel (Production) :
  STRIPE_BILLING_PORTAL_CONFIG_ID=${config.id}
`);
} catch (err) {
  console.error('❌ Échec :', err instanceof Error ? err.message : err);
  process.exit(1);
}
