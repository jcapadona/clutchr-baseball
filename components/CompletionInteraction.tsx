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
  rep:    'Complete Rep →',
  lesson: 'Complete Rep →',
  boss:   'Close It Out →',
  save:   'Lock It In →',
};

export function completionLabelForIntent(intent: CompletionIntent) {
  return INTENT_LABELS[intent];
}

export function CompletionInteraction({
  intent = 'rep',
  label,
  disabled = false,
  onComplete,
}: Props) {
  return (
    <FinishRepButton
      label={label ?? completionLabelForIntent(intent)}
      disabled={disabled}
      onComplete={onComplete}
    />
  );
}

export function CompletionInteractionMocks({ onComplete }: { onComplete: () => void }) {
  return (
    <View style={styles.mockStack}>
      <CompletionInteraction intent="rep"    onComplete={onComplete} />
      <CompletionInteraction intent="lesson" onComplete={onComplete} />
      <CompletionInteraction intent="boss"   onComplete={onComplete} />
    </View>
  );
}

function FinishRepButton({
  label,
  disabled,
  onComplete,
}: {
  label: string;
  disabled: boolean;
  onComplete: () => void;
}) {
  const completed = useRef(false);
  const scale = useRef(new Animated.Value(1)).current;

  const finish = () => {
    if (completed.current || disabled) return;
    completed.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 100, friction: 9, useNativeDriver: true }),
    ]).start(() => onComplete());
  };

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          disabled && styles.disabled,
          pressed && !disabled && styles.buttonPressed,
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
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mockStack: { gap: Spacing.lg },
  wrap: { marginTop: Spacing.md },
  button: {
    height: 58,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.32,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonPressed: { opacity: 0.88 },
  disabled: { opacity: 0.48 },
  label: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.background,
    letterSpacing: 0.2,
  },
});
