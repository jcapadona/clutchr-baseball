# Clutchr Baseball — Lesson Step Registry v2

**Status:** Internal product/engineering reference  
**Last updated:** 2026-06-01  
**Scope:** app/lesson/[id].tsx + all lesson-step and ui_variant components  
**Purpose:** Schema truth, variety enforcement, AI content generation guide

---

## 1. Executive Summary

### Why this document exists

Clutchr lessons are delivered through a single player (`app/lesson/[id].tsx`) that renders step-by-step JSON from Supabase. As of Batch 05, the system has 769 lessons and is expanding. Four problems are accumulating:

**1. Schema drift.** Older batches used legacy field names (`notice`, `wonder` on notice_wonder steps). The renderer has been patched to handle both, but future batches writing to the wrong field shape will produce blank screens. Without a single source of truth, every content batch risks regression.

**2. Structural repetition.** Approximately 70% of current lessons follow the same skeleton: `spark → choice → cue` or `spark → notice_wonder → choice → cue`. Athletes notice. Lessons that feel identical regardless of subject erode the sense that each rep is distinct.

**3. Underused interactive surface.** Twelve ui_variant components exist (StrikeZoneVisualizer, PitchSequenceChess, LeverageLadder, etc.) and five premium lesson-step components (PressureClock, FilmRoom, HotRead, BuildYourRep, VisualizationRep). Most content batches only use the generic types. The interactive surface is effectively invisible to most athletes.

**4. No AI generation guardrails.** When Claude or another system generates SQL lesson content without a schema reference, it invents field names, leaves feedback empty, writes cue text that is six words long, or uses ui_variants that do not exist. The validation file catches some of this post-hoc. This registry is the pre-hoc fix.

### What this registry does

- Documents every supported step type and ui_variant with exact required fields
- Defines variety rules that future batches must follow
- Provides 20+ reusable step recipes to break repetitive structures
- Proposes three new components to build next, with exact schemas
- Creates a reusable generation checklist for future SQL batches
- Recommends validation SQL improvements

---

## 2. Current Supported Generic Step Types

These types are rendered inline by `app/lesson/[id].tsx`. No external component is imported.

---

### 2.1 `spark` / `text` / `action`

**Step router line:** `case 'spark': case 'text': case 'action':`  
**Rendered by:** `SparkStep`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"spark"`, `"text"`, or `"action"` |
| `headline` | string | no | If present with `body`, renders as bold heading above body |
| `body` | string | no | Primary content |
| `content` | string | no | Fallback alias for `body` |
| `text` | string | no | Fallback alias for `body` |
| `prompt` | string | no | Fallback alias for `body` |
| `message` | string | no | Fallback alias for `body` |
| `instructions` | string | no | Fallback alias for `body` |
| `action` | string | no | Fallback alias for `body`; also renders in separate action box |
| `cue` | string | no | Renders a CueBox below the body |

**Fallback chain (renderer v2):**  
`headline` + `body` → renders headline bold, body below  
`content ?? text ?? body ?? prompt ?? message ?? instructions ?? action`

**What breaks if data is missing:** If all content fields are empty, screen renders a blank SPARK header. Dev-only `console.warn` fires. Athlete sees empty card with "Got it →" button.

**Baseball-native example:**
```json
{
  "type": "spark",
  "headline": "Your eyes get there first",
  "body": "Every quality swing starts before the ball leaves the hand. Train your focus to the release point — not the plate."
}
```

**Best use cases:** Opening a lesson concept, delivering a key mental model, establishing the baseball frame before an interaction.

**Do:** Keep body under 80 words. One idea per spark. Use `headline` + `body` split when you have a pithy concept + explanation.  
**Don't:** Write a paragraph lecture. Don't use spark as the only step in a lesson. Don't repeat the same spark structure for 3 consecutive lessons.

---

### 2.2 `choice` / `scenario` / `scenario_pick` / `decision` / `freeze_frame`

**Step router line:** `case 'choice': case 'scenario': case 'scenario_pick': case 'decision': case 'freeze_frame':`  
**Rendered by:** `ChoiceStep`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | Any of the five aliases |
| `prompt` | string | no | Displayed above the options |
| `question` | string | no | Alias for `prompt` |
| `choices` | array | no | Options array (checked first) |
| `options` | array | no | Options array (fallback if no `choices`) |

**Option object shape:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Unique identifier: `"A"`, `"B"`, `"C"`, `"D"` |
| `text` | string | yes | Option label shown to athlete |
| `label` | string | no | Alias for `text` |
| `feedback` | string | yes | Explanation shown after selection |
| `correct` | boolean | no | Marks correct option |
| `is_correct` | boolean | no | Alias for `correct` |
| `quality` | string | no | `"correct"`, `"acceptable"`, `"wrong"` — overrides `correct` |
| `outcome` | string | no | Alias for `quality` |

**Quality resolution order:** `quality` → `outcome` → `status` → `correct`/`is_correct` → `correct_choice_id` → `correct_index`

**Empty choices fallback (renderer v2):** If both `choices` and `options` are empty arrays or missing, renders a "This rep needs an update." card with any available `prompt`/`question` text and a Continue button. Athlete is not trapped.

**What breaks if data is missing:**  
- Empty choices → fallback card (safe)  
- Missing `feedback` on an option → `choiceFallbackFeedback()` generates generic text (not ideal)  
- Missing `text`/`label` → blank button label  
- No correct option defined → no option turns green; athlete can still advance

**Baseball-native example:**
```json
{
  "type": "choice",
  "prompt": "2-1 count. You are hunting fastball outer third. Pitcher throws fastball inner half at the belt — in the zone, not your lane. What do you do?",
  "options": [
    {
      "id": "A",
      "text": "Swing — it is in the zone and a hitter count",
      "feedback": "Hitter count does not mean swing at everything in the zone. Your lane was outer third. Abandoning your plan produces weaker contact.",
      "correct": false
    },
    {
      "id": "B",
      "text": "Take — it missed your lane, go to 2-2",
      "feedback": "Correct. Your lane was outer third. He threw inner third. Take it, re-evaluate at 2-2. Lane discipline means you only attack the pitch you planned for.",
      "correct": true
    }
  ]
}
```

**Best use cases:** Swing/take decisions, situational decisions under pressure, pitch selection calls, in-game reads.

**Do:** Write 2–4 options. Give every option meaningful feedback that teaches. Make exactly one option correct unless the scenario genuinely supports two acceptable plays. Ground the prompt in a specific count, situation, and role.  
**Don't:** Write "Correct." or "Good job!" as feedback. Don't make wrong options obviously absurd. Don't use `freeze_frame` unless the scenario is a true freeze-frame game situation.

---

### 2.3 `checklist` / `quick_reset`

**Step router line:** `case 'checklist': case 'quick_reset':`  
**Rendered by:** `ChecklistStep`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"checklist"` or `"quick_reset"` |
| `prompt` | string | no | Header text shown above the list |
| `instructions` | string/array | no | Items array (checked first) |
| `items` | array | no | Items array (fallback) |
| `steps` | array | no | Items array (second fallback) |

**Item type:** each item is converted with `String()` — can be a plain string or an array of strings.

**What breaks if data is missing:** All items are empty → progress bar shows 0/0, "Done →" button appears immediately. Athlete can advance without checking anything.

**Baseball-native example:**
```json
{
  "type": "checklist",
  "prompt": "Two-Strike Adjustments",
  "items": [
    "Widen stance slightly for a more compact base",
    "Choke up one inch for better barrel control",
    "Expand coverage to the outer third",
    "Give up the pull side — use the whole field",
    "Stay short to the ball — no big load"
  ]
}
```

**Best use cases:** Pre-pitch routine execution, between-inning mental reset, multi-step situational prep, scouting checklist.

**Do:** 3–6 items. Each item should be short and physically actionable (under 12 words). Use `quick_reset` for mental reset scenarios.  
**Don't:** Make items vague ("Be confident"). Don't use checklist for more than one lesson per five in a world — it becomes a reading exercise if overused.

---

### 2.4 `cue`

**Step router line:** Falls through to `SparkStep` via the `default` branch — **wait, actually no.** `cue` is not explicitly named in the `StepRenderer` switch. It maps to the `default` branch which calls `SparkStep`. The cue type is rendered by `SparkStep`, which reads `step.cue` for the CueBox.

**Correction from code audit:** The `cue` step type is rendered by `SparkStep` via the default case. `SparkStep` renders `step.cue` inside a `CueBox` component. A proper cue step should have `type: "cue"`, `label`, and `text`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"cue"` |
| `label` | string | no | Shown above cue text in the CueBox (default: `"YOUR CUE"`) |
| `text` | string | yes | The cue text — MUST be ALL CAPS, ≤ 5 words |
| `cue` | string | no | Alias for `text` (picked up by SparkStep's `step.cue`) |

**Note:** Because `cue` falls through to SparkStep's default case, the `text` field is read by SparkStep as `step.cue`. For a standalone cue step, include both `text` and `cue` with the same value for maximum compatibility.

**What breaks if data is missing:** No cue text → CueBox renders empty string. Screen shows the CueBox frame with nothing inside.

**Baseball-native example:**
```json
{
  "type": "cue",
  "label": "YOUR CUE",
  "text": "EYES TO THE SLOT"
}
```

**Hard rules:**
- Every lesson MUST end with a `cue` step
- `text` MUST be ALL CAPS
- `text` MUST be 5 words or fewer
- `text` should be a physical, technical, or mental trigger — not a motivational phrase

**Do:** Make it a phrase the athlete can hear in their head during a game. "READ SPIN EARLY." "HUNT YOUR DAMAGE ZONE." "STAY BACK SCORES RUNS."  
**Don't:** Write inspirational quotes. Don't write full sentences. Don't exceed 5 words.

---

### 2.5 `visualization` / `reframe_builder` / `pressureRep`

**Step router line:** `case 'cue': case 'visualization': case 'reframe_builder': case 'pressureRep':`  
**Rendered by:** `VisualizationStep`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"visualization"`, `"reframe_builder"`, or `"pressureRep"` |
| `content` | string | no | Main visualization body text |
| `text` | string | no | Alias for `content` |
| `visualization` | string | no | Alias for `content` |
| `body` | string | no | Alias for `content` |
| `cue` | string | no | CueBox text shown below body |
| `focal_cue` | string | no | Alias for `cue` |
| `example_reframe` | string | no | Alias for `cue` |

**Visual identity:** Pulsing eye orb. Meditative. Used for mental rep execution, not reading.

**Baseball-native example:**
```json
{
  "type": "visualization",
  "content": "See yourself at 2-1. Locked to outer third. The pitcher throws outer third belt-high. You attack it cleanly — you were already committed. The ball jumps off the barrel to the right-center gap.",
  "cue": "LANE OR PASS"
}
```

**Best use cases:** End of a skill progression before the final cue, mental rehearsal of a correct rep, positive outcome anchoring. Works well as the second-to-last step in checkpoints and bosses.

**Do:** Write in second-person present tense ("See yourself..."). Include the correct outcome. Keep it under 60 words.  
**Don't:** Use as a reading step — it should be a mental action. Don't use more than once per lesson.

---

### 2.6 `timer` / `pressure_rep`

**Step router line:** `case 'timer': case 'pressure_rep':`  
**Rendered by:** `TimerStep`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"timer"` or `"pressure_rep"` |
| `timer_sec` | number | no | Duration (checked first) |
| `duration` | number | no | Duration alias (fallback) |
| `instructions` | string/array | no | Text shown to athlete during countdown |
| `simulation_description` | string | no | Alias for `instructions` |
| `action` | string | no | Alias for `instructions` |

**Important:** `pressure_rep` routes to `TimerStep`, NOT to `VisualizationStep`. If you want a timed countdown with an instruction, use `timer`. If you want a mental rep with no countdown, use `visualization`. The `scenario`, `task`, and `success_cue` fields from the recommended `pressure_rep` schema in Batch 05 specs are NOT rendered by `TimerStep` — use `instructions` for the display text.

**Corrected safe schema for `pressure_rep`:**
```json
{
  "type": "pressure_rep",
  "duration": 15,
  "instructions": "You are 2-2 against a 95 mph closer. Runner on second. Two outs. Get your cue. Get your plan. Step in."
}
```

**Baseball-native example (timer):**
```json
{
  "type": "timer",
  "duration": 10,
  "instructions": "Close your eyes. See the release point. Hold the arm slot in your mental picture. This is the window you are tracking."
}
```

**Best use cases:** Focus reset, mental preparation timer, visualization with a countdown, pressure-response training.

**Do:** Keep `duration` between 8–20 seconds for in-lesson use. Use `instructions` as the display text.  
**Don't:** Use as a substitute for `PressureClock` (which has actual choices under time pressure). Don't use for more than one step per lesson.

---

### 2.7 `reflection`

**Step router line:** `case 'reflection':`  
**Rendered by:** `ReflectionStep`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"reflection"` |
| `content` | string | no | Prompt text (checked first) |
| `text` | string | no | Alias for `content` |
| `prompt` | string | no | Alias for `content` |
| `reframe_prompt` | string | no | Alias for `content` |
| `example_reframe` | string | no | Secondary example text shown in a box |
| `placeholder` | string | no | Not rendered by current component — metadata only |

**What renders:** A bulb icon, the prompt text, and optionally an `example_reframe` box. No text input. This is a think-to-yourself prompt, not a text entry field.

**Baseball-native example:**
```json
{
  "type": "reflection",
  "prompt": "After a strikeout, what is the one question you ask yourself before moving on?",
  "example_reframe": "Was my read late? Did I pull off the pitch? Did I guess wrong on the count?"
}
```

**Best use cases:** Between-AB mindset resets, self-assessment after a mistake, personalizing a principle to the athlete's own game. Best paired with a concrete prompt (not a vague open question).

**Do:** Ask one specific question. Give an `example_reframe` as a concrete starting point.  
**Don't:** Use as therapy language ("How did that make you feel?"). Don't ask generic motivation questions. Don't use more than once per lesson.

---

### 2.8 `feedback` / `reward`

**Step router line:** `case 'feedback': case 'reward':`  
**Rendered by:** `FeedbackStep`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"feedback"` or `"reward"` |
| `content` | string | no | Main text |
| `text` | string | no | Alias for `content` |
| `message` | string | no | Alias for `content` |

**Visual identity:** Animated checkmark icon. Used for positive confirmation, mid-lesson reinforcement.

**Baseball-native example:**
```json
{
  "type": "feedback",
  "content": "That is the read. You identified the arm slot drop before the ball left his hand. That is a quarter-second you just bought yourself."
}
```

**Best use cases:** Mid-lesson positive reinforcement after a correct choice, post-drill feedback, bridging a decision back to the concept.

**Do:** Use after a `choice` step to reinforce the lesson before moving to the cue. Keep it one or two sentences.  
**Don't:** Use as a standalone motivational statement. Don't use "Great job!" or "Well done!" — always explain what specifically was correct.

---

### 2.9 `notice_wonder`

**Step router line:** `case 'notice_wonder':`  
**Rendered by:** `NoticeWonderStep`

#### Legacy schema (fully supported after renderer v2 patch):

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"notice_wonder"` |
| `notice` | string | yes* | Situation + what to notice. *Required in legacy mode |
| `wonder` | string | yes* | The wonder question/text. *Required in legacy mode |
| `reveal` | string | yes | The answer/reveal text |

#### Interactive schema (original, also supported):

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"notice_wonder"` |
| `situation` | string | no | Situation card text |
| `content` | string | no | Alias for `situation` |
| `body` | string | no | Alias for `situation` |
| `headline` | string | no | Alias for `situation` |
| `notice_items` | string[] | no | If present: chip-tap interface |
| `wonder_prompt` | string | no | Text above wonder options |
| `wonder_options` | object[] | no | `{ id, text }` — if present: radio button interface |
| `wonder_correct_id` | string | no | Marks the correct wonder option |
| `reveal` | string | yes | The payoff text |
| `reveal_cue` | string | no | CueBox text at the end |
| `cue` | string | no | Alias for `reveal_cue` |
| `takeaway_cue` | string | no | Alias for `reveal_cue` |

**Phase behavior:**
- **Notice phase:** If `notice_items` exists → chip-tap interface (must tap at least one chip to advance). If `notice_items` missing but `notice` string exists → shows notice text in card, "Wonder →" button, no tap required.
- **Wonder phase:** If `wonder_options` exists → radio button interface. If missing but `wonder` string exists → shows wonder text in card, "Reveal →" button, no tap required.
- **Reveal phase:** Always shows `step.reveal`. Cue reads from `reveal_cue ?? cue ?? takeaway_cue`.

**Situation resolution:** `step.situation ?? step.content ?? step.body ?? step.notice ?? step.headline`

**Baseball-native example (legacy schema — use for all new batches):**
```json
{
  "type": "notice_wonder",
  "notice": "1-0 count. Fastball pitcher. He has thrown two fastballs away to the previous batter. His arm slot is three-quarters. He sets at the stretch.",
  "wonder": "Where should your eyes be focused as he begins his delivery?",
  "reveal": "Park your eyes at the release point — where his hand comes out over his front hip. Track arm slot and wrist angle, then pick up the ball. That early read adds a fraction of a second to your decision window."
}
```

**Best use cases:** Situational reads, pre-pitch processing, film study moments, anything requiring the athlete to observe → predict → learn sequence.

**Do:** Use a specific game scenario with a count, runner state, or situation. Make the `reveal` teach the baseball truth behind the scenario.  
**Don't:** Write abstract conceptual content in the notice. Don't skip the `reveal` — it is required. Don't use `notice_wonder` more than twice in a single lesson.

---

## 3. Premium Lesson-Step Components

These are imported separately into `app/lesson/[id].tsx` from `components/lesson-steps/`. They receive `step` directly and have their own `onComplete` callback.

---

### 3.1 `pressure_clock`

**Component:** `PressureClock`  
**Step router:** `case 'pressure_clock': return <PressureClock step={step} onComplete={(r) => onAdvance(r.correct)} />`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"pressure_clock"` |
| `title` | string | no | Header text |
| `prompt` | string | no | Situation text above the timer |
| `body` | string | no | Alias for `prompt` |
| `seconds` | number | no | Countdown duration (default: 15) |
| `choices` | array | yes | Choice objects: `{ id, text, correct? }` |
| `coach_feedback` | object | no | `{ correct?: string, incorrect?: string }` |

**Behavior:** Countdown ring depletes in real time. Athlete must pick a choice before time expires. Haptics intensify in last 3 seconds. On expire → result screen with expired state. On choice → result screen.

**Result:** `{ correct: boolean, choiceId: string|null, expired: boolean }`

**Baseball-native example:**
```json
{
  "type": "pressure_clock",
  "prompt": "Runner breaks for second. Ground ball to you at short. You have 0.8 seconds to decide. Where do you throw?",
  "seconds": 8,
  "choices": [
    { "id": "A", "text": "Second base", "correct": true },
    { "id": "B", "text": "First base", "correct": false },
    { "id": "C", "text": "Hold the ball", "correct": false }
  ],
  "coach_feedback": {
    "correct": "Right call. The runner was going — you cut him down at second.",
    "incorrect": "The runner beat you. Second was the play from the start."
  }
}
```

**Best use cases:** Throw decisions under time pressure, quick in-game reads, two-out mental decisions, any scenario where the athlete should feel urgency.

**Risk level:** Safe — well-tested  
**Do:** Keep `seconds` between 6–15. Use 2–3 choices, not 4. The shorter the clock, the simpler the choice must be.  
**Don't:** Use with 4 choices and a 5-second clock. Don't use `feedback` on choice objects here (component uses `coach_feedback`).

---

### 3.2 `film_room`

**Component:** `FilmRoom`  
**Step router:** `case 'film_room': return <FilmRoom step={step} onComplete={(r) => onAdvance(r.correct)} />`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"film_room"` |
| `title` | string | no | Header text |
| `prompt` | string | no | Scene description during study phase |
| `body` | string | no | Alias for `prompt` |
| `study_seconds` | number | no | Study phase duration (default: 6) |
| `question` | string | no | Question shown after study phase fades |
| `choices` | array | yes | Choice objects: `{ id, text, correct? }` |
| `scene_tags` | string[] | no | Runner tags: `"runner_1"`, `"runner_2"`, `"runner_3"`, `"runners_12"`, `"runners_23"` — drives diamond visualization |
| `coach_feedback` | object | no | `{ correct?: string, incorrect?: string }` |

**Behavior:** Study phase → SVG diamond scene + prompt text visible for `study_seconds`. Scene fades to near-invisible. Question appears. Athlete picks a choice. Scene fades back in for the reveal.

**Result:** `{ correct: boolean, choiceId: string|null }`

**Baseball-native example:**
```json
{
  "type": "film_room",
  "prompt": "Runner on second. One out. Ground ball hit sharply to third. Third baseman fields it cleanly. Study the base situation.",
  "study_seconds": 5,
  "question": "Where does the third baseman throw?",
  "scene_tags": ["runner_2"],
  "choices": [
    { "id": "A", "text": "First base", "correct": true },
    { "id": "B", "text": "Second base", "correct": false },
    { "id": "C", "text": "Home plate", "correct": false }
  ],
  "coach_feedback": {
    "correct": "First base is the out. The runner at second holds on a sharply fielded ground ball — he cannot score on a routine play.",
    "incorrect": "With a runner on second and one out on a sharp ground ball, take the guaranteed out at first."
  }
}
```

**Best use cases:** Situational baserunning decisions, fielding reads, throw-priority scenarios. Any situation where studying the diamond state before deciding is part of the learning.

**Risk level:** Safe  
**Do:** Use `scene_tags` whenever runners are part of the decision. Keep `study_seconds` at 4–8.  
**Don't:** Use without `coach_feedback` — the reveal phase will be empty. Don't confuse with `FieldIQBoard` ui_variant — FilmRoom is a diamond study + question; FieldIQBoard is a live tap-the-diamond interaction.

---

### 3.3 `hot_read`

**Component:** `HotRead`  
**Step router:** `case 'hot_read': return <HotRead step={step} onComplete={() => onAdvance(true)} />`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"hot_read"` |
| `title` | string | no | Header label |
| `prompt` | string | no | Instruction text above cards |
| `left_label` | string | no | Global left swipe label (default: `"No"`) |
| `right_label` | string | no | Global right swipe label (default: `"Yes"`) |
| `cards` | array | yes | Array of HotReadCard objects |

**HotReadCard shape:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Unique card identifier |
| `prompt` | string | yes | Scenario text shown on card |
| `answer` | string | yes | `"left"` or `"right"` — correct swipe direction |
| `left_label` | string | no | Overrides global left label for this card |
| `right_label` | string | no | Overrides global right label for this card |
| `feedback` | string | no | Brief text shown after swipe |

**Behavior:** Card swipe interface (PanResponder). Swipe right = right answer, swipe left = left answer. Cards advance one by one. Score summary shown at the end. Always calls `onComplete()` regardless of score.

**Baseball-native example:**
```json
{
  "type": "hot_read",
  "prompt": "Swipe YES to steal, NO to hold.",
  "left_label": "Hold",
  "right_label": "Steal",
  "cards": [
    {
      "id": "c1",
      "prompt": "Runner on first. Lefty pitcher. Slow delivery at 1.6 seconds. Count is 1-2.",
      "answer": "left",
      "feedback": "1-2 count is not a green-light count. Hold and see the next pitch."
    },
    {
      "id": "c2",
      "prompt": "Runner on first. Right-hander. Delivery time 1.2 seconds. Count is 2-0.",
      "answer": "right",
      "feedback": "1.2 seconds delivery plus a 2-0 count on the batter — ideal steal situation."
    },
    {
      "id": "c3",
      "prompt": "Runner on first. Right-hander. Delivery 1.4 seconds. Catcher arm is weak. 0-1 count.",
      "answer": "right",
      "feedback": "Weak arm plus 1.4 delivery. The risk-reward favors going."
    }
  ]
}
```

**Best use cases:** Rapid yes/no reads — steal situations, swing/take decisions in sequence, bunt or swing calls, first-step reads for outfielders.

**Risk level:** Safe  
**Do:** Use 3–6 cards. Binary yes/no decisions only. Include `feedback` on every card.  
**Don't:** Use for decisions with more than two valid answers. Don't use without `feedback` — the swipe result is silent without it.

---

### 3.4 `build_your_rep`

**Component:** `BuildYourRep`  
**Step router:** `case 'build_your_rep': return <BuildYourRep step={step} onComplete={() => onAdvance(true)} />`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"build_your_rep"` |
| `title` | string | no | Header title |
| `prompt` | string | no | Shown below title |
| `instructions` | string | no | Alias for `prompt` |
| `body` | string | no | Alias for `prompt` |
| `available_items` | array | yes* | Items to choose from (*or use `items`) |
| `items` | array | no | Alias for `available_items` |
| `save_to_profile_key` | string | no | If set, saves selection to athlete profile |
| `min_selections` | number | no | Minimum required selections (default: 1) |
| `max_selections` | number | no | Maximum allowed (default: all items) |

**RepItem shape:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Unique identifier |
| `label` | string | yes | Display name |
| `description` | string | no | Secondary text |
| `category` | string | no | Groups items under a header |

**Behavior:** Tap items to add to sequence strip at top. Tap in sequence strip to remove. Grouped by `category` if provided. Save button calls `updateAthleteState` if `save_to_profile_key` is set.

**Baseball-native example:**
```json
{
  "type": "build_your_rep",
  "title": "Build Your Pre-At-Bat Routine",
  "prompt": "Pick 3 to 5 elements that will be your routine before every at-bat.",
  "min_selections": 3,
  "max_selections": 5,
  "save_to_profile_key": "pre_ab_routine",
  "available_items": [
    { "id": "breath", "label": "Deep breath out", "category": "Reset" },
    { "id": "look_hands", "label": "Look at your hands", "category": "Reset" },
    { "id": "hunt_lane", "label": "Set your hunt lane", "category": "Plan" },
    { "id": "zone_floor", "label": "Set your zone floor", "category": "Plan" },
    { "id": "verbal_cue", "label": "Say your cue word", "category": "Commit" },
    { "id": "step_in", "label": "Step in on your terms", "category": "Commit" }
  ]
}
```

**Best use cases:** Personalizing a pre-pitch routine, building a mental reset sequence, post-K protocol, pre-inning preparation.

**Risk level:** Safe  
**Do:** Use `save_to_profile_key` for lessons that should persist the athlete's choice to their profile.  
**Don't:** Use for decisions with a single correct answer — that is a `choice` step. BuildYourRep is for personalization, not quizzing.

---

### 3.5 `visualization_rep`

**Component:** `VisualizationRep`  
**Step router:** `case 'visualization_rep': return <VisualizationRep step={step} onComplete={() => onAdvance(true)} />`

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `"visualization_rep"` |
| `title` | string | no | Header text |
| `prompt` | string | no | Description shown in scene phase |
| `scene_text` | string | no | The visualization narrative (word-by-word reveal) |
| `cue_words` | string[] | no | 3–5 one-word cues athlete picks from at the end |
| `breath_seconds` | number | no | Not used (breath cycle is fixed at 4-2-4) |
| `save_cue_to` | string | no | Profile key to save the chosen cue word |

**Phases:**
1. `breath` — 4s inhale, 2s hold, 4s exhale. Animated circle. Advance button after one cycle.
2. `scene` — `scene_text` revealed word by word with timed intervals. Athlete watches.
3. `commitment` — Shows `cue_words` as chips. Athlete taps one to lock in their cue. Saves to `save_cue_to` if set.

**Baseball-native example:**
```json
{
  "type": "visualization_rep",
  "title": "Post-K Reset Rep",
  "scene_text": "The strikeout is done. You name the one thing to fix. You let it go. You carry your cue into the next at-bat. Ready.",
  "cue_words": ["RESET", "NEXT", "STAY", "FLUSH", "NOW"]
}
```

**Best use cases:** Mental reset after a mistake, visualization before a pressure at-bat, pre-game centering, post-inning decompression.

**Risk level:** Safe  
**Do:** Keep `scene_text` under 40 words — it reveals word by word. Use `cue_words` so the athlete ends with a self-chosen physical anchor.  
**Don't:** Use without `cue_words` — the commitment phase will have nothing to tap. Don't use for situational learning — this is for mental state, not baseball decisions.

---

## 4. UI Variant Components

These are rendered by `VariantRenderer` inside `app/lesson/[id].tsx`. They receive `{ data, responses, feedback, onComplete }` from `step.data`, `step.responses`, `step.feedback`.

All ui_variant steps have this outer shape:
```json
{
  "type": "any_generic_type",
  "ui_variant": "variant_key_here",
  "data": { ... },
  "responses": { ... },
  "feedback": { ... }
}
```

---

### 4.1 `strike_zone_visualizer`

**Component:** `StrikeZoneVisualizer`  
**Risk level:** Safe

**data shape:**
```json
{
  "prompt": "Where do you hunt in a 2-0 count against a fastball pitcher?",
  "instruction": "Tap your damage lane.",
  "mode": "hunt_zone",
  "zone_layout": "9_box",
  "context": { "count": "2-0", "batter_hand": "right" }
}
```

**Mode `hunt_zone`:** 3×3 zone grid. Athlete taps a zone. Evaluated against `correct_zones` and `acceptable_zones`.  
**Mode `swing_take`:** 3×3 + 4 edge zones. Athlete decides swing or take per zone.

**responses shape:**
```json
{
  "correct_zones": ["mid_in", "middle"],
  "acceptable_zones": ["up_in"],
  "wrong_zones": ["down_away", "middle_away"]
}
```

**Valid zone IDs:** `up_in`, `up_mid`, `up_away`, `mid_in`, `middle`, `middle_away`, `down_in`, `down_mid`, `down_away`  
**Edge zone IDs:** `up_edge`, `down_away_edge`, `down_in_edge`, `away_edge`  
**Zone aliases:** `away→middle_away`, `mid_away→middle_away`, `in→mid_in`, `up→up_mid`, `down→down_mid`

**feedback shape:**
```json
{
  "correct": "Belt-high inner half in a 2-0 count is your damage zone. That is the swing.",
  "acceptable": "You can work with that location, but inner half belt-high produces more damage.",
  "wrong": "That zone is where pitchers hide from you. Stay in your damage window."
}
```

**Best use case:** Pitch recognition, hunt zone selection, damage zone identification.  
**Notes for SQL generation:** Zone IDs must exactly match the list above. Use zone aliases cautiously — they work but add confusion.

---

### 4.2 `pitch_sequence_chess`

**Component:** `PitchSequenceChess`  
**Risk level:** Moderate (requires specific pitch and target ID strings)

**data shape:**
```json
{
  "prompt": "Pitcher ahead 1-2. Runner on first. Right-handed hitter. What is your next pitch?",
  "mode": "choose_next_pitch",
  "pitch_options": ["4_seam", "slider", "changeup"],
  "target_options": ["down_away", "back_foot", "waste_up"],
  "previous_pitches": [
    { "pitch": "4_seam", "location": "middle_in", "result": "foul" },
    { "pitch": "4_seam", "location": "up_away", "result": "strike_looking" }
  ],
  "context": { "count": "1-2", "outs": 1, "runners": "runner_1" }
}
```

**Valid pitch IDs:** `4_seam`, `2_seam`, `slider`, `changeup`, `curveball`, `cutter`, `sinker`, `splitter`  
**Valid target IDs:** `down_away`, `waste_up`, `back_foot`, `middle`, `glove_side_knee`, `middle_down`, `middle_in`, `up_away`

**responses shape:**
```json
{
  "best_combo": { "pitch": "slider", "target": "down_away" },
  "acceptable_combos": [
    { "pitch": "changeup", "target": "down_away" }
  ]
}
```

**feedback shape:** `{ correct, acceptable?, wrong }`

**Best use case:** Pitcher sequencing, catcher pitch-calling, two-strike out pitch selection.  
**Notes for SQL generation:** Pitch and target IDs must be from the exact valid lists. `mode` must be `"choose_next_pitch"` or `"catcher_call"`.

---

### 4.3 `field_iq_board`

**Component:** `FieldIQBoard`  
**Risk level:** Safe

**data shape:**
```json
{
  "prompt": "Ground ball to you in right-center. Runner on second, one out. Where do you throw?",
  "instruction": "Tap your throw.",
  "mode": "throw_priority",
  "context": { "outs": 1, "runners": "runner_2", "inning": "6th" }
}
```

**Mode `throw_priority`:** Base targets only (home, 1B, 2B, 3B, cutoff_home, cutoff_2B).  
**Mode `defensive_alignment`:** Base targets + action targets (charge_bunt, hold_and_read, cover_3B, drift_back, 1B_if_no_play).

**responses shape:**
```json
{
  "correct_target": "cutoff_home",
  "acceptable_targets": ["home"],
  "wrong_targets": ["2B", "1B"]
}
```

**Valid target IDs:** `home`, `1B`, `2B`, `3B`, `cutoff_home`, `cutoff_2B`, `charge_bunt`, `hold_and_read`, `cover_3B`, `drift_back`, `1B_if_no_play`

**feedback shape:** `{ correct, acceptable?, wrong }`

**Best use case:** Outfield throw decisions, infield priority reads, cutoff/relay calls.  
**Notes for SQL generation:** `mode` must be `"throw_priority"` or `"defensive_alignment"`. Target IDs must match exactly.

---

### 4.4 `throw_decision_board`

**Component:** `ThrowDecisionBoard`  
**Risk level:** Safe

**data shape:**
```json
{
  "prompt": "Catcher pops up. Third strike, passed ball. Two outs, runner on first.",
  "inning": "7th",
  "outs": 2,
  "score_state": "tied",
  "runners": "Runner on first",
  "ball_location": "Rolled toward backstop",
  "role": "catcher",
  "targets": [
    { "id": "1B", "label": "First Base", "short_label": "1B", "quality": "correct", "feedback": "Two outs, routine strikeout. First base is the play." },
    { "id": "2B", "label": "Second Base", "short_label": "2B", "quality": "poor", "feedback": "Runner on first has to run on a passed ball — this is a force at first, not second." },
    { "id": "hold", "label": "Hold the ball", "short_label": "Hold", "quality": "poor", "feedback": "You have time to throw. Take the out." }
  ]
}
```

**responses shape:** `{ correct_id: "1B", acceptable_ids?: [] }`  
**feedback shape:** `{ correct, acceptable, poor }`

**Best use case:** Catcher decisions, infield play reads, multi-out situational throws.  
**Notes for SQL generation:** `role` drives display context. `targets` array is fully custom. `quality` on each target must be `"correct"`, `"acceptable"`, or `"poor"`.

---

### 4.5 `leverage_ladder`

**Component:** `LeverageLadder`  
**Risk level:** Moderate (requires tap-to-rank UX understanding)

**data shape:**
```json
{
  "prompt": "Rank these at-bat priorities from most to least important in a two-out, RISP situation.",
  "situation": "Runner on second. Two outs. Down one run.",
  "instruction": "Tap an item then tap a slot to rank it.",
  "items": [
    { "id": "contact", "label": "Make contact — any contact" },
    { "id": "drive_zone", "label": "Attack a pitch in your zone" },
    { "id": "hero_swing", "label": "Swing for extra bases" },
    { "id": "deep_count", "label": "Work a deep count" }
  ]
}
```

**responses shape:**
```json
{
  "correct_order": ["drive_zone", "contact", "deep_count", "hero_swing"],
  "feedback_by_rank": {
    "drive_zone": "Your zone is your weapon. Attack a pitch you can do damage with.",
    "hero_swing": "Hero swings produce strikeouts in RISP situations. It is last priority."
  }
}
```

**feedback shape:** `{ correct, acceptable, poor }`

**Scoring:** Compares submitted rank order to `correct_order`. Exact match or close match → correct/acceptable. Poor match → poor.

**Best use case:** Prioritization decisions (pitch selection hierarchy, situational hitting priority, defensive positioning priority).  
**Notes for SQL generation:** `items` must have 3–5 items. `correct_order` must contain all item IDs.

---

### 4.6 `routine_card_builder`

**Component:** `RoutineCardBuilder`  
**Risk level:** Safe

**data shape:**
```json
{
  "prompt": "Build your between-inning reset routine.",
  "instruction": "Pick 3 to 4 blocks.",
  "mode": "pre_inning",
  "min_select": 3,
  "max_select": 4,
  "save_key": "inning_reset_routine",
  "blocks": [
    { "id": "breath", "label": "3-count exhale", "category": "breath", "benefit": "Slows down your nervous system" },
    { "id": "body_check", "label": "Shake out your hands", "category": "body", "benefit": "Releases grip tension" },
    { "id": "plan", "label": "Set your hunt lane", "category": "plan", "benefit": "Enters the AB with intent" },
    { "id": "cue_word", "label": "Say your cue word", "category": "cue", "benefit": "Locks the rep" }
  ]
}
```

**Valid category values:** `breath`, `vision`, `body`, `plan`, `cue`, `movement`

**responses shape:** `{ require_save?: boolean }`  
**feedback shape:** `{ success, failure? }`

**Best use case:** Routine personalization, between-inning resets, pre-game mental prep.  
**Notes for SQL generation:** `blocks` must have `category` from the valid list for correct color/icon rendering.

---

### 4.7 `pressure_replay`

**Component:** `PressureReplay`  
**Risk level:** Moderate (multi-beat scenario requires careful content design)

**data shape:**
```json
{
  "prompt": "Championship inning. Three pressure decisions. Make the right read.",
  "mode": "scenario_sequence",
  "timer_sec": 0,
  "beats": [
    {
      "id": "b1",
      "scene": "Two outs, bases loaded. Ground ball hit to you at second base.",
      "choices": [
        { "id": "A", "label": "Step on second — force out", "score": 2 },
        { "id": "B", "label": "Throw to first", "score": 1 },
        { "id": "C", "label": "Throw home", "score": 0 }
      ],
      "best_choice": "A"
    },
    {
      "id": "b2",
      "scene": "You stepped on second. Runner from third was running — he scores. Your team is now tied. Runner on first.",
      "choices": [
        { "id": "A", "label": "Call time and reset mentally", "score": 2 },
        { "id": "B", "label": "Rush back to your position", "score": 1 },
        { "id": "C", "label": "Argue with the umpire", "score": 0 }
      ],
      "best_choice": "A"
    }
  ]
}
```

**responses shape:** `{ pass_score: 3, max_score: 4 }`  
**feedback shape:** `{ success, failure }`

**Best use case:** Multi-decision pressure scenarios, sequential game situations, boss-level challenges.  
**Notes for SQL generation:** Use 2–4 beats. `pass_score` should be less than `max_score` to allow near-perfect passes. `score` values must add up to `max_score` on the best path.

---

### 4.8 `snapshot_read`

**Component:** `SnapshotRead`  
**Risk level:** Moderate

**data shape:**
```json
{
  "prompt": "Study the pitcher delivery.",
  "situation": "Right-handed pitcher, three-quarters slot, 1-1 count.",
  "cue_description": "Watch the arm slot as it comes through.",
  "diagram_mode": "pitcher_delivery",
  "cues": [
    { "id": "high_slot", "label": "High arm slot", "quality": "poor", "feedback": "High slot typically means fastball — but check the wrist." },
    { "id": "low_slot", "label": "Dropped arm slot", "quality": "correct", "feedback": "Dropped slot at release is an offspeed tell. Sit and read." },
    { "id": "wrist_turn", "label": "Early wrist turn", "quality": "correct", "feedback": "Early wrist turn combined with dropped slot confirms offspeed." }
  ],
  "question": "What cue tells you offspeed is coming?"
}
```

**Valid diagram_mode values:** `pitcher_delivery`, `hand_break`, `release_point`, `batter_stance`

**responses shape:** `{ correct_id: "low_slot", acceptable_ids?: ["wrist_turn"] }`  
**feedback shape:** `{ correct, acceptable, poor }`

**Best use case:** Pitcher delivery reads, release point recognition, arm slot identification.  
**Notes for SQL generation:** `cues` must have 3–4 items. Only one `correct` quality per scenario unless genuinely two correct answers exist. `diagram_mode` must be from the valid list.

---

### 4.9 `jump_read`

**Component:** `JumpRead`  
**Risk level:** Safe

**data shape:**
```json
{
  "prompt": "Make the read.",
  "scenario": "Line drive hit to right-center. Ball is carrying. You are tracking from center field. Your first step is back.",
  "cue": "Ball is above the outfield fence height and still rising.",
  "options": [
    { "id": "back", "label": "Continue going back", "quality": "correct", "feedback": "Ball above fence height still rising — keep going back." },
    { "id": "hold", "label": "Stop and read", "quality": "acceptable", "feedback": "Slowing down on a ball carrying above fence height costs you range." },
    { "id": "in", "label": "Come in", "quality": "poor", "feedback": "Coming in on a ball carrying above fence height is the wrong first step." }
  ]
}
```

**responses shape:** `{ correct_id: "back", acceptable_ids?: ["hold"] }`  
**feedback shape:** `{ correct, acceptable, poor }`

**Best use case:** Outfield jump reads, first-step decisions, baserunner break reads.  
**Notes for SQL generation:** `options` must have 3–4 items. Each option must have `quality` from `"correct"`, `"acceptable"`, `"poor"`.

---

### 4.10 `timing_track`

**Component:** `TimingTrack`  
**Risk level:** Moderate (timing-sensitive — requires calibrated `duration_ms` and windows)

**data shape:**
```json
{
  "prompt": "Sync your trigger to the pitch rhythm.",
  "instruction": "Tap when the ring reaches full size.",
  "reps": 5,
  "duration_ms": 1800,
  "perfect_window_ms": 220,
  "early_window_ms": 400
}
```

**responses shape:** `{ pass_perfect: 3 }`  
**feedback shape:** `{ synced: "...", rushing: "..." }`

**Behavior:** Ring pulses from small to full. Athlete taps when ring is at maximum. Results classified as `PERFECT`, `EARLY`, or `LATE`. Pass requires `pass_perfect` or more perfect taps.

**Best use case:** Timing drills, load timing practice, rhythm training.  
**Notes for SQL generation:** Use `duration_ms: 1800` as the standard rep pace. `perfect_window_ms: 220` is the validated sweet spot. Don't make `reps` more than 6.

---

### 4.11 `confidence_slider`

**Component:** `ConfidenceSlider`  
**Risk level:** Safe (always passes)

**data shape:**
```json
{
  "prompt": "Rate your composure level heading into this at-bat.",
  "metric": "composure",
  "scale": 10,
  "low_label": "Not there yet",
  "high_label": "Locked in"
}
```

**Valid metric values:** `confidence`, `focus`, `composure`, `readiness`, `energy`

**responses shape:**
```json
{
  "zones": {
    "low": [1, 2, 3],
    "medium": [4, 5, 6],
    "high": [7, 8, 9],
    "peak": [10]
  },
  "healthy_range": [6, 9]
}
```

**feedback shape:** `{ low?, medium?, high?, peak?, coaching_note? }`

**Behavior:** Vertical drag slider. Always calls `onComplete(true)`. Self-assessment only — no failure state.

**Best use case:** Pre-lesson check-in, mental state audit, between-rep self-evaluation.  
**Notes for SQL generation:** Define all four zones. Include `coaching_note` for universal follow-on text.

---

### 4.12 `pitch_count_board`

**Component:** `PitchCountBoard`  
**Risk level:** Moderate

**data shape:**
```json
{
  "prompt": "Build a quality at-bat against this starter.",
  "sub_prompt": "Track what you see. Make him work.",
  "perspective": "hitter",
  "max_pitches": 6,
  "show_pitch_type": false,
  "context": { "outs": 1, "runners": "runner_2", "inning": "5th", "score": "tied" }
}
```

**Valid perspective values:** `"pitcher"`, `"hitter"`  
**Valid PitchResult values:** `strike_looking`, `strike_swinging`, `foul`, `ball`, `in_play_out`, `in_play_hit`, `hit_by_pitch`

**responses shape:**
```json
{
  "competitive_ab": true,
  "two_strike_battle": true,
  "ideal_sequence": ["ball", "strike_looking", "foul", "ball", "in_play_hit"]
}
```

**feedback shape:** `{ excellent, good, poor, coaching? }`

**Best use case:** Hitter at-bat simulation, pitcher sequence building, count management training.  
**Notes for SQL generation:** Use `perspective: "hitter"` for hitter worlds, `"pitcher"` for pitcher worlds. `max_pitches` should be 3–7.

---

## 5. Interaction Taxonomy

### 5.1 Read / Prime
**Types:** `spark`, `text`, `action`  
**What the athlete does:** Reads text. Passive consumption.  
**When to use:** Opening a concept, setting context before an interaction.  
**Frequency:** 1 per lesson — never more than 1 consecutive read step.  
**Roles:** Universal.  
**Overuse warning:** More than 25% of steps across a world being read-only erodes the rep feel. Lessons that are spark → cue with nothing in between are not reps — they are flash cards.

### 5.2 Choose / Decide
**Types:** `choice`, `scenario`, `decision`, `freeze_frame`, `scenario_pick`  
**Premium:** `pressure_clock`, `film_room`  
**What the athlete does:** Reads a scenario, selects one option, receives feedback.  
**When to use:** Swing/take decisions, situational reads, pitch selection, throw priority.  
**Frequency:** 1–2 per lesson. Maximum 40% of steps in a world.  
**Roles:** All roles — most universal interactive type.  
**Overuse warning:** Back-to-back choice steps without a primer or reflection between them feel mechanical.

### 5.3 Tap / Map / Visual Read
**Types:** ui_variants — `strike_zone_visualizer`, `field_iq_board`, `throw_decision_board`, `snapshot_read`, `jump_read`  
**What the athlete does:** Taps a zone, location, or option on a visual diagram.  
**When to use:** Spatial reads — where to throw, where to hunt, what to see.  
**Frequency:** Target 20–30% of interactive steps in a world once content is built.  
**Roles:** Role-specific — use `throw_decision_board` for catchers/infielders, `field_iq_board` for outfielders/all, `strike_zone_visualizer` for hitters.  
**Overuse warning:** Using the same visualizer in 3 consecutive lessons dulls the spatial challenge.

### 5.4 Drag / Order / Build
**Types:** ui_variants — `leverage_ladder`, `routine_card_builder`, `pitch_sequence_chess`  
**Premium:** `build_your_rep`  
**What the athlete does:** Drags items into order, selects blocks to build a routine, selects pitch + target combos.  
**When to use:** Prioritization, routine building, sequencing decisions.  
**Frequency:** 1–2 per world maximum in current content (these are heavyweight interactions).  
**Roles:** `leverage_ladder` — all roles. `routine_card_builder` — all roles. `pitch_sequence_chess` — pitchers, catchers.

### 5.5 Swipe
**Types:** `hot_read`  
**What the athlete does:** Swipes cards left or right to make rapid binary decisions.  
**When to use:** Yes/no read training, quick steal reads, bunt-or-swing reads, first-step reads.  
**Frequency:** 1 per world — it's a distinct format.  
**Roles:** Baserunners, outfielders, catchers calling steals.

### 5.6 Time / Pressure
**Types:** `timer`, `pressure_rep`  
**Premium:** `pressure_clock`, `timing_track`  
**What the athlete does:** Timed decision under countdown pressure, or tap-to-sync timing drill.  
**When to use:** Any scenario where time constraint changes the difficulty.  
**Frequency:** 1 per lesson, 3–4 per world. Bosses and checkpoints are natural homes.  
**Roles:** Universal — but `timing_track` specifically for hitters and pitchers.

### 5.7 Reflect / Reset
**Types:** `reflection`, `notice_wonder`, `visualization`, `visualization_rep`  
**What the athlete does:** Thinks through a question, processes a scenario, visualizes an outcome.  
**When to use:** After a mistake or concept, personalizing a principle, mental rehearsal.  
**Frequency:** 1 per lesson. Maximum 15% of all steps in a world.  
**Roles:** Universal.

### 5.8 Build / Personalize
**Types:** `checklist`  
**Premium:** `build_your_rep`, `routine_card_builder`  
**What the athlete does:** Checks off items, builds a personal sequence, saves to profile.  
**When to use:** Establishing personal routines, pre-pitch checklists, post-K protocols.  
**Frequency:** 2–3 per world for checklist; 1–2 per world for build/routine.  
**Roles:** Universal.

### 5.9 Reward / Complete
**Types:** `feedback`, `reward`, `cue`  
**What the athlete does:** Receives confirmation, locks in a cue.  
**When to use:** Every lesson ends with `cue`. Use `feedback` once in the lesson body if reinforcement is needed.

---

## 6. Step Variety Rules for Future Batches

These are hard rules. No exceptions without explicit justification.

### 6.1 Per-Lesson Rules
- Every lesson has 3–6 steps.
- Every lesson must have at least **2 active athlete actions** (a step that requires a tap, swipe, selection, or build — not passive reading).
- Every lesson ends with a `cue` step.
- Cue text must be ALL CAPS and 5 words or fewer.
- `cue` text must be a technical or mental trigger, not motivation.

### 6.2 Per-World Rules (15-lesson world)
- Maximum **25% reading-only steps** (spark/text/action/visualization/feedback with no interaction). In a world of 60 total steps, that is 15 maximum.
- Minimum **30% interactive steps** (choice, hot_read, pressure_clock, any ui_variant, build_your_rep, notice_wonder). Target 40%.
- No 3 consecutive lessons may share the exact same step structure.
- No more than 2 lessons per world may start with `spark → notice_wonder`.
- No more than 2 lessons per world may start with `spark → choice`.
- Checkpoints (lesson 5, lesson 10) must include at least one premium or ui_variant step.
- Boss (lesson 15) must include at least two choice steps or one multi-beat component (PressureReplay, or two choices).

### 6.3 Content Quality Rules
- No placeholder copy.
- No generic motivation ("Believe in yourself", "You've got this").
- No therapy language ("How did that make you feel?").
- No classroom language ("Pop quiz!", "Test yourself").
- Every choice must have 2–4 options.
- Every choice option must include `feedback`.
- `feedback` text must explain baseball reasoning, not just say correct/incorrect.
- Every `notice_wonder` must include `notice`, `wonder`, and `reveal` (legacy schema) OR the full interactive schema.
- All `role_tags` must be lowercase.
- No unsupported `step.type` values.
- No unsupported `ui_variant` values.

---

## 7. Step Recipes

These are proven or recommended step sequences for future batches. Each recipe solves a specific structural problem.

---

**Recipe 01 — The Read and React**
- Sequence: `notice_wonder → choice → cue`
- Use: Quick in-game situation read with a decision
- Example: Runner on third one out → notice the setup → decide to sac fly vs job swing → cue
- Best roles: Hitters, all positions
- Why it creates variety: The notice_wonder primes the read before the choice fires

---

**Recipe 02 — The Film Study**
- Sequence: `spark → film_room → cue`
- Use: Situational fielding read — study the diamond then decide
- Example: Runner on second, ground ball → study scene → throw to first → cue
- Best roles: Infielders, catchers, outfielders
- Why it creates variety: Visual diamond + timer replaces a text-heavy setup

---

**Recipe 03 — The Pressure Burst**
- Sequence: `spark → pressure_clock → feedback → cue`
- Use: Time-pressure decision with reinforcement
- Example: Short-hop ball, throw decision under 8 seconds
- Best roles: Catchers, infielders
- Why it creates variety: Introduces urgency the standard choice step lacks

---

**Recipe 04 — The Zone Hunter**
- Sequence: `spark → strike_zone_visualizer → cue`
- Use: Damage zone or pitch location selection
- Example: 2-0 count — tap your hunt zone → get feedback on zone quality → cue
- Best roles: Hitters
- Why it creates variety: Spatial tap replaces a text-based choice

---

**Recipe 05 — The Swipe Deck**
- Sequence: `spark → hot_read → reflection → cue`
- Use: Rapid-fire binary read drill followed by self-assessment
- Example: Steal or hold — 4 cards — then reflect on which read was hardest
- Best roles: Baserunners, outfielders, catchers
- Why it creates variety: Swipe mechanic plus reflection creates a full learning loop

---

**Recipe 06 — The Routine Lock**
- Sequence: `spark → build_your_rep → checklist → cue`
- Use: Building then executing a personal routine
- Example: Build your pre-pitch routine → execute the checklist → lock your cue
- Best roles: All
- Why it creates variety: Personalization + execution creates athlete ownership

---

**Recipe 07 — The Sequence Call**
- Sequence: `spark → pitch_sequence_chess → cue`
- Use: Pitcher-catcher sequencing decision
- Example: 1-2 count, right-handed hitter — pick pitch + target for the out pitch
- Best roles: Pitchers, catchers
- Why it creates variety: Two-axis selection (pitch type + location) is distinct from single-choice

---

**Recipe 08 — The Ladder Priority**
- Sequence: `notice_wonder → leverage_ladder → cue`
- Use: Prioritization in a specific game situation
- Example: Runner on second two outs — rank your at-bat priorities
- Best roles: Hitters, all
- Why it creates variety: Ranking replaces pick-one binary

---

**Recipe 09 — The Film + Clock**
- Sequence: `film_room → pressure_clock → cue`
- Use: Study a game state then make a time-pressured decision
- Example: Diamond state with bases loaded, one out → 6-second clock to throw decision
- Best roles: Catchers, infielders
- Why it creates variety: Two-phase intensity — study then pressure

---

**Recipe 10 — The Mental Rep**
- Sequence: `spark → visualization_rep → cue`
- Use: Breath → scene → cue word commitment for a mental rep
- Example: Post-K reset — breathe, see the flush, pick your cue word
- Best roles: All
- Why it creates variety: No baseball decision — pure mental state management

---

**Recipe 11 — The Pitcher's Eye**
- Sequence: `snapshot_read → choice → cue`
- Use: Read a pitcher delivery cue, then decide what pitch is coming
- Example: Dropped arm slot → decide FB or offspeed → cue
- Best roles: Hitters
- Why it creates variety: Visual reading step before a decision creates a cleaner learning chain

---

**Recipe 12 — The Timing Drill**
- Sequence: `spark → timing_track → reflection → cue`
- Use: Load timing drill with self-assessment
- Example: Train your trigger timing → rate your sync → cue
- Best roles: Hitters, pitchers
- Why it creates variety: Active motor timing replaces text interaction

---

**Recipe 13 — The Quick Reset**
- Sequence: `notice_wonder → quick_reset → cue`
- Use: Error or mistake → identify → execute reset checklist
- Example: You pulled off an away pitch → notice what happened → reset protocol checklist
- Best roles: All
- Why it creates variety: Action checklist after a notice creates process discipline

---

**Recipe 14 — The Three-Beat Boss**
- Sequence: `spark → notice_wonder → choice → choice → visualization → cue`
- Use: Boss lesson — two decisions with a visualization payoff
- Example: Three-AB simulation — first AB pattern read → second AB attack → visualization of success → cue
- Best roles: All
- Why it creates variety: Double-choice with a visualization bridge mimics a real game arc

---

**Recipe 15 — The Confidence Audit**
- Sequence: `spark → confidence_slider → reflection → cue`
- Use: Opening a mental lesson with a self-assessment
- Example: Pre-game composure check → slider read → reflection on what raises the number → cue
- Best roles: All
- Why it creates variety: Self-measurement as the active step before reflection

---

**Recipe 16 — The Outfield Decision**
- Sequence: `spark → jump_read → field_iq_board → cue`
- Use: Jump read first step → then throw decision
- Example: Fly ball read going back → decide how to play the wall → throw to cut-off → cue
- Best roles: Outfielders
- Why it creates variety: Two visual decision steps — different spatial axes

---

**Recipe 17 — The Pitch Count Builder**
- Sequence: `spark → pitch_count_board → feedback → cue`
- Use: Build a full at-bat sequence against a starter
- Example: Hitter perspective, runner on second, max 6 pitches — stay competitive → cue
- Best roles: Hitters, pitchers
- Why it creates variety: Multi-pitch sequence building instead of single-pitch choice

---

**Recipe 18 — The Scouting Debrief**
- Sequence: `notice_wonder → hot_read → cue`
- Use: Observe pitcher pattern → rapid swipe decisions based on intel
- Example: Notice pitcher tendencies → swipe yes/no on 4 pitch calls → lock cue
- Best roles: Hitters, baserunners
- Why it creates variety: Transitions directly from observation to rapid decision without a text bridge

---

**Recipe 19 — The Routine Builder Checkpoint**
- Sequence: `spark → routine_card_builder → checklist → visualization → cue`
- Use: Checkpoint lesson — build a routine, execute it, visualize the result
- Example: Build your inning-start reset → check it off → see yourself executing it → cue
- Best roles: All
- Why it creates variety: Three different interaction types in one lesson

---

**Recipe 20 — The Mistake and Adjust**
- Sequence: `spark → reflection → choice → cue`
- Use: Own the mistake, identify the fix, execute the correct rep
- Example: You just chased low breaking balls twice → reflect → pick the adjustment → cue
- Best roles: All
- Why it creates variety: Reflection-first flips the standard spark-first structure

---

## 8. New Component Recommendations

### Priority Build 1: `one_word_lock`

**Purpose:** Athlete reads a scenario and types or selects a single word that represents their mental cue, approach, or call. Replaces passive reflection steps with an active, minimal text entry.

**Athlete action:** Tap one word from a provided word bank (4–8 options), or type a single word into a text input (single word validation only).

**Exact JSON schema:**
```json
{
  "type": "one_word_lock",
  "prompt": "What is the one word you carry into this at-bat?",
  "scenario": "You are 0-2 against a power closer. Bases loaded. Tie game.",
  "word_bank": ["COMPETE", "SURVIVE", "ZONE", "STAY", "LOAD", "NEXT"],
  "allow_custom": false,
  "save_to": "current_ab_cue",
  "cue": "LOCK ONE WORD"
}
```

**App behavior:**
- Show scenario text
- Render word bank as tap chips (if `word_bank` provided)
- If `allow_custom: true`, also show a single-word text input
- On tap/submit, animate the selected word large on screen
- If `save_to` is set, save to athlete state
- Always passes — no wrong answer

**Success state:** Word animates to large centered display. "Locked in →" button appears.

**Failure/fallback:** If `word_bank` is empty and `allow_custom` is false, show all default cue words from the athlete's profile, or a generic set.

**Validation rules:**
- `word_bank` should have 4–8 items
- Each word should be 1–3 syllables (short enough to say in a moment)
- If `allow_custom: true`, validate input is a single word on submit

**Best roles:** All  
**Example lessons it improves:** HSP_013 (Post-K Reset), LOM_014 (Pressure Leadoff AB), any visualization_rep lesson that currently only asks which cue word to pick from 5 options but doesn't let the athlete write their own

**Implementation complexity:** Low — 1–2 days. Tap-chip interface already exists in other components. Only new part is optional single-word text input.

**Why build this first:** The `reflection` step currently has no tap interaction — athletes just read a question and think. One-word lock gives the athlete an active gesture tied to mental commitment. It is the cheapest upgrade to lesson interactivity.

---

### Priority Build 2: `diamond_cursor`

**Purpose:** Athlete drags a cursor across a bird's-eye diamond diagram to place a fielder, runner, or ball location. More fine-grained than tapping a base — positions anything on the field.

**Athlete action:** Drag a pin or cursor to the correct field location.

**Exact JSON schema:**
```json
{
  "type": "diamond_cursor",
  "prompt": "Shade to the correct defensive shift position.",
  "scenario": "Left-handed power hitter. Shift alignment. Where does the second baseman play?",
  "mode": "place_fielder",
  "cursor_label": "2B",
  "correct_zone": "right_center_shift",
  "acceptable_zones": ["first_base_side"],
  "wrong_zones": ["normal_position", "left_side"],
  "zones": [
    { "id": "right_center_shift", "label": "Shift — Right of second", "x_range": [0.6, 0.85], "y_range": [0.4, 0.65] },
    { "id": "normal_position", "label": "Normal 2B position", "x_range": [0.55, 0.7], "y_range": [0.5, 0.7] },
    { "id": "first_base_side", "label": "Between 1B and 2B", "x_range": [0.7, 0.9], "y_range": [0.55, 0.75] }
  ],
  "feedback": {
    "correct": "Shifted right of second — correct alignment for a left-handed pull hitter.",
    "acceptable": "Between first and second is a partial shift. Full shift puts you further right.",
    "wrong": "Normal position leaves the right side open for a pull hitter. Shift over."
  }
}
```

**App behavior:**
- Render SVG bird's-eye diamond
- Draggable pin labeled with `cursor_label`
- Evaluate drop zone against `correct_zone`, `acceptable_zones`, `wrong_zones`
- Show feedback after release

**Success state:** Pin stays in placed zone. Correct/acceptable shows green/amber highlight.  
**Failure/fallback:** If no zones matched, default to nearest zone. Always provide feedback.

**Best roles:** Infielders, outfielders, catchers, coaches  
**Example lessons it improves:** Any FieldIQ scenario that currently uses a tap-the-base interface but needs finer positioning — shift alignments, outfield positioning, cutoff positioning.

**Implementation complexity:** Medium — 3–5 days. SVG diamond exists in FilmRoom. PanResponder drag exists in HotRead. Combining them is the main work.

**Why build this second:** Shift alignment and fine field positioning are impossible with the current tap-a-base components. This unlocks an entire category of defensive IQ content that has no current equivalent.

---

### Priority Build 3: `drag_sequence`

**Purpose:** Athlete drags 3–5 items into a correct order. More tactile than LeverageLadder's tap-then-slot mechanic — direct drag-and-drop.

**Athlete action:** Hold and drag an item to its correct position in a numbered sequence.

**Exact JSON schema:**
```json
{
  "type": "drag_sequence",
  "prompt": "Put these pitch-planning steps in order.",
  "scenario": "You are stepping into a 2-2 count against a closer. What is your mental sequence?",
  "items": [
    { "id": "step_out", "label": "Step out and reset" },
    { "id": "recall_pattern", "label": "Recall his out pitch" },
    { "id": "set_zone", "label": "Set your protection zone" },
    { "id": "verbal_cue", "label": "Say your cue word" },
    { "id": "step_in", "label": "Step in ready" }
  ],
  "correct_order": ["step_out", "recall_pattern", "set_zone", "verbal_cue", "step_in"],
  "tolerance": 1,
  "feedback": {
    "correct": "That sequence is a two-strike routine. You are always doing the same thing in the same order.",
    "acceptable": "Close. One step out of place — the core routine is right.",
    "poor": "Sequence matters. Recall the pattern before you set the zone — not after."
  }
}
```

**`tolerance`:** How many items can be out of position and still count as acceptable (default: 1).

**App behavior:**
- Render items as draggable cards in a vertical list
- Numbered slots on the right (or inline reorder)
- Long-press to lift, drag to reorder
- On submit, compare order to `correct_order` within `tolerance`
- Show feedback with correct order highlighted

**Success state:** Items lock into place with correct/acceptable/poor color coding.  
**Failure/fallback:** If athlete taps submit before reordering, evaluate starting order. Never trap.

**Best roles:** All — especially for routine sequencing, pre-pitch protocols, pitch sequencing decisions  
**Example lessons it improves:** HSP_004 (Release Window Lock checklist → drag sequence), LOM_002 (On-Deck Scout checklist → drag sequence), RBI_005 (Get The Run In checklist → drag sequence)

**Implementation complexity:** Medium — 3–5 days. React Native drag-and-drop requires either `react-native-reanimated` with gesture handling, or a tap-to-slot approach similar to LeverageLadder. The distinction from LeverageLadder is direct drag vs. tap-select-tap-place.

**Why build this third:** Checklists are the most-used step type that has no real interaction. Converting checklist steps to drag_sequence gives the same content a physical ordering action that teaches sequence, not just content.

---

### Future Premium Components (later — not in next sprint)

These are documented for future planning only. Do not build until Priority 1–3 are shipped, validated, and have content.

| Component | Purpose | Complexity | Unlock |
|---|---|---|---|
| `pitch_flight_occlusion` | Ball disappears mid-flight, athlete must predict landing zone | High | Hitter pitch recognition — next level |
| `at_bat_simulator` | Full 7-pitch simulated AB with pitch selection + decision per pitch | Very High | Flagship hitter rep |
| `runner_path_simulator` | Drag runner path on base paths, evaluate route | High | Baserunning intelligence |
| `coverage_call_board` | Tap defensive players to assign coverage zones | High | Defensive alignment |
| `body_language_meter` | Slider-based energy/body-language self-rating with visual | Medium | Mental health/readiness check-ins |
| `dugout_intel_recall` | Flash intel cards from previous ABs, test recall | Medium | Pattern recognition advanced |
| `route_read_simulator` | Outfielder taps where to route — animated ball path feedback | High | Jump read extension |
| `throw_clock_decision` | Combined throw decision + timing pressure | Medium | Catchers, infielders |

---

## 9. Batch Generation Rules

This section is the copy-pasteable checklist Claude uses before writing any future SQL batch.

### Mandatory content shape per lesson

```
REQUIRED FIELDS:
  id                   gen_random_uuid()
  legacy_lesson_id     Prefix_NNN format (e.g. HSP_001)
  pillar_id            Must match unit_id
  unit_id              Must match pillar_id
  title                String, max 50 chars
  subtitle             String, max 100 chars
  difficulty_tier      'beginner' | 'intermediate' | 'advanced'
  duration_sec         90–180 normal, 180–240 boss
  xp_reward            20–25 normal, 30 checkpoint, 40 boss
  order_index          1–15 within world
  is_checkpoint        true on order_index 5 and 10
  is_boss              true on order_index 15
  steps                Valid JSONB array, 3–6 steps
  sport_scope          'baseball'
  role_tags            Lowercase text array
  skill_tags           Text array
  is_active            true
```

### Step distribution targets per 15-lesson world

| Category | Target minimum | Notes |
|---|---|---|
| Active interaction steps (choice, hot_read, ui_variant, pressure_clock, etc.) | ≥ 30% of all steps | Aim for 40% |
| Read-only steps (spark, visualization, feedback) | ≤ 25% of all steps | |
| Reflect/reset steps (reflection, notice_wonder) | ≤ 15% of all steps | |
| Steps with saved data (build_your_rep, routine_card_builder, visualization_rep with save_cue_to) | ≥ 1 per world | |
| Lessons using ui_variant or premium step | ≥ 4 of 15 | Checkpoints + bosses minimum |

### Accepted step types (safe)
`spark`, `text`, `action`, `choice`, `scenario`, `scenario_pick`, `decision`, `freeze_frame`, `checklist`, `quick_reset`, `cue`, `visualization`, `reframe_builder`, `pressureRep`, `pressure_rep`, `timer`, `reflection`, `feedback`, `reward`, `notice_wonder`

### Accepted step types (premium — use for checkpoints and bosses)
`pressure_clock`, `film_room`, `hot_read`, `build_your_rep`, `visualization_rep`

### Accepted ui_variants (confirmed in components/)
`strike_zone_visualizer`, `pitch_sequence_chess`, `field_iq_board`, `throw_decision_board`, `leverage_ladder`, `routine_card_builder`, `pressure_replay`, `snapshot_read`, `jump_read`, `timing_track`, `confidence_slider`, `pitch_count_board`

### New component types (add to accepted list after build)
- After Priority Build 1: `one_word_lock`
- After Priority Build 2: `diamond_cursor` (ui_variant)
- After Priority Build 3: `drag_sequence`

### Forbidden structures
- Three consecutive lessons with identical step sequences
- Any lesson with only `spark → cue` (2 steps, zero interaction)
- Any `choice` step with fewer than 2 options
- Any `choice` option without `feedback`
- Any `cue` step with text longer than 5 words
- Any `cue` step with non-ALL-CAPS text
- Any `notice_wonder` without `reveal`
- Any step using `ui_variant` not in the accepted list
- Any `role_tags` value with uppercase letters
- `pillar_id` ≠ `unit_id` (for standard worlds)
- Generic motivational text in any step

### Examples of bad repetitive structures (do not use across a world)
```
Lesson 1: spark → choice → cue
Lesson 2: spark → choice → cue
Lesson 3: spark → choice → cue
Lesson 4: spark → notice_wonder → choice → cue
Lesson 5: spark → notice_wonder → choice → cue  ← checkpoint should have premium step
```

### Examples of better varied structures
```
Lesson 1: spark → notice_wonder → checklist → cue
Lesson 2: spark → notice_wonder → choice → cue
Lesson 3: spark → choice → reflection → cue
Lesson 4: spark → timer → checklist → cue
Lesson 5 (checkpoint): spark → notice_wonder → choice → visualization → cue
Lesson 6: spark → [strike_zone_visualizer] → cue
Lesson 7: spark → notice_wonder → choice → cue
Lesson 8: spark → choice → reflection → cue
Lesson 9: hot_read (4 cards) → reflection → cue
Lesson 10 (checkpoint): spark → film_room → pressure_clock → cue
Lesson 11: spark → checklist → notice_wonder → cue
Lesson 12: spark → choice → reflection → cue
Lesson 13: spark → notice_wonder → choice → cue
Lesson 14: spark → notice_wonder → [confidence_slider] → cue
Lesson 15 (boss): spark → notice_wonder → choice → choice → visualization → cue
```

---

## 10. Validation Upgrade Plan

### Current validation gaps (CLUTCHR_BATCH_05_VALIDATION.sql)

The current file covers: count, duplicates, active flag, step count 3–6, step type check, ui_variant check, empty choices, missing option feedback, notice_wonder fields, cue check, role_tag casing, pillar/unit mismatch, checkpoint/boss placement.

### Recommended additions for V2 validation

**Check 14 — Structural repetition within a world**
```sql
-- Flag worlds where more than 3 consecutive lessons share identical
-- step type sequences (serialized as a string for comparison)
```

**Check 15 — Minimum 2 active actions per lesson**
```sql
-- Count steps with type IN ('choice','scenario','hot_read','checklist',
-- 'notice_wonder','pressure_clock','film_room','build_your_rep',
-- 'visualization_rep') or ui_variant IS NOT NULL.
-- Flag any lesson where active_step_count < 2.
```

**Check 16 — Text-heavy lesson detection**
```sql
-- Flag lessons where more than 50% of steps are read-only:
-- type IN ('spark','text','action','feedback','reward','visualization')
-- and ui_variant IS NULL
```

**Check 17 — Step type distribution by world**
```sql
-- Aggregate step types by pillar_id, report:
-- total steps, % interactive, % read-only, % reflect
-- Flag worlds where interactive % < 30 or read-only % > 25
```

**Check 18 — Checkpoints without premium/ui_variant**
```sql
-- Flag checkpoint or boss lessons (is_checkpoint=true or is_boss=true)
-- that have zero premium step types and zero ui_variant steps
```

**Check 19 — Choice option quality**
```sql
-- For each choice step: verify at least one option has correct=true (or quality='correct')
-- Flag lessons where no correct answer is defined
```

**Check 20 — notice_wonder reveal quality**
```sql
-- Flag notice_wonder steps where reveal length < 50 characters
-- (indicates a stub or placeholder reveal)
```

**Check 21 — Empty spark/text content**
```sql
-- For steps with type IN ('spark','text','action','visualization','feedback'):
-- flag if all content fallback fields are NULL or empty string
```

**Check 22 — Timer duration sanity**
```sql
-- Flag timer/pressure_rep steps where duration > 120
-- (timers over 2 minutes in a lesson step are probably a data error)
```

**Check 23 — Cue step not final**
```sql
-- Flag any lesson where a 'cue' step type appears anywhere
-- OTHER than the last position in the steps array
-- (cue steps mid-lesson are usually a content error)
```

**Updated summary query** should output all 23 checks with PASS/FAIL.

---

## 11. Build Order and Recommendations

### What to do next — in exact order

**Step 1 — Commit this registry**  
`git add product/lesson-step-registry-v2.md && git commit -m "Add Lesson Step Registry v2"`

**Step 2 — Build `one_word_lock`**  
File: `components/lesson-steps/OneWordLock.tsx`  
Time: 1–2 days  
Add to StepRenderer switch:  
`case 'one_word_lock': return <OneWordLock step={step} onComplete={() => onAdvance(true)} />`  
Update validation accepted types list.

**Step 3 — Build `diamond_cursor`**  
File: `components/DiamondCursor.tsx`  
Time: 3–5 days  
Add to VariantRenderer switch:  
`case 'diamond_cursor': return <DiamondCursor key={variantKey} {...props} />`  
Confirm zone coordinate system matches FilmRoom SVG layout before writing any content.

**Step 4 — Build `drag_sequence`**  
File: `components/lesson-steps/DragSequence.tsx`  
Time: 3–5 days  
Decision: Use tap-to-slot approach (same as LeverageLadder) rather than native drag-drop for reliability on both iOS and Android. Name it `drag_sequence` in the step schema for future upgrade path.  
Add to StepRenderer switch:  
`case 'drag_sequence': return <DragSequence step={step} onComplete={() => onAdvance(true)} />`

**Step 5 — Update CLUTCHR_BATCH_05_VALIDATION.sql → CLUTCHR_VALIDATION_V2.sql**  
Add checks 14–23 from Section 9.  
Include new accepted step types.

**Step 6 — Generate Batch 06 using this registry**  
Before writing any SQL, verify:
- [ ] Registry is committed
- [ ] New step types are in the accepted list (or explicitly not used)
- [ ] Batch follows step distribution targets
- [ ] No 3 consecutive lessons with same structure
- [ ] Checkpoints have premium or ui_variant steps
- [ ] Bosses have 2+ choice steps or a multi-beat component

### Priority ordering rationale

`one_word_lock` first because it costs 1–2 days and immediately upgrades every reflection step in every existing world. It is the highest ROI component in the backlog.

`diamond_cursor` second because it unlocks defensive IQ content — shift alignments, cutoff positioning — that has no current equivalent. One new content batch with diamond_cursor adds more genuine variety than rewriting 20 existing lessons.

`drag_sequence` third because it gives checklists an action. Checklists are the most-used passive step. Converting them to drag_sequence across Batches 06–08 reduces read-only percentage across the entire curriculum.

The premium components listed in Section 8's future table (pitch_flight_occlusion, at_bat_simulator, etc.) are not in this sprint. They require 2–4 weeks each and need design validation before content can be written against them.

---

*Document maintained by: jcapadona | Clutchr Baseball Engineering*  
*Next review: After Priority Build 3 ships*
