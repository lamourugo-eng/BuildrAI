import { COACHING_PHASES, getBusinessPhaseHint } from '@/lib/coach/journey';
import { formatSiteToolBlock } from '@/lib/coach/tools';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';

/** Bloc expert injecté dans le coach parcours. Réflexion adaptée au modèle business. */
export function buildBusinessCoachExpertBlock(
  businessId: BusinessId,
  options?: {
    phaseId?: number;
    techLevel?: string;
    compact?: boolean;
    questionMode?: boolean;
  }
): string {
  const profile = businessProfiles[businessId];
  const phaseId = options?.phaseId;
  const compact = options?.compact ?? false;
  const questionMode = options?.questionMode ?? false;

  if (questionMode) {
    return `## Expertise ${profile.name}
- **Marché type** : ${profile.examples}
- **Forces** : ${profile.strengths.join('. ')}
- **Défis** : ${profile.challenges.join('. ')}
- **Métriques clés** : ${getBusinessMetricsHint(businessId)}
- Ne mentionne pas l'étape du parcours ni la phase coach.`;
  }

  const phaseHints = COACHING_PHASES.map((p) => {
    const hint = getBusinessPhaseHint(businessId, p.id);
    if (!hint) return null;
    if (compact && phaseId && p.id !== phaseId) return null;
    return `- **Étape ${p.id}. ${p.name}** : ${hint}`;
  })
    .filter(Boolean)
    .join('\n');

  const currentPhase = phaseId ? COACHING_PHASES.find((p) => p.id === phaseId) : null;
  const currentHint = phaseId ? getBusinessPhaseHint(businessId, phaseId) : '';

  const showTools =
    phaseId != null && phaseId >= 5 && phaseId <= 7;
  const toolBlock = showTools
    ? `\n${formatSiteToolBlock(businessId, options?.techLevel)}\n`
    : '';

  return `## Guide expert. Modèle ${profile.name}

- **Marché type** : ${profile.examples}
- **Forces à exploiter** : ${profile.strengths.join('. ')}
- **Défis à anticiper** : ${profile.challenges.join('. ')}
- **Horizon revenus typique** : ${profile.metrics.revenue}. Scale : ${profile.metrics.scale}
- **Première étape clé** : ${profile.firstSteps[0] ?? '—'}

### Réflexion coach par étape (8 phases. ${profile.name})
${phaseHints || '- Adapte chaque étape au modèle ' + profile.name}

${currentPhase && currentHint ? `### Phase du jour. Étape ${phaseId}/8 : ${currentPhase.name}\n${currentHint}\n` : ''}${toolBlock}
### Consignes de réflexion
- Propose des exemples **concrets** pour ${profile.name} (pas de conseils génériques « startup »).
- Citez métriques pertinentes : ${getBusinessMetricsHint(businessId)}.
- Si le client hésite, tranchez avec une recommandation adaptée à son budget et niveau tech.`;
}

function getBusinessMetricsHint(businessId: BusinessId): string {
  const hints: Record<BusinessId, string> = {
    saas: 'MRR, taux d\'activation essai, churn J7, CAC, LTV',
    freelance: 'TJM, taux de conversion devis, jours facturés, panier mission',
    ecommerce: 'Panier moyen, marge %, CAC, ROAS, taux de réachat',
    agency: 'Marge projet, taux de conversion audit, récurrence client, setup fee',
    marketplace: 'GMV, take rate, liquidité (offre/demande), rétention early adopters',
    impact: 'Revenus + impact mesuré, mix financement (vente/don/subvention)',
    consulting: 'CA mission, taux conversion diagnostic, durée cycle de vente',
    content: 'Abonnés, RPM, conversion lead magnet, revenus par canal',
    ofm: 'Revenus OnlyFans gérés, commission %, rétention modèles, croissance abonnés & PPV',
  };
  return hints[businessId];
}
