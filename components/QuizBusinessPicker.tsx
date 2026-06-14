'use client';

import {
  buildBusinessChoiceOptions,
  type BusinessChoiceOption,
} from '@/lib/quiz/business-choices';
import { businessProfiles } from '@/lib/quiz/data';
import type { BusinessId } from '@/lib/quiz/data';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';

interface QuizBusinessPickerProps {
  profile: QuizProfileSnapshot;
  selectedId: BusinessId;
  onSelect: (id: BusinessId) => void;
}

function formatCompatibility(option: BusinessChoiceOption): string {
  if (option.percent != null) return `${option.percent}% compatibilité`;
  return 'Choix libre';
}

export default function QuizBusinessPicker({
  profile,
  selectedId,
  onSelect,
}: QuizBusinessPickerProps) {
  const allChoices = buildBusinessChoiceOptions(profile.top3);
  const recommended = allChoices.filter((item) => item.recommended);
  const others = allChoices.filter((item) => !item.recommended);

  function renderItem(item: BusinessChoiceOption, rank?: number) {
    const biz = businessProfiles[item.id];
    const isSelected = item.id === selectedId;

    return (
      <li key={item.id}>
        <button
          type="button"
          className={`biz-picker-profile-item quiz-biz-choice${isSelected ? ' is-active' : ''}`}
          onClick={() => onSelect(item.id)}
          aria-pressed={isSelected}
        >
          <span
            className={`biz-picker-profile-rank${rank == null ? ' biz-picker-profile-rank--neutral' : ''}`}
          >
            {rank ?? biz.icon}
          </span>
          <span className="biz-picker-profile-body">
            <strong>
              {biz.icon} {item.name}
            </strong>
            <span>{formatCompatibility(item)}</span>
          </span>
          {item.percent != null && (
            <span className="quiz-biz-choice-pct" aria-hidden="true">
              {item.percent}%
            </span>
          )}
          {isSelected && <span className="biz-picker-profile-badge">Choisi</span>}
        </button>
      </li>
    );
  }

  return (
    <div className="quiz-biz-picker">
      <h3 className="quiz-results-title">Choisis ton modèle business</h3>
      <p className="quiz-biz-picker-hint">
        Tous les modèles sont disponibles. Les 4 premiers affichent ton score de compatibilité
        quiz. Tu pourras changer plus tard depuis ton profil.
      </p>

      {recommended.length > 0 && (
        <div className="biz-picker-profile-group">
          <p className="biz-picker-profile-group-title">Les plus compatibles avec toi</p>
          <ul className="account-business-list biz-picker-profile-list quiz-biz-picker-list">
            {recommended.map((item, index) => renderItem(item, index + 1))}
          </ul>
        </div>
      )}

      {others.length > 0 && (
        <div className="biz-picker-profile-group">
          <p className="biz-picker-profile-group-title">Autres modèles</p>
          <ul className="account-business-list biz-picker-profile-list quiz-biz-picker-list">
            {others.map((item) => renderItem(item))}
          </ul>
        </div>
      )}
    </div>
  );
}
