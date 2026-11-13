# 📋 MUVIBE — What Changed

## Every modification made in this session, ready to push on top of **`89b30ec small fix`**

> **Repo:** Biki-dev/MUVIBE · **Base:** `89b30ec` (upstream main, already merged in) · **State:** uncommitted in the local clone
> **Scale:** 93 files modified, 32 new, 0 conflicts outstanding. Typecheck clean, all 156 source files parse, the app builds and runs.
> **Safety:** no secrets in anything pushable. `.env` is gitignored and verified.

---

## 1. 🏗️ Architecture: online only, with an offline snapshot

The single biggest change. The app previously had two storage paths; it now has one.

| | Before | Now |
|---|---|---|
| Guest | Local SQLite, fully offline | `supabase.auth.signInAnonymously()`, a real online user |
| Email / Google | Supabase | unchanged |
| Offline | Full read and write | Read-only JSON snapshot |

A guest is no longer second class. They get a real row in `public.users`, appear on leaderboards, and can be challenged. `upgradeGuestToEmail()` attaches an email to the **same user id**, so everything logged as a guest carries over.

**New files:** `src/lib/offline-cache.ts`, `src/lib/cache-store.ts`, `src/lib/cache-store.web.ts`

**Deleted:** `src/lib/db.ts`, `src/lib/session.ts`, `src/lib/seed-data.ts`, `src/lib/data-mode.ts`, all seven `src/services/local/*`, `metro.config.js`, and the `expo-sqlite` dependency.

> **Storage split by platform.** `expo-file-system`'s `File`/`Paths` API is native only and throws `this.validatePath is not a function` in a browser, so the web build keeps the same JSON string in `localStorage` instead.

Two deliberate rules in the cache: an empty response never overwrites a good snapshot, and nothing is ever written to it by the user. It is a cache, not a write queue.

---

## 2. 📍 Real sensors, GPS and a route map

The tracking screen was counting fake steps. A `setInterval` with `Math.random()` produced **18 steps in 10 seconds on a desk**.

- **`src/services/sensors.ts`** (new) — `expo-sensors` Pedometer for steps, `expo-location` for position. Distance by haversine, discarding fixes worse than 35 m accuracy or under 4 m of movement, so standing still no longer registers as walking. Live speed from the GPS chip.
- **`src/components/activity/route-map*.tsx`** (new, 3 files) — Leaflet over OpenStreetMap in a WebView, with an iframe twin for web. Chosen over `react-native-maps` because that needs a Google Maps API key on Android even when overlaying OSM tiles.
- **`src/app/activity/[type].tsx`** — simulation deleted, header copy rewritten to state what is actually running.

> **Android permissions were missing entirely.** `ACTIVITY_RECOGNITION`, `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` are now declared in `app.json`. Without the first one, step counting silently fails even in a development build.

---

## 3. 🤝 Near Me

New view in Community: opt in to be visible, see who is around and what they are doing, search them, challenge them head to head.

- `src/components/community/nearby/nearby-section.tsx`
- `src/services/nearby-service.ts`, `src/services/remote/nearby-service.ts`, `src/services/nearby-shared.ts`
- `src/types/nearby.ts`
- New tables: `user_presence`, `peer_challenges`

Visibility is **off by default**, and switching it off deletes the row rather than hiding it.

---

## 4. 🎮 Gamification

Anchored to campus varsity athletics, scoreboards and lane markings, deliberately avoiding the default gamified look. No gradients, no glass panels, no glow, no confetti, no emoji in the UI.

- **`src/services/points-engine.ts`** (new) — one scoring rule everything derives from: 10 per activity, 5 per km, 3 per 1000 steps, 2 per 100 kcal, capped at 300 a day.
- **`src/services/gamification.ts`** (new) — levels and tiers.
- **`src/components/game/`** (new, 4 files) — rank plate, segmented XP bar, stat readout, rank card.

The tier ramp walks stone to bronze to silver to gold to **lime**, so the top rank is the brand colour.

| Tier | Level | XP | At 5 sessions a week |
|---|---|---|---|
| Bronze | 5 | 214 | about 1 week |
| Silver | 12 | 935 | about 5 weeks |
| Gold | 22 | 2,730 | about one semester |
| Apex | 35 | 6,409 | about an academic year |

> **The curve was retuned.** An exponential first pass put Apex at roughly 600 weeks. It is now linear.

---

## 5. 🔐 Onboarding and sign-in

- **`src/app/intro.tsx`** (new) — five slides on first launch only, Skip on all but the last.
- **`src/app/auth/index.tsx`** — Continue as Guest is now primary, then Email and Google for sync.
- **`src/app/onboarding/location.tsx`** — now actually calls `Location.requestForegroundPermissionsAsync()`. It previously only set a boolean, so the system prompt never appeared and the app believed it had permission it had never been granted.

---

## 6. 🔤 Typography and icons

- **`assets/fonts/`** (new) — SF Pro Display Regular, Medium, Bold, loaded at the root with the splash held until ready.
- **250 font declarations swept across 84 files**, because the repo had 72 files setting `fontWeight` inline outside the design tokens.
- **`src/components/ui/icon-registry.ts`** (new) — Lucide, Phosphor and Tabler added alongside Ionicons and MaterialCommunityIcons.

> **Why per-icon imports.** Importing from the package root made Metro crawl 7057 + 3024 + 6353 icon files and killed the dev server with `EMFILE: too many open files`. Per-icon subpaths took the bundle from crashing to 4.4 seconds.

---

## 7. 🐛 Bugs found and fixed

| Bug | Cause |
|---|---|
| Finish button did nothing | `Alert.alert` is a no-op on React Native Web |
| Review sheet showed `00:00` duration | Built a fake session with `startTime: 0`, which makes `getElapsedSeconds` return 0 |
| Tab bar unreachable on Android | Hardcoded `height: 60` ignoring the safe-area inset |
| App crashed on launch | No `SafeAreaProvider` anywhere, so `useSafeAreaInsets()` threw |
| `ReferenceError: window is not defined` | `web.output: "static"` prerenders in Node, where Supabase auth touches `window` |
| Quick Actions dead on tap | Wired to optional props that Home never passed |
| Challenge rewards never awarded | Code wrote to `users.reward_points`, a column no migration ever created |
| Phone could not see the dev server | A VPN made Expo advertise `127.0.0.1` in the QR code |

---

## 8. 📊 Honest data

Replaced only the figures that claimed to be **the user's own**. Catalogue content was left as fixtures on purpose.

| Was | Now |
|---|---|
| Today's Activity: 6,842 steps / 318 kcal / 4.7 km / 52 min | Real totals, zeros with "Nothing logged yet" |
| Week strip: 4 invented green days | Green only on days actually logged |
| Community Highlights: "User X", "User Y" | Real students and real numbers |

Left as fixtures: Active Events, club definitions, challenge definitions, achievement definitions.

---

## 9. 🗄️ Database

- **`supabase/migrations/005_nearby_presence.sql`** (new) — `user_presence`, `peer_challenges`, RLS, progress function.
- **`supabase/migrations/006_leaderboards_guilds_squads.sql`** (new) — `hostel` column, squad tables, and security-definer aggregate functions so ranking never exposes raw activity rows.
- **`supabase/SETUP.sql`** (new) — all six migrations in one re-runnable file. 15 tables, 51 policies, 9 functions.

> **Two things must be done in the Supabase dashboard before the app works:** turn on Anonymous sign-ins under Authentication, Providers, and run `SETUP.sql`.

---

## 10. 🔀 Merge with upstream

Upstream moved three times during the session and rebuilt the entire home page. **Their version was kept in full** for all ten home files; the only difference is the `FontFamily` import and 56 font declarations. None of their logic changed.

Earlier, `af6e859` rewrote six profile files and added `refreshProfile()`. Their profile work was kept whole, and `refreshProfile` was hand-merged into the new auth context.

Migration numbering collided twice and was resolved by renumbering locally to 005 and 006.

---

## 11. 📦 New dependencies

```
expo-sensors            pedometer
expo-location           GPS
expo-file-system        offline JSON snapshot
react-native-webview    OSM route map
react-native-svg        icon sets and the rank plate
lucide-react-native
phosphor-react-native
@tabler/icons-react-native
```

Removed: `expo-sqlite`. All of these are bundled in Expo Go.

---

## 12. 🟢 Verdict: safe to push

| Check | Result |
|---|---|
| Secrets in pushable files | None |
| `.env` ignored | Yes, verified |
| `.env.example` | Placeholders only |
| `service_role` key | Does not exist anywhere in the repo |
| Conflict markers | None |
| Typecheck | Clean |
| Babel parse, 156 files | All pass |

`.gitignore` was rewritten to add `.env.*` with a `!.env.example` exception, `credentials.json`, `google-services.json`, keystores, the runtime `muvibe-cache.json`, and editor noise. Nothing already tracked became ignored.

**Two cosmetic notes.** `assets/fonts/` adds 952 KB and is being kept by choice. `PRD.md` describes the repo as it was roughly fifteen commits ago and is superseded by `CHANGES.md` and `ARCHITECTURE.md`.

---

## 🔗 Reference documents in the repo

- `ARCHITECTURE.md` — the online-only design and why SQLite was removed
- `CHANGES.md` — the running changelog
- `RUNNING.md` — getting it onto a phone, and why step counting needs a development build
- `FEATURES-REVIEW.md` — the nine proposed features assessed against the code
- `supabase/SETUP.sql` — the whole schema in one file
