# CLUTCHR — VISUAL REVAMP BRIEF
Turning the design system into shipped React Native. Paste-ready prompts,
ordered so nothing breaks.

---

## The honest diagnosis

Your colors and logo are good. The reason the app reads "weak" isn't the
palette — it's three specific things:

**1. Green is doing every job.** Brand, progress, category, active state,
icons, borders, buttons. When one color signals everything, nothing reads
as important. Your own FIFA mockup had blue/purple/gold/green per world —
the shipped app dropped that variety, and that's the single biggest gap
between the mockup you love and the screens you have.

**2. There's no data voice.** Everything is Inter at slightly different
sizes. Baseball is a scoreboard sport — mono, tabular numerals for XP,
counts, and times is the highest-impact/lowest-effort upgrade available.
One font import.

**3. Headers eat the screen.** Every screen stacks logo → breadcrumb →
title → subtitle before showing content. That's ~180px, on a phone, to
restate what the tab bar already says.

Plus two real bugs visible in your screenshots:
- **Career's background is a screenshot with UI text baked in.** "9:41",
  "CLUTCHR", "Build Your Pa", "FOUNDATION YOUR CRAFT" are all visibly
  bleeding through behind the world list.
- **Locker's featured card has an empty gradient block** where art should
  be. It reads as a failed image load, not a design.

---

## Order of operations

Do these in order. Each one is independently shippable, and each makes the
next one easier.

| # | Session | Risk | Why this order |
|---|---|---|---|
| 1 | Design tokens | None — additive | Everything else references these |
| 2 | Kill the Career background bug | Low | It's a visible bug, not a preference |
| 3 | Mono numerals app-wide | Low | Biggest visual win per line changed |
| 4 | Dense headers | Low | Reclaims ~140px on every screen |
| 5 | Diamond nodes | Medium | The signature move |
| 6 | Category colors | Medium | Needs tokens + nodes in place first |
| 7 | Locker featured card | Low | Do after the SQL migration |

---

## SESSION 1 — Design tokens

```
SESSION — Extend the theme tokens for the visual revamp.

In constants/theme.ts, add to the existing Colors object without
removing or renaming anything currently there (other screens depend on
the current names):

  // category colors — content identity
  ice: '#4AA8FF',      // mental & focus
  violet: '#B084F5',   // craft & skill
  ember: '#FF7A45',    // pressure & adversity
  deck: '#0C110D',     // raised card surface
  haze: '#7C8A7F',     // secondary text

Also add a fonts entry for a monospace family used for all numeric
display. Check what's already loaded via expo-font in app/_layout.tsx —
if a mono face isn't loaded yet, add JetBrains Mono (or Roboto Mono if
that's simpler given the existing font setup) and report which you used.

Do not change any screen yet. Tokens only.

Report using the standard template.
```

## SESSION 2 — Fix the Career background bug

```
SESSION — Fix the Career screen background artifact.

app/(tabs)/career.tsx renders a background image behind the world list
that has app UI baked into it — a status bar time, the CLUTCHR wordmark,
and "Build Your Path" text are visibly showing through behind real
content. It looks like a screenshot is being used as wallpaper.

1. Find the background image source used on the Career chapter screens
   (not the Signal tower, which has its own intentional art).
2. Replace it with a plain gradient or solid — no image. Use a subtle
   vertical gradient from Colors.void (#050806) to Colors.deck (#0C110D),
   or a radial glow in Colors.field at very low opacity.
3. Leave the Signal tower's signal-bg.png alone — that one is intentional.

Report using the standard template.
```

## SESSION 3 — Mono numerals

```
SESSION — Route all numeric display through the mono font.

Using the mono font added in Session 1, update every numeric readout to
use it, with tabular figures where supported:

- Career: world progress (1/26, 0/40), XP chip, lesson counts
- Home: streak count, readiness score, weather temp, any stat readout
- Game Mode: tool durations (90 sec, 3 min)
- Locker: item counts, read times
- Paywall: prices (they're already dynamic — just the font)

Rule: if it's a number a user reads as data, it's mono. Body copy and
titles stay as they are.

Do not restructure any layouts in this session — font family and
letterSpacing only.

Report using the standard template.
```

## SESSION 4 — Dense headers

```
SESSION — Collapse the stacked screen headers.

Every tab screen currently stacks four rows before content: the CLUTCHR
logo, a breadcrumb ("C / RESOURCES"), a screen title ("Locker"), and a
subtitle. That's roughly 180px restating what the bottom tab bar already
communicates.

Build one shared header component (components/ScreenHeader.tsx) that
renders a single ~44px row: CLUTCHR wordmark on the left, and a slot on
the right for stat pills (XP, progress).

Apply it to Career, Locker, and Game Mode. Remove the breadcrumb row and
the redundant screen title + subtitle from each.

Keep Home as-is for now — it has a different hero treatment and is being
rebuilt separately in Sprint 4.

Show me the component before applying it to all three screens.

Report using the standard template.
```

## SESSION 5 — Diamond nodes

```
SESSION — Replace circular progress nodes with diamond nodes.

The signature visual move. Every progress/lock/status node becomes a
rotated square — the baseball infield shape.

Implementation: a square View with borderRadius ~6, wrapped in
transform:[{rotate:'45deg'}], with the inner content (number, check,
lock icon) counter-rotated via transform:[{rotate:'-45deg'}] so it stays
upright.

Apply to:
- Career world/lesson nodes (currently circles on the vertical rail)
- Signal map nodes

States:
- done:   filled Colors.field, void-colored glyph
- active: Colors.electric border, translucent fill, outer glow
- locked: muted gray border, no fill, reduced opacity

Do NOT change avatars or any node representing a person — those stay
circular.

Report using the standard template.
```

## SESSION 6 — Category colors

```
SESSION — Wire category colors into Career worlds and Locker items.

Each world/content item should carry a color identity rather than
everything being green.

Career: assign each world a color from the token set (field/ice/violet/
ember/gold). Apply it to that world's node border, progress bar fill, and
a 2px top border on the world card. Check whether WORLDS already has a
color field — if so use it, if not add one.

Locker: after the taxonomy migration adds content_topic, map topics to
colors — mental→ice, craft→violet, pressure/adversity→ember,
leadership→field, recovery/strength→gold. Apply as a 2px left border on
each list row plus the icon tint.

Rule to enforce: green stays reserved for brand and progress, gold for
earned/premium. Don't use gold as a category color for something that
isn't earned.

Report using the standard template.
```

## SESSION 7 — Locker featured card

```
SESSION — Rebuild the Locker featured card.

The current featured card renders a large empty gradient block where
artwork would go, which reads as a broken image rather than a design.

Replace with a typographic treatment: category kicker line (mono, small,
colored by topic), large Archivo-weight title, one line of description,
and a mono meta row (duration · type). Add an oversized low-opacity ◆
glyph bleeding off the bottom-right corner as a watermark instead of a
photo.

No image dependency at all — it should look intentional with zero art
assets.

Report using the standard template.
```

---

## The rules that keep it from drifting

Give these to Claude Code any time it's touching visual work:

- **Every number is mono.** No exceptions — the consistency is what makes
  it read as data rather than decoration.
- **Electric green is rare.** Only the single current/active thing on
  screen. If two things are electric, neither reads as active.
- **Gold means earned.** Never decorative.
- **Category color lives on one 2px rule**, not the full border, not the
  background.
- **Circles become diamonds** — except avatars.
- **No screenshots as backgrounds.** Ever.
- **Empty states get a line of copy, not a gradient.** A blank block reads
  as broken; one line of direction reads as designed.

---

## What NOT to do

- Don't change the logo, the brand green, or the near-black background.
  Those are working and they're your identity.
- Don't add more animation. The app doesn't feel weak because it's static
  — it feels weak because everything has equal visual weight.
- Don't do all seven sessions in one sitting. Each one is independently
  shippable; test between them in Expo Go (`npx expo start`) rather than
  stacking changes and hunting for what broke.
