'use client';

import {
  loadLocalNotepad,
  pickNewerNotepad,
  saveLocalNotepad,
  type NotepadSnapshot,
} from '@/lib/account/notepad-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

export type NotepadSaveStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'local';

export function useNotepadSync() {
  const [content, setContent] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<NotepadSaveStatus>('loading');
  const [syncedToCloud, setSyncedToCloud] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef('');

  const persist = useCallback(async (text: string) => {
    const snapshot: NotepadSnapshot = {
      content: text,
      updatedAt: new Date().toISOString(),
    };
    saveLocalNotepad(snapshot);
    setUpdatedAt(snapshot.updatedAt);

    try {
      const res = await fetch('/api/notepad', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });

      if (res.status === 401) {
        setSyncedToCloud(false);
        setStatus('local');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setSyncedToCloud(false);
        setStatus('local');
        if (data.code !== 'TABLES_MISSING') {
          setErrorMessage(data.error || 'Sauvegarde cloud indisponible');
        }
        return;
      }

      setSyncedToCloud(true);
      setUpdatedAt(data.notepad.updatedAt);
      saveLocalNotepad({
        content: data.notepad.content,
        updatedAt: data.notepad.updatedAt,
      });
      setStatus('saved');
      setErrorMessage('');
    } catch {
      setSyncedToCloud(false);
      setStatus('local');
      setErrorMessage('Hors ligne. Notes enregistrées sur cet appareil');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const local = loadLocalNotepad();
      setContent(local.content);
      setUpdatedAt(local.updatedAt);
      latestContentRef.current = local.content;

      try {
        const res = await fetch('/api/notepad');
        if (res.status === 401) {
          if (!cancelled) {
            setSyncedToCloud(false);
            setStatus(local.content ? 'local' : 'idle');
          }
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) {
            setSyncedToCloud(false);
            setStatus('local');
          }
          return;
        }

        const remote: NotepadSnapshot = {
          content: data.notepad.content ?? '',
          updatedAt: data.notepad.updatedAt ?? new Date(0).toISOString(),
        };
        const merged = pickNewerNotepad(local, remote);

        if (!cancelled) {
          setContent(merged.content);
          setUpdatedAt(merged.updatedAt);
          latestContentRef.current = merged.content;
          saveLocalNotepad(merged);
          setSyncedToCloud(true);
          setStatus('saved');
        }
      } catch {
        if (!cancelled) {
          setSyncedToCloud(false);
          setStatus('local');
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
      latestContentRef.current = value;
      setStatus('saving');
      setErrorMessage('');

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void persist(value);
      }, 700);
    },
    [persist]
  );

  const statusLabel =
    status === 'loading'
      ? 'Chargement…'
      : status === 'saving'
        ? 'Enregistrement…'
        : status === 'saved'
          ? syncedToCloud
            ? 'Sauvegardé'
            : 'Sauvegardé'
          : status === 'local'
            ? 'Local'
            : 'Prêt';

  return {
    content,
    handleChange,
    status,
    syncedToCloud,
    updatedAt,
    errorMessage,
    statusLabel,
  };
}
