import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ClutchrLogo } from '@/components/ClutchrLogo';

export type ClutchrHeaderVariant = 'home' | 'mainTab' | 'flow' | 'contextCard';

type HeaderIconName = React.ComponentProps<typeof Ionicons>['name'];

export type ClutchrHeaderProps = {
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
  style?: StyleProp<ViewStyle>;
};

export function HeaderActionButton({
  icon,
  label,
  onPress,
}: {
  icon: HeaderIconName;
  label?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      style={({ pressed }) => [headerActionStyles.button, pressed && headerActionStyles.buttonPressed]}
    >
      <Ionicons name={icon} size={18} color={Colors.textPrimary} />
    </Pressable>
  );
}

export function BrandMark({ wordmark = false }: { wordmark?: boolean }) {
  if (wordmark) return <ClutchrLogo />;

  return (
    <View style={brandMarkStyles.mark} accessibilityLabel="Clutchr mark">
      <Text style={brandMarkStyles.markText}>C</Text>
    </View>
  );
}

export function HeaderProgressBar({ progress = 0 }: { progress?: number }) {
  const safeProgress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${safeProgress * 100}%` }]} />
    </View>
  );
}

export function ClutchrHeader({
  variant,
  kicker,
  title,
  subtitle,
  showWordmark,
  showCMark,
  showGreenSignal = true,
  showCoachCap: _showCoachCap = false,
  rightAction,
  leftAction,
  progress,
  statusPill,
  style,
}: ClutchrHeaderProps) {
  if (variant === 'flow') {
    return (
      <View style={[styles.flowWrap, style]}>
        <View style={styles.flowRow}>
          <View style={styles.flowSide}>{leftAction}</View>
          <View style={styles.flowCenter}>
            {kicker ? <Text style={styles.flowKicker} numberOfLines={1}>{kicker}</Text> : null}
            <Text style={styles.flowTitle} numberOfLines={1}>{title}</Text>
          </View>
          <View style={[styles.flowSide, styles.flowRight]}>{rightAction}</View>
        </View>
        {typeof progress === 'number' ? <HeaderProgressBar progress={progress} /> : null}
      </View>
    );
  }

  const isHome = variant === 'home';
  const shouldShowWordmark = showWordmark ?? isHome;
  const shouldShowCMark = showCMark ?? !isHome;

  return (
    <View style={[styles.wrap, isHome ? styles.homeWrap : styles.mainWrap, style]}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          {shouldShowWordmark ? <BrandMark wordmark /> : null}
          {!shouldShowWordmark && shouldShowCMark ? <BrandMark /> : null}
          {kicker ? (
            <View style={styles.kickerRow}>
              {showGreenSignal ? <Text style={styles.greenSlash}>/</Text> : null}
              <Text style={styles.kicker} numberOfLines={1}>{kicker}</Text>
            </View>
          ) : null}
        </View>
        {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
      </View>

      <View style={styles.titleRow}>
        <View style={styles.titleStack}>
          <View style={styles.titleLine}>
            <Text style={[styles.title, isHome && styles.homeTitle]} numberOfLines={2}>{title}</Text>
            {statusPill ? (
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText} numberOfLines={1}>{statusPill}</Text>
              </View>
            ) : null}
          </View>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>

      {typeof progress === 'number' ? <HeaderProgressBar progress={progress} /> : null}
      {showGreenSignal && typeof progress !== 'number' ? <View style={styles.signalLine} /> : null}
    </View>
  );
}

const HEADER_BACKGROUND = '#050806';
const HEADER_SURFACE = '#111612';
const HEADER_BORDER = '#242B26';
const HEADER_TEXT = '#F7FFF9';
const HEADER_MUTED = '#A8B3AA';
const BRAND_GREEN = '#23D160';

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: HEADER_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: HEADER_BORDER,
    paddingHorizontal: Spacing.xl,
  },
  homeWrap: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  mainWrap: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  topRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 0,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  greenSlash: {
    color: BRAND_GREEN,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    lineHeight: 16,
  },
  kicker: {
    color: HEADER_MUTED,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.8,
  },
  rightAction: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  titleRow: {
    marginTop: Spacing.sm,
  },
  titleStack: {
    gap: 4,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flexShrink: 1,
    color: HEADER_TEXT,
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    lineHeight: 31,
    letterSpacing: -0.45,
  },
  homeTitle: {
    fontSize: 30,
    lineHeight: 35,
  },
  subtitle: {
    color: HEADER_MUTED,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  statusPill: {
    maxWidth: 126,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusPillText: {
    color: BRAND_GREEN,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  signalLine: {
    width: 44,
    height: 2,
    marginTop: Spacing.md,
    borderRadius: 2,
    backgroundColor: BRAND_GREEN,
  },
  flowWrap: {
    backgroundColor: HEADER_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: HEADER_BORDER,
  },
  flowRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  flowSide: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  flowRight: {
    alignItems: 'flex-end',
  },
  flowCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  flowKicker: {
    color: BRAND_GREEN,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: 1,
  },
  flowTitle: {
    color: HEADER_TEXT,
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    lineHeight: 20,
  },
});

const brandMarkStyles = StyleSheet.create({
  mark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HEADER_SURFACE,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  markText: {
    color: BRAND_GREEN,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.4,
  },
});

const progressStyles = StyleSheet.create({
  track: {
    height: 3,
    overflow: 'hidden',
    backgroundColor: HEADER_BORDER,
  },
  fill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: BRAND_GREEN,
  },
});

const headerActionStyles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: HEADER_SURFACE,
    borderWidth: 1,
    borderColor: HEADER_BORDER,
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
