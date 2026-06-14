export const NOTEPAD_KEY = 'buildrai_notepad';

export interface NotepadSnapshot {
  content: string;
  updatedAt: string;
}

export function emptyNotepad(): NotepadSnapshot {
  return { content: '', updatedAt: new Date(0).toISOString() };
}

export function loadLocalNotepad(): NotepadSnapshot {
  if (typeof window === 'undefined') return emptyNotepad();
  try {
    const raw = localStorage.getItem(NOTEPAD_KEY);
    if (!raw) return emptyNotepad();
    const parsed = JSON.parse(raw) as Partial<NotepadSnapshot>;
    return {
      content: parsed.content ?? '',
      updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
    };
  } catch {
    return emptyNotepad();
  }
}

export function saveLocalNotepad(snapshot: NotepadSnapshot): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTEPAD_KEY, JSON.stringify(snapshot));
}

export function pickNewerNotepad(
  local: NotepadSnapshot,
  remote: NotepadSnapshot | null
): NotepadSnapshot {
  if (!remote) return local;
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();
  return remoteTime >= localTime ? remote : local;
}

export function formatNotepadDate(iso: string): string {
  if (!iso || iso === new Date(0).toISOString()) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isMissingNotepadTable(message: string): boolean {
  return (
    message.includes('user_notepad') ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  );
}

export function notepadPreview(content: string, maxLen = 80): string {
  const line = content.trim().split('\n').find((l) => l.trim()) ?? '';
  if (!line) return 'Aucune note pour le moment';
  return line.length > maxLen ? `${line.slice(0, maxLen)}…` : line;
}
