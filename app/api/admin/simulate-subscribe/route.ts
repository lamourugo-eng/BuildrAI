import { isAdminEmail, PLAN_COOKIE, SUBSCRIPTION_COOKIE } from '@/lib/admin';
import { MAX_ROADMAP_MONTHS } from '@/lib/account/subscription-storage';
import { createClient } from '@/lib/supabase/server';
import type { BillingPeriod, PlanId } from '@/lib/stripe';
import { normalizeBillingPeriod } from '@/lib/stripe';
import { NextResponse } from 'next/server';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

function parseSimulationBody(body: unknown): {
  planId: PlanId;
  period: BillingPeriod;
  monthsPaid?: number;
} | null {
  if (!body || typeof body !== 'object') return null;
  const raw = body as Record<string, unknown>;
  const planId = raw.planId === 'starter' || raw.planId === 'growth' ? raw.planId : null;
  if (!planId) return null;

  const period = normalizeBillingPeriod(
    typeof raw.period === 'string' ? raw.period : undefined
  );
  let monthsPaid: number | undefined;
  if (typeof raw.monthsPaid === 'number' && Number.isFinite(raw.monthsPaid)) {
    monthsPaid = Math.min(MAX_ROADMAP_MONTHS, Math.max(1, Math.round(raw.monthsPaid)));
  }

  return { planId, period, monthsPaid };
}

/**
 * Active ou change l'abonnement simulé en mode admin (sans Stripe).
 * Body JSON : { planId: 'starter' | 'growth', period?: 'monthly' | 'semester', monthsPaid?: 1-6 }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Accès admin refusé' }, { status: 403 });
  }

  let parsed = parseSimulationBody(await request.json().catch(() => null));
  if (!parsed) {
    parsed = { planId: 'growth', period: 'monthly' };
  }

  const response = NextResponse.json({
    ok: true,
    planId: parsed.planId,
    period: parsed.period,
    monthsPaid: parsed.monthsPaid,
    redirect: '/espace?checkout=success&admin=1',
  });

  response.cookies.set(SUBSCRIPTION_COOKIE, '1', {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 365,
  });

  response.cookies.set(PLAN_COOKIE, parsed.planId, {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

/**
 * Révoque la simulation d'abonnement admin (retour plan gratuit).
 */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Accès admin refusé' }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SUBSCRIPTION_COOKIE, '', { ...COOKIE_OPTS, maxAge: 0 });
  response.cookies.set(PLAN_COOKIE, '', { ...COOKIE_OPTS, maxAge: 0 });

  return response;
}
