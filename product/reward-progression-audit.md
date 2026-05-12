# Reward / Progression Identity Audit

## 1. Audit date

May 12, 2026

## 2. Current branch

`work`

## 3. Files inspected

- `lib/progressionRanks.ts`
- `components/EmblemBadge.tsx`
- `context/AthleteContext.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/career.tsx`
- `app/(tabs)/gamemode.tsx`
- `app/lesson/[id].tsx`
- `app/upgrade.tsx`
- `lib/supabase.ts`
- `lib/lessonRouter.ts`
- `product/core-ux-loop-audit.md`

## 4. Current XP model summary

- Athlete XP is stored in `athleteState.total_xp`, persisted locally in AsyncStorage and synced as part of the existing `athlete_profiles.state` JSON payload when authenticated.
- Lessons pull `xp_reward` from `legacy_lessons_staging` and award that value on first successful completion.
- Failed/partial lesson completion can award half XP in the lesson player, but only when the lesson has not been completed before.
- `completeLesson(lessonId, xp)` prevents repeated completed lessons from adding more XP by returning early when `completed_lessons` already contains the lesson id.
- Home daily missions can add bonus XP once per day: currently +30 XP for completing two reps and +15 XP for opening/completing the Game Mode daily signal path.
- Game Mode tools previously awarded +25 XP per unique tool per day. This pass capped tool XP to one +25 training bonus per day so tools support the loop without out-earning core lesson work.

## 5. Current rank/emblem model summary

- Rank is calculated entirely from `total_xp` in `lib/progressionRanks.ts`.
- The MVP ladder is: Foundation, Built, Locked In, Command, Elite.
- Current thresholds remain unchanged in this pass: 0, 1,000, 3,000, 7,500, and 15,000 XP.
- The rank utility now exposes current rank, next rank, progress to next rank, XP into current rank, XP needed for next rank, rank label, short description, material/style metadata, max-rank state, and next milestone label.
- Emblems are rendered as compact home-plate-inspired vector badges using existing React Native SVG and Expo LinearGradient dependencies.

## 6. Where rewards appear in app

- Home: compact XP/streak pills in the header; current rank/emblem and next-rank text inside the Next Rep card; daily progress card.
- Lesson completion: earned XP count, path movement, current rank emblem/progress, next-rank milestone copy, and Continue Career CTA.
- Profile: primary identity card with rank emblem, earned XP bar, rank description, earned work summary, streaks, completed reps, strengths, and phase map.
- Career: chapter/world progress, completed/locked/current nodes, checkpoint/boss labels, XP for first clear, and world-cleared state.
- Upgrade: current premium messaging references clean rank progress and future milestone/badge value without changing paywall logic.
- Game Mode: small daily XP support after completing a tool, capped in this pass.

## 7. P0 issues

- Replayed lessons were protected in persistence, but the completion screen could still visually show the lesson reward amount even when no XP was actually added. Fixed in this pass by detecting already-completed lessons before setting the completion reward display.
- Game Mode tool XP could become a farming path because every unique tool could award XP each day. Fixed in this pass by limiting Game Mode XP to one small daily tool bonus.

## 8. P1 issues

- Rank metadata was visually useful but not descriptive enough to answer why a rank was earned or what to do next. Fixed by adding rank descriptions, next actions, materials, colors, and explicit progress fields.
- Completion reward copy was close but still leaned generic in places. Polished toward “Rep complete,” “Boss cleared,” “Rank progress moved,” “Next rep loaded,” and first-clear language.
- Profile needed a clearer line between earned work and self-input. Added rank proof copy and an earned-work summary before the coach snapshot.
- Career XP labels needed to communicate first-clear value instead of generic XP collection. Updated node XP labels to “first clear.”

## 9. P2 polish/future items

- Add server-backed XP event records for perfect anti-farming, auditability, and future prestige analytics.
- Add role-specific mastery tracks after the MVP loop is stable.
- Add prestige materials only after Elite has enough real content depth to support repeated climbing.
- Consider replacing the old Profile phase map thresholds with the canonical rank ladder or a clearly separate “career phase” model.
- Add stronger checkpoint/boss reward differentiation if content metadata supports it consistently.

## 10. Recommended MVP rank ladder

1. Foundation
   - First proof of work.
   - Dark/green plate.
2. Built
   - Consistency starting.
   - Stronger graphite/green plate.
3. Locked In
   - Repeatable routine.
   - Reinforced plate with focus mark.
4. Command
   - Higher standard.
   - Gunmetal plate with restrained gold accent.
5. Elite
   - Top MVP rank.
   - Black/gold/green crest.

## 11. Recommended XP rules

- Core lesson first clear: award the lesson `xp_reward`.
- Partial/failed lesson completion: award reduced XP only on first clear.
- Checkpoint lesson: use content-defined XP, but consider making checkpoint rewards visibly more meaningful once content data is normalized.
- Boss lesson: use content-defined XP, but tune boss XP higher than normal reps when the content ladder is audited.
- Daily mission: small supporting XP, never more important than lessons.
- Tool/Game Mode usage: one small daily training bonus only; tools should sharpen skills, not become the main XP economy.
- Replay: no additional XP unless a future replay/prestige system is explicitly designed.

## 12. Recommended anti-farming rules

- Do not award additional XP for a lesson id already in `completed_lessons`.
- Do not visually show replay XP if persistence will not award replay XP.
- Require all lesson steps to be visited and a minimum elapsed time in production before completion, as currently done in the lesson player.
- Cap tool/Game Mode XP to the first useful completion of the day.
- Keep mission bonuses once per day per mission.
- Future server-side rule: record XP events with `source_type`, `source_id`, `awarded_at`, and `award_reason` to prevent cross-device or offline merge abuse.

## 13. Recommended unlock moments

- Normal rep: “Rep complete. Rank progress moved. Next rep loaded.”
- Checkpoint: “Checkpoint cleared. Routine locked in.”
- Boss: “Boss cleared. Standard raised.”
- Rank up: “Command unlocked. Standard raised.”
- Replay: “Replay logged for practice. XP is earned on first clear.”
- Elite/max rank: “Elite held. Keep stacking clean reps.”

## 14. Recommended visual/emblem rules

- Emblems should read as home plate first, badge second.
- Use black/charcoal surfaces as the base.
- Use green for active progress and early rank energy.
- Use gold only for Command/Elite or truly earned moments.
- Keep small badge silhouettes readable at header/card sizes.
- Avoid busy detail, cartoon shapes, coins, stars-as-currency, confetti, or loud glow.
- Locked treatment should be muted and premium, not gray toy-like.

## 15. Safe fixes made in this pass

- Strengthened `lib/progressionRanks.ts` with descriptive rank metadata and explicit progress fields while preserving current thresholds.
- Refined `components/EmblemBadge.tsx` into a cleaner home-plate silhouette with subtle premium edge treatment, small-size readability, and locked-state support.
- Updated lesson completion reward display to show true earned XP, first-clear replay behavior, next-rank progress, and stronger baseball-native copy.
- Added a compact next-rank cue to Home without redesigning the Home screen.
- Added Profile rank proof copy and earned-work summary to clarify progression identity.
- Updated Career reward labels for boss reps, first-clear XP, and earned world clear state.
- Capped Game Mode tool XP to one small daily training bonus.
- Documented future progression needs without changing Supabase schema.

## 16. Deferred future progression system items

- Backend XP event ledger and migration plan.
- Cross-device anti-farming reconciliation.
- Role-specific rank overlays or mastery tracks.
- Prestige ladder after Elite: Green Plate, Sharp Plate, Steel Plate, Gold Plate, Rose Gold Plate, Platinum Crest, Clutchr Elite Emblem.
- Server-side boss/checkpoint reward tuning.
- Content audit to ensure every boss/checkpoint is marked consistently.
- Analytics to measure whether completion reward copy increases next-rep continuation.

## 17. Expo Go QA checklist

1. Open Home.
2. Confirm XP/streak still display.
3. Confirm rank/emblem display is compact and not loud or bulky.
4. Confirm Next Rep shows the current rank and next rank cue.
5. Start Next Rep.
6. Complete a normal lesson.
7. Confirm completion payoff shows earned XP and rank progress clearly.
8. Confirm completion copy uses rep/rank language, not course/quiz language.
9. Tap Continue Career.
10. Open Profile.
11. Confirm current rank/emblem, rank description, earned XP, and next milestone feel clear and earned.
12. Open Career.
13. Confirm progress/checkpoint/boss visuals still work.
14. Confirm boss labels read as serious baseball reps.
15. Replay or skip through a completed lesson if possible and confirm replay shows no added XP.
16. Complete a Game Mode tool, then another tool on the same day, and confirm only the first tool completion awards XP.
17. Confirm no Home layout regression.
18. Confirm no PitchSequenceChess/core loop regression from the previous pass.
