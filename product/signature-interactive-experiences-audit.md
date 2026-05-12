# Signature Interactive Experiences Audit

## 1. Audit date

- 2026-05-12

## 2. Current branch

- `work` in this checkout.
- Sprint brief references `stable-good-ui`; this repo was already on `work` when the pass began.

## 3. Files inspected

- `app/(tabs)/gamemode.tsx`
- `app/lesson/[id].tsx`
- `components/PitchSequenceChess.tsx`
- `components/StrikeZoneVisualizer.tsx`
- `components/FieldIQBoard.tsx`
- `components/ThrowDecisionBoard.tsx`
- `components/PressureReplay.tsx`
- `components/SnapshotRead.tsx`
- `components/JumpRead.tsx`
- `components/TimingTrack.tsx`
- `components/PitchCountBoard.tsx`
- `components/LeverageLadder.tsx`
- `components/ConfidenceSlider.tsx`
- `components/RoutineCardBuilder.tsx`
- `components/CompletionInteraction.tsx`
- `context/AthleteContext.tsx`
- `product/lesson-player-polish-audit.md`
- `product/game-mode-utility-engine-audit.md`
- `product/pregame-postgame-next-rep-audit.md`
- `product/career-world-depth-utilization-audit.md`
- `product/curriculum-engine-standardization-audit.md`

## 4. Existing interaction component inventory

| Component | Current product value | Rapid Rep fit |
| --- | --- | --- |
| `PitchSequenceChess` | Pitch-calling, catcher/pitcher command, count leverage, sequencing. | High for catcher command and pitcher sequencing playlists. |
| `StrikeZoneVisualizer` | Hitter swing/take, zone discipline, damage/chase area visualization. | High for Swing/Take and pitch-recognition drills. |
| `FieldIQBoard` | Defensive alignment, field-state decisions, coverage/cut concepts. | High for defensive IQ boards and freeze-frame defensive reads. |
| `ThrowDecisionBoard` | Throw priority and infield/outfield decision choices. | High for rapid throw-priority reps. |
| `JumpRead` | Baserunning first-step, steal, dirt-ball, and ball-in-play read logic. | High for Runner Reads. |
| `SnapshotRead` | Freeze-frame situation recognition. | High for pre-pitch, field, baserunning, and pressure reads. |
| `PressureReplay` | Multi-beat pressure scenario and reset decision flow. | High for Pressure Replay playlists. |
| `TimingTrack` | Tempo, lead, internal clock, sequencing timing. | Medium/high for timing and baserunning rhythm reps. |
| `PitchCountBoard` | Count leverage and approach planning. | High for pitch-count decision ladders. |
| `LeverageLadder` | Priority hierarchy under pressure. | Medium/high for late-game and pressure choices. |
| `RoutineCardBuilder` | Athlete-owned routine / saved plan creation. | Medium for setup or post-drill reflection, not fast decisions. |
| `ConfidenceSlider` | Readiness/composure check. | Medium for entry/exit state, not core rapid decision loop. |
| `CompletionInteraction` | Premium lesson completion action. | Low for in-drill reps; useful for final ceremony later. |

## 5. Which components are currently used in lessons

`app/lesson/[id].tsx` imports and routes lesson `ui_variant` values to these interactive components:

- `strike_zone_visualizer` → `StrikeZoneVisualizer`
- `pitch_sequence_chess` → `PitchSequenceChess`
- `field_iq_board` → `FieldIQBoard`
- `throw_decision_board` → `ThrowDecisionBoard`
- `leverage_ladder` → `LeverageLadder`
- `routine_card_builder` → `RoutineCardBuilder`
- `pressure_replay` → `PressureReplay`
- `snapshot_read` → `SnapshotRead`
- `jump_read` → `JumpRead`
- `timing_track` → `TimingTrack`
- `confidence_slider` → `ConfidenceSlider`
- `pitch_count_board` → `PitchCountBoard`
- Final lesson completion uses `CompletionInteraction`.

## 6. Which components are good Rapid Rep candidates

Best first candidates:

1. `PitchSequenceChess` — catcher/pitcher command, sequencing, count leverage.
2. `StrikeZoneVisualizer` — hitter swing/take and chase discipline.
3. `FieldIQBoard` — defensive field-state boards.
4. `ThrowDecisionBoard` — fast throw-priority choices.
5. `JumpRead` — baserunning first-step and dirt-ball reads.
6. `SnapshotRead` — freeze-frame reads for any role.
7. `PressureReplay` — pressure reset and multi-beat composure decisions.

Good supporting candidates:

- `TimingTrack` for timing windows and internal clock.
- `PitchCountBoard` for count leverage.
- `LeverageLadder` for pressure priorities.
- `ConfidenceSlider` for readiness checks before or after a drill.
- `RoutineCardBuilder` for saving a repeatable plan after a session.

## 7. MVP chosen for this pass

Stage 1 Rapid Rep MVP was chosen:

- Local, in-screen Game Mode drill view.
- Two playable 5-rep flows: `Pitch IQ` and `Field IQ`.
- Small static data arrays inside `app/(tabs)/gamemode.tsx`.
- Existing Game Mode screen patterns, dark premium cards, progress rail, immediate feedback, final summary, `Run it back`, and `Back to Game Mode`.
- Roadmap cards for Runner Reads, Swing/Take, and Pressure Replay without pretending those flows are done.

## 8. Safe implementation notes

- No Supabase schema changes.
- No backend tables.
- No new routes.
- No new dependencies.
- No lesson-player logic changes.
- No Home, Career, Profile, Locker, paywall, onboarding, or revenue changes.
- Rapid Rep state is local React state only.
- Rapid Rep does not call `updateAthleteState`, does not award lesson XP, and does not change Career completion.
- Existing Game Mode tool completion remains the only Game Mode XP path, with the existing daily cap preserved.

## 9. Future at-bat simulator roadmap

Stage 3 should be an at-bat simulator MVP, not a full baseball engine:

- 5-pitch sequence maximum.
- Count, zone, pitch type, pitcher/hitter plan.
- Swing/take/approach decision per pitch.
- Immediate feedback after each pitch.
- Summary: chase rate, damage-zone discipline, count leverage quality.
- Later: role-specific hitters, pitcher tendencies, handedness, scouting reports, and difficulty tiers.

## 10. Future pitch recognition occlusion roadmap

Stage 4 should add occlusion after the Rapid Rep habit is proven:

- Show early pitch cue / release window.
- Hide the pitch late.
- Athlete identifies pitch type, zone band, and swing/take decision.
- Start with lightweight static visuals or existing strike-zone patterns.
- Later add richer video/animation assets only when content and performance constraints are understood.

## 11. Future defensive IQ board roadmap

Stage 5 should turn defense into a signature board:

- Field state: runners, outs, score, inning, hit speed, ball location.
- Athlete chooses throw, cutoff, coverage, or hold decision.
- Immediate feedback: inning control, run prevention, free-base avoidance.
- Component candidates: `FieldIQBoard`, `ThrowDecisionBoard`, `SnapshotRead`, `LeverageLadder`.
- Future bank should split infield, outfield, catcher, and pitcher fielding decisions.

## 12. Future baserunning read roadmap

Future Runner Reads should include:

- Steal jump reads.
- Dirt-ball reads.
- First-to-third reads.
- Tag-up / halfway / score-from-first decisions.
- Component candidates: `JumpRead`, `SnapshotRead`, `TimingTrack`, `LeverageLadder`.
- Difficulty tiers should account for outs, ball depth, defender arm, game score, and risk tolerance.

## 13. Future catcher/pitch sequencing roadmap

Future Catcher Command / Pitch Sequencing should include:

- Count leverage.
- Pitcher feel and fatigue.
- Hitter timing and chase pattern.
- Mound visit / reset decisions.
- Coverage communication.
- Component candidates: `PitchSequenceChess`, `PitchCountBoard`, `FieldIQBoard`, `PressureReplay`, `ConfidenceSlider`.

## 14. P0/P1/P2 risks

### P0

- Creating an XP farming loophole by awarding repeat drill XP.
- Breaking Game Mode Pre/Live/Post tools while adding drills.
- Routing to a non-existent or unstable drill route.
- Touching lesson completion or Career completion by accident.

### P1

- Rapid Rep copy feeling like a school quiz instead of a baseball decision engine.
- Small local drill bank becoming stale after repeated use.
- Future component-backed reps needing normalization wrappers to avoid malformed content crashes.
- Roadmap cards being mistaken for playable flows if visual hierarchy is unclear.

### P2

- Color balance: too many accent colors could compete with the current premium green Game Mode style.
- Long scenario text could crowd smaller phones.
- Future role-specific content could fragment if not mapped to clear scenario bank tags.

## 15. Safe app changes made

- Replaced the prior Train IQ route pushes with an in-screen Game Mode Rapid Rep runner.
- Added local `Pitch IQ` and `Field IQ` 5-rep drills.
- Added local rep data with prompt, options, outcome, feedback, reason, and tag.
- Added immediate feedback cards after choices.
- Added final summary with read quality, clean-read count, coaching takeaway, `Run it back`, and `Back to Game Mode`.
- Added non-playable roadmap cards for Runner Reads, Swing/Take, and Pressure Replay.
- Kept Game Mode XP behavior untouched and explicitly labeled Rapid Rep as no lesson XP.

## 16. Deferred systems

- Full at-bat simulator.
- Pitch recognition occlusion.
- Supabase-backed scenario banks.
- Large content packs.
- Role-specific hundreds-of-reps bank.
- Boss/checkpoint Rapid Rep playlists.
- New lesson content system.
- New routes.
- Analytics/instrumentation.
- Paywall/revenue changes.
- Career progression integration.

Future Rapid Rep scenario banks should have hundreds of baseball scenarios, be role-specific, include difficulty tiers, map to reusable components, support boss/checkpoint playlists later, and move to Supabase only after the local MVP proves the flow.

## 17. Expo Go QA checklist

1. Open Game Mode.
2. Confirm Pre/Live/Post still work.
3. Scroll to Train IQ / Drill Mode.
4. Open Pitch IQ or first Rapid Rep drill.
5. Complete 5 reps.
6. Confirm immediate feedback appears each rep.
7. Confirm final summary appears.
8. Tap Run It Back.
9. Confirm drill restarts.
10. Tap Back to Game Mode.
11. Open Field IQ or second Rapid Rep drill if implemented.
12. Confirm Game Mode XP cap is not broken.
13. Confirm Pregame/Postgame tools still work.
14. Confirm Home loads.
15. Confirm Career loads.
16. Confirm lesson player still works.
17. Confirm no new crashes/warnings.

## Signature interaction build order

### Stage 1 — Rapid Rep MVP

- 5 quick decisions.
- Local data.
- Pitch IQ + Field IQ.

### Stage 2 — Component-backed Rapid Reps

- Reuse existing components directly.
- Candidates: `JumpRead`, `SnapshotRead`, `ThrowDecisionBoard`, `StrikeZoneVisualizer`.

### Stage 3 — At-Bat Simulator MVP

- Count/zone/pitch type.
- Swing/take/approach decision.
- Immediate feedback.
- 5-pitch AB sequence.

### Stage 4 — Pitch Recognition Occlusion

- Early pitch cue.
- Hide pitch late.
- Identify pitch/zone/swing decision.

### Stage 5 — Defensive IQ Board

- Field state.
- Runners/outs/score.
- Throw/cut/coverage choice.

### Stage 6 — Catcher Command

- Sequence calls.
- Mound visit decisions.
- Pitcher-state management.

### Stage 7 — Scenario Bank

- 100s of role-specific reps.
- Supabase-backed eventually.
- Difficulty tiers.
- Boss/rapid rep playlists.
