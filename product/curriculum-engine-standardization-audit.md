# Curriculum Engine Standardization Audit — Clutchr Baseball

## 1. Audit date

May 12, 2026

## 2. Current branch

`work`

## 3. Files inspected

### Primary implementation files

- `app/(tabs)/career.tsx`
- `app/(tabs)/index.tsx`
- `app/lesson/[id].tsx`
- `lib/lessonRouter.ts`
- `lib/supabase.ts`
- `context/AthleteContext.tsx`

### Product/reference docs inspected

- `product/core-ux-loop-audit.md`
- `product/reward-progression-audit.md`
- `product/lesson-player-polish-audit.md`
- `docs/CODEX_CLUTCHR_CONTEXT.md`
- `docs/MASTER_EVOLUTIONS.md`

## 4. Current Career architecture summary

Career is currently a hybrid system:

- **Static world shell:** `WORLDS` and `CHAPTERS` are hard-coded in `app/(tabs)/career.tsx`. They define visible world IDs, labels, chapter membership, role filters, colors, premium flags, state-trigger flags, world numbers, and icons.
- **Database-backed lesson nodes:** `fetchLessons({ limit: 200 })` loads active records from `legacy_lessons_staging`. Career groups those records by `pillar_id`, and a world becomes active if at least one fetched lesson uses the matching world ID as its `pillar_id`.
- **Chapter tabs:** Career displays five static chapters: Foundation, Your Craft, Edge, The Grind, and Signal.
- **World ordering:** The static `WORLDS` array controls world order through array position and `worldNumber`. Lessons inside each active world are sorted by `order_index`.
- **Visible lock model:** A world is `active` when its ID exists in the fetched lesson `pillar_id` set. Otherwise, only the first unavailable world in a chapter is shown as a `teaser`; later unavailable worlds are hidden.
- **Role filtering:** Your Craft filters worlds by `roles` and the athlete's `primary_role`. Universal worlds with empty `roles` remain visible in non-role-filtered chapters. `baserunner-path` currently lives in the Foundation chapter and is universal.
- **State-triggered worlds:** Static worlds can declare `isStateTrigger` and `triggerState`; if the world has no lessons, it only appears when `season_phase` or `health_state` matches the trigger.
- **Completed display:** A world progress bar shows `done / total` for lessons in that `pillar_id`. Lesson nodes show checkmarks when their `id` is in `athleteState.completed_lessons`.
- **Current/locked/completed lesson state:** A node is done if completed; next if it is the first uncompleted node whose prior nodes in that world are complete; locked if the immediately previous lesson is incomplete.
- **Checkpoint/boss display:** Career shows divider labels before checkpoint/boss nodes. Boss nodes get larger circles, a crown marker, and boss labels.

### Career feel verdict

Career has the beginnings of a climb because worlds have progress, a left-spine timeline, locked nodes, next-node pulsing, and world-clear celebration. However, the current structure can still feel like a content list because world availability is mostly “has any lessons in this pillar,” not a canonical progression spine with sub-units, required practice days, checkpoints, pressure variations, and bosses. The active world is visible only after the athlete expands it; there is no canonical “current chapter/world/sub-unit” state beyond completed lesson counts.

## 5. Current lesson schema summary

### Fields currently typed in app code

`LegacyLesson` in `lib/supabase.ts` currently defines:

- `id`
- `legacy_lesson_id`
- `pillar_id`
- `unit_id`
- `title`
- `subtitle`
- `difficulty_tier`
- `duration_sec`
- `xp_reward`
- `order_index`
- `is_checkpoint`
- `is_boss`
- `steps`
- `sport_scope`
- `role_tags`
- `skill_tags`

### Fields required by Home

Home needs enough data for next-rep routing and the hero card:

- `id` to route to `/lesson/[id]`
- `title` and `subtitle` for the hero
- `pillar_id` for reason copy
- `order_index` for fallback order, indirectly through `fetchLessons`
- `role_tags` for role matching
- `skill_tags` for struggle matching
- `season_tags` is referenced dynamically in `lessonRouter.ts` but is not typed in `LegacyLesson`
- `completed_lessons`, `primary_role`, `season_phase`, and `biggest_struggle` from athlete state

### Fields required by Career

Career needs:

- `id` for completion state and lesson routing
- `pillar_id` for world grouping
- `order_index` for node order inside each world
- `title` for node cards
- `xp_reward` for card and world XP summary
- `is_checkpoint` and `is_boss` for checkpoint/boss display
- `lesson_family` and `node_type` are read via `any` fallbacks but are not in the current typed interface

### Fields required by the lesson player

The lesson player needs:

- `id` for completion and duplicate-completion protection
- `title`, `subtitle`, `pillar_id`, and optional `lesson_family` for headers
- `steps` as an array of screen/interaction payloads
- `xp_reward` for awarded XP
- `is_checkpoint` and `is_boss` for completion check-ins and payoff type
- Step-level `type`, `ui_variant`, and variant-specific `data`, `responses`, and `feedback`

### Current schema concerns

- `node_type` is used in Career for checkpoint/boss display, but it is not typed in `LegacyLesson` and is not used by the lesson player.
- `is_checkpoint` is used by the lesson player; Career currently treats `node_type === 'checkpoint'` as checkpoint but does not include `lesson.is_checkpoint` in that specific checkpoint boolean. This creates a safe-to-fix mismatch later.
- `is_boss` is used consistently by Career and lesson completion; Career also accepts `node_type === 'boss'`.
- `unit_id` is typed but not used for visible grouping or routing yet.
- `pillar_id` is the real world join key today.
- `role_tags` are used by Home routing; Career role filtering is world-level, not lesson-level.
- `skill_tags` are used by Home routing only for struggle matching.
- `season_tags` are referenced dynamically by router but not typed or guaranteed by `fetchLessons`.

## 6. Current routing model summary

Home fetches up to 200 active lessons from `legacy_lessons_staging`, calls `pickNextLesson(lessons, athleteState)`, and routes the selected lesson to `/lesson/[id]`.

Current router behavior in practice:

1. Build the incomplete lesson pool by removing IDs in `athlete.completed_lessons`.
2. Pick the first incomplete lesson whose `skill_tags` overlap any `biggest_struggle` value by substring.
3. Pick the first incomplete lesson whose dynamic `season_tags` includes `season_phase`.
4. Pick the first incomplete lesson whose `role_tags` includes `primary_role`.
5. Fall back to the first incomplete lesson in fetched order.
6. If everything is completed, return the last lesson with an “all caught up” reason.

Important mismatch: `lessonRouter.ts` has constants and comments for emergency overrides, foundation gate, role-to-pillar routing, and first-uncompleted-in-pillar helpers, but the current exported `pickNextLesson` does not use those helpers. The implementation is tag-first and does not yet enforce world/sub-unit progression, checkpoint remediation, anti-repetition, or recovery/debrief interruptions.

## 7. Current world/path model summary

The current model is:

- Chapter = static tab.
- World = static `WORLDS` item, activated by matching lesson `pillar_id`.
- Path = implied by `pillar_id` and `order_index`, not stored as canonical state.
- Lesson node = database lesson row.
- Sub-unit = not implemented in UI/routing, though `unit_id` exists.
- Step = object inside the lesson `steps` array.

This is good enough to ship small curated worlds, but it is not yet safe for large content expansion. Future content should not add more visible worlds simply to create depth; depth should be stored as sub-units and node types inside existing role paths.

## 8. Current checkpoint/boss handling summary

### Career

- Boss handling is partially canonical: `is_boss` or `node_type === 'boss'` marks a boss for divider and visual treatment.
- Checkpoint handling is inconsistent: Career currently checks `node_type === 'checkpoint'` for checkpoint divider display, but does not use `lesson.is_checkpoint` in that checkpoint boolean.
- Bosses get a larger timeline circle, crown, “BOSS REP,” and “BOSS BATTLE” divider.
- Checkpoints get a “CHECKPOINT” divider only if `node_type` is present as `checkpoint`.

### Lesson player

- `is_checkpoint` or `is_boss` triggers a self-rating check-in before the completion overlay.
- `is_boss` controls boss-specific completion haptics and payoff type.
- Checkpoints and bosses are both treated as high-significance completion events; node type is not used.

### Completion/state

- Lesson completion only stores the lesson ID in `completed_lessons` and adds XP/streak data.
- There is no separate checkpoint pass/fail record, boss result record, node result metadata, retry state, or remediation assignment.

## 9. Current gaps/risks

1. **No canonical node model:** The app supports lessons, checkpoints, and bosses through booleans, but it has no typed node taxonomy for review, practice day, pressure variation, reset, recovery, debrief, or next-best-rep nodes.
2. **World sprawl risk:** The code has 30 visible worlds, but activation is based on whether lessons exist. That can encourage adding more worlds instead of deepening existing paths.
3. **Sub-unit gap:** `unit_id` exists but is not surfaced or routed. There is no way to express “Damage Window sub-unit 1 must end with a checkpoint before Swing/Take Engine begins.”
4. **Router gap:** Home’s next rep is tag-driven, not spine-driven. It can route to a struggle/role match before enforcing the current required node.
5. **Checkpoint remediation gap:** Failing or struggling in a checkpoint does not route a review/practice day next.
6. **Boss unlock gap:** Bosses do not formally unlock the next sub-unit/world beyond ordinary completion count.
7. **Metadata drift risk:** `node_type`, `season_tags`, `lesson_family`, and possible state tags are partially or dynamically referenced without a typed content contract.
8. **Career mismatch risk:** Checkpoints with `is_checkpoint: true` but no `node_type: 'checkpoint'` may complete like checkpoints but not display as checkpoints in Career.
9. **Duration mismatch:** `duration_sec` exists, but Career displays a hard-coded `~5 min`.
10. **Completion granularity gap:** `completed_lessons` is a flat ID array; it cannot store result quality, misses, attempts, or checkpoint domains.
11. **State interruption gap:** Slump and return-to-throw exist as season phases, but the router does not currently apply the documented emergency override constants.
12. **Role depth gap:** Role-specific worlds exist, but current routing does not maintain a per-role sub-unit spine.

## 10. Recommended curriculum engine model

Canonical future hierarchy:

**Sport → Chapter / internal layer → World → Sub-unit → Node → Step**

Definitions:

- **Sport:** Baseball. Keeps the engine extensible without diluting current product focus.
- **Chapter / internal layer:** Broad organizing layer such as Foundation, Your Craft, Edge, The Grind, Signal. It may be visible as tabs, but the athlete should not manage curriculum at this level.
- **World:** Visible athlete progression area such as `hitter-path`, `baserunner-path`, `catcher-path`, `infield-path`, or `pressure-resilience`.
- **Sub-unit:** Hidden or lightly visible cluster inside a world. This is the primary anti-sprawl layer. Example: `hitter-path/damage-window`.
- **Node:** A required or adaptive rep in the path. Allowed future values: `lesson`, `review`, `practice_day`, `checkpoint`, `pressure_variation`, `boss`, `reset`, `recovery`, `debrief`, `next_best_rep`.
- **Step:** Individual screen or interaction inside a node, backed by the existing `steps` array.

Principle: worlds should feel like a climb; sub-units carry curriculum depth; node types carry learning cadence; steps carry presentation.

## 11. Recommended lesson cadence

### Default sub-unit cadence

1. Install Lesson
2. Decision Lesson
3. Interactive Rep
4. Practice Day / Review Drill
5. Pressure Variation
6. Checkpoint
7. Advanced Applied Lesson
8. Boss

### Simpler MVP cadence

1. Lesson
2. Lesson
3. Interactive Rep
4. Checkpoint
5. Boss

### Cadence rules

- Insert a review after 2–3 concept installs or after any failed/weak checkpoint.
- Insert a practice day before a checkpoint when the prior nodes introduced multiple cues or decisions.
- Insert a checkpoint after one coherent cluster, not after an arbitrary number of lessons.
- Insert a boss after 5–8 nodes in a default sub-unit or after the MVP 5-node cadence.
- Trigger reset/recovery as interruptions, not as permanent detours.
- Younger athletes should get shorter text, fewer simultaneous cues, more review, and simpler pressure variables.
- Older athletes can receive more count/score/role-specific context, but still only one new stress variable per pressure variation.
- Role branches should deepen inside existing worlds before adding new visible worlds.

## 12. Recommended practice/review model

Practice and review are required curriculum jobs, not filler.

### Review node job

Revisit previous cues without adding complexity. Review should restore confidence and reduce skill fade.

### Practice day node job

Blend 2–4 prior concepts in lower-pressure reps before a checkpoint or boss.

### Trigger review when

- Athlete fails or barely passes a checkpoint.
- Athlete repeats the same decision mistake.
- Self-ratings show low confidence, focus, composure, reset skill, or recovery discipline.
- Athlete returns after time away.
- Athlete enters `slump_reset` or `return_to_throw` state.
- Athlete has had too many new concept lessons without a practice day.

### Practice day standards

- Review prior cue language.
- Combine small skills without adding new terminology.
- Lower pressure before a checkpoint.
- Build confidence before the boss.
- End with a clear “next checkpoint is loaded” payoff.

## 13. Recommended checkpoint model

Checkpoint job: confirm the athlete understands the operating rule for one sub-unit cluster.

Standards:

- Short: 2–4 steps.
- Baseball scenario first; no school-style quiz tone.
- Tests one cluster, not the whole sport.
- Uses interactive/scenario format when possible.
- Gives immediate feedback with baseball language.
- Can pass, soft-pass, or trigger review in future result tracking.
- Should remain compatible with `is_checkpoint: true` until `node_type` is fully supported.

Examples:

- Hitter: Damage Window Checkpoint.
- Baserunner: First-to-Third Read Checkpoint.
- Infielder: PPP Scan Checkpoint.
- Catcher: Mound Visit Calm Checkpoint.
- Pitcher: Count Leverage Checkpoint.

## 14. Recommended boss model

Boss job: integrate multiple prior skills in a short, game-like challenge.

Standards:

- Rare: usually one per sub-unit or world phase.
- Integrates prior skills instead of installing new content.
- Includes one or more realistic pressure variables.
- Rewards more XP than normal lessons.
- Unlocks next sub-unit/world phase in future state model.
- Shows a stronger completion payoff than normal lessons.
- Must set `is_boss: true` until `node_type` is fully supported by all consumers.

Examples:

- Pitcher: Bases Loaded Command Boss.
- Hitter: Quality AB Gauntlet.
- Catcher: Calm the Chaos Inning.
- Infielder: Rapid Coverage Boss.
- Outfielder: Fire Drill Read Boss.
- Baserunner: Green-Light Boss.

## 15. Recommended reset/recovery interruption model

Reset/recovery should interrupt without derailing the path.

Recommended interruption examples:

- Low readiness → route to recovery/tool instead of a hard lesson.
- Arm soreness or return-to-throw phase → pre-throw readiness/recovery node.
- Rough game → postgame debrief node.
- Next morning after a rough result → next-day reset node.
- Slump pattern → reset/review branch.
- Low composure rating after a checkpoint/boss → reset node before retry.

Future routing priority should be:

1. Safety/recovery interruption.
2. Postgame/next-day reset interruption.
3. Required current node.
4. Unresolved weakness/review.
5. Season-phase fit.
6. Role relevance.
7. Anti-repetition.
8. Normal progression.

## 16. Recommended role-specific depth model

Do not solve role depth with 20 more visible worlds. Use existing role worlds as containers and deepen them with sub-units.

### Example future world structures

#### `hitter-path`

- Sub-unit 1: Damage Window
- Sub-unit 2: Swing/Take Engine
- Sub-unit 3: Count Leverage
- Sub-unit 4: Pitch Recognition
- Sub-unit 5: Two-Strike Compete
- Boss: Quality AB Gauntlet

#### `baserunner-path`

- Sub-unit 1: Lead Architecture
- Sub-unit 2: Steal Window
- Sub-unit 3: Dirt-Ball Reads
- Sub-unit 4: First-to-Third Decisions
- Boss: Green-Light Running Boss

#### `infield-path`

- Sub-unit 1: PPP Scan
- Sub-unit 2: Internal Clock
- Sub-unit 3: Throw Priority
- Sub-unit 4: Error Reset
- Boss: Infield Rapid Coverage Boss

#### `catcher-path`

- Sub-unit 1: Receiving First
- Sub-unit 2: Pitch Calling
- Sub-unit 3: Mound Visit Calm
- Sub-unit 4: Coverage Command
- Boss: Team Chaos Inning Boss

#### `pitcher-path`

- Sub-unit 1: Mound Scan
- Sub-unit 2: Count Leverage
- Sub-unit 3: Tempo Control
- Sub-unit 4: Miss Response
- Boss: Bases Loaded Command Boss

## 17. Recommended world/sub-unit/node naming conventions

### IDs

- Use lowercase kebab-case.
- World IDs should match `pillar_id` while the current schema is in use.
- Sub-unit IDs should be stable and scoped by world in content documentation, even if stored in `unit_id`.
- Node IDs should be stable and human-readable enough for debugging.

Examples:

- World: `hitter-path`
- Sub-unit / `unit_id`: `damage-window`
- Node: `hitter-damage-window-01-install-zone`
- Boss: `hitter-damage-window-boss-quality-ab-gauntlet`

### Titles

- Use athlete-facing baseball language.
- Avoid school/course language such as “module,” “quiz,” “lecture,” “chapter test.”
- Keep node titles short enough for Home and Career cards.

### Families

`lesson_family` should describe the baseball skill family, not the screen type. Examples: `swing-decision`, `pressure-resilience`, `baserunner-iq`, `catcher-command`, `infield-iq`.

## 18. Recommended metadata fields for future content packs

| Field | Status | Notes |
| --- | --- | --- |
| `id` | Supported now | Required by Home, Career, lesson player, and completion. |
| `legacy_lesson_id` | Supported now | Keep for staging/import traceability if existing content uses it. |
| `pillar_id` | Supported now | Current world join key. Must match a `WORLDS.id` for Career activation. |
| `unit_id` | Partially supported | Typed but not used for grouping/routing. Use consistently now for future migration. |
| `title` | Supported now | Required by Home, Career, lesson player. |
| `subtitle` | Supported now | Used by Home and lesson player. |
| `difficulty_tier` | Supported now | Typed but not currently central to routing. |
| `duration_sec` | Partially supported | Typed; Career currently displays hard-coded duration. |
| `xp_reward` | Supported now | Used by Career and completion. |
| `order_index` | Supported now | Primary lesson ordering field. Must be unique enough inside a world/sub-unit. |
| `is_checkpoint` | Supported now | Lesson player uses it. Career should continue to receive it. |
| `is_boss` | Supported now | Career and lesson player use it. |
| `node_type` | Partially supported | Career reads via `any`; lesson player/router do not type or rely on it. Future canonical enum. |
| `sport_scope` | Supported now | Typed; keep `baseball` for current content. |
| `role_tags` | Supported now | Home router uses this for role relevance. |
| `skill_tags` | Supported now | Home router uses this for struggle relevance. |
| `season_tags` | Partially supported | Router checks dynamically; not typed in `LegacyLesson`. |
| `state_tags` | Future only | Needed for slump, recovery, postgame, readiness routing. |
| `lesson_family` | Partially supported | Lesson player and Career read via fallback/dynamic access; not typed. |
| `steps` | Supported now | Required for lesson player. |

Allowed future `node_type` values:

- `lesson`
- `review`
- `practice_day`
- `checkpoint`
- `pressure_variation`
- `boss`
- `reset`
- `recovery`
- `debrief`
- `next_best_rep`

Compatibility rule: until every consumer supports `node_type`, content packs must continue to set `is_checkpoint` and `is_boss` booleans correctly. Do not use `node_type` alone for checkpoints or bosses.

## 19. “Safe now” fixes

No production code changes were required for this pass. The safest immediate action was documentation because the sprint goal is audit + architecture.

Safe low-risk fixes recommended for a future tiny patch:

1. In Career, define checkpoint as `lesson.is_checkpoint || nodeType === 'checkpoint'` so checkpoint display matches lesson-player completion behavior.
2. Add optional fields to `LegacyLesson` type only after confirming Supabase columns exist: `node_type?: string`, `lesson_family?: string`, `season_tags?: string[]`, `state_tags?: string[]`.
3. Replace Career's hard-coded `~5 min` with `duration_sec` formatting when present.
4. Update stale `lessonRouter.ts` comments or implement the documented priority stack; do not leave comments claiming foundation/emergency logic that is not executed.

## 20. “Do not build yet” items

Do not build these until the canonical metadata contract is accepted:

- Do not add new visible worlds just to create content volume.
- Do not mass-generate lessons.
- Do not add new `ui_variant` names unless components already exist.
- Do not use `node_type` alone if the player expects `is_checkpoint` / `is_boss`.
- Do not create long lecture lessons.
- Do not create school-style quizzes.
- Do not add more worlds before role paths have depth.
- Do not make Locker content replace Career progression.
- Do not let Game Mode become a random tool dump.
- Do not use generic mental skills without baseball situations.
- Do not change Supabase schema until migration needs and backward compatibility are documented.
- Do not rewrite Career or lesson player during content-architecture work.
- Do not change paywall/revenue logic for curriculum routing unless entitlement-aware routing is explicitly scoped.

## 21. Future migration plan

### Phase 0 — Contract freeze

- Accept the hierarchy and node-type vocabulary in this audit.
- Require every new content pack to include `pillar_id`, `unit_id`, `order_index`, booleans, tags, `lesson_family`, and `steps`.
- Keep `pillar_id` as current world join key.

### Phase 1 — Type-safe metadata alignment

- Confirm actual Supabase columns for `node_type`, `lesson_family`, `season_tags`, and any future `state_tags`.
- Update `LegacyLesson` type only for real columns.
- Normalize checkpoint/boss display across Career and lesson player.

### Phase 2 — Sub-unit aware Career documentation/UI hints

- Use `unit_id` to group nodes internally.
- Optionally show light sub-unit labels inside expanded worlds without changing the world map concept.
- Keep visible worlds stable.

### Phase 3 — Router spine

- Add a deterministic required-current-node selector:
  - current world
  - current sub-unit
  - incomplete required nodes
  - checkpoint/boss gates
- Then layer adaptive interruptions and review.

### Phase 4 — Result-aware remediation

- Store checkpoint/boss attempts, pass state, weak domains, and recent misses.
- Route failed/weak checkpoint results to review or practice day nodes.

### Phase 5 — Recovery/debrief state

- Add state tags and debrief outputs once Game Mode/postgame data is ready.
- Route recovery/debrief as temporary interruptions, then return to the spine.

### Phase 6 — Content expansion

- Build depth packs for hitter, baserunner, catcher, defense, pitcher, and recovery.
- Each pack must include sub-unit cadence, checkpoints, boss, review, and pressure variation mapping before import.

## 22. QA checklist

Use this checklist for future implementation passes:

1. Confirm app still runs.
2. Confirm Home still loads.
3. Confirm Career still loads.
4. Confirm existing worlds still appear.
5. Confirm lessons still launch.
6. Confirm normal lesson completion still works.
7. Confirm checkpoint/boss visuals still work if test data exists.
8. Confirm no Home/Core UX regression.
9. Confirm no lesson player regression.
10. Confirm `product/curriculum-engine-standardization-audit.md` exists and clearly defines the future engine.

## Appendix A — Node jobs

| Node type | Job |
| --- | --- |
| `lesson` | Install one concept, cue, or decision rule. |
| `review` | Revisit previous cues without adding complexity. |
| `practice_day` | Blend 2–4 prior concepts in easier reps. |
| `checkpoint` | Confirm the athlete understands the operating rule. |
| `pressure_variation` | Add one stress variable: count, score, runners, time, mistake, fatigue, bad call, crowd, etc. |
| `boss` | Integrate multiple prior skills in a short game-like challenge. |
| `reset` | Interrupt the path when composure/struggle state requires it. |
| `recovery` | Interrupt or modify the path when readiness/arm-care state requires it. |
| `debrief` | Capture a game/practice result and create tomorrow's cue. |
| `next_best_rep` | Route the athlete to the next most useful action. |

## Appendix B — Future router requirements

Future next-best-rep routing should consider:

- current world
- current sub-unit
- incomplete required nodes
- athlete role
- season phase
- biggest struggle
- readiness/recovery state
- postgame debrief state
- recent misses/checkpoint results
- anti-repetition
- premium/free entitlement if already present

Recommended priority:

1. Safety/recovery interruption.
2. Postgame/next-day reset interruption.
3. Required current node.
4. Unresolved weakness/review.
5. Season-phase fit.
6. Role relevance.
7. Anti-repetition.
8. Normal progression.

## Appendix C — Content generation guardrails

Every generated content pack must answer before import:

- Which world does this deepen?
- Which sub-unit does it belong to?
- What is the node type?
- What prior cue does it depend on?
- What checkpoint or boss does it prepare for?
- What review/practice node prevents skill fade?
- What role tags and season/state tags are appropriate?
- Does the player support every step `ui_variant` used?
- Are `is_checkpoint` and `is_boss` correct for compatibility?
- Is this a baseball situation, not generic motivation content?
