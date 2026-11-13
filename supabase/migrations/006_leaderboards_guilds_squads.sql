-- ================================================================
--  MUVIBE — Phase 1: real leaderboards, Guild Power, Squad Quests
--  Run after 005. Mirrors the SQLite schema in src/lib/db.ts and the
--  scoring in src/services/points-engine.ts. If you change the point
--  values in one place, change them in the other.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. hostel, the second guild dimension beside department
-- ----------------------------------------------------------------
alter table public.users add column if not exists hostel text;

-- ----------------------------------------------------------------
-- 2. Scoring, kept identical to points-engine.ts
--      10 per activity of 5 minutes or more
--       5 per km
--       3 per 1000 steps
--       2 per 100 kcal
--     capped at 300 per person per day
-- ----------------------------------------------------------------
create or replace function public.activity_points(
  duration_seconds integer,
  distance_km numeric,
  steps integer,
  calories integer
) returns numeric language sql immutable as $$
  select case
    when coalesce(duration_seconds, 0) < 300 then 0
    else round(
      10
      + coalesce(distance_km, 0) * 5
      + (coalesce(steps, 0) / 1000.0) * 3
      + (coalesce(calories, 0) / 100.0) * 2
    )
  end;
$$;

-- Per-user points in a window, with the daily cap applied before summing.
create or replace function public.user_points_since(since timestamptz)
returns table (user_id uuid, points numeric, distance_km numeric,
               steps numeric, active_minutes numeric)
language sql security definer stable as $$
  with per_day as (
    select a.user_id,
           date_trunc('day', a.started_at) as day,
           least(
             sum(public.activity_points(a.duration_seconds, a.distance_km, a.steps, a.calories)),
             300
           ) as day_points,
           sum(coalesce(a.distance_km, 0)) as distance_km,
           sum(coalesce(a.steps, 0)) as steps,
           sum(coalesce(a.duration_seconds, 0)) / 60.0 as active_minutes
      from public.activities a
     where a.started_at >= since
     group by a.user_id, date_trunc('day', a.started_at)
  )
  select user_id,
         sum(day_points) as points,
         sum(distance_km) as distance_km,
         sum(steps) as steps,
         sum(active_minutes) as active_minutes
    from per_day
   group by user_id;
$$;

grant execute on function public.user_points_since(timestamptz) to authenticated;

-- ----------------------------------------------------------------
-- 3. Individual leaderboard
--    security definer so ranks can be built without exposing anyone's
--    raw activity rows; only the aggregate and public profile fields
--    leave the function.
-- ----------------------------------------------------------------
create or replace function public.individual_leaderboard(since timestamptz, limit_n integer default 50)
returns table (user_id uuid, full_name text, username text, department text,
               points numeric, distance_km numeric, steps numeric, active_minutes numeric)
language sql security definer stable as $$
  select p.user_id, u.full_name, u.username, u.department,
         p.points, p.distance_km, p.steps, p.active_minutes
    from public.user_points_since(since) p
    join public.users u on u.id = p.user_id
   where p.points > 0
   order by p.points desc
   limit limit_n;
$$;

grant execute on function public.individual_leaderboard(timestamptz, integer) to authenticated;

-- ----------------------------------------------------------------
-- 4. Guild Power, grouped by department or hostel
-- ----------------------------------------------------------------
create or replace function public.guild_leaderboard(since timestamptz, dimension text)
returns table (guild text, guild_power numeric, member_count bigint,
               distance_km numeric, steps numeric)
language sql security definer stable as $$
  select case when dimension = 'hostel' then u.hostel else u.department end as guild,
         sum(p.points) as guild_power,
         count(distinct p.user_id) as member_count,
         sum(p.distance_km) as distance_km,
         sum(p.steps) as steps
    from public.user_points_since(since) p
    join public.users u on u.id = p.user_id
   where case when dimension = 'hostel' then u.hostel else u.department end is not null
   group by 1
  having sum(p.points) > 0
   order by 2 desc;
$$;

grant execute on function public.guild_leaderboard(timestamptz, text) to authenticated;

-- ----------------------------------------------------------------
-- 5. Squads
-- ----------------------------------------------------------------
create table if not exists public.squads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.squad_members (
  squad_id  uuid not null references public.squads(id) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (squad_id, user_id)
);

create table if not exists public.squad_quests (
  id          uuid primary key default gen_random_uuid(),
  squad_id    uuid not null references public.squads(id) on delete cascade,
  title       text not null,
  measurement text not null check (measurement in ('steps', 'distance_km', 'calories')),
  goal        numeric(12, 2) not null,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null,
  status      text not null default 'active' check (status in ('active', 'completed', 'expired')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_squad_members_user on public.squad_members (user_id);
create index if not exists idx_squad_quests_squad on public.squad_quests (squad_id);

alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.squad_quests enable row level security;

-- Helper keeps the policies readable and avoids recursive lookups.
create or replace function public.is_squad_member(sid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.squad_members
     where squad_id = sid and user_id = auth.uid()
  );
$$;

grant execute on function public.is_squad_member(uuid) to authenticated;

create policy "squads_select_member" on public.squads
  for select using (public.is_squad_member(id) or created_by = auth.uid());
create policy "squads_insert_own" on public.squads
  for insert with check (created_by = auth.uid());
create policy "squads_delete_creator" on public.squads
  for delete using (created_by = auth.uid());

create policy "squad_members_select_member" on public.squad_members
  for select using (public.is_squad_member(squad_id));
-- You may add yourself, or the creator may add others.
create policy "squad_members_insert" on public.squad_members
  for insert with check (
    user_id = auth.uid()
    or exists (select 1 from public.squads s where s.id = squad_id and s.created_by = auth.uid())
  );
create policy "squad_members_delete_self" on public.squad_members
  for delete using (user_id = auth.uid());

create policy "squad_quests_select_member" on public.squad_quests
  for select using (public.is_squad_member(squad_id));
create policy "squad_quests_insert_member" on public.squad_quests
  for insert with check (public.is_squad_member(squad_id));
create policy "squad_quests_update_member" on public.squad_quests
  for update using (public.is_squad_member(squad_id));

-- ----------------------------------------------------------------
-- 6. Squad quest progress, per member, inside the quest window
-- ----------------------------------------------------------------
create or replace function public.squad_quest_progress(quest_id uuid)
returns table (user_id uuid, full_name text, value numeric)
language sql security definer stable as $$
  select sm.user_id,
         u.full_name,
         coalesce(sum(
           case q.measurement
             when 'steps' then a.steps
             when 'calories' then a.calories
             else a.distance_km
           end
         ), 0) as value
    from public.squad_quests q
    join public.squad_members sm on sm.squad_id = q.squad_id
    join public.users u on u.id = sm.user_id
    left join public.activities a
      on a.user_id = sm.user_id
     and a.started_at >= q.starts_at
     and a.started_at <= q.ends_at
   where q.id = quest_id
     and public.is_squad_member(q.squad_id)
   group by sm.user_id, u.full_name;
$$;

grant execute on function public.squad_quest_progress(uuid) to authenticated;

-- ----------------------------------------------------------------
-- 7. Squad standings
-- ----------------------------------------------------------------
create or replace function public.squad_leaderboard(since timestamptz)
returns table (squad_id uuid, name text, total_points numeric,
               member_count bigint, distance_km numeric)
language sql security definer stable as $$
  select s.id, s.name,
         coalesce(sum(p.points), 0) as total_points,
         count(distinct sm.user_id) as member_count,
         coalesce(sum(p.distance_km), 0) as distance_km
    from public.squads s
    join public.squad_members sm on sm.squad_id = s.id
    left join public.user_points_since(since) p on p.user_id = sm.user_id
   group by s.id, s.name
   order by 3 desc;
$$;

grant execute on function public.squad_leaderboard(timestamptz) to authenticated;
