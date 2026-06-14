import { cleanOrigin, resolveAppOrigin } from '@/lib/auth/app-origin';

export function getAppOrigin(clientOrigin?: string): string {
  return resolveAppOrigin(clientOrigin);
}

export function buildAuthCallbackUrl(
  redirectPath: string,
  clientOrigin?: string,
  extras?: { plan?: string | null; period?: string | null }
): string {
  const url = new URL('/auth/callback', getAppOrigin(clientOrigin));
  url.searchParams.set('redirect', redirectPath);
  if (extras?.plan) url.searchParams.set('plan', extras.plan);
  if (extras?.period) url.searchParams.set('period', extras.period);
  return url.toString();
}

export function resolvePostAuthPath(
  type: string | null,
  redirectParam: string | null
): string {
  if (type === 'recovery' || redirectParam === '/auth/reset-password') {
    return '/auth/reset-password';
  }
  if (redirectParam && redirectParam.startsWith('/')) {
    return redirectParam;
  }
  return '/espace';
}

export type EmailOtpType = 'email' | 'signup' | 'recovery' | 'invite' | 'magiclink';

export function mapEmailOtpType(raw: string | null): EmailOtpType | null {
  if (
    raw === 'email' ||
    raw === 'signup' ||
    raw === 'recovery' ||
    raw === 'invite' ||
    raw === 'magiclink'
  ) {
    return raw;
  }
  return null;
}

export { isPlaceholderOrigin, resolveServerAppOrigin } from '@/lib/auth/app-origin';
