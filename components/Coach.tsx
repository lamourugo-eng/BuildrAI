'use client';

import BusinessModelPicker from '@/components/BusinessModelPicker';
import CoachMessageView from '@/components/CoachMessageView';
import CoachNotepadPanel, {
  loadCoachNotepadOpenPreference,
  saveCoachNotepadOpenPreference,
} from '@/components/coach/CoachNotepadPanel';
import CoachPaywall from '@/components/CoachPaywall';
import { useEntrepreneurCopy } from '@/components/EntrepreneurCopyProvider';
import { getPhaseDisplayName } from '@/lib/copy/entrepreneur-level';
import type { SiteCopy } from '@/lib/copy/entrepreneur-level';
import { loadLocalNotepad } from '@/lib/account/notepad-storage';
import {
  getRoadmapDayTaskIndices,
  loadRoadmapProgress,
  ROADMAP_PROGRESS_EVENT,
} from '@/lib/account/roadmap-storage';
import type { PlanId } from '@/lib/stripe';
import Link from 'next/link';
import {
  appendCoachExchange,
  buildResumeWelcome,
  clearCoachMemory,
  getCoachMemoryContext,
  hasCoachConversation,
  loadCoachMemory,
  type CoachMessage,
} from '@/lib/coach/memory-storage';
import {
  buildRoadmapCoachWelcome,
  clearActiveRoadmapCoachContext,
  consumeRoadmapCoachContext,
  loadActiveRoadmapCoachContext,
  persistActiveRoadmapCoachContext,
  type RoadmapCoachContext,
} from '@/lib/coach/roadmap-coach-context';
import { TOTAL_ROADMAP_DAYS } from '@/lib/quiz/roadmap-program';
import {
  applyCoachRoadmapTaskSync,
  buildCoachDayCompletedMessage,
  buildRoadmapCoachResumeWelcome,
  formatRoadmapTaskSyncNotice,
  getNextPendingTaskIndex,
  inferCompletedTaskIndices,
  isCoachNavigationMessage,
  processRoadmapCoachReply,
  syncAllPendingActionsFromHistory,
} from '@/lib/coach/roadmap-task-sync';
import { detectCoachInteractionMode } from '@/lib/coach/interaction-mode';
import {
  detectRoadmapDayInMessage,
  getRoadmapDayForCoach,
  roadmapDayToCoachContext,
} from '@/lib/coach/resolve-roadmap-day';
import { resolveCurrentRoadmapStep } from '@/lib/quiz/current-roadmap-step';
import { getPhaseById } from '@/lib/coach/journey';
import { COACH_BUDGET_ERROR_CODE } from '@/lib/coach/token-budget';
import { getSiteToolRecommendation } from '@/lib/coach/tools';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import { BUSINESS_CHANGED_EVENT } from '@/lib/quiz/switch-business';
import {
  buildActiveCoachProfile,
  loadQuizProfile,
  resolveCoachProfile,
  type QuizProfileSnapshot,
} from '@/lib/quiz/profile-storage';
import {
  markQuizCompleted,
  recordCoachMessage,
  recordCoachSession,
} from '@/lib/account/analytics-storage';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function getRoadmapCompletedIndicesForDay(
  businessId: BusinessId,
  day: number,
  totalTasks: number
): number[] {
  const progress = loadRoadmapProgress();
  return getRoadmapDayTaskIndices(
    progress?.businessId === businessId ? progress : null,
    day,
    totalTasks
  );
}

function resolveCoachRoadmapContext(
  businessId: BusinessId | undefined,
  activeContext: RoadmapCoachContext | null,
  profile: QuizProfileSnapshot | null,
  isSubscribed: boolean
): RoadmapCoachContext | undefined {
  if (activeContext) return activeContext;
  if (!businessId || !isSubscribed) return undefined;

  const step = resolveCurrentRoadmapStep(businessId, true);
  if (step.status === 'completed_all') return undefined;

  return roadmapDayToCoachContext(step.day, businessId, profile?.topBusinessName);
}

function buildRoadmapAwareResumeWelcome(
  businessId: BusinessId | undefined,
  profile: QuizProfileSnapshot | null,
  isSubscribed: boolean,
  fallback: string
): string {
  const ctx = resolveCoachRoadmapContext(
    businessId,
    loadActiveRoadmapCoachContext(),
    profile,
    isSubscribed
  );
  if (!ctx || !businessId || !ctx.tasks.length) return fallback;

  const completed = getRoadmapCompletedIndicesForDay(businessId, ctx.day, ctx.tasks.length);
  return buildRoadmapCoachResumeWelcome(ctx, completed);
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ProductMemoryPayload {
  messages: CoachMessage[];
  resumeWelcome: string;
  coachingPhase?: number;
}

function buildWelcomeMessage(
  profile: QuizProfileSnapshot | null,
  coachCopy: SiteCopy['coach'],
  tier: SiteCopy['tier']
): string {
  if (!profile) {
    return coachCopy.welcomeNoProfile;
  }

  const biz = businessProfiles[profile.topBusinessId];
  const parts = [coachCopy.welcomeWithProfile(profile.topBusinessName)];
  if (biz.firstSteps[0]) {
    parts.push(
      tier === 'beginner'
        ? `Première piste simple : ${biz.firstSteps[0]}`
        : `Première piste : ${biz.firstSteps[0]}`
    );
  }
  parts.push(
    '',
    tier === 'beginner'
      ? 'Où en es-tu ? Décris en mots simples ou clique « Continuer ».'
      : 'Où en es-tu ? Décris ton avancement ou clique « Continuer ».',
    tier === 'beginner'
      ? `Ton plan jour par jour est aussi dans l'onglet « Mon plan ».`
      : `Ton parcours jour par jour (${TOTAL_ROADMAP_DAYS} jours. 6 chapitres) est aussi dans l'onglet Parcours.`
  );
  return parts.join('\n');
}

function buildResetWelcomeMessage(profile: QuizProfileSnapshot): string {
  const biz = businessProfiles[profile.topBusinessId];
  return `Nouveau départ sur ${profile.topBusinessName}.

${biz.firstSteps[0] ? `On repart par : ${biz.firstSteps[0]}` : 'Décris où tu en es. On avance tout de suite.'}`;
}

function toDisplayMessages(stored: CoachMessage[]): Message[] {
  return stored.map(({ role, content }) => ({ role, content }));
}

function buildChatDisplay(resumeWelcome: string, stored: CoachMessage[]): Message[] {
  if (!stored.some((m) => m.role === 'user')) {
    return [{ role: 'assistant', content: resumeWelcome }];
  }
  return [{ role: 'assistant', content: resumeWelcome }, ...toDisplayMessages(stored)];
}

function runRoadmapCatchUpSync(
  businessId: BusinessId,
  ctx: RoadmapCoachContext,
  exchanges: Message[]
) {
  const stored = loadRoadmapProgress();
  return syncAllPendingActionsFromHistory(
    businessId,
    ctx,
    exchanges,
    stored?.businessId === businessId ? stored : null
  );
}

function appendAssistantToChat(
  prev: Message[],
  userMessage: Message,
  assistantContent: string
): Message[] {
  const last = prev[prev.length - 1];
  if (last?.role === 'assistant' && last.content === assistantContent) {
    return prev;
  }
  if (last?.role === 'user' && last.content === userMessage.content) {
    return [...prev, { role: 'assistant', content: assistantContent }];
  }
  const hasUser = prev.some((m) => m.role === 'user' && m.content === userMessage.content);
  return hasUser
    ? [...prev, { role: 'assistant', content: assistantContent }]
    : [...prev, userMessage, { role: 'assistant', content: assistantContent }];
}

function appendRoadmapWelcomeIfNew(messages: Message[], welcome: string, dayTitle: string): Message[] {
  const welcomeMarker = '### Action';
  if (messages.some((m) => m.role === 'assistant' && m.content.includes(welcomeMarker))) {
    return messages;
  }
  const last = messages[messages.length - 1];
  if (last?.role === 'assistant' && last.content.includes(dayTitle)) {
    return messages;
  }
  return [...messages, { role: 'assistant', content: welcome }];
}

async function fetchProductMemory(businessId: BusinessId): Promise<{
  authenticated: boolean;
  tablesMissing: boolean;
  payload: ProductMemoryPayload | null;
}> {
  const res = await fetch(`/api/coach/memory?businessId=${businessId}`);
  if (res.status === 401) return { authenticated: false, tablesMissing: false, payload: null };

  if (res.status === 503) {
    const data = await res.json().catch(() => ({}));
    if (data.code === 'TABLES_MISSING') {
      return { authenticated: true, tablesMissing: true, payload: null };
    }
  }

  if (!res.ok) return { authenticated: false, tablesMissing: false, payload: null };

  const data = await res.json();
  if (!data.memory) return { authenticated: true, tablesMissing: false, payload: null };

  return {
    authenticated: true,
    tablesMissing: false,
    payload: {
      messages: data.memory.messages,
      resumeWelcome: data.memory.resumeWelcome,
      coachingPhase: data.memory.context?.coachingPhase,
    },
  };
}

async function importLocalToProductMemory(
  businessId: BusinessId,
  local: ReturnType<typeof loadCoachMemory>
) {
  if (!local || !hasCoachConversation(local)) return null;

  const res = await fetch('/api/coach/memory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId,
      localMessages: local.messages.map((m) => ({ role: m.role, content: m.content })),
      progressPoint: local.progressPoint,
      lastAction: local.lastAction,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!data.memory) return null;

  clearCoachMemory(businessId);

  return {
    messages: data.memory.messages as CoachMessage[],
    resumeWelcome: data.memory.resumeWelcome as string,
  };
}

interface CoachProps {
  isSubscribed?: boolean;
  loggedIn?: boolean;
  serverPlanId?: PlanId | null;
  isGrowth?: boolean;
}

export default function Coach({
  isSubscribed = false,
  loggedIn = false,
  isGrowth = false,
}: CoachProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { copy } = useEntrepreneurCopy();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationMessages, setConversationMessages] = useState<CoachMessage[]>([]);
  const [useProductMemory, setUseProductMemory] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [quizProfile, setQuizProfile] = useState<QuizProfileSnapshot | null>(null);
  const [activeProfile, setActiveProfile] = useState<QuizProfileSnapshot | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<BusinessId | null>(null);
  const [coachingPhase, setCoachingPhase] = useState(1);
  const [resumeWelcome, setResumeWelcome] = useState('');
  const [activeRoadmapContext, setActiveRoadmapContext] = useState<RoadmapCoachContext | null>(
    null
  );
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [coachLimitReached, setCoachLimitReached] = useState(false);
  const [taskSyncNotice, setTaskSyncNotice] = useState<string | null>(null);
  const [roadmapProgressTick, setRoadmapProgressTick] = useState(0);
  const [planLinked, setPlanLinked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const roadmapHandledRef = useRef(false);

  function initLocalSession(
    businessId: BusinessId,
    resolvedProfile: QuizProfileSnapshot | null
  ) {
    const memory = loadCoachMemory(businessId);

    if (memory && hasCoachConversation(memory)) {
      const resume = buildRoadmapAwareResumeWelcome(
        businessId,
        resolvedProfile,
        isSubscribed,
        buildResumeWelcome(memory)
      );
      setResumeWelcome(resume);
      setConversationMessages(memory.messages);
      setMessages(buildChatDisplay(resume, memory.messages));
      if (memory.coachingPhase) setCoachingPhase(memory.coachingPhase);
      return;
    }

    const welcome = buildWelcomeMessage(resolvedProfile, copy.coach, copy.tier);
    setResumeWelcome(welcome);
    setConversationMessages([]);
    setMessages([{ role: 'assistant', content: welcome }]);
  }

  async function initCoachSession(
    businessId: BusinessId,
    resolvedProfile: QuizProfileSnapshot | null
  ) {
    setInitializing(true);

    let { authenticated, tablesMissing, payload: product } = await fetchProductMemory(businessId);

    if (authenticated && !product && !tablesMissing) {
      const local = loadCoachMemory(businessId);
      product = await importLocalToProductMemory(businessId, local);
    }

    if (authenticated && product && product.messages.some((m) => m.role === 'user')) {
      setUseProductMemory(true);
      const resume = buildRoadmapAwareResumeWelcome(
        businessId,
        resolvedProfile,
        isSubscribed,
        product.resumeWelcome
      );
      setResumeWelcome(resume);
      setConversationMessages(product.messages);
      setMessages(buildChatDisplay(resume, product.messages));
      if (product.coachingPhase) setCoachingPhase(product.coachingPhase);
      setInitializing(false);
      return;
    }

    if (authenticated && tablesMissing) {
      setUseProductMemory(false);
      initLocalSession(businessId, resolvedProfile);
      setInitializing(false);
      return;
    }

    if (authenticated) {
      setUseProductMemory(true);
      const welcome = buildWelcomeMessage(resolvedProfile, copy.coach, copy.tier);
      setResumeWelcome(welcome);
      setConversationMessages([]);
      setMessages([{ role: 'assistant', content: welcome }]);
      setInitializing(false);
      return;
    }

    setUseProductMemory(false);
    initLocalSession(businessId, resolvedProfile);
    setInitializing(false);
  }

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    recordCoachSession();
    const saved = loadQuizProfile();
    setQuizProfile(saved);

    if (saved) {
      markQuizCompleted();
      const { businessId, activeProfile: resolved } = resolveCoachProfile(saved);
      setSelectedBusinessId(businessId);
      setActiveProfile(resolved);
      void initCoachSession(businessId, resolved);
    } else {
      const welcome = buildWelcomeMessage(null, copy.coach, copy.tier);
      setResumeWelcome(welcome);
      setMessages([{ role: 'assistant', content: welcome }]);
      setInitializing(false);
    }
  }, []);

  const applyBusinessSwitch = useCallback(
    (nextId: BusinessId) => {
      if (!quizProfile || nextId === selectedBusinessId) return;

      const nextProfile = buildActiveCoachProfile(quizProfile, nextId);
      setSelectedBusinessId(nextId);
      setActiveProfile(nextProfile);
      setUseProductMemory(false);
      setActiveRoadmapContext(null);
      clearActiveRoadmapCoachContext();
      setPlanLinked(false);
      setConversationMessages([]);
      setCoachingPhase(1);
      const welcome = buildResetWelcomeMessage(nextProfile);
      setResumeWelcome(welcome);
      setMessages([{ role: 'assistant', content: welcome }]);
      setInput('');
      setError('');
      void initCoachSession(nextId, nextProfile);
    },
    [quizProfile, selectedBusinessId]
  );

  useEffect(() => {
    function onBusinessChanged(e: Event) {
      const detail = (e as CustomEvent<{ businessId: BusinessId }>).detail;
      if (detail?.businessId) applyBusinessSwitch(detail.businessId);
    }

    window.addEventListener(BUSINESS_CHANGED_EVENT, onBusinessChanged);
    return () => window.removeEventListener(BUSINESS_CHANGED_EVENT, onBusinessChanged);
  }, [applyBusinessSwitch]);

  useEffect(() => {
    setNotepadOpen(loadCoachNotepadOpenPreference());
  }, []);

  function toggleNotepad() {
    setNotepadOpen((prev) => {
      const next = !prev;
      saveCoachNotepadOpenPreference(next);
      return next;
    });
  }

  useEffect(() => {
    const stored = loadActiveRoadmapCoachContext();
    if (stored) {
      setActiveRoadmapContext(stored);
      return;
    }

    const profile = activeProfile ?? quizProfile;
    const businessId = selectedBusinessId ?? profile?.topBusinessId;
    const ctx = resolveCoachRoadmapContext(businessId, null, profile, isSubscribed);
    if (ctx) {
      setActiveRoadmapContext(ctx);
      persistActiveRoadmapCoachContext(ctx);
    }
  }, [activeProfile, quizProfile, selectedBusinessId, isSubscribed]);

  useEffect(() => {
    if (!taskSyncNotice) return;
    const timer = window.setTimeout(() => setTaskSyncNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [taskSyncNotice]);

  useEffect(() => {
    const onProgress = () => setRoadmapProgressTick((tick) => tick + 1);
    window.addEventListener(ROADMAP_PROGRESS_EVENT, onProgress);
    return () => window.removeEventListener(ROADMAP_PROGRESS_EVENT, onProgress);
  }, []);

  useEffect(() => {
    if (initializing || roadmapHandledRef.current) return;
    if (searchParams.get('fromRoadmap') !== '1') return;

    roadmapHandledRef.current = true;
    router.replace('/espace?section=coach', { scroll: false });

    const ctx = consumeRoadmapCoachContext();
    if (!ctx) return;

    const businessName = activeProfile?.topBusinessName ?? 'ton projet';
    const businessIdForWelcome = selectedBusinessId ?? activeProfile?.topBusinessId;
    let completedForWelcome =
      businessIdForWelcome && ctx.tasks.length
        ? getRoadmapCompletedIndicesForDay(businessIdForWelcome, ctx.day, ctx.tasks.length)
        : [];

    const historyForCatchUp = messages.some((m) => m.role === 'user')
      ? messages
      : toDisplayMessages(conversationMessages);

    if (businessIdForWelcome) {
      const catchUp = runRoadmapCatchUpSync(businessIdForWelcome, ctx, historyForCatchUp);
      if (catchUp) {
        completedForWelcome = getRoadmapDayTaskIndices(
          catchUp.progress,
          ctx.day,
          ctx.tasks.length
        );
        setTaskSyncNotice(
          catchUp.totalSynced > 1
            ? `✅ ${catchUp.totalSynced} actions synchronisées dans Mon plan`
            : formatRoadmapTaskSyncNotice({
                day: ctx.day,
                newlyCompleted: [completedForWelcome[completedForWelcome.length - 1]],
                tasksDone: completedForWelcome.length,
                tasksTotal: ctx.tasks.length,
                dayCompleted: completedForWelcome.length >= ctx.tasks.length,
                progress: catchUp.progress,
              })!
        );
        setRoadmapProgressTick((tick) => tick + 1);
      }
    }

    const welcome = buildRoadmapCoachWelcome(ctx, businessName, completedForWelcome, {
      includeDayIntro: completedForWelcome.length === 0,
    });
    const now = new Date().toISOString();

    setActiveRoadmapContext(ctx);
    persistActiveRoadmapCoachContext(ctx);
    setPlanLinked(true);
    setMessages((prev) => appendRoadmapWelcomeIfNew(prev, welcome, ctx.title));
  }, [initializing, searchParams, activeProfile, router, messages, conversationMessages, selectedBusinessId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function resolveRoadmapPayloadForSend(
    text: string,
    businessId: BusinessId | undefined,
    linkedToPlan: boolean
  ): RoadmapCoachContext | undefined {
    if (businessId) {
      const detectedDay = detectRoadmapDayInMessage(text);
      if (detectedDay != null) {
        const resolved = getRoadmapDayForCoach(businessId, detectedDay);
        if (resolved) {
          setActiveRoadmapContext(resolved);
          persistActiveRoadmapCoachContext(resolved);
          setPlanLinked(true);
          return resolved;
        }
      }
    }

    if (!linkedToPlan) return undefined;

    const payload =
      activeRoadmapContext ??
      resolveCoachRoadmapContext(businessId, null, activeProfile, isSubscribed);

    if (payload) {
      setActiveRoadmapContext(payload);
      persistActiveRoadmapCoachContext(payload);
    }

    return payload;
  }

  function resumePlan() {
    const businessId = selectedBusinessId ?? activeProfile?.topBusinessId;
    const ctx =
      activeRoadmapContext ??
      (businessId
        ? resolveCoachRoadmapContext(businessId, null, activeProfile, isSubscribed)
        : undefined);

    if (ctx) {
      setActiveRoadmapContext(ctx);
      persistActiveRoadmapCoachContext(ctx);
    }

    setPlanLinked(true);
    void sendMessage(copy.coach.resumePlanMessage, { forcePlan: true });
  }

  async function sendMessage(
    text: string,
    options?: { forcePlan?: boolean; forceFree?: boolean }
  ) {
    if (!text.trim() || loading || initializing || coachLimitReached) return;

    const trimmed = text.trim();
    const interaction = detectCoachInteractionMode(trimmed);
    const nextPlanLinked = options?.forcePlan
      ? true
      : options?.forceFree
        ? false
        : interaction === 'progression'
          ? true
          : planLinked;

    if (nextPlanLinked !== planLinked) {
      setPlanLinked(nextPlanLinked);
    }

    const userMessage: Message = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    const businessId = selectedBusinessId ?? activeProfile?.topBusinessId;
    const localMemory = businessId ? loadCoachMemory(businessId) : null;
    const notepadSnippet = loadLocalNotepad().content;

    try {
      const roadmapPayload = resolveRoadmapPayloadForSend(
        userMessage.content,
        businessId,
        nextPlanLinked
      );

      if (
        nextPlanLinked &&
        roadmapPayload &&
        businessId &&
        isCoachNavigationMessage(trimmed)
      ) {
        const completed = getRoadmapCompletedIndicesForDay(
          businessId,
          roadmapPayload.day,
          roadmapPayload.tasks.length
        );
        const nextIndex = getNextPendingTaskIndex(roadmapPayload.tasks, completed);

        const catchUp = runRoadmapCatchUpSync(businessId, roadmapPayload, [
          ...messages,
          userMessage,
        ]);
        if (catchUp) {
          setMessages((prev) => [...prev, { role: 'assistant', content: catchUp.followUp }]);
          setTaskSyncNotice(
            catchUp.totalSynced > 1
              ? `✅ ${catchUp.totalSynced} actions synchronisées dans Mon plan`
              : formatRoadmapTaskSyncNotice({
                  day: roadmapPayload.day,
                  newlyCompleted: [
                    getRoadmapDayTaskIndices(catchUp.progress, roadmapPayload.day, roadmapPayload.tasks.length).slice(-1)[0],
                  ],
                  tasksDone: getRoadmapDayTaskIndices(
                    catchUp.progress,
                    roadmapPayload.day,
                    roadmapPayload.tasks.length
                  ).length,
                  tasksTotal: roadmapPayload.tasks.length,
                  dayCompleted:
                    getRoadmapDayTaskIndices(
                      catchUp.progress,
                      roadmapPayload.day,
                      roadmapPayload.tasks.length
                    ).length >= roadmapPayload.tasks.length,
                  progress: catchUp.progress,
                })!
          );
          setRoadmapProgressTick((tick) => tick + 1);
          setLoading(false);
          return;
        }

        const navReply =
          nextIndex >= 0
            ? buildRoadmapCoachWelcome(roadmapPayload, '', completed, {
                includeDayIntro: completed.length === 0 ? false : undefined,
              })
            : buildCoachDayCompletedMessage(roadmapPayload);

        setMessages((prev) => [...prev, { role: 'assistant', content: navReply }]);
        setLoading(false);
        return;
      }

      const roadmapCompletedTasks =
        roadmapPayload && businessId
          ? getRoadmapCompletedIndicesForDay(
              businessId,
              roadmapPayload.day,
              roadmapPayload.tasks.length
            )
          : [];
      const phaseMeta = getPhaseById(coachingPhase);
      const baseMemory = getCoachMemoryContext(localMemory);
      const enrichedMemory = baseMemory
        ? {
            ...baseMemory,
            coachingPhase,
            coachingStepLabel: phaseMeta?.name,
          }
        : coachingPhase > 1
          ? {
              progressPoint: '',
              lastAction: '',
              messageCount: conversationMessages.length,
              lastSessionAt: new Date().toISOString(),
              recentExchanges: conversationMessages.slice(-8).map((m) => ({
                role: m.role,
                content: m.content.slice(0, 500),
              })),
              coachingPhase,
              coachingStepLabel: phaseMeta?.name,
            }
          : null;

      const apiInteractionMode: 'question' | 'progression' =
        interaction === 'question'
          ? 'question'
          : nextPlanLinked && roadmapPayload
            ? 'progression'
            : interaction;
      const memoryPayload =
        apiInteractionMode === 'question'
          ? enrichedMemory
            ? {
                ...enrichedMemory,
                coachingPhase: undefined,
                coachingStepLabel: undefined,
                progressPoint: '',
                lastAction: '',
                recentExchanges: [],
              }
            : null
          : enrichedMemory;

      const body =
        useProductMemory && businessId
          ? {
              message: userMessage.content,
              businessId,
              profile: activeProfile,
              roadmapContext: nextPlanLinked ? roadmapPayload : undefined,
              roadmapCompletedTasks,
              notepadSnippet,
              coachPlanLinked: nextPlanLinked,
              coachInteractionMode: apiInteractionMode,
            }
          : {
              messages: [
                ...conversationMessages,
                { role: 'user' as const, content: userMessage.content },
              ].map(({ role, content }) => ({ role, content })),
              profile: activeProfile,
              memory: memoryPayload,
              roadmapContext: nextPlanLinked ? roadmapPayload : undefined,
              roadmapCompletedTasks,
              notepadSnippet,
              coachPlanLinked: nextPlanLinked,
              coachInteractionMode: apiInteractionMode,
            };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 || data.code === COACH_BUDGET_ERROR_CODE) {
          setCoachLimitReached(true);
        }
        throw new Error(data.error || 'Erreur du coach');
      }

      const assistantMessage: Message = { role: 'assistant', content: data.reply };
      const now = new Date().toISOString();

      const businessName = activeProfile?.topBusinessName ?? 'ton projet';
      const roadmapCtx = data.roadmapContext ?? activeRoadmapContext ?? roadmapPayload;

      const syncContextForReply = nextPlanLinked
        ? roadmapPayload ?? data.roadmapContext ?? activeRoadmapContext ?? null
        : activeRoadmapContext;

      let finalReply = assistantMessage.content;
      if (syncContextForReply && businessId && nextPlanLinked && interaction !== 'question') {
        const doneBefore = getRoadmapCompletedIndicesForDay(
          businessId,
          syncContextForReply.day,
          syncContextForReply.tasks.length
        );
        finalReply = processRoadmapCoachReply(
          finalReply,
          syncContextForReply,
          doneBefore,
          userMessage.content
        );
      }
      if (finalReply !== assistantMessage.content) {
        assistantMessage.content = finalReply;
      }

      if (data.memory?.messages) {
        setUseProductMemory(true);
        setConversationMessages(data.memory.messages);
        setMessages((prev) =>
          appendAssistantToChat(prev, userMessage, assistantMessage.content)
        );
      } else if (businessId) {
        const updated = appendCoachExchange(
          businessId,
          userMessage.content,
          assistantMessage.content,
          data.meta?.coachingPhase
            ? { coachingPhase: data.meta.coachingPhase, coachingStepLabel: getPhaseById(data.meta.coachingPhase)?.name }
            : undefined
        );
        setConversationMessages(updated.messages);
        const welcome = resumeWelcome || buildResumeWelcome(updated);
        setResumeWelcome(welcome);
        setMessages((prev) =>
          appendAssistantToChat(prev, userMessage, assistantMessage.content)
        );
      } else {
        setConversationMessages((prev) => [
          ...prev,
          { role: 'user', content: userMessage.content, at: now },
          { role: 'assistant', content: assistantMessage.content, at: now },
        ]);
        setMessages((prev) => [...prev, assistantMessage]);
      }

      if (data.meta?.coachingPhase) {
        setCoachingPhase(data.meta.coachingPhase);
      }

      if (data.roadmapContext) {
        setActiveRoadmapContext(data.roadmapContext);
        persistActiveRoadmapCoachContext(data.roadmapContext);
      }

      const syncContext = (() => {
        if (interaction === 'question') return null;
        if (nextPlanLinked) {
          return roadmapPayload ?? data.roadmapContext ?? activeRoadmapContext ?? null;
        }
        const ctx = activeRoadmapContext;
        if (!ctx || !businessId) return null;
        const done = getRoadmapCompletedIndicesForDay(
          businessId,
          ctx.day,
          ctx.tasks.length
        );
        const detected = inferCompletedTaskIndices({
          reply: assistantMessage.content,
          tasks: ctx.tasks,
          alreadyDone: done,
          userMessage: userMessage.content,
        });
        return detected.length ? ctx : null;
      })();
      if (syncContext && businessId) {
        const storedProgress = loadRoadmapProgress();
        const syncResult = applyCoachRoadmapTaskSync(
          businessId,
          syncContext,
          assistantMessage.content,
          storedProgress?.businessId === businessId ? storedProgress : null,
          userMessage.content
        );
        const notice = syncResult ? formatRoadmapTaskSyncNotice(syncResult) : null;
        if (notice) setTaskSyncNotice(notice);
        if (syncResult?.newlyCompleted.length) {
          setRoadmapProgressTick((tick) => tick + 1);
        }
      }

      recordCoachMessage();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const currentPhase = getPhaseById(coachingPhase);
  const currentPhaseLabel = currentPhase
    ? getPhaseDisplayName(currentPhase.key, copy.tier) ?? currentPhase.name
    : null;
  const progressPct = Math.round((coachingPhase / 8) * 100);
  const recommendedTool = activeProfile
    ? getSiteToolRecommendation(activeProfile.topBusinessId, activeProfile.techLevel)
    : null;
  function handleQuickPrompt(prompt: { label: string; message: string }) {
    const label = prompt.label.toLowerCase();
    if (label.includes('question')) {
      void sendMessage(prompt.message, { forceFree: true });
      return;
    }
    if (
      label.includes('continuer') ||
      label.includes('reprendre') ||
      label.includes('parcours') ||
      label.includes('où j')
    ) {
      void sendMessage(prompt.message, { forcePlan: true });
      return;
    }
    void sendMessage(prompt.message);
  }

  const canResumePlan = Boolean(
    !planLinked &&
      isSubscribed &&
      activeProfile &&
      (activeRoadmapContext ??
        resolveCoachRoadmapContext(
          selectedBusinessId ?? activeProfile.topBusinessId,
          null,
          activeProfile,
          isSubscribed
        ))
  );
  const roadmapTaskProgress =
    activeRoadmapContext && activeProfile && activeRoadmapContext.tasks.length > 0
      ? (() => {
          void roadmapProgressTick;
          return {
            done: getRoadmapCompletedIndicesForDay(
              activeProfile.topBusinessId,
              activeRoadmapContext.day,
              activeRoadmapContext.tasks.length
            ).length,
            total: activeRoadmapContext.tasks.length,
          };
        })()
      : null;
  const lastUserMessageIndex = messages.reduce(
    (last, msg, index) => (msg.role === 'user' ? index : last),
    -1
  );
  const showResumeOnReply =
    canResumePlan &&
    lastUserMessageIndex >= 0 &&
    messages.length - 1 > lastUserMessageIndex &&
    messages[messages.length - 1]?.role === 'assistant';

  if (!isSubscribed) {
    return <CoachPaywall loggedIn={loggedIn} />;
  }

  const roadmapDayLabel = activeRoadmapContext
    ? `J${activeRoadmapContext.day}`
    : `${TOTAL_ROADMAP_DAYS} j`;

  return (
    <div className="coach-shell">
      {activeProfile && (
        <section className="coach-insights" aria-label="Aperçu coaching">
          <article className="coach-insight-card">
            <span className="coach-insight-label">Étape coach</span>
            <div className="coach-insight-value">
              <strong>
                {coachingPhase}
                <span>/8</span>
              </strong>
            </div>
            <p>{currentPhaseLabel ?? (copy.tier === 'beginner' ? 'Plan en 8 étapes' : 'Plan en 8 phases')}</p>
            <div className="coach-insight-track" aria-hidden="true">
              <div className="coach-insight-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </article>

          <Link
            href="/espace?section=parcours"
            className="coach-insight-card coach-insight-card--link"
          >
            <span className="coach-insight-label">Parcours premium</span>
            <div className="coach-insight-value">
              <strong>{roadmapDayLabel}</strong>
            </div>
            <p>
              {activeRoadmapContext
                ? activeRoadmapContext.title
                : '180 jours. 6 chapitres'}
            </p>
          </Link>

          <article className="coach-insight-card">
            <span className="coach-insight-label">Session</span>
            <div className="coach-insight-value">
              <strong>{conversationMessages.length || '—'}</strong>
            </div>
            <p>
              {useProductMemory
                ? 'Mémoire synchronisée'
                : conversationMessages.length
                  ? 'Mémoire locale'
                  : 'Nouvelle conversation'}
            </p>
            {activeProfile && coachingPhase >= 4 && recommendedTool && (
              <span className="coach-insight-tool">
                Site. {recommendedTool.primary}
              </span>
            )}
          </article>
        </section>
      )}

      <div className="chat-window coach-chat coach-chat--v2">
        <header className="coach-panel-head">
          <div className="coach-panel-head-main">
            <div className="chat-avatar coach-avatar-live">BA</div>
            <div className="coach-panel-head-copy">
              <span className="coach-eyebrow">{copy.coach.eyebrow}</span>
              <div className="coach-title-row">
                <strong>BuildrAI Coach</strong>
                <span className="coach-online" aria-label="Coach disponible">
                  <span className="coach-online-dot" aria-hidden="true" />
                  En ligne
                </span>
              </div>
              {activeProfile && quizProfile ? (
                <BusinessModelPicker
                  profile={quizProfile}
                  activeBusinessId={activeProfile.topBusinessId}
                  disabled={loading || initializing || coachLimitReached}
                  variant="coach"
                />
              ) : activeProfile ? (
                <p className="coach-panel-subtitle">
                  {businessProfiles[activeProfile.topBusinessId].icon}{' '}
                  {activeProfile.topBusinessName}
                  {currentPhaseLabel ? `. ${currentPhaseLabel}` : ''}
                </p>
              ) : (
                <p className="coach-panel-subtitle">{copy.coach.subtitleFallback}</p>
              )}
            </div>
          </div>

          <div className="coach-panel-actions">
            {activeRoadmapContext && planLinked && (
              <span className="coach-roadmap-badge" title={activeRoadmapContext.title}>
                {copy.coach.roadmapBadge}
                {activeRoadmapContext.day}/{TOTAL_ROADMAP_DAYS}
                {roadmapTaskProgress && (
                  <span className="coach-roadmap-badge-tasks">
                    · {roadmapTaskProgress.done}/{roadmapTaskProgress.total} actions
                  </span>
                )}
              </span>
            )}
            {activeProfile && (
              <span className="coach-phase-badge">{copy.coach.phaseBadge(coachingPhase)}</span>
            )}
            {isGrowth && <span className="coach-growth-badge">{copy.coach.growthBadge}</span>}
            <button
              type="button"
              className={`coach-notepad-toggle${notepadOpen ? ' is-active' : ''}`}
              onClick={toggleNotepad}
              aria-expanded={notepadOpen}
              aria-controls="coach-notepad-panel"
            >
              Bloc-notes
            </button>
            <Link href="/espace?section=parcours" className="coach-header-link">
              {copy.sections.parcours.label} →
            </Link>
          </div>
        </header>

        <div className="coach-thread chat-messages coach-messages">
          {initializing ? (
            <div className="coach-thread-loading" aria-live="polite">
              <div className="coach-thread-loading-dots" aria-hidden="true">
                <span className="coach-thread-loading-dot" />
                <span className="coach-thread-loading-dot" />
                <span className="coach-thread-loading-dot" />
              </div>
              <p>Chargement de ton session…</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`coach-msg-row coach-msg-row--${msg.role === 'user' ? 'user' : 'bot'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="coach-msg-avatar" aria-hidden="true">
                    BA
                  </div>
                )}
                <div className="coach-msg-stack">
                  <div
                    className={`coach-bubble coach-bubble--${msg.role === 'user' ? 'user' : 'bot'}`}
                  >
                    {msg.role === 'assistant' ? (
                      <CoachMessageView content={msg.content} />
                    ) : (
                      <p className="coach-message-text">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'assistant' &&
                    i === messages.length - 1 &&
                    !loading &&
                    showResumeOnReply && (
                      <button
                        type="button"
                        className="coach-resume-plan-btn"
                        onClick={resumePlan}
                        disabled={loading || initializing || coachLimitReached}
                      >
                        {copy.coach.resumePlanLabel}
                      </button>
                    )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="coach-msg-row coach-msg-row--bot">
              <div className="coach-msg-avatar" aria-hidden="true">
                BA
              </div>
              <div className="coach-bubble coach-bubble--bot coach-bubble--typing">
                <p className="coach-typing">
                  Réflexion
                  <span className="typing-dots" aria-hidden="true">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <footer className="coach-composer">
          <div className="coach-quick-prompts">
            {canResumePlan && (
              <button
                type="button"
                className="coach-prompt-chip coach-prompt-chip--plan"
                onClick={resumePlan}
                disabled={loading || initializing || coachLimitReached}
              >
                {copy.coach.resumePlanLabel}
              </button>
            )}
            {copy.coach.quickPrompts.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                className="coach-prompt-chip"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={loading || initializing || coachLimitReached}
              >
                {prompt.label}
              </button>
            ))}
            {isGrowth && (
              <>
                <Link
                  href="/espace?section=analyse"
                  className="coach-prompt-chip coach-prompt-chip--link"
                >
                  Analyse hebdo
                </Link>
                <Link
                  href="/espace?section=ressources"
                  className="coach-prompt-chip coach-prompt-chip--link"
                >
                  Ressources
                </Link>
              </>
            )}
          </div>

          {taskSyncNotice && (
            <p className="coach-task-sync-notice" role="status" aria-live="polite">
              {taskSyncNotice}
            </p>
          )}

          <form className="coach-composer-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="coach-composer-input"
              placeholder="Pose ta question ou décris ton avancement…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || initializing || coachLimitReached}
              aria-label="Ton message"
            />
            <button
              type="submit"
              className="coach-composer-send"
              disabled={loading || initializing || coachLimitReached || !input.trim()}
              aria-label="Envoyer"
            >
              <span aria-hidden="true">↑</span>
            </button>
          </form>
        </footer>

        <CoachNotepadPanel
          open={notepadOpen}
          onClose={() => {
            setNotepadOpen(false);
            saveCoachNotepadOpenPreference(false);
          }}
        />
      </div>

      {error && <p className="auth-error coach-shell-error">{error}</p>}
    </div>
  );
}
