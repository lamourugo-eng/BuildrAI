import { clampPhase, parsePhaseFromReply } from '@/lib/coach/journey';
import { parseCoachReply } from '@/lib/coach/parse-reply';
import { generateSessionSummary, shouldRefreshSummary } from '@/lib/coach/summary';
import type { BusinessId } from '@/lib/quiz/data';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CoachThread {
  id: string;
  user_id: string;
  business_id: string;
  progress_point: string;
  last_action: string;
  session_summary: string;
  coaching_phase?: number;
  coaching_step_label?: string;
  updated_at: string;
}

export interface CoachDbMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface CoachProductMemory {
  thread: CoachThread;
  messages: CoachDbMessage[];
}

const MAX_MESSAGES_LOAD = 40;
const MAX_MESSAGES_KEEP = 80;

export function isMissingTableError(message: string): boolean {
  return (
    message.includes('coach_threads') ||
    message.includes('coach_messages') ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  );
}

export async function getOrCreateThread(
  supabase: SupabaseClient,
  userId: string,
  businessId: BusinessId
): Promise<CoachThread> {
  const { data: existing, error: selectError } = await supabase
    .from('coach_threads')
    .select('*')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as CoachThread;

  const { data: created, error: insertError } = await supabase
    .from('coach_threads')
    .insert({ user_id: userId, business_id: businessId })
    .select('*')
    .single();

  if (insertError) throw insertError;
  return created as CoachThread;
}

export async function loadProductMemory(
  supabase: SupabaseClient,
  userId: string,
  businessId: BusinessId
): Promise<CoachProductMemory | null> {
  const { data: thread, error: threadError } = await supabase
    .from('coach_threads')
    .select('*')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (threadError) throw threadError;
  if (!thread) return null;

  const { data: messages, error: messagesError } = await supabase
    .from('coach_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true })
    .limit(MAX_MESSAGES_LOAD);

  if (messagesError) throw messagesError;

  return {
    thread: thread as CoachThread,
    messages: (messages ?? []) as CoachDbMessage[],
  };
}

export async function clearProductMemory(
  supabase: SupabaseClient,
  userId: string,
  businessId: BusinessId
) {
  const { error } = await supabase
    .from('coach_threads')
    .delete()
    .eq('user_id', userId)
    .eq('business_id', businessId);

  if (error) throw error;
}

export async function appendProductExchange(
  supabase: SupabaseClient,
  userId: string,
  businessId: BusinessId,
  userContent: string,
  assistantContent: string,
  options?: { skipPhaseUpdate?: boolean }
): Promise<CoachProductMemory> {
  const thread = await getOrCreateThread(supabase, userId, businessId);
  const parsed = parseCoachReply(assistantContent);

  const rows = [
    { thread_id: thread.id, role: 'user' as const, content: userContent },
    { thread_id: thread.id, role: 'assistant' as const, content: assistantContent },
  ];

  const { error: insertError } = await supabase.from('coach_messages').insert(rows);
  if (insertError) throw insertError;

  const { count } = await supabase
    .from('coach_messages')
    .select('*', { count: 'exact', head: true })
    .eq('thread_id', thread.id);

  const messageCount = count ?? 0;

  let sessionSummary = thread.session_summary;
  if (shouldRefreshSummary(messageCount)) {
    const { data: recent } = await supabase
      .from('coach_messages')
      .select('role, content')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: false })
      .limit(6);

    if (recent?.length) {
      try {
        sessionSummary = await generateSessionSummary(
          thread.session_summary,
          [...recent].reverse()
        );
      } catch {
        sessionSummary = thread.session_summary;
      }
    }
  }

  const progressPoint = parsed.progressPoint || thread.progress_point;
  const lastAction = parsed.lastAction || thread.last_action;
  const parsedPhase = options?.skipPhaseUpdate ? null : parsePhaseFromReply(assistantContent);
  const coachingPhase = clampPhase(
    parsedPhase ?? thread.coaching_phase ?? 1
  );
  const coachingStepLabel = options?.skipPhaseUpdate
    ? thread.coaching_step_label || ''
    : parsed.stepLabel || thread.coaching_step_label || '';

  const { data: updatedThread, error: updateError } = await supabase
    .from('coach_threads')
    .update({
      progress_point: progressPoint,
      last_action: lastAction,
      session_summary: sessionSummary,
      coaching_phase: coachingPhase,
      coaching_step_label: coachingStepLabel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', thread.id)
    .select('*')
    .single();

  if (updateError) throw updateError;

  if (messageCount > MAX_MESSAGES_KEEP) {
    const { data: oldMessages } = await supabase
      .from('coach_messages')
      .select('id')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true })
      .limit(messageCount - MAX_MESSAGES_KEEP);

    if (oldMessages?.length) {
      await supabase
        .from('coach_messages')
        .delete()
        .in(
          'id',
          oldMessages.map((m) => m.id)
        );
    }
  }

  const memory = await loadProductMemory(supabase, userId, businessId);
  if (!memory) throw new Error('Impossible de recharger la mémoire coach');

  return memory;
}

export async function importLocalMessages(
  supabase: SupabaseClient,
  userId: string,
  businessId: BusinessId,
  localMessages: { role: 'user' | 'assistant'; content: string }[],
  progressPoint = '',
  lastAction = ''
): Promise<CoachProductMemory | null> {
  const existing = await loadProductMemory(supabase, userId, businessId);
  if (existing?.messages.some((m) => m.role === 'user')) return existing;

  if (!localMessages.some((m) => m.role === 'user')) return existing;

  const thread = await getOrCreateThread(supabase, userId, businessId);

  const { error: insertError } = await supabase.from('coach_messages').insert(
    localMessages.map((m) => ({
      thread_id: thread.id,
      role: m.role,
      content: m.content,
    }))
  );

  if (insertError) throw insertError;

  await supabase
    .from('coach_threads')
    .update({
      progress_point: progressPoint || thread.progress_point,
      last_action: lastAction || thread.last_action,
      updated_at: new Date().toISOString(),
    })
    .eq('id', thread.id);

  return loadProductMemory(supabase, userId, businessId);
}

export function toMemoryContext(memory: CoachProductMemory) {
  return {
    progressPoint: memory.thread.progress_point,
    lastAction: memory.thread.last_action,
    sessionSummary: memory.thread.session_summary,
    coachingPhase: memory.thread.coaching_phase ?? 1,
    coachingStepLabel: memory.thread.coaching_step_label ?? '',
    messageCount: memory.messages.length,
    lastSessionAt: memory.thread.updated_at,
    recentExchanges: memory.messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 500),
    })),
  };
}

export function formatProductResumeDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildProductResumeWelcome(memory: CoachProductMemory): string {
  const point = memory.thread.progress_point || 'avancer sur votre projet';
  const actionBlock = memory.thread.last_action
    ? `\n\n➡️ Dernière action : ${memory.thread.last_action}`
    : '';

  const phase = memory.thread.coaching_phase;
  const phaseBlock =
    phase && phase >= 1 ? ` Étape ${phase}/8.` : '';
  const summaryBlock = memory.thread.session_summary
    ? `\n\n📁 ${memory.thread.session_summary.slice(0, 280)}${memory.thread.session_summary.length > 280 ? '…' : ''}`
    : '';

  return `Content de vous revoir !${phaseBlock}

Dernière fois : ${point}.${actionBlock}${summaryBlock}

Dites « Continuer » pour reprendre, ou décrivez votre avancement.`;
}
