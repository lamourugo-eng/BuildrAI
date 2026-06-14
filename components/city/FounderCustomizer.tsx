'use client';

import FounderCharacter from '@/components/city/FounderCharacter';
import IsoTile from '@/components/city/IsoTile';
import {
  createDefaultAvatarDraft,
  FOUNDER_ACCESSORIES,
  FOUNDER_LOOKS,
  FOUNDER_OUTFITS,
  type EntrepreneurProfile,
  type FounderAvatar,
} from '@/lib/city/avatar-data';
import {
  getAppearanceMinLevel,
  getEffectiveAppearanceValue,
  getLockedAppearancePreview,
  getUnlockLevelName,
  isAppearanceUnlocked,
  sanitizeAvatarForLevel,
  type AppearanceCategory,
} from '@/lib/city/avatar-unlocks';
import { saveFounderAvatar } from '@/lib/city/storage';
import { useEffect, useMemo, useState } from 'react';

interface FounderCustomizerProps {
  defaultProfile?: EntrepreneurProfile;
  initialAvatar?: FounderAvatar | null;
  playerLevelId?: number;
  variant?: 'onboarding' | 'edit';
  submitLabel?: string;
  onComplete: (avatar: FounderAvatar) => void;
  onCancel?: () => void;
}

type CustomizerTab = 'outfit' | 'accessory' | 'look';

const CUSTOMIZER_TABS: { id: CustomizerTab; label: string; category: AppearanceCategory }[] = [
  { id: 'outfit', label: 'Tenue', category: 'outfit' },
  { id: 'accessory', label: 'Accessoires', category: 'accessory' },
  { id: 'look', label: 'Style', category: 'look' },
];

function visualTierFromLevel(levelId: number): 'beginner' | 'intermediate' | 'advanced' {
  if (levelId >= 4) return 'advanced';
  if (levelId >= 3) return 'intermediate';
  return 'beginner';
}

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
  category,
  playerLevelId = 1,
}: {
  options: { id: T; label: string; desc?: string; emoji?: string }[];
  value: T;
  onChange: (id: T) => void;
  columns?: number;
  category: AppearanceCategory;
  playerLevelId?: number;
}) {
  const effectiveValue = getEffectiveAppearanceValue(category, value, playerLevelId);

  return (
    <div className={`founder-opt-grid founder-opt-grid--${columns}`}>
      {options.map((opt) => {
        const locked = !isAppearanceUnlocked(category, opt.id, playerLevelId);
        const minLevel = getAppearanceMinLevel(category, opt.id);

        return (
          <button
            key={opt.id}
            type="button"
            className={[
              'founder-opt',
              effectiveValue === opt.id ? 'is-active' : '',
              locked ? 'is-locked' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={locked}
            aria-disabled={locked}
            title={
              locked
                ? `Débloqué au ${getUnlockLevelName(minLevel)} (niv. ${minLevel})`
                : undefined
            }
            onClick={() => {
              if (!locked) onChange(opt.id);
            }}
          >
            {opt.emoji && <span className="founder-opt-emoji">{opt.emoji}</span>}
            <strong>{opt.label}</strong>
            {locked && minLevel > 1 ? (
              <span className="founder-opt-lock">Niv. {minLevel}</span>
            ) : (
              opt.desc && <span className="founder-opt-desc">{opt.desc}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function FounderCustomizer({
  defaultProfile = 'tech',
  initialAvatar = null,
  playerLevelId = 1,
  variant = 'onboarding',
  submitLabel,
  onComplete,
  onCancel,
}: FounderCustomizerProps) {
  const [draft, setDraft] = useState<FounderAvatar>(() =>
    sanitizeAvatarForLevel(
      initialAvatar ?? createDefaultAvatarDraft('Fondateur', defaultProfile),
      playerLevelId
    )
  );
  const [activeTab, setActiveTab] = useState<CustomizerTab>('outfit');

  useEffect(() => {
    setDraft((prev) => sanitizeAvatarForLevel(prev, playerLevelId));
  }, [playerLevelId]);

  const lockedPreview = useMemo(
    () => getLockedAppearancePreview(playerLevelId),
    [playerLevelId]
  );

  function update<K extends keyof FounderAvatar>(key: K, value: FounderAvatar[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sanitized = sanitizeAvatarForLevel(
      {
        ...draft,
        name: 'Fondateur',
        gender: 'neutral',
        createdAt: draft.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      playerLevelId
    );
    saveFounderAvatar(sanitized);
    onComplete(sanitized);
  }

  const label =
    submitLabel ??
    (variant === 'onboarding' ? 'Valider mon personnage' : 'Enregistrer les modifications');

  const previewTier = visualTierFromLevel(playerLevelId);

  return (
    <form className={`founder-customizer founder-customizer--${variant}`} onSubmit={handleSubmit}>
      <div className="founder-customizer-head">
        <div>
          {variant === 'onboarding' ? (
            <span className="founder-customizer-step">Étape 2. Personnage</span>
          ) : (
            <span className="founder-customizer-step">Personnalisation</span>
          )}
          <h3>
            {variant === 'onboarding'
              ? 'Créez votre entrepreneur'
              : 'Ajuster tenue & accessoires'}
          </h3>
          <p>
            {variant === 'edit'
              ? 'Les options grisées se débloquent en gagnant de l\'XP dans votre empire.'
              : 'Choisissez une tenue de départ. Le reste se débloque en progressant.'}
          </p>
        </div>
        {playerLevelId > 1 && (
          <span className="founder-customizer-level-pill">Niv. {playerLevelId}</span>
        )}
      </div>

      <div className="founder-customizer-layout">
        <div className="founder-customizer-preview">
          <div className="founder-preview-scene founder-preview-scene--iso">
            <div className="founder-preview-sky" aria-hidden="true" />
            <div className="city-iso-scene city-iso-scene--compact founder-preview-iso">
              <IsoTile gx={4} gy={7} compact forceVariant="grass" />
              <IsoTile gx={5} gy={7} compact forceVariant="road" />
              <IsoTile gx={6} gy={6} compact forceVariant="grass" />
              <div className="iso-hero-plaza" style={{ left: 0, top: 0, zIndex: 40 }}>
                <span className="iso-hero-plaza-glow" aria-hidden="true" />
                <div className="iso-hero-platform">
                  <FounderCharacter
                    avatar={{ ...draft, gender: 'neutral', name: 'Fondateur' }}
                    levelId={playerLevelId}
                    visualTier={previewTier}
                    preview
                    customizerPreview
                    showBadge
                    showEvolutionHint={false}
                  />
                </div>
              </div>
            </div>
          </div>
          <p className="founder-preview-caption">
            Aperçu live. En ville, votre look évolue aussi avec le niveau empire.
          </p>
          {lockedPreview.length > 0 && (
            <div className="founder-preview-unlocks-wrap">
              <span className="founder-preview-unlocks-label">Prochains déblocages</span>
              <p className="founder-preview-unlocks">
                {lockedPreview.slice(0, 3).join('. ')}
                {lockedPreview.length > 3 ? '…' : ''}
              </p>
            </div>
          )}
        </div>

        <div className="founder-customizer-panel">
          <div className="founder-customizer-tabs" role="tablist" aria-label="Catégories">
            {CUSTOMIZER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`founder-customizer-tab${activeTab === tab.id ? ' is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="founder-customizer-section">
            {activeTab === 'outfit' && (
              <OptionGrid
                options={FOUNDER_OUTFITS}
                value={draft.outfit}
                onChange={(v) => update('outfit', v)}
                columns={2}
                category="outfit"
                playerLevelId={playerLevelId}
              />
            )}
            {activeTab === 'accessory' && (
              <OptionGrid
                options={FOUNDER_ACCESSORIES}
                value={draft.accessory}
                onChange={(v) => update('accessory', v)}
                columns={3}
                category="accessory"
                playerLevelId={playerLevelId}
              />
            )}
            {activeTab === 'look' && (
              <OptionGrid
                options={FOUNDER_LOOKS}
                value={draft.look}
                onChange={(v) => update('look', v)}
                columns={2}
                category="look"
                playerLevelId={playerLevelId}
              />
            )}
          </div>

          <div className="founder-customizer-actions">
            {onCancel && (
              <button type="button" className="btn btn-ghost" onClick={onCancel}>
                Annuler
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-block">
              {label}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
