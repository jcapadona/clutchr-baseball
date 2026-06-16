# Clutchr UI Header System

**File:** `/brand/ui-header-system.md`  
**Product:** Clutchr Baseball  
**Purpose:** Standardize the top header system across Home, Career, Game Mode, Resources, Profile, Lesson, and utility flows.

---

## 1. Header Philosophy

The Clutchr header system should make the app feel like one premium baseball operating system.

The header should:

- orient the athlete quickly
- reinforce the Clutchr brand without clutter
- make the current screen feel intentional
- support one clear action
- preserve mobile clarity
- feel dark, premium, sharp, and baseball-native

The header should not:

- turn every page into a logo billboard
- use Coach Cap as decoration
- create inconsistent spacing between screens
- add multiple utility buttons
- compete with the main CTA
- feel like a school app, wellness app, or generic dashboard

---

## 2. System Name

Use the internal name:

**Clutchr Command Header**

This is the shared header family for all major app surfaces.

---

## 3. Header Variants

### 3.1 Home Command Header

**Use on:**

- Home screen only

**Purpose:**

Make Home feel like the app command center.

**Structure:**

- Top row:
  - small Clutchr wordmark or C-mark + `CLUTCHR BASEBALL`
  - right-side profile/settings/action icon
- Hero line:
  - athlete-aware greeting or status
  - short subtitle tied to next best rep
- Optional:
  - tiny green signal line
  - Coach Cap visual only if it supports guidance

**Example copy:**

- `CLUTCHR BASEBALL`
- `Your Next Rep`
- `Attack the zone. Stay with the plan.`
- `In Season · Pitcher`

**Rules:**

- Full wordmark can appear here.
- Coach Cap may appear on Home, but not as the default header icon.
- Do not show multiple competing CTAs in the header.
- Do not use generic greetings like “Welcome back!” unless paired with baseball context.

---

### 3.2 Main Tab Header

**Use on:**

- Career
- Game Mode
- Resources
- Profile

**Purpose:**

Create a consistent top system for main navigation screens.

**Structure:**

1. Small top kicker  
2. Large page title  
3. Short practical subtitle  
4. Optional top-right utility  
5. Small green brand signal

**Example: Career**

- Kicker: `CAREER`
- Title: `Build Your Path`
- Subtitle: `One rep at a time.`
- Utility: optional Playbook or filter icon

**Example: Game Mode**

- Kicker: `GAME MODE`
- Title: `Get Game Ready`
- Subtitle: `Prep. Reset. Recover.`
- Utility: optional saved routines icon

**Example: Resources**

- Kicker: `RESOURCES`
- Title: `Baseball Tools`
- Subtitle: `Dugout. Bullpen. The Grind.`
- Utility: search/filter

**Example: Profile**

- Kicker: `PROFILE`
- Title: `Your Player OS`
- Subtitle: `Role, routines, progress.`
- Utility: settings

**Rules:**

- Do not use full Clutchr wordmark on every tab.
- Use a small C-mark or green slash as the brand signature.
- Use consistent title stack spacing across all main tabs.
- Keep subtitles under one line whenever possible.
- Use only one top-right utility action.

---

### 3.3 Flow Header

**Use on:**

- Lesson player
- Game Mode tool
- Quick Reset flow
- Routine Builder flow
- Postgame Debrief flow
- Onboarding steps

**Purpose:**

Keep focused flows clean and functional.

**Structure:**

- left: back/close button
- center: flow title or current step
- right: optional progress, timer, or save action
- bottom: slim progress bar when useful

**Example: Lesson**

- Back button
- `Fastball Command`
- `2 of 5`
- thin progress bar

**Example: Quick Reset**

- Close button
- `Quick Reset`
- timer or step indicator

**Rules:**

- No Coach Cap in the flow header.
- No full wordmark.
- No decorative icons.
- Prioritize progress clarity and exit behavior.
- Keep the athlete locked into one job.

---

### 3.4 Context Card Header

**Use inside cards, not the global top header.**

**Best for:**

- CC’s Take cards
- Today’s Focus cards
- Coach Cap guidance cards
- completion cards
- badge unlock cards
- postgame carry-forward cards

**Structure:**

- small label
- icon/avatar/Coach Cap silhouette if useful
- title
- one short cue or coaching line

**Examples:**

- `CC’S TAKE`
- `You protected the next rep.`
- `Breathe. Reset. Attack.`

**Rules:**

- Coach Cap belongs here more than in the global header.
- Use this to add personality without cluttering navigation.
- Keep copy short and baseball-native.

---

## 4. Brand Signature Element

Every major header should include one small Clutchr signature element.

Approved options:

1. small green slash `/`
2. small C-mark
3. short green underline
4. compact status rail
5. subtle green glow behind the active label

Recommended default:

**small green slash before the kicker**

Example:

`/ CAREER`

This is cleaner than putting the full logo everywhere.

---

## 5. Wordmark Rules

### Use full wordmark on:

- Home
- onboarding welcome
- App Store screenshots
- marketing surfaces
- loading screen
- launch/splash surfaces

### Do not use full wordmark on:

- every main tab
- lesson flow headers
- Game Mode tools
- Resources article detail pages
- Profile subpages

### Use small C-mark on:

- main tab headers
- app icon preview
- compact brand signature
- completion moments
- premium cards

---

## 6. Coach Cap Header Rules

Coach Cap is a guide, not the navigation system.

### Coach Cap may appear in:

- Home hero card
- onboarding guidance
- CC’s Take cards
- completion moments
- empty states
- postgame summary
- quick reset body content
- App Store screenshots

### Coach Cap should not appear in:

- every main tab header
- every lesson screen
- every utility header
- serious recovery warnings
- dense information screens
- places where screen clarity matters more

### Header decision:

Coach Cap is **not part of the default global header**.

Use him as a contextual coaching layer.

---

## 7. Typography Rules

### Kicker

Use for section identity.

Style:

- uppercase
- small
- letter-spaced
- green or muted gray
- max 1–3 words

Examples:

- `CAREER`
- `GAME MODE`
- `RESOURCES`
- `PROFILE`
- `QUICK RESET`
- `CC’S TAKE`

### Title

Use for the main page title.

Style:

- bold
- athletic
- high contrast
- 26–34px depending on screen
- max 2 lines

Examples:

- `Build Your Path`
- `Get Game Ready`
- `Baseball Tools`
- `Your Player OS`
- `Finish the Rep`

### Subtitle

Use for practical context.

Style:

- muted gray
- 13–16px
- one line preferred
- no generic motivation

Examples:

- `One rep at a time.`
- `Prep. Reset. Recover.`
- `Dugout. Bullpen. The Grind.`
- `Role, routines, progress.`
- `Control what you can. Attack what’s next.`

---

## 8. Color Rules

Headers use the Clutchr dark system.

Recommended tokens:

- background: `#050806`
- surface: `#111612`
- border: `#242B26`
- text primary: `#F7FFF9`
- text secondary: `#A8B3AA`
- brand green: `#23D160`
- electric green: `#39FF88`

Green usage:

- section signal
- active state
- progress
- primary CTA
- completion cue

Do not use green as decoration everywhere.

---

## 9. Spacing Rules

Use consistent mobile spacing.

### Main tab header

- top safe padding: 12–20
- horizontal padding: 20
- kicker margin bottom: 6
- title margin bottom: 6
- subtitle margin bottom: 16–20
- header bottom spacing before content: 18–24

### Flow header

- height: 56–64
- horizontal padding: 16–20
- back button touch target: 40x40
- title centered or left-aligned depending on screen
- progress bar height: 3–4

### Home header

- top safe padding: 14–22
- horizontal padding: 20
- brand row height: 36–44
- hero title margin top: 18–24
- hero title size: 32–40

---

## 10. Utility Behavior

Use one top-right utility max.

Approved utilities:

- settings
- profile
- search
- filter
- saved routines
- Playbook
- close
- save

Do not stack:

- search + filter + settings
- profile + notifications + settings
- multiple decorative icons

If a screen needs more actions, put them lower in the screen as cards or chips.

---

## 11. Screen Mapping

| Screen | Header Variant | Wordmark | Coach Cap | Utility |
|---|---|---:|---:|---|
| Home | Home Command Header | Yes | Optional | Profile/settings |
| Career | Main Tab Header | No | No | Optional Playbook |
| Game Mode | Main Tab Header | No | No | Optional routines |
| Resources | Main Tab Header | No | No | Search/filter |
| Profile | Main Tab Header | No | No | Settings |
| Lesson Player | Flow Header | No | No | Progress/close |
| Quick Reset | Flow Header | No | Body only | Timer/close |
| Routine Builder | Flow Header | No | No | Save |
| Postgame Debrief | Flow Header | No | Optional summary only | Save |
| Onboarding | Flow/Header hybrid | Yes on first screen | Optional | Step progress |

---

## 12. Copy Rules

Header copy must be:

- short
- baseball-native
- cue-based
- practical
- role-aware when possible

Avoid:

- “Welcome to your journey”
- “Mindset module”
- “Confidence booster”
- “Mental health check-in”
- “Course”
- “Quiz”
- “Good job!”
- generic hype

Preferred language:

- `Your Next Rep`
- `Build Your Path`
- `Get Game Ready`
- `Reset the Moment`
- `Know the Situation`
- `Own Your Routine`
- `Finish the Rep`
- `Carry the Cue`

---

## 13. Component Requirements

Build one reusable header component family instead of rewriting headers per screen.

Recommended component:

`ClutchrHeader`

Props:

```ts
type ClutchrHeaderVariant =
  | 'home'
  | 'mainTab'
  | 'flow'
  | 'contextCard';

type ClutchrHeaderProps = {
  variant: ClutchrHeaderVariant;
  kicker?: string;
  title: string;
  subtitle?: string;
  showWordmark?: boolean;
  showCMark?: boolean;
  showGreenSignal?: boolean;
  showCoachCap?: boolean;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  progress?: number;
  statusPill?: string;
};