# Feature list review

Assessment of the nine proposed features against the code as it stands
today (Near Me and the local/cloud split are in; the app has never been
run on a phone yet).

**Verdict in one line:** 1 through 6 and 8 are buildable on what exists,
in roughly that order. 7 and 9 are a different product with a different
risk profile, and 7 is the one that can sink the timeline.

---

## What the codebase already gives you

Worth knowing before reading the table, because it changes the estimates:

| Already there | Where |
|---|---|
| Per-user activity rows with type, distance, steps, calories, duration | `activities` table |
| Challenge engine: join, progress from activities in a window, completion, reward points | `services/*/challenge-service.ts` |
| **1-to-1 challenges between two students**, pending/accepted/declined, both sides' progress | `peer_challenges` table, built for Near Me |
| **Proximity**: opt-in presence with lat/lon, radius search, distance sort | `user_presence` table, `services/*/nearby-service.ts` |
| Clubs with membership, points, per-club leaderboard | `clubs`, `club_members` |
| `department`, `college`, `academic_year` on every user | `users` table |
| Badge definitions with progress and unlock rules | `constants/profile-data.ts` (still static) |
| Guest (SQLite) and cloud (Supabase) behind one router | `lib/data-mode.ts` |

Two things that do **not** exist and that several features assume:

- **No push notifications.** No `expo-notifications`, no token storage, no
  server to send them. Features 3, 4 and 5 are notification products.
- **No background execution.** The app only counts steps while open on the
  tracking screen. Feature 4 assumes the app notices you have been sitting
  for 3 hours, which it cannot currently do.

---

## Feature by feature

### 1. Avatar that levels up and unlocks gear

**Can be applied: yes. Closest to free.**

You already award reward points on challenge completion and have a badge
system with progress rules. Levelling is the same shape: a `level` and
`xp` column on `users`, XP from the points engine, and a cosmetics table
with unlock thresholds.

The real cost is **art, not code**. "Cyberpunk hoodies, varsity jackets,
rare accessories" means a layered avatar system with dozens of drawn
assets. Code is maybe 3 days; the art is open-ended. Start with 5 to 6
recolourable pieces rather than a wardrobe.

> Needs: `users.level/xp`, `cosmetics`, `user_cosmetics`, an avatar
> renderer. Art budget.

---

### 2. Dorm / Branch Guild Wars

**Can be applied: yes, and it is the best effort-to-impact on the list.**

`department` and `college` are already on every user and already collected
during onboarding. "Guild Power" is a sum over `activities` grouped by
department, which is one query. There is even a `department-leaderboard.tsx`
component sitting there with hardcoded rows waiting to be wired up.

Hostel is the only missing dimension: add a `hostel` field to onboarding.

The campus-map presentation is the fun part and is also the most work:
you would reuse the Leaflet/OSM setup already built for the route map and
colour regions by owning guild.

> Needs: `users.hostel`, a `guild_power` aggregate (a Postgres view or a
> scheduled recompute), map overlay. ~1 week.

---

### 3. Squad Quests, 3 friends, combined goal

**Can be applied: yes. Partly scaffolded already.**

`ChallengeCategory` already includes `'squad'`, the `Challenge` type has a
`squadInfo` block with members and contributions, and `challenge-data.ts`
has squad challenges in it. What is missing is that squads are not real:
nobody can create one or invite anyone.

The `peer_challenges` table built for Near Me is the 1-to-1 version of
exactly this. Generalising it to N participants with a shared goal is a
schema change, not a new system.

The "friendly nudge notifications" half is blocked on push (see below).
Build the squad first and let nudges be in-app.

> Needs: `squads`, `squad_members`, invite flow, combined progress.
> ~1 week without notifications.

---

### 4. Late-Night Study Detox bounties

**Can be applied: partly, and not the way it is described.**

The trigger as written, "you have been sitting at your desk for 3 hours",
needs continuous background activity recognition. That means a foreground
service on Android, battery consumption, and the Google Play "Health
Connect / background location" review path. On iOS it is worse. This is a
large, genuinely risky piece of work, not a feature you slot in.

What you **can** do cheaply and which gets most of the value:

- Time-of-day bounties: "It is 11pm and you have not moved today. 5-minute
  stretch for double XP."
- Gap-based: on app open, look at `activities` and see the last entry was
  3 hours ago.
- Let the user say they are in a study session, then time it in-app.

I would build the honest version and skip the surveillance version.

> Needs: a bounty table plus local notifications (`expo-notifications`
> local mode works with no server). ~3 days for the honest version.

---

### 5. Sassy AI coach notifications

**Can be applied: yes, and start rule-based.**

The data to be sassy about is all there: streaks, last activity date,
personal bests, challenge standings. A rules table of about 20 templates
keyed off those signals gets you 90% of the effect with zero latency, zero
cost and zero chance of the model saying something strange.

Reserve an actual LLM for later, and if you do add one, generate on the
server and never ship a key in the app.

Two cautions. First, this is blocked on push notifications for the main
use case ("skipped two days") since the app is closed then. Local
scheduled notifications can cover a lot of it. Second, roasting needs a
tone limit and an off switch; tone that lands for one student reads as
unpleasant to another, especially around body image.

> Needs: `expo-notifications`, a templates table, a daily local schedule.
> ~4 days rule-based.

---

### 6. 60-Second Blitz matchmaking

**Three sub-features with very different costs.**

| Queue | Verdict |
|---|---|
| **Proximity Ping** | **Already 80% built.** `user_presence` with lat/lon and radius search is exactly this. What is missing is the live match handshake. |
| **Campus Brawl** | Buildable. Needs a matchmaking queue table plus Supabase Realtime. Blocked on having enough concurrent users to match against. |
| **Inter-College Turf War** | Same machinery, plus the college aggregate from feature 8. |

The blocker is not code, it is **liquidity**. Instant matchmaking needs
people online at the same time. On day one at one college you will have
nobody in the queue. Plan for an async fallback, which is what the
existing `peer_challenges` flow already is: challenge someone, they
accept later.

Also note the duel format assumes feature 7 to verify reps. Without pose
detection a "duel" is two people reporting their own numbers.

> Needs: `match_queue`, Realtime channels, ELO. ~1.5 weeks after 7.

---

### 7. On-device pose estimation with form-gated rep counting

**Can be applied: technically yes, but this is the one to be careful about.**

This is the single largest item on the list, bigger than several of the
others combined, and it is on the critical path for 6, 8 and 9 as written.

What it actually involves on Expo:

- `expo-camera` for frames.
- MediaPipe Pose or a TFLite MoveNet model via `react-native-fast-tflite`
  or a vision-camera frame processor. **MediaPipe Pose is a web/native SDK
  and does not drop into Expo Router as-is**; expect a config plugin and
  possibly native code, which also means no Expo Go, which you already
  accepted.
- Landmark smoothing, then angle maths per exercise (elbow for push-ups,
  knee and hip for squats, hip line for plank).
- Rep state machine with hysteresis so jitter does not double-count.
- Camera placement UX: the phone has to see the whole body, propped up,
  decent light. This is where these features usually die in testing.

The privacy claim in the proposal is correct and worth keeping: frames
never leave the device, only the rep count does.

Realistic estimate: **3 to 4 weeks** for one exercise that works reliably,
plus a week per additional exercise. Accuracy across body types, clothing,
camera angles and lighting is where the time goes, not the model.

My recommendation: prototype **rep counting without form gating first**,
on one exercise, and see how it feels before committing. If the demo is
soon, treat this as a stretch goal and ship 1, 2, 3 and 8 instead.

> Needs: dev build with camera + TFLite, model, per-exercise maths,
> live sync. The Realtime tug-of-war bar is the easy part here.

---

### 8. Dual-tier leaderboard, personal ELO + College Glory

**Can be applied: yes. Mostly a cleanup of what exists.**

The PRD already flagged that every leaderboard in the app is a hardcoded
array, including one that labels a fictional student as "you". Replacing
that with a real aggregate is work you need to do regardless.

College Glory is a sum keyed on `users.college`, which is already captured
at onboarding from a fixed list. ELO is a standard formula over duel
results and needs a `duels` table, which feature 6 provides.

One flag: "tagged with their .edu / college ID" implies verifying that
someone actually attends that college. Right now college is a dropdown
anyone can pick. Real verification means email domain checks or ID upload,
which is its own project. For a campus launch, the dropdown is fine; just
do not call it verified.

> Needs: `leaderboard_entries` recompute, `college_scores`, ELO on duels.
> ~1 week, minus the duel dependency.

---

### 9. Rotating duel mini-games

**Can be applied: only after 7.**

Squat sprint, plank hold and jumping jacks are each a new set of landmark
rules on top of the pose pipeline. Individually they are small, perhaps 3
to 5 days each. They are listed last correctly: they are content for an
engine that does not exist yet.

Plank "first hips drop" is the hardest of the three to judge reliably and
the most frustrating to lose to a false positive.

---

## Suggested order

Given PS08 is judged on students logging activity, challenges, leaderboards
and community participation, and given the current state:

**Phase 1, finish what is half-built (1 to 2 weeks)**
Real leaderboards (8, minus ELO), guild power (2), squads (3). These three
make the existing screens honest and are what the problem statement
actually asks for.

**Phase 2, engagement (1 to 2 weeks)**
Avatar levelling (1), rule-based coach and bounties (4, 5), plus
`expo-notifications`. Cheap, visible, no new risk.

**Phase 3, competition (2 weeks)**
Async duels from the Near Me flow, ELO, College Glory, matchmaking queue
(6, 8). Works without pose detection if duels are self-reported or
step-based.

**Phase 4, the ambitious one (4 weeks plus)**
Pose estimation (7), then mini-games (9). Start a spike early so you learn
whether it is viable before you need it.

---

## Things to decide before building any of this

1. **Push notifications: yes or no.** Three features depend on it. It
   means `expo-notifications`, token storage, and a sender. Decide now.
2. **How many real users on day one.** Matchmaking, guild wars and
   leaderboards are all empty-room problems. If the answer is "a hostel
   floor", prefer async over realtime.
3. **Is pose estimation in scope for the deadline**, or a phase 2 pitch?
   This single answer reshapes features 6, 7 and 9.
4. **Tone limits on the roasting coach**, and an off switch.
