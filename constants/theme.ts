// Clutchr Baseball — Design System
// Dark, sharp, baseball-native. No wellness pastels.

export const Colors = {
  // ── Backgrounds ────────────────────────────────────────────────────────────
  background: '#0A0A0A',
  surface: '#111111',
  surfaceElevated: '#1A1A1A',
  surfaceHigh: '#222222',

  // ── NEW: Glowing surfaces for active/hover states ─────────────────────────
  // A very subtle green-tinted dark surface — used for active nodes,
  // selected states, "next lesson" cards. Creates depth without full green fill.
  surfaceGlow: '#0D1A0F',

  // A warm amber-tinted surface — for warning/boss states
  surfaceWarm: '#1A1408',

  // A blue-tinted surface — for info/checkpoint states
  surfaceCool: '#080F1A',

  // ── Borders ────────────────────────────────────────────────────────────────
  border: '#222222',
  borderSubtle: '#1C1C1C',
  borderActive: 'rgba(34, 204, 94, 0.4)',

  // ── NEW: Mid-step card border — presence without full green ───────────────
  // Use this when a card needs to stand out from its siblings
  // but is not in a fully active/selected green state.
  cardBorder: '#2A2A2A',

  // ── NEW: Colored accent borders for each token color ──────────────────────
  warningBorder: 'rgba(245, 166, 35, 0.30)',
  infoBorder: 'rgba(10, 132, 255, 0.28)',
  purpleBorder: 'rgba(191, 90, 242, 0.28)',
  dangerBorder: 'rgba(255, 59, 48, 0.28)',

  // ── Brand green ────────────────────────────────────────────────────────────
  primary: '#22CC5E',
  primaryDim: '#16A84A',
  primaryMuted: 'rgba(34, 204, 94, 0.12)',
  primaryBorder: 'rgba(34, 204, 94, 0.25)',
  primaryGlow: 'rgba(34, 204, 94, 0.08)',

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textTertiary: '#555555',
  textDisabled: '#333333',

  // ── Accent colors ──────────────────────────────────────────────────────────
  warning: '#F5A623',
  warningMuted: 'rgba(245, 166, 35, 0.15)',
  danger: '#FF3B30',
  dangerMuted: 'rgba(255, 59, 48, 0.15)',
  info: '#0A84FF',
  infoMuted: 'rgba(10, 132, 255, 0.15)',
  purple: '#BF5AF2',
  purpleMuted: 'rgba(191, 90, 242, 0.15)',

  // ── Utility ────────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Typography = {
  display: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    lineHeight: 52,
    color: Colors.textPrimary,
  },
  hero: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    lineHeight: 36,
    color: Colors.textPrimary,
  },
  h1: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    lineHeight: 32,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    lineHeight: 28,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  bodyLarge: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 16,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  labelSmall: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 14,
    letterSpacing: 0.8,
    color: Colors.textTertiary,
  },
  button: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
    color: Colors.textTertiary,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 100,
} as const;

export const Shadow = {
  // Ambient green glow — used on active nodes, CTA buttons, the hero card
  green: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 8,
  },
  // Stronger focused green glow — used on the NEXT lesson node
  greenFocus: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  // Amber glow — boss nodes, warning states
  amber: {
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  // Standard card lift — subtle depth on surface cards
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  // Deep card — more dramatic lift for hero elements
  cardDeep: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;