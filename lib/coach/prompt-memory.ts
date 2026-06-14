import type { CoachMemoryContext } from '@/lib/coach/memory-context';

const MAX_NOTEPAD_IN_PROMPT = 2000;

export function truncateNotepadForPrompt(content: string | undefined | null): string {
  if (!content?.trim()) return '';
  const trimmed = content.trim();
  if (trimmed.length <= MAX_NOTEPAD_IN_PROMPT) return trimmed;
  return `${trimmed.slice(0, MAX_NOTEPAD_IN_PROMPT)}… [notes tronquées]`;
}

function formatRecentExchanges(memory: CoachMemoryContext): string {
  if (!memory.recentExchanges?.length) return '';
  return memory.recentExchanges
    .map((exchange) => {
      const label = exchange.role === 'user' ? 'Client' : 'Coach';
      return `- ${label} : ${exchange.content}`;
    })
    .join('\n');
}

/** Bloc mémoire injecté dans le prompt coach 8 étapes. */
export function buildMemoryPromptBlock(
  memory?: CoachMemoryContext | null,
  notepadSnippet?: string
): string {
  const notepad = truncateNotepadForPrompt(notepadSnippet);
  if (!memory && !notepad) return '';

  const sections: string[] = [];

  if (memory) {
    sections.push(`## Mémoire session
- Étape : ${memory.coachingPhase ?? '?'}/8. ${memory.coachingStepLabel || 'à préciser'}
- Avancement : ${memory.progressPoint || '—'}
- Dernière micro-étape : ${memory.lastAction || '—'}
- Dossier (résumé) : ${memory.sessionSummary || '—'}
- Messages en historique : ${memory.messageCount}

Reprends à la sous-étape indiquée. Ne refais pas les livrables déjà validés.`);

    const recent = formatRecentExchanges(memory);
    if (recent) {
      sections.push(`## Derniers échanges (fil conducteur)
${recent}`);
    }
  }

  if (notepad) {
    sections.push(`## Bloc-notes du client
${notepad}

Utilise ces notes si elles éclairent la question. Ne les recopie pas intégralement.`);
  }

  return `\n\n${sections.join('\n\n')}`;
}

/** Contexte projet minimal en mode parcours (sans imposer le format 8 étapes). */
export function buildRoadmapMemorySnippet(memory?: CoachMemoryContext | null): string {
  if (!memory) return '';

  const lines = [
    memory.sessionSummary ? `Résumé projet : ${memory.sessionSummary}` : '',
    memory.progressPoint ? `Dernière étape coach : ${memory.progressPoint}` : '',
    memory.lastAction ? `Dernière micro-action : ${memory.lastAction}` : '',
  ].filter(Boolean);

  if (!lines.length) return '';

  return `\n\n## Contexte projet (mémoire globale)
${lines.join('\n')}
Utilise ce contexte seulement si la question du client le requiert. Concentre-toi sur le jour du parcours.`;
}
