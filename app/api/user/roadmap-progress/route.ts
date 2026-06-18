import type { RoadmapProgress } from '@/lib/account/roadmap-storage';
import { normalizeRoadmapProgress } from '@/lib/account/roadmap-storage';
import { isValidBusinessId } from '@/lib/quiz/business-choices';
import {
  getUserProfile,
  isMissingUserProfileSchema,
  saveUserRoadmapProgress,
} from '@/lib/account/user-profile';
import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/errors';
import { NextResponse } from 'next/server';

function parseRoadmapProgress(raw: unknown): RoadmapProgress | null {
  if (!raw || typeof raw !== 'object') return null;
  const progress = raw as Partial<RoadmapProgress>;
  if (!progress.businessId || !isValidBusinessId(progress.businessId)) return null;
  if (!Array.isArray(progress.completedDays)) return null;

  const completedTasks =
    progress.completedTasks && typeof progress.completedTasks === 'object'
      ? Object.fromEntries(
          Object.entries(progress.completedTasks as Record<string, unknown>)
            .map(([dayKey, indices]) => {
              const day = Number(dayKey);
              if (!Number.isFinite(day) || !Array.isArray(indices)) return null;
              return [
                day,
                indices.filter((index): index is number => Number.isFinite(index)),
              ] as const;
            })
            .filter((entry): entry is readonly [number, number[]] => entry != null)
        )
      : {};

  return normalizeRoadmapProgress({
    businessId: progress.businessId,
    completedDays: progress.completedDays.filter((day) => Number.isFinite(day)),
    completedTasks,
    updatedAt: progress.updatedAt ?? new Date().toISOString(),
  });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const profile = await getUserProfile(supabase, user.id);
    return NextResponse.json({
      progress: profile?.roadmap_progress ?? null,
    });
  } catch (err) {
    if (isMissingUserProfileSchema(err)) {
      return NextResponse.json(
        {
          error: 'Table user_profiles absente. Exécutez les migrations Supabase.',
          code: 'TABLES_MISSING',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: getErrorMessage(err, 'Erreur parcours') }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const body = await request.json();
    const progress = parseRoadmapProgress(body.progress);
    if (!progress) {
      return NextResponse.json({ error: 'Progression parcours invalide' }, { status: 400 });
    }

    await saveUserRoadmapProgress(supabase, user.id, user.email ?? null, progress);

    return NextResponse.json({ ok: true, progress });
  } catch (err) {
    if (isMissingUserProfileSchema(err)) {
      return NextResponse.json(
        {
          error: 'Table user_profiles absente. Exécutez les migrations Supabase.',
          code: 'TABLES_MISSING',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: getErrorMessage(err, 'Erreur parcours') }, { status: 500 });
  }
}
