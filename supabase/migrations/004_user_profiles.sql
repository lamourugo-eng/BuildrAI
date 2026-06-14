-- Profil utilisateur : newsletter + essai Premium 24 h
-- Idempotent : peut être ré-exécuté sans erreur si la table existe déjà.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  newsletter_opt_in boolean not null default false,
  newsletter_opt_in_at timestamptz,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  trial_used boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_trial_ends_at_idx
  on public.user_profiles (trial_ends_at)
  where trial_ends_at is not null;

alter table public.user_profiles enable row level security;

drop policy if exists user_profiles_select_own on public.user_profiles;
drop policy if exists user_profiles_insert_own on public.user_profiles;
drop policy if exists user_profiles_update_own on public.user_profiles;

create policy user_profiles_select_own on public.user_profiles
  for select using (auth.uid() = user_id);

create policy user_profiles_insert_own on public.user_profiles
  for insert with check (auth.uid() = user_id);

create policy user_profiles_update_own on public.user_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
