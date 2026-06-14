import { COACHING_PHASES, getPhaseById } from '@/lib/coach/journey';
import {
  PRESENCE_SUBSTEPS,
  getSiteToolRecommendation,
  type SiteToolRecommendation,
} from '@/lib/coach/tools';
import type { BusinessId } from '@/lib/quiz/data';

const SITE_KEYWORDS =
  /site|outil|plateforme|landing|vitrine|page web|carrd|shopify|notion|webflow|framer|beacons|mise en ligne|créer mon site/i;

export function userMentionsSite(userMessage?: string): boolean {
  if (!userMessage?.trim()) return false;
  return SITE_KEYWORDS.test(userMessage);
}

export function parseSubstepFromText(text: string): string | null {
  const match = text.match(/5\.([1-8])/i);
  if (!match) return null;
  return `5.${match[1]}`;
}

export function resolveCoachingPhase(
  reply: string,
  memoryPhase?: number,
  userMessage?: string
): number {
  const fromReply = reply.match(/[ÉE]tape\s*(\d)\s*\/\s*8/i);
  if (fromReply) {
    const n = parseInt(fromReply[1], 10);
    if (n >= 1 && n <= 8) return n;
  }
  if (memoryPhase && memoryPhase >= 1 && memoryPhase <= 8) return memoryPhase;
  if (userMentionsSite(userMessage)) return 5;
  return memoryPhase && memoryPhase >= 1 ? memoryPhase : 1;
}

export function resolvePresenceSubstep(
  reply: string,
  memoryLabel?: string
): string | null {
  const fromReply = parseSubstepFromText(reply);
  if (fromReply) return fromReply;
  if (memoryLabel) return parseSubstepFromText(memoryLabel);
  return null;
}

export function shouldInjectToolSection(
  phase: number,
  userMessage?: string
): boolean {
  return phase >= 4 || userMentionsSite(userMessage);
}

export function buildToolMethodSection(
  businessId: BusinessId,
  techLevel?: string
): string {
  const tool = getSiteToolRecommendation(businessId, techLevel);
  const steps = tool.setupSteps.map((s, i) => `  ${i + 1}. ${s}`).join('\n');

  return `Outil recommandé : **${tool.primary}**
Lien : ${tool.url}
Pourquoi pour votre projet : ${tool.why}
Coût : ${tool.cost}

Premiers clics pour démarrer :
${steps}

Alternative si besoin : ${tool.alternatives}`;
}

export function getRecommendedToolSummary(
  businessId: BusinessId,
  techLevel?: string
): SiteToolRecommendation {
  return getSiteToolRecommendation(businessId, techLevel);
}

/** Bloc « parcours restant » injecté dans les réponses coach (section 📋 PLAN). */
export function buildParcoursPlanBlock(
  currentPhase: number,
  businessId?: BusinessId,
  currentSubstep?: string | null
): string {
  const phase = Math.min(8, Math.max(1, currentPhase));
  const current = getPhaseById(phase);
  const lines: string[] = [];

  if (phase === 5) {
    const subId = currentSubstep ?? '5.1';
    const subNum = parseInt(subId.replace('5.', ''), 10) || 1;

    lines.push(`▶ Étape actuelle. 5/8 ${current?.name ?? 'Supports & présence en ligne'}`);
    lines.push('');

    for (const sub of PRESENCE_SUBSTEPS) {
      const n = parseInt(sub.id.replace('5.', ''), 10);
      let marker = '[ ]';
      if (n < subNum) marker = '[✓]';
      else if (n === subNum) marker = '[→]';
      lines.push(`  ${marker} ${sub.id} ${sub.label}`);
    }

    if (businessId) {
      const tool = getSiteToolRecommendation(businessId);
      lines.push('');
      lines.push(`  Outil retenu pour cette étape : ${tool.primary} (${tool.url})`);
    }
  } else {
    lines.push(`▶ Étape actuelle. ${phase}/8 ${current?.name ?? ''}`);
    if (current) {
      lines.push('');
      current.deliverables.forEach((d, i) => {
        lines.push(`  ${i + 1}. ${d}`);
      });
    }
  }

  const upcoming = COACHING_PHASES.filter((p) => p.id > phase);
  if (upcoming.length > 0) {
    lines.push('');
    lines.push('Étapes suivantes (aperçu) :');
    for (const p of upcoming) {
      const hint =
        businessId && p.id === 5
          ? `. Outil site à choisir (ex. ${getSiteToolRecommendation(businessId).primary})`
          : '';
      lines.push(`  ${p.id}. ${p.name} : ${p.goal}${hint}`);
    }
  }

  return lines.join('\n');
}

/** @deprecated Utiliser buildParcoursPlanBlock */
export const buildRoadmapPlanBlock = buildParcoursPlanBlock;

export function buildPlanContextForPrompt(
  phase: number,
  businessId?: BusinessId,
  techLevel?: string,
  stepLabel?: string | null
): string {
  const substep = stepLabel ? parseSubstepFromText(stepLabel) : null;
  const plan = buildParcoursPlanBlock(phase, businessId, substep);
  const toolBlock =
    businessId && shouldInjectToolSection(phase)
      ? `\n\nBloc OUTIL à utiliser dans 🛠️ OUTIL & MÉTHODE :\n${buildToolMethodSection(businessId, techLevel)}`
      : '';

  return `## Plan déterministe (section 📋 PLAN. Reproduis ce contenu ou améliore-le sans le rendre vague)

${plan}${toolBlock}`;
}
