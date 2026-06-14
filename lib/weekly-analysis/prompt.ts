import type { BusinessId } from '@/lib/quiz/data';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';
import type { WeeklyCoachSnapshot } from '@/lib/weekly-analysis/coach-sync';
import type { WeeklyRoadmapSnapshot } from '@/lib/weekly-analysis/roadmap-sync';
import { TOTAL_ROADMAP_DAYS } from '@/lib/quiz/roadmap-program';

export interface WeeklyAnalysisInput {
  profile: QuizProfileSnapshot;
  businessId: BusinessId;
  businessName: string;
  analytics: {
    coachMessages: number;
    coachSessions: number;
    lastActiveAt: string | null;
    quizCompletedAt: string | null;
  };
  activity7d: { label: string; count: number }[];
  roadmap: WeeklyRoadmapSnapshot | null;
  coach: WeeklyCoachSnapshot | null;
}

export const WEEKLY_ANALYSIS_SYSTEM = `Tu es l'analyste stratégique BuildrAI. Tu produis une analyse hebdomadaire APPROFONDIE pour un entrepreneur en cours de lancement.

Règles :
- Français, ton direct et bienveillant, orienté action
- Base-toi UNIQUEMENT sur les données fournies ; si peu de données, dis-le clairement
- SYNCHRONISE ton analyse avec le parcours premium (${TOTAL_ROADMAP_DAYS} jours, 6 chapitres) : cite le jour/chapitre en cours, les jours cochés, la prochaine étape parcours
- Croise TOUJOURS parcours et coach (phase 1–8) : signale écarts entre étape coach mémorisée et chapitre parcours attendu
- Les priorités doivent pointer vers le prochain jour parcours OU la micro-étape coach si plus urgent
- Pas de généralités vagues : chaque constat lié aux chiffres ou extraits
- Scores entre 0 et 100 (entiers). Cohérents avec l'activité réelle

Réponds en JSON strict avec cette structure :
{
  "summary": "2-3 phrases de synthèse",
  "sections": [
    { "title": "Bilan de la semaine", "content": "..." },
    { "title": "Points forts", "content": "..." },
    { "title": "Axes d'amélioration", "content": "..." },
    { "title": "Alignement parcours & coach", "content": "..." },
    { "title": "Focus semaine prochaine", "content": "..." }
  ],
  "priorities": ["action 1", "action 2", "action 3"],
  "risks": ["risque ou blocage 1", "risque ou blocage 2"],
  "scores": {
    "momentum": 0,
    "consistency": 0,
    "roadmapAlignment": 0
  }
}`;

function formatRoadmapBlock(roadmap: WeeklyRoadmapSnapshot): string {
  const nextLine = roadmap.nextGlobalDay
    ? `Prochain jour à cocher : J${roadmap.nextGlobalDay}. ${roadmap.nextDayTitle}`
    : 'Tous les jours débloqués sont cochés. Consolidation ou chapitre suivant.';

  return `- Statut : ${roadmap.headline}
- Chapitre ${roadmap.currentChapter} : ${roadmap.currentChapterLabel}
- Arc du chapitre : ${roadmap.currentChapterArc || '—'}
- Jour de référence : J${roadmap.currentGlobalDay}/${TOTAL_ROADMAP_DAYS}. ${roadmap.currentDayTitle}
- Objectif du jour : ${roadmap.currentDayObjective}
- Jours cochés : ${roadmap.completedCount} / ${roadmap.totalUnlockedDays} accessibles (${roadmap.percentUnlocked} %)
- Progression programme : ${roadmap.completedCount} / ${roadmap.totalProgramDays} (${roadmap.percentProgram} %)
- Chapitres débloqués : ${roadmap.unlockedMonths} / 6
- Phase coach attendue (parcours) : ${roadmap.expectedCoachPhase}/8
- Liste jours cochés : ${roadmap.completedDays.join(', ') || 'aucun'}
- ${nextLine}
- Dernière mise à jour parcours : ${roadmap.lastUpdatedAt ?? '—'}`;
}

function formatCoachBlock(coach: WeeklyCoachSnapshot): string {
  return `- Source mémoire : ${coach.source === 'cloud' ? 'cloud (compte)' : 'locale'}
- Étape coach mémorisée : ${coach.coachingPhase}/8. ${coach.coachingStepLabel || '—'}
- Point d'avancement : ${coach.progressPoint || '—'}
- Dernière micro-action : ${coach.lastAction || '—'}
- Résumé session : ${coach.sessionSummary || '—'}
- Messages en historique : ${coach.messageCount}
- Extraits récents :
${coach.recentExchanges.map((m) => `- [${m.role}] ${m.content}`).join('\n') || '—'}`;
}

export function buildWeeklyAnalysisUserPrompt(input: WeeklyAnalysisInput): string {
  const activityTotal = input.activity7d.reduce((sum, day) => sum + day.count, 0);
  const activityLines = input.activity7d
    .map((day) => `${day.label}: ${day.count} message(s)`)
    .join('\n');

  const coachBlock = input.coach
    ? formatCoachBlock(input.coach)
    : 'Aucune conversation coach enregistrée.';

  const roadmapBlock = input.roadmap
    ? formatRoadmapBlock(input.roadmap)
    : 'Parcours non démarré ou non synchronisé.';

  const alignmentHint =
    input.roadmap && input.coach
      ? `Écart phase coach vs parcours : ${Math.abs(
          input.coach.coachingPhase - input.roadmap.expectedCoachPhase
        )} (0 = aligné). Commente cet écart dans « Alignement parcours & coach ».`
      : '';

  return `## Profil
- Personnalité : ${input.profile.personalityLabel}
- Modèle business actif : ${input.businessName}
- Niveau entrepreneurial : ${input.profile.entrepreneurialLevel}
- Budget : ${input.profile.investmentLevel}
- Niveau tech : ${input.profile.techLevel}

## Activité (7 derniers jours)
- Messages coach total (compte) : ${input.analytics.coachMessages}
- Messages cette semaine : ${activityTotal}
- Sessions coach : ${input.analytics.coachSessions}
- Dernière activité : ${input.analytics.lastActiveAt ?? '—'}
${activityLines}

## Parcours premium (données synchronisées)
${roadmapBlock}

## Coach (mémoire synchronisée)
${coachBlock}

${alignmentHint}

Produis l'analyse hebdomadaire approfondie pour cette période. Les priorités doivent inclure au moins une action liée au jour parcours en cours ou au prochain jour à cocher.`;
}
