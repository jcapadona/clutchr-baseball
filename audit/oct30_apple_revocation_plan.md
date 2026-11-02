# Apple token revocation on Delete Account: plan, 2026-10-30

Branch: sprint-final-push @ b246c50. Read-only audit. No code, migrations or settings changed.

## 1. Delete Account flow today

Lives in `app/(tabs)/profile.tsx`.

- Entry row "Delete account": line 490. It opens a confirm modal (lines 499-530): "Delete your account?", button "Delete everything" (or "Try again" after a failure).
- Handler `handleDeleteAccount` (lines 317-344), in this order:
  1. Guard on `deleting`, set `deleting`, clear `deleteFailed` (318-320).
  2. `supabase.rpc('delete_my_account')` (321). On error: `console.warn`, `deleteFailed = true`, stop. Nothing local is touched (322-328).
  3. `Purchases.logOut()` (RevenueCat, errors ignored) (330).
  4. `Notifications.cancelAllScheduledNotificationsAsync()` (331).
  5. `signOut()` from `context/AthleteContext.tsx:400`: sets `intentionalSignOut`, `supabase.auth.signOut()`, removes `ATHLETE_KEY`, clears athlete state and session.
  6. Wipes all AsyncStorage keys except `@clutchr_age_gate_v1` (334-336).
  7. Closes the modal, then `router.replace('/auth')` if an age gate exists, else `/age` (342-343).
- Not done today: no Apple call of any kind. No Apple token is revoked.

What the RPC deletes server-side: UNKNOWN from the repo. There is no `supabase/` directory and no migration containing `delete_my_account`; `git log -S` finds only the client commit 7b839a3. The function body lives only in the Supabase project. Before building, read it in the SQL editor:
`select pg_get_functiondef('public.delete_my_account'::regproc);`
Tables the app itself writes: `athlete_profiles` (AthleteContext.tsx:231, 304) and `parental_consents` (parent-consent.tsx:35, AthleteContext.tsx:431). Confirm the RPC removes both plus the `auth.users` row.

## 2. Apple sign-in code and tokens

`app/auth.tsx` `handleAppleSignIn` (lines 115-149):
- Creates `rawNonce = Crypto.randomUUID()`, sends `SHA256(rawNonce)` as `nonce` to `AppleAuthentication.signInAsync` with scopes FULL_NAME and EMAIL (120-132).
- Uses `credential.identityToken` only (134), passed to `supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce: rawNonce })` (136-140).
- `credential.authorizationCode` is returned by the library (`expo-apple-authentication` types, line 150) but is never read or sent anywhere.
- No Apple refresh or access token is stored anywhere: not in AsyncStorage, not in Supabase, not in the code. Supabase's own session (AsyncStorage, `lib/supabase.ts:13`) holds Supabase tokens only. `signInWithIdToken` does not give you an Apple refresh token.
- Consequence: we cannot revoke today. We must obtain a fresh authorization code at delete time (see step 5).
- Apple button is hidden for under-13 (`showApple`, auth.tsx:43), so only 13+ accounts can be Apple accounts.
- Android and web have no Apple flow here. Google and email accounts need no revocation.

## 3. Which function deletes the auth user

- Today: only the Postgres RPC `delete_my_account`, called with the user's anon-key session JWT (client `supabase.rpc`). Defined in the Supabase project, not in the repo.
- Service role: an RPC called from the client runs as the `authenticated` role, so it can delete `auth.users` only if declared `SECURITY DEFINER` (running as the function owner). Verify with the query above. It does not use the service role key; the client has none, and must never get one.
- There are no Supabase edge functions in the repo.

## 4. What Apple's revoke endpoint needs

`POST https://appleid.apple.com/auth/revoke`, `Content-Type: application/x-www-form-urlencoded`:
- `client_id`: `com.clutchr.baseball` (the app's bundle ID). Dev builds use `com.clutchr.baseball.dev` (app.config.js) and their codes are issued for that ID, so the function should accept both and pick by the Apple token's audience, not trust a client-sent value.
- `client_secret`: a JWT signed ES256 with the .p8 key. Header: `alg: ES256`, `kid: <KEY_ID>`. Claims: `iss: 4PJR46WPB5` (team ID), `iat`, `exp` (max 6 months; use minutes), `aud: https://appleid.apple.com`, `sub: <client_id>`.
- `token`: an Apple refresh token (preferred) or access token, with `token_type_hint=refresh_token` or `access_token`.
- Because we hold no refresh token, we first exchange the authorization code: `POST https://appleid.apple.com/auth/token` with `client_id`, `client_secret`, `code`, `grant_type=authorization_code`. It returns `refresh_token` and `access_token`. Then revoke the refresh token.
- Authorization codes are single use and expire in about 5 minutes, so the exchange must happen right after the re-prompt.
- Success is HTTP 200 with an empty body. Errors return JSON such as `invalid_grant` or `invalid_client`.
- A services ID is NOT needed for the native flow; the bundle ID is the client_id. (A services ID is only for web/OAuth Apple sign-in.)

## 5. Build plan (minimal)

Server:
1. Create one edge function `delete-account` (new `supabase/functions/delete-account/index.ts`; the repo needs a `supabase/` folder or it can be created in the dashboard). Name is a suggestion.
2. It reads the caller's JWT from the `Authorization` header, validates it with `supabase.auth.getUser(jwt)` using the anon client, and takes the user id from that, never from the request body.
3. Body: `{ authorizationCode?: string }`. Look up the user's provider from the user object (`app_metadata.provider` / `identities`).
4. If the user has an Apple identity: require `authorizationCode`, build the client_secret JWT, call `/auth/token`, then `/auth/revoke` with the refresh token. If any Apple call fails, return an error and DO NOT delete (so the user can retry; avoids a deleted account with a live Apple grant). Treat `invalid_grant` as "ask the user to re-confirm".
5. Then delete: either call the existing `delete_my_account` RPC with the user's JWT (reuses current table cleanup), or use a service-role admin client to delete rows and `auth.admin.deleteUser(userId)`. Recommended: keep the RPC for data, then `auth.admin.deleteUser` only if the RPC does not remove `auth.users`. Service-role key is the function's auto-provided `SUPABASE_SERVICE_ROLE_KEY` secret.
6. Secrets (Supabase project secrets, set with `supabase secrets set` or the dashboard; never in the app, repo or eas.json): `APPLE_TEAM_ID=4PJR46WPB5`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (full .p8 contents), `APPLE_CLIENT_IDS=com.clutchr.baseball,com.clutchr.baseball.dev`. Sign the JWT with `jose` (`importPKCS8` + `SignJWT`, alg ES256) or Web Crypto.

App (`app/(tabs)/profile.tsx` only):
7. In `handleDeleteAccount`, before step 2 of today's flow: if the signed-in user's provider is apple (`session.user.app_metadata.provider` or `identities`), call `AppleAuthentication.signInAsync({ requestedScopes: [] })` to re-prompt (Face ID / confirm sheet). Take only `credential.authorizationCode`. No nonce or Supabase sign-in is needed. If the user cancels (`ERR_REQUEST_CANCELED`), abort quietly and keep the modal open.
8. Replace `supabase.rpc('delete_my_account')` with `supabase.functions.invoke('delete-account', { body: { authorizationCode } })`. Everything after it (RevenueCat logout, notifications, signOut, AsyncStorage wipe, navigation) stays unchanged and still runs only on success.
9. Add a failure message for the Apple case ("Confirm with Apple to delete") in the existing `deleteFailed` area; reuse the current text for network errors.
10. The re-prompt is the simplest correct approach: no token storage, no new table, no stale-token risk.

Not needed: a migration, a new table, storing anything in the app, changes to `auth.tsx`.

## 6. Apple Developer portal checklist

Collect or create:
- [ ] Team ID: `4PJR46WPB5` (confirmed in your message).
- [ ] App ID `com.clutchr.baseball` has the "Sign in with Apple" capability enabled (Certificates, Identifiers & Profiles, Identifiers). Same for `com.clutchr.baseball.dev` if dev builds sign in with Apple.
- [ ] A Key with "Sign in with Apple" enabled (Keys, "+", configure it and select the primary App ID `com.clutchr.baseball`). Download the `.p8` once; Apple will not let you download it again. Store it in a password manager.
- [ ] Note the Key ID (10 characters) shown on the key.
- [ ] Services ID: not required for this native flow.
- [ ] Supabase Auth, Providers, Apple: confirm `com.clutchr.baseball` (and the dev ID) are listed under client IDs so `signInWithIdToken` keeps working. No change expected.
- [ ] Set the four Supabase secrets listed in step 6.
- [ ] Note: the checked-in `ios/` folder is gitignored and its entitlements file lacks `com.apple.developer.applesignin`; EAS builds regenerate it from `app.json` (`usesAppleSignIn: true`), so this is fine for production, but a local Xcode build from the stale `ios/` would not have the capability.

Testing with a sandbox or test account:
- Apple has no sign-in sandbox. Use a real Apple ID on a development or TestFlight build (a physical device or a simulator signed into iCloud). Use a throwaway Apple ID with "Hide My Email" if you prefer.
- Flow: sign in with Apple on the build, confirm a row exists in Supabase Auth with provider apple, then Profile, Delete account, confirm the Apple re-prompt, and confirm deletion.
- Verify revocation on the device: Settings, Apple ID, "Sign-In & Security", "Sign in with Apple". The app should disappear from the list after deletion (and should have been there before). Signing in again with Apple should show first-time setup (name and email sharing sheet), which proves the grant was revoked.
- Negative tests: cancel the Apple sheet (nothing deleted); airplane mode (nothing deleted, error shown); reuse an old authorization code (function returns `invalid_grant`, nothing deleted); a Google or email account (no Apple prompt, deletion works as before).
- Edge function logs in the Supabase dashboard show the Apple responses.

## Open items before building

1. Read `delete_my_account`'s body to see what it deletes and whether it is `SECURITY DEFINER`.
2. Decide whether a dev (`com.clutchr.baseball.dev`) build needs Apple deletion support.
3. Decide the failure policy: this plan blocks deletion if Apple revocation fails. Apple only requires revocation attempt on account deletion, so a softer policy (log and continue) is possible, but it risks leaving the grant live.
