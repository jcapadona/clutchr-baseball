# Legal gap list: Privacy Policy and Children's Privacy Notice vs. the app, 2026-10-30

Read-only audit. No policy text edited, nothing pushed.

## Sources

- **Legal pages:** no local clone of `clutchr-legal` exists (searched under `/Users/jon`), and `gh` is not installed. I read the public repo `github.com/jcapadona/clutchr-legal` (branch `main`, HEAD c72e764, last commit 2026-07-07) via the GitHub API and raw URLs with curl. Files: `privacy.html`, `childrens-privacy.html`, `support.html`, `terms.html`.
- **Pages checked:** Privacy Policy ("Last updated June 28, 2026"), Children's Privacy Notice ("Effective/Last Updated June 30, 2026"), and the support page. I did not review the Terms.
- **App:** branch `sprint-final-push` @ b246c50.
- **Schema limit:** there is no `supabase/` directory and no migration in the repo. The only schema evidence is the client code, the table comment in `context/AthleteContext.tsx`, and earlier audits. The `parental_consents` table definition and the `delete_my_account` RPC body are not in the repo. Both need confirming in the Supabase SQL editor. Items that depend on them are marked **[verify in Supabase]**.

## What the code does (the source of truth used below)

- **Supabase tables the app writes:** `parental_consents` (insert, `app/parent-consent.tsx:35`) and `athlete_profiles` (upsert of one `state` JSON blob, `context/AthleteContext.tsx:231`). Sync is gated behind consent (commit 34ffd45).
- **Consent row columns written** (`app/parent-consent.tsx:35-41`): `parent_user_id`, `parent_email`, `child_first_name: null`, `child_birth_year`, `policy_version` (`'2026-10-21'`). The timestamp is presumably a DB default **[verify in Supabase]**.
- **`athlete_profiles.state` fields** (`AthleteState`, `AthleteContext.tsx:58`): `first_name`, `primary_role`, `is_two_way`, `level_band`, `season_phase`, `biggest_struggle`, `self_ratings` (5 numbers), `routine_consistency`, **`birth_year`**, **`age_group`**, `total_xp`, `completed_lessons`, `saved_routines`, `playbook` (5 short strings, input capped at 40 characters, `components/MyPlaybook.tsx:251`), streak fields, `capVoice`, and timestamps.
- **Age gate** (`lib/ageGate.ts`): stores a **birth year**, not an age bracket, plus a derived `age_group` of `under13` or `13plus`. Stored on-device under `@clutchr_age_gate_v1` in AsyncStorage. Birth year also goes to Supabase in `athlete_profiles.state` and in `parental_consents.child_birth_year`.
- **Sign-in methods:** Google OAuth (`app/auth.tsx:66`), native Sign in with Apple (13+ only, `auth.tsx:43`; requests name and email scopes), and email/password with sign-up confirmation and password reset (`app/email-auth.tsx`, `app/reset-password.tsx`). The email path has a parent path for under-13.
- **Third-party services in the shipped app:** Supabase (auth and data), RevenueCat and Apple (purchases; `Purchases.logIn(supabaseUserId)`), and Expo push (`getExpoPushTokenAsync`). The token is kept only in AsyncStorage. There are no analytics or ad SDKs in `package.json`, and no location, weather or microphone-recording code.
- **Local-only data (AsyncStorage, not Supabase):** game-day debrief (win, miss, feeling, cue; custom cue capped at 32 characters, `gamemode.tsx:2354`), saved routine cards, missions progress, mental game score, streak reminders.

## Gaps: Privacy Policy (`privacy.html`)

| # | Gap | What to add or change |
|---|---|---|
| P1 | Geolocation is described as collected ("Geolocation Information… weather display", Section 1). | Remove it. Location and weather were removed (commit 73e87cf). No location permission, library or API call remains. |
| P2 | CCPA table row G, "Geolocation data: YES". | Change to NO. The "retain as long as the user has an account" line for category G goes too. |
| P3 | The policy says it collects names, usernames and "contact or authentication data" generically. It never names the real data. | List what is stored: first name or display name, role, level, season phase, struggle selections, five self-ratings, XP, completed lessons, streaks, saved routines and Playbook cue text. State that it is stored in Supabase and is used only to run the app. |
| P4 | The policy says nothing about Sign in with Apple or email/password. The social login section and summary mention only Google. | Add Apple (name and email scopes, possibly a private-relay address) and email/password (email plus a password held by Supabase Auth, with confirmation and reset emails). Update Sections 1 and 5 and the Google API note so Apple and email are covered. |
| P5 | Social login data ("name, email address, and profile picture") is stated generically. | Say exactly which fields come from Google and Apple. The code reads the email, the name for the first-name default (`onboarding.tsx:97`) and the user ID. Remove "profile picture" unless it is used. |
| P6 | The policy never mentions the age gate or birth year. | Add that the app asks for **birth year** (not full date of birth) at first launch. It is stored on the device and in the account record, and used to decide whether a parent must approve. The policy also needs a note that an under-13 answer is locked on the device. |
| P7 | CCPA row C (age, date of birth) says YES but nothing explains it. | Keep YES. Tie it explicitly to birth year and the derived under-13 / 13+ flag. |
| P8 | The policy does not describe the Clutchr IQ quiz and diagnostic, archetype results or Situation Room logged moments. **These features are not in the code on this branch or on `main`.** A search for IQ-quiz, archetype and situation-room code found only the Pitch IQ and Field IQ drills and a "Baseball IQ" home tile that is flagged off. | If they ship in this launch, add them as structured picks and scores stored in Supabase with no free text. As the code stands today, nothing is stored for them and no policy text is needed. Confirm with Jon whether they are in the launch build. |
| P9 | Audio and listening data. The CCPA table says no audio is collected, and no audio is collected today. The app has only a lesson TTS intro and a "Listen" link that opens a URL in Safari. The Clutch Tracks player is still a plan (`audit/oct30_audio_plan.md`). Nothing about listening is stored. | No change for the current build. If Clutch Tracks ships with play history or favourites in Supabase, add a line then. Keep "no audio recordings". Also note `NSMicrophoneUsageDescription` is still in the Info.plist with no recording feature; either remove it or keep the policy's "no recordings" wording explicit. |
| P10 | Free-text answers. The policy does not mention them. | Add one line: Playbook cues (40 characters) and similar short answers are stored in Supabase only. Custom debrief cues stay on the device. |
| P11 | "No third-party ads or analytics" is not stated plainly. The policy says "internal analytics and reporting purposes" and "To identify usage trends" (Sections 1 and 2), which implies analytics the app does not have. | State that there are no third-party ads and no third-party analytics. Reword or remove the "analytics" and "usage trends" wording. Keep the "no sale or sharing" sentence. |
| P12 | Third parties. Section 4 lists none, and the summary says "We do not collect any information from third parties." | Name the processors: Supabase (storage and auth), RevenueCat and Apple (purchases), Expo (push notifications). Reconcile the summary line with the social login data received from Google and Apple. |
| P13 | Push notifications. The policy says only that the app may request permission. | Add that the app registers an Expo push token and that local reminders are scheduled on the device. The token is held on the device only. Parents can turn reminders off in device settings. |
| P14 | Delete Account. Section 8 says "log in to your account settings… we will deactivate or delete" and "we may retain some information… to prevent fraud." The app now has an in-app **Delete Account** (`profile.tsx:317`, `rpc('delete_my_account')`) that also clears RevenueCat login, scheduled reminders, local storage and the session. | Describe the in-app path (Profile, Delete account), what it removes, and what stays. **[verify in Supabase]** that the RPC removes `athlete_profiles`, the `auth.users` row, and either keeps or removes `parental_consents`. Apple token revocation is **not** done yet (`audit/oct30_apple_revocation_plan.md`), so do not claim Apple access is revoked. |
| P15 | Retention of the consent record and the age lock. The policy says nothing about either. | State that the parental consent record (parent email, child birth year, policy version, timestamp) is kept after account deletion if that is the intent **[verify in Supabase]**, plus why (proof of consent). Also state that the on-device age answer survives deletion by design (`profile.tsx:333`). |
| P16 | Sections that describe things the app does not do (see the list below). | Remove or correct. |
| P17 | Contact details are inconsistent. The policy uses `privacy@clutchrbaseball.com`, `joncapadona1@gmail.com`, a postal address, and `support@clutchrbaseball.com` on the support page. The app links to `clutchr.app/privacy` and `clutchr.app/terms` (`parent-consent.tsx`, `auth.tsx`). | Pick one privacy contact, one support contact and one domain, and use them everywhere. Confirm `clutchr.app/privacy` serves this repo's `privacy.html`. Replace the personal Gmail on a public policy with the privacy address. |
| P18 | Date of last update. The policy reads "June 28, 2026" and the Children's Notice reads "June 30, 2026". The app records `POLICY_VERSION = '2026-10-21'` (`lib/ageGate.ts:5`), a version that matches no published page. | Update both pages' dates when the text changes, and make the app's `POLICY_VERSION` match a real published date. Otherwise the stored consent version points at nothing. |
| P19 | The policy header says "Last updated" while Section 12 says "Revised". | Use one term. Minor. |
| P20 | The footer reads "created using Termly's Privacy Policy Generator". | The text is template-derived and has not been reconciled with the app. This audit list is the reconciliation work. |

## Gaps: Children's Privacy Notice (`childrens-privacy.html`)

| # | Gap | What to add or change |
|---|---|---|
| C1 | Section 3 says children sign in "through Google sign-in" only. | The under-13 path is Google or email/password through a parent account. Apple is hidden for under-13. State that the child's account is signed in with the parent's or guardian's account email. |
| C2 | Section 3 lists "email address and display name". | The app stores a **first name**, not a free display name, in Supabase. The parent consent row stores a **parent** email. Say that explicitly. |
| C3 | Section 3 says "age band". The app stores a **birth year** and a derived under-13 / 13+ flag. | Replace "age band" with "birth year". Say it appears in the parental consent record and the athlete profile. |
| C4 | Section 3 lists "Approximate location for weather features" and the no-GPS line. | Delete the location bullet. Replace the no-GPS line with a plain "we do not collect location". |
| C5 | The notice has no description of the parental consent record. | Add: when the parent approves, we store the parent's email and user ID, the child's birth year, the policy version and a timestamp. We do not store the child's name in that record (the code writes `child_first_name: null`). Confirm the table has no name column in use **[verify in Supabase]**. |
| C6 | Section 4 says a parent "should set up the account or directly supervise". The app enforces a consent screen with an "I am the parent or guardian and I agree" button. | Describe the real flow: under-13 answer, then ask-parent screen, then the parent signs in, then the consent screen, then onboarding. No data syncs before consent (commit 34ffd45). |
| C7 | Section 3 lists in-app activity but not the parts that are actually stored. | Add: self-ratings, struggle selections, XP, streaks, completed lessons, saved routines, Playbook cue text (short, capped). Say Clutchr IQ and Situation Room data appear only if those features ship (see P8). |
| C8 | Section 5 and 6 say the app "does not run third-party ads". Section 6 omits Expo push. | Add Expo as a service provider for reminders. Keep "no ads, no analytics" (this matches the consent screen's own "No ads / No analytics / No location / No recordings"). |
| C9 | Section 7 and 8: deletion is "by email within 30 days". The app has an in-app Delete Account. | Add the in-app option. State whether the under-13 account can use it, what it removes, and what the consent record retains **[verify in Supabase]**. |
| C10 | The notice says "we do not collect… photos, video, audio recordings, or contact lists". | Accurate today. Keep. Add the Clutch Tracks note only if listening history is stored later. |
| C11 | The date (June 30, 2026) predates the 2026-10-21 policy version the app records. | Update the date and align with `POLICY_VERSION` (see P18). |
| C12 | The footer says this is a "general template… recommend review by a licensed attorney". | Remove or resolve before launch. Review by an attorney is still advised for COPPA text. |
| C13 | The notice does not say that an under-13 answer is locked on the device or that the birth-year gate leans conservative (someone who could still be 12 this year counts as under 13, `ageGroupFor`). | Add one plain sentence. |
| C14 | The in-app consent screen links to the privacy policy and Terms, but not the Children's Privacy Notice. | Link `childrens-privacy` from `parent-consent.tsx` (a code change, noted here only because it is a legal-surface gap). |

## Things the policy says that the app no longer does

1. Location and weather (P1, P2, C4). Removed in 73e87cf. No weather API call remains. Earlier builds used Open-Meteo, so a past TestFlight build could differ; that is not in the current tree.
2. "Internal analytics and reporting purposes" and "identify usage trends" (P11). There is no analytics code.
3. "Fulfill and manage your orders… returns, and exchanges" (Section 2). Purchases are Apple in-app subscriptions only.
4. "Enable user-to-user communications" (Section 2). The app has no messaging.
5. "Payment Data… payment instrument number and security code" (Section 1). Apple and RevenueCat handle payments. The app never sees card data. The sentence is a template remnant and could be shortened.
6. "Marketing or events" (intro). Nothing in the app collects data for marketing.
7. "Profile picture" from social login (P5). Not used.
8. Rows B, D, F and several others are marked NO. Row K, "Inferences… YES", is not backed by any code (no profiling). Confirm or change it to NO.
9. Age band (C3). Birth year is what is stored.

## Open verifications (need Supabase access, not available from the repo)

- `parental_consents` columns and defaults (a timestamp column, a unique constraint on the parent). The code relies on error 23505 for duplicates.
- Body of `delete_my_account`: which tables it deletes, whether it removes `auth.users`, and whether it leaves `parental_consents`.
- Whether any audio, quiz, archetype or Situation Room table exists in the live project (none is referenced by the app code).
- Whether `clutchr.app/privacy` is served from this repo, since the policy itself uses `clutchrbaseball.com` addresses.
