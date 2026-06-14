import { isValidBusinessId } from '@/lib/quiz/business-choices';
import type { BusinessId } from '@/lib/quiz/data';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';
import {
  getUserProfile,
  isMissingUserProfileTable,
  saveUserQuizProfile,
} from '@/lib/account/user-profile';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function parseProfile(raw: unknown): QuizProfileSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const profile = raw as Partial<QuizProfileSnapshot>;
  if (!profile.topBusinessId || !isValidBusinessId(profile.topBusinessId)) return null;
  return profile as QuizProfileSnapshot;
}

function parseChosenBusiness(raw: unknown): BusinessId | null {
  if (typeof raw !== 'string' || !isValidBusinessId(raw)) return null;
  return raw;
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
      profile: profile?.quiz_profile ?? null,
      chosenBusiness: profile?.chosen_business ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur profil quiz';
    if (isMissingUserProfileTable(message)) {
      return NextResponse.json(
        {
          error: 'Table user_profiles absente. Exécutez les migrations Supabase.',
          code: 'TABLES_MISSING',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
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
    const profile = parseProfile(body.profile);
    if (!profile) {
      return NextResponse.json({ error: 'Profil questionnaire invalide' }, { status: 400 });
    }

    const chosenBusiness = parseChosenBusiness(body.chosenBusiness);

    await saveUserQuizProfile(supabase, user.id, user.email ?? null, profile, chosenBusiness);

    return NextResponse.json({ ok: true, profile, chosenBusiness });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur profil quiz';
    if (isMissingUserProfileTable(message)) {
      return NextResponse.json(
        {
          error: 'Table user_profiles absente. Exécutez les migrations Supabase.',
          code: 'TABLES_MISSING',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
