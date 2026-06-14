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
    <div className="landing-sticky-cta" role="region" aria-label="Commencer maintenant">
      <div className="container landing-sticky-cta-inner">
        <p className="landing-sticky-cta-copy">
          <strong>Prêt à avancer ?</strong>
          <span>Quiz 4 min · sans carte bancaire</span>
        </p>
        <div className="landing-sticky-cta-actions">
          <button type="button" className="btn btn-primary" onClick={onOpenQuiz}>
            Quiz gratuit
          </button>
          <Link href="/#newsletter" className="btn btn-outline">
            Essai 24 h
          </Link>
        </div>
      </div>
    </div>
  );
}
