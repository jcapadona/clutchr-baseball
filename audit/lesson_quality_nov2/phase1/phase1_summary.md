# Series fix, phase 1: report (nothing applied)

Scope: the 360 series lessons. No SQL has been run and nothing was written to Supabase. Files are in `audit/lesson_quality_nov2/phase1/`. No em dash appears in any new text (checked by script).

## Decisions applied (supersedes the SQL and decision sections below)
1. Reflection prompts restored only where they fit: **120 lessons** (30 Charge Bank skill lessons, 45 checkpoints, 45 bosses). The other 240 keep the generic cue.
2. Restored wording now says "Name one specific action" (30 prompts changed; checkpoint and boss prompts never had that phrase).
3. All 7 grammar sentences are fixed, including the three "awkward" boss ones: **153 lessons** at step 0.
4. Recap fit and the checkpoint/boss subject problem are parked, not in phase 1.
Result: **216 lessons change** (153 grammar, 120 reflection, 57 get both). `sql/B_update_items_1_2.sql` ends in `rollback;` by default; `sql/B_update_items_1_2_commit.sql` has the same statements and ends in `commit;`. Verification expects: changed rows 216, non-series 0, now_reflection 120, still_cue 240, "Write one" 0, broken phrasing 0, step 0 changed 153, middle steps changed 0, total 869, hidden 26.

## Corrections to my earlier follow-up (read first)
Two claims in `series_followup.md` were wrong and are fixed here:
1. I said there are **54 distinct skill sentences**. There are **14**. Only `charge_bank` has six different step 0 skill sentences. In the other 8 series, all six skill lessons share one identical sentence (and the same recap), so lessons 1 to 6 differ only by title and persona name.
2. I said **225 of 270** skill lessons recap the wrong skill. That is only certain for `charge_bank`: its recap is about posture (Body Language Boost) in all 30 lessons, so **25 lessons** (skills 2 to 6, five units each) are clearly wrong. For the other 8 series the recap fits the series theme, and whether it fits a given title is a judgement call (item 3 below).

## Item 1: grammar (7 distinct template sentences, 108 skill lessons + 45 bosses affected)
Persona names are kept (the fix is applied per lesson with the name left in place). "error" is ungrammatical; "awkward" is nonstandard ("entering in practice") but not strictly wrong. I included both in the update; drop the three "awkward" rows if you want a narrower change.

| Severity | Where | Broken template sentence | Proposed correction | Lessons |
|---|---|---|---|---|
| awkward | boss, unit 1 | You’re now entering in practice. | You’re now entering practice. | 9 |
| awkward | boss, unit 4 | You’re now entering in a real game. | You’re now entering a real game. | 9 |
| awkward | boss, unit 5 | You’re now entering in overtime of a championship game. | You’re now entering overtime of a championship game. | 9 |
| error | boss, unit 2 | You’re now entering during a competitive drill. | You’re now entering a competitive drill. | 9 |
| error | boss, unit 3 | You’re now entering during a high-pressure scrimmage. | You’re now entering a high-pressure scrimmage. | 9 |
| error | skill lesson, unit 2 | <NAME>, you’re during a competitive drill. | <NAME>, you’re in a competitive drill. | 54 |
| error | skill lesson, unit 3 | <NAME>, you’re during a high-pressure scrimmage. | <NAME>, you’re in a high-pressure scrimmage. | 54 |

Step 0 changes: **153 lessons** (108 skill lessons in units 2 and 3, plus all 45 bosses). Units 1, 4 and 5 skill lessons have no grammar defect.
Not fixed, outside the three defects: every boss, including unit 1, says "It’s the overtime challenge", which contradicts the unit blurb in front of it.

## Item 2: restore the 360 reflection prompts
Source: `clutchr_legacy_lessons_staging.csv`. The final step of each lesson was `question_reflection` with a prompt and a speaker; live has the identical generic cue in all 360 (verified). Proposed restored step: `{"type":"reflection","prompt":"…","speaker":"…"}`, replacing the cue as the final step (same position, same step count). `reflection` is the type the lesson screen renders for this (`app/lesson/[id].tsx:1103`). Full table: `02_reflection_restore.csv`.

### Does the restored step collect free-text input? **No.**
I read `ReflectionStep` (`app/lesson/[id].tsx:~760`). It renders a lightbulb icon, the prompt text and a "Got it" button. There is no text field, nothing is saved, no network call, and `save_to_playbook` is not read anywhere in the app (grep across `app/`, `components/`, `context/`, `hooks/`, `lib/`). The lesson text is also read aloud if the player has voice on. So this adds **no new child data**. Two things you should know:
- The March wording says "Write one specific action you’ll take next time you train", but there is nowhere to write. It reads as a promise the screen cannot keep. I left the wording as it was. If anyone later adds an input box or playbook save, that would be new player data and needs your decision then.
- The final step type changes from `cue` to `reflection` in the 270 regular skill lessons. The completion screen picks its intent from the last step's type (`lesson/[id].tsx:1576-1580`: types containing "cue" get intent `save`, otherwise `rep`), so those completion cards will use the `rep` variant instead of `save`. Checkpoints and bosses are unaffected (`boss`). I did not test how this looks on screen.

### Decision needed: 240 of the 360 March prompts name the wrong skill
The 32 distinct prompts break down as: 5 prompts about "body language boost" (one per unit setting) used in **245 lessons**, 25 prompts for the other five Charge Bank skills (one lesson set each), and 2 checkpoint/boss prompts (45 lessons each). Because the March generator copied Charge Bank's first skill into every series, **240 lessons in the other 8 series ask "How will you practice body language boost…?"** in a lesson titled, say, "Sleep & Fuel". Restoring those verbatim would ship a visible defect, so the update file uses `variant = skill_name_corrected` for those 240: the same sentence with that lesson's own title lowercased in place of "body language boost". The other 120 (30 Charge Bank skill lessons, 45 checkpoints, 45 bosses) are restored verbatim. Titles like "Flush It" or "Superstitions vs Systems" make the template read oddly ("How will you practice flush it in practice?"). Options: (a) approve as proposed, (b) restore verbatim anyway (I would regenerate file B), (c) restore only the 120 verbatim ones and leave the other 240 as the cue until the content is rewritten.

### 5 side-by-side examples
**`charge_bank_u1_l1`** (step 4, variant `verbatim`)
- LIVE today: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- RESTORED: `{"type": "reflection", "prompt": "How will you practice body language boost in practice? Write one specific action you’ll take next time you train.", "speaker": "Sam"}`

**`power_grid_u2_l4`** (step 4, variant `skill_name_corrected`)
- LIVE today: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- RESTORED: `{"type": "reflection", "prompt": "How will you practice support & accountability during a competitive drill? Write one specific action you’ll take next time you train.", "speaker": "Riley"}`
- March verbatim (names the wrong skill for this lesson): "How will you practice body language boost during a competitive drill? Write one specific action you’ll take next time you train."

**`charge_bank_u3_checkpoint`** (step 7, variant `verbatim`)
- LIVE today: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- RESTORED: `{"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}`

**`voltage_control_u5_boss`** (step 8, variant `verbatim`)
- LIVE today: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- RESTORED: `{"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Jordan"}`

**`stormproof_u5_l6`** (step 4, variant `skill_name_corrected`)
- LIVE today: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- RESTORED: `{"type": "reflection", "prompt": "How will you practice calm under fire in overtime of a championship game? Write one specific action you’ll take next time you train.", "speaker": "Taylor"}`
- March verbatim (names the wrong skill for this lesson): "How will you practice body language boost in overtime of a championship game? Write one specific action you’ll take next time you train."


## Item 3: recap fact by skill (listing only, no new facts written)
Each series has one recap fact, identical in all 30 of its skill lessons (and it is also the "correct answer" in step 3, "Which statement about this mental skill is true?"):
- **`charge_bank`** (`built-different`) gets this recap in every one of its 30 skill lessons: “Adopting open, upright postures can increase self-perception of confidence and power; meta-analyses show that expansive postures make people feel more powerful and confident compared to contractive postures”
- **`power_grid`** (`leadership-dugout`) gets this recap in every one of its 30 skill lessons: “High team trust and effective communication boost performance and reduce stress; shared goals, open communication, personal connections and vulnerability strengthen team bonds.”
- **`replay_room`** (`built-different`) gets this recap in every one of its 30 skill lessons: “Mental imagery activates the same neural pathways as physical practice; vivid, multisensory imagery enhances focus, confidence and preparation.”
- **`reset_switch`** (`pressure-resilience`) gets this recap in every one of its 30 skill lessons: “Reset routines, like deep breathing and cue words, help athletes refocus quickly, regulate their nervous system and build psychological resilience; planning for mistakes develops mental muscle memory.”
- **`ritual_circuit`** (`readiness-routines`) gets this recap in every one of its 30 skill lessons: “Structured pre-performance routines help regulate arousal, focus attention and build consistency; they provide a roadmap for preparing to perform.”
- **`signal_talk`** (`competitive-identity`) gets this recap in every one of its 30 skill lessons: “Positive and instructional self-talk enhances focus, confidence, emotional control and skill learning; various types (motivational, instructional, process, self-compassionate) support performance; meta-analysis indicates self-talk improves performance and reduces anxiety.”
- **`stormproof`** (`pressure-resilience`) gets this recap in every one of its 30 skill lessons: “Labeling emotions activates the prefrontal cortex and reduces amygdala activity, making negative emotions less intense; naming feelings can help manage emotions effectively.”
- **`target_charge`** (`bounce-back-player`) gets this recap in every one of its 30 skill lessons: “Setting specific goals and breaking them into small wins provides direction and motivation; achieving small milestones releases dopamine and builds momentum.”
- **`voltage_control`** (`recovery-readiness`) gets this recap in every one of its 30 skill lessons: “Getting enough sleep, proper nutrition and recovery are crucial for tissue repair and reducing injury; sleep deprivation increases injury risk by 1.7×.”

Per skill (54 rows). "Fit" is my judgement from the skill title against the fact, not a measured result: **fits 30, partial 16, does not fit 8**. The 8 "does not fit" are `charge_bank` skills 2 to 6 (5 skills) and `stormproof` 3, 4, 5 (Pressure is Privilege, Breathe Through It, Flip the Script). Per unit, multiply by 5 lessons.

| Series | # | Skill | Fit with the recap it gets (editor judgement) |
|---|---|---|---|
| `charge_bank` | 1 | Body Language Boost | fits |
| `charge_bank` | 2 | Confidence Bank | does not fit |
| `charge_bank` | 3 | Past Success Replay | does not fit |
| `charge_bank` | 4 | Win the Moment | does not fit |
| `charge_bank` | 5 | Trust Your Training | does not fit |
| `charge_bank` | 6 | Believe and Achieve | does not fit |
| `power_grid` | 1 | Team Talk | fits |
| `power_grid` | 2 | Leadership in Action | partial |
| `power_grid` | 3 | Communicate Under Pressure | fits |
| `power_grid` | 4 | Support & Accountability | partial |
| `power_grid` | 5 | Trust & Connection | fits |
| `power_grid` | 6 | Collective Focus | partial |
| `replay_room` | 1 | Visualize Success | fits |
| `replay_room` | 2 | Replay the Win | fits |
| `replay_room` | 3 | Film to Feel | partial |
| `replay_room` | 4 | Mind's Eye | fits |
| `replay_room` | 5 | Mental Rehearsal | fits |
| `replay_room` | 6 | Imagine Victory | fits |
| `reset_switch` | 1 | Flush It | fits |
| `reset_switch` | 2 | Next Play | fits |
| `reset_switch` | 3 | Bounce Back | fits |
| `reset_switch` | 4 | Short Memory | partial |
| `reset_switch` | 5 | Reset & React | fits |
| `reset_switch` | 6 | Clutch Reset | fits |
| `ritual_circuit` | 1 | Pre-Game Prep | fits |
| `ritual_circuit` | 2 | Routine Reset | partial |
| `ritual_circuit` | 3 | Superstitions vs Systems | partial |
| `ritual_circuit` | 4 | Game Day Sequence | fits |
| `ritual_circuit` | 5 | Habits for Consistency | fits |
| `ritual_circuit` | 6 | Pre-Shot Ritual | fits |
| `signal_talk` | 1 | Positive Self-Talk | fits |
| `signal_talk` | 2 | Cue Words | fits |
| `signal_talk` | 3 | Calm Command | fits |
| `signal_talk` | 4 | Self-Coach | fits |
| `signal_talk` | 5 | Inner Pep Talk | fits |
| `signal_talk` | 6 | Talk it Out | partial |
| `stormproof` | 1 | Name the Emotion | fits |
| `stormproof` | 2 | Ride the Wave | partial |
| `stormproof` | 3 | Pressure is Privilege | does not fit |
| `stormproof` | 4 | Breathe Through It | does not fit |
| `stormproof` | 5 | Flip the Script | does not fit |
| `stormproof` | 6 | Calm Under Fire | partial |
| `target_charge` | 1 | Dream Big | partial |
| `target_charge` | 2 | Daily Grind | partial |
| `target_charge` | 3 | Vision to Plan | fits |
| `target_charge` | 4 | Goal Ladder | fits |
| `target_charge` | 5 | Small Wins | fits |
| `target_charge` | 6 | Push the Pace | partial |
| `voltage_control` | 1 | Energy Meter | partial |
| `voltage_control` | 2 | Recovery Reset | fits |
| `voltage_control` | 3 | Sleep & Fuel | fits |
| `voltage_control` | 4 | Bench Reset | partial |
| `voltage_control` | 5 | Mind-Body Check | partial |
| `voltage_control` | 6 | Recharge Ritual | fits |

`03_fact_by_skill.csv` has the full sentences. Item 3 is not in the SQL.

### Bigger problem found while checking item 3 (not in phase 1)
All **45 checkpoints and 45 bosses in every series** quiz Charge Bank's six skills ("What is the main idea of 'Body Language Boost'?", "How will you use 'Confidence Bank' now?"), including in `power_grid`, `voltage_control` and the rest. Their step 0 even lists Charge Bank's six skill names. For the 8 other series that is the wrong subject matter in 80 lessons. This needs a content decision before any fix.

## Before and after, 10 sample lessons


## `charge_bank_u2_l3` (Past Success Replay - Game Speed, `built-different`, 5 steps)

**Step 0 (grammar)**
- BEFORE: This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re during a competitive drill. Revisit videos or memories of your best games to remind yourself what success looks and feels like.
- AFTER:  This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re in a competitive drill. Revisit videos or memories of your best games to remind yourself what success looks and feels like.

**Step 2 (recap, item 3)**: UNCHANGED: When you apply the skill correctly, you’ll notice an immediate difference. Remember: Adopting open, upright postures can increase self-perception of confidence and power; meta-analyses show that expansive postures make people feel more powerful and confident compared to contractive postures
- fit for this skill: does not fit (editor judgement)

**Step 4 (reflection, item 2, variant `verbatim`)**
- BEFORE: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- AFTER:  `{"type": "reflection", "prompt": "How will you practice past success replay during a competitive drill? Write one specific action you’ll take next time you train.", "speaker": "Casey"}`


## `power_grid_u3_l2` (Leadership in Action - Pressure Proof, `leadership-dugout`, 5 steps)

**Step 0 (grammar)**
- BEFORE: Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re during a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.
- AFTER:  Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re in a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.

**Step 2 (recap, item 3)**: UNCHANGED: When you apply the skill correctly, you’ll notice an immediate difference. Remember: High team trust and effective communication boost performance and reduce stress; shared goals, open communication, personal connections and vulnerability strengthen team bonds.
- fit for this skill: partial (editor judgement)

**Step 4 (reflection, item 2, variant `skill_name_corrected`)**
- BEFORE: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- AFTER:  `{"type": "reflection", "prompt": "How will you practice leadership in action during a high-pressure scrimmage? Write one specific action you’ll take next time you train.", "speaker": "Morgan"}`

- March verbatim was: "How will you practice body language boost during a high-pressure scrimmage? Write one specific action you’ll take next time you train."


## `replay_room_u1_l4` (Mind's Eye - Fundamentals, `built-different`, 5 steps)

**Step 0 (grammar)**: no change, the text is already grammatical.

**Step 2 (recap, item 3)**: UNCHANGED: When you apply the skill correctly, you’ll notice an immediate difference. Remember: Mental imagery activates the same neural pathways as physical practice; vivid, multisensory imagery enhances focus, confidence and preparation.
- fit for this skill: fits (editor judgement)

**Step 4 (reflection, item 2, variant `skill_name_corrected`)**
- BEFORE: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- AFTER:  `{"type": "reflection", "prompt": "How will you practice mind's eye in practice? Write one specific action you’ll take next time you train.", "speaker": "Casey"}`

- March verbatim was: "How will you practice body language boost in practice? Write one specific action you’ll take next time you train."


## `reset_switch_u2_l6` (Clutch Reset - Game Speed, `pressure-resilience`, 5 steps)

**Step 0 (grammar)**
- BEFORE: This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re during a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.
- AFTER:  This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re in a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.

**Step 2 (recap, item 3)**: UNCHANGED: When you apply the skill correctly, you’ll notice an immediate difference. Remember: Reset routines, like deep breathing and cue words, help athletes refocus quickly, regulate their nervous system and build psychological resilience; planning for mistakes develops mental muscle memory.
- fit for this skill: fits (editor judgement)

**Step 4 (reflection, item 2, variant `skill_name_corrected`)**
- BEFORE: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- AFTER:  `{"type": "reflection", "prompt": "How will you practice clutch reset during a competitive drill? Write one specific action you’ll take next time you train.", "speaker": "Jamie"}`

- March verbatim was: "How will you practice body language boost during a competitive drill? Write one specific action you’ll take next time you train."


## `ritual_circuit_u5_l1` (Pre-Game Prep - Overtime, `readiness-routines`, 5 steps)

**Step 0 (grammar)**: no change, the text is already grammatical.

**Step 2 (recap, item 3)**: UNCHANGED: When you apply the skill correctly, you’ll notice an immediate difference. Remember: Structured pre-performance routines help regulate arousal, focus attention and build consistency; they provide a roadmap for preparing to perform.
- fit for this skill: fits (editor judgement)

**Step 4 (reflection, item 2, variant `skill_name_corrected`)**
- BEFORE: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- AFTER:  `{"type": "reflection", "prompt": "How will you practice pre-game prep in overtime of a championship game? Write one specific action you’ll take next time you train.", "speaker": "Jamie"}`

- March verbatim was: "How will you practice body language boost in overtime of a championship game? Write one specific action you’ll take next time you train."


## `signal_talk_u4_l2` (Cue Words - Integration, `competitive-identity`, 5 steps)

**Step 0 (grammar)**: no change, the text is already grammatical.

**Step 2 (recap, item 3)**: UNCHANGED: When you apply the skill correctly, you’ll notice an immediate difference. Remember: Positive and instructional self-talk enhances focus, confidence, emotional control and skill learning; various types (motivational, instructional, process, self-compassionate) support performance; meta-analysis indicates self-talk improves performance and reduces anxiety.
- fit for this skill: fits (editor judgement)

**Step 4 (reflection, item 2, variant `skill_name_corrected`)**
- BEFORE: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- AFTER:  `{"type": "reflection", "prompt": "How will you practice cue words in a real game? Write one specific action you’ll take next time you train.", "speaker": "Jamie"}`

- March verbatim was: "How will you practice body language boost in a real game? Write one specific action you’ll take next time you train."


## `stormproof_u3_l5` (Flip the Script - Pressure Proof, `pressure-resilience`, 5 steps)

**Step 0 (grammar)**
- BEFORE: Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re during a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.
- AFTER:  Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re in a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.

**Step 2 (recap, item 3)**: UNCHANGED: When you apply the skill correctly, you’ll notice an immediate difference. Remember: Labeling emotions activates the prefrontal cortex and reduces amygdala activity, making negative emotions less intense; naming feelings can help manage emotions effectively.
- fit for this skill: does not fit (editor judgement)

**Step 4 (reflection, item 2, variant `skill_name_corrected`)**
- BEFORE: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- AFTER:  `{"type": "reflection", "prompt": "How will you practice flip the script during a high-pressure scrimmage? Write one specific action you’ll take next time you train.", "speaker": "Riley"}`

- March verbatim was: "How will you practice body language boost during a high-pressure scrimmage? Write one specific action you’ll take next time you train."


## `target_charge_u5_l3` (Vision to Plan - Overtime, `bounce-back-player`, 5 steps)

**Step 0 (grammar)**: no change, the text is already grammatical.

**Step 2 (recap, item 3)**: UNCHANGED: When you apply the skill correctly, you’ll notice an immediate difference. Remember: Setting specific goals and breaking them into small wins provides direction and motivation; achieving small milestones releases dopamine and builds momentum.
- fit for this skill: fits (editor judgement)

**Step 4 (reflection, item 2, variant `skill_name_corrected`)**
- BEFORE: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- AFTER:  `{"type": "reflection", "prompt": "How will you practice vision to plan in overtime of a championship game? Write one specific action you’ll take next time you train.", "speaker": "Casey"}`

- March verbatim was: "How will you practice body language boost in overtime of a championship game? Write one specific action you’ll take next time you train."


## `voltage_control_u2_boss` (Overtime. Game Speed, `recovery-readiness`, 9 steps)

**Step 0 (grammar)**
- BEFORE: This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering during a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.
- AFTER:  This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.

**Choice steps (not in phase 1)**: UNCHANGED: asks "How will you use 'Body Language Boost' now?", a Charge Bank skill, in a `recovery-readiness` lesson.

**Step 8 (reflection, item 2, variant `verbatim`)**
- BEFORE: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- AFTER:  `{"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Taylor"}`


## `power_grid_u1_checkpoint` (Checkpoint. Fundamentals, `leadership-dugout`, 8 steps)

**Step 0 (grammar)**: no change, the text is already grammatical.

**Choice steps (not in phase 1)**: UNCHANGED: asks "What is the main idea of 'Body Language Boost'?", a Charge Bank skill, in a `leadership-dugout` lesson.

**Step 7 (reflection, item 2, variant `verbatim`)**
- BEFORE: `{"type": "cue", "cue": "Lock in this thought.", "content": "Carry this into your next rep."}`
- AFTER:  `{"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}`


## SQL files (for review, not run)
- `sql/A_snapshot_backup.sql`: `create table legacy_lessons_staging_backup_nov2 as select * from legacy_lessons_staging;` plus a count check (869 and 869) and a per-lesson rollback template.
- `sql/B_update_items_1_2.sql`: runs inside `begin;` with 360 `update` statements, one per lesson id, using `jsonb_set` on step 0 (153 of them) and on the final step (all 360). Each statement is guarded by the old text and the generic cue, so it is idempotent and cannot overwrite later edits. It also sets `updated_at = now()`. It ends with 6 verification queries: rows changed vs the backup (expect 360), changed non-series rows (0), final step now `reflection` (360) and still `cue` (0), remaining broken phrasing (0), step 0 changed (153), total and hidden rows (869 and 26), then leaves `commit;` / `rollback;` commented for you to choose.
- Not executed. I have no Postgres here, so I checked the same transformation in Python against the live data (153 step 0 changes, 360 final-step swaps, 0 broken phrases left, 0 em dashes introduced) but the SQL syntax itself has not been run against a database. Run file A, then B up to the verification block, and read the counts before committing.

## Decisions I need from you
1. Item 2 variant for the 240 wrong-skill prompts: (a) corrected (as written in file B), (b) verbatim, or (c) only the 120 verbatim ones.
2. Keep the "Write one specific action" wording although there is no text field, or have me propose different wording.
3. Include the three "awkward" boss rows (`entering in …`) or only the "error" rows.
4. How to handle the checkpoint and boss subject-matter problem, and the 225/skill-fit question for item 3, which are content rewrites rather than phase 1 edits.
