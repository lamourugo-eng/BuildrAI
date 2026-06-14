'use client';

import BusinessModelPicker from '@/components/BusinessModelPicker';
import { ROADMAP_PROGRESS_KEY } from '@/lib/account/roadmap-storage';
import { getBusinessMatchPercent } from '@/lib/quiz/business-choices';
import {
  formatRoadmapStepHeadline,
  resolveCurrentRoadmapStep,
  type CurrentRoadmapStep,
} from '@/lib/quiz/current-roadmap-step';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import { BUSINESS_CHANGED_EVENT } from '@/lib/quiz/switch-business';
import {
  loadChosenBusiness,
  loadQuizProfile,
} from '@/lib/quiz/profile-storage';
import { loadFounderAvatar } from '@/lib/city/storage';
import { ENTREPRENEUR_PROFILES } from '@/lib/city/avatar-data';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';

interface AccountProfileProps {
  isSubscribed?: boolean;
}

export default function AccountProfile({ isSubscribed = false }: AccountProfileProps) {
  const [profile, setProfile] = useState<QuizProfileSnapshot | null>(null);
  const [chosenId, setChosenId] = useState<BusinessId | null>(null);
  const [founderAvatar, setFounderAvatar] = useState(() => loadFounderAvatar());
  const [roadmapStep, setRoadmapStep] = useState<CurrentRoadmapStep | null>(null);

  const refreshRoadmapStep = useCallback(
    (businessId: BusinessId) => {
      setRoadmapStep(resolveCurrentRoadmapStep(businessId, isSubscribed));
    },
    [isSubscribed]
  );

  useEffect(() => {
    const saved = loadQuizProfile();
    const chosen = loadChosenBusiness();
    setProfile(saved);
    setChosenId(chosen);
    setFounderAvatar(loadFounderAvatar());

    const activeId = (chosen ?? saved?.topBusinessId) as BusinessId | undefined;
    if (activeId) refreshRoadmapStep(activeId);

    function onBusinessChanged(e: Event) {
      const detail = (e as CustomEvent<{ businessId: BusinessId }>).detail;
      if (detail?.businessId) {
        setChosenId(detail.businessId);
        refreshRoadmapStep(detail.businessId);
      }
    }

    function onStorage(e: StorageEvent) {
      if (e.key === ROADMAP_PROGRESS_KEY && activeId) refreshRoadmapStep(activeId);
    }

    window.addEventListener(BUSINESS_CHANGED_EVENT, onBusinessChanged);
    window.addEventListener('storage', onStorage);
    const interval = setInterval(() => {
      const id = (loadChosenBusiness() ?? loadQuizProfile()?.topBusinessId) as
        | BusinessId
        | undefined;
      if (id) refreshRoadmapStep(id);
    }, 4000);
    return () => {
      window.removeEventListener(BUSINESS_CHANGED_EVENT, onBusinessChanged);
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, [refreshRoadmapStep]);

  if (!profile) {
    return (
      <div className="account-panel account-panel--empty">
        <span className="section-tag">Mon profil</span>
        <h2>Profil non complété</h2>
        <p>
          Passez le questionnaire pour débloquer votre profil entrepreneurial, vos modèles business
          et un coaching personnalisé.
        </p>
        <Link href="/espace?section=profil&quiz=1" className="btn btn-primary">
          Faire le questionnaire
        </Link>
      </div>
    );
  }

  const activeId = (chosenId ?? profile.topBusinessId) as BusinessId;
  const activeBiz = businessProfiles[activeId];
  const activeMatchPercent = getBusinessMatchPercent(profile.top3, activeId);
  const step = roadmapStep ?? resolveCurrentRoadmapStep(activeId, isSubscribed);

  return (
    <div className="account-panel">
      <span className="section-tag">Mon profil</span>
      <h2>Votre profil entrepreneurial</h2>

      <div className="account-profile-grid">
        <article className="account-card">
          <h3>Personnalité</h3>
          <p className="account-card-value">{profile.personalityLabel}</p>
          <p className="account-card-desc">{profile.personalityDesc}</p>
        </article>

        <article className="account-card account-card--highlight">
          <h3>Modèle actif</h3>
          <p className="account-card-value">
            {activeBiz.icon} {activeBiz.name}
          </p>
          <p className="account-card-desc">
            {activeMatchPercent != null
              ? `${activeMatchPercent}% compatibilité`
              : 'Modèle choisi librement'}{' '}
           . Utilisé par le coach
          </p>
        </article>

        {profile.entrepreneurialLevel !== 'Non renseigné' && (
          <article className="account-card">
            <h3>Niveau entrepreneurial</h3>
            <p className="account-card-value">{profile.entrepreneurialLevel}</p>
            <p className="account-card-desc">{profile.entrepreneurialLevelDesc}</p>
          </article>
        )}

        {profile.techLevel !== 'Non renseigné' && (
          <article className="account-card">
            <h3>Niveau informatique</h3>
            <p className="account-card-value">{profile.techLevel}</p>
            <p className="account-card-desc">{profile.techLevelDesc}</p>
          </article>
        )}

        {profile.investmentLevel !== 'Non renseigné' && (
          <article className="account-card">
            <h3>Budget de lancement</h3>
            <p className="account-card-value">{profile.investmentLevel}</p>
            <p className="account-card-desc">{profile.investmentLevelDesc}</p>
          </article>
        )}
      </div>

      <div className="account-card account-card--wide">
        <h3>Modèle business du coach</h3>
        <BusinessModelPicker
          profile={profile}
          activeBusinessId={activeId}
          variant="profile"
        />
      </div>

      <div className="account-card account-card--wide account-profile-roadmap">
        <div className="account-profile-roadmap-head">
          <h3>Votre étape dans le parcours</h3>
          {step.day.phaseId && step.day.phaseName && (
            <span className="account-profile-roadmap-phase">
              Étape {step.day.phaseId}/8. {step.day.phaseName}
            </span>
          )}
        </div>
        <p className="account-profile-roadmap-marker">{formatRoadmapStepHeadline(step)}</p>
        <p className="account-card-value">{step.day.title}</p>
        <p className="account-card-desc">{step.day.objective}</p>
        <ol className="account-steps-list">
          {step.day.tasks.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ol>
        <p className="account-card-desc account-profile-roadmap-meta">
          {step.completedCount > 0
            ? `${step.completedCount} jour${step.completedCount > 1 ? 's' : ''} terminé${step.completedCount > 1 ? 's' : ''} sur ${step.unlockedDays} accessibles.`
            : 'Commencez par valider cette étape dans l’onglet Parcours.'}
        </p>
        <Link href="/espace?section=parcours" className="account-inline-link">
          {step.status === 'completed_all' ? 'Consulter le parcours →' : 'Continuer le parcours →'}
        </Link>
      </div>

      <div className="account-card account-card--wide account-profile-city-link">
        <h3>Mon entrepreneur</h3>
        {founderAvatar ? (
          <p className="account-card-desc">
            <strong>{founderAvatar.name}</strong>
            {'. '}
            {ENTREPRENEUR_PROFILES.find((p) => p.id === founderAvatar.profile)?.label ??
              founderAvatar.profile}
            {'. '}
            votre personnage évolue au fil de vos étapes business dans la ville.
          </p>
        ) : (
          <p className="account-card-desc">
            Créez votre entrepreneur. Il sera le centre de votre ville de progression.
          </p>
        )}
        <div className="account-profile-city-actions">
          <Link href="/espace?section=ville" className="btn btn-outline btn-sm">
            {founderAvatar ? 'Voir ma ville' : 'Créer mon entrepreneur'}
          </Link>
          {founderAvatar && (
            <Link href="/espace?section=ville&edit=entrepreneur" className="btn btn-ghost btn-sm">
              Personnaliser
            </Link>
          )}
        </div>
      </div>

      <Link href="/espace?section=profil&quiz=1" className="btn btn-outline">
        Refaire le questionnaire
      </Link>
    </div>
  );
}
