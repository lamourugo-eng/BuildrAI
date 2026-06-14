'use client';

import {
  markNewsletterTrialPending,
  processNewsletterTrialOptIn,
  storeNewsletterSignupEmail,
} from '@/lib/account/newsletter-trial-client';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

interface LandingNewsletterProps {
  userEmail?: string | null;
  variant?: 'section' | 'compact';
}

export default function LandingNewsletter({
  userEmail = null,
  variant = 'section',
}: LandingNewsletterProps) {
  const router = useRouter();
  const [email, setEmail] = useState(userEmail ?? '');
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setErrorMsg('Indiquez votre adresse email.');
      setStatus('error');
      return;
    }

    if (!newsletterOptIn) {
      setErrorMsg('Cochez la case pour recevoir nos emails et activer l\'essai 24 h.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    if (userEmail) {
      const data = await processNewsletterTrialOptIn();
      if (data?.trialGranted || data?.active) {
        router.push('/espace?welcome=1');
        router.refresh();
        return;
      }
      if (data?.message) {
        setErrorMsg(data.message);
      } else if (data?.reason === 'already_used') {
        setErrorMsg('Votre essai gratuit 24 h a déjà été utilisé.');
      } else if (data?.error) {
        setErrorMsg(data.error);
      } else {
        setErrorMsg('Impossible d\'activer l\'essai. Réessayez dans un instant.');
      }
      setStatus('error');
      return;
    }

    storeNewsletterSignupEmail(trimmed);
    markNewsletterTrialPending();
    const params = new URLSearchParams({
      redirect: '/espace',
      tab: 'signup',
      email: trimmed,
      newsletter: '1',
    });
    router.push(`/login?${params.toString()}`);
  }

  const form = (
    <form className={`landing-newsletter-form${variant === 'compact' ? ' landing-newsletter-form--compact' : ''}`} onSubmit={handleSubmit}>
      <label className="landing-newsletter-field">
        <span className="landing-newsletter-field-label">Votre email</span>
        <input
          type="email"
          name="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={Boolean(userEmail) || status === 'loading'}
        />
      </label>

      <label className="landing-newsletter-optin auth-newsletter-optin">
        <input
          type="checkbox"
          checked={newsletterOptIn}
          onChange={(e) => setNewsletterOptIn(e.target.checked)}
          disabled={status === 'loading'}
        />
        <span>
          J&apos;accepte de recevoir des emails de BuildrAI et bénéficie de{' '}
          <strong>24 h d&apos;accès Premium gratuit</strong> (29 €/mois). Coach, parcours
          complet et Ma ville. Retour automatique au plan Gratuit ensuite.
        </span>
      </label>

      <button
        type="submit"
        className={`btn btn-primary${variant === 'compact' ? '' : ' btn-lg'}`}
        disabled={status === 'loading'}
      >
        {status === 'loading'
          ? 'Redirection…'
          : userEmail
            ? 'Activer mon essai 24 h'
            : 'Créer mon compte + essai 24 h'}
      </button>

      {status === 'error' && errorMsg && (
        <p className="landing-newsletter-error" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  );

  if (variant === 'compact') {
    return (
      <div className="landing-newsletter landing-newsletter--compact">
        <p className="landing-newsletter-compact-lead">
          <strong>Offre newsletter</strong>. 24 h Premium offertes, sans carte bancaire.
        </p>
        {form}
      </div>
    );
  }

  return (
    <section className="landing-newsletter landing-section" id="newsletter">
      <div className="container">
        <div className="landing-newsletter-box">
          <span className="section-tag">Newsletter</span>
          <h2>24 h de Premium offertes en vous inscrivant</h2>
          <p>
            Laissez votre email, acceptez de recevoir nos conseils entrepreneuriaux et testez le
            coach IA, le parcours 180 jours et Ma ville. Puis repassez automatiquement au plan
            Gratuit.
          </p>
          {form}
          <p className="landing-newsletter-note">1 essai par compte. Sans carte bancaire</p>
        </div>
      </div>
    </section>
  );
}
