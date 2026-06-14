'use client';

import LoginForm from '@/components/LoginForm';
import { Suspense, useEffect } from 'react';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
      <button
        type="button"
        className="login-modal-backdrop"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="login-modal-panel">
        <button type="button" className="login-modal-close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
        <span className="section-tag">Connexion</span>
        <h2 id="login-modal-title">Accède à ton espace</h2>
        <p className="login-modal-subtitle">
          Connecte-toi avec ton email et mot de passe. Le questionnaire reste gratuit sans
          compte.
        </p>
        <Suspense fallback={<p className="login-modal-loading">Chargement…</p>}>
          <LoginForm redirect="/espace" mode="account" />
        </Suspense>
      </div>
    </div>
  );
}
