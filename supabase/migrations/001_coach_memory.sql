-- Mémoire produit du coach BuildrAI (un fil par utilisateur + modèle business)

create table if not exists public.coach_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id text not null,
  progress_point text not null default '',
  last_action text not null default '',
  session_summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coach_threads_user_business_unique unique (user_id, business_id)
);

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.coach_threads (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists coach_messages_thread_created_idx
  on public.coach_messages (thread_id, created_at);

alter table public.coach_threads enable row level security;
alter table public.coach_messages enable row level security;

create policy coach_threads_select_own on public.coach_threads
  for select using (auth.uid() = user_id);

create policy coach_threads_insert_own on public.coach_threads
  for insert with check (auth.uid() = user_id);

create policy coach_threads_update_own on public.coach_threads
  for update using (auth.uid() = user_id);

create policy coach_threads_delete_own on public.coach_threads
  for delete using (auth.uid() = user_id);

create policy coach_messages_select_own on public.coach_messages
  for select using (
    exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );

create policy coach_messages_insert_own on public.coach_messages
  for insert with check (
    exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );

create policy coach_messages_delete_own on public.coach_messages
  for delete using (
    exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );
