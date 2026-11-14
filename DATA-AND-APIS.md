# MUVIBE: data model and APIs

Prep notes for questions about how the app stores and moves data.
Every number here was read out of the repo, not remembered.

---

## 1. The one-line answer

MUVIBE is a React Native (Expo) client talking to **Supabase**, which
is managed **PostgreSQL** plus auth and realtime on top. There is no
backend of our own except one small **Socket.IO** server that runs the
Blitz Battle private rooms. Sensor readings come from the phone, map
tiles from OpenStreetMap.

---

## 2. Database schema

PostgreSQL, 15 tables, built by 6 migrations in `supabase/migrations/`.
`supabase/SETUP.sql` is all 6 flattened into one idempotent file, 1076
lines, so a fresh project can be set up in a single paste.

### Identity and activity

| Table        | Holds                                  | Key columns |
| ------------ | -------------------------------------- | ----------- |
| `users`      | Profile per account, 12 cols           | `id` (FK to `auth.users`), `username`, `college`, `department`, `onboarding_done` |
| `activities` | One logged walk/run/cycle, 15 cols     | `user_id`, `type`, `duration_seconds`, `distance_km`, `steps`, `calories`, `tracking_mode` |

`users.id` is a foreign key to Supabase's own `auth.users`, so the
profile row and the login are the same identity. `onboarding_done` is
what the app reads to decide between Home and the setup flow.

### Challenges

| Table                    | Holds                                   |
| ------------------------ | --------------------------------------- |
| `challenges`             | Challenge definitions, 18 cols: goal, measurement, reward points, cover art |
| `challenge_participants` | Join row per user per challenge, with `status` and `progress` |
| `peer_challenges`        | One-against-one challenge between two students, with `status` and a date window |

### Community

| Table                | Holds                                             |
| -------------------- | ------------------------------------------------- |
| `clubs`              | Campus clubs, with denormalised `total_points`, `total_distance_km`, `total_activities` |
| `club_members`       | Membership plus that member's contribution        |
| `club_posts`         | Discussion posts, with `upvotes` / `downvotes`    |
| `club_post_votes`    | One row per user per post, so a vote cannot be cast twice |
| `club_post_comments` | Replies                                           |

### Social and location

| Table              | Holds                                                      |
| ------------------ | ---------------------------------------------------------- |
| `user_connections` | Follow requests: `requester_id`, `target_id`, `status`      |
| `user_presence`    | Opt-in location for Near Me: lat/long, `visible`, `status_text` |

### Squads and guilds

| Table           | Holds                                      |
| --------------- | ------------------------------------------ |
| `squads`        | A named group                              |
| `squad_members` | Membership                                 |
| `squad_quests`  | A shared goal with a measurement and window |

### Design decisions worth defending

- **`challenges.id` and `clubs.id` are `text`, not `uuid`.** They are
  seeded, human-readable content, so a readable id is easier to work
  with than a generated one. Everything user-generated uses `uuid`.
- **Club totals are denormalised.** `clubs.total_points` could be
  summed from `club_members` on every read. It is stored instead
  because the leaderboard is read constantly and written rarely.
- **`user_presence` is separate from `users`.** Location is opt-in and
  changes often; keeping it out of the profile row means a different
  RLS policy and no churn on the main table.

---

## 3. How the database actually works

### Row Level Security is the authorisation layer

**RLS is enabled on all 15 tables**, with **51 policies**. This is the
important architectural point: the app has no server of its own in
front of Postgres, so the database itself enforces who may read and
write what.

The client holds only the **anon key**, which is publishable. It grants
nothing on its own. Every query runs as the logged-in user, and each
policy is written against `auth.uid()`. So "can I edit this profile?"
is answered by Postgres, not by app code that could be bypassed by
calling the REST endpoint directly.

The `service_role` key, which does bypass RLS, is **not in this repo
and not in the app**. That is deliberate: anything shipped to a phone
can be extracted from it.

### Nine functions, eight of them SECURITY DEFINER

| Function                   | Does |
| -------------------------- | ---- |
| `individual_leaderboard`   | Ranks users by points in a time window |
| `guild_leaderboard`        | Ranks colleges or departments |
| `squad_leaderboard`        | Ranks squads |
| `user_points_since`        | Points for one user since a timestamp |
| `peer_challenge_progress`  | Both sides' progress in a head-to-head |
| `squad_quest_progress`     | Combined progress toward a squad goal |
| `is_squad_member`          | Membership test used inside policies |
| `handle_updated_at`        | Trigger that stamps `updated_at` |

These exist because a leaderboard has to read across **all** users,
which RLS correctly forbids. `SECURITY DEFINER` lets the function run
with the definer's rights and return only the aggregate, so you learn
rank and totals without being able to read anyone's rows. The app calls
them with `supabase.rpc(...)`, never raw SQL.

### Offline behaviour

Online is the source of truth. The app keeps a **read-only JSON
snapshot** of the last successful fetch (`muvibe-cache.json` on device,
`localStorage` on web) so the UI can render while a request is in
flight or the network is down. Nothing is ever written back from the
snapshot, which avoids the merge-conflict problem entirely.

---

## 4. APIs used

### Supabase, three separate APIs

| API | Used for | In code |
| --- | -------- | ------- |
| **Auth** | Email sign-up/in, Google OAuth, anonymous guest sessions | `signInWithPassword`, `signUp`, `signInWithOAuth`, `signInAnonymously`, `onAuthStateChange` |
| **PostgREST** | All table reads and writes, auto-generated from the schema | `supabase.from(...)`, 16 call sites |
| **RPC** | The three leaderboard/progress functions | `supabase.rpc(...)` |

Guest mode is **anonymous auth**, not a local-only mode. A guest is a
real `auth.users` row with no email, so RLS works identically and the
account can later be upgraded to an email login without migrating data.

### Our own Socket.IO server

`server/index.js`, Express + Socket.IO, for Blitz Battle private rooms.

| Event | Direction |
| ----- | --------- |
| `room:create`, `room:join`, `room:start`, `score:update`, `room:leave` | client to server |
| `room:state`, `room:started`, `score:state` | server to client |

Rooms live in memory, not Postgres: a bout lasts 60 to 90 seconds, so
there is nothing worth persisting. The server is the authority on who
is in a room, who hosts, and the `startedAt` timestamp both phones
count down from.

### Device APIs

| API | Used for |
| --- | -------- |
| `expo-sensors` Pedometer | Real step counting |
| `expo-sensors` Accelerometer | Fallback step estimate where the pedometer is unavailable, such as Expo Go |
| `expo-location` | GPS distance, summed with the haversine formula |
| `expo-media-library`, `expo-sharing`, `react-native-view-shot` | Instagram story sharing |

### Third-party

| Service | Used for |
| ------- | -------- |
| **OpenStreetMap** tiles via **Leaflet** in a WebView | The live route map |
| **Instagram** `instagram-stories://` deep link | Sharing an activity card |
| **Google OAuth**, brokered by Supabase | Social sign-in |

OpenStreetMap was chosen over Google Maps because it needs no API key
and no billing account, which matters for an app that has to run on a
teammate's machine from a clean checkout.

---

## 5. Likely questions

**Where is the business logic, if there is no backend?**
Three places. Validation and authorisation are RLS policies in
Postgres. Aggregation across users is in `SECURITY DEFINER` functions.
Scoring (points per activity, Elo, level curve) is in the client, in
`services/points-engine.ts`, `blitz-elo.ts` and `gamification.ts`.

**Is the anon key in the app a security problem?**
No. It is the publishable client key and is meant to ship. It carries
no privileges of its own; RLS decides what the logged-in user can
touch. The key that would be a problem, `service_role`, is not in the
app or the repo.

**Why Socket.IO when Supabase already has Realtime?**
Supabase Realtime did the job and needed no server. Socket.IO was added
because the match flow wanted an authoritative referee: one place that
decides the room's membership, the host, and the single start timestamp
both phones count from. The cost is that it now needs hosting.

**What happens if two people log the same activity at once?**
Nothing conflicts. Activities are append-only rows keyed by `user_id`.
Club totals are updated per member row, so two members writing at once
touch different rows.

**Could someone cheat by posting a fake activity?**
Yes, today. The client sends the numbers and RLS only checks that you
are writing your own row. Server-side plausibility checks, such as
rejecting a 40 km/h "walk", would be the next step.

---

## 6. Not yet applied

Migrations **005** (`nearby_presence`) and **006**
(`leaderboards_guilds_squads`) still need running in the Supabase SQL
editor, and **Anonymous sign-ins** must be enabled under
Authentication, Providers for guest mode to work.

---

## 7. Capacity: what happens at 1000 users

Measured, not estimated. Load tests were run against the real socket
server on a laptop; Supabase limits are from supabase.com/pricing.

### The backend, in one picture

```
 Phone (Expo/React Native)
   |
   |-- HTTPS --> Supabase PostgREST      table reads and writes
   |-- HTTPS --> Supabase Auth           sign-in, sessions
   |-- WSS   --> Supabase Realtime       club/member/post changes
   |-- WS    --> our Socket.IO server    Blitz private rooms
   |-- HTTPS --> OpenStreetMap           map tiles
```

There is no API server of our own in front of Postgres. The only
service we run is the Socket.IO match server.

### Socket.IO server: comfortable

| Clients | Connected | Rooms | Connect p95 | Fan-out p95 | Leaked rooms |
| ------- | --------- | ----- | ----------- | ----------- | ------------ |
| 200     | 200/200   | 100   | 567 ms      | 1 ms        | 0 |
| 1000    | 1000/1000 | 500   | 601 ms      | 1 ms        | 0 |
| 3000    | 3000/3000 | 1500  | 3167 ms     | 1 ms        | 0 |

18,000 score updates at 3000 clients were all delivered, and every
room was cleaned up on disconnect. Memory stayed under 300 MB.

So 1000 concurrent players is roughly a third of what one laptop
process handles. **This is not the bottleneck.** Caveats worth stating
honestly: this was loopback, so it excludes real network latency, TLS
and mobile radios. It proves the server is not the limit, not that the
experience is identical in the field.

The server's real ceiling is architectural, not CPU: rooms live in
memory in **one process**, with no Redis adapter. You cannot run two
instances behind a load balancer, because two players in the same room
could land on different instances and never see each other. Scaling
past one box means adding `@socket.io/redis-adapter`.

### Postgres: fine at this size

The heaviest query is `user_points_since`, which every leaderboard
calls. It scans `activities` filtered on `started_at`.

The index on that table is `(user_id, started_at desc)`. Because
`user_id` leads, **this query cannot use it** and does a sequential
scan. At 1000 users logging ~3 activities a day for a month that is
about 90,000 rows, which Postgres scans in milliseconds, so it is not
urgent. It becomes one as the table grows. The fix is one line:

```sql
create index if not exists activities_started_at
  on public.activities (started_at desc);
```

### Realtime fan-out: this is what breaks first

Every signed-in user opens **one Realtime channel** subscribing to
`clubs`, `club_members` and `club_posts` with `event: '*'`
(`community-service.ts`). Any event calls `loadClubs()`, which refetches
the club list.

Two consequences at 1000 concurrent users:

**1. Connection cap.** 1000 users means 1000 concurrent Realtime
connections. Free allows **200**. Pro allows **500**, then $10 per
extra 1,000. So 1000 users requires Pro, and is not possible on Free.

**2. Message quota.** `club_members` changes every time anyone logs an
activity, and the event goes to *every* subscriber:

```
1 activity logged  ->  1 club_members write  ->  1000 messages out
                                             ->  1000 client refetches
```

At 1000 users logging 3 activities a day, that is 3,000 writes and
**3 million Realtime messages a day**. Free includes 2 million a
**month**, Pro 5 million. The free quota is gone in under a day.

It also hurts the app: one person finishing a run makes a thousand
phones re-query the club list at once.

### What to change before a real launch

In rough order of payoff:

1. **Stop subscribing to `club_members`.** It is the table that changes
   on every activity, and the club list rarely needs to react to it.
   Refresh on screen focus instead, which the app already does.
2. **Debounce `loadClubs`.** A burst of events should collapse into one
   refetch, not one per event.
3. **Scope the subscription** to the clubs the user actually belongs
   to, with a Realtime filter, instead of the whole table.
4. **Add the `started_at` index** above.
5. **Host the match server**, and add the Redis adapter before running
   more than one instance of it.

### Honest summary

Fixing items 1 to 3 is a few hours of work and removes the only hard
blocker. Until then, 1000 concurrent users is not supported, and the
reason is the Realtime subscription, not the database or the socket
server. Both of those have ample headroom.
