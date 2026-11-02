# Series follow-up (read-only), Nov 2 2026

No writes to Supabase, no app code changed. Data: live GET pull of `legacy_lessons_staging` (869 rows) plus code read at branch `sprint-final-push`.

> **Correction (phase 1):** two numbers below are wrong. There are **14** distinct step 0 skill sentences, not 54 (only `charge_bank` has six; the other 8 series reuse one sentence for all six skills). And "225 of 270 recaps are for the wrong skill" holds only for `charge_bank` (25 lessons); for the other 8 series the recap fits the series theme and the fit per title is a judgement call. Also, all 90 checkpoints and bosses ask about Charge Bank's skills in every series. See `phase1/phase1_summary.md`.

## Correction to the first audit
In `summary.md` I reported 270 steps with literal "Option A / Option B" answers as check-A filler. **That was wrong for what players see.** Those strings are the `label` field. The lesson screen renders `c.content ?? c.text ?? c.label` (`app/lesson/[id].tsx:416`), and these choices all have `content`, so players see "Sam uses the skill as described…", not "Option A". The check-A count for the series should be treated as **0 real placeholders**. The series problems are templating, generic distractors and missing feedback, not placeholder text. `summary.md` carries a note to this effect. Everything else in that audit stands.

Code line numbers are approximate (±5).

## 1. The series, and whether a normal player can reach them

### Inventory (9 series x 40 = 360 lessons; none hidden, all `is_active = true`, all four role_tags)
| Series (id prefix) | `pillar_id` | `unit_id` values (8 lessons each) | Lessons | order_index | 6 skills (lessons 1–6 of each unit) |
|---|---|---|---|---|---|
| `charge_bank` | `built-different` | `unit_1_fundamentals`, `unit_2_game_speed`, `unit_3_pressure_proof`, `unit_4_integration`, `unit_5_overtime` | 40 (30 skill + 5 checkpoint + 5 boss) | 200–239 | Body Language Boost, Confidence Bank, Past Success Replay, Win the Moment, Trust Your Training, Believe and Achieve |
| `power_grid` | `leadership-dugout` | `unit_1_fundamentals`, `unit_2_game_speed`, `unit_3_pressure_proof`, `unit_4_integration`, `unit_5_overtime` | 40 (30 skill + 5 checkpoint + 5 boss) | 360–399 | Team Talk, Leadership in Action, Communicate Under Pressure, Support & Accountability, Trust & Connection, Collective Focus |
| `replay_room` | `built-different` | `unit_1_fundamentals`, `unit_2_game_speed`, `unit_3_pressure_proof`, `unit_4_integration`, `unit_5_overtime` | 40 (30 skill + 5 checkpoint + 5 boss) | 40–79 | Visualize Success, Replay the Win, Film to Feel, Mind's Eye, Mental Rehearsal, Imagine Victory |
| `reset_switch` | `pressure-resilience` | `unit_1_fundamentals`, `unit_2_game_speed`, `unit_3_pressure_proof`, `unit_4_integration`, `unit_5_overtime` | 40 (30 skill + 5 checkpoint + 5 boss) | 320–359 | Flush It, Next Play, Bounce Back, Short Memory, Reset & React, Clutch Reset |
| `ritual_circuit` | `readiness-routines` | `unit_1_fundamentals`, `unit_2_game_speed`, `unit_3_pressure_proof`, `unit_4_integration`, `unit_5_overtime` | 40 (30 skill + 5 checkpoint + 5 boss) | 280–319 | Pre-Game Prep, Routine Reset, Superstitions vs Systems, Game Day Sequence, Habits for Consistency, Pre-Shot Ritual |
| `signal_talk` | `competitive-identity` | `unit_1_fundamentals`, `unit_2_game_speed`, `unit_3_pressure_proof`, `unit_4_integration`, `unit_5_overtime` | 40 (30 skill + 5 checkpoint + 5 boss) | 80–119 | Positive Self-Talk, Cue Words, Calm Command, Self-Coach, Inner Pep Talk, Talk it Out |
| `stormproof` | `pressure-resilience` | `unit_1_fundamentals`, `unit_2_game_speed`, `unit_3_pressure_proof`, `unit_4_integration`, `unit_5_overtime` | 40 (30 skill + 5 checkpoint + 5 boss) | 160–199 | Name the Emotion, Ride the Wave, Pressure is Privilege, Breathe Through It, Flip the Script, Calm Under Fire |
| `target_charge` | `bounce-back-player` | `unit_1_fundamentals`, `unit_2_game_speed`, `unit_3_pressure_proof`, `unit_4_integration`, `unit_5_overtime` | 40 (30 skill + 5 checkpoint + 5 boss) | 0–39 | Dream Big, Daily Grind, Vision to Plan, Goal Ladder, Small Wins, Push the Pace |
| `voltage_control` | `recovery-readiness` | `unit_1_fundamentals`, `unit_2_game_speed`, `unit_3_pressure_proof`, `unit_4_integration`, `unit_5_overtime` | 40 (30 skill + 5 checkpoint + 5 boss) | 240–279 | Energy Meter, Recovery Reset, Sleep & Fuel, Bench Reset, Mind-Body Check, Recharge Ritual |

All 360 were created 2026-03-05 and last updated 2026-10-22. Per unit: 6 skill lessons (5 steps), 1 checkpoint (8 steps, tier starter), 1 boss (9 steps, tier starter).

The 9 series map onto **7 pillar_ids**, so two pillars hold two series each (`built-different`: charge_bank + replay_room; `pressure-resilience`: reset_switch + stormproof).

| `pillar_id` | Series lessons | Hand-authored lessons in same pillar | Career world (code) |
|---|---|---|---|
| `bounce-back-player` | 40 | 0 | `career.tsx:344`, chapter `edge`, free |
| `competitive-identity` | 40 | 0 | `career.tsx:305`, chapter `edge`, free |
| `readiness-routines` | 40 | 0 | `career.tsx:67`, chapter `foundation`, free |
| `recovery-readiness` | 40 | 0 | `career.tsx:398`, chapter `the-grind`, free |
| `leadership-dugout` | 40 | 2 | `career.tsx:331`, chapter `edge`, free |
| `built-different` | 80 | 7 | `career.tsx:359`, chapter `the-grind`, free |
| `pressure-resilience` | 80 | 34 | `career.tsx:292`, chapter `edge`, free |

### Reachability: yes, fully, and for four worlds it is the only content
**Career (the main path).**
- `fetchData` loops over every entry in `WORLDS` and calls `fetchLessons({ pillar: world.id })` (`career.tsx:1284`). `fetchLessons` filters only `is_hidden = false` (`lib/supabase.ts:104-106`) and orders by `order_index`. All 7 pillar_ids above are in `WORLDS`, so every series lesson is fetched.
- A world is shown if its pillar has at least one lesson (`career.tsx:1337`, `visibleWorlds`). All 7 worlds have `isPremium: false`, none are `isStateTrigger`, and role filtering only applies to the `your-craft` chapter, so **no Pro, role, tier or state gate applies**. Tapping the tile expands the lesson list (`career.tsx:1454-1485`).
- `is_hidden`: 0 of the 360 are hidden, so the filter never removes them (the 26 hidden lessons are all other content).
- Tier: `difficulty_tier` is display-only. There is no tier gate anywhere in `career.tsx` or the lesson screen.
- Pro: the lesson screen has no Pro check at all (no `isPro` / `useProContext` in `app/lesson/[id].tsx`). Locker has a Pro gate, but for content cards.
- Lock chain: inside a world, lesson *i* is locked until lesson *i−1* is completed (`career.tsx:1064-1066`, `DEV_UNLOCK_ALL = false`). Order is `order_index` ascending.
- Boss: `is_boss` shows a "BOSS BATTLE" divider (`career.tsx:1067-1079`) and on completion runs the self-rating check-in then the boss celebration (`lesson/[id].tsx:1502-1530`). Checkpoint: the divider reads `node_type === 'checkpoint'` (`career.tsx:1068`), and `node_type` is not a column in this table, so **the checkpoint divider never shows**. The check-in and checkpoint celebration still run from `is_checkpoint` in the lesson screen.
- Result: in `bounce-back-player`, `competitive-identity`, `readiness-routines` and `recovery-readiness` a player sees only series lessons (40 each, 160 total). In `leadership-dugout` a player sees 40 series + 2 hand lessons, in `built-different` 80 + 7, in `pressure-resilience` 80 + 34.
- **Ordering problem in mixed worlds.** Because the lock chain follows `order_index`, hand-authored lessons sit in the middle of the series run. In `built-different` the 7 hand lessons are at positions 1, 44, 46, 49, 51, 53, 55 of 87 (order_index 24 and 202–208, colliding with `charge_bank_u1_*` at 200–207, so their relative order is arbitrary on ties). A player must clear 42 series lessons before reaching the second hand-authored one. In `pressure-resilience` the hand lessons are positions 1–29, then 5 more at the very end (positions 110–114); the 80 series lessons sit between them.

**Home.**
- Home calls `fetchLessons({ limit: 200 })` (`index.tsx:352`): the first 200 visible lessons by `order_index`, then `pickNextLesson` runs on that pool only (`lessonRouter.ts`). That window currently contains **15 series lessons, all `target_charge` (`bounce-back-player`)** and 185 hand-authored ones. So Home can only route to those 15 today.
- Reasons a player can still land in the series via Home: struggle injection matches `skill_tags` (series carry `confidence`, `pressure`, `reset`, `refocus`, `routine`, `self_talk`, `composure`, `focus`…) but only within the 200-row pool; emergency phases send `slump_reset` to `pressure-resilience` and `return_to_throw` to `built-different`, which then takes `firstUncompletedInPillar` from that same pool.
- Fragility: if hand-authored content is added with low `order_index` values the window moves; if content with high `order_index` is added the 15 stay. Either way Home's 200-row cap is a separate bug candidate (it silently ignores lessons beyond row 200).

**Career "Current Mission" card.** `nextLesson` walks worlds by `worldNumber` and takes the first incomplete lesson in each (`career.tsx:1351-1363`). It scans the full fetched set, not the 200 window. Worlds numbered 2 (`readiness-routines`) and 19 (`built-different`) come early, so a new player who clears Foundation will be pointed at series lessons next.

**Locker, search, Game Mode.** None of them touch lessons. Locker reads `content_cards` only (its search at `locker.tsx:170-196` filters cards). `gamemode.tsx` and `rep-mode.tsx` do not query `legacy_lessons_staging`. There is no lesson search anywhere in the app. The only other reader is `app/dev-qa.tsx`, which is `__DEV__`-gated.

**Direct links.** The lesson screen loads by id with `.eq('is_hidden', false)` (`lesson/[id].tsx:1438`), so hidden lessons are not playable even by id. The series are not hidden.

## 2. What a player sees, one lesson per series
Classes: **GENERIC** = same text in 2+ series. **skill/series-level** = same text repeated across lessons of one series. **lesson-specific** = appears in one lesson only. How I got the counts: exact text match across all 360 lessons, with the eight persona names normalized.

**`charge_bank_u1_l1`** · Body Language Boost - Fundamentals · pillar `built-different` · unit `unit_1_fundamentals` · tier rookie · checkpoint=False boss=False · order_index 200

| # | Step type | What the player sees | Content class |
|---|---|---|---|
| 0 | spark | “This is the fundamentals unit, so you'll learn the basic principles of this mental skill.” + “Sam, you’re in practice.” + “Use open body language to project confidence – stand tall, make eye contact, and relax your shoulders to feel more powerful.” | unit blurb GENERIC; persona line GENERIC; skill sentence skill/series-level (same text in 15 lessons, 1 series) |
| 1 | choice | Q: “How should you apply this mental skill?” → ✔ Sam uses the skill as described and focuses on the task. / ✘ Sam ignores the skill and lets distractions take over. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC |
| 2 | spark | “When you apply the skill correctly, you’ll notice an immediate difference. Remember:” + “Adopting open, upright postures can increase self-perception of confidence and power; meta-analyses show that expansive postures make people feel more powerful and confident compared to contractive postures” | prefix GENERIC; fact = skill/series-level (same text in 35 lessons, 1 series) |
| 3 | choice | Q: “Which statement about this mental skill is true?” → ✔ Adopting open, upright postures can increase self-perception of confidence and power / ✘ Ignoring this skill has no effect on performance. / ✘ This skill only matters in off-season training. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 4 | cue | Body “Carry this into your next rep.” with cue box “Lock in this thought.” | GENERIC (identical in all 360) |

**`power_grid_u2_l3`** · Communicate Under Pressure - Game Speed · pillar `leadership-dugout` · unit `unit_2_game_speed` · tier starter · checkpoint=False boss=False · order_index 370

| # | Step type | What the player sees | Content class |
|---|---|---|---|
| 0 | spark | “This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill.” + “Alex, you’re during a competitive drill.” + “Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.” | unit blurb GENERIC; persona line GENERIC; skill sentence skill/series-level (same text in 40 lessons, 1 series) |
| 1 | choice | Q: “How should you apply this mental skill?” → ✔ Alex uses the skill as described and focuses on the task. / ✘ Alex ignores the skill and lets distractions take over. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC |
| 2 | spark | “When you apply the skill correctly, you’ll notice an immediate difference. Remember:” + “High team trust and effective communication boost performance and reduce stress; shared goals, open communication, personal connections and vulnerability strengthen team bonds.” | prefix GENERIC; fact = skill/series-level (same text in 35 lessons, 1 series) |
| 3 | choice | Q: “Which statement about this mental skill is true?” → ✔ High team trust and effective communication boost performance and reduce stress / ✘ Ignoring this skill has no effect on performance. / ✘ This skill only matters in off-season training. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 4 | cue | Body “Carry this into your next rep.” with cue box “Lock in this thought.” | GENERIC (identical in all 360) |

**`replay_room_u3_l4`** · Mind's Eye - Pressure Proof · pillar `built-different` · unit `unit_3_pressure_proof` · tier competitor · checkpoint=False boss=False · order_index 59

| # | Step type | What the player sees | Content class |
|---|---|---|---|
| 0 | spark | “Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents.” + “Riley, you’re during a high-pressure scrimmage.” + “Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.” | unit blurb GENERIC; persona line GENERIC; skill sentence skill/series-level (same text in 40 lessons, 1 series) |
| 1 | choice | Q: “How should you apply this mental skill?” → ✔ Riley uses the skill as described and focuses on the task. / ✘ Riley ignores the skill and lets distractions take over. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC |
| 2 | spark | “When you apply the skill correctly, you’ll notice an immediate difference. Remember:” + “Mental imagery activates the same neural pathways as physical practice; vivid, multisensory imagery enhances focus, confidence and preparation.” | prefix GENERIC; fact = skill/series-level (same text in 35 lessons, 1 series) |
| 3 | choice | Q: “Which statement about this mental skill is true?” → ✔ Mental imagery activates the same neural pathways as physical practice / ✘ Ignoring this skill has no effect on performance. / ✘ This skill only matters in off-season training. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 4 | cue | Body “Carry this into your next rep.” with cue box “Lock in this thought.” | GENERIC (identical in all 360) |

**`voltage_control_u4_l5`** · Mind-Body Check - Integration · pillar `recovery-readiness` · unit `unit_4_integration` · tier clutch · checkpoint=False boss=False · order_index 268

| # | Step type | What the player sees | Content class |
|---|---|---|---|
| 0 | spark | “In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting.” + “Jordan, you’re in a real game.” + “Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.” | unit blurb GENERIC; persona line GENERIC; skill sentence skill/series-level (same text in 40 lessons, 1 series) |
| 1 | choice | Q: “How should you apply this mental skill?” → ✔ Jordan uses the skill as described and focuses on the task. / ✘ Jordan ignores the skill and lets distractions take over. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC |
| 2 | spark | “When you apply the skill correctly, you’ll notice an immediate difference. Remember:” + “Getting enough sleep, proper nutrition and recovery are crucial for tissue repair and reducing injury; sleep deprivation increases injury risk by 1.7×.” | prefix GENERIC; fact = skill/series-level (same text in 35 lessons, 1 series) |
| 3 | choice | Q: “Which statement about this mental skill is true?” → ✔ Getting enough sleep, proper nutrition and recovery are crucial for tissue repair and reducing injury / ✘ Ignoring this skill has no effect on performance. / ✘ This skill only matters in off-season training. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 4 | cue | Body “Carry this into your next rep.” with cue box “Lock in this thought.” | GENERIC (identical in all 360) |

**`reset_switch_u5_l6`** · Clutch Reset - Overtime · pillar `pressure-resilience` · unit `unit_5_overtime` · tier legend · checkpoint=False boss=False · order_index 357

| # | Step type | What the player sees | Content class |
|---|---|---|---|
| 0 | spark | “This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure.” + “Jordan, you’re in overtime of a championship game.” + “Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.” | unit blurb GENERIC; persona line GENERIC; skill sentence skill/series-level (same text in 40 lessons, 1 series) |
| 1 | choice | Q: “How should you apply this mental skill?” → ✔ Jordan uses the skill as described and focuses on the task. / ✘ Jordan ignores the skill and lets distractions take over. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC |
| 2 | spark | “When you apply the skill correctly, you’ll notice an immediate difference. Remember:” + “Reset routines, like deep breathing and cue words, help athletes refocus quickly, regulate their nervous system and build psychological resilience; planning for mistakes develops mental muscle memory.” | prefix GENERIC; fact = skill/series-level (same text in 35 lessons, 1 series) |
| 3 | choice | Q: “Which statement about this mental skill is true?” → ✔ Reset routines, like deep breathing and cue words, help athletes refocus quickly, regulate their nervous syste… / ✘ Ignoring this skill has no effect on performance. / ✘ This skill only matters in off-season training. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 4 | cue | Body “Carry this into your next rep.” with cue box “Lock in this thought.” | GENERIC (identical in all 360) |

**`ritual_circuit_u1_l2`** · Routine Reset - Fundamentals · pillar `readiness-routines` · unit `unit_1_fundamentals` · tier rookie · checkpoint=False boss=False · order_index 281

| # | Step type | What the player sees | Content class |
|---|---|---|---|
| 0 | spark | “This is the fundamentals unit, so you'll learn the basic principles of this mental skill.” + “Riley, you’re in practice.” + “Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.” | unit blurb GENERIC; persona line GENERIC; skill sentence skill/series-level (same text in 40 lessons, 1 series) |
| 1 | choice | Q: “How should you apply this mental skill?” → ✔ Riley uses the skill as described and focuses on the task. / ✘ Riley ignores the skill and lets distractions take over. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC |
| 2 | spark | “When you apply the skill correctly, you’ll notice an immediate difference. Remember:” + “Structured pre-performance routines help regulate arousal, focus attention and build consistency; they provide a roadmap for preparing to perform.” | prefix GENERIC; fact = skill/series-level (same text in 35 lessons, 1 series) |
| 3 | choice | Q: “Which statement about this mental skill is true?” → ✔ Structured pre-performance routines help regulate arousal, focus attention and build consistency / ✘ Ignoring this skill has no effect on performance. / ✘ This skill only matters in off-season training. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 4 | cue | Body “Carry this into your next rep.” with cue box “Lock in this thought.” | GENERIC (identical in all 360) |

**`signal_talk_u2_l5`** · Inner Pep Talk - Game Speed · pillar `competitive-identity` · unit `unit_2_game_speed` · tier starter · checkpoint=False boss=False · order_index 92

| # | Step type | What the player sees | Content class |
|---|---|---|---|
| 0 | spark | “This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill.” + “Casey, you’re during a competitive drill.” + “Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’” | unit blurb GENERIC; persona line GENERIC; skill sentence skill/series-level (same text in 40 lessons, 1 series) |
| 1 | choice | Q: “How should you apply this mental skill?” → ✔ Casey uses the skill as described and focuses on the task. / ✘ Casey ignores the skill and lets distractions take over. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC |
| 2 | spark | “When you apply the skill correctly, you’ll notice an immediate difference. Remember:” + “Positive and instructional self-talk enhances focus, confidence, emotional control and skill learning; various types (motivational, instructional, process, self-compassionate) support performance; meta-analysis indicates self-talk improves …” | prefix GENERIC; fact = skill/series-level (same text in 35 lessons, 1 series) |
| 3 | choice | Q: “Which statement about this mental skill is true?” → ✔ Positive and instructional self-talk enhances focus, confidence, emotional control and skill learning / ✘ Ignoring this skill has no effect on performance. / ✘ This skill only matters in off-season training. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 4 | cue | Body “Carry this into your next rep.” with cue box “Lock in this thought.” | GENERIC (identical in all 360) |

**`stormproof_u3_l1`** · Name the Emotion - Pressure Proof · pillar `pressure-resilience` · unit `unit_3_pressure_proof` · tier competitor · checkpoint=False boss=False · order_index 176

| # | Step type | What the player sees | Content class |
|---|---|---|---|
| 0 | spark | “Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents.” + “Jordan, you’re during a high-pressure scrimmage.” + “Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.” | unit blurb GENERIC; persona line GENERIC; skill sentence skill/series-level (same text in 40 lessons, 1 series) |
| 1 | choice | Q: “How should you apply this mental skill?” → ✔ Jordan uses the skill as described and focuses on the task. / ✘ Jordan ignores the skill and lets distractions take over. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC |
| 2 | spark | “When you apply the skill correctly, you’ll notice an immediate difference. Remember:” + “Labeling emotions activates the prefrontal cortex and reduces amygdala activity, making negative emotions less intense; naming feelings can help manage emotions effectively.” | prefix GENERIC; fact = skill/series-level (same text in 35 lessons, 1 series) |
| 3 | choice | Q: “Which statement about this mental skill is true?” → ✔ Labeling emotions activates the prefrontal cortex and reduces amygdala activity, making negative emotions less… / ✘ Ignoring this skill has no effect on performance. / ✘ This skill only matters in off-season training. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 4 | cue | Body “Carry this into your next rep.” with cue box “Lock in this thought.” | GENERIC (identical in all 360) |

**`target_charge_u4_l3`** · Vision to Plan - Integration · pillar `bounce-back-player` · unit `unit_4_integration` · tier clutch · checkpoint=False boss=False · order_index 26

| # | Step type | What the player sees | Content class |
|---|---|---|---|
| 0 | spark | “In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting.” + “Taylor, you’re in a real game.” + “Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.” | unit blurb GENERIC; persona line GENERIC; skill sentence skill/series-level (same text in 40 lessons, 1 series) |
| 1 | choice | Q: “How should you apply this mental skill?” → ✔ Taylor uses the skill as described and focuses on the task. / ✘ Taylor ignores the skill and lets distractions take over. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC |
| 2 | spark | “When you apply the skill correctly, you’ll notice an immediate difference. Remember:” + “Setting specific goals and breaking them into small wins provides direction and motivation; achieving small milestones releases dopamine and builds momentum.” | prefix GENERIC; fact = skill/series-level (same text in 35 lessons, 1 series) |
| 3 | choice | Q: “Which statement about this mental skill is true?” → ✔ Setting specific goals and breaking them into small wins provides direction and motivation / ✘ Ignoring this skill has no effect on performance. / ✘ This skill only matters in off-season training. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 4 | cue | Body “Carry this into your next rep.” with cue box “Lock in this thought.” | GENERIC (identical in all 360) |

### One checkpoint and one boss
**`charge_bank_u1_checkpoint`** · Checkpoint. Fundamentals · pillar `built-different` · unit `unit_1_fundamentals` · tier starter · checkpoint=True boss=False · order_index 206

| # | Step type | What the player sees | Content class |
|---|---|---|---|
| 0 | spark | “Checkpoint time! Let’s review the key mental skills you’ve learned in this unit: Body Language Boost, Confidence Bank, Past Success Replay, Win the Moment, Trust Your Training, Believe and Achieve.” | GENERIC template (same text in 45 lessons, 9 series) |
| 1 | choice | Q: “What is the main idea of 'Body Language Boost'?” → ✔ Use open body language to project confidence – stand tall, make eye contact, and relax your shoulders to feel … / ✘ You should ignore mental skills during games. / ✘ This concept is only for after the game. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 2 | choice | Q: “What is the main idea of 'Confidence Bank'?” → ✔ Build a mental bank of confident moments by celebrating small successes and recalling them when you need a boo… / ✘ You should ignore mental skills during games. / ✘ This concept is only for after the game. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 3 | choice | Q: “What is the main idea of 'Past Success Replay'?” → ✔ Revisit videos or memories of your best games to remind yourself what success looks and feels like. / ✘ You should ignore mental skills during games. / ✘ This concept is only for after the game. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 4 | choice | Q: “What is the main idea of 'Win the Moment'?” → ✔ Focus on what you can control in the present; if you lose a play, reset your posture and prepare for the next … / ✘ You should ignore mental skills during games. / ✘ This concept is only for after the game. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 5 | choice | Q: “What is the main idea of 'Trust Your Training'?” → ✔ When you’re nervous, rely on the body-language habits you’ve practiced – they’re your anchor in high-pressure … / ✘ You should ignore mental skills during games. / ✘ This concept is only for after the game. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 6 | choice | Q: “What is the main idea of 'Believe and Achieve'?” → ✔ Pair positive self-belief with strong posture; picture yourself succeeding as you stand tall and composed. / ✘ You should ignore mental skills during games. / ✘ This concept is only for after the game. · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 7 | cue | Body “Carry this into your next rep.” with cue box “Lock in this thought.” | GENERIC (identical in all 360) |

**`voltage_control_u5_boss`** · Overtime. Overtime · pillar `recovery-readiness` · unit `unit_5_overtime` · tier legend · checkpoint=False boss=True · order_index 279

| # | Step type | What the player sees | Content class |
|---|---|---|---|
| 0 | spark | “This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering in overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.” | GENERIC template (same text in 9 lessons, 9 series) |
| 1 | choice | Q: “How will you use 'Body Language Boost' now?” → ✔ Apply it as intended: Stand tall even when tired; adopting an energetic posture can trick your brain into feel… / ✘ Ignore Body Language Boost and hope for the best · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 2 | choice | Q: “How will you use 'Confidence Bank' now?” → ✔ Apply it as intended: Remember times you performed well because you were rested and well-fueled; these deposit… / ✘ Ignore Confidence Bank and hope for the best · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 3 | choice | Q: “How will you use 'Past Success Replay' now?” → ✔ Apply it as intended: Replay games where you managed your energy wisely; recall how good nutrition and sleep e… / ✘ Ignore Past Success Replay and hope for the best · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 4 | choice | Q: “How will you use 'Win the Moment' now?” → ✔ Apply it as intended: Check in with your body in the moment; if you’re depleted, hydrate and use controlled br… / ✘ Ignore Win the Moment and hope for the best · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 5 | choice | Q: “How will you use 'Trust Your Training' now?” → ✔ Apply it as intended: Trust your sleep and nutrition plan; consistent routines will keep your energy levels st… / ✘ Ignore Trust Your Training and hope for the best · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 6 | choice | Q: “How will you use 'Believe and Achieve' now?” → ✔ Apply it as intended: Believe that prioritizing recovery is part of being a champion; your body needs sleep, f… / ✘ Ignore Believe and Achieve and hope for the best · No per-option feedback, so the app falls back to a short generic pool line (‘Locked.’, ‘Correct.’…) | question GENERIC; options GENERIC; SKILL/SERIES-LEVEL |
| 7 | spark | “Great job! When you combine these skills, you’re prepared for high-pressure moments. Getting enough sleep, proper nutrition and recovery are crucial for tissue repair and reducing injury; sleep deprivation increases injury risk by 1.7×.” | skill/series-level (same text in 5 lessons, 1 series) |
| 8 | cue | Body “Carry this into your next rep.” with cue box “Lock in this thought.” | GENERIC (identical in all 360) |

### What is really lesson-specific
Across all 360 lessons the distinct authored content is: **54 skill sentences** (9 series x 6 skills, each repeated in the 5 units' lesson of that skill), **9 research facts** (one per series, identical in all 30 skill lessons of that series), **5 unit intro blurbs** (shared by all 9 series), and the lesson titles. Everything else is fixed template text. Per skill lesson: step 0 spark = generic blurb + generic persona line + 1 skill sentence; step 1 choice = fully generic; step 2 spark = generic prefix + the series fact; step 3 choice = series fact vs 2 generic distractors; step 4 cue = fixed text.

**Skill mismatch bug.** The step-2 recap and the step-3 "which statement is true" correct answer use the series' fact for *every* skill lesson, which is about the first skill of the series. Example: `charge_bank_u3_l2` is "Confidence Bank", but its recap and correct answer are about open, upright postures (Body Language Boost). That affects lessons 2 to 6 of every unit: **225 of the 270 skill lessons** teach a recap that does not match their title.

## 3. Step types and the spark/cue content
Series steps (360 lessons, 2,115 steps): **choice 1,080 · spark 675 · cue 360**. No other step types. Lesson length: 270 lessons x 5 steps, 45 checkpoints x 8, 45 bosses x 9.

- **cue (360): no real content.** All 360 are the identical pair "Lock in this thought." / "Carry this into your next rep."
- **spark (675): no lesson-specific content.** 224 distinct texts across 675 steps: 270 unit intros (generic blurb + persona + skill sentence), 270 recaps (generic prefix + one fact per series), 45 checkpoint intros (list the six skill names), 45 boss intros and 45 boss closers ("Great job! …"). The text carries real coaching sentences, but only 54 + 9 distinct ones exist and none refer to baseball situations.
- **choice (1,080): all generated.** Question stems are 4 templates; the distractors are fixed ("Ignoring this skill has no effect on performance.", "This skill only matters in off-season training.", "You should ignore mental skills during games.", "This concept is only for after the game.", "Ignore <skill> and hope for the best"). The correct answer is always the same sentence as the preceding spark.
- Grammar defect: unit 2 and 3 persona lines read "Sam, you’re during a high-pressure scrimmage" / "you’re during a competitive drill".

Five spark quotes from five different series:
1. `charge_bank_u2_l4` step 0: “This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re during a competitive drill. Focus on what you can control in the present; if you lose a play, reset your posture and prepare for the next moment.”
2. `power_grid_u4_l2` step 0: “In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. Alex, you’re in a real game. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.”
3. `replay_room_u3_l5` step 2: “When you apply the skill correctly, you’ll notice an immediate difference. Remember: Mental imagery activates the same neural pathways as physical practice; vivid, multisensory imagery enhances focus, confidence and preparation.”
4. `signal_talk_u5_l1` step 0: “This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. Morgan, you’re in overtime of a championship game. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’”
5. `stormproof_u2_l6` step 0: “This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re during a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.”

## 4. Where the series came from
**It is an older, generic mental-skills course imported in March and re-shaped in October. No richer intended content exists for it in the repo or Master folder.**
- Repo: nothing. No seed script, migration or doc in `Clutchr Baseball Code` mentions any of the 9 series names or their text. `product/sql/` has only the Batch 05, Mini Clinic and Visual Learning files, none of which are the series.
- **Closest source, the March import:** `Clutchr Baseball - Master/03_Content_and_Data/supabase_exports/current/clutchr_legacy_lessons_staging.csv` (dated Mar 23 2026, 360 rows, same ids). Alongside it: `clutchr_supabase_setup.sql` (creates the table and the RLS policy) and `clutchr_content_cards_import.csv`.
- **Older ancestors of the same set:** `Master/08_Archive/superseded_drafts/old_supabase_tables/lessons_rows (3).csv` (Mar 5, 360 rows, `created_at` 2026-03-05 17:06, matches the live `created_at`); `Master/Clutchr (OLD)/templates /modified_lessons.csv` (Mar 6); `~/Downloads/lessons_rows (1) (1).csv` (Mar 6); `~/Downloads/generated_lessons.json` (Mar 5, 400 lessons, an earlier and even more generic draft with per-choice feedback like "Great choice! Returning to your cue and breath recenters your performance."); `~/Downloads/legacy_lessons_staging_rows.csv` (May 22 export). Pillar ids in the March files, and still in the May 22 export, are the series names themselves (`charge_bank`, `power_grid`…), not world ids, so the remap to Career worlds happened after May 22.
- **What changed between the March CSV and live (steps differ in all 360 lessons):** (a) pillar_id remapped from the series name to the 7 Career world ids; (b) step types renamed `story`→`spark`, `question_multiple_choice`→`choice` (`choices`→`options`), `question_reflection`→`cue`; (c) 90 checkpoint/boss titles lost their em dash ("Overtime — Fundamentals" → "Overtime. Fundamentals"); (d) an `is_hidden` column was added.
- **One real loss.** In the March CSV the last step of each lesson was a `question_reflection` with a prompt (360 steps, 32 distinct prompts, e.g. "How will you practice body language boost in practice? Write one specific action you’ll take next time you train." and for bosses "…which mental skill felt the most challenging to execute and how will you improve it?"). The October conversion replaced them with the generic cue, so **those 360 reflection prompts no longer exist in the live rows.** Note the prompts have the same skill mismatch: 245 of 360 mention "body language boost" regardless of lesson.
- Research basis: the facts ("meta-analyses show…", "1.7×") look like they were drawn from `Master/02_Research_Library/top mental skills.pdf` or similar, but I could not text-search PDFs here (no `pdftotext`), so that link is unverified.
- Limits of this search: I scanned text, CSV, JSON, SQL, MD, DOCX and XLSX files under Master, Downloads, `CHAT GPT` and `Clutchr baseball IQ STUFF` (489 files). I did not read PDFs, `.numbers` files, or the zip archives in `replit apps code`. No file found contains a hand-written, lesson-specific version of the series.

## 5. Why the publishable key can read hidden lessons
The table `public.legacy_lessons_staging` has row level security enabled, with one SELECT policy, `legacy_lessons_staging_public_read_active`, defined in `Master/03_Content_and_Data/supabase_exports/current/clutchr_supabase_setup.sql` as `for select using (is_active = true)` and no `to` clause, so it applies to every role including `anon`. The policy tests only `is_active`; the `is_hidden` column does not exist in that setup script (it was added later, outside it) and nothing in the policy references it. All 26 hidden lessons have `is_active = true`, so the policy lets the publishable key read them, and `is_hidden` is enforced only client-side by the `.eq('is_hidden', false)` filters in `lib/supabase.ts:105` and `app/lesson/[id].tsx:1438`. Caveat: I confirmed the behavior live (an anonymous GET returned all 869 rows, 26 of them hidden) but could not read the live policy itself, because `pg_policies` is not exposed through the REST API and I have no dashboard access, so the policy text above comes from the setup script and the live policy may have been edited since. Not fixed, as requested.
