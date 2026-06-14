import AuthShell from '@/components/AuthShell';
import LoginForm from '@/components/LoginForm';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata = {
  title: 'Connexion. BuildrAI',
};

export default function LoginPage() {
  return (
    <AuthShell>
      <div className="container auth-container">
        <span className="section-tag">Connexion</span>
        <h1>Connexion</h1>
        <p className="auth-subtitle">
          Connecte-toi ou crée un compte avec ton email et mot de passe. Le questionnaire
          reste accessible gratuitement. Le coach IA nécessite un abonnement.
        </p>
        <Suspense fallback={<p>Chargement…</p>}>
          <LoginForm />
        </Suspense>
        <div className="auth-back-links">
          <Link href="/" className="btn btn-ghost auth-back">
            ← Retour à l&apos;accueil
          </Link>
          <Link href="/assistance" className="btn btn-ghost auth-back">
            Besoin d&apos;aide ?
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
