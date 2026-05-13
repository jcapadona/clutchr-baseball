// Clutchr Baseball — Design System
// Dark, sharp, baseball-native. Green is action/progress/success; gold is earned/premium.

export const Colors = {
  // ── Brand palette ──────────────────────────────────────────────────────────
  background: '#0A0A0A',
  surface: '#111417',
  surfaceElevated: '#15191D',
  surfaceHigh: '#2A2E33',
  slate: '#2A2E33',

  // ── Tinted surfaces ────────────────────────────────────────────────────────
  surfaceGlow: '#0B1A10',
  surfaceWarm: '#1A1408',
  surfaceCool: '#080F1A',

  // ── Borders ────────────────────────────────────────────────────────────────
  border: 'rgba(245,245,245,0.10)',
  borderSubtle: 'rgba(245,245,245,0.06)',
  borderStrong: 'rgba(245,245,245,0.18)',
  borderActive: 'rgba(0, 255, 102, 0.42)',
  cardBorder: 'rgba(245,245,245,0.12)',
  warningBorder: 'rgba(245, 166, 35, 0.30)',
  infoBorder: 'rgba(10, 132, 255, 0.28)',
  purpleBorder: 'rgba(191, 90, 242, 0.28)',
  dangerBorder: 'rgba(255, 59, 48, 0.28)',

  // ── Primary action/progress green ──────────────────────────────────────────
  primary: '#00FF66',
  green: '#00FF66',
  primaryDim: '#19C85A',
  primaryMuted: 'rgba(0, 255, 102, 0.12)',
  primaryBorder: 'rgba(0, 255, 102, 0.28)',
  primaryGlow: 'rgba(0, 255, 102, 0.10)',

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary: '#F5F5F5',
  text: '#F5F5F5',
  textSecondary: '#A8B3AA',
  mutedText: '#A8B3AA',
  textTertiary: '#6F7478',
  textDisabled: '#3B4045',

  // ── Accent colors by role ──────────────────────────────────────────────────
  warning: '#F5A623',
  gold: '#F5A623',
  warningMuted: 'rgba(245, 166, 35, 0.15)',
  danger: '#FF3B30',
  red: '#FF3B30',
  dangerMuted: 'rgba(255, 59, 48, 0.15)',
  info: '#0A84FF',
  infoMuted: 'rgba(10, 132, 255, 0.15)',
  purple: '#BF5AF2',
  purpleMuted: 'rgba(191, 90, 242, 0.15)',
  orange: '#FF6A2A',
  orangeMuted: 'rgba(255, 106, 42, 0.15)',

  // ── Utility ────────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const BrandRoles = {
  action: Colors.primary,
  success: Colors.primary,
  progress: Colors.primary,
  earned: Colors.warning,
  premium: Colors.warning,
  utility: Colors.purple,
  caution: Colors.danger,
  grind: Colors.orange,
} as const;

export const Surfaces = {
  app: Colors.background,
  card: Colors.surface,
  cardElevated: Colors.surfaceElevated,
  hero: Colors.surfaceGlow,
  outline: Colors.border,
  outlineActive: Colors.primaryBorder,
} as const;

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
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    lineHeight: 14,
    letterSpacing: 1.8,
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

export const ButtonTokens = {
  minHeight: 54,
  radius: Radius.lg,
  primaryBg: Colors.primary,
  primaryText: Colors.background,
  secondaryBg: Colors.surface,
  secondaryBorder: Colors.border,
  secondaryText: Colors.textSecondary,
  disabledBg: Colors.surfaceElevated,
  disabledText: Colors.textTertiary,
} as const;

export const CardTokens = {
  backgroundColor: Colors.surface,
  elevatedBackgroundColor: Colors.surfaceElevated,
  borderColor: Colors.border,
  activeBorderColor: Colors.primaryBorder,
  radius: Radius.xl,
} as const;

export const Shadow = {
  green: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 8,
  },
  greenFocus: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.34,
    shadowRadius: 20,
    elevation: 12,
  },
  amber: {
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  cardDeep: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
