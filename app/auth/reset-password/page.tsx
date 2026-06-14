import AuthShell from '@/components/AuthShell';
import ResetPasswordForm from '@/components/ResetPasswordForm';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata = {
  title: 'Nouveau mot de passe. BuildrAI',
};

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <div className="container auth-container">
        <span className="section-tag">Sécurité</span>
        <h1>Nouveau mot de passe</h1>
        <p className="auth-subtitle">
          Choisis un nouveau mot de passe pour ton espace client.
        </p>
        <Suspense fallback={<p>Chargement…</p>}>
          <ResetPasswordForm />
        </Suspense>
        <Link href="/login" className="btn btn-ghost auth-back">
          ← Retour à la connexion
        </Link>
      </div>
    </AuthShell>
  );
}
