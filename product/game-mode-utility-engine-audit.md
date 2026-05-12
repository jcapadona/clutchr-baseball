# Game Mode Utility Engine Audit — Clutchr Baseball

## 1. Audit date

May 12, 2026

## 2. Current branch

`work`

> Sprint brief expected `stable-good-ui`, but the checked-out repository branch is `work`.

## 3. Files inspected

- `app/(tabs)/gamemode.tsx`
- `app/(tabs)/index.tsx`
- `context/AthleteContext.tsx`
- `lib/personalCue.ts`
- `lib/progressionRanks.ts`
- `components/ToolShelfModal.tsx`
- `components/MyPlaybook.tsx`
- `product/core-ux-loop-audit.md`
- `product/reward-progression-audit.md`
- `product/lesson-player-polish-audit.md`

## 4. Current Game Mode architecture summary

Game Mode is currently a local, hardcoded utility surface inside `app/(tabs)/gamemode.tsx`. The file owns the tool catalog, timing buckets, intent chips, role filtering, recommended-tool ordering, print-card detail view, and interactive runner. The screen reads athlete profile context from `useAthlete()` to personalize role, name, season phase, and cue selection, but it does not persist Game Mode tool usage beyond the existing one-tool-per-day XP cap stored in AsyncStorage.

Navigation is preserved inside the existing Game Mode tab: selecting a tool sets local `activeTool` and `view`, then renders either the print-card carry view or the interactive step runner. No new routes, schema changes, tables, paywall changes, Home changes, Career changes, Locker changes, or Profile changes were introduced.

## 5. Current Game Mode buckets/tools summary

### Pre

Current Pre tools support pregame prime, bullpen/on-deck lock-in, plan/cue setup, readiness, nerves, and slump preparation. This pass reframes the Pre tab as **Before First Pitch** with intent chips for **Get Ready** and **Lock Plan**.

### Live

Current Live tools support between-pitch reset, between-inning reset, refocus after mistakes, pressure cues, catcher/pitcher sync, two-strike survival, and quick breathe/target/attack flows. This pass reframes the Live tab as **During the Game** with intent chips for **Reset** and **Refocus**.

### Post

Current Post tools support postgame debrief, tough-night reset, arm recovery, position-player recovery, carry-forward cues, and next-day reset thinking. This pass reframes the Post tab as **After the Game** with intent chips for **Debrief** and **Recover**.

### Recovery

Recovery exists today as postgame arm-care and position-player cooldown tools. It is not a standalone system yet. Future Recovery should include readiness check, soreness flag, active recovery suggestion, sleep/recovery discipline, and return-to-throw awareness.

### Intel/Future

Opponent scouting, today’s plan, pitcher/hitter tendencies, and dugout cards are not built yet. They should remain future architecture until the app has a safe data model and clear athlete workflow.

## 6. Current tool detail flow summary

Print-card tools render a local detail view with a Back to Game Mode action, no-phone field warning, carry-card instructions, numbered sequence steps, cue sequence, and a React Native share action. Interactive tools render a step runner with cue, instruction, optional timer, completion state, and the existing Game Mode daily XP cap. This pass polished the print-card view into a clearer carry-card experience while preserving the existing share behavior.

## 7. P0 bugs

No new P0 bugs were found in this pass. The Game Mode tool flow stays local, avoids schema writes, and preserves the anti-farming XP cap.

## 8. P1 UX/product issues

1. Game Mode still felt like a tool-card collection instead of a utility command center.
2. The top Pre/Live/Post state did not fully answer “what am I doing right now?”
3. The intent chips were useful, but Pre had a generic Refocus chip instead of a stronger pregame “Lock Plan” intent.
4. The pressure cue section used the right data path but looked static and under-explained.
5. Recommended tools needed clearer “use first” hierarchy.
6. More Tools and Train IQ needed stronger secondary framing so they feel connected to baseball-day usage.
7. Print-card detail copy needed to better communicate “no phone on the field; carry this before you go.”

## 9. P2 future enhancements

1. Add a small Game Mode tool registry module once the catalog becomes too large for the screen file.
2. Add persistent postgame debrief entries only after deciding the Supabase data model.
3. Add recovery readiness and soreness flags after establishing privacy/product rules.
4. Add opponent Intel only after the app can represent opponent, role, and scouting notes safely.
5. Add richer Drill Mode/Rapid Rep metadata when the IQ reps have a standardized result model.

## 10. Safe UI changes made

1. Added tab-specific command-center copy for Pre, Live, and Post.
2. Added clearer tab guidance lines for what each bucket supports.
3. Replaced Pre’s generic Refocus chip with **Lock Plan** and mapped bullpen/on-deck prep to it.
4. Renamed the recommended section by tab: Use First, Next Best Tool, and Carry Forward.
5. Added selected-intent labeling to the recommendation header.
6. Made the first recommended tool visually stronger with an App Pick label and stronger border/surface treatment.
7. Added duration plus utility tag on tool cards: Dugout-ready, Quick reset, or Phone-guided.
8. Reworked the pressure cue section to show a compact label, cue text, and “Carry one cue into the next rep” helper.
9. Reframed Train IQ as baseball IQ reps and 5 quick decisions.
10. Polished print-card copy, share text, carry-card labels, and no-phone warning.

## 11. Deferred architecture changes

- No Supabase schema changes.
- No new tables.
- No Game Mode architecture rebuild.
- No paywall/revenue logic changes.
- No Home/Career/Profile/Locker architecture changes.
- No new external dependencies.
- No new route system.
- No postgame persistence.
- No Intel database.
- No Recovery readiness system.

## 12. Future Game Mode tool registry recommendation

When Game Mode grows beyond this sprint, move the catalog metadata into a small typed registry such as `lib/gameModeTools.ts` with:

- stable tool IDs
- timing bucket
- intent bucket
- role availability
- mode type
- duration
- utility tags
- recommended priority rules
- print-card capability
- XP eligibility

Keep rendering and routing in `app/(tabs)/gamemode.tsx` until the registry proves necessary. Avoid a database-backed tool catalog until content governance, versioning, and offline behavior are defined.

## 13. Future Intel/Postgame/Recovery roadmap

### Stage 1 — Current pass

- Clearer command-center UI.
- Better right-now intent.
- Stronger recommended tools.
- Better carry-card detail.

### Stage 2 — Postgame loop

- One controllable win.
- Biggest miss.
- Carry-forward cue.
- Next-day reset.

### Stage 3 — Recovery readiness

- Readiness check.
- Soreness flag.
- Active recovery suggestion.

### Stage 4 — Opponent Intel

- Today’s opponent.
- Role-specific game plan.
- Between-inning notes.
- Dugout card.

### Stage 5 — Rapid Rep / Drill Mode

- 5 quick decision reps.
- Pitch IQ.
- Field IQ.
- Baserunning reads.
- Catcher calls.

## 14. Expo Go QA checklist

1. Open Game Mode.
2. Confirm Game Mode loads.
3. Toggle Pre / Live / Post.
4. Confirm header/subtitle/guidance changes by tab.
5. Confirm intent chips feel useful.
6. Confirm recommended tools remain tappable.
7. Open Between-Pitch Reset.
8. Confirm Back to Game Mode works.
9. Confirm no-phone/print warning is clear.
10. Confirm Share/Screenshot/Print button still works or safely opens share.
11. Confirm Game Mode tab remains active.
12. Confirm Locker/Profile/Home tabs still work.
13. Confirm Game Mode tool XP cap from reward pass is not broken.
14. Confirm no Home layout regression.
15. Confirm no lesson player regression.
