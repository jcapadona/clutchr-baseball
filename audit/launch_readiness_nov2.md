# Launch readiness inventory, 2026-11-02

Branch `sprint-final-push` @ 618c8a4, working tree clean. Read-only audit: no code changed, no SQL run, nothing touched in Supabase or on a device. "Not in the repo" means I could not see it; the live Supabase project may differ. Target: submit Nov 11 (9 days).

## Status table

| # | Item | Status |
|---|---|---|
| 1 | expo-updates (OTA) | Not started |
| 2 | Audio player | Not started (plan only) |
| 3 | Apple delete account | Built and wired in code; server side not verified |
| 4a | Clutchr IQ 12-question archetype quiz | Not started |
| 4b | Clutchr IQ 100-question diagnostic | Partly built (content and schema exist outside the repo; no app code) |
| 5 | Situation Room | Not started |
| 6 | Try it first guest mode | Not started |
| 7 | Email/password sign in | Built and wired, not phone-tested |
| 8 | Locker guides and printables | Partly built |
| 9 | Heaven scroll for Locker | Not started |
| 10 | Game Day mode | Partly built (as the Game Mode tab; no real "game day" trigger) |

## 1. expo-updates: not started
- `package.json` has no `expo-updates`. `app.json` has no `updates` block or `runtimeVersion`. `eas.json` has no `channel` on any build profile.
- `app.json` `version` is "1.0.0" with `appVersionSource: remote`, so a runtime version policy still has to be chosen.
- Missing: `npx expo install expo-updates`, `runtimeVersion` (policy `appVersion` is the simplest), `updates.url`, a `channel` per EAS profile (`production`, `preview`), and a first native build that contains it. Updates only work on builds made after it is added, so it has to be in the Nov 11 binary or it is useless for v1.0.
- Note from `audit/oct30_audio_plan.md`: without it, every JS fix ships through a full EAS build and App Review.

## 2. Audio player: not started
- `package.json`: only `expo-av ~16.0.8` and `expo-speech`. No `expo-audio`.
- `app.json`: no `UIBackgroundModes`, no audio plugin. The generated `ios/ClutchrBaseball/Info.plist` has none either, and still has `NSMicrophoneUsageDescription` with no recording feature (a review flag).
- Code: `lib/lessonAudio.ts` is a one-shot lesson-intro player plus TTS fallback (`staysActiveInBackground: false`, line 136). `speakLessonIntro` has no call sites; only `stopSpeech` is used. `app/content/[id].tsx:123-139` "Listen" just calls `Linking.openURL(audio_url)` and opens Safari.
- No player screen, no audio context, no mini player, no `audio_tracks` table, no audio files in `assets/`. `ContentCard.audio_url` and `card_type: 'audio'` exist in `lib/supabase.ts` but I did not see any audio rows (not queried).
- Exists: a full design in `audit/oct30_audio_plan.md` (expo-audio ~1.1.1, `app/tracks.tsx`, root-layout mini player, `audio_tracks` schema, RLS option A/B). Source audio sits in the sibling `Clutchr Baseball - Master/03_Content_and_Data/CONTENT_LIBRARY/audio/` and has not been uploaded anywhere I can see.
- Missing: everything beyond the plan. This is a native change, so it needs a new build and has the same must-ship-in-Nov-11 constraint as item 1.

## 3. Apple delete account: built and wired in code
Matches the commit. `git show --stat 618c8a4` touches exactly `app/(tabs)/profile.tsx` (+40/-6) and `supabase/functions/delete-account/index.ts` (+142). Earlier `7b839a3` added the in-app flow.
- Client, `app/(tabs)/profile.tsx:318-372`: Apple users re-run `AppleAuthentication.signInAsync({ requestedScopes: [] })` to get a fresh `authorizationCode`; cancel stops quietly; then `supabase.functions.invoke('delete-account', { body })`. Local cleanup (RevenueCat logOut, notifications, signOut, AsyncStorage wipe except the age gate) runs only if `data.deleted === true`. Routes to `/age` or `/auth`. Delete row is at line 518, confirm modal at 527.
- Edge function: validates the JWT, detects Apple identity, exchanges the code for a refresh token and revokes it (`/auth/token` then `/auth/revoke`), tries each id in `APPLE_CLIENT_IDS` (prod bundle first, then dev). A failed revoke is logged and never blocks deletion. Then `rpc('delete_my_account')` with the caller's JWT.
- Not verifiable from the repo, all of which must be confirmed before submit:
  1. The function is deployed. There is no `supabase/config.toml` or migrations folder in the repo.
  2. Secrets `APPLE_PRIVATE_KEY`, `APPLE_KEY_ID`, `APPLE_TEAM_ID`, `APPLE_CLIENT_IDS` are set in Supabase.
  3. The body of `delete_my_account` (what it deletes, and whether it removes the `auth.users` row). The function relies on it for the actual deletion. The oct30 plan says the body lives only in the Supabase project.
  4. It has never been tested on a device with a real Apple account. Note: Sign in with Apple authorization codes are single-use and expire in 5 minutes, and the native flow's client id must match the bundle id, so a TestFlight test with a real Apple account is the only real proof.
- Also: the Privacy Policy still describes deletion differently (`audit/oct30_legal_gap_list.md` P14, C9).

## 4. Clutchr IQ

### 4a. 12-question archetype quiz: not started
- No code, no content, no schema anywhere I searched: the repo, `../Clutchr baseball IQ STUFF`, and a grep for "archetype" returned nothing. There is no archetype list or scoring rule I can see.
- Missing: the 12 questions, the archetype set and scoring map, a result screen, and storage. Onboarding (`app/onboarding.tsx`) is name, position, level, season, struggle, complete, with no quiz step.

### 4b. 100-question diagnostic: partly built, outside the app
- In `/Users/jon/Desktop/Clutchr baseball IQ STUFF/` (not in the repo): `biq_item_bank.json` (instrument "Clutchr Baseball IQ 1.0.0-field", 166 item families, 18 subtests, 6 domains), `biq_schema.sql` (families, variants, answer-key table with RLS and no policies so keys stay server-side), `biq_seed.sql` (970 lines), `biqEngine.ts` (313 lines, scoring and form blueprint; forms D and P).
- In the app: nothing. No `/biq` route (`app/` has no biq file). `app/(tabs)/index.tsx:44-46` has `BIQ_RUNNER_READY = false` and `BIQ_LESSONS_TO_UNLOCK = 3`, and the Baseball IQ home tile is hidden. `lib/mentalGameScore.ts` is a stand-in with a TODO to delete it.
- The design keeps answer keys on the server, so scoring needs an edge function using the service role. That function does not exist.
- Missing: confirm the schema/seed was ever run in Supabase, copy the engine into `lib/`, build the runner screen (several item formats: the bank's `format` field covers more than multiple choice), an edge function for keys and scoring, a results screen, and the `/biq` route. The bank is labelled "field" version and norms are provisional, so product copy must not present scores as validated. This is the biggest build on the list.

## 5. Situation Room: not started
- No route, component or data. Greps for "situation room" return nothing in code. The oct30 legal list says the same (P8): not on this branch or on `main`.
- Related only: `app/(tabs)/gamemode.tsx` has scenario content with a `situation` string field (lines 65, 174-293) for in-tool scenario picks, and `components/PressureReplay.tsx`, `ThrowDecisionBoard.tsx`, `PitchSequenceChess.tsx` exist as lesson interactions. None is a Situation Room.
- Missing: a definition of what it is, plus content, screen and route. Needs a definition from you before any estimate is meaningful.

## 6. Try it first guest mode: not started
- `app/_layout.tsx` `AuthGate` sends any signed-out user to `/age` then `/auth` (lines 55-85). There is no guest session, no anonymous sign-in, and no "Try it first" button in `app/auth.tsx`.
- Missing: choose the mechanism (Supabase anonymous sign-in is the least code, or local-only state), gate carve-outs (guests cannot reach purchases or sync), the upgrade path from guest to account that keeps progress, and the age gate behaviour (it must still run first). Guest also interacts with delete account and the legal pages, which assume a real account. Apple Guideline 5.1.1 pushes toward allowing use without sign-in for non-account features, so this has a review angle too.

## 7. Email and password sign in: built and wired, not phone-tested
- Files: `app/email-auth.tsx` (modes signin, create, forgot, confirm_sent, reset_sent; forgot-password cooldown), `app/reset-password.tsx`, `app/auth/callback.tsx`, `lib/emailAuth.ts` (error copy, link parsing, `applySessionFromUrl` for both implicit tokens and PKCE code), entry button at `app/auth.tsx:226`, gate handling in `app/_layout.tsx` (`email-auth`, `reset-password` exempt).
- Redirect URLs: `clutchrbaseball://auth/callback` and `clutchrbaseball://reset-password`. These must be in the Supabase Auth allowed redirect list, and the scheme `clutchrbaseball` is set in `app.json`. Not verifiable from the repo.
- Untested paths: confirmation link from a real mail client, reset link on a device (cold start versus app already open; `reset-password.tsx` reads `Linking.useURL`), the 8-character minimum matching the Supabase project setting, the under-13 parent path, and the Supabase email rate limit (the default built-in sender is very low volume, so a custom SMTP is likely needed for launch).

## 8. Locker guides and printables: partly built
- From Supabase: everything in the Locker. `app/(tabs)/locker.tsx` calls `fetchContentCards()` (`lib/supabase.ts:63`, table `content_cards`); detail at `app/content/[id].tsx` renders `body_markdown` via `components/MarkdownRenderer.tsx`; free versus Pro is a client filter on `is_premium` (locker.tsx:193). Per CURRENT_STATE.md there are 278 cards across 15 categories in two naming systems.
- Grouping is keyword scoring into Dugout / Bullpen / The Grind (`inferLockerGroup`, locker.tsx:121), not `content_category`. The taxonomy migration is written but, per CURRENT_STATE.md, was not run against production (this may be stale; I did not query).
- Local: Game Mode "print cards". `app/(tabs)/gamemode.tsx` `PrintCardScreen` (line ~1996) builds a text string and calls `Share.share`. The tool definitions (pregame, in-game, postgame, slump) are hard-coded in the app file.
- No real printables: there is no PDF generation (`expo-print` and `expo-sharing` are not installed), no PDF or download field in the card model, and no PDFs in `assets/`. The button label "Share / Screenshot / Print" is the whole feature.
- Missing: decide what a printable is (PDF in storage versus generated), a field for it on `content_cards` or a new table, a viewer/share path, and an actual list of guides. Also `video`/`youtube_url` cards open out to the browser.

## 9. Heaven scroll for Locker: not started
- No code, notes or assets match "heaven" anywhere in the repo or its docs. I do not know what the design is. The Locker is currently a plain `ScrollView` with chips, a featured card and a list (`locker.tsx`). If you can describe it (a vertical parallax/ascending scroll?), I can scope it. It is the best candidate to cut.

## 10. Game Day mode: partly built
- The Game Mode tab (`app/(tabs)/gamemode.tsx`, 3,681 lines) is the pregame / in-game / postgame / slump toolkit, with buckets, a role- and intent-aware tool picker (`getTools`, ~line 1749), a debrief saved locally (`gm_last_postgame_debrief`), Pro gating on `isPremium`, and the print card share. This is the closest thing to "Game Day mode".
- Not wired: there is no real game-day state. `useHomeGreeting` takes `isGameDay` (`hooks/useMicrocopy.ts:111`) but nothing in `app/` or `context/` ever sets it. Microcopy pools `gameDay` and `gameDayMorning` exist in `constants/microcopy.ts`. `scheduleMorningGameDayReminder` exists in `lib/notifications.ts:77` but I found no schedule to feed it. The Home "Upcoming Game" card is flagged off (`HOME_FLAGS`, all hidden for v1) and the Home buttons toast "Coming soon" (`index.tsx:663,668`).
- Missing: a way to mark today as game day (schedule or a toggle), the Home entry point that switches on it, and a decision on whether the existing Game Mode tab is the feature or a separate mode is wanted.

## Other launch findings
- `app/dev-qa.tsx` ships in the production bundle (known P2 in CURRENT_STATE.md). 44 em dashes in UI copy and two "Coming soon" toasts are listed in `audit/week4_final_sweep.md`; the sweep may predate fixes.
- `eas.json` has the Supabase publishable key and RevenueCat iOS key inline in the production profile. Both are public-by-design client keys, but confirm that is intended.
- A `AuthKey_BVR9DZW33J.p8` file sits in `../Clutchr Baseball - Master/`. That is an Apple private key; it is outside the repo, so not a commit risk, but be sure the same file is not what is stored in the Supabase `APPLE_PRIVATE_KEY` secret from a synced or shared folder.
- Legal: `audit/oct30_legal_gap_list.md` lists about 20 policy gaps. Privacy and Children's notices still mention location and weather, omit Apple and email sign in, and name no processors. The app's `POLICY_VERSION` `'2026-10-21'` matches no published page. If Clutchr IQ or Situation Room ship, the policy needs to cover them (P8).
- CURRENT_STATE.md is stale (it describes Sprint 3 and says Sprint 4 not started). Do not rely on it for status.

## Scope decisions (Nov 2)

- Heaven scroll (Locker as a vertical feed, a port from another app) and Situation Room (replaces the five quick decisions in Game Mode, structured picks only, Playbook stays) move to the first OTA update after launch. They are not planned into v1.0.
- The 100-question diagnostic runner ships only if it passes a device test by Nov 8. Otherwise `BIQ_RUNNER_READY` stays false.
- Guest mode ("Try it first") is kept for v1.0 and is built right after build #1.
- Situation Room schema sketch is deferred. Heaven scroll starts with a read-only report on the source app once its location is given.

## Three biggest risks to a Nov 11 submit (ranked)

1. **Native-binary scope is not locked, and two native changes are not started.** expo-updates (item 1) and expo-audio plus `UIBackgroundModes` (item 2) both need a new native build and must land in the submitted binary. Without expo-updates, any bug found after review costs a full build and another review cycle. Every day spent on JS features without these in a build raises the chance that the last build before Nov 11 is the wrong one. Local builds are blocked by a CocoaPods/Ruby issue, so EAS is the only path, and each cloud build is slow.
2. **Too many unstarted features for 9 days, led by Clutchr IQ.** Items 4a, 4b, 5, 6 and 9 are all not started, and 4b needs a runner, an edge function for server-held keys and a results screen on a 166-family bank. Items 5 and 9 have no spec I can find. Trying to ship all of them guarantees a half-built feature in review. Anything half-finished must be flagged off (the `HOME_FLAGS` pattern already exists), not removed late.
3. **Unverified server and device behaviour on the review-critical paths.** Apple delete (item 3) has never run end to end: the edge function deployment, the Apple secrets and the `delete_my_account` body are all unseen, and Apple rejects for a delete that does not work or leaves the Apple grant. Email sign in (item 7) is untested on a phone and depends on Supabase redirect allow-listing and email sending limits. Add the Privacy Policy drift (stale location and sign-in text, mismatched version), which Apple and the Children's category check, and the review risk is mostly outside the code.

## Suggested build order (Nov 2 to Nov 11)

Rule: freeze the native binary early; after that only JS changes go in, and incomplete features stay flagged off.

- **Day 1 (Nov 2-3): verify, then lock native.** Read `delete_my_account` in the SQL editor, deploy `delete-account`, set its Apple secrets. Add expo-updates (runtimeVersion, channel on each profile) and expo-audio with `UIBackgroundModes` and the microphone string fixed. Start a preview EAS build. Phone-test email sign in, password reset and Apple delete on that build.
- **Day 2 (Nov 4): decide scope.** Write one paragraph each for Situation Room, Heaven scroll and the archetype quiz, or cut them. My recommendation: cut Heaven scroll and Situation Room for v1.0 and ship them through OTA in v1.1 once expo-updates is live.
- **Days 3-4 (Nov 5-6): guest mode ("Try it first").** Highest review value and lowest build cost. Anonymous Supabase session, carve-outs, upgrade-to-account path, age gate kept first.
- **Days 4-6 (Nov 6-8): Clutchr IQ.** Do the 12-question archetype quiz first (small, self-contained, can sit in onboarding). Then a reduced diagnostic runner if time allows, behind `BIQ_RUNNER_READY`. Ship the full 100-question runner only if it passes a device test by Nov 8; otherwise leave the flag false.
- **Day 6-7 (Nov 8-9): audio, minimal.** Tracks screen plus mini player from the oct30 plan; lock-screen controls only if the basic player is stable. Option B (client gating) for launch.
- **Day 8 (Nov 10): content and legal.** Update the Privacy Policy and Children's notice, align `POLICY_VERSION`, remove `dev-qa`, clean the em dashes and "Coming soon" toasts, wire a basic game-day toggle or leave Game Mode as is.
- **Nov 10 evening: release candidate.** Final production EAS build, TestFlight smoke test on a real phone (purchase, delete, email auth, guest), App Store metadata and review notes (include a demo account).
- **Nov 11: submit.** Keep the build before that as the fallback.
