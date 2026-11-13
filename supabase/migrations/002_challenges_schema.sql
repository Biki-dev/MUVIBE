-- ================================================================
--  MUVIBE — Challenges & Participants Schema
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ================================================================

-- 1. Ensure users table has reward_points column
alter table public.users
  add column if not exists reward_points integer not null default 0;

-- 2. challenges table
create table if not exists public.challenges (
  id              text primary key,
  title           text not null,
  category        text not null check (category in ('individual', 'squad', 'campus')),
  difficulty      text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  description     text not null,
  measurement     text not null check (measurement in ('steps', 'distance_km')),
  goal            numeric(10, 2) not null,
  goal_unit       text not null,
  reward_points   integer not null default 0,
  start_date      timestamptz not null,
  end_date        timestamptz not null,
  featured        boolean not null default false,
  rules           text[] not null default '{}',
  eligibility     text not null default 'Open to all enrolled students and faculty members across campus.',
  cover_bg        text not null default '#18352D',
  cover_accent    text not null default '#C5F36B',
  cover_icon      text not null default 'flame',
  created_at      timestamptz not null default now()
);

-- RLS: Anyone can view challenges
alter table public.challenges enable row level security;

create policy "challenges_select_all" on public.challenges
  for select using (true);

-- 3. challenge_participants table
create table if not exists public.challenge_participants (
  id             uuid primary key default gen_random_uuid(),
  challenge_id   text not null references public.challenges(id) on delete cascade,
  user_id        uuid not null references public.users(id) on delete cascade,
  status         text not null default 'active' check (status in ('active', 'completed')),
  progress       numeric(10, 2) not null default 0,
  joined_at      timestamptz not null default now(),
  completed_at   timestamptz,
  unique (challenge_id, user_id)
);

-- Index for fast user participant queries
create index if not exists idx_challenge_participants_user
  on public.challenge_participants (user_id);

create index if not exists idx_challenge_participants_challenge
  on public.challenge_participants (challenge_id);

-- RLS: Anyone can read participant records (to see participant counts & avatar lists)
alter table public.challenge_participants enable row level security;

create policy "challenge_participants_select_all" on public.challenge_participants
  for select using (true);

create policy "challenge_participants_insert_own" on public.challenge_participants
  for insert with check (auth.uid() = user_id);

create policy "challenge_participants_update_own" on public.challenge_participants
  for update using (auth.uid() = user_id);

create policy "challenge_participants_delete_own" on public.challenge_participants
  for delete using (auth.uid() = user_id);

-- 4. Initial Challenges Seed Data (Measured strictly in steps or distance_km)
insert into public.challenges (
  id, title, category, difficulty, description, measurement, goal, goal_unit,
  reward_points, start_date, end_date, featured, rules, cover_bg, cover_accent, cover_icon
) values
(
  'ch_featured_01',
  '7 DAY ACTIVE CAMPUS',
  'campus',
  'intermediate',
  'Accumulate 35 kilometers this week across walking, running, or cycling around campus grounds.',
  'distance_km',
  35.0,
  'km',
  50,
  now() - interval '2 days',
  now() + interval '5 days',
  true,
  array[
    'Only activities recorded during the active challenge window count.',
    'Running, walking, cycling and hiking activities are eligible.',
    'Progress updates automatically as workouts are saved in MUVIBE.'
  ],
  '#18352D',
  '#C5F36B',
  'flame'
),
(
  'ch_step_hunter',
  'Daily Step Hunter',
  'individual',
  'beginner',
  'Maintain an active daily rhythm by logging 50,000 steps. Perfect for hostel-to-class commutes and campus strolls.',
  'steps',
  50000,
  'steps',
  40,
  now() - interval '2 days',
  now() + interval '5 days',
  false,
  array[
    'Steps recorded via pedometer or walking/running sessions count.',
    'Must complete the target before the challenge end date.',
    'Recommended pace: ~7,200 steps/day.'
  ],
  '#25443B',
  '#C5F36B',
  'footsteps-outline'
),
(
  'ch_cycling_100k',
  '100 KM Cycling Quest',
  'individual',
  'intermediate',
  'Push your endurance on two wheels. Accumulate 100 km of cycling around campus loops and highway bypasses.',
  'distance_km',
  100.0,
  'km',
  100,
  now() - interval '4 days',
  now() + interval '10 days',
  false,
  array[
    'Only cycling activity sessions recorded with GPS distance qualify.',
    'Both outdoor cycling and gym stationary rides count towards the goal.',
    'Average speed must be greater than 8 km/h.'
  ],
  '#162C25',
  '#5279F6',
  'bicycle-outline'
),
(
  'ch_campus_walkathon',
  'Campus Active Walkathon',
  'campus',
  'beginner',
  'Campus-wide movement challenge. Contribute 120,000 steps to the collective campus milestone.',
  'steps',
  120000,
  'steps',
  60,
  now() - interval '3 days',
  now() + interval '11 days',
  false,
  array[
    'All steps logged in walking or running sessions are counted.',
    'Promotes campus walking habits and sustainable mobility.'
  ],
  '#1B382F',
  '#C5F36B',
  'people-outline'
),
(
  'ch_squad_battle',
  'Squad Step Battle',
  'squad',
  'advanced',
  'Team up with your hostel mates and log 80,000 steps to help your squad climb the campus ranks.',
  'steps',
  80000,
  'steps',
  80,
  now() - interval '1 day',
  now() + interval '6 days',
  false,
  array[
    'Steps logged by squad members contribute to the goal.',
    'Must be logged within the 7-day challenge window.'
  ],
  '#2A423A',
  '#E8A34A',
  'shield-outline'
),
(
  'ch_squad_relay',
  'Hostel Distance Relay',
  'squad',
  'intermediate',
  'Team up to log 60 km of outdoor running or walking distance for your hostel squad.',
  'distance_km',
  60.0,
  'km',
  75,
  now() - interval '2 days',
  now() + interval '8 days',
  false,
  array[
    'Running and walking distance counts towards the squad milestone.',
    'Minimum 1 km session required to qualify.'
  ],
  '#1D332B',
  '#5279F6',
  'trail-sign-outline'
),
(
  'ch_weekend_10k',
  'Weekend 10K Strides',
  'individual',
  'intermediate',
  'Conquer a 10 km running or walking goal over the weekend. Break it into two 5Ks or push through in one run.',
  'distance_km',
  10.0,
  'km',
  35,
  now() - interval '1 day',
  now() + interval '2 days',
  false,
  array[
    'Running and walking activities count.',
    'Must complete within the weekend window.'
  ],
  '#203A30',
  '#C5F36B',
  'walk-outline'
),
(
  'ch_marathon_prep',
  'Half-Marathon Distance Builder',
  'individual',
  'advanced',
  'Build aerobic endurance by logging a total of 21.1 km of running over 10 days.',
  'distance_km',
  21.1,
  'km',
  120,
  now() - interval '3 days',
  now() + interval '7 days',
  false,
  array[
    'Only outdoor and treadmill running activities count.',
    'Pace must be recorded.'
  ],
  '#142821',
  '#E56C67',
  'trophy-outline'
),
(
  'ch_upcoming_sprint',
  'Spring Campus 25K Challenge',
  'individual',
  'intermediate',
  'Starts in a few days! Prepare yourself to log 25 km of distance across campus trails.',
  'distance_km',
  25.0,
  'km',
  70,
  now() + interval '3 days',
  now() + interval '12 days',
  false,
  array[
    'Tracking begins exactly when the challenge start date arrives.',
    'Join early to secure your spot and receive start notifications.'
  ],
  '#18352D',
  '#C5F36B',
  'calendar-outline'
)
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  difficulty = excluded.difficulty,
  description = excluded.description,
  measurement = excluded.measurement,
  goal = excluded.goal,
  goal_unit = excluded.goal_unit,
  reward_points = excluded.reward_points,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  featured = excluded.featured,
  rules = excluded.rules,
  cover_bg = excluded.cover_bg,
  cover_accent = excluded.cover_accent,
  cover_icon = excluded.cover_icon;
