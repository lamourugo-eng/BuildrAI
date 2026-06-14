'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface LandingStickyCtaProps {
  onOpenQuiz: () => void;
  enabled: boolean;
}

/** Barre d'action fixe en bas de page pour capter les visiteurs qui scrollent. */
export default function LandingStickyCta({ onOpenQuiz, enabled }: LandingStickyCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled]);

  if (!enabled || !visible) return null;

  return (
    <div className="landing-sticky-cta landing-sticky-cta--mobile" role="region" aria-label="Commencer maintenant">
      <div className="container landing-sticky-cta-inner">
        <p className="landing-sticky-cta-copy landing-only-desktop">
          <strong>Passez de l&apos;idée à l&apos;action</strong>
          <span>Sans carte · accès immédiat</span>
        </p>
        <div className="landing-sticky-cta-actions">
          <button type="button" className="btn btn-primary landing-cta-primary" onClick={onOpenQuiz}>
            Créer mon plan gratuitement
          </button>
          <Link href="/#newsletter" className="btn btn-outline landing-only-desktop">
            Coach 24h
          </Link>
        </div>
      </div>
    </div>
  );
}
