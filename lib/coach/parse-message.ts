export interface ParsedCoachSections {
  structured: boolean;
  situation: string;
  parcours: string;
  plan: string;
  tool: string;
  deliverable: string;
  nextStep: string;
}

const SECTION_MARKERS = [
  { key: 'situation' as const, match: /🎯\s*SITUATION/i },
  { key: 'parcours' as const, match: /📍\s*PARCOURS/i },
  { key: 'plan' as const, match: /📋\s*PLAN/i },
  { key: 'tool' as const, match: /🛠️?\s*OUTIL/i },
  { key: 'deliverable' as const, match: /✅\s*LIVRABLE/i },
  { key: 'nextStep' as const, match: /➡️\s*PROCHAINE/i },
];

function splitBySections(content: string): Partial<Record<string, string>> {
  const lines = content.trim().split('\n');
  const sections: Partial<Record<string, string>> = {};
  let currentKey: string | null = null;
  const body: string[] = [];

  function flush() {
    if (currentKey && body.length) {
      sections[currentKey] = body.join('\n').trim();
    }
    body.length = 0;
  }

  for (const line of lines) {
    const marker = SECTION_MARKERS.find((m) => m.match.test(line));
    if (marker) {
      flush();
      currentKey = marker.key;
      continue;
    }
    if (currentKey) body.push(line);
  }
  flush();

  return sections;
}

export function parseCoachMessage(content: string): ParsedCoachSections {
  const sections = splitBySections(content);
  const structured = Object.keys(sections).length >= 2;

  return {
    structured,
    situation: sections.situation ?? '',
    parcours: sections.parcours ?? '',
    plan: sections.plan ?? '',
    tool: sections.tool ?? '',
    deliverable: sections.deliverable ?? '',
    nextStep: sections.nextStep ?? '',
  };
}

export function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*/g, '');
}
