import { PLAN_COOKIE, SUBSCRIPTION_COOKIE } from '@/lib/admin';
import type { PlanId } from '@/lib/stripe';
import { NextResponse } from 'next/server';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
};

export function setActiveSubscriptionCookies(response: NextResponse, planId: PlanId): void {
  response.cookies.set(SUBSCRIPTION_COOKIE, '1', COOKIE_OPTS);
  response.cookies.set(PLAN_COOKIE, planId, COOKIE_OPTS);
}

export function clearSubscriptionCookies(response: NextResponse): void {
  response.cookies.set(SUBSCRIPTION_COOKIE, '', { ...COOKIE_OPTS, maxAge: 0 });
  response.cookies.set(PLAN_COOKIE, '', { ...COOKIE_OPTS, maxAge: 0 });
}
