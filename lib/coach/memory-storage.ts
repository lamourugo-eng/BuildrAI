import { parseCoachReply } from '@/lib/coach/parse-reply';
import type { BusinessId } from '@/lib/quiz/data';

export const COACH_MEMORY_KEY = 'buildrai_coach_memory';

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string;
}

export interface CoachMemory {
  businessId: BusinessId;
  messages: CoachMessage[];
  progressPoint: string;
  lastAction: string;
  coachingPhase?: number;
  coachingStepLabel?: string;
  sessionSummary?: string;
  updatedAt: string;
}

type CoachMemoryStore = Partial<Record<BusinessId, CoachMemory>>;

const MAX_STORED_MESSAGES = 40;

function emptyMemory(businessId: BusinessId): CoachMemory {
  return {
    businessId,
    messages: [],
    progressPoint: '',
    lastAction: '',
    updatedAt: new Date().toISOString(),
  };
}

function loadStore(): CoachMemoryStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(COACH_MEMORY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CoachMemoryStore;
  } catch {
    return {};
  }
}

function saveStore(store: CoachMemoryStore) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COACH_MEMORY_KEY, JSON.stringify(store));
}

export function loadCoachMemory(businessId: BusinessId): CoachMemory | null {
  const store = loadStore();
  const memory = store[businessId];
  if (!memory?.messages?.length) return null;
  return memory;
}

export function hasCoachConversation(memory: CoachMemory | null): boolean {
  return Boolean(memory?.messages.some((m) => m.role === 'user'));
}

export function clearCoachMemory(businessId: BusinessId) {
  const store = loadStore();
  delete store[businessId];
  saveStore(store);
}

export function updateMemoryFromReply(memory: CoachMemory, reply: string): CoachMemory {
  const parsed = parseCoachReply(reply);

  return {
    ...memory,
    progressPoint: parsed.progressPoint || memory.progressPoint,
    lastAction: parsed.lastAction || memory.lastAction,
    updatedAt: new Date().toISOString(),
  };
}

export function saveCoachMemory(memory: CoachMemory) {
  const store = loadStore();
  store[memory.businessId] = {
    ...memory,
    messages: memory.messages.slice(-MAX_STORED_MESSAGES),
  };
  saveStore(store);
}

export function appendCoachExchange(
  businessId: BusinessId,
  userContent: string,
  assistantContent: string,
  meta?: { coachingPhase?: number; coachingStepLabel?: string }
): CoachMemory {
  const existing = loadCoachMemory(businessId) ?? emptyMemory(businessId);
  const now = new Date().toISOString();

  let memory: CoachMemory = {
    ...existing,
    businessId,
    messages: [
      ...existing.messages,
      { role: 'user', content: userContent, at: now },
      { role: 'assistant', content: assistantContent, at: now },
    ],
    updatedAt: now,
  };

  memory = updateMemoryFromReply(memory, assistantContent);
  if (meta?.coachingPhase) memory.coachingPhase = meta.coachingPhase;
  if (meta?.coachingStepLabel) memory.coachingStepLabel = meta.coachingStepLabel;
  saveCoachMemory(memory);
  return memory;
}

export function getCoachMemoryContext(memory: CoachMemory | null) {
  if (!memory || !hasCoachConversation(memory)) return null;

  return {
    progressPoint: memory.progressPoint,
    lastAction: memory.lastAction,
    sessionSummary: memory.sessionSummary,
    coachingPhase: memory.coachingPhase,
    coachingStepLabel: memory.coachingStepLabel,
    messageCount: memory.messages.length,
    lastSessionAt: memory.updatedAt,
    recentExchanges: memory.messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 500),
    })),
  };
}

export function formatResumeDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildResumeWelcome(memory: CoachMemory): string {
  const point = memory.progressPoint || 'avancer sur ton projet';
  const actionBlock = memory.lastAction
    ? `\n\n➡️ Dernière action en cours : ${memory.lastAction}`
    : '';
  const phaseBlock =
    memory.coachingPhase && memory.coachingPhase >= 1
      ? ` Étape ${memory.coachingPhase}/8.`
      : '';
  const summaryBlock = memory.sessionSummary
    ? `\n\n📁 ${memory.sessionSummary.slice(0, 280)}${memory.sessionSummary.length > 280 ? '…' : ''}`
    : '';

  return `Content de te revoir !${phaseBlock}

Dernière fois : ${point}.${actionBlock}${summaryBlock}

Clique « Continuer » ou décris ton avancement.`;
}
