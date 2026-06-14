'use client';

import AuthShell from '@/components/AuthShell';
import {
  mapEmailOtpType,
  resolvePostAuthPath,
} from '@/lib/auth/callback-url';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Échange le code / token email dans le navigateur (fiable sur mobile).
 * Le callback serveur échoue souvent dans le navigateur in-app des apps mail.
 */
export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Confirmation de ton email…');

  useEffect(() => {
    let cancelled = false;

    async function waitForSessionFromHash(
      supabase: ReturnType<typeof createClient>,
      timeoutMs = 10_000
    ) {
      const existing = await supabase.auth.getSession();
      if (existing.data.session) return;

      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          subscription.unsubscribe();
          reject(new Error('session_timeout'));
        }, timeoutMs);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            window.clearTimeout(timeout);
            subscription.unsubscribe();
            resolve();
          }
        });
      });
    }

    async function run() {
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const redirectParam = searchParams.get('redirect');
      const plan = searchParams.get('plan');
      const period = searchParams.get('period');

      const redirectPath = resolvePostAuthPath(type, redirectParam);
      const target = new URL(redirectPath, window.location.origin);
      if (plan) target.searchParams.set('plan', plan);
      if (period) target.searchParams.set('period', period);

      try {
        const supabase = createClient();

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash) {
          const otpType = mapEmailOtpType(type);
          if (!otpType) throw new Error('invalid_otp_type');
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });
          if (error) throw error;
        } else if (window.location.hash.includes('access_token')) {
          await waitForSessionFromHash(supabase);
        } else {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!data.session) throw new Error('missing_session');
        }

        if (cancelled) return;
        router.replace(`${target.pathname}${target.search}`);
        router.refresh();
      } catch {
        if (cancelled) return;
        setMessage('Lien expiré ou déjà utilisé. Redirection vers la connexion…');
        window.setTimeout(() => {
          const login = new URL('/login', window.location.origin);
          login.searchParams.set('error', 'auth');
          if (plan) login.searchParams.set('plan', plan);
          if (period) login.searchParams.set('period', period);
          router.replace(`${login.pathname}${login.search}`);
        }, 2200);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <AuthShell>
      <div className="container auth-container auth-callback-pending">
        <span className="section-tag">Connexion</span>
        <h1>Presque terminé</h1>
        <p className="auth-subtitle">{message}</p>
        <p className="auth-callback-hint">
          Si rien ne se passe, ouvrez le lien dans Safari ou Chrome plutôt que dans
          l&apos;aperçu intégré de ton app mail.
        </p>
      </div>
    </AuthShell>
  );
}
