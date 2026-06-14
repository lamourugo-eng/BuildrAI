const PLACEHOLDER_PATTERNS = [
  /votre-domaine/i,
  /your-domain/i,
  /example\.com/i,
  /changeme/i,
];

export function cleanOrigin(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/$/, '');
  return trimmed || null;
}

export function isPlaceholderOrigin(origin: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(origin));
}

export function isLocalhostOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * URL publique pour les liens email / Stripe.
 * - Sur le site en prod : utilise l'URL du navigateur (fiable).
 * - En local : utilise NEXT_PUBLIC_APP_URL si c'est une vraie URL (tunnel, prod).
 * - Ignore les placeholders du type https://votre-domaine.com
 */
export function resolveAppOrigin(clientOrigin?: string): string {
  const configured = cleanOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const client = cleanOrigin(clientOrigin);

  if (client && !isLocalhostOrigin(client) && !isPlaceholderOrigin(client)) {
    return client;
  }

  if (configured && !isPlaceholderOrigin(configured)) {
    return configured;
  }

  if (client) return client;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
}

/** URL serveur (Stripe, metadata, etc.) — sans origine navigateur. */
export function resolveServerAppOrigin(): string {
  const vercelOrigin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`
    : null;
  const configured = cleanOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const configuredUsable =
    configured &&
    !isPlaceholderOrigin(configured) &&
    !(process.env.NODE_ENV === 'production' && isLocalhostOrigin(configured));

  if (configuredUsable) return configured;
  if (vercelOrigin) return vercelOrigin;
  if (configured) return configured;
  return 'http://localhost:3000';
}
