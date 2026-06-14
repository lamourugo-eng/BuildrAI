import type { BillingPeriod, PlanId } from '@/lib/stripe';
import { STRIPE_PRICE_ENV_KEYS } from '@/lib/stripe/catalog';

const CORE_KEYS = ['STRIPE_SECRET_KEY'] as const;

export function getRequiredStripeEnvKeys(
  plan?: PlanId,
  period?: BillingPeriod
): string[] {
  const keys: string[] = [...CORE_KEYS];
  if (plan && period) {
    keys.push(STRIPE_PRICE_ENV_KEYS[plan][period]);
    if (period === 'semester') {
      keys.push(STRIPE_PRICE_ENV_KEYS[plan][period].replace('_SEMESTER', '_YEARLY'));
    }
  } else {
    for (const planKeys of Object.values(STRIPE_PRICE_ENV_KEYS)) {
      keys.push(planKeys.monthly, planKeys.semester);
    }
  }
  return [...new Set(keys)];
}

export function getMissingStripeEnvKeys(
  plan?: PlanId,
  period?: BillingPeriod
): string[] {
  const keys = getRequiredStripeEnvKeys(plan, period);
  return keys.filter((key) => {
    const value = process.env[key]?.trim();
    if (!value) return true;
    if (key === 'STRIPE_SECRET_KEY') {
      return value.includes('...') || /^sk_(test|live)_\.{3}$/.test(value);
    }
    return value.includes('...');
  });
}

export function formatStripeConfigError(
  missing: string[],
  plan?: PlanId,
  period?: BillingPeriod
): string {
  if (missing.length === 0) return '';

  const where =
    process.env.VERCEL === '1'
      ? 'Vercel → Settings → Environment Variables → Production, puis Redeploy'
      : '.env.local (puis redémarrez le serveur : arrêtez npm run dev et relancez-le)';

  const scope =
    plan && period ? ` (plan ${plan}, période ${period})` : '';

  const onlySecretKey =
    missing.length === 1 && missing[0] === 'STRIPE_SECRET_KEY';

  const extra =
    onlySecretKey && process.env.VERCEL !== '1'
      ? ' Après modification de .env.local, Next.js ne recharge pas les variables tant que le serveur n\'est pas redémarré.'
      : '';

  return `Configuration Stripe incomplète${scope} : ${missing.join(', ')} manquant(s). Ajoutez-les dans ${where}.${extra}`;
}
