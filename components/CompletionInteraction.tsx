import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type CompletionIntent = 'rep' | 'lesson' | 'boss' | 'save';
export type CompletionVariant = 'swipe' | 'hold' | 'card-swipe';

type Props = {
  variant?: CompletionVariant;
  intent?: CompletionIntent;
  label?: string;
  fallbackLabel?: string;
  disabled?: boolean;
  showFallback?: boolean;
  onComplete: () => void;
};

const INTENT_LABELS: Record<CompletionIntent, string> = {
  rep: 'Finish Rep',
  lesson: 'Complete Lesson',
  boss: 'Close It Out',
  save: 'Lock It In',
};

export function completionLabelForIntent(intent: CompletionIntent) {
  return INTENT_LABELS[intent];
}

export function CompletionInteraction({
  variant = 'swipe',
  intent = 'rep',
  label,
  fallbackLabel = 'Complete Lesson',
  disabled = false,
  showFallback = true,
  onComplete,
}: Props) {
  const resolvedLabel = label ?? completionLabelForIntent(intent);
  if (variant === 'hold') {
    return (
      <HoldToComplete
        label={resolvedLabel}
        fallbackLabel={fallbackLabel}
        disabled={disabled}
        showFallback={showFallback}
        onComplete={onComplete}
      />
    );
  }
  if (variant === 'card-swipe') {
    return (
      <SwipeToComplete
        label={resolvedLabel}
        fallbackLabel={fallbackLabel}
        disabled={disabled}
        showFallback={showFallback}
        onComplete={onComplete}
        cardMode
      />
    );
  }
  return (
    <SwipeToComplete
      label={resolvedLabel}
      fallbackLabel={fallbackLabel}
      disabled={disabled}
      showFallback={showFallback}
      onComplete={onComplete}
    />
  );
}

export function CompletionInteractionMocks({ onComplete }: { onComplete: () => void }) {
  return (
    <View style={styles.mockStack}>
      <CompletionInteraction variant="swipe" intent="rep" onComplete={onComplete} />
      <CompletionInteraction variant="hold" intent="lesson" onComplete={onComplete} />
      <CompletionInteraction variant="card-swipe" intent="boss" onComplete={onComplete} />
    </View>
  );
}

function SwipeToComplete({
  label,
  fallbackLabel,
  disabled,
  showFallback,
  onComplete,
  cardMode = false,
}: {
  label: string;
  fallbackLabel: string;
  disabled: boolean;
  showFallback: boolean;
  onComplete: () => void;
  cardMode?: boolean;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const dragX = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const completed = useRef(false);
  const thumbSize = cardMode ? 62 : 56;
  const trackPadding = 8;
  const maxDrag = Math.max(1, trackWidth - thumbSize - trackPadding * 2);

  const finish = () => {
    if (completed.current || disabled) return;
    completed.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.parallel([
      Animated.timing(dragX, { toValue: maxDrag, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(sweep, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start(() => onComplete());
  };

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => !disabled && Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => Haptics.selectionAsync().catch(() => {}),
      onPanResponderMove: (_, gesture) => dragX.setValue(Math.min(maxDrag, Math.max(0, gesture.dx))),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > maxDrag * 0.72) {
          finish();
        } else {
          Animated.spring(dragX, { toValue: 0, tension: 90, friction: 9, useNativeDriver: false }).start();
        }
      },
    }),
    [disabled, maxDrag]
  );

  const signalWidth = sweep.interpolate({ inputRange: [0, 1], outputRange: [0, trackWidth || 0], extrapolate: 'clamp' });
  const sweepTranslate = sweep.interpolate({ inputRange: [0, 1], outputRange: [-180, 320] });

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.track, cardMode && styles.cardTrack, disabled && styles.disabled]}
        onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.completionSignal, { width: signalWidth }]}>
          <LinearGradient colors={['rgba(35,209,96,0.18)', 'rgba(57,255,136,0.28)']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
        </Animated.View>
        <Animated.View style={[styles.sweep, { transform: [{ translateX: sweepTranslate }] }]} />
        <View style={[styles.labelRail, cardMode && styles.cardLabelRail]} pointerEvents="none">
          <Text style={styles.trackLabel}>{cardMode ? label : `Slide to ${label}`}</Text>
        </View>
        <Animated.View style={[styles.thumb, cardMode && styles.cardThumb, { transform: [{ translateX: dragX }] }]} {...panResponder.panHandlers}>
          <Ionicons name={cardMode ? 'baseball' : 'arrow-forward'} size={cardMode ? 22 : 24} color="#050806" />
        </Animated.View>
      </View>
      {showFallback && (
        <Pressable style={styles.fallback} onPress={finish} disabled={disabled} accessibilityRole="button">
          <Text style={styles.fallbackText}>{fallbackLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function HoldToComplete({
  label,
  fallbackLabel,
  disabled,
  showFallback,
  onComplete,
}: {
  label: string;
  fallbackLabel: string;
  disabled: boolean;
  showFallback: boolean;
  onComplete: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const completed = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const finish = () => {
    if (completed.current || disabled) return;
    completed.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.timing(progress, { toValue: 1, duration: 120, useNativeDriver: false }).start(() => onComplete());
  };

  const start = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(progress, { toValue: 1, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(({ finished }) => {
      if (finished) finish();
    });
    timer.current = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 520);
  };

  const cancel = () => {
    if (completed.current) return;
    if (timer.current) clearTimeout(timer.current);
    progress.stopAnimation();
    Animated.spring(progress, { toValue: 0, tension: 80, friction: 10, useNativeDriver: false }).start();
  };

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.track, styles.holdTrack, disabled && styles.disabled]}
        onPressIn={start}
        onPressOut={cancel}
        disabled={disabled}
        accessibilityRole="button"
      >
        <Animated.View style={[styles.fill, { width }]}>
          <LinearGradient colors={['#23D160', '#39FF88']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
        </Animated.View>
        <Ionicons name="radio-button-on" size={18} color="#39FF88" />
        <Text style={styles.trackLabel}>Hold to {label}</Text>
      </Pressable>
      {showFallback && (
        <Pressable style={styles.fallback} onPress={finish} disabled={disabled} accessibilityRole="button">
          <Text style={styles.fallbackText}>{fallbackLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mockStack: { gap: Spacing.lg },
  wrap: { gap: Spacing.sm, marginTop: Spacing.md },
  track: {
    height: 72,
    borderRadius: 24,
    backgroundColor: '#111612',
    borderWidth: 1,
    borderColor: '#242B26',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowColor: '#23D160',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  cardTrack: { height: 84, borderRadius: Radius.xl, borderColor: 'rgba(35,209,96,0.28)' },
  holdTrack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  disabled: { opacity: 0.48 },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    opacity: 0.92,
  },
  completionSignal: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  sweep: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 80,
    backgroundColor: 'rgba(247,255,249,0.22)',
    transform: [{ rotate: '14deg' }],
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#39FF88',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#39FF88',
    shadowOpacity: 0.42,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 2,
  },
  cardThumb: { width: 62, height: 62, borderRadius: 20 },
  labelRail: {
    ...StyleSheet.absoluteFillObject,
    left: 72,
    right: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  cardLabelRail: { left: 82 },
  trackLabel: {
    color: '#F7FFF9',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  fallback: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  fallbackText: { color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.4 },
});
