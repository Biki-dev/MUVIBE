# Architecture: online-first with an offline snapshot

This replaces the earlier guest/offline split. Read it alongside
`CHANGES.md`, which still describes some of the old shape.

## The rule

**Supabase is the only source of truth.** There is no second database.

Reads go through a read-only JSON snapshot so the app still shows
something without a connection. Writes need a connection and fail
honestly when there isn't one.

```
screen
  └─ src/services/<domain>-service.ts      ← wraps reads in withSnapshot()
       └─ src/services/remote/<domain>-service.ts   ← Supabase
            └─ src/lib/offline-cache.ts    ← muvibe-cache.json on device
```

## Accounts

All three paths produce a real Supabase session. The difference is only
how much the student had to type.

| Button | What happens | Data |
|---|---|---|
| **Continue as Guest** | `supabase.auth.signInAnonymously()` | Online, in Supabase, same as anyone else |
| **Sign in with Email** | `signUp` / `signInWithPassword` | Online |
| **Continue with Google** | OAuth via the system browser | Online |

A guest is not a second-class local user any more. They get a real row in
`public.users`, appear on leaderboards, can join clubs and be challenged.

`upgradeGuestToEmail()` attaches an email and password to the anonymous
account. **The user id does not change**, so every activity, club
membership and challenge carries over. That is the whole reason for
choosing anonymous auth over a local-only guest.

### You must enable this in Supabase

Dashboard → Authentication → Providers → **Anonymous sign-ins: on**.
Without it the Guest button returns a clear error telling you so.

## The offline snapshot

`src/lib/offline-cache.ts` holds the logic. Where the bytes actually go is
split by platform, because `expo-file-system`'s `File`/`Paths` API is
native only and throws `this.validatePath is not a function` in a browser:

| Platform | Backing store | File |
|---|---|---|
| Android, iOS | `muvibe-cache.json` in the document directory | `src/lib/cache-store.ts` |
| Web | the same JSON string in `localStorage` | `src/lib/cache-store.web.ts` |

Both are guarded, so a blocked or full store degrades to "no cache"
rather than breaking a render.

- Written after every successful fetch, namespaced by key.
- Read when a fetch throws, so the screens degrade to the last good copy.
- Writes are coalesced on a 400ms timer, so a burst of fetches costs one
  disk write.
- Held in memory too, so reads during a render do not touch the disk.

Two deliberate choices worth knowing:

**An empty response does not overwrite a good snapshot.** Without that,
one request returning `[]` during a flaky moment would wipe the offline
copy. `withSnapshot` takes an `isEmpty` predicate for this.

**Nothing is ever written to the cache by the user.** It is not a write
queue and it does not sync back. Log an activity with no connection and
the save fails. If you want offline logging later, that is a real feature
with real conflict handling, not a tweak to this file.

`getFreshness()` and `describeAge()` are there for a "last updated 20m
ago" line in the UI. Nothing shows it yet.

## What was removed

| Gone | Why |
|---|---|
| `src/lib/db.ts` | SQLite schema, migrations and seeding |
| `src/lib/session.ts` | Local accounts, replaced by Supabase anonymous auth |
| `src/lib/seed-data.ts` | Seed challenges and clubs, now rows in Supabase |
| `src/lib/data-mode.ts` | The guest/cloud switch; there is one backend now |
| `src/services/local/*` | Seven SQLite-backed services |
| `metro.config.js` | Existed only for the SQLite wasm build on web |
| `expo-sqlite` | No longer a dependency, and dropped from `app.json` plugins |

## Consequences, including the awkward ones

**The app does nothing without Supabase keys.** Previously Guest worked
with no setup at all. Now `.env` is required before the app is usable,
including for a demo. Copy `.env.example`, fill it in, restart the dev
server.

**Near Me starts empty.** The six demo students were seeded into SQLite,
and they are gone. They cannot be recreated by SQL alone because
`public.users.id` is a foreign key to `auth.users`, and auth users cannot
be inserted from the SQL editor. To demo Near Me you need a second real
account, or a seeding script that signs up users through the auth API.

**Squad Quests has no backend right now.** The local implementation was
deleted with the rest of `services/local/`. The schema and SQL functions
exist in migration 006; a `services/remote/squad-service.ts` still needs
writing.

**No offline logging.** Previously a guest could track a run on a plane.
Now that fails. This was the explicit trade for everything being online.

## Dependency note

`expo-file-system` replaced `expo-sqlite`. Both are bundled in Expo Go, so
the app still runs there with no development build.
