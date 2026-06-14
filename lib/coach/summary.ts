import { getCoachModel, getOpenAI } from '@/lib/openai';

const SUMMARY_MODEL = process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini';

export async function generateSessionSummary(
  existingSummary: string,
  recentMessages: { role: string; content: string }[]
): Promise<string> {
  const transcript = recentMessages
    .map((m) => `${m.role === 'user' ? 'Client' : 'Coach'}: ${m.content.slice(0, 600)}`)
    .join('\n\n');

  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: SUMMARY_MODEL,
    temperature: 0.2,
    max_tokens: 350,
    messages: [
      {
        role: 'system',
        content: `Tu rédiges le dossier de suivi d'un coach business BuildrAI.
Résume en français (max 130 mots) : projet, étape du parcours 1-8 en cours, livrables déjà co-construits (offre, pitch, sections site…), blocages, prochaine micro-étape guidée.
Format compact. Pas de markdown. Fusionne avec le résumé existant.`,
      },
      {
        role: 'user',
        content: `Résumé existant :\n${existingSummary || '(vide)'}\n\nNouveaux échanges :\n${transcript}`,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || existingSummary;
}

export function shouldRefreshSummary(messageCount: number): boolean {
  return messageCount > 0 && messageCount % 2 === 0;
}
