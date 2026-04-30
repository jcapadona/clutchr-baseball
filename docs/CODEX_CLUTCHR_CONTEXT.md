# Clutchr Baseball — Codex Project Context

## 1. Product identity

Clutchr Baseball is a baseball-first career-path operating system for player development.

It blends:
- mental performance
- routines
- pressure skills
- baseball IQ
- mechanics cues
- recovery habits
- role-specific player development
- game-day tools
- progression/reward systems

Clutchr is NOT:
- a generic sports psychology app
- a meditation/wellness app
- a static course library
- a quiz engine
- a content browsing app
- a pitching-only app
- a childish gamification app

The app should feel like:

“This knows what baseball player I am, what state I’m in, and what I should do next.”

## 2. Core product principles

- Baseball-first
- Role-aware
- State-aware
- Season-aware
- Short-session
- Premium tone
- One clear next action
- Progress should feel earned
- Lessons should feel like playable reps, not lectures
- Routines beat panic
- Process over results
- Mechanics + mental + recovery are connected
- Avoid generic dashboards, course modules, quiz spam, and content-library sprawl

## 3. Implementation truth

Live code is implementation truth.

Use the current repo as the final authority for:
- file paths
- routing
- component structure
- data shapes
- lesson schemas
- Supabase usage
- AthleteContext behavior
- completion logic
- TypeScript constraints

Product docs guide intent, UX, tone, and quality.
They do not overrule the live implementation.

Do not invent unsupported schema fields, enum values, routes, or components.

## 4. Current visible app structure

Current app has five primary tabs:
- Home
- Career
- Game Mode
- Locker
- Profile

Even if older IA docs suggested fewer visible surfaces, the live app currently uses this 5-tab structure.

Each surface has a job:

### Home
Primary control center.
The athlete should quickly know:
- what to do next
- why it matters
- where they are in the path

Home should emphasize Continue Career and reduce choice overload.

### Career
Long-term progression map.
Shows worlds, progress, role paths, lessons, checkpoints, bosses, and earned XP.

Career should feel like a premium baseball career climb.

### Game Mode
Fast support for actual baseball days.
Pregame, in-game, between-moment, and postgame support.

### Locker
Supporting content/tools/mini-clinics.
Should not become the main app loop.

### Profile
Athlete identity and progress.
Role, XP, streak, strengths, saved routines, playbook, and dev-only QA access if present.

## 5. Core app flow

The desired product flow is:

Onboard athlete
→ athlete state stored
→ Home shows next best action
→ Continue Career routes to next lesson
→ LessonPlayer runs short interactive session
→ completion updates XP/streak/progress
→ athlete returns to path with clearer next step

Career Path is the visual representation of this flow.

## 6. Hidden routing logic concept

The routing engine should feel invisible to the athlete.

Routing should eventually consider:
- required next node
- athlete role
- season phase
- unresolved weakness
- slump/reset state
- recovery/return-to-throw state
- anti-repetition
- lesson family variety
- current phase/progress

Do not change routing logic during UI-only tasks.

## 7. Career Path design intent

Career Path is a signature screen.

It should feel like:
- premium
- athletic
- dark
- polished
- connected
- compact
- earned
- role-aware
- progression-focused
- easy to scan
- like a baseball career climb

It should not feel like:
- a course syllabus
- a static module list
- random dots on a canvas
- disconnected vertical lines
- a school curriculum map
- a childish game board
- a cheap reward screen

## 8. Duolingo-style inspiration, translated to Clutchr

Borrow from Duolingo-style learning paths:
- guided step-by-step progression
- connected lesson nodes
- obvious current node
- completed/current/locked states
- compact visual rhythm
- section/unit grouping
- visible momentum
- small rewards
- reduced guesswork
- path clarity

Do NOT copy:
- childish tone
- cartoon-heavy visuals
- toy-like colors
- confetti overload
- mascot-driven UI
- generic gamification
- quiz-heavy language
- language-learning terminology

The Clutchr version should feel like:

premium sports training path
+ baseball career climb
+ compact skill tree
+ Duolingo-level clarity
- childish game-board energy

## 9. Career Path world cards

Collapsed world cards currently work well.

Keep their core strengths:
- large rounded dark cards
- world colors
- clear world identity
- emoji/icon badge
- progress bar
- XP/progress info
- role/path badge
- premium dark feel

Do not redesign collapsed cards unless needed for visual continuity.

## 10. Expanded world path problem to solve

The expanded world path must improve.

Known problems:
- random vertical line fragments feel messy
- nodes feel disconnected
- spacing is too loose
- step stones look plain
- open area feels like a detached dark box
- path does not feel like upward growth
- checkpoints and bosses lack visual identity
- current lesson node is not heroic enough
- lesson labels can feel scattered
- map does not feel as premium as the collapsed cards

## 11. Expanded world path desired state

The opened world should feel like a connected ascent rail / career climb.

Required qualities:
- one intentional connected route/rail
- compact vertical rhythm
- clear node states
- strong current node
- distinct checkpoint nodes
- distinct boss nodes
- readable XP labels
- visually attached to the world card
- premium dark panel
- subtle world-color glow
- no random disconnected line fragments
- no huge dead space
- no text overlap/clipping
- no unnecessary new screens

## 12. Career Path node system

The path should clearly distinguish:

### Completed lesson
Visual feel:
- earned
- solid
- filled with world color
- checkmark or completion signal
- premium medal-like quality
- not overly flashy

### Current lesson
Visual feel:
- obvious next tap
- hero node
- larger/brighter than other nodes
- clean pulse/glow
- clear START or CONTINUE signal
- should pull the eye immediately

### Locked lesson
Visual feel:
- muted
- subdued
- still part of the path
- clearly not active
- not visually noisy

### Checkpoint
Visual feel:
- milestone gate
- cluster confirmation
- distinct shape such as diamond, shield, ring, or gate
- more important than a normal lesson
- not school-like

### Boss
Visual feel:
- bigger pressure event
- dramatic but realistic
- high-stakes node
- gold/strong border treatment
- should feel earned
- not cheesy or cartoonish

## 13. Path layout guidance

Prefer:
- compact zig-zag rhythm
- connected path segments
- slight upward/ascent feeling
- left/center/right motion
- current node given extra focus
- labels close enough to nodes to feel connected
- integrated XP under each node
- soft gradient panel behind the path
- world color used as accent, not overpowering background

Avoid:
- huge empty gaps
- isolated stems
- random vertical lines
- path drifting downward with no sense of climb
- overlapping text
- tiny unreadable labels
- too many icons per node
- cluttered scoreboard/badge spam

## 14. Visual design language

Clutchr should feel like premium baseball-native performance tech.

Use:
- dark base surfaces
- rich charcoal cards
- crisp white/off-white text
- role/world accent colors
- subtle glow
- refined gradients
- 8px spacing discipline
- 12–28px radii depending on component scale
- soft shadows/depth
- restrained animation
- high contrast
- minimal noise

Avoid:
- cartoon mascots
- generic SaaS blue
- neon overload
- pastel candy colors
- confetti
- loot-box feeling
- arcade meters
- cluttered dashboards
- emoji overload in serious UI surfaces

World emojis can remain if they already work visually, but the expanded path should not become emoji-heavy.

## 15. Motion principles

Motion should reinforce state.

Use:
- current node pulse/glow
- completion glow
- subtle scale/bounce on active node
- quick, tasteful interactions
- no long animations
- no fireworks/confetti

Keep animations short and performance-safe in Expo Go.

## 16. Voice and microcopy

Clutchr voice is:
- baseball-native
- short
- direct
- coach-like
- premium
- cue-based
- practical
- role-aware

Good words/cues:
- Attack
- Reset
- Compete
- Own the count
- Next pitch
- No freebies
- Stay locked in
- Control tempo
- See it
- Rhythm
- Plan
- Read
- Full commit
- Checkpoint
- Boss
- Career Path
- Start
- Continue
- Play Boss

Avoid:
- believe in yourself
- you’ve got this
- mindfulness
- meditation
- healing
- confidence booster
- therapy session
- module
- chapter
- course
- quiz
- lesson objective
- childish hype
- excessive exclamation marks

Button copy should use action verbs:
- Continue Career
- Start
- Continue
- Play Boss
- Hit Checkpoint
- See Routine
- Try Again

Avoid generic:
- OK
- Submit
- Proceed

## 17. Lesson/content philosophy

Lessons should feel like baseball reps.

Use:
- scenario
- choice
- routine execution
- cue selection
- quick reflection
- pressure response
- freeze-frame read
- rapid correction

Avoid:
- lecture paragraphs
- generic mindset teaching
- broad inspiration
- school-style quizzes
- multi-concept overload

One lesson = one job.

Default session:
- 1–3 minutes
- usually 3–6 steps

## 18. Progression philosophy

Progression should feel:
- hidden but obvious
- structured but light
- confidence-building
- role-aware
- state-aware
- pressure-aware

Useful progression spine:
1. Entry/orientation
2. Build
3. Apply
4. Stress
5. Practice/consolidation
6. Checkpoint/mini-boss
7. Final boss

Do not expose heavy curriculum language to the athlete.

## 19. Checkpoint and boss meaning

Checkpoint:
- short milestone
- confirms a skill cluster
- scenario-based
- confidence-building
- not school-like
- should visually feel like a gate/milestone

Boss:
- integrated pressure rep
- multiple linked skills
- routine under stress
- composure + decision + execution
- earned pressure event
- should visually feel bigger than a normal lesson

Bosses should not appear constantly.

## 20. Role cue banks

Pitcher:
- ATTACK
- ONE PITCH
- NO FREEBIES
- AIM SMALL
- FIRST-PITCH STRIKE
- STAY CLOSED
- THROUGH THE TARGET
- WORK FAST

Hitter:
- SEE IT
- EARLY / LATE
- YES-YES-NO
- RHYTHM
- QUIET HEAD
- LOOK AWAY
- BATTLE
- MIDDLE

Catcher:
- STICK
- CALM
- LOUD
- CLEAN
- WHY
- BLOCK FIRST
- RESET

Infielder:
- PLAN
- PRIORITY
- CLOCK
- CLEAR
- EAT
- SHORT
- NEXT PLAY

Outfielder:
- READ
- DEPTH FIRST
- NO BACKPEDAL
- THROUGH
- READY EVERY PITCH
- WANT NEXT BALL

Baserunner:
- READ IT
- FIRST MOVE
- FULL COMMIT
- GO ON GREEN
- NEXT CHANCE

## 21. Engineering guardrails

For any Codex task:
- inspect existing files first
- make the smallest safe change
- keep changes reviewable
- keep Expo/React Native mobile-first
- stay TypeScript-safe
- preserve existing behavior unless explicitly asked
- return files changed and testing steps

Do not change unless explicitly asked:
- Supabase schema
- lesson data shape
- routing logic
- lesson completion logic
- athlete state shape
- auth/onboarding flow
- lesson runtime architecture
- dev QA behavior

## 22. Career Path UI-specific guardrails

For Career Path UI work:
- focus mostly on app/(tabs)/career.tsx
- keep collapsed world cards mostly unchanged
- redesign only the expanded world path area
- keep expand/collapse behavior
- keep lesson navigation behavior
- keep completed/current/locked logic
- preserve XP labels
- preserve current-node pulse/glow, but make it cleaner
- make connectors intentional and premium
- make node types visually distinct
- avoid random line fragments
- avoid huge spacing gaps
- avoid text overlap/clipping
- do not touch Home, Game Mode, Locker, Profile, Supabase, athlete state, or lesson runtime unless absolutely necessary

## 23. QA checklist before finishing a Career Path UI task

Before returning, verify:
- Career tab loads
- worlds expand/collapse
- completed/current/locked states still work
- current node still routes to lesson
- locked nodes do not incorrectly route
- XP labels still show
- checkpoint and boss nodes are visually distinct
- no text overlaps
- no clipping on small phone screens
- no red Expo errors
- bottom tab bar still works
- dev QA hidden access still works if Profile was untouched
