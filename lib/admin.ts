export const SUBSCRIPTION_COOKIE = 'buildrai_subscribed';
export const PLAN_COOKIE = 'buildrai_plan';

/** Admins toujours autorisés (complété par ADMIN_EMAILS). */
const BUILTIN_ADMIN_EMAILS = ['buildraimail@gmail.com'];

/** Emails admin (séparés par des virgules dans ADMIN_EMAILS). */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  const fromEnv = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...BUILTIN_ADMIN_EMAILS, ...fromEnv])];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
