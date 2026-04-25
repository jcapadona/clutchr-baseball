// Clutchr Baseball — Design System
// Dark, sharp, baseball-native. No wellness pastels.

export const Colors = {
  // Backgrounds
  background: '#0A0A0A',
  surface: '#111111',
  surfaceElevated: '#1A1A1A',
  surfaceHigh: '#222222',

  // Borders
  border: '#222222',
  borderSubtle: '#1C1C1C',
  borderActive: 'rgba(34, 204, 94, 0.4)',

  // Brand green
  primary: '#22CC5E',
  primaryDim: '#16A84A',
  primaryMuted: 'rgba(34, 204, 94, 0.12)',
  primaryBorder: 'rgba(34, 204, 94, 0.25)',
  primaryGlow: 'rgba(34, 204, 94, 0.08)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textTertiary: '#555555',
  textDisabled: '#333333',

  // Accent colors
  warning: '#F5A623',
  warningMuted: 'rgba(245, 166, 35, 0.15)',
  danger: '#FF3B30',
  dangerMuted: 'rgba(255, 59, 48, 0.15)',
  info: '#0A84FF',
  infoMuted: 'rgba(10, 132, 255, 0.15)',
  purple: '#BF5AF2',
  purpleMuted: 'rgba(191, 90, 242, 0.15)',

  // Utility
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
  green: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;