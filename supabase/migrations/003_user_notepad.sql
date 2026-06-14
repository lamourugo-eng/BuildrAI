-- Bloc-notes personnel par utilisateur (dashboard BuildrAI)

create table if not exists public.user_notepad (
  user_id uuid primary key references auth.users (id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.user_notepad enable row level security;

create policy user_notepad_select_own on public.user_notepad
  for select using (auth.uid() = user_id);

create policy user_notepad_insert_own on public.user_notepad
  for insert with check (auth.uid() = user_id);

create policy user_notepad_update_own on public.user_notepad
  for update using (auth.uid() = user_id);

create policy user_notepad_delete_own on public.user_notepad
  for delete using (auth.uid() = user_id);
