import Stripe from 'stripe';

export class StripeSubscriptionLookupError extends Error {
  readonly transient: boolean;

  constructor(message: string, transient: boolean) {
    super(message);
    this.name = 'StripeSubscriptionLookupError';
    this.transient = transient;
  }
}

export function isTransientStripeError(err: unknown): boolean {
  if (err instanceof StripeSubscriptionLookupError) {
    return err.transient;
  }

  if (err instanceof Stripe.errors.StripeConnectionError) {
    return true;
  }

  if (err instanceof Stripe.errors.StripeAPIError) {
    const status = err.statusCode;
    return status === 429 || (typeof status === 'number' && status >= 500);
  }

  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('fetch failed')
    );
  }

  return false;
}

export function toStripeSubscriptionLookupError(err: unknown): StripeSubscriptionLookupError {
  if (err instanceof StripeSubscriptionLookupError) {
    return err;
  }

  const message = err instanceof Error ? err.message : 'Erreur Stripe inconnue';
  return new StripeSubscriptionLookupError(message, isTransientStripeError(err));
}
