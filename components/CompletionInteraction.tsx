import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Animated,
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
  lesson: 'Complete Rep',
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
  fallbackLabel: _fallbackLabel = 'Complete Lesson',
  disabled = false,
  showFallback: _showFallback = true,
  onComplete,
}: Props) {
  const resolvedLabel = label ?? completionLabelForIntent(intent);
  if (variant === 'hold') {
    return (
      <FinishRepButton
        label={resolvedLabel}
        disabled={disabled}
        onComplete={onComplete}
      />
    );
  }
  if (variant === 'card-swipe') {
    return (
      <FinishRepButton
        label={resolvedLabel}
        disabled={disabled}
        onComplete={onComplete}
        cardMode
      />
    );
  }
  return (
    <FinishRepButton
      label={resolvedLabel}
      disabled={disabled}
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

function FinishRepButton({
  label,
  disabled,
  onComplete,
  cardMode = false,
}: {
  label: string;
  disabled: boolean;
  onComplete: () => void;
  cardMode?: boolean;
}) {
  const completed = useRef(false);
  const scale = useRef(new Animated.Value(1)).current;
  const fill = useRef(new Animated.Value(0)).current;
  const [locked, setLocked] = useState(false);

  const finish = () => {
    if (completed.current || disabled) return;
    completed.current = true;
    setLocked(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.98, duration: 80, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 90, friction: 8, useNativeDriver: true }),
      ]),
      Animated.timing(fill, { toValue: 1, duration: 360, useNativeDriver: false }),
    ]).start(() => onComplete());
  };

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
      <Pressable
        style={({ pressed }) => [
          styles.finishButton,
          cardMode && styles.cardFinishButton,
          disabled && styles.disabled,
          pressed && !disabled && styles.finishButtonPressed,
        ]}
        onPress={finish}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <LinearGradient
          colors={disabled ? [Colors.surfaceElevated, Colors.surface] : [Colors.primary, Colors.primaryDim]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.finishFill,
            { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
        <View style={styles.finishIconWrap}>
          <Ionicons name={locked ? 'checkmark' : cardMode ? 'baseball' : 'lock-closed'} size={18} color={Colors.background} />
        </View>
        <View style={styles.finishCopy}>
          <Text style={styles.finishLabel}>{locked ? 'Rep Locked' : label}</Text>
          <Text style={styles.finishSub}>{locked ? 'Loading the payoff.' : cardMode ? 'Close the frame.' : 'Tap once to lock this rep.'}</Text>
        </View>
        <Ionicons name={locked ? 'checkmark-circle' : 'arrow-forward'} size={18} color={Colors.background} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mockStack: { gap: Spacing.lg },
  wrap: { gap: Spacing.sm, marginTop: Spacing.md },
  finishButton: {
    minHeight: 68,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowColor: Colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  cardFinishButton: { minHeight: 76, borderRadius: Radius.xl },
  finishFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  finishButtonPressed: { transform: [{ scale: 0.99 }], opacity: 0.94 },
  disabled: { opacity: 0.48 },
  finishIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(10,10,10,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishCopy: { flex: 1, gap: 2 },
  finishLabel: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.background,
    letterSpacing: 0.2,
  },
  finishSub: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(10,10,10,0.72)',
  },
});
