import { applyNewsletterTrialLocal, clearSubscriptionLocal } from '@/lib/account/subscription-storage';

const NEWSLETTER_PENDING_KEY = 'buildrai_newsletter_pending';
const NEWSLETTER_EMAIL_KEY = 'buildrai_newsletter_email';

export function storeNewsletterSignupEmail(email: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NEWSLETTER_EMAIL_KEY, email.trim());
}

export function consumeNewsletterSignupEmail(): string | null {
  if (typeof window === 'undefined') return null;
  const email = localStorage.getItem(NEWSLETTER_EMAIL_KEY);
  if (email) localStorage.removeItem(NEWSLETTER_EMAIL_KEY);
  return email;
}

export function peekNewsletterSignupEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(NEWSLETTER_EMAIL_KEY);
}

export function markNewsletterTrialPending(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NEWSLETTER_PENDING_KEY, '1');
}

export function consumeNewsletterTrialPending(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(NEWSLETTER_PENDING_KEY) !== '1') return false;
  localStorage.removeItem(NEWSLETTER_PENDING_KEY);
  return true;
}

export interface NewsletterTrialResponse {
  ok?: boolean;
  active?: boolean;
  trialGranted?: boolean;
  trialEndsAt?: string;
  trialExpired?: boolean;
  message?: string;
  reason?: string;
  error?: string;
  code?: string;
}

export async function requestNewsletterTrial(): Promise<NewsletterTrialResponse> {
  try {
    const res = await fetch('/api/user/newsletter-trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsletterOptIn: true }),
    });
    const data = (await res.json()) as NewsletterTrialResponse;
    if (!res.ok) {
      return {
        ...data,
        error:
          data.error ??
          data.message ??
          `Impossible d'activer l'essai (${res.status}). Réessayez.`,
      };
    }
    return data;
  } catch {
    return { error: 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez.' };
  }
}

export async function processNewsletterTrialOptIn(): Promise<NewsletterTrialResponse | null> {
  const data = await requestNewsletterTrial();
  if (data.error && !data.trialGranted) {
    return data;
  }
  if (data.trialGranted && data.trialEndsAt) {
    applyNewsletterTrialLocal(data.trialEndsAt);
  }
  return data;
}

export async function syncSubscriptionAndHandleTrialExpiry(): Promise<{
  active: boolean;
  trialExpired?: boolean;
}> {
  const res = await fetch('/api/subscription/sync-stripe', { method: 'POST' });
  const data = (await res.json()) as {
    active?: boolean;
    trialExpired?: boolean;
    trialEndsAt?: string;
    isNewsletterTrial?: boolean;
  };

  if (data.trialExpired) {
    clearSubscriptionLocal();
    return { active: false, trialExpired: true };
  }

  if (data.active && data.isNewsletterTrial && data.trialEndsAt) {
    applyNewsletterTrialLocal(data.trialEndsAt);
  }

  if (!data.active) {
    clearSubscriptionLocal();
  }

  return { active: Boolean(data.active), trialExpired: data.trialExpired };
}
