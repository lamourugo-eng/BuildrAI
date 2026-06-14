import { hasCoachAccess } from '@/lib/account/coach-access';
import {
  buildProductResumeWelcome,
  clearProductMemory,
  importLocalMessages,
  isMissingTableError,
  loadProductMemory,
  toMemoryContext,
} from '@/lib/coach/product-memory';
import type { BusinessId } from '@/lib/quiz/data';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const VALID_BUSINESS_IDS = new Set([
  'saas',
  'freelance',
  'ecommerce',
  'agency',
  'marketplace',
  'impact',
  'consulting',
  'content',
  'ofm',
]);

function parseBusinessId(raw: string | null): BusinessId | null {
  if (!raw || !VALID_BUSINESS_IDS.has(raw)) return null;
  return raw as BusinessId;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    if (!(await hasCoachAccess(user.email))) {
      return NextResponse.json(
        { error: 'Abonnement requis pour accéder au coach IA.' },
        { status: 403 }
      );
    }

    const businessId = parseBusinessId(new URL(request.url).searchParams.get('businessId'));
    if (!businessId) {
      return NextResponse.json({ error: 'businessId invalide' }, { status: 400 });
    }

    const memory = await loadProductMemory(supabase, user.id, businessId);

    if (!memory || !memory.messages.some((m) => m.role === 'user')) {
      return NextResponse.json({ memory: null });
    }

    return NextResponse.json({
      memory: {
        messages: memory.messages.map((m) => ({
          role: m.role,
          content: m.content,
          at: m.created_at,
        })),
        context: toMemoryContext(memory),
        resumeWelcome: buildProductResumeWelcome(memory),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur mémoire';
    if (isMissingTableError(message)) {
      return NextResponse.json(
        {
          error: 'Tables coach non créées. Exécutez supabase/migrations/001_coach_memory.sql',
          code: 'TABLES_MISSING',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    if (!(await hasCoachAccess(user.email))) {
      return NextResponse.json(
        { error: 'Abonnement requis pour accéder au coach IA.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const businessId = parseBusinessId(body.businessId);
    if (!businessId) {
      return NextResponse.json({ error: 'businessId invalide' }, { status: 400 });
    }

    const localMessages = body.localMessages as
      | { role: 'user' | 'assistant'; content: string }[]
      | undefined;

    if (!Array.isArray(localMessages)) {
      return NextResponse.json({ error: 'localMessages requis' }, { status: 400 });
    }

    const memory = await importLocalMessages(
      supabase,
      user.id,
      businessId,
      localMessages,
      body.progressPoint ?? '',
      body.lastAction ?? ''
    );

    if (!memory) {
      return NextResponse.json({ imported: false, memory: null });
    }

    return NextResponse.json({
      imported: true,
      memory: {
        messages: memory.messages.map((m) => ({
          role: m.role,
          content: m.content,
          at: m.created_at,
        })),
        context: toMemoryContext(memory),
        resumeWelcome: buildProductResumeWelcome(memory),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur import';
    if (isMissingTableError(message)) {
      return NextResponse.json({ error: message, code: 'TABLES_MISSING' }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    if (!(await hasCoachAccess(user.email))) {
      return NextResponse.json(
        { error: 'Abonnement requis pour accéder au coach IA.' },
        { status: 403 }
      );
    }

    const businessId = parseBusinessId(new URL(request.url).searchParams.get('businessId'));
    if (!businessId) {
      return NextResponse.json({ error: 'businessId invalide' }, { status: 400 });
    }

    await clearProductMemory(supabase, user.id, businessId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur suppression';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
