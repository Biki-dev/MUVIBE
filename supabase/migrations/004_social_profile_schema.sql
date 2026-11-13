-- ================================================================
--  MUVIBE — Social Connections & Public Profiles Migration
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ================================================================

-- 1. Allow authenticated users to view other users' public profile info & activities
drop policy if exists "users_select_own" on public.users;
create policy "users_select_all" on public.users
  for select using (true);

drop policy if exists "activities_select_own" on public.activities;
create policy "activities_select_all" on public.activities
  for select using (true);

-- 2. user_connections table (Followers, Following & Friend Requests)
create table if not exists public.user_connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.users(id) on delete cascade,
  target_id     uuid not null references public.users(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (requester_id, target_id)
);

create index if not exists idx_user_connections_requester on public.user_connections(requester_id);
create index if not exists idx_user_connections_target on public.user_connections(target_id);

alter table public.user_connections enable row level security;

create policy "user_connections_select_all" on public.user_connections
  for select using (true);

create policy "user_connections_insert_own" on public.user_connections
  for insert with check (auth.uid() = requester_id);

create policy "user_connections_update_target_or_requester" on public.user_connections
  for update using (auth.uid() = target_id or auth.uid() = requester_id);

create policy "user_connections_delete_target_or_requester" on public.user_connections
  for delete using (auth.uid() = requester_id or auth.uid() = target_id);
