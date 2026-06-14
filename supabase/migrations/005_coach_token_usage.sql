-- Consommation tokens coach IA par utilisateur et par mois calendaire
-- Idempotent : peut être ré-exécuté sans erreur si la table existe déjà.

create table if not exists public.coach_token_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  period_key text not null,
  prompt_tokens bigint not null default 0,
  completion_tokens bigint not null default 0,
  cost_eur numeric(14, 6) not null default 0,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period_key)
);

create index if not exists coach_token_usage_period_idx
  on public.coach_token_usage (period_key);

alter table public.coach_token_usage enable row level security;

drop policy if exists coach_token_usage_select_own on public.coach_token_usage;
drop policy if exists coach_token_usage_insert_own on public.coach_token_usage;
drop policy if exists coach_token_usage_update_own on public.coach_token_usage;

create policy coach_token_usage_select_own on public.coach_token_usage
  for select using (auth.uid() = user_id);

create policy coach_token_usage_insert_own on public.coach_token_usage
  for insert with check (auth.uid() = user_id);

create policy coach_token_usage_update_own on public.coach_token_usage
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
