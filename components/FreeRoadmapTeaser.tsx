'use client';

import { buildFreeRoadmap } from '@/lib/quiz/free-roadmap';
import { loadQuizProfile } from '@/lib/quiz/profile-storage';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';

interface FreeRoadmapTeaserProps {
  profile?: QuizProfileSnapshot | null;
  variant?: 'dashboard' | 'quiz' | 'compact';
  showUpgradeCta?: boolean;
}

export default function FreeRoadmapTeaser({
  profile: profileProp = undefined,
  variant = 'dashboard',
  showUpgradeCta = true,
}: FreeRoadmapTeaserProps) {
  const [profile, setProfile] = useState<QuizProfileSnapshot | null>(profileProp ?? null);

  useEffect(() => {
    if (profileProp !== undefined) return;
    setProfile(loadQuizProfile());
  }, [profileProp]);

  const steps = buildFreeRoadmap(profile);

  return (
    <section className={`free-roadmap free-roadmap--${variant}`}>
      <div className="free-roadmap-header">
        <span className="section-tag">Parcours aperçu</span>
        <h3>Ton parcours en bref</h3>
        <p>
          Un aperçu des grandes étapes pour avancer. Passe à l&apos;abonnement pour débloquer le
          plan détaillé, étape par étape, avec le coach IA.
        </p>
      </div>

      <ol className="free-roadmap-steps">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`free-roadmap-step${step.locked ? ' is-locked' : ''}`}
            style={{ '--step-index': index } as CSSProperties}
          >
            <div className="free-roadmap-step-marker" aria-hidden="true">
              {step.locked ? '🔒' : index + 1}
            </div>
            <div className="free-roadmap-step-body">
              <span className="free-roadmap-step-phase">{step.phase}</span>
              <strong>{step.title}</strong>
              <p>{step.teaser}</p>
              {step.locked && (
                <span className="free-roadmap-step-lock-label">Détail réservé aux abonnés</span>
              )}
            </div>
          </li>
        ))}
      </ol>

      {showUpgradeCta && (
        <div className="free-roadmap-cta">
          <p>
            <strong>Envie d&apos;aller plus loin ?</strong> Le coach IA détaille chaque étape,
            adapte les actions à ton profil et suis le parcours semaine après semaine.
          </p>
          <Link href="/subscribe?plan=starter&period=monthly" className="btn btn-primary">
            Débloquer le parcours complet. Premium 29 €/mois
          </Link>
        </div>
      )}
    </section>
  );
}
