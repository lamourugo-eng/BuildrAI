/**
 * Synchronise produits et prix Stripe avec lib/stripe/plans.ts
 *
 * - Renomme les produits (Premium, Premium — Business Accelerator)
 * - Crée les prix : mensuel + semestriel (6 mois, −30 %)
 * - Sans essai gratuit (pas de trial_period_days)
 * - Archive le plan Scale s'il existe
 * - Met à jour les STRIPE_PRICE_* dans .env.local
 *
 * Usage : npm run stripe:sync
 * Prérequis : STRIPE_SECRET_KEY dans .env.local
 */

import Stripe from 'stripe';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SEMESTER_DISCOUNT_PERCENT = 30;
const SEMESTER_BILLING_MONTHS = 6;

const PLANS = [
  {
    id: 'starter',
    name: 'Premium',
    description:
      'Votre coach IA au quotidien — structuré, personnalisé et aligné sur vos objectifs.',
    monthly: 29,
    semesterMonthly: Math.round(29 * (1 - SEMESTER_DISCOUNT_PERCENT / 100)),
  },
  {
    id: 'growth',
    name: 'Premium — Business Accelerator',
    description:
      'Pour aller plus loin — analyses poussées, ressources et roadmap business avancée.',
    monthly: 79,
    semesterMonthly: Math.round(79 * (1 - SEMESTER_DISCOUNT_PERCENT / 100)),
  },
];

const PRICE_ENV_KEYS = {
  starter: { monthly: 'STRIPE_PRICE_STARTER_MONTHLY', semester: 'STRIPE_PRICE_STARTER_SEMESTER' },
  growth: { monthly: 'STRIPE_PRICE_GROWTH_MONTHLY', semester: 'STRIPE_PRICE_GROWTH_SEMESTER' },
};

function loadEnv(filePath) {
  const env = {};
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  } catch {
    // fichier absent
  }
  return env;
}

function expectedAmount(plan, period) {
  if (period === 'monthly') return plan.monthly * 100;
  return plan.semesterMonthly * SEMESTER_BILLING_MONTHS * 100;
}

async function listAllProducts(stripe) {
  const products = [];
  let startingAfter;
  do {
    const page = await stripe.products.list({ limit: 100, starting_after: startingAfter });
    products.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);
  return products;
}

async function findProductByPlanId(stripe, planId) {
  const products = await listAllProducts(stripe);
  return products.find((p) => p.metadata?.plan_id === planId) ?? null;
}

async function ensureProduct(stripe, plan) {
  let product = await findProductByPlanId(stripe, plan.id);
  if (product) {
    product = await stripe.products.update(product.id, {
      name: plan.name,
      description: plan.description,
      active: true,
      metadata: {
        plan_id: plan.id,
        catalog_version: 'v3-semester-6m-30pct',
      },
    });
    console.log(`✓ Produit mis à jour : ${plan.name} (${product.id})`);
  } else {
    product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: {
        plan_id: plan.id,
        catalog_version: 'v3-semester-6m-30pct',
      },
    });
    console.log(`✓ Produit créé : ${plan.name} (${product.id})`);
  }
  return product;
}

async function listProductPrices(stripe, productId) {
  const prices = [];
  let startingAfter;
  do {
    const page = await stripe.prices.list({
      product: productId,
      limit: 100,
      starting_after: startingAfter,
    });
    prices.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);
  return prices;
}

function matchesPeriod(price, period) {
  if (period === 'monthly') {
    return price.recurring?.interval === 'month' && (price.recurring?.interval_count ?? 1) === 1;
  }
  return (
    price.recurring?.interval === 'month' &&
    price.recurring?.interval_count === SEMESTER_BILLING_MONTHS
  );
}

async function ensurePrice(stripe, product, plan, period, envUpdates) {
  const amount = expectedAmount(plan, period);
  const nickname =
    period === 'monthly'
      ? `${plan.name} — Mensuel`
      : `${plan.name} — Semestriel 6 mois (-${SEMESTER_DISCOUNT_PERCENT}%)`;

  const existing = (await listProductPrices(stripe, product.id)).filter(
    (p) => p.active && matchesPeriod(p, period)
  );

  const match = existing.find(
    (p) =>
      p.unit_amount === amount &&
      p.currency === 'eur' &&
      !p.recurring?.trial_period_days
  );

  let priceId;
  if (match) {
    priceId = match.id;
    await stripe.prices.update(priceId, { nickname });
    console.log(
      `  ✓ Prix existant : ${nickname} (${priceId}) — ${amount / 100} €`
    );
  } else {
    const recurring =
      period === 'monthly'
        ? { interval: 'month' }
        : { interval: 'month', interval_count: SEMESTER_BILLING_MONTHS };

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: 'eur',
      nickname,
      recurring,
      metadata: { plan_id: plan.id, period },
    });
    priceId = price.id;
    console.log(`  ✓ Prix créé : ${nickname} (${priceId}) — ${amount / 100} €`);

    for (const old of existing) {
      if (old.id !== priceId) {
        await stripe.prices.update(old.id, { active: false });
        console.log(`  ↳ Ancien prix archivé : ${old.id}`);
      }
    }
  }

  const envKey = PRICE_ENV_KEYS[plan.id][period];
  envUpdates[envKey] = priceId;
}

async function archiveScaleProduct(stripe) {
  const products = await listAllProducts(stripe);
  const scaleProducts = products.filter(
    (p) => p.metadata?.plan_id === 'scale' || p.name === 'Scale'
  );

  if (scaleProducts.length === 0) {
    console.log('· Plan Scale : rien à archiver');
    return;
  }

  for (const product of scaleProducts) {
    if (product.active) {
      await stripe.products.update(product.id, { active: false });
    }
    const prices = await listProductPrices(stripe, product.id);
    for (const price of prices) {
      if (price.active) {
        await stripe.prices.update(price.id, { active: false });
      }
    }
    console.log(`✓ Plan Scale archivé : ${product.name} (${product.id})`);
  }
}

function updateEnvLocal(envPath, updates) {
  let content = '';
  try {
    content = readFileSync(envPath, 'utf8');
  } catch {
    content = '';
  }

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      if (content && !content.endsWith('\n')) content += '\n';
      content += `${key}=${value}\n`;
    }
  }

  writeFileSync(envPath, content, 'utf8');
}

async function main() {
  const envPath = join(root, '.env.local');
  const env = loadEnv(envPath);

  const secretKey = env.STRIPE_SECRET_KEY?.trim();
  const isPlaceholder =
    !secretKey ||
    secretKey.includes('...') ||
    /votre_cle|your[_-]?key|example|placeholder/i.test(secretKey);

  if (isPlaceholder) {
    console.error('❌ STRIPE_SECRET_KEY manquant ou invalide dans .env.local');
    process.exit(1);
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
  const envUpdates = {};

  console.log('Synchronisation Stripe — BuildrAI\n');
  console.log('Tarifs cibles :');
  console.log(
    `  Premium — 29 €/mois · 120 € / 6 mois (20 €/mois équivalent, -${SEMESTER_DISCOUNT_PERCENT} %)`
  );
  console.log(
    `  Premium — Business Accelerator — 79 €/mois · 330 € / 6 mois (55 €/mois équivalent, -${SEMESTER_DISCOUNT_PERCENT} %)`
  );
  console.log('  Sans essai gratuit · Plan Scale archivé si présent\n');

  for (const plan of PLANS) {
    const product = await ensureProduct(stripe, plan);
    await ensurePrice(stripe, product, plan, 'monthly', envUpdates);
    await ensurePrice(stripe, product, plan, 'semester', envUpdates);
  }

  await archiveScaleProduct(stripe);

  console.log('\n--- Price IDs ---');
  for (const [key, value] of Object.entries(envUpdates)) {
    console.log(`${key}=${value}`);
  }

  updateEnvLocal(envPath, envUpdates);
  console.log('\n✓ .env.local mis à jour');
  console.log('Pensez à redémarrer le serveur Next.js (npm run dev).');
}

main().catch((err) => {
  console.error('Erreur Stripe :', err.message);
  process.exit(1);
});
