-- Progression parcours (jours cochés)
alter table public.user_profiles
  add column if not exists roadmap_progress jsonb;
