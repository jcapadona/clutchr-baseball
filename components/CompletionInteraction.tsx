import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Radius, Spacing } from '@/constants/theme';

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

  const finish = () => {
    if (completed.current || disabled) return;
    completed.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.98, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 90, friction: 8, useNativeDriver: true }),
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
          colors={disabled ? ['#182019', '#141814'] : ['#23D160', '#18A84A']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.finishIconWrap}>
          <Ionicons name={cardMode ? 'baseball' : 'checkmark'} size={18} color="#050806" />
        </View>
        <View style={styles.finishCopy}>
          <Text style={styles.finishLabel}>{label}</Text>
          <Text style={styles.finishSub}>{cardMode ? 'Close the frame.' : 'Log the rep and load what is next.'}</Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#050806" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mockStack: { gap: Spacing.lg },
  wrap: { gap: Spacing.sm, marginTop: Spacing.md },
  finishButton: {
    minHeight: 68,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(35,209,96,0.38)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowColor: '#23D160',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  cardFinishButton: { minHeight: 76, borderRadius: Radius.xl },
  finishButtonPressed: { transform: [{ scale: 0.99 }], opacity: 0.94 },
  disabled: { opacity: 0.48 },
  finishIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(5,8,6,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishCopy: { flex: 1, gap: 2 },
  finishLabel: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#050806',
    letterSpacing: 0.2,
  },
  finishSub: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(5,8,6,0.72)',
  },
});
