# Phase 1 Audit — Inventory
**Date:** 2026-10-04  
**Branch:** sprint-final-push  
**Scope:** Read-only. No source files modified.

---

## 1. Screen Inventory

| File Path | Component | Description |
|-----------|-----------|-------------|
| `app/(tabs)/career.tsx` | CareerScreen | Career mode — chapter tabs (Foundation, Your Craft, Compete, The Grind, Signal), vertical world tower timeline, expanded world/lesson view |
| `app/(tabs)/gamemode.tsx` | GameModeScreen | Game prep tool — pregame/live/postgame rapid-rep drills, debrief capture, tool shelf modal |
| `app/(tabs)/index.tsx` | HomeScreen | Home tab — next lesson card, 6-card command center grid, mental game score sparkline, coach quote, mission progress |
| `app/(tabs)/locker.tsx` | LockerScreen | Tool library — search bar, group tabs (Dugout/Bullpen/Grind), featured cards and list cards by content type |
| `app/(tabs)/profile.tsx` | ProfileScreen | Player profile — identity card, mental game score, XP/rank bar, stats row, current cue, coach's eye summary, playbook CTA |
| `app/auth.tsx` | AuthScreen | Sign-up/sign-in — Google OAuth, email form, credential entry |
| `app/content/[id].tsx` | ContentDetailScreen | Dynamic content card detail — markdown body, type badge, duration |
| `app/dev-qa.tsx` | DevQAScreen | Dev-only QA utilities (triggered by tap sequence on profile) |
| `app/edit-profile.tsx` | EditProfileScreen | First name edit, role selection with checkmarks, save button |
| `app/lesson/[id].tsx` | LessonScreen | Lesson delivery — multi-step interactive components (choices, checklists, visualizations, timers, reflection, completion celebration) |
| `app/onboarding.tsx` | OnboardingScreen | Multi-step onboarding — name input, role, level, season phase, biggest struggle |
| `app/playbook.tsx` | PlaybookScreen | Playbook builder (referenced in nav) |
| `app/rep-mode.tsx` | RepModeScreen | Quick rep entry with 5-rep completion message |
| `app/upgrade.tsx` | UpgradeScreen | Pro subscription — feature comparison card, pricing |

---

## 2. Neon-Green Color Audit

**Source of truth:** `Colors.primary = #00FF66` (defined in `constants/theme.ts`)  
**Most common offender:** `#22CC5E` (36 instances) — a dimmer, shifted green that should not exist alongside the primary.

| File Path | Line(s) | Value(s) | Usage | Verdict |
|-----------|---------|----------|-------|---------|
| `app/(tabs)/career.tsx` | 57 | `#22CC5E` | Foundation world color in WORLDS config | VIOLATION |
| `app/(tabs)/career.tsx` | 70 | `#30D158` | Routines & Rituals world color | VIOLATION |
| `app/(tabs)/career.tsx` | 656 | `#30D158` | Chapter FOUNDATION color override | VIOLATION |
| `app/(tabs)/career.tsx` | 841 | `#22CC5E` | FOUNDATION chapter label color | VIOLATION |
| `app/(tabs)/gamemode.tsx` | 238 | `#22CC5E` | Rapid rep drill color | VIOLATION |
| `app/(tabs)/gamemode.tsx` | 308 | `#22CC5E` | SWING/TAKE tool color | VIOLATION |
| `app/(tabs)/profile.tsx` | 485–486 | `#22CC5E33` / `#22CC5E` | Switch track color + thumb | VIOLATION |
| `app/dev-qa.tsx` | 162 | `#22CC5E` | World clear trigger color | Dev-only — low priority |
| `app/edit-profile.tsx` | 145, 171, 266, 281, 310, 321, 339, 358, 393 | `#22CC5E` | Checkmark icons, save button, input borders, labels — 7+ instances on same screen | VIOLATION × multiple |
| `app/lesson/[id].tsx` | 1283 | `#39FF88` | Completion celebration flash icon | VIOLATION |
| `app/lesson/[id].tsx` | 1299, 1309 | `#23D160` | Completion checkmark + gradient start | VIOLATION |
| `app/lesson/[id].tsx` | 2539–2645 | `#23D160` / `#39FF88` / `#22CC5E` | XP celebration — 12 instances, 3 different greens | VIOLATION × 12 |
| `app/lesson/[id].tsx` | 1615, 1622 | `#22CC5E44` / `#22CC5E` | Mute border + text | VIOLATION |
| `components/SkeletonLoader.tsx` | 78, 133 | `#22CC5E` | Loading state icon + text | VIOLATION |
| `components/VoltChip.tsx` | 25, 36, 46, 57, 66 | `#22CC5E` | SVG chip border + fill — 5 instances | VIOLATION |
| `lib/progressionRanks.ts` | various | `#22CC5E` / `#23D160` | Rank-tier colors | Acceptable (rank-specific theming) |

**Totals:** `#22CC5E` — 36 hits · `#23D160` — 16 hits · `#39FF88` — 6 hits · `#30D158` — 2 hits  
**Worst offender:** `app/edit-profile.tsx` (7+ independent hardcoded instances on a single screen).

---

## 3. Hardcoded Lesson/World Count Strings

| File Path | Line | String | Flag |
|-----------|------|--------|------|
| `app/upgrade.tsx` | 55 | `"All 50+ gold-standard lessons"` | VIOLATION — hardcoded count, no dynamic source |
| `app/upgrade.tsx` | 67 | `"50+ lessons across all 7 phases"` | VIOLATION — hardcoded count AND phase count |
| `app/(tabs)/index.tsx` | 474 | `2` (mission target literal) | VIOLATION — daily mission "complete 2 lessons" hardcoded |
| `app/(tabs)/index.tsx` | 476 | `1` (game mode mission multiplier) | Borderline — hardcoded mission multiplier |
| `app/(tabs)/career.tsx` | 51–838 | WORLDS array — 59 static world objects | Static config; blocks dynamic world expansion but not copy-level violation |

**Note:** The phrase "hundreds of reps across 30+ worlds" does not appear verbatim anywhere in the codebase — no copy has been written to that spec yet.

---

## 4. Career World Locked/Incomplete Styling

All locked/incomplete states use neutral greys and low opacity. No color violations found.

| File Path | Element | Locked Color/Style | Verdict |
|-----------|---------|-------------------|---------|
| `app/(tabs)/career.tsx` | WorldNode circle | `Colors.surfaceElevated` + `opacity: 0.4` + `Colors.border` | PASS |
| `app/(tabs)/career.tsx` | WorldNode icon | `Colors.textDisabled` (#3B4045) + `opacity: 0.35` | PASS |
| `app/(tabs)/career.tsx` | WorldNode label | `Colors.textDisabled` | PASS |
| `app/(tabs)/career.tsx` | TimelineNode dot | `backgroundColor: '#0E0E14'` + `borderColor: '#1e1e2a'` | PASS — dark neutral |
| `app/(tabs)/career.tsx` | TimelineNode card title | `rgba(255,255,255,0.25)` | PASS |
| `app/(tabs)/career.tsx` | TimelineNode card border | `#131318` | PASS — near-invisible dark |
| `app/(tabs)/career.tsx` | TimelineNode hint text | `rgba(255,255,255,0.18)` italic | PASS |

---

## 5. Component Duplication

Core button and header are correctly centralized. Duplication is limited to screen-local `StyleSheet.create` blocks — a standard RN pattern, not true component duplication.

| File Path | Symbol | Type | Notes |
|-----------|--------|------|-------|
| `components/ui.tsx` | `Btn` | Button component | Primary implementation — correct |
| `components/ui/ClutchrUI.tsx` | `ScreenHeader`, `ChamferPanel` | Header + card | Primary implementations — correct |
| `app/(tabs)/index.tsx` | `gc`, `g`, `c`, `wm` | Screen-local StyleSheets (grid card, grid section, continue card, weather modal) | Local-only; GridCard candidate for extraction |
| `app/(tabs)/career.tsx` | `nodeStyles`, `missionStyles`, `mapStyles`, `tlStyles`, `signalMapStyles` | Screen-local StyleSheets | Local-only; WorldNode + TimelineNode are extraction candidates |
| `app/(tabs)/locker.tsx` | `lockerTabStyles`, `featStyles`, `listStyles` | Screen-local StyleSheets | Local-only |
| `app/(tabs)/gamemode.tsx` | Multiple `s` StyleSheet blocks | Screen-local StyleSheets | Multiple per file — messy but not duplicating shared UI |
| `app/(tabs)/profile.tsx` | `mgsStyles`, `cueStyles`, `eyeStyles` | Screen-local StyleSheets | Local-only |
| `components/ToolShelfModal.tsx` | `modalStyles`, `cardStyles`, `runnerStyles`, `printStyles` | Modal-local StyleSheets | Local-only |
| `components/MyPlaybook.tsx` | `slotStyles`, `chipStyles`, `completeStyles`, `lockedSlotStyles` | Component-local StyleSheets | Local-only |

**No duplicate Button or Header component definitions found.** WorldNode and GridCard are the strongest extraction candidates for reuse.

---

## 6. Header Height/Structure Per Tab

All tabs use `ScreenHeader` or `ClutchrHeader` with `insets.top` safe-area padding. No explicit pixel heights are set — sizing is content-driven.

| Tab File | Header Component | Base Height | Additional Below Header | Est. Total Consumed |
|----------|-----------------|-------------|------------------------|---------------------|
| `app/(tabs)/index.tsx` | `ScreenHeader` | ~56px + insets.top (~44–49px notch) | None | ~100px |
| `app/(tabs)/gamemode.tsx` | `ClutchrHeader` / `ScreenHeader` | ~56–70px + insets.top | None | ~105px |
| `app/(tabs)/profile.tsx` | `ScreenHeader` | ~56px + insets.top | None | ~100px |
| `app/(tabs)/career.tsx` | `ScreenHeader` | ~56px + insets.top | Chapter tab bar ~48px | ~148px |
| `app/(tabs)/locker.tsx` | `ScreenHeader` | ~56px + insets.top | Search bar ~45px | ~145px |

**Note:** The 1.4 compact-header change target of ~200px recovery is plausible for Career and Locker where the combined header+sub-bar stack is the tallest (~145–148px). On simpler tabs the recovery would be smaller (~40–50px). Verify against a device to confirm exact inset values.

---

## 7. COPPA-Relevant Surfaces

| File Path | Data Collected | Storage / Destination | Risk Level |
|-----------|---------------|----------------------|------------|
| `app/auth.tsx` | Email (manual or Google OAuth) | Google OAuth → Supabase `auth.users` | HIGH |
| `app/auth.tsx` | `full_name` from Google `user_metadata` | Supabase `auth.users` | HIGH |
| `app/onboarding.tsx` | `first_name` (step: 'name') | Supabase athlete table via AthleteContext | HIGH |
| `app/onboarding.tsx` | `level_band` (youth / high_school / college / pro) | Supabase athlete table | MEDIUM — age proxy |
| `app/onboarding.tsx` | `primary_role`, `season_phase`, `biggest_struggle` | Supabase athlete table | MEDIUM — interests/behavioral |
| `app/edit-profile.tsx` | `first_name` (editable) | Supabase via `updateAthleteState()` | HIGH |
| `app/(tabs)/index.tsx` | GPS coordinates via `Location.getCurrentPositionAsync()` | Sent to open-meteo weather API only — NOT stored | MEDIUM |
| `app/(tabs)/index.tsx` | `last_active_date`, `missions_progress`, XP, streak | `AsyncStorage` (device-local only) | LOW |
| `context/AthleteContext.tsx` | Supabase `session.user` object (includes email) | Held in React context + Supabase session | HIGH |
| `lib/notifications.ts` | Device push token | Notification service / Supabase | MEDIUM |

**No violations confirmed** — no birth date, school, photos, or stored geolocation found.  
**Not yet verified:** Whether a parental-consent gate exists for users who select `level_band = youth`. If it doesn't exist, that is a COPPA gap.

---

## Punch List — Follow-Up Fix Tickets

### Critical
1. **`app/edit-profile.tsx` — 7+ hardcoded `#22CC5E` instances** (lines 145, 171, 266, 281, 310, 321, 339, 358, 393) → replace with `Colors.primary`
2. **`app/lesson/[id].tsx` — 3 different greens in completion celebration** (lines 1283, 1299, 1309, 2539–2645, 1615, 1622) → standardize to `Colors.primary`
3. **`app/(tabs)/career.tsx` — 4 hardcoded world/chapter green overrides** (lines 57, 70, 656, 841) → replace with `Colors.primary` or theme token
4. **`app/(tabs)/profile.tsx` — switch toggle hardcodes `#22CC5E`** (lines 485–486) → use `Colors.primary`
5. **`app/upgrade.tsx` — copy hardcodes `"50+"` and `"7 phases"`** (lines 55, 67) → replace with constants or dynamic values

### Medium
6. **`components/VoltChip.tsx` — 5 hardcoded `#22CC5E` in SVG** (lines 25, 36, 46, 57, 66) → accept a color prop defaulting to `Colors.primary`
7. **`components/SkeletonLoader.tsx` — hardcoded `#22CC5E`** (lines 78, 133) → make themeable via `Colors.primary`
8. **`app/(tabs)/gamemode.tsx` — drill/tool colors hardcoded** (lines 238, 308) → extract to config constants using `Colors.primary`
9. **`app/(tabs)/career.tsx` — WORLDS array is 787 lines of static config** (lines 51–838) → consider extracting to `constants/worlds.ts` or CMS-driven data source
10. **`app/(tabs)/index.tsx` — daily mission target hardcoded as `2`** (line 474) → extract to config constant
11. **COPPA gap — no parental consent gate found for `level_band = youth`** → confirm or implement before public launch

### Low
12. **`app/(tabs)/index.tsx` — GridCard styles (`gc`) are extraction candidates** → move to shared component
13. **`app/(tabs)/career.tsx` — WorldNode + TimelineNode** → strong candidates for dedicated component files
14. **`app/dev-qa.tsx` — hardcoded `#22CC5E`** (line 162) → low priority (dev-only screen), but clean up for consistency
15. **Upgrade screen copy** — "hundreds of reps across 30+ worlds" tagline has not been written into any surface yet → needs copy placement
