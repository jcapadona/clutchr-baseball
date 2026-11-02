# Week 4 final sweep

Generated read-only. No source files were changed by this sweep.

## a) Em dashes in UI copy

Em dashes (U+2014) in non-comment lines: 44

- app/(tabs)/gamemode.tsx:599: "That feeling is not fear. That is your body preparing to compete. Heart rate up, focus narrowing — that is ca
- app/(tabs)/gamemode.tsx:719: instruction: 'Stay on fast: assume heat, adjust to off-speed. "Yes. Yes. No." — not "No, No, Yes."',
- app/(tabs)/gamemode.tsx:777: instruction: "One job for the first pitch: attack the zone. Not the perfect pitch — a competitive strike.",
- app/(tabs)/gamemode.tsx:917: instruction: "Walk, shuffle, jog — break the mental freeze.",
- app/(tabs)/gamemode.tsx:1050: instruction: "Make the cue yours. Say it your way. It is not the coach's at-bat — it is yours.",
- app/(tabs)/gamemode.tsx:1107: "That inning is done. Good or bad — it is closed. Walk off with your chin up.",
- app/(tabs)/gamemode.tsx:1298: instruction: "Tell the next batter one thing. Concise. Actionable. Not five things — one.",
- app/(tabs)/gamemode.tsx:1436: 'Rewrite the story. Not "I was terrible" — but "I competed, the results did not go my way, and I know what I w
- app/(tabs)/gamemode.tsx:1485: "Roll your lat and posterior shoulder. 60 seconds per side. The lat is attached to your arm — take care of it.
- app/(tabs)/gamemode.tsx:1524: "Standing hamstring stretch. 30 seconds each side. If you dove or slid today — give extra time here.",
- app/(tabs)/gamemode.tsx:1581: instruction: "Name the score out loud. Own it. Then move past it — the debrief is not about the score.",
- app/(tabs)/gamemode.tsx:2007: .map((s, i) => `${i + 1}. ${s.cue}  —  ${s.instruction}`)
- app/(tabs)/gamemode.tsx:2010: "[ CLUTCHR BASEBALL — GAME CARD ]",
- app/(tabs)/index.tsx:307: <Text style={wm.temp}>{temp !== null ? `${temp}°` : '—'}</Text>
- app/(tabs)/index.tsx:642: value: weatherOk ? `${weatherTemp}°` : '—',
- app/(tabs)/index.tsx:663: <Pressable hitSlop={10} onPress={() => showToast('Coming soon — reminders', 'info')}>
- app/(tabs)/index.tsx:668: <Pressable hitSlop={10} onPress={() => showToast('Coming soon — schedule', 'info')}>
- app/lesson/[id].tsx:88: {value===0?'—':value===1?'Low':value===2?'Okay':value===3?'Solid':value===4?'Strong':'Elite'}
- app/lesson/[id].tsx:1124: if (__DEV__) console.warn('[StepRenderer] Unknown step type — falling back to SparkStep:', step?.type, { keys:
- components/ConfidenceSlider.tsx:43: coaching_note?: string; // shown after zone feedback — universal follow-on
- components/DiamondCursor.tsx:353: if (__DEV__) console.warn('[DiamondCursor] No zones defined — rendering fallback');
- components/MyPlaybook.tsx:317: {value || '—'}
- components/PitchCountBoard.tsx:27: pitch_type?: string; // optional — for pitcher perspective
- components/lesson-steps/DragSequence.tsx:82: console.warn('[DragSequence] correct_order missing — using item input order as fallback');
- components/lesson-steps/DragSequence.tsx:163: if (__DEV__) console.warn('[DragSequence] Fewer than 2 items defined — rendering fallback');
- components/ui/ClutchrUI.tsx:58: STROKE ICON — 2px, round caps, 24-unit grid. One path string per
- components/ui/ClutchrUI.tsx:103: SKELETON — opacity pulse 0.4 → 0.75. No shimmer. Size it to the
- components/ui/ClutchrUI.tsx:132: CHAMFER PANEL — the cut-corner broadcast panel.
- components/ui/ClutchrUI.tsx:333: SCREEN HEADER — replaces the ~300px header block on every screen.
- components/ui/ClutchrUI.tsx:389: CARD — default surface. Uses Colors.border (neutral), NOT
- components/ui/ClutchrUI.tsx:391: for accent inflation — your theme.ts already has both tokens,
- components/ui/ClutchrUI.tsx:435: PHOTO CARD — 5-layer image treatment. Fixes illegible text
- components/ui/ClutchrUI.tsx:443: image: ImageSourcePropType;   // MUST be a literal require() — Metro needs static paths
- components/ui/ClutchrUI.tsx:500: WORLD TILE — Career grid. Replaces the vertical node rail.
- components/ui/ClutchrUI.tsx:623: PULSE RING — signature motif. Reuse everywhere: world progress,
- components/ui/ClutchrUI.tsx:785: COACH TAKE — one compact Coach Cap line. Same component on Home
- constants/visualExtensions.ts:81: foundation: Colors.primary,   // #00FF66 — your existing green
- constants/visualExtensions.ts:82: craft:      Colors.purple,    // #BF5AF2 — already in your palette
- constants/visualExtensions.ts:83: compete:    Colors.info,      // #0A84FF — already in your palette
- constants/visualExtensions.ts:84: grind:      Colors.warning,   // #F5A623 — already gold/earned
- constants/visualExtensions.ts:85: signal:     '#22D3EE',        // cyan — new, Signal doesn't have a role yet
- constants/visualExtensions.ts:86: recovery:   '#E879F9',        // magenta — new, for Slump/Recovery worlds
- constants/visualExtensions.ts:87: locked:     Colors.textDisabled, // #3B4045 — already your disabled tone
- lib/supabase.ts:8: console.warn('Supabase env vars missing — auth and data features will be unavailable');

Em dashes in code comments only (not UI, listed for completeness): 151


## b) "coming soon" (any case)

- app/(tabs)/index.tsx:663: <Pressable hitSlop={10} onPress={() => showToast('Coming soon — reminders', 'info')}>
- app/(tabs)/index.tsx:668: <Pressable hitSlop={10} onPress={() => showToast('Coming soon — schedule', 'info')}>

## c) Gold (#F5C542, #F5A623, Colors.warning/gold and related tokens) outside Pro and paywall files

Pro/paywall files (allowed): upgrade.tsx, welcome-pro.tsx, ProContext, and files with 'pro' in the name. Everything else:

- app/(tabs)/career.tsx: lines 189, 684, 1803 (3 uses)
- app/(tabs)/gamemode.tsx: lines 404, 489, 583, 625, 667, 830, 865, 1177, 1359, 1396, 1954, 1974, 2039, 2633, 2997, 3010, 3016, 3153, 3158, 3163, 3355, 3356, 3379, 3384, 3546 ... (28 uses)
- app/(tabs)/locker.tsx: lines 149 (1 uses)
- app/content/[id].tsx: lines 24 (1 uses)
- app/dev-qa.tsx: lines 215 (1 uses)
- app/lesson/[id].tsx: lines 111, 123, 176, 215, 391, 469, 472, 497, 500, 514, 523, 761, 765, 910, 911, 922, 984, 986, 1636, 1644, 2103, 2108, 2120, 2124, 2130 ... (42 uses)
- app/rep-mode.tsx: lines 131 (1 uses)
- components/ConfidenceSlider.tsx: lines 67 (1 uses)
- components/DiamondCursor.tsx: lines 113, 335, 356, 492, 499, 653 (6 uses)
- components/FieldIQBoard.tsx: lines 157, 241, 245, 329, 390 (5 uses)
- components/JumpRead.tsx: lines 53, 97, 122, 207, 213, 232 (6 uses)
- components/LeverageLadder.tsx: lines 123, 163, 188 (3 uses)
- components/MyPlaybook.tsx: lines 101 (1 uses)
- components/PitchCountBoard.tsx: lines 83, 346 (2 uses)
- components/PitchSequenceChess.tsx: lines 65, 338, 346, 367, 377, 463, 484 (7 uses)
- components/PressureReplay.tsx: lines 200, 321 (2 uses)
- components/RoutineCardBuilder.tsx: lines 48, 51 (2 uses)
- components/SnapshotRead.tsx: lines 79, 97, 109, 111, 113, 120, 125, 227, 308 (9 uses)
- components/StrikeZoneVisualizer.tsx: lines 119, 167, 190, 194, 291, 295, 426, 450, 470 (9 uses)
- components/ThrowDecisionBoard.tsx: lines 107, 138, 181, 219, 305, 311 (6 uses)
- components/TimingTrack.tsx: lines 153, 245, 362, 383 (4 uses)
- components/Toast.tsx: lines 27, 28, 29 (3 uses)
- components/lesson-steps/DragSequence.tsx: lines 166, 182, 426, 433, 717 (5 uses)
- components/lesson-steps/FilmRoom.tsx: lines 82, 100, 112, 114, 116, 366 (6 uses)
- components/lesson-steps/OneWordLock.tsx: lines 249, 256, 323 (3 uses)
- components/ui/ClutchrUI.tsx: lines 762, 771 (2 uses)
- constants/theme.ts: lines 45, 46, 68, 69, 247 (5 uses)
- constants/visualExtensions.ts: lines 84, 96, 123 (3 uses)

## d) #39FF88 literal count per file

- app/(tabs)/gamemode.tsx: 1 (lines 2889)
- app/(tabs)/locker.tsx: 1 (lines 509)
- app/(tabs)/profile.tsx: 1 (lines 38)
- lib/progressionRanks.ts: 1 (lines 89)

Screens (app/) with more than one #39FF88: none found

### Note: the shared green token

The theme token `Colors.primary` / `Colors.green` is #00FF66, not #39FF88. The count of `Colors.primary`/`Colors.green` references per app file (top 15) is below. These are not counted as #39FF88 above but may render as neon green.

- app/lesson/[id].tsx: 80
- app/(tabs)/gamemode.tsx: 19
- app/onboarding.tsx: 13
- app/edit-profile.tsx: 9
- app/(tabs)/career.tsx: 5
- app/auth.tsx: 5
- app/content/[id].tsx: 5
- app/dev-qa.tsx: 4
- app/rep-mode.tsx: 3
- app/(tabs)/index.tsx: 2
- app/(tabs)/locker.tsx: 2
- app/(tabs)/_layout.tsx: 0
- app/(tabs)/profile.tsx: 0
- app/_layout.tsx: 0
- app/playbook.tsx: 0

## Notes on method and caveats

- (a) The em dash list treats lines starting with `//`, `*` or `/*` as comments. Lines inside block comments that lack a leading `*` (for example the section banners in `components/ui/ClutchrUI.tsx` and a few comments in `constants/visualExtensions.ts`) still appear in the first list, so the true count of user-visible em dashes is lower than 44. Real UI strings are mostly the Game Mode tool instructions in `app/(tabs)/gamemode.tsx`, the `'—'` placeholders for empty values, and the two toasts below. `console.warn` and `__DEV__` messages are not user-facing.
- (b) Both "Coming soon" toasts sit behind `HOME_FLAGS.bell` and `HOME_FLAGS.calendar`, which are `false`, so they do not render in the current build.
- (c) The gold match includes `Colors.warning` (#F5A623), which is also used as a generic amber status color in lesson components, `Toast.tsx` and the `grind` category color. Treat those as amber status, not Pro gold, unless you want them neutralised. The literal #F5C542 appears only in `app/welcome-pro.tsx`.
- (d) The literal #39FF88 appears once each in `gamemode.tsx` (hero START), `locker.tsx` (active segment border), `profile.tsx` (score line) and `lib/progressionRanks.ts` (a rank color). No app screen has more than one literal. The app theme's green, `Colors.primary`, is #00FF66 and is referenced widely (see counts above), so the one-neon rule is only enforced in the screens polished this sprint.
