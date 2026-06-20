import type { CoachInteractionMode } from '@/lib/coach/interaction-mode';

/** Retire le format coach 8 étapes si le modèle l'a quand même produit. */
export function sanitizeCoachReplyForQuestionMode(reply: string): string {
  let text = reply.trim();

  const sectionPatterns = [
    /🎯\s*SITUATION[^\n]*\n[\s\S]*?(?=\n\n(?:[📌🎯📍📋🛠️✅➡️❓🧭]|$)|$)/gi,
    /📍\s*PARCOURS[^\n]*\n[\s\S]*?(?=\n\n(?:[📌🎯📍📋🛠️✅➡️❓🧭]|$)|$)/gi,
    /📋\s*PLAN[^\n]*\n[\s\S]*?(?=\n\n(?:[📌🎯📍📋🛠️✅➡️❓🧭]|$)|$)/gi,
    /➡️\s*PROCHAINE[^\n]*\n[\s\S]*?(?=\n\n(?:[📌🎯📍📋🛠️✅➡️❓🧭]|$)|$)/gi,
  ];

  for (const pattern of sectionPatterns) {
    text = text.replace(pattern, '').trim();
  }

  text = text
    .replace(/^.*[ÉE]tape\s*\d\s*\/\s*8.*$/gim, '')
    .replace(/^.*phase\s+coach.*$/gim, '')
    .replace(/^.*où\s+tu\s+en\s+es.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

export function isCoachFreeQuestionMode(
  interactionMode: CoachInteractionMode,
  _hasRoadmapContext: boolean
): boolean {
  return interactionMode === 'question';
}
