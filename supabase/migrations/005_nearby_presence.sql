-- ================================================================
--  MUVIBE — Near Me: presence and head-to-head challenges
--  Run after 004. Mirrors the SQLite schema in src/lib/db.ts.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. user_presence
--    One row per user who has chosen to be visible to people nearby.
--    Turning visibility off deletes the row; nothing is kept hidden.
-- ----------------------------------------------------------------
create table if not exists public.user_presence (
  user_id            uuid primary key references public.users(id) on delete cascade,
  latitude           double precision not null,
  longitude          double precision not null,
  visible            boolean not null default true,
  status_text        text,
  last_activity_type text,
  updated_at         timestamptz not null default now()
);

alter table public.user_presence enable row level security;

-- Anyone signed in can read who is visible; only you can write your row.
create policy "presence_select_visible" on public.user_presence
  for select using (visible = true or auth.uid() = user_id);

create policy "presence_insert_own" on public.user_presence
  for insert with check (auth.uid() = user_id);

create policy "presence_update_own" on public.user_presence
  for update using (auth.uid() = user_id);

create policy "presence_delete_own" on public.user_presence
  for delete using (auth.uid() = user_id);

-- Public profile fields needed to render a nearby card. The users table
-- is otherwise self-only, so expose just what Near Me shows.
create or replace view public.nearby_profiles as
  select id, full_name, username, department, academic_year, avatar_url
  from public.users;

grant select on public.nearby_profiles to authenticated;

-- ----------------------------------------------------------------
-- 2. peer_challenges
--    A one-to-one challenge between two students.
--    status: pending | accepted | declined | completed | cancelled
-- ----------------------------------------------------------------
create table if not exists public.peer_challenges (
  id            uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.users(id) on delete cascade,
  challengee_id uuid not null references public.users(id) on delete cascade,
  measurement   text not null check (measurement in ('steps', 'distance_km')),
  goal          numeric(10, 2) not null,
  duration_days integer not null default 7,
  status        text not null default 'pending'
                check (status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  created_at    timestamptz not null default now(),
  starts_at     timestamptz,
  ends_at       timestamptz,
  check (challenger_id <> challengee_id)
);

create index if not exists idx_peer_challenges_challenger on public.peer_challenges (challenger_id);
create index if not exists idx_peer_challenges_challengee on public.peer_challenges (challengee_id);

alter table public.peer_challenges enable row level security;

create policy "peer_challenges_select_party" on public.peer_challenges
  for select using (auth.uid() = challenger_id or auth.uid() = challengee_id);

create policy "peer_challenges_insert_as_challenger" on public.peer_challenges
  for insert with check (auth.uid() = challenger_id);

-- Either side may update: the challengee to accept or decline, the
-- challenger to cancel. Status transitions are enforced in the app.
create policy "peer_challenges_update_party" on public.peer_challenges
  for update using (auth.uid() = challenger_id or auth.uid() = challengee_id);

-- Progress is computed from each party's activities inside the window,
-- which the activities RLS already scopes per user. To let each party see
-- the other's total without exposing raw rows, expose an aggregate.
create or replace function public.peer_challenge_progress(challenge_id uuid)
returns table (user_id uuid, progress numeric)
language sql security definer stable as $$
  select a.user_id,
         case c.measurement
           when 'steps' then coalesce(sum(a.steps), 0)
           else coalesce(sum(a.distance_km), 0)
         end as progress
    from public.peer_challenges c
    join public.activities a
      on a.user_id in (c.challenger_id, c.challengee_id)
     and a.started_at >= coalesce(c.starts_at, c.created_at)
     and a.started_at <= coalesce(c.ends_at, now())
   where c.id = challenge_id
     and (auth.uid() = c.challenger_id or auth.uid() = c.challengee_id)
   group by a.user_id, c.measurement;
$$;
