/**
 * CLUTCHR BASEBALL — VISUAL EXTENSIONS
 * Drop at: constants/visualExtensions.ts
 *
 * This does NOT replace constants/theme.ts. It imports your real tokens
 * (Colors, Typography, Spacing, Radius, Shadow) and adds only what's
 * missing for the visual overhaul: display font tokens, category colors,
 * content-type colors, gradients, and a tint() helper.
 *
 * Colors.primary (#00FF66) stays the single source of truth for green —
 * nothing here redefines it.
 *
 * SETUP (Terminal, if not already installed):
 *   npx expo install @expo-google-fonts/barlow-condensed -- --legacy-peer-deps
 *
 * Then in app/_layout.tsx, alongside your existing Inter font loading, add:
 *   import {
 *     BarlowCondensed_600SemiBold,
 *     BarlowCondensed_700Bold,
 *     BarlowCondensed_800ExtraBold,
 *     BarlowCondensed_800ExtraBold_Italic,
 *   } from '@expo-google-fonts/barlow-condensed';
 *   // add these four to your existing useFonts({...}) call
 */

import { Colors, Typography, Spacing, Radius, Shadow } from './theme';

// ─────────────────────────────────────────────────────────────
// DISPLAY FONT TOKENS — your Typography object is Inter-only.
// These are the condensed/bold/italic display treatments the
// diagnostic calls for on screen titles, world names, and stat numbers.
// ─────────────────────────────────────────────────────────────

export const DisplayFont = {
  italic: 'BarlowCondensed_800ExtraBold_Italic',
  bold:   'BarlowCondensed_800ExtraBold',
  semi:   'BarlowCondensed_700Bold',
  medium: 'BarlowCondensed_600SemiBold',
} as const;

/** Screen titles — "BUILD YOUR PATH", "GAME MODE". Two-tone in component: lead white, rest Colors.primary. */
export const DisplayHero = {
  fontFamily: DisplayFont.italic,
  fontSize: 38,
  lineHeight: 40,
  letterSpacing: 0.5,
  textTransform: 'uppercase' as const,
  color: Colors.textPrimary,
};

/** World/tool tile titles */
export const DisplayCard = {
  fontFamily: DisplayFont.bold,
  fontSize: 22,
  lineHeight: 24,
  letterSpacing: 0.3,
  textTransform: 'uppercase' as const,
  color: Colors.textPrimary,
};

export const DisplayCardSm = {
  fontFamily: DisplayFont.bold,
  fontSize: 16,
  lineHeight: 18,
  letterSpacing: 0.3,
  textTransform: 'uppercase' as const,
  color: Colors.textPrimary,
};

/** Big stat numbers — 81, +65, 87% */
export const DisplayStat = {
  fontFamily: DisplayFont.bold,
  fontSize: 40,
  lineHeight: 40,
  letterSpacing: -0.5,
  color: Colors.textPrimary,
};

// ─────────────────────────────────────────────────────────────
// CATEGORY COLORS — Career tile grid. Color = category, always.
// Locked worlds use `locked` regardless of chapter.
// ─────────────────────────────────────────────────────────────

export const CategoryColor = {
  foundation: Colors.primary,   // #00FF66 — your existing green
  craft:      Colors.purple,    // #BF5AF2 — already in your palette
  compete:    Colors.info,      // #0A84FF — already in your palette
  grind:      Colors.warning,   // #F5A623 — already gold/earned
  signal:     '#22D3EE',        // cyan — new, Signal doesn't have a role yet
  recovery:   '#E879F9',        // magenta — new, for Slump/Recovery worlds
  locked:     Colors.textDisabled, // #3B4045 — already your disabled tone
} as const;

// ─────────────────────────────────────────────────────────────
// CONTENT-TYPE COLORS — Locker. Fixes "7 identical green icons."
// ─────────────────────────────────────────────────────────────

export const TypeColor = {
  article:  Colors.primary,
  exercise: Colors.warning,
  video:    Colors.info,
  audio:    Colors.purple,
} as const;

// ─────────────────────────────────────────────────────────────
// GRADIENTS — pass into <LinearGradient colors={...} />
// Built from your existing surface tokens, not new colors.
// ─────────────────────────────────────────────────────────────

export const Gradient = {
  /** Default card fill: lighter top → darker bottom (ambient light read) */
  card: [Colors.surfaceElevated, Colors.surface] as const,
  cardActive: [Colors.surfaceGlow, Colors.surface] as const,

  /** THE IMAGE TREATMENT — horizontal scrim so text stays legible.
   *  start={{x:0,y:0}} end={{x:1,y:0}} */
  photoScrimX: ['rgba(10,10,10,0.96)', 'rgba(10,10,10,0.55)', 'rgba(10,10,10,0.12)'] as const,
  photoScrimXLocations: [0, 0.5, 1] as const,

  /** Bottom scrim — layer on top of photoScrimX.
   *  start={{x:0,y:0}} end={{x:0,y:1}} */
  photoScrimY: ['transparent', 'rgba(10,10,10,0.25)', 'rgba(10,10,10,0.92)'] as const,
  photoScrimYLocations: [0, 0.55, 1] as const,

  /** Primary CTA — built from Colors.primary, not a new green */
  ctaGreen: ['#4CFF9B', Colors.primaryDim] as const,
  ctaGold:  ['#FFD766', Colors.warning] as const,
} as const;

/** Category/type color → tinted background wash, e.g. for corner-wash fallback tiles */
export function tint(hex: string, opacity = 0.18): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

// ─────────────────────────────────────────────────────────────
// HAIRLINE / DEFAULT BORDER — replaces green card borders.
// Your Colors.border ('rgba(245,245,245,0.10)') already IS the
// right neutral hairline — no new token needed, just the reminder:
//
//   Default card border → Colors.border  (NOT Colors.primaryBorder)
//   Active card border  → Colors.primaryBorder / Colors.borderActive
//
// This is Phase 1.3 (accent inflation fix): your theme.ts already
// has both the neutral and active border tokens defined correctly —
// the bug is purely in which one components reach for by default.
// ─────────────────────────────────────────────────────────────

export const TopHighlight = 'rgba(245,245,245,0.06)'; // 1px top-edge highlight for "glass" read

export default {
  DisplayFont, DisplayHero, DisplayCard, DisplayCardSm, DisplayStat,
  CategoryColor, TypeColor, Gradient, tint, TopHighlight,
};
