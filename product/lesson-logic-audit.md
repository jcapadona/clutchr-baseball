# Lesson Logic Audit — Step 12

- **Audit date:** 2026-05-07
- **Confirmed sandbox branch:** `work` (Codex sandbox accepted by user as stable-good-ui task/source)
- **Working tree before changes:** clean
- **Remote:** no remotes configured in this sandbox

## Files inspected

- `app/lesson/[id].tsx` — lesson load, step routing, UI variant routing, answer choices, timers, audio, completion, XP, checkpoint/boss overlays, exit behavior.
- `components/PressureReplay.tsx` — pressure-rep timer, delayed beat advancement, completion callback.
- `components/TimingTrack.tsx` — timed animation reps and delayed completion callbacks.
- `components/JumpRead.tsx` — local answer selection, acceptable tier, delayed completion callback.
- `components/StrikeZoneVisualizer.tsx` — correct/acceptable/wrong handling by IDs/zones.
- `components/PitchSequenceChess.tsx` — correct/acceptable combo handling.
- `components/SnapshotRead.tsx` — selected cue ID and feedback alignment.
- `components/ConfidenceSlider.tsx` — local feedback by confidence zone.
- `components/PitchCountBoard.tsx` — evaluation feedback and completion.
- `context/AthleteContext.tsx` — `completeLesson` idempotency at state update layer.
- `lib/lessonRouter.ts` — lesson recommendation/completed lesson usage.
- `lib/supabase.ts` — lesson shape and Supabase query interfaces; no schema changes made.
- `app/(tabs)/career.tsx` — checkpoint/boss metadata detection only.

## Supported step types discovered

The live lesson player routes these `step.type` values:

- `spark`, `text`, `action`
- `choice`, `scenario`, `scenario_pick`, `decision`, `freeze_frame`
- `checklist`, `quick_reset`
- `cue`, `visualization`, `reframe_builder`, `pressureRep`
- `timer`, `pressure_rep`
- `reflection`
- `feedback`, `reward`
- `notice_wonder`

Unknown `step.type` values already fall back to `SparkStep`.

## Supported `ui_variant` values discovered

The live variant router supports:

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

## P0/P1 bug-fix table

| Priority | Area | Finding | Implementation |
| --- | --- | --- | --- |
| P0 | Unsupported `ui_variant` | The default variant branch returned `null`, which could blank/trap a lesson step. | Added a baseball-native fallback card: “This rep needs an update.” It provides a skip path and logs lesson ID, step index, and unsupported variant in development. |
| P0 | Answer/feedback alignment | Generic choice steps shuffled choices and used fallback index IDs after shuffle; correctness relied on per-choice fields and could drift for ID-less choices. | Added stable choice ID normalization before shuffle, selected-choice ID state, an answer resolver, correct/acceptable/incorrect tier support, and selected-ID feedback lookup. |
| P0 | Shuffled answers | Shuffling raw choices before deriving fallback IDs could make index-based IDs unstable. | Normalized full choice objects with IDs first, then shuffled objects while preserving IDs. |
| P0 | Malformed lessons | Missing/empty/non-array `steps` could show a generic/empty state and should never complete. | Added lesson normalization and a safe “Couldn’t load this rep.” fallback with back path; malformed lessons do not enter completion flow. |
| P1 | Audio cleanup | Step speech stopped TTS but not the shared lesson audio helper; exit paths did not consistently stop audio. | Routed cleanup through `stopSpeech()` on unmount, step change, mute, error back, exit, and completion navigation; missing audio already fails safely in `lessonAudio`. |
| P1 | Timer/pressure cleanup | Variant completion delay and pressure/timing timeouts could fire after unmount; pressure timer expiration had no clear retry state. | Cleared delayed completion callbacks, pressure timers/timeouts, and timing-track timeouts/animations; added pressure timer expired retry state. |
| P1 | Checkpoint/boss metadata | Career used `node_type === 'checkpoint'` but ignored `is_checkpoint`; Lesson Player used only booleans. | Normalized metadata to `is_* === true || node_type === ...` in Lesson Player and Career. |
| P1 | Completion/XP idempotency | `AthleteContext.completeLesson` already prevented duplicate XP, but Lesson Player still displayed full XP on retake. | Added Lesson Player guard so already-completed lessons do not call completion again and display `+0 XP` on retake. |

## QA checklist

- Unsupported `ui_variant`: reasoned through variant default branch; fallback renders copy and skip path instead of `null`, and logs useful development metadata.
- Generic choice/scenario/decision: reasoned through each selected ID; feedback and status resolve from the selected ID, not visual index.
- Shuffled choices: choices are normalized to stable IDs before shuffle, so reload/re-render ordering does not change grading identity.
- Acceptable answers: generic choices support acceptable IDs from step-level acceptable arrays or per-choice `quality/outcome/acceptable` fields.
- Retry/reset: generic choice state is keyed by the step component, so step changes remount and clear selection/feedback; local retry-capable variants inspected where present.
- Missing/malformed lesson: missing lesson/invalid steps render “Couldn’t load this rep.” with safe back path and never call completion.
- Audio: `stopSpeech()` runs on step change, mute, unmount, exit, error back, and completion navigation.
- Timer/pressure: intervals/timeouts are cleared on cleanup; pressure timer expiration shows an explicit retry and does not auto-complete.
- Checkpoint/boss: computed flags now use the same boolean-or-`node_type` meaning for lesson overlays and Career map divider logic.
- Completion/XP: already-completed lesson IDs are not awarded full duplicate XP by Lesson Player.

## Deferred P2/P3 items

- Broader schema/content validation across all lesson families.
- Dedicated automated tests for every `ui_variant` contract.
- Full audit of every delayed animation callback in non-lesson screens.
- Any lesson content rewrites or new variants.
- Supabase schema updates.

## Exact implementation summary

- Added local lesson-player helpers for lesson normalization, checkpoint/boss metadata flags, stable choice IDs, feedback lookup, and answer result resolution.
- Reworked generic `ChoiceStep` to select and grade by stable choice ID and support acceptable outcomes.
- Added unsupported `ui_variant` fallback rendering and development logging.
- Normalized malformed lessons to a safe error state.
- Tightened lesson audio cleanup around step changes, exits, mute, and completion navigation.
- Guarded Lesson Player completion display/calls for already-completed lessons.
- Cleared relevant lesson/variant timer and delayed callback resources in `PressureReplay`, `TimingTrack`, `JumpRead`, and `VariantRenderer`.
- Normalized checkpoint/boss flag logic in both Lesson Player and Career.
