# What changed since `af6e859`

Everything below is **uncommitted work in the local clone**. Base commit is
`af6e859 profile supabase done`, which is upstream `main` as of the last pull.
Nothing has been pushed.

**30 new files, 86 modified.** `npx tsc --noEmit` is clean apart from two
pre-existing CSS-module errors that were there before any of this.

## Merge with `af6e859 profile supabase done`

That commit landed while this work was in progress and overlapped in two
places. Resolved as follows:

- **Six profile files** (`user-profile-card`, `profile-header`,
  `achievements-section`, `activity-highlights`, `achievements`,
  `achievement/[id]`) — **their version kept in full**. The only local change
  was the mechanical font sweep, which was re-applied afterwards.
- **`auth-context.tsx`** — the local guest/cloud rewrite kept, and their new
  `refreshProfile()` added to it by hand, since their new profile screen
  calls it. It now refreshes from SQLite for guests and Supabase otherwise.
- **Migration numbering collided.** They added `004_social_profile_schema.sql`
  while this branch had its own `004`. Renumbered locally: nearby is now
  **005**, leaderboards/guilds/squads is **006**. Run them in order.

One thing worth knowing about their 004: it replaces `users_select_own` and
`activities_select_own` with `select using (true)`, so **every signed-in user
can now read every other user's activity rows**. That is what makes their
follower feed work. It also means the security-definer functions in 006 are
belt-and-braces rather than strictly required. Fine for a campus prototype;
revisit before any public release.

---

> **Superseded in part.** The guest/offline split described in section 1
> was later removed: everything is online through Supabase now, with a
> read-only JSON snapshot for offline viewing. See `ARCHITECTURE.md`.
> Sections 2 onward still apply.

## 1. Two account types: Guest offline, Email/Google in the cloud

The biggest structural change. The app now has two storage backends behind
one switch, picked by how you signed in.

| Sign in as | Data lives in | Code |
|---|---|---|
| **Guest** | SQLite file on the phone, no network | `src/services/local/` |
| **Email** or **Google** | Supabase | `src/services/remote/` |

- `src/lib/data-mode.ts` — the switch. Services call `getDataMode()` per call.
- `src/lib/db.ts` — the local database: schema, migrations, seeding, a
  pub/sub to replace Supabase Realtime, and `resetDatabase()`.
- `src/lib/session.ts` — local accounts, since there is no auth provider offline.
- `src/lib/seed-data.ts` — the 9 challenges and 6 clubs, converted from the
  existing SQL migrations by script rather than retyped.
- `activity-storage.ts`, `challenge-service.ts`, `community-service.ts` became
  thin routers; the original Supabase code moved to `remote/` untouched.

`src/context/auth-context.tsx` was rewritten to handle both, and **Google
sign-in is now real OAuth** via `expo-web-browser`, where it used to be a
"coming soon" stub.

> Needs for cloud mode: a Supabase project and keys in `.env`. Guest needs
> nothing at all.

---

## 2. Real sensors, GPS and an OpenStreetMap route

The tracking screen was counting fake steps: a `setInterval` with
`Math.random()`. On a desk it showed 18 steps in 10 seconds.

- `src/services/sensors.ts` — **new**. `expo-sensors` Pedometer for steps,
  `expo-location` for position. Distance by haversine, discarding fixes worse
  than 35 m accuracy or under 4 m of movement, so standing still no longer
  registers as walking. Live speed from the GPS chip.
- `src/components/activity/route-map*.tsx` — **new**. Leaflet over
  OpenStreetMap tiles in a WebView, with an iframe twin for web. No Google
  Maps API key needed, which is why this rather than `react-native-maps`.
- `src/app/activity/[type].tsx` — simulation deleted, header labels rewritten.
  It now says what is actually running: *"No pedometer on this device ·
  Location permission denied. Enter totals at the end."*

---

## 3. Intro slides and the new sign-in screen

- `src/app/intro.tsx` — **new**. Five slides on first launch only, Skip on
  all but the last. The "seen" flag lives in SQLite.
- `src/app/auth/index.tsx` — **Continue as Guest** is now the primary button,
  with "Guest data is stored only on this phone" under it, then a divider and
  Email / Google for cloud sync.

---

## 4. Near Me

New view in Community: opt in to be visible, see who is around and what they
are doing, search them, and challenge them head to head.

- `src/components/community/nearby/nearby-section.tsx` — the UI.
- `src/services/*/nearby-service.ts` + `nearby-shared.ts` — the logic.
- `src/types/nearby.ts`, `supabase/migrations/005_nearby_presence.sql`.
- New tables: `user_presence`, `peer_challenges`.

Visibility is **off by default** and switching it off deletes the row rather
than hiding it. Six demo students are seeded for guest mode, flagged and
labelled `demo`, and re-placed around wherever you actually are.

---

## 5. Phase 1, in progress

Started, data layer done, **UI not wired yet**:

- `src/services/points-engine.ts` — **new**. One scoring rule for everything:
  10 per activity, 5/km, 3 per 1000 steps, 2 per 100 kcal, capped at 300 a day.
- `src/services/local/leaderboard-service.ts` — real individual ranks and
  **Guild Power** by department or hostel.
- `src/services/remote/leaderboard-service.ts` — the same via security-definer
  SQL functions, so ranking never exposes anyone's raw activity rows.
- `src/services/local/squad-service.ts` — **Squad Quests**: create a squad,
  add members, set a shared goal, progress split per member.
- `supabase/migrations/006_leaderboards_guilds_squads.sql` — hostel column,
  squad tables with RLS, and the aggregate functions.

**Still to do:** the remote squad service, the routers, and the UI. The
hardcoded leaderboard arrays in `constants/community-data.ts` are still what
the screens read.

---

## 6. SF Pro Display everywhere

- `assets/fonts/` — Regular, Medium, Bold.
- `src/app/_layout.tsx` — loads them and holds the splash until ready.
- `src/constants/theme.ts` — `FontFamily` plus every `Typography` token.
- **250 declarations across 84 files** were swept, because the repo had 72
  files setting `fontWeight` inline outside the tokens.

Each weight is its own family name on purpose: React Native does not map
`fontWeight` onto a custom family, so `'700'` would give synthetic bold on
Android.

---

## 7. Lucide, Phosphor and Tabler icons

`AppIcon` now takes `ion | mci | feather | lucide | phosphor | tabler`.

`src/components/ui/icon-registry.ts` imports **per-icon subpaths**, never the
package root. This is not stylistic: the barrel import made Metro crawl all
7057 + 3024 + 6353 icon files and **killed the dev server** with
`EMFILE: too many open files`. Per-icon imports took the bundle from crashing
to 4.4 seconds.

---

## 8. Smaller fixes

- **Activity picker is two per row** (`start-activity-section.tsx`), tiles
  share each row's height so the Start links line up.
- **Community Highlights** rebuilt as a recycling, auto-drifting, full-bleed
  strip, now showing real students and real numbers instead of the
  placeholder `User X / User Y / User Z` that was shipping in the UI.
- **Pop-out animation removed** from the onboarding finish card.
- **`users.reward_points`** now exists. The old code wrote to that column but
  no migration ever created it, so every challenge award failed silently.

---

## 9. Docs and build config

| File | What it is |
|---|---|
| `supabase/SETUP.sql` | **All six migrations in one file.** Paste into the Supabase SQL editor and run once; safe to re-run |
| `RUNNING.md` | How to get it onto a phone. Expo Go works |
| `FEATURES-REVIEW.md` | The nine proposed features assessed against the code |
| `PRD.md` | The original audit, now partly out of date |
| `CHANGES.md` | This file |
| `eas.json` | Build profiles, `development` makes an installable APK |
| `metro.config.js` | wasm rule and headers for SQLite on web |

---

## Dependencies added

```
expo-sqlite            local database
expo-sensors           pedometer
expo-location          GPS
react-native-webview   OSM route map
react-native-svg       icon sets
lucide-react-native
phosphor-react-native
@tabler/icons-react-native
```

`app.json` gained three config plugins: `expo-sqlite`, `expo-location` and
`expo-sensors`, with permission strings. The native build needs all three.

---

## Before you push

1. **Expo Go still works.** Every native module added here is bundled into
   Expo Go, and the app does not use background location, which is the one
   thing that would have forced a development build. `npx expo start` and
   scan the QR code. See `RUNNING.md`.
2. **Run migrations 004, 005 and 006** on Supabase if you use cloud mode.
3. `supabase/migrations/` is untouched for 001 to 003.
4. The local SQLite schema is at version 3 and migrates an existing install
   in place.

## Known gaps

- Phase 1 UI is not wired; leaderboards on screen are still the hardcoded
  fictional students.
- `README.md` is still the untouched Expo template.
- No push notifications anywhere.
- Badges in `constants/profile-data.ts` are still static unlock flags.
