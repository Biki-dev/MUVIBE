-- ================================================================
--  MUVIBE — complete Supabase schema, one file
--
--  Paste the whole thing into Supabase → SQL Editor → New Query and run
--  it once. Safe to run again: every object is created with
--  "if not exists", every policy is dropped first, and every function is
--  "create or replace".
--
--  Generated from supabase/migrations/. If you change a migration,
--  regenerate rather than editing this file by hand.
--
--  Contents:
--    1. 001_initial_schema.sql
--    2. 002_challenges_schema.sql
--    3. 003_community_clubs_schema.sql
--    4. 004_social_profile_schema.sql
--    5. 005_nearby_presence.sql
--    6. 006_leaderboards_guilds_squads.sql
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- 001_initial_schema.sql
-- ════════════════════════════════════════════════════════════════

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

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
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

drop policy if exists "activities_select_own" on public.activities;
create policy "activities_select_own" on public.activities
  for select using (auth.uid() = user_id);

drop policy if exists "activities_insert_own" on public.activities;
create policy "activities_insert_own" on public.activities
  for insert with check (auth.uid() = user_id);

drop policy if exists "activities_update_own" on public.activities;
create policy "activities_update_own" on public.activities
  for update using (auth.uid() = user_id);

drop policy if exists "activities_delete_own" on public.activities;
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


-- ════════════════════════════════════════════════════════════════
-- 002_challenges_schema.sql
-- ════════════════════════════════════════════════════════════════

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

drop policy if exists "challenges_select_all" on public.challenges;
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

drop policy if exists "challenge_participants_select_all" on public.challenge_participants;
create policy "challenge_participants_select_all" on public.challenge_participants
  for select using (true);

drop policy if exists "challenge_participants_insert_own" on public.challenge_participants;
create policy "challenge_participants_insert_own" on public.challenge_participants
  for insert with check (auth.uid() = user_id);

drop policy if exists "challenge_participants_update_own" on public.challenge_participants;
create policy "challenge_participants_update_own" on public.challenge_participants
  for update using (auth.uid() = user_id);

drop policy if exists "challenge_participants_delete_own" on public.challenge_participants;
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


-- ════════════════════════════════════════════════════════════════
-- 003_community_clubs_schema.sql
-- ════════════════════════════════════════════════════════════════

-- ================================================================
--  MUVIBE — Community Clubs, Leaderboard & Reddit-like Discussion Schema
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ================================================================

-- 1. Link challenges table to optional club_id
alter table public.challenges
  add column if not exists club_id text;

-- 2. clubs table
create table if not exists public.clubs (
  id                  text primary key,
  name                text not null,
  category            text not null,
  category_label      text not null,
  institution         text not null default 'Assam Engineering College (AEC)',
  description         text not null,
  long_description    text not null,
  meeting_location    text not null,
  cover_color         text not null default '#18352D',
  interests           text[] not null default '{}',
  total_points        integer not null default 0,
  total_distance_km   numeric(10, 2) not null default 0,
  total_activities    integer not null default 0,
  created_at          timestamptz not null default now()
);

alter table public.clubs enable row level security;
drop policy if exists "clubs_select_all" on public.clubs;
create policy "clubs_select_all" on public.clubs for select using (true);

-- 3. club_members table
create table if not exists public.club_members (
  id                uuid primary key default gen_random_uuid(),
  club_id           text not null references public.clubs(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  role              text not null default 'member' check (role in ('admin', 'member')),
  points            integer not null default 0,
  distance_km       numeric(10, 2) not null default 0,
  activities_count  integer not null default 0,
  steps             integer not null default 0,
  joined_at         timestamptz not null default now(),
  unique (club_id, user_id)
);

create index if not exists idx_club_members_club on public.club_members(club_id);
create index if not exists idx_club_members_user on public.club_members(user_id);

alter table public.club_members enable row level security;
drop policy if exists "club_members_select_all" on public.club_members;
create policy "club_members_select_all" on public.club_members for select using (true);
drop policy if exists "club_members_insert_own" on public.club_members;
create policy "club_members_insert_own" on public.club_members for insert with check (auth.uid() = user_id);
drop policy if exists "club_members_update_own" on public.club_members;
create policy "club_members_update_own" on public.club_members for update using (auth.uid() = user_id);
drop policy if exists "club_members_delete_own" on public.club_members;
create policy "club_members_delete_own" on public.club_members for delete using (auth.uid() = user_id);

-- 4. club_posts table (Reddit-like discussion)
create table if not exists public.club_posts (
  id            uuid primary key default gen_random_uuid(),
  club_id       text not null references public.clubs(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  title         text not null,
  content       text not null,
  image_url     text,
  link_url      text,
  upvotes       integer not null default 0,
  downvotes     integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_club_posts_club on public.club_posts(club_id, created_at desc);

alter table public.club_posts enable row level security;
drop policy if exists "club_posts_select_all" on public.club_posts;
create policy "club_posts_select_all" on public.club_posts for select using (true);
drop policy if exists "club_posts_insert_auth" on public.club_posts;
create policy "club_posts_insert_auth" on public.club_posts for insert with check (auth.uid() = user_id);
drop policy if exists "club_posts_update_own" on public.club_posts;
create policy "club_posts_update_own" on public.club_posts for update using (auth.uid() = user_id);
drop policy if exists "club_posts_delete_own" on public.club_posts;
create policy "club_posts_delete_own" on public.club_posts for delete using (auth.uid() = user_id);

-- 5. club_post_votes table (Upvote / Downvote tracking)
create table if not exists public.club_post_votes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.club_posts(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  vote_type   smallint not null check (vote_type in (-1, 1)),
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists idx_club_post_votes_post on public.club_post_votes(post_id);

alter table public.club_post_votes enable row level security;
drop policy if exists "club_post_votes_select_all" on public.club_post_votes;
create policy "club_post_votes_select_all" on public.club_post_votes for select using (true);
drop policy if exists "club_post_votes_insert_own" on public.club_post_votes;
create policy "club_post_votes_insert_own" on public.club_post_votes for insert with check (auth.uid() = user_id);
drop policy if exists "club_post_votes_update_own" on public.club_post_votes;
create policy "club_post_votes_update_own" on public.club_post_votes for update using (auth.uid() = user_id);
drop policy if exists "club_post_votes_delete_own" on public.club_post_votes;
create policy "club_post_votes_delete_own" on public.club_post_votes for delete using (auth.uid() = user_id);

-- 6. club_post_comments table (Reddit-like comments on posts)
create table if not exists public.club_post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.club_posts(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_club_post_comments_post on public.club_post_comments(post_id, created_at asc);

alter table public.club_post_comments enable row level security;
drop policy if exists "club_post_comments_select_all" on public.club_post_comments;
create policy "club_post_comments_select_all" on public.club_post_comments for select using (true);
drop policy if exists "club_post_comments_insert_own" on public.club_post_comments;
create policy "club_post_comments_insert_own" on public.club_post_comments for insert with check (auth.uid() = user_id);
drop policy if exists "club_post_comments_update_own" on public.club_post_comments;
create policy "club_post_comments_update_own" on public.club_post_comments for update using (auth.uid() = user_id);
drop policy if exists "club_post_comments_delete_own" on public.club_post_comments;
create policy "club_post_comments_delete_own" on public.club_post_comments for delete using (auth.uid() = user_id);

-- 7. Seed Initial Campus Clubs with Community Points & Info
insert into public.clubs (
  id, name, category, category_label, institution, description, long_description,
  meeting_location, cover_color, interests, total_points, total_distance_km, total_activities
) values
(
  'club_aec_runners',
  'AEC Campus Runners',
  'running',
  'Running & Strides',
  'Assam Engineering College (AEC)',
  'Daily morning track intervals, campus loops, and weekend 10K road runs.',
  'AEC Campus Runners unites sprint athletes, marathoners, and recreational joggers across all engineering departments. We run morning loops around campus grounds, host hill sprint drills at Jalukbari slopes, and represent AEC at state university athletics meets.',
  'Hostel 4 Ground & Main Campus Pavilion',
  '#18352D',
  array['Morning 5K', 'Track Intervals', 'Half Marathon', 'Tempo Runs'],
  4850,
  1240.5,
  312
),
(
  'club_campus_cyclists',
  'Highway Pedalers Cycling Club',
  'cycling',
  'Cycling & Touring',
  'Assam Engineering College (AEC)',
  'Weekend highway tours, campus time-trials, and endurance gravel rides.',
  'Highway Pedalers is AEC’s premier cycling collective. From early morning Deepor Beel scenic rides to Saraighat bridge sprints, we welcome road bikes, MTBs, and fixies. We advocate for green campus commuting and road safety.',
  'Main College Gate / Mechanical Dept Porch',
  '#162C25',
  array['Highway Tours', 'Endurance 50K', 'Bicycle Commuting', 'Hill Climbs'],
  4210,
  3180.0,
  248
),
(
  'club_power_forge',
  'Iron Forge Gym & Fitness',
  'gym_fitness',
  'Strength & Conditioning',
  'Assam Engineering College (AEC)',
  'Calisthenics, powerlifting, functional HIIT, and hostel courtyard workouts.',
  'Dedicated to building functional strength, athletic conditioning, and clean nutrition habits on campus. We organize quarterly bench/squat/deadlift form clinics, hostel pull-up showdowns, and open HIIT circuits.',
  'College Gymnasium & Hostel 3 Open Courtyard',
  '#25443B',
  array['Powerlifting', 'Calisthenics', 'HIIT', 'Mobility & Hypertrophy'],
  3920,
  450.0,
  410
),
(
  'club_zenith_yoga',
  'Zenith Mindfulness & Yoga',
  'yoga_wellness',
  'Yoga & Wellness',
  'Assam Engineering College (AEC)',
  'Sunrise Hatha flows, breathwork, sports recovery, and stress resilience sessions.',
  'Mindfulness meets physical conditioning. Zenith provides students and faculty a space to decompress, build core balance, and recover from intense exams and physical training through guided yogic postures and pranayama.',
  'Open Air Amphitheatre / Lakeview Lawn',
  '#1D332B',
  array['Hatha Yoga', 'Pranayama', 'Mobility Recovery', 'Mental Wellness'],
  2840,
  180.0,
  195
),
(
  'club_shuttle_smash',
  'Shuttle Smash Badminton Guild',
  'sports',
  'Badminton & Racket Sports',
  'Assam Engineering College (AEC)',
  'Competitive singles/doubles rallies, ladder matches, and weekend tournaments.',
  'AEC Badminton Guild runs regular weekly court sessions, internal ladder rankings, and collegiate championship preparation on wooden indoor courts.',
  'Indoor Sports Hall Court 1 & 2',
  '#1F3A30',
  array['Singles Ladder', 'Doubles Tactics', 'Footwork Drills', 'Tournaments'],
  3360,
  210.0,
  275
),
(
  'club_trail_blazers',
  'Brahmaputra Trail Hikers',
  'adventure',
  'Adventure & Trekking',
  'Assam Engineering College (AEC)',
  'Weekend hill ridge treks, nature runs, and eco-conservation trail hikes.',
  'Explore the breathtaking hills, riverfronts, and reserved forest trails surrounding our campus. We organize monthly group hikes, leave-no-trace campus cleanup marches, and outdoor orientation for freshers.',
  'Nilachal Foothills & Campus Lake Pavilion',
  '#142821',
  array['Hill Treks', 'Trail Running', 'Eco Cleanup', 'Outdoor Navigation'],
  3150,
  890.0,
  140
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  description = excluded.description,
  long_description = excluded.long_description,
  meeting_location = excluded.meeting_location,
  cover_color = excluded.cover_color,
  interests = excluded.interests,
  total_points = excluded.total_points,
  total_distance_km = excluded.total_distance_km,
  total_activities = excluded.total_activities;

-- 8. Link existing challenges to clubs
update public.challenges set club_id = 'club_aec_runners' where id = 'ch_featured_01';
update public.challenges set club_id = 'club_aec_runners' where id = 'ch_step_hunter';
update public.challenges set club_id = 'club_campus_cyclists' where id = 'ch_cycling_100k';
update public.challenges set club_id = 'club_trail_blazers' where id = 'ch_marathon_prep';
update public.challenges set club_id = 'club_aec_runners' where id = 'ch_weekend_10k';


-- ════════════════════════════════════════════════════════════════
-- 004_social_profile_schema.sql
-- ════════════════════════════════════════════════════════════════

-- ================================================================
--  MUVIBE — Social Connections & Public Profiles Migration
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ================================================================

-- 1. Allow authenticated users to view other users' public profile info & activities
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_select_all" on public.users;
create policy "users_select_all" on public.users
  for select using (true);

drop policy if exists "activities_select_own" on public.activities;
drop policy if exists "activities_select_all" on public.activities;
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

drop policy if exists "user_connections_select_all" on public.user_connections;
create policy "user_connections_select_all" on public.user_connections
  for select using (true);

drop policy if exists "user_connections_insert_own" on public.user_connections;
create policy "user_connections_insert_own" on public.user_connections
  for insert with check (auth.uid() = requester_id);

drop policy if exists "user_connections_update_target_or_requester" on public.user_connections;
create policy "user_connections_update_target_or_requester" on public.user_connections
  for update using (auth.uid() = target_id or auth.uid() = requester_id);

drop policy if exists "user_connections_delete_target_or_requester" on public.user_connections;
create policy "user_connections_delete_target_or_requester" on public.user_connections
  for delete using (auth.uid() = requester_id or auth.uid() = target_id);


-- ════════════════════════════════════════════════════════════════
-- 005_nearby_presence.sql
-- ════════════════════════════════════════════════════════════════

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
drop policy if exists "presence_select_visible" on public.user_presence;
create policy "presence_select_visible" on public.user_presence
  for select using (visible = true or auth.uid() = user_id);

drop policy if exists "presence_insert_own" on public.user_presence;
create policy "presence_insert_own" on public.user_presence
  for insert with check (auth.uid() = user_id);

drop policy if exists "presence_update_own" on public.user_presence;
create policy "presence_update_own" on public.user_presence
  for update using (auth.uid() = user_id);

drop policy if exists "presence_delete_own" on public.user_presence;
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

drop policy if exists "peer_challenges_select_party" on public.peer_challenges;
create policy "peer_challenges_select_party" on public.peer_challenges
  for select using (auth.uid() = challenger_id or auth.uid() = challengee_id);

drop policy if exists "peer_challenges_insert_as_challenger" on public.peer_challenges;
create policy "peer_challenges_insert_as_challenger" on public.peer_challenges
  for insert with check (auth.uid() = challenger_id);

-- Either side may update: the challengee to accept or decline, the
-- challenger to cancel. Status transitions are enforced in the app.
drop policy if exists "peer_challenges_update_party" on public.peer_challenges;
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


-- ════════════════════════════════════════════════════════════════
-- 006_leaderboards_guilds_squads.sql
-- ════════════════════════════════════════════════════════════════

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

drop policy if exists "squads_select_member" on public.squads;
create policy "squads_select_member" on public.squads
  for select using (public.is_squad_member(id) or created_by = auth.uid());
drop policy if exists "squads_insert_own" on public.squads;
create policy "squads_insert_own" on public.squads
  for insert with check (created_by = auth.uid());
drop policy if exists "squads_delete_creator" on public.squads;
create policy "squads_delete_creator" on public.squads
  for delete using (created_by = auth.uid());

drop policy if exists "squad_members_select_member" on public.squad_members;
create policy "squad_members_select_member" on public.squad_members
  for select using (public.is_squad_member(squad_id));
-- You may add yourself, or the creator may add others.
drop policy if exists "squad_members_insert" on public.squad_members;
create policy "squad_members_insert" on public.squad_members
  for insert with check (
    user_id = auth.uid()
    or exists (select 1 from public.squads s where s.id = squad_id and s.created_by = auth.uid())
  );
drop policy if exists "squad_members_delete_self" on public.squad_members;
create policy "squad_members_delete_self" on public.squad_members
  for delete using (user_id = auth.uid());

drop policy if exists "squad_quests_select_member" on public.squad_quests;
create policy "squad_quests_select_member" on public.squad_quests
  for select using (public.is_squad_member(squad_id));
drop policy if exists "squad_quests_insert_member" on public.squad_quests;
create policy "squad_quests_insert_member" on public.squad_quests
  for insert with check (public.is_squad_member(squad_id));
drop policy if exists "squad_quests_update_member" on public.squad_quests;
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
