-- ================================================================
--  MUVIBE — Initial Supabase Schema
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ================================================================

-- ----------------------------------------------------------------
-- 1. users table
--    Stores extended profile data beyond what Supabase Auth holds.
--    Row is inserted once after successful sign-up / first login.
-- ----------------------------------------------------------------
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  username        text unique,
  college         text,
  department      text,
  academic_year   text,
  avatar_url      text,
  bio             text,
  onboarding_done boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS: users can only read/write their own row
alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- ----------------------------------------------------------------
-- 2. activities table
--    One row per completed activity session.
-- ----------------------------------------------------------------
create table if not exists public.activities (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  type               text not null,                -- 'walking' | 'running' | etc.
  started_at         timestamptz not null,
  ended_at           timestamptz not null,
  duration_seconds   integer not null default 0,
  distance_km        numeric(8, 3),
  steps              integer,
  jump_count         integer,
  calories           integer not null default 0,
  average_speed      numeric(6, 2),
  average_pace       text,
  tracking_mode      text not null default 'timer', -- 'sensor'|'gps'|'timer'|'manual'
  notes              text,
  created_at         timestamptz not null default now()
);

-- Index for fast per-user time-range queries (stats, streaks)
create index if not exists activities_user_started_at
  on public.activities (user_id, started_at desc);

-- RLS: users can only access their own activities
alter table public.activities enable row level security;

create policy "activities_select_own" on public.activities
  for select using (auth.uid() = user_id);

create policy "activities_insert_own" on public.activities
  for insert with check (auth.uid() = user_id);

create policy "activities_update_own" on public.activities
  for update using (auth.uid() = user_id);

create policy "activities_delete_own" on public.activities
  for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 3. Auto-update updated_at on users
-- ----------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();
