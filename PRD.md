# MUVIBE / FitConnect: Product Requirements Document

**Problem statement:** PS08, FitConnect, Student Fitness and Activity Engagement Platform
**Theme:** HealthTech / Fitness / Web and Mobile Development
**Repository:** https://github.com/Biki-dev/MUVIBE (branch `main`, 9 commits, latest `fac445d profile done`)
**Document date:** 13 November 2026
**Written after:** running the app locally and walking through every screen.

---

## How to run it yourself

The app is already installed and running in this workspace. To start it again later:

```bash
cd "C:\claude code" && node muvibe-start.js
```

Then open http://localhost:8081. Two local changes were made purely to get the web preview working, neither is pushed:

- `app.json`: web `output` changed from `static` to `single`. With `static`, Expo does server rendering in dev, which crashed the bundler on this 8 GB machine (exit 134, out of memory). `single` makes it a normal client-side app. Revert before shipping a web build if you want server rendering.
- `muvibe-start.js` at the workspace root raises the Node heap to 4 GB.

Web is the preview surface only. The real target is Android and iOS.

---

## 1. What the app looks like, screen by screen

This section is what I saw running the app, not what the code claims.

### 1.1 Auth, `/auth`

Dark forest green hero card with a pulse icon, "Campus Fitness Network" and "1,200+ Active Students" pills, the headline "Your fitness journey starts here", then Continue with Google and Continue with Email. Clean, confident, consistent spacing.

**Branding note:** this screen says **FitConnect**. The home screen says **MUVIBE**. Two names in one app.

### 1.2 Onboarding, 6 steps

A progress bar reading "STEP n OF 6" runs across all of them.

1. **Basic Profile.** Full name, username, college picker, department picker, academic year chips. Tapping Continue with Google pre-fills "Arup Sarma / @arups" instantly, because that identity is hardcoded.
2. **What do you enjoy doing?** A 12-tile grid (walking, running, cycling, gym, jump rope, sports, swimming, hiking, yoga, dancing, stretching, other). Selection works, tiles turn green with a check, a "2 selected" counter appears. This is the nicest interaction in the app.
3. **Discover what is happening around you.** Location permission screen with a radar graphic, three reassurance rows including "Zero Background Tracking". Enable location, or choose college manually.
4. **Select your college clubs.** Search field, category filter chips, club cards with member counts and meeting schedules.
5. **Profile Customization.** Avatar, a read-back card of name, username, college, department, and a short bio field with a 150-character counter.
6. **Stay in the loop.** Notification opt-in with four benefit rows, then a "You're all set" screen showing a **FitConnect Pass** card with a "Verified Student" badge and the activities picked in step 2 carried through correctly.

The onboarding is genuinely good. It is the strongest part of the build.

### 1.3 Tab 1, Home

App title, a weekly calendar strip with completed days filled green and today ringed, then **Today's Activity** (steps, calories, distance, active time), **Community Highlights**, **Quick Actions** (Log Activity, Start Challenge, Join Community), and **Active Events**.

**Visible defect:** the Community Highlights row reads literally **"User X, 1,200 steps"** and **"User Y, 12 kcal"**. Placeholder strings are shipping in the UI.

### 1.4 Tab 2, Activity

Overview with a Day / Week / Month toggle, four stat cards (Total Distance 7.0 km, Calories Burned 425 kcal, Total Steps 7,950, Active Time 1h 5m), an **Activity Breakdown** panel splitting running / walking / cycling, and **Your Streak** with current, best and month counts plus a week consistency row of ticks.

**This is the one screen driven by real data.** Those numbers are computed from the stored activity records by `src/services/activity-stats.ts`. Change the data and this screen changes.

### 1.5 Activity tracking, `/activity/running`

Header pill reads **"GPS & Cadence Tracking, Pace & distance estimation active (~0.95m stride)"**. A large primary metric, then duration, calories, steps and pace cards, with Start, then Pause and Stop.

**This is the most serious problem in the build.** I started a running session in a desktop browser, sitting still, with no GPS and no pedometer. After 2 seconds it showed **4 steps**. The numbers come from `setInterval` plus `Math.random()` at `src/app/activity/[type].tsx:194-230`. The app has no sensor code at all: `expo-sensors` and `expo-location` are not installed. The UI is asserting a capability that does not exist.

### 1.6 Tab 3, Challenges

Discover / My Challenges toggle with a count badge. A dark featured card, "7 DAY ACTIVE CAMPUS", goal 150 active minutes, reward 50 points, ends Sunday, 540 participating, with a Joined state. Below it, category chips (For You, Individual, Squad, Campus), difficulty chips, and a Discover Challenges list.

The card design is strong. The data behind it is a static array, and progress is never computed from anything you do.

### 1.7 Tab 4, Community

Three sections: Clubs, Leaderboard, Events.

**Clubs** shows My Clubs (AEC Runners Club 120 members, Campus Fitness Club 210 members, both marked Joined) and Discover Clubs with search and filters.

**Defect found live:** I skipped club selection during onboarding and joined nothing. The app still shows two clubs as joined. "My Clubs" is fixture data, not your data.

**Leaderboard** has Individual / Department / Squad tabs, Weekly / Monthly / All Time filters, a podium with medals, a dark "Your Ranking" card, and a ranked list.

**Defect found live, and this one would be noticed in a demo:** I signed up as **Arup Sarma, @arups**. The leaderboard shows my ranking as **@arun_aec** and the pinned row reads **"Arun Das (You)"**. A different fictional student is labelled as me, because the entire board is a hardcoded array in `src/constants/community-data.ts:286-330`.

### 1.8 Tab 5, Profile

Profile card with avatar, name, handle, college, a department and year chip, bio and Edit Profile. Then **Fitness Overview** (Active Minutes 2,615, Total Distance 100.7 km, Total Steps 126,550, Activities 41), **Your Consistency**, achievements, my clubs, my challenges.

**Defect found live:** the Activity tab reports 7.0 km and 7,950 steps from 9 stored records. Profile reports 100.7 km, 126,550 steps and 41 activities for the same user. The reason is in `src/app/(tabs)/profile.tsx:66`: the real total has a hardcoded number added to it (`Math.round(totalDurationSec / 60) + 2150`). Two screens show contradictory totals for the same account.

---

## 2. What is in the repo, technically

### 2.1 Stack

| Item | Value |
|---|---|
| Framework | Expo SDK 58, React Native 0.88.1, React 19.3 |
| Language | TypeScript 6.0 strict, path alias `@/*` to `src/*` |
| Routing | Expo Router (file based), typed routes, React Compiler on |
| State | Three React contexts, no state library |
| Persistence | AsyncStorage, device local only |
| Backend | None. No API client, no Supabase, no Firebase, no auth SDK |
| Targets | iOS, Android, web. Android package `com.muvibe.app` |
| Size | ~20,500 lines across 118 source files |
| Tests / CI / lint config | None |

### 2.2 Code that genuinely works

- `src/services/activity-stats.ts`, 230 lines. Day / week / month filtering, aggregates, streak computation, correct local-date handling. Real, correct code.
- `src/services/tracking-engine.ts`, 119 lines. Elapsed time with pause support, stride to distance, pace, speed, calorie estimation for 9 activity types. Pure functions, easy to test.
- `src/services/activity-storage.ts`, 231 lines. AsyncStorage CRUD, seeded with 9 sample activities.
- `src/context/auth-context.tsx`, 301 lines. Session persistence and an onboarding resume state machine that correctly drops you back where you left off.

### 2.3 What is simulated or hardcoded

| Area | Reality | Evidence |
|---|---|---|
| Sensors | `setInterval` plus `Math.random()`. No `expo-sensors`, no `expo-location`. | 4 steps in 2 seconds on a desktop browser, `[type].tsx:194-230` |
| Auth | Any non-empty email and password signs you in. Google returns a fixed person. No token, no server. | `auth-context.tsx:131-180` |
| Challenges | Static array in memory. Join flips a flag. Progress never derived from activity, lost on restart. | `challenge-context.tsx` |
| Clubs and events | Static arrays in memory. | Two clubs "Joined" after I joined none |
| Leaderboards | Fully hardcoded ranks with fictional students. | My row showed a different name and handle |
| Badges and points | Hardcoded `unlocked` flags and literal unlock dates. No award engine. | `profile-data.ts` |
| Profile totals | Real totals plus a hardcoded offset. | `profile.tsx:66`, `+ 2150` |
| Multi-user | Does not exist. One device, one local user. | |

### 2.4 Against PS08

| PS08 expected feature | Status |
|---|---|
| Register students, maintain fitness profiles | UI complete, auth is fake, profile is device local |
| Record activities manually or via device integration | Manual logging works and persists. Device integration is simulated |
| Individual and group challenges | UI complete. No progress engine, no persistence, no real groups |
| Leaderboards from points and completed challenges | UI complete and attractive. Entirely hardcoded, shows the wrong user as you |
| Daily and weekly activity visualisation | Working from real data. Strongest existing feature |
| Badges and points for milestones | UI complete. No award logic |
| Discover and join campus events | UI complete. In-memory only |
| Functional app demonstrating the above | A convincing prototype shell, not yet a functional system |

**Summary: about 80 percent of the UI and 20 percent of the system.** The design work is largely done and it is good. The remaining work is data layer, scoring, and sensors.

---

## 3. Decisions for Phase 2

### 3.1 Add a real backend

Leaderboards, squads, clubs and events are meaningless with one local user, and the PS08 demo scenario requires a leaderboard position to update. **Recommendation: Supabase.** Postgres, row level security, auth with email and Google OAuth, realtime, free tier, and it is named in the PS08 suggested technology list. Firebase is fine if the team already knows it. Keep AsyncStorage as an offline write queue so the app still works without network during a demo.

### 3.2 Real sensors, and honest labels

Two tracks, both needed:

1. **Real sensors on native.** `expo-sensors` Pedometer for steps, `expo-location` for GPS distance on running, cycling and hiking. Both need a development build, which `AGENTS.md` already anticipates.
2. **Manual entry as a first-class path.** PS08 says "manually or through an optional device integration". The web build and most demo setups have no sensors, so manual logging must be a real feature, not a fallback.

Then fix the copy. A judge who notices "Pedometer sensor estimation active" while the phone is flat on a table will discount the whole build.

### 3.3 One points engine as the single source of truth

Challenges, badges, leaderboards, squads and department rankings must all derive from one function over the activity table. Today they are five unrelated fixture files, which is exactly why Activity says 7 km and Profile says 100 km.

### 3.4 Non-goals

No medical or clinical assessment (PS08 excludes it). No wearable SDKs beyond Health Connect or HealthKit if time allows. No social feed or chat. No admin console, seed via SQL.

---

## 4. Target architecture

```
Expo app (iOS, Android, Web)
  screens  -> unchanged
  contexts -> auth, activity, challenge, community (now server backed)
  services/
    activity-storage.ts   -> local cache + offline write queue
    activity-stats.ts     -> unchanged, pure
    tracking-engine.ts    -> unchanged, pure
    sensors.ts            -> NEW, pedometer + GPS with graceful fallback
    points-engine.ts      -> NEW, activity to points, challenge progress, badges
    api/                  -> NEW, typed Supabase client per domain
Supabase
  auth (email + Google)
  postgres tables with RLS
  function: recalc_leaderboard(period)
  realtime channel on leaderboard_entries
```

### 4.1 Data model

```sql
profiles          (id uuid pk -> auth.users, full_name, username unique, college,
                   department, academic_year, avatar_url, bio, total_points int default 0,
                   created_at)
activities        (id uuid pk, user_id fk, type, started_at, ended_at, duration_seconds,
                   distance_km, steps, jump_count, calories, average_speed, average_pace,
                   tracking_mode, notes, points_awarded int, created_at)
challenges        (id uuid pk, title, category, difficulty, description, goal numeric,
                   goal_unit, measurement, duration_days, reward_points, start_date,
                   end_date, is_featured, rules jsonb, eligibility)
challenge_members (challenge_id fk, user_id fk, squad_id nullable, progress numeric,
                   status, joined_at, completed_at, pk(challenge_id, user_id))
squads            (id uuid pk, challenge_id fk, name, created_by)
badges            (id text pk, title, description, requirement_type, requirement_value,
                   icon, color)
user_badges       (user_id fk, badge_id fk, unlocked_at, pk(user_id, badge_id))
clubs             (id uuid pk, name, category, description, cover, college)
club_members      (club_id fk, user_id fk, joined_at, pk(club_id, user_id))
events            (id uuid pk, club_id fk nullable, title, description, starts_at,
                   ends_at, venue, capacity, college)
event_rsvps       (event_id fk, user_id fk, status, pk(event_id, user_id))
leaderboard_entries (user_id fk, period, points, rank, metric_label, computed_at,
                   pk(user_id, period))
```

RLS: a student reads profiles in their own college, and writes only their own rows in `activities`, `challenge_members`, `club_members`, `event_rsvps`.

### 4.2 Points rules, first version

| Source | Points |
|---|---|
| Any logged activity, 5 minutes or longer | 10 base |
| Per kilometre of distance | 5 |
| Per 1,000 steps | 3 |
| Per 100 calories | 2 |
| Streak day 3, 7, 14, 30 | 25, 50, 100, 250 bonus |
| Challenge completed | `challenges.reward_points` |
| Event attended | 50 |
| Anti-abuse cap | 300 points per day per user |

Computed server side in a Postgres function on activity insert, so a modified client cannot inflate a rank.

---

## 5. Build order

Each milestone is independently demonstrable.

### M0: Visible defect sweep (half a day, do this first)

Cheap fixes that stop the prototype undermining itself in front of anyone.

- Pick one name. FitConnect on auth versus MUVIBE on home.
- Replace "User X" and "User Y" in Community Highlights with either real recent activity or nothing.
- Remove the `+ 2150` style offsets in `src/app/(tabs)/profile.tsx:47,66` so Profile and Activity agree.
- Rewrite the leaderboard fixture so the "you" row uses the signed-in profile rather than "Arun Das / @arun_aec".
- Soften sensor copy until M2 lands, for example "Session timer running" instead of "GPS & Cadence Tracking".

### M1: Real authentication (2 to 3 days)

- Supabase project, `profiles` table, RLS.
- Replace `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle` with real calls. Keep the context interface identical so no screen changes.
- Real validation and error states in the existing auth UI.
- Onboarding writes to `profiles`.
- Session restore from the Supabase session, AsyncStorage keeps a cached copy for offline launch.

**Done when:** two students sign up on two phones, each sees their own profile, sign out and back in restores the right account.

### M2: Server activities plus real sensors (3 to 4 days)

- `activities` table, insert on save, read on load, cache on top.
- `src/services/sensors.ts` using `expo-sensors` and `expo-location`, with permission handling and a clean fallback to timer plus manual entry.
- Delete the `Math.random()` block at `src/app/activity/[type].tsx:194-230`.
- Manual entry form: type, duration, distance or steps, notes.
- Correct the `sensorNote` and `trackingModeLabel` copy on all 9 activity metas.
- Needs a development build (`npx expo run:android`). Start that build on day one of this milestone, before writing sensor code.

**Done when:** walking with the phone increments real steps, the record reaches the server, and Activity and Profile both reflect it.

### M3: Points and badges engine (2 days)

- `src/services/points-engine.ts` plus the mirroring Postgres function.
- `badges` and `user_badges` seeded from the existing 8 badges with real rules.
- On save: award points, re-evaluate badges, show an unlock toast.
- Achievements screen reads real state.

**Done when:** logging a first activity unlocks "First Move" live and the progress bars move with real numbers.

### M4: Live challenges (3 days)

- `challenges`, `challenge_members`, `squads` seeded from `challenge-data.ts`.
- Join and leave write to the server.
- Progress recomputed from the activities of the user inside the challenge window, matched on `measurement`.
- Squad challenges sum real member contributions.
- Completion detection, reward points, status transition.

**Done when:** joining a 10,000 step challenge and logging a walk moves the bar by the right amount, and a second account in the same squad changes the team total.

### M5: Live leaderboards, clubs and events (3 days)

- `leaderboard_entries` plus `recalc_leaderboard(period)`, refreshed on insert and on a schedule.
- Individual, department and squad boards read from the server. Delete the hardcoded tables.
- Realtime subscription so ranks move without a refresh.
- `clubs`, `club_members`, `events`, `event_rsvps` seeded. Join and RSVP write to the server.

**Done when:** two accounts log different distances, the order between them is correct, and the pinned row is actually you.

### M6: Hardening and demo polish (2 days)

- Loading, empty and error states on every server-backed screen.
- Offline queue syncs on reconnect.
- `npx tsc --noEmit` and `npx expo lint` clean, add an eslint config.
- Seed script creating 10 demo students with plausible history so leaderboards are populated on demo day.
- Rewrite `README.md`, which is still the untouched Expo template.
- Build the demo artefact: `eas build --profile preview` for an APK, web as fallback.

**Done when:** a fresh clone, install, env vars and `npx expo start` works, and the PS08 demo scenario passes on a real device.

**Total: about 15 to 17 working days solo, 8 to 10 with two people (one on backend and data, one on sensors and UI states).**

---

## 6. Demo scenario mapped to work

PS08 requires: *"A student logs a running activity, earns points, joins a campus challenge and sees their progress and leaderboard position update."*

| Step | Needs | Milestone |
|---|---|---|
| Student signs in | Real auth | M1 |
| Logs a running activity | GPS or manual entry, server write | M2 |
| Earns points | Points engine | M3 |
| Joins a campus challenge | Server-backed join | M4 |
| Sees progress update | Progress from activities | M4 |
| Sees leaderboard position update | Live leaderboard | M5 |

Every milestone is on the critical path. None can be cut.

---

## 7. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Development build needed for sensors, first build slow or failing | Blocks M2 | Start the build on day one of M2. Keep manual entry as the demo path |
| Pedometer unavailable on the demo device | Demo breaks | Manual entry as a first-class path plus a seeded account |
| Empty leaderboards look dead | Weak demo | Seed script with 10 demo students, M6 |
| Simulated-sensor copy left in place | Credibility loss | M0 softens it, M2 fixes it properly |
| Web build has no sensors at all | Confuses reviewers | Web shows manual entry only, with clear messaging |
| Scope creep into social or wearable features | Misses the core demo | Non-goals in 3.4 are fixed |

---

## 8. Immediate next actions

1. Run M0 today. It is half a day and it removes every contradiction a reviewer can see without reading code.
2. Decide Supabase versus Firebase. Default: Supabase.
3. Create the project and apply the schema in 4.1.
4. Start an Android development build so sensors are unblocked when M2 begins.
5. Begin M1, replacing the three mock functions in `src/context/auth-context.tsx` while keeping the context interface intact.
6. Add an eslint config and a `npx tsc --noEmit` pre-push check now, while the codebase is small.

---

## Appendix A: files to change first

| File | Change |
|---|---|
| `src/app/(tabs)/profile.tsx:47,66` | Remove the hardcoded offsets so Profile matches Activity |
| `src/components/home/community-highlights.tsx` | Remove the "User X" and "User Y" placeholders |
| `src/constants/community-data.ts:286-330` | Delete the hardcoded leaderboards, move the shape to a seed script |
| `src/context/auth-context.tsx:131-180` | Replace the three mock auth functions with Supabase calls |
| `src/app/activity/[type].tsx:194-230` | Delete the `Math.random()` simulation, call `services/sensors.ts` |
| `src/app/activity/[type].tsx:45-160` | Correct `sensorNote` and `trackingModeLabel` on all 9 activity metas |
| `src/services/activity-storage.ts` | Keep as a cache layer, drop the seeded array, add an offline queue |
| `src/context/challenge-context.tsx` | Server backed, progress derived from activities |
| `src/context/community-context.tsx` | Server backed clubs and events |
| `src/constants/profile-data.ts` | Convert to badge definitions with real rules, unlock state on the server |
| `README.md` | Replace the Expo template with real documentation |

## Appendix B: new files to create

| File | Purpose |
|---|---|
| `src/services/supabase.ts` | Typed client, session handling |
| `src/services/api/activities.ts` | Activity CRUD against the server |
| `src/services/api/challenges.ts` | Challenge join, leave, progress |
| `src/services/api/community.ts` | Clubs, events, leaderboards |
| `src/services/sensors.ts` | Pedometer and GPS with fallback |
| `src/services/points-engine.ts` | Points, challenge progress, badge evaluation |
| `src/types/database.ts` | Generated Supabase types |
| `supabase/schema.sql` | Schema plus RLS policies |
| `supabase/seed.sql` | Demo students, clubs, events, challenges |
| `.github/workflows/ci.yml` | Typecheck and lint on push |
