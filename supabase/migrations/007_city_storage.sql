-- Données ville / personnage (persistant entre appareils)
alter table public.user_profiles
  add column if not exists city_storage jsonb;
