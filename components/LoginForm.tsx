'use client';

import PasswordInput from '@/components/PasswordInput';
import { buildAuthCallbackUrl } from '@/lib/auth/callback-url';
import { pushLocalUserDataToServer } from '@/lib/account/user-data-sync';
import { createClient } from '@/lib/supabase/client';
import {
  markNewsletterTrialPending,
  peekNewsletterSignupEmail,
  processNewsletterTrialOptIn,
} from '@/lib/account/newsletter-trial-client';
import { getErrorMessage } from '@/lib/errors';
import { normalizeBillingPeriod } from '@/lib/stripe';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

const PLAN_LABELS: Record<string, string> = {
  starter: 'Premium',
  growth: 'Premium. Business Accelerator',
};

type AuthView = 'login' | 'signup' | 'forgot';

interface LoginFormProps {
  redirect?: string;
  plan?: string | null;
  period?: string;
  authError?: boolean;
  mode?: 'subscribe' | 'account';
}

function buildRedirectPath(redirect: string, plan: string | null, period: string): string {
  const base = redirect.startsWith('/') ? redirect : `/${redirect}`;
  const params = new URLSearchParams();
  if (plan) params.set('plan', plan);
  const normalized = normalizeBillingPeriod(period);
  if (normalized !== 'monthly') params.set('period', normalized);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function buildResetRedirectUrl(): string {
  return buildAuthCallbackUrl('/auth/reset-password', window.location.origin);
}

function mapAuthError(err: unknown, view: AuthView): string {
  const message = getErrorMessage(err, '');
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Un compte existe déjà avec cet email. Connecte-toi.';
  }
  if (lower.includes('password') && lower.includes('least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (lower.includes('valid email')) {
    return 'Adresse email invalide.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirme ton email avant de te connecter (vérifie ta boîte mail).';
  }
  if (
    lower.includes('error sending confirmation') ||
    lower.includes('confirmation mail') ||
    lower.includes('confirmation email')
  ) {
    return 'Impossible d\'envoyer l\'email de confirmation. Vérifie la configuration SMTP dans Supabase (Authentication → SMTP Settings).';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('email rate')) {
    return 'Trop de tentatives. Attends 1 à 2 minutes, puis réessaie.';
  }
  if (lower.includes('redirect') && (lower.includes('not allowed') || lower.includes('invalid'))) {
    return 'URL de redirection non autorisée. Ajoute https://usebuildrai.com/auth/callback/** dans Supabase (Authentication → URL Configuration).';
  }
  if (lower.includes('signups not allowed') || lower.includes('signup disabled')) {
    return 'Les inscriptions sont désactivées sur ce projet Supabase.';
  }
  if (lower.includes('invalid api key') || lower.includes('jwt')) {
    return 'Clés Supabase incorrectes sur le site (Vercel → Environment Variables).';
  }

  if (message.trim()) {
    return view === 'signup'
      ? `Impossible de créer le compte : ${message}`
      : view === 'forgot'
        ? `Impossible d'envoyer l'email : ${message}`
        : `Connexion impossible : ${message}`;
  }

  return view === 'signup'
    ? 'Impossible de créer le compte. Réessaie.'
    : view === 'forgot'
      ? 'Impossible d\'envoyer l\'email. Réessaie.'
      : 'Connexion impossible. Vérifie tes identifiants.';
}

export default function LoginForm(props: LoginFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = props.redirect ?? searchParams.get('redirect') ?? '/espace';
  const plan = props.plan !== undefined ? props.plan : searchParams.get('plan');
  const period = props.period ?? searchParams.get('period') ?? 'monthly';
  const authError =
    props.authError ?? searchParams.get('error') === 'auth';
  const mode = props.mode ?? (plan ? 'subscribe' : 'account');

  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'signup-sent' | 'reset-sent' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const planLabel = plan ? PLAN_LABELS[plan] : null;

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const newsletterParam = searchParams.get('newsletter');
    const tabParam = searchParams.get('tab');

    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      const stored = peekNewsletterSignupEmail();
      if (stored) setEmail(stored);
    }

    if (newsletterParam === '1') {
      setNewsletterOptIn(true);
    }

    if (tabParam === 'signup') {
      setView('signup');
    }
  }, [searchParams]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) throw error;

      await pushLocalUserDataToServer();
      router.push(buildRedirectPath(redirect, plan, period));
      router.refresh();
    } catch (err) {
      setStatus('error');
      setErrorMsg(mapAuthError(err, 'login'));
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return;

    if (password.length < 6) {
      setStatus('error');
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(redirect, window.location.origin, {
            plan,
            period,
          }),
        },
      });

      if (error) throw error;

      if (data.session) {
        if (newsletterOptIn) {
          await processNewsletterTrialOptIn();
        }
        await pushLocalUserDataToServer();
        router.push(buildRedirectPath(redirect, plan, period));
        router.refresh();
        return;
      }

      if (newsletterOptIn) {
        markNewsletterTrialPending();
      }

      setStatus('signup-sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(mapAuthError(err, 'signup'));
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: buildResetRedirectUrl(),
      });

      if (error) throw error;
      setStatus('reset-sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(mapAuthError(err, 'forgot'));
    }
  }

  function switchView(next: AuthView) {
    setView(next);
    setStatus('idle');
    setErrorMsg('');
    if (next !== 'forgot') setPassword('');
  }

  return (
    <div className="auth-card">
      {planLabel && (
        <div className="auth-plan-badge">
          <span className="section-tag">Formule choisie</span>
          <strong>
            {planLabel}. {normalizeBillingPeriod(period) === 'semester' ? 'Semestriel' : 'Mensuel'}
          </strong>
        </div>
      )}

      {authError && (
        <p className="auth-error">
          Le lien de confirmation est invalide ou expiré. Demande un nouvel email ou reconnecte-toi.
        </p>
      )}

      {status === 'signup-sent' ? (
        <div className="auth-success">
          <h2>Compte créé</h2>
          <p>
            Un email de confirmation a été envoyé à <strong>{email}</strong>. Ouvrez-le sur ton
            téléphone dans <strong>Safari ou Chrome</strong> (pas seulement l&apos;aperçu Gmail).
            Puis connecte-toi.
            {newsletterOptIn && (
              <>
                {' '}
                Ton essai Premium 24 h démarrera à la première connexion.
              </>
            )}
          </p>
          <button type="button" className="btn btn-outline" onClick={() => switchView('login')}>
            Aller à la connexion
          </button>
        </div>
      ) : status === 'reset-sent' ? (
        <div className="auth-success">
          <h2>Email envoyé</h2>
          <p>
            Si un compte existe pour <strong>{email}</strong>, tu recevras un lien pour
            réinitialiser ton mot de passe.
          </p>
          <button type="button" className="btn btn-outline" onClick={() => switchView('login')}>
            Retour à la connexion
          </button>
        </div>
      ) : view === 'forgot' ? (
        <form onSubmit={handleForgotPassword} className="auth-form">
          <h2 className="auth-form-title">Mot de passe oublié</h2>
          <p className="auth-form-lead">
            Entre ton email. Nous t&apos;enverrons un lien de réinitialisation.
          </p>

          <label htmlFor="email-forgot">Adresse email</label>
          <input
            id="email-forgot"
            type="email"
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Envoi…' : 'Envoyer le lien'}
          </button>

          {status === 'error' && <p className="auth-error">{errorMsg}</p>}

          <button
            type="button"
            className="auth-forgot-link"
            onClick={() => switchView('login')}
          >
            ← Retour à la connexion
          </button>
        </form>
      ) : (
        <>
          <div className="auth-tabs" role="tablist" aria-label="Mode d'authentification">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'login'}
              className={`auth-tab${view === 'login' ? ' is-active' : ''}`}
              onClick={() => switchView('login')}
            >
              Se connecter
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'signup'}
              className={`auth-tab${view === 'signup' ? ' is-active' : ''}`}
              onClick={() => switchView('signup')}
            >
              Créer un compte
            </button>
          </div>

          <form
            onSubmit={view === 'login' ? handleLogin : handleSignup}
            className="auth-form"
          >
            <label htmlFor="email">Adresse email</label>
            <input
              id="email"
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div className="auth-password-row">
              <label htmlFor="password">Mot de passe</label>
              {view === 'login' && (
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => switchView('forgot')}
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              placeholder={view === 'signup' ? '6 caractères minimum' : 'Ton mot de passe'}
              autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
              minLength={6}
            />

            {view === 'signup' && (
              <label className="auth-newsletter-optin">
                <input
                  type="checkbox"
                  checked={newsletterOptIn}
                  onChange={(e) => setNewsletterOptIn(e.target.checked)}
                />
                <span>
                  J&apos;accepte de recevoir des emails de BuildrAI et bénéficie de{' '}
                  <strong>24 h d&apos;accès Premium gratuit</strong> (29 €/mois). Coach, parcours
                  complet et Ma ville. Retour automatique au plan Gratuit ensuite.
                </span>
              </label>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={status === 'loading'}
            >
              {status === 'loading'
                ? 'Chargement…'
                : view === 'login'
                  ? mode === 'account'
                    ? 'Se connecter'
                    : 'Se connecter et continuer'
                  : 'Créer mon compte'}
            </button>

            {status === 'error' && <p className="auth-error">{errorMsg}</p>}

            <p className="auth-note">
              {view === 'login'
                ? mode === 'account'
                  ? 'Accède à ton espace client avec ton email et mot de passe.'
                  : 'Connexion requise pour souscrire et accéder au coach IA.'
                : 'Crée un compte pour accéder à ton espace et gérer ton abonnement.'}
            </p>
          </form>
        </>
      )}
    </div>
  );
}
