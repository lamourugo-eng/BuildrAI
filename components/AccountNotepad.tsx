'use client';

import { formatNotepadDate } from '@/lib/account/notepad-storage';
import { useNotepadSync } from '@/lib/account/use-notepad';

export default function AccountNotepad() {
  const { content, handleChange, status, syncedToCloud, updatedAt, errorMessage, statusLabel } =
    useNotepadSync();

  return (
    <div className="account-panel account-notepad">
      <div className="account-notepad-toolbar">
        <div className="account-notepad-status" aria-live="polite">
          <span
            className={`account-notepad-status-dot account-notepad-status-dot--${status}`}
            aria-hidden="true"
          />
          <span>
            {status === 'saved' && syncedToCloud
              ? 'Sauvegardé sur votre compte'
              : statusLabel}
          </span>
          {updatedAt && status !== 'loading' && (
            <span className="account-notepad-date">
             . {formatNotepadDate(updatedAt)}
            </span>
          )}
        </div>
        <span className="account-notepad-count">{content.length} caractères</span>
      </div>

      <textarea
        className="account-notepad-editor"
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Idées, contacts, décisions, liens utiles… Tout ce que vous voulez retrouver à la prochaine session."
        rows={16}
        disabled={status === 'loading'}
        aria-label="Bloc-notes personnel"
      />

      {errorMessage && <p className="account-notepad-hint account-notepad-hint--warn">{errorMessage}</p>}

      <p className="account-notepad-hint">
        {syncedToCloud
          ? 'Vos notes sont liées à votre compte et disponibles à chaque reconnexion.'
          : 'Vos notes sont enregistrées localement sur cet appareil.'}
      </p>
    </div>
  );
}
