-- SetLog schema for Supabase
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
--
-- Auth model: the app signs in anonymously, so every request has an
-- authenticated role and a real auth.uid(). Row-level security keeps each
-- user's sets private without a custom login screen.

create table if not exists public.sets (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise text not null check (char_length(exercise) between 1 and 60),
  weight numeric(7, 2) not null check (weight >= 0 and weight < 10000),
  reps integer not null check (reps > 0 and reps <= 1000),
  rpe numeric(3, 1) not null check (rpe >= 1 and rpe <= 10),
  performed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sets_user_performed_idx
  on public.sets (user_id, performed_at desc);

alter table public.sets enable row level security;

grant select, insert, update, delete on public.sets to authenticated;

drop policy if exists "Users can read their own sets" on public.sets;
create policy "Users can read their own sets"
  on public.sets
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own sets" on public.sets;
create policy "Users can insert their own sets"
  on public.sets
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own sets" on public.sets;
create policy "Users can update their own sets"
  on public.sets
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own sets" on public.sets;
create policy "Users can delete their own sets"
  on public.sets
  for delete
  to authenticated
  using (auth.uid() = user_id);
