import {
  buildParcoursPlanBlock,
  buildToolMethodSection,
  resolveCoachingPhase,
  resolvePresenceSubstep,
  shouldInjectToolSection,
} from '@/lib/coach/plan-builder';
import type { RoadmapCoachContext } from '@/lib/coach/roadmap-coach-context';
import type { BusinessId } from '@/lib/quiz/data';

interface EnrichContext {
  businessId?: BusinessId | null;
  techLevel?: string;
  coachingPhase?: number;
  coachingStepLabel?: string;
  userMessage?: string;
  roadmapContext?: RoadmapCoachContext | null;
}

function replaceOrInsertSection(
  content: string,
  emoji: string,
  title: string,
  body: string
): string {
  const header = `${emoji} ${title}`;
  const block = `${header}\n${body.trim()}`;

  const pattern = new RegExp(
    `[📌🎯📍📋🛠️✅➡️❓🧭]*\\s*${title}\\s*\\n+[\\s\\S]*?(?=\\n\\n[📌🎯📍📋🛠️✅➡️❓🧭]|$)`,
    'i'
  );

  if (pattern.test(content)) {
    return content.replace(pattern, block);
  }

  const parcoursIdx = content.search(/📍\s*PARCOURS/i);
  if (parcoursIdx >= 0) {
    const afterParcours = content.slice(parcoursIdx);
    const nextSection = afterParcours.search(/\n\n[📌🎯📍📋🛠️✅➡️❓🧭]/);
    const insertAt =
      nextSection >= 0 ? parcoursIdx + nextSection + 2 : content.length;
    return `${content.slice(0, insertAt)}\n\n${block}${content.slice(insertAt)}`;
  }

  return `${content.trim()}\n\n${block}`;
}

/**
 * Garantit plan numéroté + recommandation outil concrète dans chaque réponse pertinente.
 */
export function enrichCoachReply(rawReply: string, ctx: EnrichContext): string {
  if (ctx.roadmapContext) {
    return rawReply.trim();
  }

  const phase = resolveCoachingPhase(
    rawReply,
    ctx.coachingPhase,
    ctx.userMessage
  );
  const substep = resolvePresenceSubstep(rawReply, ctx.coachingStepLabel);
  const businessId = ctx.businessId ?? undefined;

  let reply = rawReply.trim();

  const planBody = buildParcoursPlanBlock(phase, businessId, substep);
  reply = replaceOrInsertSection(reply, '📋', 'PLAN (ce qui reste)', planBody);

  if (businessId && shouldInjectToolSection(phase, ctx.userMessage)) {
    const toolBody = buildToolMethodSection(businessId, ctx.techLevel);
    reply = replaceOrInsertSection(reply, '🛠️', 'OUTIL & MÉTHODE', toolBody);
  }

  return reply;
}
