# Lesson quality audit, Nov 2 2026 (read-only)

Source: `legacy_lessons_staging`, fetched with GET-only PostgREST requests using the app's publishable key. Nothing was written, migrated or regenerated. Raw pull and scripts live in the session scratchpad, not the repo. Branch `sprint-final-push`.

> **Correction (Nov 2, series follow-up):** the "Option A / Option B" items in this report are the `label` field. The app renders `content` (the real sentence), so players never see "Option A". Read every reference to those 270 steps below as a false positive for check A, and as 0 real placeholders. The templating, repeated distractors, missing feedback and reach findings are unaffected. See `series_followup.md`.

## Scope
- Rows in table: **869**. Hidden (`is_hidden = true`) and skipped: **26**. Audited: **843** visible lessons, **3878** steps. All audited rows have `is_active = true`.
- Storage: one row per lesson, `steps` is a jsonb array of step objects. Pillar is `pillar_id`, lesson key is `legacy_lesson_id`. Step index in the CSVs is 0-based (`-1` = lesson title/subtitle).
- Step types seen: spark, choice, cue, checklist, notice_wonder, reflection, text, feedback, visualization, scenario, timer, pressure_clock, build_your_rep, visualization_rep, pressureRep, plus UI-variant steps (`decision`+film_room/snapshot_read, strike_zone_visualizer, pitch_sequence_chess, throw_decision_board, field_iq_board, pressure_replay, jump_read, confidence_slider, pitch_count_board).
- **Three shapes of the same data.** Choices live under `options` or `choices` (as `{text|content|label, correct|is_correct, feedback|outcome}` objects, or bare strings with a `correct` index). Feedback lives per option, in a `feedback` object (`correct/incorrect`, `wrong/correct/acceptable`), or in `reveal`. UI-variant steps keep it all under `data`/`responses`/`feedback`. I confirmed the extractor by hand on RBI_006, sr_on_deck_tempo_scan, ct_body_language_audit and charge_bank_u1_boss before running everything.

## Headline
**One generated cluster dominates every check.** 360 of 843 visible lessons (43%) are a templated "mental skill" series (ids like `charge_bank_u1_*`, `voltage_control_u5_*`; 7 pillars: pressure-resilience 80, built-different 80, competitive-identity 40, recovery-readiness 40, leadership-dugout 40, bounce-back-player 40, readiness-routines 40). In those lessons:
- 270 choice steps carry `Option A` / `Option B` in the `label` field (check A flagged them; **false positive, players see the `content` text**, see correction above).
- Questions come from 3 to 4 templates ("What is the main idea of 'X'?", "How should you apply this mental skill?", "Which statement about this mental skill is true?", "How will you use 'X' now?"), each reused 270 times (check C).
- Distractors are the same sentences everywhere ("You should ignore mental skills during games." x270, "This concept is only for after the game." x270, "Ignore X and hope for the best" x270).
- **None of the 1,080 choice steps in the series carries any feedback text.** A wrong answer has nothing to explain it. Outside the series, every choice step has feedback.
- Closing spark/cue text is verbatim ("Carry this into your next rep." x360; "When you apply the skill correctly you'll notice an immediate difference…" x30 per skill).

The other 483 lessons are in much better shape. Their real problems are the film_room / snapshot_read feedback templates (50 steps) and a few short feedback strings.

## Counts per check
Score = 2 x (A steps) + 2 x (B steps) + C steps + D steps. E is style only and is not scored (all of it sits in titles, not steps).

| Check | Flag rows | Flagged steps | Lessons touched | Of which in the template series |
|---|---|---|---|---|
| A placeholder / filler | 566 | 296 | 296 | 540 rows |
| B near-duplicate choices (within a step) | 0 | 0 | 0 | 0 |
| C repeated questions | 1087 | 1087 | 367 | 1080 rows |
| D generic feedback | 1160 | 774 | 414 | 1080 rows |
| E style (em dash / emoji) | 27 | 0 (titles only) | 27 | n/a |

Lessons with any scored flag: **443** of 843 (360 series, 83 other).

### A. Placeholder / filler
- 540 rows, 270 steps: `Option A` / `Option B` in the `label` field. **False positive: the app shows `content`, not `label`.** No real placeholder text exists in the series.
- 25 rows: 24 are bracketed viewing directions in film_room `text` steps, e.g. "[Watch full clip, 0:00 to 1:09]", and 1 is `PR-05` ("IF _____ happens… Fill in both blanks"). The spec lists bracketed instructions and "fill in", so they are flagged, but **I judge all 25 benign** (intended UI copy and a legitimate exercise).
- 1 short-text hit (`FND03` checklist item "Go."), also benign.
- No lorem / todo / tbd / coming soon / xxx / sample text found anywhere. No empty strings after trim.
Examples:
- `charge_bank_u1_l1` step 1 (choice), placeholder_choice(Option A/B): "Option A"
- `film_room_a1_gibson_1988` step 1 (text), bracketed_or_filler:[Watch full clip, 0:00 to 1:09]: "VIDEO: Kirk Gibson 1988 World Series Game 1 Homer https://www.mlb.com/video/must-c-gibson-s-1988-ws-homer-c186…"
- `FND03` step 1 (checklist), short<12: "Go."

### B. Near-duplicate answer choices (inside one step)
**Zero hits** across 1,541 choice sets. I tested identical, containment, Jaccard >= 0.8 and same-first-3-words. Sanity check: the highest pair similarity in the whole table is 0.50, so the zero is real and not a bug in the check. Containment ignores shorter strings under 2 words (so "Yes" inside "Yes, because…" is not counted).
The real choice-quality problem is **cross-step repetition**, not within-step (reported separately as an extra, unscored): 2700 choice rows in 1080 steps reuse a distractor that appears in 10+ steps. All of them are in the series. See `extra_B2_choice_text_repeated_across_steps.csv`.

### C. Repeated question text
- Exact-match groups with 2+ steps: **16**. 14 of them are the series templates (45 to 270 steps each). Outside the series only a handful of 2-step repeats exist (e.g. "what changed").
- First-six-words groups with 2+ steps: **26**.
- **How-the-player-applied-the-skill steps: 541 total** (540 in the series). Top wordings: "How will you use 'X' now?" x270; "How should you apply this mental skill?" x270; "How do you use at-bat information from pitches 1 and 2 to se…" x1. Full list: `C_apply_the_skill_questions.csv`.
Examples:
- `sr_two_strike_simple_move` step 1 (decision), exact question repeated in 2 steps: "What changed?"
- `sr_slide_step_timing_runner_on` step 1 (decision), exact question repeated in 2 steps: "What changed?"
- `film_room_a11_ohtani_trout` step 3 (choice), exact question repeated in 2 steps: "What makes this feel like baseball pressure at its purest?"

### D. Generic feedback
- Per-option / reveal feedback checked: 1,227 strings. Only 5 are under 40 chars and none are bare "great job" style, so hand-written feedback is mostly fine.
- Real template feedback outside the series: **"Rewatch the clip. The highlight is not the lesson, the decision before it is."** x25 and **"That is noise. Recheck the baseball cue in the frame."** x25 (snapshot_read / film_room wrong answers), plus a 25-step snapshot_read template "Good read. Tighten it to the main cue: <cue text>".
- In the series, the feedback is the *absence* of feedback (see above), plus the verbatim closers. I flag the closers in D as `nonfeedback_field`. The 1,080 choice steps with no feedback at all are listed in `extra_D2_choice_steps_without_feedback.csv` (unscored, all in the series).
Examples:
- `fr_adolis_garcia_2023_alcs` step 1 (decision), repeated_in_25_steps: "Rewatch the clip. The highlight is not the lesson; the decision before it is."
- `sr_on_deck_tempo_scan` step 1 (decision), template_in_25_steps: "Good read. Tighten it to the main cue: Tempo study before the at-bat."
- `charge_bank_u1_boss` step 7 (spark), nonfeedback_field:generic_praise_phrase: "Great job! When you combine these skills, you’re prepared for high-pressure moments. Adopting open, upright po…"

### E. Style
- **Em dashes (U+2014): 27, all in lesson titles or subtitles (27 lessons). Zero in step text.** Emoji: **0**.
- Side note: 133 en dashes (U+2013) appear in step text, mostly the series ("project confidence – stand tall"). Not flagged since you asked about em dashes, but they read the same way.
Examples:
- `RBI_010` step -1 (lesson), em_dash x1: "Build your RBI approach before the pitch — know the outs, score, and job."
- `PRC_009` step -1 (lesson), em_dash x1: "Fast and slow — using pace to disrupt hitters AND runners"
- `FIN_009` step -1 (lesson), em_dash x1: "Pitcher's counts after trouble — how to get out clean"

## Top 25 lessons by issue score
Series lessons score either 6 (270 lessons) or 8 (90 lessons), so the overall list is tie-broken by id and is not informative. Both views below.

### Overall top 25
| # | Lesson | Pillar | Title | Score | A | B | C | D |
|---|---|---|---|---|---|---|---|---|
| 1 | `charge_bank_u1_boss` | built-different | Overtime. Fundamentals | 8 | 0 | 0 | 6 | 2 |
| 2 | `charge_bank_u1_checkpoint` | built-different | Checkpoint. Fundamentals | 8 | 0 | 0 | 6 | 2 |
| 3 | `charge_bank_u2_boss` | built-different | Overtime. Game Speed | 8 | 0 | 0 | 6 | 2 |
| 4 | `charge_bank_u2_checkpoint` | built-different | Checkpoint. Game Speed | 8 | 0 | 0 | 6 | 2 |
| 5 | `charge_bank_u3_boss` | built-different | Overtime. Pressure Proof | 8 | 0 | 0 | 6 | 2 |
| 6 | `charge_bank_u3_checkpoint` | built-different | Checkpoint. Pressure Proof | 8 | 0 | 0 | 6 | 2 |
| 7 | `charge_bank_u4_boss` | built-different | Overtime. Integration | 8 | 0 | 0 | 6 | 2 |
| 8 | `charge_bank_u4_checkpoint` | built-different | Checkpoint. Integration | 8 | 0 | 0 | 6 | 2 |
| 9 | `charge_bank_u5_boss` | built-different | Overtime. Overtime | 8 | 0 | 0 | 6 | 2 |
| 10 | `charge_bank_u5_checkpoint` | built-different | Checkpoint. Overtime | 8 | 0 | 0 | 6 | 2 |
| 11 | `power_grid_u1_boss` | leadership-dugout | Overtime. Fundamentals | 8 | 0 | 0 | 6 | 2 |
| 12 | `power_grid_u1_checkpoint` | leadership-dugout | Checkpoint. Fundamentals | 8 | 0 | 0 | 6 | 2 |
| 13 | `power_grid_u2_boss` | leadership-dugout | Overtime. Game Speed | 8 | 0 | 0 | 6 | 2 |
| 14 | `power_grid_u2_checkpoint` | leadership-dugout | Checkpoint. Game Speed | 8 | 0 | 0 | 6 | 2 |
| 15 | `power_grid_u3_boss` | leadership-dugout | Overtime. Pressure Proof | 8 | 0 | 0 | 6 | 2 |
| 16 | `power_grid_u3_checkpoint` | leadership-dugout | Checkpoint. Pressure Proof | 8 | 0 | 0 | 6 | 2 |
| 17 | `power_grid_u4_boss` | leadership-dugout | Overtime. Integration | 8 | 0 | 0 | 6 | 2 |
| 18 | `power_grid_u4_checkpoint` | leadership-dugout | Checkpoint. Integration | 8 | 0 | 0 | 6 | 2 |
| 19 | `power_grid_u5_boss` | leadership-dugout | Overtime. Overtime | 8 | 0 | 0 | 6 | 2 |
| 20 | `power_grid_u5_checkpoint` | leadership-dugout | Checkpoint. Overtime | 8 | 0 | 0 | 6 | 2 |
| 21 | `replay_room_u1_boss` | built-different | Overtime. Fundamentals | 8 | 0 | 0 | 6 | 2 |
| 22 | `replay_room_u1_checkpoint` | built-different | Checkpoint. Fundamentals | 8 | 0 | 0 | 6 | 2 |
| 23 | `replay_room_u2_boss` | built-different | Overtime. Game Speed | 8 | 0 | 0 | 6 | 2 |
| 24 | `replay_room_u2_checkpoint` | built-different | Checkpoint. Game Speed | 8 | 0 | 0 | 6 | 2 |
| 25 | `replay_room_u3_boss` | built-different | Overtime. Pressure Proof | 8 | 0 | 0 | 6 | 2 |

### Top 25 excluding the template series
| # | Lesson | Pillar | Title | Score | A | B | C | D |
|---|---|---|---|---|---|---|---|---|
| 1 | `film_room_a11_ohtani_trout` | hitter-path | Best on Best | 3 | 1 | 0 | 1 | 0 |
| 2 | `FND03` | foundation | Routine Is Your Armor | 2 | 1 | 0 | 0 | 0 |
| 3 | `PR-05` | pressure-resilience | If-Then Backup Plans | 2 | 1 | 0 | 0 | 0 |
| 4 | `film_room_a10_freeman_slam` | pressure-resilience | Pain Doesn't Change the Plan | 2 | 1 | 0 | 0 | 0 |
| 5 | `film_room_a1_gibson_1988` | pressure-resilience | Big Moments Still Want Your Normal Mov… | 2 | 1 | 0 | 0 | 0 |
| 6 | `film_room_a3_puckett_inning11` | pressure-resilience | Reset in Inning 11 | 2 | 1 | 0 | 0 | 0 |
| 7 | `film_room_a6_freese_game6` | pressure-resilience | Be the Same Guy Again | 2 | 1 | 0 | 0 | 0 |
| 8 | `film_room_a9_rays_game4_chaos` | pressure-resilience | Stay in the Clip | 2 | 1 | 0 | 0 | 0 |
| 9 | `film_room_b12_bautista_flip` | hitter-path | Swing First Stare Later | 2 | 1 | 0 | 0 | 0 |
| 10 | `film_room_b4_soto_pennant` | hitter-path | Seven Pitches to the Pennant | 2 | 1 | 0 | 0 | 0 |
| 11 | `film_room_b8_harper_phillies` | leadership-dugout | Swing as Leadership | 2 | 1 | 0 | 0 | 0 |
| 12 | `film_room_c1_madbum_game7` | pitcher-path | The Mound Got Smaller | 2 | 1 | 0 | 0 | 0 |
| 13 | `film_room_c3_larsen_perfect` | pitcher-path | Don't Start Aiming | 2 | 1 | 0 | 0 | 0 |
| 14 | `film_room_c5_gage_wood_nohitter` | pitcher-path | Same Pitcher for 27 Outs | 2 | 1 | 0 | 0 | 0 |
| 15 | `film_room_c7_eovaldi_process_truth` | pressure-resilience | Process Truth vs Scoreboard Truth | 2 | 1 | 0 | 0 | 0 |
| 16 | `film_room_d3_yadi_pickoff_breakdown` | catcher-path | Steal the Free Out | 2 | 1 | 0 | 0 | 0 |
| 17 | `film_room_e1_jeter_flip` | baseball-iq | Be the Third Cutoff Before It Happens | 2 | 1 | 0 | 0 | 0 |
| 18 | `film_room_e3_mookie_wheel_play` | baseball-iq | Call It Late Run It Clean | 2 | 1 | 0 | 0 | 0 |
| 19 | `film_room_f1_dave_roberts_steal` | baserunner-path | The Steal | 2 | 1 | 0 | 0 | 0 |
| 20 | `film_room_f4_arozarena_stumble` | baserunner-path | Never Mentally Tag Yourself Out | 2 | 1 | 0 | 0 | 0 |
| 21 | `film_room_g2_adolis_organized_fire` | pressure-resilience | Organized Fire | 2 | 1 | 0 | 0 | 0 |
| 22 | `film_room_g5_rain_delay_reset` | pressure-resilience | What to Do in the Pause | 2 | 1 | 0 | 0 | 0 |
| 23 | `film_room_h1_alonso_scouting` | hitter-path | Scout Without Freezing | 2 | 1 | 0 | 0 | 0 |
| 24 | `film_room_h4_helsley_tipping` | pitcher-path | Comfortable At-Bats Are a Warning | 2 | 1 | 0 | 0 | 0 |
| 25 | `film_room_i1_malcolm_butler` | baseball-iq | Jump the Pattern | 2 | 1 | 0 | 0 | 0 |
Most of these score 2 only from the benign bracketed film_room directions. The genuinely weak non-series lessons are the ones in the film_room / snapshot_read template-feedback groups (check D, column D above) and the 7 steps in C.

## Top 10 repeated-question groups
### Exact (normalized) match
| Steps | Lessons | Question (normalized) | Example lessons |
|---|---|---|---|
| 270 | 270 | how should you apply this mental skill | `charge_bank_u1_l1`, `charge_bank_u1_l2`, `charge_bank_u1_l3` |
| 270 | 270 | which statement about this mental skill is true | `charge_bank_u1_l1`, `charge_bank_u1_l2`, `charge_bank_u1_l3` |
| 45 | 45 | how will you use believe and achieve now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use body language boost now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use confidence bank now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use past success replay now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use trust your training now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use win the moment now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | what is the main idea of believe and achieve | `charge_bank_u1_checkpoint`, `charge_bank_u2_checkpoint`, `charge_bank_u3_checkpoint` |
| 45 | 45 | what is the main idea of body language boost | `charge_bank_u1_checkpoint`, `charge_bank_u2_checkpoint`, `charge_bank_u3_checkpoint` |

### First six words
| Steps | Lessons | Question (normalized) | Example lessons |
|---|---|---|---|
| 270 | 270 | how should you apply this mental | `charge_bank_u1_l1`, `charge_bank_u1_l2`, `charge_bank_u1_l3` |
| 270 | 45 | what is the main idea of | `charge_bank_u1_checkpoint`, `charge_bank_u2_checkpoint`, `charge_bank_u3_checkpoint` |
| 270 | 270 | which statement about this mental skill | `charge_bank_u1_l1`, `charge_bank_u1_l2`, `charge_bank_u1_l3` |
| 45 | 45 | how will you use believe and | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use body language | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use confidence bank | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use past success | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use trust your | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use win the | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 3 | 3 | what do you do in the | `HSP_013`, `LOM_014`, `RBI_011` |

(Full top-30 lists for both are below.)

<details><summary>Top 30 exact groups</summary>

| Steps | Lessons | Question (normalized) | Example lessons |
|---|---|---|---|
| 270 | 270 | how should you apply this mental skill | `charge_bank_u1_l1`, `charge_bank_u1_l2`, `charge_bank_u1_l3` |
| 270 | 270 | which statement about this mental skill is true | `charge_bank_u1_l1`, `charge_bank_u1_l2`, `charge_bank_u1_l3` |
| 45 | 45 | how will you use believe and achieve now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use body language boost now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use confidence bank now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use past success replay now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use trust your training now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use win the moment now | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | what is the main idea of believe and achieve | `charge_bank_u1_checkpoint`, `charge_bank_u2_checkpoint`, `charge_bank_u3_checkpoint` |
| 45 | 45 | what is the main idea of body language boost | `charge_bank_u1_checkpoint`, `charge_bank_u2_checkpoint`, `charge_bank_u3_checkpoint` |
| 45 | 45 | what is the main idea of confidence bank | `charge_bank_u1_checkpoint`, `charge_bank_u2_checkpoint`, `charge_bank_u3_checkpoint` |
| 45 | 45 | what is the main idea of past success replay | `charge_bank_u1_checkpoint`, `charge_bank_u2_checkpoint`, `charge_bank_u3_checkpoint` |
| 45 | 45 | what is the main idea of trust your training | `charge_bank_u1_checkpoint`, `charge_bank_u2_checkpoint`, `charge_bank_u3_checkpoint` |
| 45 | 45 | what is the main idea of win the moment | `charge_bank_u1_checkpoint`, `charge_bank_u2_checkpoint`, `charge_bank_u3_checkpoint` |
| 2 | 2 | what changed | `sr_slide_step_timing_runner_on`, `sr_two_strike_simple_move` |
| 2 | 2 | what makes this feel like baseball pressure at its purest | `film_room_a11_ohtani_trout`, `fr_ohtani_trout_wbc` |
</details>

<details><summary>Top 30 first-six-words groups</summary>

| Steps | Lessons | Question (normalized) | Example lessons |
|---|---|---|---|
| 270 | 270 | how should you apply this mental | `charge_bank_u1_l1`, `charge_bank_u1_l2`, `charge_bank_u1_l3` |
| 270 | 45 | what is the main idea of | `charge_bank_u1_checkpoint`, `charge_bank_u2_checkpoint`, `charge_bank_u3_checkpoint` |
| 270 | 270 | which statement about this mental skill | `charge_bank_u1_l1`, `charge_bank_u1_l2`, `charge_bank_u1_l3` |
| 45 | 45 | how will you use believe and | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use body language | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use confidence bank | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use past success | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use trust your | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 45 | 45 | how will you use win the | `charge_bank_u1_boss`, `charge_bank_u2_boss`, `charge_bank_u3_boss` |
| 3 | 3 | what do you do in the | `HSP_013`, `LOM_014`, `RBI_011` |
| 2 | 2 | a ball is hit over your | `OF-EXP02`, `OFR_006` |
| 2 | 2 | count pitcher comes back with a | `HSP_008`, `LOM_004` |
| 2 | 2 | runner on second one out pitcher | `CAT-EXP05`, `RBI_003` |
| 2 | 2 | seventh inning tie game runner on | `OFR_010`, `OFR_014` |
| 2 | 2 | single to right field runner on | `OF-EXP03`, `RICH06` |
| 2 | 2 | what is one part of your | `CDY_013`, `WPD_012` |
| 2 | 2 | what is the one adjustment that | `RBI_005`, `RBI_015` |
| 2 | 2 | what is your cue word when | `ct_make_them_earn_it`, `film_room_c3_larsen_perfect` |
| 2 | 2 | what makes this feel like baseball | `film_room_a11_ohtani_trout`, `fr_ohtani_trout_wbc` |
| 2 | 2 | what was soto doing better than | `film_room_b4_soto_pennant`, `fr_soto_2024_alcs_ab` |
| 2 | 2 | where should your eyes be focused | `HIT05`, `HSP_001` |
| 2 | 2 | you are for in your last | `RICH10`, `UNI-04` |
| 2 | 2 | you are in a slump and | `SR05`, `SR06` |
| 2 | 2 | you are in a slump the | `RICH10`, `ct_slump_day_plan` |
| 2 | 2 | you come set runner on first | `PRC_007`, `PRC_015` |
| 2 | 2 | you just walked a batter you | `NW01`, `RG-06` |
</details>

## Files
`A_placeholder_filler.csv`, `B_near_duplicate_choices.csv` (header only, no hits), `C_repeated_questions.csv`, `C_apply_the_skill_questions.csv`, `D_generic_feedback.csv`, `E_style_emdash_emoji.csv`, `extra_B2_choice_text_repeated_across_steps.csv`, `extra_D2_choice_steps_without_feedback.csv`.

## Proposed fixes (nothing applied)
Touches existing rows = UPDATE on `legacy_lessons_staging.steps`. "No row change" = app or filter only.

| Check | Approach | Touches lesson rows? |
|---|---|---|
| A, Option A/B | Regenerate the series' choice steps with real, skill-specific distractors. Most urgent for beta. | **Yes**, 270 steps in the series |
| A, bracketed film_room | Leave. Optionally move the direction to a dedicated field so a lint rule stops flagging it. | No (or minor) |
| B | Nothing to fix within a step. Fix cross-step distractors (B2) as part of the series rewrite. | Same rows as A |
| C | Rewrite the series question stems so each asks something specific to the skill, drop the 270x "How should you apply this mental skill?". Decide whether the series should ship to beta at all. Non-series repeats: 7 steps, hand edit. | **Yes**, 1,080 steps (series) + 7 |
| D, series | Add per-option feedback to the 1,080 choice steps and vary the closing text per skill. | **Yes** |
| D, film_room / snapshot_read | The 50 steps with repeated wrong-answer feedback and the 25 "Tighten it to the main cue" steps: write per-option feedback. Could be done at render time by using the cue's own `description` as a stopgap. | **Yes** for a real fix, **No** for the render-time stopgap |
| E | Replace the 27 title/subtitle em dashes with commas or colons. | **Yes**, title/subtitle columns |
| Fastest safe stopgap for beta | Set `is_hidden = true` on the series (or the boss/checkpoint subset) so testers never see it. | **Yes**, one flag, reversible. This removes 43% of the catalog, so it is a product call. |

## What could not be done read-only, and caveats
- Nothing in the spec was blocked. The Oct 29 image-count method was not recorded in the repo, so I used GET-only REST calls with the publishable key. If your Oct 29 count used a different path (e.g. SQL via the dashboard) the numbers still reconcile on the base counts (869 rows, 26 hidden).
- The publishable key returned hidden rows too, which means RLS on this table does not hide `is_hidden` rows from anonymous clients. That is a content-exposure question, separate from this audit, but worth knowing before beta.
- Automated checks cannot judge whether a question is actually *good*, only repetitive or templated. Thresholds I chose: C flags exact repeats in 2+ steps and first-six-word templates in 3+; D flags repeats in 3+ steps, templates in 10+, strings under 40 chars, and praise-only strings.
- Scoring uses the spec literally. Because the series is so uniform, I also added the excluding-series view.
