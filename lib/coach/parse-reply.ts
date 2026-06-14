export function extractCoachSection(content: string, sectionTitle: string): string {
  const pattern = new RegExp(
    `[📌🎯📍📋🛠️✅➡️❓🧭]*\\s*${sectionTitle}\\s*\\n+([\\s\\S]*?)(?=\\n\\n[📌🎯📍📋🛠️✅➡️❓🧭]|$)`,
    'i'
  );
  const match = content.match(pattern);
  if (!match) return '';
  return match[1].replace(/\*\*/g, '').trim().split('\n')[0]?.trim() ?? '';
}

function firstLine(section: string): string {
  return section.trim().split('\n')[0]?.trim() ?? '';
}

export function parseCoachReply(reply: string) {
  const situation = extractCoachSection(reply, 'SITUATION');
  const parcours = extractCoachSection(reply, 'PARCOURS');
  const action =
    extractCoachSection(reply, 'PROCHAINE MICRO-ÉTAPE') ||
    extractCoachSection(reply, 'PROCHAINE MICRO-ETAPE') ||
    extractCoachSection(reply, 'ACTION MAINTENANT');
  const livrable =
    extractCoachSection(reply, 'LIVRABLE DÉTAILLÉ') ||
    extractCoachSection(reply, 'LIVRABLE DETAILLE') ||
    extractCoachSection(reply, 'CE QUE JE VOUS PROPOSE');
  const focus = extractCoachSection(reply, 'FOCUS');

  const progressPoint =
    firstLine(parcours) ||
    firstLine(situation) ||
    firstLine(livrable).slice(0, 200) ||
    focus;

  return {
    progressPoint,
    lastAction: firstLine(action),
    stepLabel: firstLine(parcours),
  };
}
