'use client';

import {
  buildBusinessChoiceOptions,
  type BusinessChoiceOption,
} from '@/lib/quiz/business-choices';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import { switchActiveBusiness } from '@/lib/quiz/switch-business';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';
import { useEffect, useMemo, useRef, useState } from 'react';

interface BusinessModelPickerProps {
  profile: QuizProfileSnapshot;
  activeBusinessId: BusinessId;
  onSwitched?: (nextId: BusinessId) => void;
  disabled?: boolean;
  /** coach = menu dans l'en-tête ; profile = liste cliquable */
  variant?: 'coach' | 'profile';
}

function formatCompatibility(option: BusinessChoiceOption): string {
  if (option.percent != null) return `${option.percent}% compatibilité`;
  return 'Choix libre';
}

export default function BusinessModelPicker({
  profile,
  activeBusinessId,
  onSwitched,
  disabled = false,
  variant = 'coach',
}: BusinessModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<BusinessId | null>(null);
  const [switching, setSwitching] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const allChoices = useMemo(() => buildBusinessChoiceOptions(profile.top3), [profile.top3]);
  const alternatives = allChoices.filter((item) => item.id !== activeBusinessId);
  const recommendedChoices = allChoices.filter((item) => item.recommended);
  const otherChoices = allChoices.filter((item) => !item.recommended);
  const activeBiz = businessProfiles[activeBusinessId];

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function requestSwitch(businessId: BusinessId) {
    if (disabled || switching || businessId === activeBusinessId) return;
    setPendingId(businessId);
    setOpen(false);
  }

  async function confirmSwitch() {
    if (!pendingId) return;
    setSwitching(true);
    try {
      await switchActiveBusiness(activeBusinessId, pendingId);
      onSwitched?.(pendingId);
    } finally {
      setSwitching(false);
      setPendingId(null);
    }
  }

  function cancelSwitch() {
    setPendingId(null);
  }

  const pendingBiz = pendingId ? businessProfiles[pendingId] : null;

  function renderCoachOption(item: BusinessChoiceOption) {
    const biz = businessProfiles[item.id];
    return (
      <button
        key={item.id}
        type="button"
        role="option"
        className="biz-picker-option"
        onClick={() => requestSwitch(item.id)}
      >
        <span className="biz-picker-option-icon">{biz.icon}</span>
        <span className="biz-picker-option-text">
          <strong>{item.name}</strong>
          <span>{formatCompatibility(item)}</span>
        </span>
      </button>
    );
  }

  function renderProfileItem(item: BusinessChoiceOption, rank?: number) {
    const biz = businessProfiles[item.id];
    const isActive = item.id === activeBusinessId;

    return (
      <li key={item.id}>
        <button
          type="button"
          className={`biz-picker-profile-item${isActive ? ' is-active' : ''}`}
          onClick={() => requestSwitch(item.id)}
          disabled={disabled || switching || isActive}
          aria-pressed={isActive}
        >
          <span
            className={`biz-picker-profile-rank${rank == null ? ' biz-picker-profile-rank--neutral' : ''}`}
          >
            {rank ?? biz.icon}
          </span>
          <span className="biz-picker-profile-body">
            <strong>{item.name}</strong>
            <span>{formatCompatibility(item)}</span>
          </span>
          {isActive && <span className="biz-picker-profile-badge">Actif</span>}
        </button>
      </li>
    );
  }

  return (
    <>
      {variant === 'coach' && (
        <div className="biz-picker biz-picker--coach" ref={panelRef}>
          <button
            type="button"
            className="biz-picker-trigger"
            onClick={() => setOpen((v) => !v)}
            disabled={disabled || switching}
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <span className="biz-picker-trigger-icon">{activeBiz.icon}</span>
            <span className="biz-picker-trigger-label">{activeBiz.name}</span>
            <span className="biz-picker-chevron" aria-hidden="true">
              ▾
            </span>
          </button>

          {open && (
            <div className="biz-picker-menu" role="listbox" aria-label="Changer de modèle business">
              <p className="biz-picker-menu-hint">
                Tous les modèles sont disponibles. Changer de modèle remet à zéro l&apos;historique
                coach sur le modèle quitté.
              </p>
              {alternatives.map((item) => renderCoachOption(item))}
            </div>
          )}
        </div>
      )}

      {variant === 'profile' && (
        <div className="biz-picker biz-picker--profile">
          <p className="biz-picker-profile-hint">
            Choisis le modèle sur lequel le coach tu accompagne. Recommandé ou autre. Changer
            de modèle efface l&apos;historique de discussion du modèle actuel.
          </p>

          {recommendedChoices.length > 0 && (
            <div className="biz-picker-profile-group">
              <p className="biz-picker-profile-group-title">Recommandés pour toi</p>
              <ul className="account-business-list biz-picker-profile-list">
                {recommendedChoices.map((item, index) => renderProfileItem(item, index + 1))}
              </ul>
            </div>
          )}

          {otherChoices.length > 0 && (
            <div className="biz-picker-profile-group">
              <p className="biz-picker-profile-group-title">Tous les autres modèles</p>
              <ul className="account-business-list biz-picker-profile-list">
                {otherChoices.map((item) => renderProfileItem(item))}
              </ul>
            </div>
          )}
        </div>
      )}

      {pendingId && pendingBiz && (
        <div className="biz-picker-confirm" role="alertdialog" aria-labelledby="biz-switch-title">
          <div className="biz-picker-confirm-card">
            <p id="biz-switch-title" className="biz-picker-confirm-title">
              Passer sur {pendingBiz.name} ?
            </p>
            <p className="biz-picker-confirm-text">
              Ton historique coach sur <strong>{activeBiz.name}</strong> sera effacé. Tu
              repartiras sur une nouvelle piste avec {pendingBiz.name}.
            </p>
            <div className="biz-picker-confirm-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={cancelSwitch}
                disabled={switching}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void confirmSwitch()}
                disabled={switching}
              >
                {switching ? 'Changement…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
