-- Profil questionnaire entrepreneurial (persistant entre appareils)
alter table public.user_profiles
  add column if not exists quiz_profile jsonb,
  add column if not exists chosen_business text;
