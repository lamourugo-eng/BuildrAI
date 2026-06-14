import {
  formatStripeConfigError,
  getMissingStripeEnvKeys,
  getRequiredStripeEnvKeys,
} from '@/lib/stripe/required-env';
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

  return NextResponse.json({
    ok: missing.length === 0,
    mode,
    missing,
    required,
    hint:
      missing.length > 0
        ? formatStripeConfigError(missing)
        : 'Stripe semble configuré côté serveur.',
  });
}
