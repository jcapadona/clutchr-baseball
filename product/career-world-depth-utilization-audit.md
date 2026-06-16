# Career World Depth & Utilization Audit

## 1. Audit date

- **Date:** 2026-05-12
- **Current branch observed in repo:** `work`
- **Requested branch context:** `stable-good-ui`
- **Sprint step:** Step 7 — expand depth inside existing worlds and audit Career world utilization.

## 2. Current branch

The local Git branch reported by `git branch --show-current` is `work`. The user-requested branch was `stable-good-ui`; no branch switch was performed because the task environment opened directly in `/workspace/clutchr-baseball`.

## 3. Files inspected

Primary files inspected:

- `app/(tabs)/career.tsx`
- `app/(tabs)/index.tsx`
- `lib/lessonRouter.ts`
- `lib/supabase.ts`
- `context/AthleteContext.tsx`
- `app/lesson/[id].tsx`
- `product/curriculum-engine-standardization-audit.md`
- `product/lesson-player-polish-audit.md`
- `product/reward-progression-audit.md`
- `product/core-ux-loop-audit.md`

Additional files inspected:

- `docs/MASTER_EVOLUTIONS.md`
- `docs/CODEX_CLUTCHR_CONTEXT.md`
- `app/onboarding.tsx`
- `app/(tabs)/gamemode.tsx`
- `app/(tabs)/locker.tsx`
- `app/(tabs)/profile.tsx`
- `app/dev-qa.tsx`
- `app/upgrade.tsx`
- `components/StrikeZoneVisualizer.tsx`
- `components/PitchCountBoard.tsx`
- `components/SnapshotRead.tsx`
- `components/TimingTrack.tsx`
- `components/PressureReplay.tsx`
- `components/ConfidenceSlider.tsx`
- `components/JumpRead.tsx`
- `components/LeverageLadder.tsx`
- `components/RoutineCardBuilder.tsx`
- `components/PitchSequenceChess.tsx`
- `components/FieldIQBoard.tsx`
- `components/ThrowDecisionBoard.tsx`

Commands used for this audit:

- `find /workspace -name AGENTS.md -print`
- `git status --short`
- `git branch --show-current`
- `rg -n "world|worlds|pillar|pillar_id|hitter-path|pitcher-path|catcher-path|baserunner-path|infield-path|outfield-path|pressure-resilience|built-different|signal|recruiting|showcase|command|boss|checkpoint|lesson_family|unit_id" app lib contexts product docs 2>/dev/null`
- `rg -n "pillar_id|legacy_lessons|unit_id|lesson_family|hitter-path|pitcher-path|catcher-path|baserunner-path|infield-path|outfield-path|built-different|pressure-resilience|showcase-recruiting|readiness-routines|game-day-focus|baseball-iq|slump-recovery|return-to-throw|pitching-mindset|hitting-approach|catcher-leadership|infield-play-iq|outfield-reads|competitive-identity|pressure-proof|leadership-dugout|bounce-back-player|arm-care-durability|strength-conditioning|recovery-readiness|coach-dynamics|what-the-pros-do" . --glob '!node_modules/**'`
- `python` one-off parser over `app/(tabs)/career.tsx` to count configured worlds.

## 4. Current visible Career chapters/tabs

Career defines **5 tabs**:

1. `foundation` — Foundation
2. `your-craft` — Your Craft
3. `edge` — Edge
4. `the-grind` — The Grind
5. `signal` — Signal

The attached screenshots confirm these five visible tabs. The current UI presentation is tabbed, not a full atlas.

## 5. Current visible worlds

There are **30 configured worlds** in `app/(tabs)/career.tsx`, but Career does **not** show all 30 at once.

Runtime visibility is driven by `getWorldsForChapter(...)`:

- A world with at least one active lesson whose `pillar_id` matches `world.id` is shown as `active`.
- If a world has no matching lessons, Career shows only the **first** no-content world in that chapter as a `teaser`.
- Worlds after the first teaser in that chapter are hidden.
- `your-craft` worlds are role-filtered before lesson availability is evaluated.
- `signal` worlds are premium worlds and currently present as locked/Signal teaser behavior.
- State-trigger worlds can be hidden when they have no matching lessons and the athlete's current state does not match their trigger.

From the supplied screenshots:

- `edge` is visibly showing:
  - `built-different` — active/completed or near-completed depending screenshot state.
  - `pressure-resilience` — active.
  - `competitive-identity` — teaser/coming soon.
  - `pressure-proof`, `leadership-dugout`, and `bounce-back-player` are configured but hidden behind the first Edge teaser.
- `signal` is visibly showing:
  - `showcase-recruiting` — premium/Signal locked teaser.
  - `coach-dynamics` and `what-the-pros-do` are configured but hidden behind the first Signal teaser.

Because this environment does not include Supabase credentials, exact live lesson-backed visibility could not be queried. The most accurate current-state statement from code is: **Career is configured with 30 worlds, but visible runtime worlds are the active lesson-backed worlds plus one teaser per chapter after filtering.**

## 6. All world IDs / pillar IDs found in code/config

### Career `WORLDS` IDs

- `foundation`
- `readiness-routines`
- `game-day-focus`
- `baseball-iq`
- `slump-recovery`
- `return-to-throw`
- `pitcher-path`
- `pitching-mindset`
- `pitching-strategy`
- `hitter-path`
- `hitting-approach`
- `catcher-path`
- `catcher-leadership`
- `infield-path`
- `infield-play-iq`
- `outfield-path`
- `outfield-reads`
- `baserunner-path`
- `built-different`
- `pressure-resilience`
- `competitive-identity`
- `pressure-proof`
- `leadership-dugout`
- `bounce-back-player`
- `arm-care-durability`
- `strength-conditioning`
- `recovery-readiness`
- `showcase-recruiting`
- `coach-dynamics`
- `what-the-pros-do`

### Master evolution reference IDs

`docs/MASTER_EVOLUTIONS.md` lists the same 30 current active world ideas and explicitly describes 60+ future world ideas as an expansion bank, not as current Career UI inventory.

### Router/config pillar IDs

`lib/lessonRouter.ts` references these route/pillar IDs directly:

- `foundation`
- `built-different`
- `pitcher-path`
- `hitter-path`
- `catcher-path`
- `infield-path`
- `outfield-path`
- `baserunner-path`
- `pressure-resilience`
- `gamemode`

## 7. All route/path IDs found in lessonRouter/Home/Career

### Home

Home fetches up to 200 active lessons with `fetchLessons({ limit: 200 })`, calls `pickNextLesson(lessons, athleteState)`, and routes the returned lesson to `/lesson/${id}`.

### Career

Career fetches up to 200 active lessons with `fetchLessons({ limit: 200 })`, computes `lessonPillarIds` from `lessons.map(l => l.pillar_id)`, and activates worlds when `lesson.pillar_id === world.id`.

### Lesson player

`app/lesson/[id].tsx` loads one row from `legacy_lessons_staging` by `id`, falls back to `content_cards`, and uses the lesson's `steps`, `is_checkpoint`, `is_boss`, `pillar_id`, and dynamic `lesson_family`/`path_name` fallbacks for display and completion behavior.

### Router

`lessonRouter.ts` currently routes by:

1. Any incomplete lesson with `skill_tags` overlapping `athlete.biggest_struggle`.
2. Any incomplete lesson with dynamic `season_tags` including `athlete.season_phase`.
3. Any incomplete lesson whose `role_tags` include `athlete.primary_role`.
4. The first incomplete lesson in the fetched order.

It defines but does not use a stricter world-progress stack including `ROLE_TO_PILLAR`, `STRUGGLE_TO_PILLAR`, `EMERGENCY_PHASE_TO_PILLAR`, `FOUNDATION_GATE_LESSONS`, `firstUncompletedInPillar`, and `completedInPillar`.

## 8. Existing lessons grouped by `pillar_id` / path if discoverable from code

Exact live lesson counts were not discoverable from repo files. Lessons are fetched from Supabase table `legacy_lessons_staging`, and this environment did not include `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

What is discoverable from code and screenshots:

- Career total in screenshots shows `103 / 127` and `114 / 127`, implying a live lesson pool of **127 fetched active lessons** for the screenshot device/account.
- `built-different` screenshot shows `7/8` in one account state and “World Cleared · Earned” in another, implying **8 live lessons** under `pillar_id = built-different`.
- `pressure-resilience` screenshot shows `3/6`, implying **6 live lessons** under `pillar_id = pressure-resilience`.
- `signal` screenshot shows `showcase-recruiting` locked with no active lesson count visible, consistent with a premium teaser and/or no active free lesson rows.

Because live Supabase data is external, the audit treats lesson counts as **runtime data**, not repo-static data.

## 9. Worlds visible in Career

Visible worlds are dynamic. Based on code, a world is visible if:

- It is in the active tab/chapter.
- It passes the role filter if the chapter is `your-craft`.
- It has matching lesson content, or it is the first no-content teaser in that chapter.
- It is a state-trigger world with matching content or matching athlete state.

Visible from screenshots:

- Edge: `built-different`, `pressure-resilience`, `competitive-identity` teaser.
- Signal: `showcase-recruiting` premium teaser.

Expected visible by role if matching lessons exist:

- Pitcher: foundation worlds with content, `pitcher-path`, `pitching-mindset`, `pitching-strategy`, `built-different`, `pressure-resilience`, The Grind pitcher/general worlds, Signal teaser.
- Catcher: foundation worlds with content, `hitter-path`, `hitting-approach`, `catcher-path`, `catcher-leadership`, Edge worlds with content, The Grind general worlds, Signal teaser.
- Infielder: foundation worlds with content, `hitter-path`, `hitting-approach`, `infield-path`, `infield-play-iq`, Edge worlds with content, The Grind general worlds, Signal teaser.
- Outfielder: foundation worlds with content, `hitter-path`, `hitting-approach`, `outfield-path`, `outfield-reads`, Edge worlds with content, The Grind general worlds, Signal teaser.

## 10. Worlds hidden/not surfaced

Hidden causes:

1. **No matching lessons and not first teaser:** Career only shows the first no-content teaser in each chapter; later no-content worlds are hidden.
2. **Role filter:** `your-craft` filters out worlds whose `roles` do not include `athlete.primary_role`.
3. **State trigger:** `slump-recovery` and `return-to-throw` can be hidden if they lack content and the athlete state is not `slump_reset` or `return_to_throw`.
4. **Signal first-teaser behavior:** Only the first Signal no-content premium world is visible as a teaser; later premium worlds are hidden.
5. **No Supabase env in repo:** Live exact hidden-by-content status could not be verified from code alone.

Configured worlds likely hidden in the supplied screenshots:

- Edge hidden after teaser: `pressure-proof`, `leadership-dugout`, `bounce-back-player`.
- Signal hidden after teaser: `coach-dynamics`, `what-the-pros-do`.
- Your Craft worlds not matching the current role are hidden.
- State-trigger worlds may be hidden unless state/content conditions are met.

## 11. Worlds referenced by lessons but missing from Career

Unable to verify live lesson rows because Supabase credentials are not present. Static code search did not reveal repo-local seed lesson data with additional `pillar_id` values outside the Career `WORLDS` list.

The main **potential** mismatch class is Supabase lessons whose `pillar_id` is not one of the 30 Career `WORLDS.id` values. Those lessons would still be eligible for Home routing if they match tags/order, but they would not activate a Career world card.

Recommended future check once Supabase is available:

```sql
select pillar_id, count(*)
from legacy_lessons_staging
where is_active = true
group by pillar_id
order by pillar_id;
```

Compare the output against the Career world IDs above.

## 12. Worlds shown in Career but with no matching lesson content

By design, Career shows exactly one no-content teaser per chapter after active worlds. In screenshots:

- `competitive-identity` appears as the first Edge no-content teaser.
- `showcase-recruiting` appears as the first Signal premium teaser.

All other no-content worlds in those chapters are hidden and do not awkwardly render as empty worlds.

## 13. Premium / Signal world behavior

Signal is implemented as a normal Career chapter with premium worlds:

- `showcase-recruiting`
- `coach-dynamics`
- `what-the-pros-do`

Premium world cards use `isPremium: true`. Teaser rendering shows a lock icon, a `SIGNAL` pill, and the hint `Unlock with Clutchr Pro`. The tab also displays a Signal banner: “Elite habits. Pro-level content. Coming with Clutchr Pro.”

Current behavior is safe for the product priority: Signal teases premium depth without flooding Career with all premium worlds.

## 14. Role filter behavior

Career role filtering applies only in the `your-craft` chapter:

- `pitcher-path`, `pitching-mindset`, and `pitching-strategy` require `pitcher`.
- `hitter-path` and `hitting-approach` are shown for `hitter`, `infielder`, `outfielder`, and `catcher`; however, `hitter` is not currently a selectable `PositionRole` in onboarding/context.
- `catcher-path` and `catcher-leadership` require `catcher`.
- `infield-path` and `infield-play-iq` require `infielder`.
- `outfield-path` and `outfield-reads` require `outfielder`.
- `baserunner-path` is currently in the `foundation` chapter with no role filter, so it is universal rather than role-filtered.

Findings:

- The product asks for hitter, baserunner, catcher, infield, and outfield systems. Code supports visible containers for those paths, but `hitter` and `baserunner` are not primary roles in the athlete model.
- `baserunner-path` is configured as Foundation, even though `docs/MASTER_EVOLUTIONS.md` lists it in Your Craft. This may be intentional to make baserunning universal, but it should be treated as a deliberate product decision.
- Hitter depth is currently shared across non-pitcher defensive roles instead of having a distinct hitter primary-role lane.

## 15. Routing behavior findings

- Home does not route by Career world lock state. It routes directly to a lesson selected by `pickNextLesson`.
- Career world activation is `pillar_id === world.id`.
- Lesson player loads by lesson `id`, independent of Career world visibility.
- Router comments describe emergency override, foundation gate, struggle injection, role path, universal fallback, and catch-all behavior, but implementation is currently tag-first and does not enforce that stack.
- The `ROLE_TO_PILLAR`, `STRUGGLE_TO_PILLAR`, `EMERGENCY_PHASE_TO_PILLAR`, and `FOUNDATION_GATE_LESSONS` constants are present but unused.
- `baserunner-path` is present in router reason copy but not reachable through `PositionRole`, because current primary roles are pitcher/catcher/infielder/outfielder.
- State-trigger UI worlds exist (`slump-recovery`, `return-to-throw`), but router emergency constants map those states to `pressure-resilience` and `built-different`, not the state-trigger world IDs.

## 16. P0 issues

1. **Supabase pillar audit required before expansion.** We need a live `pillar_id` count export from `legacy_lessons_staging` to prove which content exists and whether any lessons are stranded outside Career.
2. **Do not expose all 30 worlds.** The current first-teaser-per-chapter behavior is the correct anti-sprawl guardrail and should remain.
3. **Role depth needs content before more worlds.** `hitter-path`, `baserunner-path`, `catcher-path`, `infield-path`, and `outfield-path` should be deepened with sub-units/checkpoints/bosses before any 30–50 world atlas is surfaced.
4. **Router comments vs implementation mismatch.** The router has documented priority concepts that are not executed. This should be resolved intentionally in a later routing pass, not by a quick rewrite during this audit.

## 17. P1 issues

1. **Baserunner placement mismatch.** `baserunner-path` lives under Foundation in code but Your Craft in the master evolution doc. Recommendation: keep it visible as universal for now if it has lessons, but document it as a universal skill lane until a role model supports runner/hitter role branching.
2. **Hitter role mismatch.** Career includes `hitter` in roles, but onboarding/context do not allow `hitter` as `primary_role`. Hitter content is still reachable for catcher/infielder/outfielder.
3. **State-trigger mismatch.** `slump-recovery` and `return-to-throw` are Career worlds, but router emergency mappings target `pressure-resilience` and `built-different`. Future fix should decide whether state-trigger worlds become true interruption worlds or remain hidden sub-units inside broader worlds.
4. **No visible sub-unit grouping.** `unit_id` exists in lesson typing, but Career/Home do not group or route by sub-unit yet.
5. **Checkpoint visual inconsistency risk.** Existing audit notes Career may rely on dynamic `node_type === 'checkpoint'` for divider visuals while lesson completion uses `is_checkpoint`.

## 18. P2 / future expansion items

- Add a canonical world registry shared by Career, router reason copy, and content QA.
- Add a non-schema QA script that compares live Supabase `pillar_id` values to the registry.
- Add a lightweight content manifest export process for Supabase lesson inventory.
- Add hidden sub-unit metadata docs for each active role path.
- Add state-trigger interruption strategy for slump, return-to-throw, recovery/readiness, and postgame debrief.
- Add premium Signal rail strategy that keeps recruiting/coach/pro standards out of the main climb until useful.

## 19. Safe fixes made

No runtime visibility or routing behavior was changed in this pass. This was intentional:

- Supabase lesson inventory was not available locally.
- The current Career first-teaser behavior already prevents the “30 locked rectangles” problem.
- Changing router priority would be higher-risk than the requested safe audit/config pass.
- No schema, XP, paywall, progression, or route rewrites were made.

The only codebase change is this source-of-truth audit document.

## 20. Deferred items

Deferred until Supabase inventory and product signoff:

- Any migration of `baserunner-path` between Foundation and Your Craft.
- Adding `hitter` or `baserunner` as primary roles.
- Rewriting `lessonRouter.ts` to use the documented stack.
- Showing additional Signal worlds.
- Launching `pressure-proof`, `leadership-dugout`, `bounce-back-player`, `coach-dynamics`, or `what-the-pros-do` as visible Career worlds.
- Generating full lesson packs.
- Seeding Supabase.
- Changing database schema.

## 21. World Inventory Table

| World ID | Display Name | Chapter/Tab | Pillar ID | Visible? | Lesson Count Source | Role Tags | Status | Recommendation |
|---|---|---|---|---|---|---|---|---|
| `foundation` | Foundation | Foundation | `foundation` | Runtime active if lessons exist | Supabase `legacy_lessons_staging`; not local | all | active / needs-checkpoint / needs-boss | Keep core; deepen as universal entry gate. |
| `readiness-routines` | Readiness & Routines | Foundation | `readiness-routines` | Runtime active if lessons exist, otherwise teaser/hidden | Supabase; not local | all | needs-lessons / hidden possible | Merge/deepen as routine sub-units unless robust content exists. |
| `game-day-focus` | Game Day Focus | Foundation | `game-day-focus` | Runtime active if lessons exist | Supabase; not local | all | needs-lessons / hidden possible | Keep if tied to Game Mode; otherwise use as sub-unit. |
| `baseball-iq` | Baseball IQ | Foundation | `baseball-iq` | Runtime active if lessons exist | Supabase; not local | all | needs-lessons / hidden possible | Keep core only if scenario reps exist. |
| `slump-recovery` | Slump Recovery | Foundation | `slump-recovery` | Hidden unless content or matching state trigger | Supabase; not local | all | hidden / future-only | Prefer state-trigger interruption, not permanent visible world. |
| `return-to-throw` | Return to Throwing | Foundation | `return-to-throw` | Hidden unless content or matching state trigger | Supabase; not local | all | hidden / future-only | Keep state-triggered; do not launch as visible atlas item. |
| `pitcher-path` | Pitcher Path | Your Craft | `pitcher-path` | Pitcher only, active if lessons exist | Supabase; not local | pitcher | active / needs-checkpoint / needs-boss | Keep as pitcher core; deepen before adding specialty worlds. |
| `pitching-mindset` | Pitching Mindset | Your Craft | `pitching-mindset` | Pitcher only; active/teaser based on content | Supabase; not local | pitcher | merge-as-subunit | Merge into `pitcher-path` tempo/miss-response sub-units unless already deep. |
| `pitching-strategy` | Pitching Strategy | Your Craft | `pitching-strategy` | Pitcher only; active/teaser based on content | Supabase; not local | pitcher | merge-as-subunit | Merge into `pitcher-path` count leverage/sequencing. |
| `hitter-path` | Hitter Path | Your Craft | `hitter-path` | Non-pitcher roles, active if lessons exist | Supabase; not local | hitter, infielder, outfielder, catcher | active / needs-checkpoint / needs-boss | P0/P1 deepen pitch recognition and swing/take. |
| `hitting-approach` | Hitting Approach | Your Craft | `hitting-approach` | Non-pitcher roles; active/teaser based on content | Supabase; not local | hitter, infielder, outfielder, catcher | merge-as-subunit | Merge into `hitter-path` count leverage/damage window. |
| `catcher-path` | Catcher Path | Your Craft | `catcher-path` | Catcher only, active if lessons exist | Supabase; not local | catcher | active / needs-checkpoint / needs-boss | P1 deepen receiving, calling, mound calm, coverage command. |
| `catcher-leadership` | Catcher Leadership | Your Craft | `catcher-leadership` | Catcher only; active/teaser based on content | Supabase; not local | catcher | merge-as-subunit | Merge into `catcher-path` team chaos leadership. |
| `infield-path` | Infield Path | Your Craft | `infield-path` | Infielder only, active if lessons exist | Supabase; not local | infielder | active / needs-checkpoint / needs-boss | P1 deepen defensive IQ. |
| `infield-play-iq` | Infield Play IQ | Your Craft | `infield-play-iq` | Infielder only; active/teaser based on content | Supabase; not local | infielder | merge-as-subunit | Merge into `infield-path` PPP/internal clock/coverage. |
| `outfield-path` | Outfield Path | Your Craft | `outfield-path` | Outfielder only, active if lessons exist | Supabase; not local | outfielder | active / needs-checkpoint / needs-boss | P1 deepen first-step, route, relay/cut decisions. |
| `outfield-reads` | Outfield Reads & Routes | Your Craft | `outfield-reads` | Outfielder only; active/teaser based on content | Supabase; not local | outfielder | merge-as-subunit | Merge into `outfield-path` read/route sub-units. |
| `baserunner-path` | Baserunner Path | Foundation | `baserunner-path` | Universal Foundation runtime active/teaser | Supabase; not local | all | active / needs-checkpoint / needs-boss | P0/P1 deepen as universal skill lane; consider Your Craft placement later. |
| `built-different` | Built Different | Edge | `built-different` | Visible active in screenshots | Screenshot shows 8 lessons | all | active / completed possible | Keep Edge core; add checkpoint/boss only if not present. |
| `pressure-resilience` | Pressure & Resilience | Edge | `pressure-resilience` | Visible active in screenshots | Screenshot shows 6 lessons | all | active / needs-boss possible | Keep core pressure system; connect to checkpoints. |
| `competitive-identity` | Competitive Identity | Edge | `competitive-identity` | Visible teaser in screenshots | No active count shown | all | teaser / needs-lessons | Keep as teaser only; do not expand before role paths. |
| `pressure-proof` | Pressure Proof | Edge | `pressure-proof` | Hidden behind first Edge teaser unless content changes | Supabase; not local | all | future-only | Do not show; fold advanced pressure into `pressure-resilience`. |
| `leadership-dugout` | Leadership & Dugout | Edge | `leadership-dugout` | Hidden behind first Edge teaser unless content changes | Supabase; not local | all | future-only / merge-as-subunit | Keep future or merge into catcher/team standards. |
| `bounce-back-player` | Bounce Back Player | Edge | `bounce-back-player` | Hidden behind first Edge teaser unless content changes | Supabase; not local | all | merge-as-subunit | Merge into `pressure-resilience` or slump reset. |
| `arm-care-durability` | Arm Care & Durability | The Grind | `arm-care-durability` | Pitcher only active/teaser based on content | Supabase; not local | pitcher | needs-lessons / future-only | Keep pitcher-specific; avoid broad visible launch unless content is strong. |
| `strength-conditioning` | Strength & Conditioning | The Grind | `strength-conditioning` | Runtime active/teaser based on content | Supabase; not local | all | needs-lessons / future-only | Keep utility; do not overbuild before role paths. |
| `recovery-readiness` | Recovery & Readiness | The Grind | `recovery-readiness` | Runtime active/teaser based on content | Supabase; not local | all | needs-lessons / future-only | Use state-trigger/Locker/Game Mode utility, not big Career lane yet. |
| `showcase-recruiting` | Showcase & Recruiting | Signal | `showcase-recruiting` | Visible premium teaser in screenshot | No active count shown | all | premium / teaser | Keep Signal teaser; do not make core Career world yet. |
| `coach-dynamics` | Coach Dynamics | Signal | `coach-dynamics` | Hidden behind first Signal teaser unless content changes | Supabase; not local | all | premium / hidden | Keep Signal premium future. |
| `what-the-pros-do` | What the Pros Do | Signal | `what-the-pros-do` | Hidden behind first Signal teaser unless content changes | Supabase; not local | all | premium / hidden | Keep Signal premium future/Locker resource. |

## 22. Role Depth Priority Table

| Role Path | Current State | Biggest Gap | Best Existing Components | Next 3 Depth Moves | Priority |
|---|---|---|---|---|---|
| `hitter-path` | Configured and shown for non-pitcher roles when content exists; hitter primary role not selectable. | Pitch recognition/swing-take depth likely split across `hitter-path` and `hitting-approach`. | `StrikeZoneVisualizer`, `PitchCountBoard`, `SnapshotRead`, `TimingTrack`, `PressureReplay`, `ConfidenceSlider` | 1. Add/organize Damage Window sub-unit. 2. Add Swing/Take interactive rep + checkpoint. 3. Add Quality AB Boss. | P0/P1 |
| `baserunner-path` | Configured as universal Foundation world; router has reason copy but no primary role route. | Baserunning intelligence can become stranded if treated as broad Foundation instead of a clear climb. | `JumpRead`, `SnapshotRead`, `TimingTrack`, `PressureReplay`, `LeverageLadder`, `RoutineCardBuilder` | 1. Lead Architecture + Steal Window install/decision lessons. 2. Dirt-ball/first-to-third interactive reps. 3. Green-Light Boss. | P0/P1 |
| `catcher-path` | Configured for catchers, with `catcher-leadership` nearby as possible duplicate. | Leadership/game-calling depth likely needs integrated sub-units rather than separate visible worlds. | `PitchSequenceChess`, `FieldIQBoard`, `PressureReplay`, scenario choice steps, `RoutineCardBuilder`, `ConfidenceSlider` | 1. Receiving First + Pitch Calling. 2. Mound Visit Calm + Coverage Command checkpoint. 3. Team Chaos Boss. | P1 |
| `infield-path` | Configured for infielders, with `infield-play-iq` nearby as possible duplicate. | Defensive IQ should become sub-units inside one infield path. | `FieldIQBoard`, `ThrowDecisionBoard`, `SnapshotRead`, `PressureReplay`, `TimingTrack`, `LeverageLadder` | 1. PPP Scan + Internal Clock. 2. Throw Priority/Coverage Decisions rep. 3. Rapid Coverage Boss. | P1 |
| `outfield-path` | Configured for outfielders, with `outfield-reads` nearby as possible duplicate. | Reads/routes should deepen in one path, not become separate catalog cards. | `JumpRead`, `SnapshotRead`, `FieldIQBoard`, `ThrowDecisionBoard`, `PressureReplay`, `TimingTrack` | 1. Ready Every Pitch + First Step. 2. Depth/Route + Wall Ball rep. 3. Relay/Cut Fire Drill Boss. | P1 |

## 23. Recommended existing-world depth plan

### `hitter-path`

Focus:

- Pitch recognition
- Swing/take decisions
- Damage windows
- Count leverage
- Two-strike compete
- Approach plans

Recommended sub-units:

1. Damage Window
2. Swing/Take Engine
3. Count Leverage
4. Pitch Recognition
5. Two-Strike Compete
6. Quality AB Boss

MVP cadence per sub-unit:

1. Lesson
2. Lesson
3. Interactive Rep
4. Checkpoint
5. Boss

Default deeper cadence:

1. Install Lesson
2. Decision Lesson
3. Interactive Rep
4. Practice Day / Review Drill
5. Pressure Variation
6. Checkpoint
7. Advanced Applied Lesson
8. Boss

### `baserunner-path`

Focus:

- Lead architecture
- Steal window
- Dirt-ball reads
- First-to-third decisions
- Tag and score
- Thrown-out reset

Recommended sub-units:

1. Lead Architecture
2. Steal Window
3. Dirt-Ball Reads
4. First-to-Third Decisions
5. Tag and Score
6. Green-Light Boss

### `catcher-path`

Focus:

- Receiving/blocking basics if current content exists
- Game calling
- Mound visit calm
- Coverage command
- Pitcher trust
- Team chaos leadership

Recommended sub-units:

1. Receiving First
2. Pitch Calling
3. Mound Visit Calm
4. Coverage Command
5. Team Chaos Boss

### `infield-path`

Focus:

- Pre-pitch plan
- Internal clock
- Throw priority
- Bunt/coverage
- Double play/traffic
- Error reset

Recommended sub-units:

1. PPP Scan
2. Internal Clock
3. Throw Priority
4. Coverage Decisions
5. Error Reset
6. Rapid Coverage Boss

### `outfield-path`

Focus:

- First step
- Depth
- Route quality
- Wall ball
- Cutoff/relay
- Communication

Recommended sub-units:

1. Ready Every Pitch
2. First Step
3. Depth and Route
4. Wall Ball
5. Relay/Cut
6. Fire Drill Boss

## 24. Recommended launch-depth roadmap

Launch recommendation:

- Do **not** launch 30 visible worlds.
- Launch with **10–15 strong visible worlds maximum**, with hidden sub-unit depth and one premium Signal teaser.
- Prefer fewer worlds with real checkpoints/bosses over many thin worlds.

Recommended launch core:

1. `foundation`
2. `readiness-routines` or `game-day-focus` only if content is strong; otherwise merge as sub-units.
3. `baseball-iq` only if scenario-based reps exist.
4. `hitter-path`
5. `baserunner-path`
6. `catcher-path`
7. `infield-path`
8. `outfield-path`
9. `pitcher-path` if pitcher launch remains in scope.
10. `built-different`
11. `pressure-resilience`
12. `showcase-recruiting` as Signal premium teaser only.

Recommended hidden/internal:

- `hitting-approach` → `hitter-path` sub-units.
- `catcher-leadership` → `catcher-path` sub-units.
- `infield-play-iq` → `infield-path` sub-units.
- `outfield-reads` → `outfield-path` sub-units.
- `pitching-mindset` and `pitching-strategy` → `pitcher-path` sub-units.
- `bounce-back-player` → `pressure-resilience` or `slump-recovery` branch.
- `pressure-proof` → advanced pressure branch after `pressure-resilience` boss.

## 25. Recommended future 30–50 world atlas strategy

Long-term Clutchr can hold 30–50+ worlds internally without showing them all. Recommended model:

- 4 visible chapters max for ordinary athletes, with Signal as premium rail/teaser.
- One active world at a time.
- One teaser world at a time.
- Completed worlds collapsed and earned.
- Role-filtered mastery branches.
- Hidden internal sub-units for depth.
- Signal premium rail for recruiting/pro/coach systems.
- Locker-only content for resources, checklists, and reference material.
- Game Mode utility tools for in-game and pre/postgame behavior.
- State-triggered interruption worlds for slump, recovery, soreness, rough game, or return-to-throw.
- Future atlas items should enter one of these states: `show now`, `show as teaser`, `hide until role/progress`, `move to Signal premium`, `move to Locker/Resources`, `keep future-only`, `merge into existing world as sub-unit`, or `retire/rename`.

## 26. Do Not Expand Yet list

Do not launch these as visible Career worlds yet:

- Pure baseball history/culture.
- Recruiting deep systems outside Signal premium.
- Opponent Intel as a full operating system.
- Recovery/return-to-throw as a full visible path unless state-triggered.
- Parent/family worlds.
- Generic life/process worlds.
- Thin specialty topics better handled as sub-units.
- Worlds with no lesson content.
- Worlds with no routing logic.
- `pressure-proof` as a separate visible Edge world before `pressure-resilience` is deeper.
- `leadership-dugout` as a separate visible world before catcher/team leadership is organized.
- `coach-dynamics` and `what-the-pros-do` as ordinary Career worlds before Signal is monetization-ready.

## 27. QA checklist

After this audit-only pass, the app should still:

- Load Home.
- Load Career.
- Show existing worlds.
- Open active worlds.
- Launch lessons.
- Complete lessons.
- Show progress.
- Preserve premium/Signal behavior.
- Preserve Home next-rep behavior.
- Preserve Game Mode.
- Preserve Profile/Locker.

Expo Go QA checklist:

1. Open Home.
2. Confirm Home loads.
3. Open Career.
4. Confirm visible worlds still show.
5. Confirm no empty/stranded worlds appear awkwardly.
6. Confirm Signal/premium tab still behaves correctly.
7. Open active world.
8. Launch a lesson.
9. Complete a lesson.
10. Confirm completion/progress still works.
11. Confirm Game Mode still loads.
12. Confirm Locker/Profile still load.
13. Confirm no Home next-rep regression.
