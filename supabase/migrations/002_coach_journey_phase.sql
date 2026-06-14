-- Phase du parcours coach (1-8) par fil de discussion

alter table public.coach_threads
  add column if not exists coaching_phase smallint not null default 1
    check (coaching_phase >= 1 and coaching_phase <= 8);

alter table public.coach_threads
  add column if not exists coaching_step_label text not null default '';
