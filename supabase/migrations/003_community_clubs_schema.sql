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
create policy "club_members_select_all" on public.club_members for select using (true);
create policy "club_members_insert_own" on public.club_members for insert with check (auth.uid() = user_id);
create policy "club_members_update_own" on public.club_members for update using (auth.uid() = user_id);
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
create policy "club_posts_select_all" on public.club_posts for select using (true);
create policy "club_posts_insert_auth" on public.club_posts for insert with check (auth.uid() = user_id);
create policy "club_posts_update_own" on public.club_posts for update using (auth.uid() = user_id);
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
create policy "club_post_votes_select_all" on public.club_post_votes for select using (true);
create policy "club_post_votes_insert_own" on public.club_post_votes for insert with check (auth.uid() = user_id);
create policy "club_post_votes_update_own" on public.club_post_votes for update using (auth.uid() = user_id);
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
create policy "club_post_comments_select_all" on public.club_post_comments for select using (true);
create policy "club_post_comments_insert_own" on public.club_post_comments for insert with check (auth.uid() = user_id);
create policy "club_post_comments_update_own" on public.club_post_comments for update using (auth.uid() = user_id);
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
