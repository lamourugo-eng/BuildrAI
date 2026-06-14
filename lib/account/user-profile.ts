import type { BusinessId } from '@/lib/quiz/data';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';
import type { RoadmapProgress } from '@/lib/account/roadmap-storage';
import type { FounderAvatar } from '@/lib/city/avatar-data';
import type { SupabaseClient } from '@supabase/supabase-js';

export const NEWSLETTER_TRIAL_MS = 24 * 60 * 60 * 1000;

export interface UserCityStorage {
  avatar: FounderAvatar | null;
  welcomeBonusClaimed: boolean;
  lastSeenBuildingIds: string[];
}

export interface UserProfile {
  user_id: string;
  email: string | null;
  newsletter_opt_in: boolean;
  newsletter_opt_in_at: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_used: boolean;
  quiz_profile?: QuizProfileSnapshot | null;
  chosen_business?: BusinessId | null;
  city_storage?: UserCityStorage | null;
  roadmap_progress?: RoadmapProgress | null;
}

export function isMissingUserProfileTable(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('user_profiles') &&
    (lower.includes('does not exist') ||
      lower.includes('schema cache') ||
      lower.includes('could not find') ||
      lower.includes('pgrst205') ||
      lower.includes('quiz_profile') ||
      lower.includes('chosen_business') ||
      lower.includes('city_storage') ||
      lower.includes('roadmap_progress'))
  );
}

export function isTrialWindowActive(profile: UserProfile | null | undefined): boolean {
  if (!profile?.newsletter_opt_in || !profile.trial_ends_at) return false;
  return new Date(profile.trial_ends_at).getTime() > Date.now();
}

export function isTrialExpired(profile: UserProfile | null | undefined): boolean {
  if (!profile?.trial_ends_at) return false;
  return new Date(profile.trial_ends_at).getTime() <= Date.now();
}

const USER_PROFILE_COLUMNS =
  'user_id, email, newsletter_opt_in, newsletter_opt_in_at, trial_started_at, trial_ends_at, trial_used, quiz_profile, chosen_business, city_storage, roadmap_progress';

export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(USER_PROFILE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}

export async function saveUserQuizProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
  quizProfile: QuizProfileSnapshot,
  chosenBusiness?: BusinessId | null
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    email,
    quiz_profile: quizProfile,
    chosen_business: chosenBusiness ?? null,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(row, { onConflict: 'user_id' })
    .select(USER_PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export async function saveUserCityStorage(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
  cityStorage: UserCityStorage
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    email,
    city_storage: cityStorage,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(row, { onConflict: 'user_id' })
    .select(USER_PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export async function saveUserRoadmapProgress(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
  roadmapProgress: RoadmapProgress
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    email,
    roadmap_progress: roadmapProgress,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(row, { onConflict: 'user_id' })
    .select(USER_PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

/** Marque l'essai expiré en base. Idempotent. */
export async function expireTrialInDb(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      trial_started_at: null,
      trial_ends_at: null,
      trial_used: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;
}

export async function upsertNewsletterPreference(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
  newsletterOptIn: boolean
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const existing = await getUserProfile(supabase, userId);

  const row = {
    user_id: userId,
    email,
    newsletter_opt_in: newsletterOptIn,
    newsletter_opt_in_at: newsletterOptIn ? now : existing?.newsletter_opt_in_at ?? null,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(row, { onConflict: 'user_id' })
    .select(USER_PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export type StartTrialResult =
  | { ok: true; trialEndsAt: string; trialStartedAt: string }
  | { ok: false; reason: 'no_opt_in' | 'already_used' | 'stripe_active' | 'trial_active' };

export async function startNewsletterTrialInDb(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
  options: { stripeActive: boolean }
): Promise<{ profile: UserProfile; trial: StartTrialResult }> {
  let profile = await upsertNewsletterPreference(supabase, userId, email, true);

  if (options.stripeActive) {
    return { profile, trial: { ok: false, reason: 'stripe_active' } };
  }

  if (isTrialWindowActive(profile)) {
    return {
      profile,
      trial: { ok: true, trialEndsAt: profile.trial_ends_at!, trialStartedAt: profile.trial_started_at! },
    };
  }

  if (profile.trial_used) {
    return { profile, trial: { ok: false, reason: 'already_used' } };
  }

  if (isTrialExpired(profile)) {
    await expireTrialInDb(supabase, userId);
    profile = (await getUserProfile(supabase, userId)) ?? profile;
    if (profile.trial_used) {
      return { profile, trial: { ok: false, reason: 'already_used' } };
    }
  }

  const trialStartedAt = new Date().toISOString();
  const trialEndsAt = new Date(Date.now() + NEWSLETTER_TRIAL_MS).toISOString();

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      trial_started_at: trialStartedAt,
      trial_ends_at: trialEndsAt,
      trial_used: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select(USER_PROFILE_COLUMNS)
    .single();

  if (error) throw error;

  return {
    profile: data as UserProfile,
    trial: { ok: true, trialEndsAt, trialStartedAt },
  };
}
