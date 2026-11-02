# Location and weather audit, 2026-10-30

Branch: sprint-final-push @ b246c50. Read-only audit; no code changed.

## Scope searched

app, components, lib, hooks, context, utils, scripts, constants, app.config.js, app.json, package.json, package-lock.json, eas.json, ios/ (Info.plist, entitlements, Supporting, AppDelegate), node_modules (presence check), git history. There is no `supabase/` directory and no `android/` directory in the repo.

Patterns: expo-location, `Location.`, geolocation, NSLocation*, locationWhenInUse/Always, ACCESS_COARSE/FINE_LOCATION, latitude, longitude, coords, geocod, gps, weather, forecast, openweather, fetch/axios calls, location_* columns.

## Hits

| File:line | Match | Classification |
|---|---|---|
| components/PitchSequenceChess.tsx:11, 107, 129, 140, 252 | `location` / `pp.location` / `target_options` | Live code, NOT device location. It is a pitch-zone string in lesson content (e.g. "down_away"). |
| components/DiamondCursor.tsx:239 | "Touch start pixel coords" | Live code, NOT device location. Touch coordinates for a drag gesture. |
| lib/lessonAudio.ts:51 | comment "less like a GPS" | Comment only. |
| .claude/settings.local.json:15 | allowlist entry `require('expo-location')` | Tooling config string only. Not app code, not shipped. |
| product/*.md, docs/Clutchr_Visual_Revamp_Brief.md:108, product/sql/*, product/visual-learning/*.json | "location", "weather temp" | Documentation and lesson copy only. "Identify shape before location", "best location" refer to pitch location. The brief line 108 mentions "weather temp" as a UI idea in a design doc. |
| ios/ClutchrBaseball/Info.plist:48 | `NSMicrophoneUsageDescription` | Not location (microphone). No NSLocation* key exists anywhere in the plist. |

No hits for: expo-location imports, `Location.` calls, navigator.geolocation, NSLocation*, locationWhenInUse, ACCESS_*_LOCATION, latitude/longitude, any weather API URL, any weather or location Supabase column.

## Dependencies

- package.json: no expo-location, no geolocation library, no maps library, no weather library.
- package-lock.json: no `expo-location` entry.
- node_modules: `node_modules/expo-location` does not exist.

## Network calls in app code

Only `Linking.openURL` to clutchr.app/privacy, clutchr.app/terms and a YouTube watch URL (FilmRoom.tsx:170). No `fetch(` or axios calls to any weather or location service.

## Supabase writes

Complete list of `.insert/.upsert/.update/.rpc` in app, components, lib, hooks, context, utils:

- app/parent-consent.tsx:35: `parental_consents` insert.
- app/(tabs)/profile.tsx:321: `rpc('delete_my_account')`.
- context/AthleteContext.tsx:232: upsert `{ id, state, updated_at }`.

No weather or location columns are written. The `state` blob is athlete app state; nothing in the code assigns location or weather into it.

## Built app config (`npx expo config --json`)

- plugins: expo-router, expo-font, expo-web-browser, expo-apple-authentication (no expo-location).
- ios.infoPlist: only `ITSAppUsesNonExemptEncryption: false`.
- android.permissions: none; blockedPermissions: none.
- No location permission string anywhere in the resolved config.
- app.config.js only sets name and bundleIdentifier by APP_VARIANT.
- Checked-in ios/ native project: no NSLocation* keys, and no location references in entitlements, Supporting, or AppDelegate.

## History (why it is clean)

Commit 73e87cf (2026-10-26) "Remove weather and location for launch" removed expo-location from package.json, package-lock.json and app.json, and deleted about 150 lines from app/(tabs)/index.tsx. Earlier commits 007940f (live weather via Open-Meteo) and 830cbb0 (weather modal) show that weather previously called a third party (Open-Meteo) with device location. That code is no longer in the tree.

Caveat: past builds that shipped before 73e87cf, if any went to TestFlight or review, would have requested location and contacted Open-Meteo. Only the current tree is clean.

## Answers

1. Does the app request location anywhere? **No.**
2. Is any location or weather data sent to Supabase or a third party? **No.**
3. Is the privacy label entry "Coarse Location" still accurate? **No.** It should be removed, since nothing collects location.
