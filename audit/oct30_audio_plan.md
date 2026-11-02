# Clutch Tracks audio plan, 2026-10-30

Branch: sprint-final-push @ b246c50. Read-only audit. No code, migrations, settings or installs. Nothing was created in Supabase.

Access note: the sibling folder `../Clutchr Baseball - Master/` IS readable. I read `_AUDIT_OUTPUT/03_CODE_ARCHAEOLOGY.md` in full (Sections B.0 and E drive this plan). I did NOT open the old player source in `09_Unsorted_Not_Clutchr/alternate_app_rebuild/2-26e7e59883a0/`, or `03_Content_and_Data/CONTENT_LIBRARY/audio/` (which holds `clutchr audio tracks master doc.docx`, binaural session guide, Gnaural sessions). Those should be read when building the context and mini player.

## 1. Current state

Dependencies and config
- `package.json`: `expo ~54.0.0` (line 17), `react-native 0.81.5`, `expo-av ~16.0.8` (line 20), `expo-speech ~14.0.8`. NO `expo-audio`, NO `react-native-track-player`, NO `expo-updates`.
- No `UIBackgroundModes` anywhere: not `app.json`, not `app.config.js`, not the generated `ios/ClutchrBaseball/Info.plist`. Background playback cannot work today.
- `app.json` plugins: expo-router, expo-font, expo-web-browser, expo-apple-authentication. No audio plugin.
- No `expo-updates`, so there is no OTA channel. Every JS change ships through an EAS build. The archaeology doc's "JS / OTA" labels do not apply; the real split is "needs a new native binary" vs "any build".

Existing audio code
- `lib/lessonAudio.ts`: one-shot lesson intro using expo-av `Audio.Sound` (audio mode with `staysActiveInBackground: false`, lines 134-138) and an expo-speech TTS fallback. `speakLessonIntro` has 0 call sites outside the file; only `stopSpeech` is imported (`app/lesson/[id].tsx`). Effectively dead apart from stop.
- `app/lesson/[id].tsx:6` imports expo-speech.
- `app/content/[id].tsx:123-139`: for a card with `audio_url`, the "Listen" button calls `Linking.openURL(audio_url)` (opens Safari). No in-app playback exists.
- No audio context, mini player, or player screen exists in this repo.

`content_cards` audio fields (`lib/supabase.ts:22-45`, `ContentCard`)
- `card_type: 'article' | 'exercise' | 'image' | 'video' | 'audio'`, `audio_url: string | null`, `is_premium: boolean`, `duration_minutes`, `thumbnail_url`, `visibility`. `app/(tabs)/locker.tsx:151` already styles `audio` (headset icon, `Colors.purple`).
- These fields are generic and weak for tracks (no kind, group, hz, use label, min age, sort order, path). A separate `audio_tracks` table is the better fit (section 3).

Locker structure and where audio slots in
- `app/(tabs)/locker.tsx` (581 lines). Groups `dugout | bullpen | grind` (`LOCKER_GROUPS` line 28, `GROUP_ORDER` line 62), chosen by keyword scoring in `inferLockerGroup` (line 121). Pro filter: `isPro ? cards : cards.filter(!is_premium)` (line 193). Pieces: `ScreenHeader`, search box, group chips, `FeaturedCard` (line 331), card list, skeletons. Active group is a module-level variable `_savedLockerGroup`.
- Tabs: `app/(tabs)/_layout.tsx`, five tabs (index, career, gamemode, locker, profile). Tab bar height 88 iOS / 64 Android (line 17-18).
- Root: `app/_layout.tsx` wraps `GestureHandlerRootView > AthleteProvider > ProProvider > ToastProvider` (lines 125-135).
- Recommended slot: do NOT add a fourth Locker group (audio would be keyword-scored into dugout/bullpen/grind, and 24 tracks would flood the card list). Instead add ONE entry row at the top of the Locker content ("Clutch Tracks") that routes to a new screen `app/tracks.tsx`. Keeps Locker logic untouched.
- Mini player: mount in the ROOT layout (`app/_layout.tsx`, inside `ProProvider`) so it persists across tabs AND stack screens (lesson, content). Bottom offset depends on route: above the 88/64 tab bar on tab routes, above the safe-area inset elsewhere (use `usePathname`/segments; `useBottomTabBarHeight` only works inside the tabs navigator). Hide it on `/auth`, `/age`, `/onboarding`, `/parent-consent`, `/ask-parent`, `/upgrade`.
- The archaeology doc's old mini player used a hard-coded 70px tab offset, a drag-scrub, persistence on every status tick, and stale-state skipping. Do not port those bugs (its list B.0 items 2-3, 6-7).

## 2. SDK, expo-audio, background and lock screen

- SDK 54. `node_modules/expo/bundledNativeModules.json` maps SDK 54 to `expo-audio ~1.1.1`. It is not installed yet.
- Verified against the published 1.1.1 type definitions (unpkg), not from memory:
  - Background: `setAudioModeAsync({ playsInSilentMode, interruptionMode, shouldPlayInBackground })`. `shouldPlayInBackground` defaults to false.
  - Lock screen and Control Center: `player.setActiveForLockScreen(active, { title, artist, albumTitle, artworkUrl }, { showSeekForward, showSeekBackward })`, plus `updateLockScreenMetadata(...)` and `clearLockScreenControls()`. Only one player can own the lock screen. The API exposes seek buttons, not next/previous.
- Exact config needed (do not apply yet):
  1. `npx expo install expo-audio` (adds `~1.1.1`).
  2. `app.json`, `expo.ios.infoPlist`: add `"UIBackgroundModes": ["audio"]` next to `ITSAppUsesNonExemptEncryption`.
  3. `app.json` plugins: add `["expo-audio", { "microphonePermission": false, "recordAudioAndroid": false }]`. Reason: the expo-audio config plugin (read from 1.1.1 source) only writes `UIBackgroundModes: audio` when `enableBackgroundRecording: true`, which ALSO adds Android microphone foreground-service and notification permissions. Playback-only apps should not use that flag, so set the Info.plist key by hand (step 2) and keep the plugin for microphone permission control only. Note the generated Info.plist currently has `NSMicrophoneUsageDescription` ("Allow $(PRODUCT_NAME) to access your microphone", line 48) with no recording feature; set `microphonePermission: false` and confirm after prebuild that the string is gone or intentionally kept, since Apple reviewers flag unused permission strings.
  4. Runtime, once at AudioContext init: `setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' })`.
  5. Verify after config, before building: `npx expo config --json` shows `UIBackgroundModes`; after an EAS build, check the Info.plist from the build artifact or by testing a locked phone.
- Native-build only: the new native module, the Info.plist key and the lock-screen/Now Playing integration take effect only in a new native binary (dev client and TestFlight). They do nothing in Expo Go and nothing from a JS reload on an old binary. Because there is no `expo-updates`, all audio code is in the next TestFlight build anyway, but this config must be in THAT build, so it is the first prompt in section 4.
- Remove `expo-av` in the same or the next native build (it is removed in SDK 55). `lib/lessonAudio.ts` is its only user. Two audio libraries configuring the iOS audio session at once is a risk; migrate or neutralise `lessonAudio.ts` in the same build.
- Android: not verified here (no `android/` folder, no Android build target seen). Treat Android background and lock-screen behaviour as untested.

## 3. Proposed Supabase design (do not create)

Premise to fix first: Pro status lives ONLY in RevenueCat on the client (`context/ProContext.tsx`, entitlement id `'Clutchr Pro'`; `Purchases.logIn(uid)` is called with the Supabase user id at `AthleteContext.tsx:476`). Postgres RLS cannot see it. For RLS to gate Pro rows, a server-visible copy is required. Two options:
- A (enforced, recommended): `user_entitlements(user_id uuid pk, is_pro boolean, updated_at)` kept current by a RevenueCat webhook handled by a small edge function using the service role. Works because RC `app_user_id` equals the Supabase uid. Adds one table, one function, one RC webhook config.
- B (launch-simple): skip the server copy; every authenticated user can read all track rows and the client gates with `isPro`. Same level of protection as `content_cards.is_premium` today (client filter only). Honest weakness: anyone can read the rows.
Recommendation: A, because the request asks for RLS enforcement.

### audio_tracks (proposed shape)

```
create table public.audio_tracks (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  kind          text not null check (kind in ('guided','binaural')),
  group_key     text not null check (group_key in ('before_game','anytime','after_night')),
  use_label     text not null,            -- e.g. Eyes closed awake, Sleep, Nap, Focus
  hz_label      text,                     -- e.g. 'Theta 6 Hz'; null for guided if not applicable
  duration_sec  integer not null check (duration_sec > 0),
  min_age       smallint not null default 13,
  is_free       boolean not null default false,
  audio_path    text not null,            -- path inside the public bucket, not a full URL
  sort_order    integer not null default 0,
  description   text,
  created_at    timestamptz not null default now()
);
alter table public.audio_tracks enable row level security;
```

Proposed RLS (option A):
- Helper: `public.is_pro()` SECURITY DEFINER, `select coalesce((select is_pro from user_entitlements where user_id = auth.uid()), false)`, with a locked `search_path`.
- Policy 1, `to authenticated using (is_free)`: everyone signed in reads free rows.
- Policy 2, `to authenticated using (public.is_pro())`: Pro users read all rows.
- No insert/update/delete policies, so only the service role (dashboard, migrations) can write.
- `min_age`: the age answer is device-local (`@clutchr_age_gate_v1`); the server only knows an under-13 account by a `parental_consents` row. Filter by `min_age` client-side using `ageGate.age_group`. If RLS enforcement is wanted, add `and (min_age <= 12 or not exists (select 1 from parental_consents where <uid column> = auth.uid()))` to both policies. Confirm that table's user-id column name first; I did not see its schema.
- Teaser option: if non-Pro users should see locked tracks (lock icon, upsell), RLS above hides those rows entirely, the same way Locker hides `is_premium` cards today. To show them, add a SECURITY DEFINER RPC `list_audio_tracks()` that returns every row with `audio_path` set to null when locked.

### Storage (public bucket, no expiring URLs)
- One public-read bucket, for example `audio-tracks`. Public buckets serve `getPublicUrl(path)` forever with no token, which fixes the old design's expiring signed URLs (archaeology, B.0 item 5). Writes only through the dashboard or service role; add no insert policy.
- Layout: `guided/<group_key>/<slug>-v1.m4a` and `binaural/<group_key>/<slug>-v1.m4a`. Bump the `-v1` suffix on re-upload; the public CDN caches aggressively.
- Encode as stereo AAC (m4a), 128 kbps or higher. Binaural beats REQUIRE true stereo with the two ears kept separate; do not ship mono or joint-stereo mp3. Estimate: 24 tracks at about 15 minutes and 128 kbps is roughly 14 MB each, about 340 MB total.
- The app stores `audio_path` and builds the URL with `supabase.storage.from('audio-tracks').getPublicUrl(path)`. Never persist a full URL (the old context persisted a URL that later expired).
- Honest limit: a public bucket cannot enforce Pro. A Pro file is protected only by RLS hiding its `audio_path` from non-Pro users plus an unguessable file name. Use a random suffix on Pro files (for example `<slug>-9f3a1c-v1.m4a`). Free files need no suffix. Accept this for launch; stronger protection needs private buckets with signed URLs, which you ruled out.

### Free track for a non-Pro user without breaking the paywall
- Free rows (`is_free = true`) are readable by RLS for everyone, so the free track loads and plays with no paywall step. Mark 1 or 2 tracks free; the free track alone should be a complete experience.
- Single client rule `canPlay = track.is_free || isPro`, used by the list, the picker and the AudioContext `play()` (defense in depth: `play()` refuses a locked track even if a screen forgets to check). The non-Pro queue contains only free tracks.
- While `isProLoading` is true, treat the user as non-Pro and do not flash locked states.
- Tapping a locked track (if teasers are used) goes to `router.push('/upgrade?source=audio')`, matching the existing `source=` pattern (`upgrade.tsx` header comment). The mood/situation picker only suggests from the tracks the user can play (non-Pro: free ones), so it never dead-ends in a paywall.
- Pro purchase mid-session: `ProProvider` already listens for customer-info updates; after upgrade, refetch `audio_tracks` and the full list appears.

## 4. Build order, as small prompts (run one at a time)

1. NATIVE CONFIG (first; this must be in the next TestFlight build). "Run `npx expo install expo-audio`. In `app.json` add `ios.infoPlist.UIBackgroundModes: ['audio']` and the plugin entry `['expo-audio', { microphonePermission: false, recordAudioAndroid: false }]`. Do not remove expo-av yet. Run `npx expo config --json` and show `UIBackgroundModes` and the plugin list. Run `npx tsc --noEmit` and confirm only the 6 baseline errors. Do not commit native build output. Then I will start a dev client build and a TestFlight build."
2. SQL file only. "Write `product/sql/CLUTCHR_AUDIO_TRACKS.sql` containing the `audio_tracks` table, the RLS policies and `is_pro()` from `audit/oct30_audio_plan.md`, plus the `user_entitlements` table. Do not run it. List the open questions (parental_consents user column, teaser RPC)."
3. Entitlement sync (option A). "Write a RevenueCat webhook edge function that upserts `user_entitlements.is_pro` for `app_user_id` = Supabase uid. Do not deploy. List the secrets and RC dashboard settings I must set."
4. Storage and seed. "Write a checklist and a seed SQL for the `audio-tracks` public bucket and the 24 `audio_tracks` rows from the master doc. Do not run anything."
5. Data layer. "Add `lib/audioTracks.ts`: `AudioTrack` type, `fetchAudioTracks()`, `trackUrl(audio_path)` using `getPublicUrl`, `canPlay(track, isPro)`, and a minimum-age filter. No UI."
6. AudioContext. "Add `context/AudioContext.tsx` on expo-audio: init audio mode (`shouldPlayInBackground`, silent-mode playback), `play/pause/seek/skip(15)`, single track plus an optional ordered queue, `setActiveForLockScreen` with title, artist (`Clutchr`), and a seek-forward/backward option, persist only `{trackId, positionSec}` and only on pause/background, expose `canPlay`-guarded `play()`. Mount it in `app/_layout.tsx` inside `ProProvider`."
7. Mini player. "Add `components/audio/MiniPlayer.tsx` and mount it in `app/_layout.tsx`. It sits above the tab bar on tab routes and above the safe-area inset elsewhere, hides on auth/onboarding/age/upgrade routes, shows title, play/pause and a hairline progress bar, and taps through to `/player`. Neutral colours only; no neon."
8. Full player. "Add `app/player.tsx` as a modal route registered in the root Stack: artwork-free layout, title, `use_label`, `hz_label`, scrub bar, play/pause, skip 15. One neon element only (the play button)."
9. Clutch Tracks screen and picker. "Add `app/tracks.tsx`: groups `before_game`, `anytime`, `after_night`, a kind toggle (Guided, Binaural), rows with `use_label`, `hz_label`, duration, lock state; plus `components/audio/TrackPicker.tsx`: a mood/situation chooser that only suggests one playable track and never auto-plays."
10. Locker entry. "In `app/(tabs)/locker.tsx` add one 'Clutch Tracks' entry row above the group chips that routes to `/tracks`. Do not change card grouping."
11. Retire expo-av. "Migrate `lib/lessonAudio.ts` to expo-audio or delete its dead branches, keep `stopSpeech`, then remove `expo-av` from `package.json`. This removal rides in the next native build."
12. Device QA on TestFlight: background play, lock-screen controls, screen lock, phone-call and other-app interruption, silent switch, Pro versus free, upgrade mid-session, sign-out and Delete Account stopping playback (add `audio.stop()` to the sign-out/delete path in `profile.tsx` and `AthleteContext.signOut`).

## 5. Conflicts with brand rules

- "Coming soon": none found in `app`, `components`, `lib`, `constants` (case-insensitive search for "coming soon"/"soon"). Keep it that way: if fewer than 24 tracks are ready at launch, ship only the ready rows. Do not add placeholder tracks.
- Em dashes: 183 occurrences in code, but every one is in a code comment, JSX comment, or `__DEV__` `console.warn`; none are in user-visible strings in `app/`, `components/`, `lib/`, `constants/`, `context/`, `hooks/`. No conflict in shipped UI. Database content (lesson and card text in Supabase) was not scanned. New track titles, descriptions and `use_label` values must contain none.
- Emoji: no true emoji found. Three user-visible dingbat symbols exist: `components/MyPlaybook.tsx:415` toast text "Cue saved to Playbook ✓", `components/lesson-steps/BuildYourRep.tsx:161` (✓), `components/PitchSequenceChess.tsx:88` ('✕'). These are text symbols (U+2713, U+2715), not colour emoji, but borderline under a strict "no emoji" rule. Do not use similar glyphs in audio UI; use `Ionicons` or `StrokeIcon`.
- One neon element per screen: the neon is `Colors.primary #39FF88` (`constants/theme.ts:29`). A persistent mini player is the real risk: it appears on every screen, many of which already have a neon CTA, progress ring or active tab state. Make the mini player neutral (surface, border, white icon, grey hairline progress) and reserve neon for the full player's play button and the Clutch Tracks screen's single primary action.
- `Colors.purple` for audio cards in Locker (`locker.tsx:151`) is an off-brand accent already; do not extend it to tracks, and do not colour-code guided versus binaural. Use text labels.
- Locker's type badges already use five accent colours (primary, warning, info, purple, danger, `locker.tsx:147-153`). That predates this work; the Clutch Tracks entry row should be neutral so it does not worsen it.
- Copy risk, not a repo conflict: avoid medical claims (sleep or anxiety treatment) in track descriptions, and add a "use headphones" note for binaural tracks. Under-13 accounts exist (parent consent flow), which is why `min_age` matters; decide which `use_label` values (for example Sleep) are suitable under 13.
