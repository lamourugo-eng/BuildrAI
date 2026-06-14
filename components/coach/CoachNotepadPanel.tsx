'use client';

import { useNotepadSync } from '@/lib/account/use-notepad';
import Link from 'next/link';

const COACH_NOTEPAD_OPEN_KEY = 'buildrai_coach_notepad_open';

interface CoachNotepadPanelProps {
  open: boolean;
  onClose: () => void;
}

export function loadCoachNotepadOpenPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(COACH_NOTEPAD_OPEN_KEY) === '1';
}

export function saveCoachNotepadOpenPreference(open: boolean): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(COACH_NOTEPAD_OPEN_KEY, open ? '1' : '0');
}

export default function CoachNotepadPanel({ open, onClose }: CoachNotepadPanelProps) {
  const { content, handleChange, status, statusLabel, errorMessage } = useNotepadSync();

  if (!open) return null;

  return (
    <aside
      id="coach-notepad-panel"
      className="coach-notepad-panel"
      aria-label="Bloc-notes de la conversation"
    >
      <div className="coach-notepad-panel-head">
        <div className="coach-notepad-panel-title">
          <span className="coach-notepad-panel-icon" aria-hidden="true">
            📝
          </span>
          <strong>Bloc-notes</strong>
          <span
            className={`coach-notepad-panel-status coach-notepad-panel-status--${status}`}
            title={statusLabel}
            aria-label={statusLabel}
          />
        </div>
        <button
          type="button"
          className="coach-notepad-panel-close"
          onClick={onClose}
          aria-label="Fermer le bloc-notes"
        >
          ×
        </button>
      </div>

      <textarea
        className="coach-notepad-panel-editor"
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Notez ici les infos utiles de la conversation…"
        rows={7}
        disabled={status === 'loading'}
        aria-label="Notes de conversation"
      />

      {errorMessage && (
        <p className="coach-notepad-panel-hint coach-notepad-panel-hint--warn">{errorMessage}</p>
      )}

      <div className="coach-notepad-panel-foot">
        <span className="coach-notepad-panel-hint">Sync. avec votre bloc-notes</span>
        <Link href="/espace?section=blocnotes" className="coach-notepad-panel-link">
          Ouvrir tout
        </Link>
      </div>
    </aside>
  );
}
