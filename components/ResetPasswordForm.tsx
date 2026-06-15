'use client';

import PasswordInput from '@/components/PasswordInput';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const supabase = createClient();
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    async function checkSession() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled && !error) {
          window.history.replaceState({}, '', '/auth/reset-password');
          setReady(true);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session) {
        setReady(true);
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
          setReady(true);
        }
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    }

    void checkSession();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      setStatus('error');
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirm) {
      setStatus('error');
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      router.push('/espace');
      router.refresh();
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Impossible de mettre à jour le mot de passe. Réessaie.'
      );
    }
  }

  if (!ready) {
    return (
      <div className="auth-card">
        <p className="auth-note">Vérification du lien de réinitialisation…</p>
        <p className="auth-note">
          Si rien ne se passe, le lien a peut-être expiré.{' '}
          <a href="/login">Demande-en un nouveau</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="new-password">Nouveau mot de passe</label>
        <PasswordInput
          id="new-password"
          value={password}
          onChange={setPassword}
          placeholder="6 caractères minimum"
          autoComplete="new-password"
          minLength={6}
        />

        <label htmlFor="confirm-password">Confirmer le mot de passe</label>
        <PasswordInput
          id="confirm-password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Retape le mot de passe"
          autoComplete="new-password"
          minLength={6}
        />

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
        </button>

        {status === 'error' && <p className="auth-error">{errorMsg}</p>}
      </form>
    </div>
  );
}
