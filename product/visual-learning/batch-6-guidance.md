Batch 6 Guidance

Controlled Rollout for Visual Learning+ New Interactions

1. Batch 6 Goal

 Batch 6 should prove that visual learning improves Clutchr without turning the app into a video library. The batch should introduce Snapshot Read and Film Room as premium variety while continuing to use OneWordLock,DragSequence, DiamondCursor, and existing interactive variants.

2. Recommended Batch Mix



| Content Type | Target Share | If Batch= 60 Lessons | Rule |
| --- | --- | --- | --- |
| OneWordLock | 10-12% | 6-7 | Use for cue recall, reset words, role identity, count plan labels. |
| DragSequence | 10-12% | 6-7 | Use for routines, postgame order, mound visit sequence, on- deck flow. |
| DiamondCursor | 10-12% | 6-7 | Use for zone/decision placement, confidence/intent calibration. |
| Snapshot Read | 10-15% | 6-9 | Use for still-frame cue recognition. No more than 2 in a row in same world. |
| Film Room | 5-8% | 3-5 | Use sparingly. Prefer checkpoints or standalone Coach's Eye moments. |
| Existing interactive variants | 20-25% | 12-15 | Use strike_zone_visualizer, pitch_count_board,timing_track, jump_read, pressure_replay. |
| Text/choice/reflection/cue | 20-25% | 12-15 | Use as glue, setup, feedback, and quick reps. |


3. Recommended Batch 6 Theme

Best Batch 6 theme: Coach's Eye+ Role Reads. It should deepen existing worlds instead of opening a bunch of new worlds.



| World | Batch 6 Additions | Visual Layer | Notes |
| --- | --- | --- | --- |
| Hitter Path | Pitch Recognition, Damage Lane, High Velo, Two-Strike | Snapshot+ Film | Use top Snapshot hitter assets and short Film Room hitter approach clips. |
| Pitcher Path | Set Height, Low Zone, Runner Control, Post-Walk Reset | Snapshot | Use diagrams and Al scenes first; no video dependency. |
| Opponent Intel | Second-Ear Hitting, Pitch Leakage, Dugout Reads | Snapshot+ Film | This is the premium differentiator lane. |
| Pressure& Resilience | Freese,Freeman,Gibson,Bad- Call Reset | Film+ Snapshot | Use Film Room as checkpoint- style moments. |
| Team Chaos | Rays 2020 chaos, LSU final out, dugout body language | Film+ Snapshot | Good for team-wide lessons and boss support. |
| Baserunner Path | First Move,Tag/Go,Dirt Ball, Chaos Finish | Snapshot+existing jump_read | Do not wait for a new runner simulator. |
| Infield/Outfield Path | PPP,first step,cutoff,misread recovery | Snapshot+jump_read | Use visual reads, not generic fielding advice. |


4. Batch 6 Build Order

1. Patch Snapshot Read and Film Room components first.

2. Repair existing broken snapshot_read rows before adding new ones.

3. Run visual step validator on all existing lessons.

4. Generate a 10-lesson QA mini-batch: 4 Snapshot, 2 Film, 4 other interactions.

5.Import QA mini-batch into staging only.

6. Device test every new visual step.

7. Generate full Batch 6 using ratios above.

8. Run SQL/content validation before import.

9.Import by world in small chunks.

10. Commit only after screenshots/device checks.

5. Anti-Repetition Rules

.Never use"What do you notice?" alone. Always attach a cue lens: release, tempo, body language, target, first move.

●Do not place Film Room back-to-back with Film Room in normal Career flow.

.Do not use the same famous clip in more than one lesson until there are at least 20 lessons between appearances.

.Do not repeat the same visual skill more than twice in one batch unless it belongs to a checkpoint cluster.

Do not make every feedback line start with"Good read" or"Not quite". Rotate correction language.

●Do not generate visual lessons without role tags and skill tags.

.● If media fails, the app must preserve flow. Visual content cannot become the new blank-screen risk.

6. Batch 6 Content Seeding Prompt

Generate Batch 6 for Clutchr Baseball using the visual learning rollout rules.rules.

Use this exact mix:

- 10-12% OneWordLock

- 10-12% DragSequence

- 10-12% DiamondCursor

- 10-15% Snapshot Read

- 5-8% Film Room

- 20-25% existing interactive variants

- 20-25% text/choice/reflection/cue glue steps

 Use existing worlds first: Hitter Path,Pitcher Path, Opponent Intel,Pressure Resilience, Team Chaos, Baserunner Path,Infield Path, Outfield Path.

Rules:

- One lesson= one clear baseball job.

- One visual moment= one question.

- Snapshot Read must include image_uri or diagram_mode, cues with quality, responses, and feedback.

- Film Room must include canonical_url, fallback_url, start_sec, end_sec, reliability_rating, setup, question, choices,coach_breakdown,and takeaway.

- Do not create unsupported ui_variants except snapshot_read and film_room after implementation is complete.

- Keep standard lessons 1-3 minutes.

- Use baseball-native, role-aware language. No classroom tone. No quiz language. No generic motivation.

- If removing baseball nouns leaves the lesson intact, rewrite it.

Output schema-safe Supabase rows with id,pillar_id,unit_id,title, subtitle,difficulty_tier, duration_sec,xp_reward,order_index,is_checkpoint,is_boss,lesson_family,sport_scope,role_tags,skill_tags,steps,feedback,reward.

:7. Ship/ No-Ship Criteria

| Gate | Ship | No-Ship |
| --- | --- | --- |
| Schema | Every row validates against supported step types and ui variants. | Any unknown ui_variant or malformed visual step. |
| Media | Every Film Room has fallback URL and replacement notes. | Video-only lesson with no fallback path. |
| Snapshot | Every Snapshot has image/diagram and cue- quality grading. | Image with no question/answers/feedback. |
| Tone | Baseball-native, direct, role-aware. | Quiz/classroom/motivation language. |




| Flow | Visuals add premium variety. | Visuals dominate batch and slow Career progression. |
| --- | --- | --- |


