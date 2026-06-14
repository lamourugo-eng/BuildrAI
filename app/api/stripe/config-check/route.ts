import {
  formatStripeConfigError,
  getMissingStripeEnvKeys,
  getRequiredStripeEnvKeys,
} from '@/lib/stripe/required-env';
import { getStripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

/**
 * Diagnostic Stripe (sans exposer les secrets).
 * GET /api/stripe/config-check
 */
export async function GET() {
  const missing = getMissingStripeEnvKeys();
  const required = getRequiredStripeEnvKeys();
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? '';
  const mode = secretKey.startsWith('sk_live_')
    ? 'live'
    : secretKey.startsWith('sk_test_')
      ? 'test'
      : 'unknown';

  const invalidPrices: string[] = [];

  if (missing.length === 0) {
    try {
      const stripe = getStripe();
      for (const key of required.filter((k) => k.startsWith('STRIPE_PRICE_'))) {
        const priceId = process.env[key]?.trim();
        if (!priceId) continue;
        try {
          const price = await stripe.prices.retrieve(priceId);
          if (mode === 'live' && !price.livemode) {
            invalidPrices.push(`${key} (price test avec clé live)`);
          }
          if (mode === 'test' && price.livemode) {
            invalidPrices.push(`${key} (price live avec clé test)`);
          }
        } catch {
          invalidPrices.push(`${key} (introuvable pour cette clé)`);
        }
      }
    } catch {
      /* clé invalide — missing/invalid géré ailleurs */
    }
  }

  const ok = missing.length === 0 && invalidPrices.length === 0;

  let hint = 'Stripe semble configuré côté serveur.';
  if (missing.length > 0) {
    hint = formatStripeConfigError(missing);
  } else if (invalidPrices.length > 0) {
    hint =
      'Les STRIPE_PRICE_* sur Vercel ne correspondent pas au mode live/test de STRIPE_SECRET_KEY. Relancez npm.cmd run stripe:sync, copiez les nouveaux price_... sur Vercel, puis redeploy.';
  }

  return NextResponse.json({
    ok,
    mode,
    missing,
    invalidPrices,
    required,
    hint,
  });
}
