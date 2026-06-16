# Core UX Loop Audit — Clutchr Baseball

## 1. Audit date

May 11, 2026

## 2. Current branch

`work`

> Note: sprint brief expected `stable-good-ui`, but the checked-out repository branch is `work`.

## 3. Files inspected

- `app/(tabs)/index.tsx`
- `app/(tabs)/career.tsx`
- `app/lesson/[id].tsx`
- `app/(tabs)/gamemode.tsx`
- `app/(tabs)/locker.tsx`
- `app/(tabs)/profile.tsx`
- `app/upgrade.tsx`
- `components/CompletionInteraction.tsx`
- `components/EmblemBadge.tsx`
- `components/PitchSequenceChess.tsx`
- `components/StrikeZoneVisualizer.tsx`
- `components/ThrowDecisionBoard.tsx`
- `components/FieldIQBoard.tsx`
- `components/LeverageLadder.tsx`
- `components/RoutineCardBuilder.tsx`
- `components/PressureReplay.tsx`
- `components/SnapshotRead.tsx`
- `components/JumpRead.tsx`
- `components/TimingTrack.tsx`
- `components/ConfidenceSlider.tsx`
- `components/PitchCountBoard.tsx`
- `lib/progressionRanks.ts`
- `lib/lessonRouter.ts`
- `context/AthleteContext.tsx`

## 4. Summary verdict

The core loop has strong product bones: Home has a real “next rep” concept, lesson flow is mobile-native, completion has XP/rank payoff, and Career gives a clear path container. The biggest risk was reliability: `PitchSequenceChess` could crash on malformed live lesson data, blocking an athlete mid-rep. The main UX issue was hierarchy: Home and completion were close, but several labels still felt like lessons/tools instead of baseball reps, and the slide/hold completion pattern added friction without clear value.

This pass keeps architecture intact and makes safe, local polish: harden `PitchSequenceChess`, reset interactive state by step, add unsupported-interactive fallback handling, replace clunky completion gestures with a premium tap action, sharpen Home CTA copy, and tighten completion language.

## 5. Core loop map

### Home

- Entry point uses a command-style header with rank, streak, XP, and “Your Next Rep.”
- Primary card routes through `pickNextLesson` and answers “what should I do next?” better than the surrounding secondary sections.
- Daily work and shortcuts remain useful but can still compete visually if too much status chrome is added.

### Continue Career / Next Rep

- `handleContinueCareer` routes directly to `/lesson/[id]` with the router reason as context.
- The main CTA now uses “Start Next Rep,” which is more baseball-native and clearer than “Let’s go.”

### Lesson start

- Header, family, progress bar, and step counter are clear.
- First-step lesson family/subtitle provides useful orientation without a full redesign.

### Lesson step

- Text/action/choice/checklist steps use existing renderers with good mobile readability.
- Final-step action now uses a reliable premium button instead of a gesture-heavy lock control.

### Interactive step

- `VariantRenderer` selects the existing variant by `ui_variant`.
- Interactive variants are keyed by stable step identity so local selection state remounts between steps/questions.
- Unsupported variants now render a helpful fallback instead of a blank/dead state.

### Completion

- Completion screen already had strong pieces: earned title, XP, path movement, rank progress, CC’s Take, and next actions.
- Copy now emphasizes “Rep Complete” / “Rep Finished” rather than classroom completion.

### Return Home / Next Best Rep

- Completion primary CTA returns to Career via “Continue Career.”
- Home reloads the next routed lesson from athlete state changes; this is directionally correct, but should be Expo-tested after real Supabase completion writes.

## 6. P0 issues

1. `PitchSequenceChess` render crash when optional or malformed fields are missing, specifically `ctx.sequences.join` / array assumptions.
2. Interactive state could become unsafe if a renderer instance received new malformed step data without remount/reset protection.
3. Unsupported interactive variants could render `null`, creating a dead end.

## 7. P1 issues

1. Completion control felt clunky and gimmicky compared with the premium career-path tone.
2. Home CTA copy was not as direct as the product standard requires.
3. Home daily mission language (“lessons,” “missions”) made the app feel more course/gamified than athlete operating system.
4. Completion screen needed slightly clearer “keep working” language.
5. Pitch chess needed defensive defaults for pitch options, targets, previous pitches, responses, and feedback.

## 8. P2 polish items

1. Profile should soften any fake precision and better distinguish earned progress from placeholders.
2. Career world tabs and locked/teaser visuals are understandable but could make the current path more obvious.
3. Game Mode and Locker visually align with the app, but both could better ladder under Home’s primary next-rep hierarchy.
4. Daily Work density could be reduced further if Home still feels busy on smaller devices.
5. Bottom nav spacing should be checked on real devices with safe-area variance.

## 9. Safe fixes made in this pass

1. Hardened `PitchSequenceChess` with defensive normalization for context, runners, sequences, previous pitches, pitch options, target options, responses, and feedback.
2. Added local state reset inside `PitchSequenceChess` when the prompt/options change.
3. Added stable keys and fired-state reset to `VariantRenderer` so interactive selections do not carry over between steps.
4. Added a clear fallback card for malformed/unsupported interactive variants.
5. Replaced the slide/hold completion interaction with a premium, reliable tap button while preserving the existing `CompletionInteraction` API.
6. Tightened Home copy: “Start Next Rep,” “Daily Work,” “Finish 2 reps,” and “Run 1 reset.”
7. Tightened secondary Home shortcut subtitles to reduce visual/copy competition.
8. Adjusted completion kicker copy from “Lesson Complete” to “Rep Complete.”

## 10. Deferred items

1. No global lesson content rewrite; only core-loop labels were touched.
2. No schema, Supabase table, routing architecture, or XP behavior changes.
3. No Career redesign; current path hierarchy should be revisited in a focused Career sprint.
4. No Profile progression rebuild; earned-vs-placeholder semantics should be handled separately.
5. No Game Mode or Locker redesign; both should remain secondary to the next-rep loop.
6. No analytics added; completion/return-home telemetry should be a later instrumentation task.

## 11. QA checklist for Expo Go testing

### Home

- Open the app to Home.
- Confirm header loads rank/streak/XP without crowding.
- Confirm “Your Next Rep” is visually dominant.
- Confirm primary CTA reads “Start Next Rep.”
- Confirm Daily Work feels secondary and uses “Finish 2 reps” / “Run 1 reset.”
- Confirm Game Mode and Locker cards do not compete with the next-rep card.

### Continue Career

- Tap the next-rep card and the primary CTA.
- Confirm both route to the same lesson.
- Confirm the reason/subtitle from routing still appears on Home before navigation.

### Normal lesson

- Complete a text/action/checklist style lesson.
- Confirm step progress updates.
- Confirm final action is a clear button, not a clunky slide control.
- Confirm completion awards XP and shows rank progress.

### Interactive lesson

- Open a lesson containing `pitch_sequence_chess`.
- Confirm pitch options and target options render even if some optional context fields are missing.
- Select a pitch and target.
- Confirm feedback only reflects the current selection.
- Move to another interactive step/question and confirm previous selection does not carry over.

### PitchSequenceChess crash regression

- Test a pitch chess lesson where `context.sequences`, `previous_pitches`, `pitch_options`, `target_options`, `responses`, or `feedback` are absent/malformed.
- Confirm the app does not crash.
- Confirm safe default options render and the athlete can continue.

### Completion screen

- Finish a normal lesson and an interactive lesson.
- Confirm completion title reads as a rep/payoff moment.
- Confirm XP count animates.
- Confirm rank progress is readable.
- Confirm CC’s Take appears concise.
- Tap “Continue Career” and confirm route works.

### Return Home / next-best-rep

- Return to Home after completion.
- Confirm XP/rank state updates after context persistence.
- Confirm the next routed rep is visible.
- Confirm there is no dead end after completion.

## 12. Home focus pass — May 11, 2026

### What changed

- Simplified the Home header into a clean CLUTCHR brand row with only compact streak and XP indicators on the right.
- Removed the large rank/emblem pill and status pill from the header; rank now appears quietly inside the Next Rep hero card.
- Cleaned season/role metadata into compact hero chips such as `In-Season` and `Pitcher`.
- Rebuilt the Home hierarchy around one dominant Next Rep hero card with one clear primary CTA: `Start Next Rep →`.
- Removed the circular play button so the hero no longer presents two competing CTAs for the same action.
- Replaced static Today’s Cue with `WHY THIS REP`, using the existing routed reason when available and a baseball-native fallback when it is not.
- Quieted Daily Work into two compact cards that preserve the existing mission logic without heavy stacked rows.
- Removed the floating Tools pill from Home and kept Game Mode / Locker as the only secondary shortcut cards.
- Reduced green overload by reserving strong green for the primary CTA, small status dots, and active/completed progress.

### Design intent

The Home screen should feel like a premium baseball command center: one clear next action, restrained status, intentional spacing, and secondary work that supports the core loop without competing with it.

### Intentionally not changed

- No lesson player logic was touched.
- No interactive variant logic was touched.
- No completion logic was touched.
- No routing behavior, XP/rank calculation, Supabase schema, paywall, onboarding, Career, Game Mode, or Locker architecture was changed.
- Daily Work mission persistence and Game Mode mission completion behavior were preserved.

### Future Home ideas deferred

- Add a richer but still restrained next-rep reason model if routing eventually supplies stronger baseball context.
- Consider a small rank progress strip below the hero after validating spacing on real devices.
- Revisit whether Locker should expose tools inside its own screen rather than through any Home-level tools entry.
- Tune compact stat pill behavior for very large XP values after device QA.

## 13. Home level-up pass — May 11, 2026

### What changed

- Added a compact `Today’s Plan` intro above the hero so Home reads like a plan for the athlete’s next training block instead of a stack of cards.
- Kept the Next Rep card as the dominant anchor and added subtle premium depth with a faint plate-style mark and soft CTA glow.
- Moved the routed reason/fallback out of the standalone `WHY THIS REP` card and into the hero as a short `TODAY'S EDGE` note.
- Converted Daily Work from two tappable-looking cards into a compact `TODAY'S PROGRESS` status panel with progress bars for reps and reset work.
- Kept Game Mode and Locker as the only secondary action cards and added chevrons so they read as tappable destinations.

### Why Daily Work became status

Daily Work is progress feedback, not a primary action. The strip now preserves the same mission data and rewards while avoiding button-like tiles that compete with Game Mode, Locker, and the Next Rep CTA.

### Why Why This Rep moved

The separate Why This Rep card created another equal-weight box and interrupted the primary loop. Moving the context into the hero keeps the reason attached to the action it explains.

### Still deferred

- No new Home artwork system or branded imagery was added.
- No changes were made to routing, XP/rank calculations, mission persistence, or backend data.
- Real-device spacing should still be tuned after Expo Go QA, especially for long names, long XP totals, and long routed reasons.
