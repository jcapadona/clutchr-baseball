# Pregame + Postgame Next Rep Audit

## 1. Audit date
- 2026-05-12

## 2. Current branch
- Requested branch: `stable-good-ui`
- Actual branch observed in this workspace: `work`

## 3. Files inspected
- `app/(tabs)/gamemode.tsx`
- `app/(tabs)/index.tsx`
- `contexts/AthleteContext.tsx`
- `components/MyPlaybook.tsx`
- `components/ToolShelfModal.tsx`
- `lib/lessonRouter.ts`
- `product/curriculum-engine-standardization-audit.md`
- `product/reward-progression-audit.md`
- `product/core-ux-loop-audit.md`
- `product/game-mode-utility-engine-audit.md` was requested but was not present in this checkout.

## 4. Current Game Mode Pre/Post tool summary
- Game Mode already had Pre / Live / Post timing tabs and a hardcoded local `GAME_TOOLS` catalog.
- Pregame had strong starter routines such as Pregame Prime, First AB Lock-In, Pre-Bullpen Lock-In, Nerves to Attack, and Slump Pregame Reset.
- Postgame had a general Postgame Debrief, Tough Night Reset, Arm Recovery for pitchers, and Post-Game Recovery for position players.
- Tool completion already used a local AsyncStorage daily cap for a small Game Mode XP bonus.

## 5. Pregame gaps
- Pregame did not yet feel like a complete “Before First Pitch” utility loop.
- Role cue selection was implied in copy, but not surfaced as its own practical tool.
- There was no clear first-rep planning card across roles.
- There was no screenshot-ready dugout/carry card for pregame.
- Pregame readiness was split across several tools, but the screen did not clearly say “use this first.”

## 6. Postgame gaps
- Postgame debrief was useful but too broad and long for the desired quick debrief behavior.
- There was no direct “biggest miss maps to next useful rep” MVP loop.
- Carry-forward cue behavior was not surfaced in the Post tab after debrief completion.
- Recovery existed, but there was no general quick recovery check for all roles.
- Postgame lacked a screenshot-ready carry card summary.

## 7. Current state/persistence limitations
- No Supabase schema changes were made.
- No backend session-log table exists yet.
- Game Mode can safely use AsyncStorage because it already uses AsyncStorage for the daily Game Mode completion cap.
- This pass stores only the most recent postgame debrief summary locally on-device via AsyncStorage under a Game Mode-scoped key.
- The locally cached summary is not shared with Home, lesson routing, backend analytics, or Athlete profile state.

## 8. MVP changes made
- Added Pregame 90-Second Switch-On as the recommended first pregame activity.
- Added Role Cue Lock-In, First Rep Plan, Pregame Confidence Check, and Pregame Carry Card.
- Upgraded Postgame Debrief into Postgame 60-Second Debrief with a short interactive chip flow.
- Added Biggest Miss → Next Rep, Carry-Forward Cue Builder, Recovery Check, and Postgame Carry Card.
- Added local miss-category-to-next-rep mapping for the MVP next useful rep recommendation.
- Added a Post tab carry-forward card that appears after a debrief is saved.
- Added a Pre tab command card that frames the screen as “Before First Pitch” and shows role cue examples.

## 9. Deferred backend/session-log architecture
- Do not add backend tables until the product confirms the session data model.
- Future backend should capture a session snapshot with: session type, date, role, controllable win, biggest miss category, carry-forward cue, next useful rep, optional recovery flag, and source tool.
- Avoid making one rough game trigger slump or identity-level interventions.
- Repeated patterns across multiple sessions should drive heavier recommendations, not one bad debrief.

## 10. Recommended future Postgame → Next Day Reset → Next Best Rep state machine
1. `Game/practice ends`
2. `Postgame 60-Second Debrief completed`
3. `Local cached session snapshot created`
4. `Next day reset card appears on Home`
5. `Athlete confirms or edits carry-forward cue`
6. `Next best rep is selected from miss category + role + recent history`
7. `Athlete completes the rep/tool`
8. `Pattern is tracked only after repeated signals`

## 11. Recommended future Pregame system
- Add a persistent “today’s role job” object that can be created in Pregame and reused in Live tools.
- Let athletes choose from role-specific cue banks with custom cue fallback.
- Add a Coach/Parent-safe printable dugout card mode.
- Allow Pregame to pull yesterday’s carry-forward cue once backend state exists.
- Keep Pregame short: cue, first job, risk to avoid, reset line.

## 12. Recommended future Postgame system
- Persist debriefs as lightweight session logs.
- Track miss categories over time and escalate only when patterns repeat.
- Connect recovery flags to safer next-day recommendations.
- Surface carry-forward cue on Home and in Pregame the next day.
- Integrate next-best-rep with the lesson/tool router after the data model is stable.

## 13. Expo Go QA checklist
1. Open Game Mode.
2. Toggle Pre / Live / Post.
3. Confirm Pre has more useful tools.
4. Open Pregame 90-Second Switch-On.
5. Open Role Cue Lock-In or First Rep Plan.
6. Confirm Back to Game Mode works.
7. Confirm Post has more useful tools.
8. Open Postgame 60-Second Debrief.
9. Enter/select one controllable win.
10. Enter/select one biggest miss.
11. Select/save carry-forward cue if available.
12. Confirm summary/carry-forward card appears.
13. Confirm Next Useful Rep appears if implemented.
14. Confirm Recovery Check opens.
15. Confirm Game Mode XP cap is not broken.
16. Confirm Home still loads.
17. Confirm Career still loads.
18. Confirm Locker/Profile still load.
19. Confirm lesson player still works.
20. Confirm no new crashes/warnings.
