# Lesson Player Polish Audit — Clutchr Baseball

## 1. Audit date

May 12, 2026

## 2. Current branch

`work`

> Sprint brief expected `stable-good-ui`, but the checked-out repository branch is `work`.

## 3. Files inspected

- `app/lesson/[id].tsx`
- `components/CompletionInteraction.tsx`
- `components/PitchSequenceChess.tsx`
- `components/ThrowDecisionBoard.tsx`
- `components/RoutineCardBuilder.tsx`
- `components/JumpRead.tsx`
- `components/LeverageLadder.tsx`
- `components/StrikeZoneVisualizer.tsx`
- `components/SnapshotRead.tsx`
- `components/ConfidenceSlider.tsx`
- `components/PitchCountBoard.tsx`
- `components/FieldIQBoard.tsx`
- `components/PressureReplay.tsx`
- `components/TimingTrack.tsx`
- `components/ToolShelfModal.tsx`
- `components/MyPlaybook.tsx`
- `components/MarkdownRenderer.tsx`
- `components/ClutchrHeader.tsx`
- `components/EmblemBadge.tsx`
- `lib/lessonRouter.ts`
- `lib/supabase.ts`
- `context/AthleteContext.tsx`
- `lib/lessonAudio.ts`
- `product/core-ux-loop-audit.md`
- `product/reward-progression-audit.md`
- `package.json`

## 4. Current lesson player architecture summary

The lesson player is a single Expo Router screen at `app/lesson/[id].tsx`. It loads a record by id from `legacy_lessons_staging`, falls back to `content_cards`, reads the record's `steps` array, and advances with local `stepIndex` state. The screen owns loading/error/empty states, speech controls, step progress, completion gating, boss/checkpoint self-rating, XP handoff, and the completion payoff overlay.

Step rendering is local to the same screen:

- Non-variant step types route through `StepRenderer` to `SparkStep`, `ChoiceStep`, `ChecklistStep`, `VisualizationStep`, `TimerStep`, `ReflectionStep`, `FeedbackStep`, and `NoticeWonderStep`.
- Interactive step records with `ui_variant` route through `VariantRenderer` to existing component files.
- Final-step completion uses `CompletionInteraction` so the last action remains reliable and completion is not triggered before the athlete taps the final control.
- XP persistence remains delegated to `AthleteContext.completeLesson`, preserving the reward/progression pass.

## 5. Supported step types found in code

Supported non-variant step types:

- `spark`
- `text`
- `action`
- `choice`
- `scenario`
- `scenario_pick`
- `decision`
- `freeze_frame`
- `checklist`
- `quick_reset`
- `cue`
- `visualization`
- `reframe_builder`
- `pressureRep`
- `timer`
- `pressure_rep`
- `reflection`
- `feedback`
- `reward`
- `notice_wonder`

Unknown non-variant types currently fall back to the Spark renderer instead of crashing.

## 6. Supported ui_variants found in code

Supported interactive variants in `VariantRenderer`:

- `strike_zone_visualizer`
- `pitch_sequence_chess`
- `field_iq_board`
- `throw_decision_board`
- `leverage_ladder`
- `routine_card_builder`
- `pressure_replay`
- `snapshot_read`
- `jump_read`
- `timing_track`
- `confidence_slider`
- `pitch_count_board`

Unsupported variants now show a skip-ready fallback card instead of a blank/dead state.

## 7. Existing component inventory

### Lesson/interactions

- `PitchSequenceChess`: pitcher/catcher sequencing and pitch target decision rep.
- `ThrowDecisionBoard`: defensive throw priority decision rep.
- `RoutineCardBuilder`: build/save routine blocks.
- `JumpRead`: baserunning/outfield first-read option picker.
- `LeverageLadder`: rank pressure priorities in order.
- `StrikeZoneVisualizer`: strike-zone hunt or swing/take decision.
- `SnapshotRead`: freeze-frame cue read.
- `ConfidenceSlider`: self-check slider with threshold feedback.
- `PitchCountBoard`: count simulation and pitch-result planning.
- `FieldIQBoard`: field coverage/target board.
- `PressureReplay`: multi-beat pressure sequence.
- `TimingTrack`: rhythm/tap timing rep.
- `CompletionInteraction`: final-step finish interaction.

### App/supporting UI

- `ToolShelfModal`: quick tools and print-card style drills outside the lesson player.
- `MyPlaybook`: saved cue/playbook builder flow.
- `MarkdownRenderer`: markdown article/body renderer.
- `ClutchrHeader`: shared header variants/progress.
- `EmblemBadge`: rank/identity badge.
- `SkeletonLoader`, `VoltChip`, and `components/ui.tsx`: reusable app UI primitives not directly part of lesson flow.

## 8. Which components are used in the lesson player

Directly used by `app/lesson/[id].tsx`:

- `ClutchrHeader`
- `CompletionInteraction`
- `EmblemBadge`
- `StrikeZoneVisualizer`
- `PitchSequenceChess`
- `FieldIQBoard`
- `ThrowDecisionBoard`
- `LeverageLadder`
- `RoutineCardBuilder`
- `PressureReplay`
- `SnapshotRead`
- `JumpRead`
- `TimingTrack`
- `ConfidenceSlider`
- `PitchCountBoard`

Not directly used inside the lesson player:

- `ToolShelfModal`
- `MyPlaybook`
- `MarkdownRenderer`
- `SkeletonLoader`
- `VoltChip`
- `components/ui.tsx`

## 9. Which components appear underused or not used

Based on code wiring, the app already has a strong interaction inventory, but the core lesson rhythm can still appear text/choice/cue-heavy if content does not place variants often enough. Without live Supabase content counts in this repo, usage frequency must be validated against production data; however, the underutilization risk is highest for the most active baseball-rep components:

- `PressureReplay`: likely best boss/gauntlet component; should appear more in boss weeks and late-path lessons.
- `TimingTrack`: highly active and underused for tempo/internal clock reps.
- `FieldIQBoard` and `ThrowDecisionBoard`: should anchor defensive IQ lessons instead of text-first explanations.
- `JumpRead` and `SnapshotRead`: ideal for baserunning/outfield/freeze-frame reads.
- `PitchCountBoard` and `StrikeZoneVisualizer`: ideal for hitter approach and pitcher/catcher count leverage.
- `RoutineCardBuilder`: useful for routine/save moments; should not be overused as a static reflection substitute.

## 10. P0 bugs

- Malformed `steps` could produce unsafe assumptions if `lesson.steps` was not an array. Fixed with array guarding.
- Unsupported or malformed interactive variants could strand the athlete. The existing fallback was strengthened with clear cleanup language and a skip action.
- Choice correctness could be too dependent on content shape. This pass added normalization for ids, keys, values, boolean correctness, quality/outcome strings, `correct_choice_id`, `correct_answer_id`, `answer_id`, `correct_index`, and `answer_index`.
- Audio could continue after exit or overlap between step changes. This pass routes cleanup through `stopSpeech()` on unmount, id change, mute, step change, and exit.

## 11. P1 polish issues

- Spark/text steps are readable but can still feel like passive reading when content is paragraph-heavy.
- Choice steps look premium but can feel school-like when the CTA says only “Next” and wrong/acceptable/correct states are not explicitly coached.
- Notice/Wonder has a strong interaction shape but should read more like scouting a scene than answering a worksheet.
- Final completion needs a small ceremonial lock-in moment without reintroducing risky gestures.
- Loading/empty states should use rep language and never say the app has a broken lesson in a classroom tone.

## 12. P2 future enhancements

- Add content analytics to count step-type and variant frequency by lesson family.
- Add a lesson QA dashboard that flags long text density, missing feedback, missing choice ids, unsupported variants, and variant payload shape mismatches before publishing.
- Add more role-aware copy in shell labels when athlete role is available.
- Add a dedicated “Rapid Rep” flow in Game Mode or lesson extensions, not in this polish pass.

## 13. Audio/TTS findings

- TTS is controlled in the lesson player with `expo-speech` and helper cleanup from `lib/lessonAudio.ts`.
- The player speaks step text from `content`, `text`, `prompt`, `question`, `body`, or `title`.
- Before this pass, the screen mixed direct `Speech.stop()` calls with helper cleanup and could keep audio alive on some navigations.
- Safe fix made: use `stopSpeech()` consistently on unmount, id change, step change cleanup, mute, and exit, and stop prior speech before speaking the current step.
- Deferred: no new audio settings system, no new packages, and no full narration queue.

## 14. Feedback alignment findings

- Existing variant components generally show immediate component-specific feedback after a selection/action.
- Choice feedback now normalizes correct/acceptable/wrong states and uses baseball-native fallback feedback if content feedback is missing.
- Wrong fallback coaches the next read instead of shaming.
- Acceptable fallback explains that the decision can work but a cleaner baseball decision exists.
- Correct fallback explains that the read keeps the rep under control.

## 15. Interactive state/reset findings

- `StepRenderer` keys by `stepIndex`, which remounts the renderer as the athlete advances.
- `VariantRenderer` also keys variants by `ui_variant` plus stable step identity, giving interactive components a clean local state reset.
- Choice state is local and remounts per step; this pass also removed reliance on position-based correctness by normalizing identifiers and supported correctness fields.
- Checklist and Notice/Wonder now guard non-array data so malformed payloads do not crash or create broken loops.

## 16. Unsupported/malformed content handling findings

- Missing lesson: existing error route returns with a navigable back action.
- Empty steps: now says “This rep needs cleanup” and offers “Return Home.”
- Unsupported `ui_variant`: now says “This rep needs cleanup,” explains the unsupported setup, and offers “Skip Step.”
- Unknown non-variant step type: falls back to Spark rendering.
- Malformed arrays for choices/checklists/notice/wonder are guarded; future QA should flag them before they reach production.

## 17. Completion handoff findings

- Completion still occurs only through the final action and after the player reaches the last step.
- Production safeguards remain: completion requires minimum elapsed time and all step visitation outside dev.
- First-clear/replay XP behavior from the reward pass is preserved.
- Boss/checkpoint completion still routes through self-rating before payoff.
- Final action remains tap-based and accessible, with a brief lock/fill/check state for ceremony.

## 18. Interaction variety findings

The available component inventory is strong enough to make lessons feel like baseball reps, but content cadence is the deciding factor. The current shell supports an active rhythm; future lesson authoring should avoid repeating Spark → choice → cue → completion too often.

Recommended cadence:

- 1 quick setup/spark max.
- 1 active read/decision component early.
- 1 immediate feedback/coach cue.
- 1 lock-in/cue/routine finish only when needed.
- Boss lessons: 2–3 active components or a `PressureReplay` gauntlet, not a long text chain.

## 19. Safe fixes made in this pass

- Guarded `lesson.steps` with an array check.
- Added robust choice normalization for ids, correctness, acceptable answers, and fallback feedback.
- Changed choice CTA from generic “Next” to a rep/read-oriented state.
- Marked wrong choice selections as failed for session scoring when advancing.
- Guarded checklist and Notice/Wonder arrays against malformed payloads.
- Changed Notice/Wonder instruction copy to “Scout the scene. Tap every clue you see.”
- Improved empty-step and unsupported-variant fallback copy and navigation.
- Standardized lesson audio cleanup with `stopSpeech()`.
- Added a reliable tap-to-finish ceremonial fill/check state to `CompletionInteraction` while preserving its API.

## 20. Future interaction recommendations

### Interaction Utilization Map

- `PitchSequenceChess`: pitcher/catcher sequencing, count strategy, game calling.
- `ThrowDecisionBoard`: infield/outfield priority decisions, throw/cut/hold reads.
- `FieldIQBoard`: coverage, relay, bunt defense, cutoffs, backups.
- `JumpRead`: baserunning reads, outfield first step, steal/no-steal decisions.
- `SnapshotRead`: freeze-frame reads, pitcher delivery, hitter stance, defensive pre-pitch.
- `TimingTrack`: rhythm, tempo, secondary lead, breath timing, internal clock.
- `PressureReplay`: multi-beat pressure reps, boss gauntlets, late-game sequences.
- `RoutineCardBuilder`: pregame, pre-AB, pre-pitch, reset routines, saved plans.
- `StrikeZoneVisualizer`: hitter approach, damage zones, swing/take decisions.
- `PitchCountBoard`: count leverage, approach planning, pitch calling.
- `ConfidenceSlider`: readiness, composure, pressure rating, self-check.
- `LeverageLadder`: priority ranking, pressure hierarchy, decision order.

### Rapid Rep mode concept

Future-only: build a rapid mode with five quick reps of the same component type, such as five throw decisions, five jump reads, or five swing/take reads. This belongs in Game Mode or a lesson extension after the player shell is stable.

### Signature interaction ideas

Future-only concepts, not built in this pass:

- `at_bat_simulator`
- `pitch_flight_occlusion`
- `runner_path_simulator`
- `ball_flight_route_sim`
- `pre_pitch_plan_board`
- `bag_play_footwork_sim`
- `scenario_dialogue` for catcher/leadership reps

### Existing component expansion

- Use `PressureReplay` for boss gauntlets.
- Use `TimingTrack` for tempo/internal clock.
- Use `SnapshotRead` for film-room freeze frames.
- Use `JumpRead` for baserunning/outfield reads.
- Use `ThrowDecisionBoard` and `FieldIQBoard` for defensive IQ.
- Use `StrikeZoneVisualizer` and `PitchCountBoard` for hitter systems.
- Use `RoutineCardBuilder` for routines and saved plans.

## 21. Deferred items

- No lesson database rewrite.
- No new lesson packs or scenarios.
- No new worlds.
- No Supabase schema changes.
- No paywall/revenue changes.
- No Home/Career/Game Mode/Locker/Profile rebuild.
- No new `ui_variant` systems.
- No full audio settings system.
- No screenshot capture because the change was not run in Expo Go in this environment.

## 22. Expo Go QA checklist

1. Open Home.
2. Tap Start Next Rep.
3. Load a normal text/Spark lesson.
4. Move through every step.
5. Confirm button labels are clear.
6. Confirm no blank/dead screens.
7. Confirm audio behaves consistently.
8. Confirm audio stops when moving steps/leaving lesson.
9. Load a choice/scenario lesson.
10. Select an answer and confirm feedback matches.
11. Move to next question and confirm old selection clears.
12. Load PitchSequenceChess and confirm no crash.
13. Load at least two other interactive variants if available.
14. Confirm malformed/unsupported variants show fallback UI.
15. Complete a lesson.
16. Confirm completion does not happen early.
17. Confirm finish interaction is reliable and not clunky.
18. Confirm REP COMPLETE payoff appears.
19. Confirm replay/no-XP behavior from reward pass is preserved.
20. Tap Continue Career and confirm return loop works.
21. Return Home and confirm no Home regression.
22. Check console for new warnings/errors.
