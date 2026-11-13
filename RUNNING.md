# Running MUVIBE on a phone

**Expo Go runs the app, but it cannot count steps on Android.**

Every native module here is bundled into Expo Go, so the app loads and
almost everything works. The exception is the pedometer: counting steps
needs the Android `ACTIVITY_RECOGNITION` permission, and **Expo Go's own
manifest does not declare it**, so the grant can never happen no matter
what the app asks for. The tracking screen says so rather than silently
sitting at zero.

Use Expo Go for layout, navigation, Supabase and the GPS route map. Build
a development build the moment you need step counting.

Checked against the Expo SDK 58 docs, each page's platform line:

| Module | Expo Go |
|---|---|
| `expo-file-system` | "Included in Expo Go". Native only in practice: the `File`/`Paths` API throws on web, so the browser falls back to `localStorage` |
| `expo-sensors` (Pedometer) | Module yes, but **step counting needs a dev build on Android** (no ACTIVITY_RECOGNITION in Expo Go) |
| `expo-location` | "Android, iOS, Web, Included in Expo Go" |
| `react-native-webview` | "Android, iOS, Included in Expo Go" |
| `react-native-svg` | "Android, iOS, macOS, tvOS, Web, Included in Expo Go" |
| lucide / phosphor / tabler icons | pure JS on top of `react-native-svg` |

The one `expo-location` feature that would force a development build is
**background location**, and this app does not use it. Tracking is
foreground only: `requestForegroundPermissionsAsync` and
`watchPositionAsync` while the tracking screen is open.

---

## Quickest route: Expo Go

1. Install **Expo Go** from the Play Store or App Store.
2. On this machine:

   ```bash
   npx expo start
   ```

3. Phone and PC on the same Wi-Fi. Scan the QR code with Expo Go on
   Android, or the Camera app on iOS.

If the network blocks device-to-device traffic, which is common on campus
and guest Wi-Fi, use a tunnel instead:

```bash
npx expo start --tunnel
```

### Two caveats in Expo Go

- **SDK version must match.** Expo Go on the stores supports one SDK at a
  time. This project is on SDK 58; if your Expo Go is older it will refuse
  to open the project, and the fix is to update Expo Go.
- **Permission wording is Expo Go's, not ours.** The custom strings in
  `app.json` ("MUVIBE uses your location to measure distance...") are
  applied at build time, and Expo Go is already built. Location and motion
  still work, you just see Expo Go's generic prompt. The real wording
  appears in a development or release build.

---

## When you will actually need a development build

Not now, but worth knowing:

- Testing the app icon, name or splash screen.
- Remote push notifications; in-app ones work in Expo Go. This is the one
  that will bite you if you build the coach notifications from
  `FEATURES-REVIEW.md`.
- Background location, or counting steps while the app is closed.
- Any native library Expo Go does not bundle, for example the pose
  estimation in feature 7.
- Giving an APK to someone who does not have Expo Go.

### How to make one

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest init
```

```bash
npx eas-cli@latest build --platform android --profile development
```

`eas.json` is already set up: the `development` profile produces an
installable APK with the dev client in it. Install it, then run
`npx expo start --dev-client` and scan with that build rather than Expo Go.

A local build (`npx expo run:android`) is the alternative, but this machine
has **no Java, no Android SDK and no adb**, so it would mean installing
Android Studio and JDK 17 first.

---

## Testing in a browser

```bash
npx expo start --web
```

Useful for layout, but **not a real test**:

- No pedometer on web, so step counts stay at zero.
- GPS uses browser geolocation, which is coarse and often refused.
- SQLite runs as WebAssembly rather than the native file.

Anything involving sensors has to be checked on a real phone, walking
around.

---

## Guest mode versus signed in

All three sign-in paths now use Supabase, so **the keys below are required
before the app does anything**, Guest included. See `ARCHITECTURE.md` for
why that changed.

**Guest** is a Supabase anonymous account: no email, no password, but a
real online user that appears on leaderboards and can be challenged. It can
be upgraded to a full account later without losing data. Enable it in
Supabase under Authentication, Providers, Anonymous sign-ins.

**Setting up Supabase:**

1. Create a project at supabase.com.
2. In the SQL editor, paste **`supabase/SETUP.sql`** and run it once. That
   is every migration in order, in one file, and it is safe to run again.
   (The individual files in `supabase/migrations/` are the source if you
   prefer to run them one at a time.)
3. Copy `.env.example` to `.env` and fill in:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
   ```

4. Restart the dev server. `.env` is read at bundle time, so a restart is
   required, not just a reload.

For an EAS build, put the same two values in the `env` block of the profile
in `eas.json`, since `.env` is not uploaded.

Google sign-in additionally needs the provider enabled in
Supabase → Authentication → Providers, with `muvibe://auth/callback` added
to the allowed redirect URLs. OAuth redirecting back into a custom scheme
does not work inside Expo Go, so use email sign-in there and test Google in
a dev build.

---

## Permissions on first run

Asked for when first used, and the app keeps working if you refuse. It
falls back to the timer and manual entry.

| Permission | Used for | If refused |
|---|---|---|
| Physical activity | Step counting | Steps stay at 0, enter them at the end |
| Location | Distance, speed, route map, Near me | Timer only; Near me uses the campus position |

---

## Common problems

**"Project is incompatible with this version of Expo Go"** — update Expo Go,
or build a dev client.

**"Unable to resolve module" after pulling new code** — a dependency
changed. Run `npm install`, then `npx expo start --clear`.

**Phone cannot reach the server** — same Wi-Fi, or use `--tunnel`.

**Steps stay at zero while walking** — check the physical activity
permission in Android settings, and keep the screen on; some phones stop
delivering sensor events to a backgrounded app.
