import {
  getUserProfile,
  isMissingUserProfileTable,
  saveUserCityStorage,
  type UserCityStorage,
} from '@/lib/account/user-profile';
import { isCompleteAvatar } from '@/lib/city/avatar-data';
import type { CityStorageData } from '@/lib/city/storage';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function parseCityStorage(raw: unknown): UserCityStorage | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<CityStorageData>;
  if (data.avatar != null && !isCompleteAvatar(data.avatar)) return null;

  return {
    avatar: data.avatar ?? null,
    welcomeBonusClaimed: Boolean(data.welcomeBonusClaimed),
    lastSeenBuildingIds: Array.isArray(data.lastSeenBuildingIds)
      ? data.lastSeenBuildingIds.filter((id): id is string => typeof id === 'string')
      : [],
  };
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
      cityStorage: profile?.city_storage ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur ville';
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
    const cityStorage = parseCityStorage(body.cityStorage);
    if (!cityStorage) {
      return NextResponse.json({ error: 'Données ville invalides' }, { status: 400 });
    }

    await saveUserCityStorage(supabase, user.id, user.email ?? null, cityStorage);

    return NextResponse.json({ ok: true, cityStorage });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur ville';
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
