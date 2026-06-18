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
  { key: 'tool' as const, match: /🛠️?\s*OUTIL(?:S|\s*&\s*MÉTHODE|\s*RECOMMANDÉS)?/i },
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

const TOOL_SECTION_REGEX =
  /(?:^|\n\n)🛠️?\s*OUTIL(?:S|\s*&\s*MÉTHODE|\s*RECOMMANDÉS)?[^\n]*\n[\s\S]*?(?=(?:\n\n[🎯📍📋🛠️✅➡️❓🧭])|$)/gi;

/** Extrait le contenu des blocs outils (sans les titres de section). */
export function extractCoachToolsContent(content: string): string {
  const blocks: string[] = [];
  const pattern = new RegExp(TOOL_SECTION_REGEX.source, 'gi');

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const body = match[0]
      .replace(/^(?:\n\n)?🛠️?\s*OUTIL(?:S|\s*&\s*MÉTHODE|\s*RECOMMANDÉS)?[^\n]*\n?/i, '')
      .trim();
    if (body) blocks.push(body);
  }

  return blocks.join('\n\n');
}

/** Retire tous les blocs outils du corps du message. */
export function stripCoachToolSections(content: string): string {
  return content.replace(new RegExp(TOOL_SECTION_REGEX.source, 'gi'), '').trim();
}

export function isCoachHeadingLine(line: string): boolean {
  return /^#{1,3}\s+\S/.test(line.trim());
}

export function formatCoachHeadingLine(line: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith('### ')) return trimmed.slice(4).trim();
  if (trimmed.startsWith('## ')) return trimmed.slice(3).trim();
  if (trimmed.startsWith('# ')) return trimmed.slice(2).trim();
  return trimmed;
}
