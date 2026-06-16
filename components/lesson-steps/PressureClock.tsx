import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Choice {
  id: string;
  text: string;
  correct?: boolean;
}

interface PressureClockStep {
  title?: string;
  prompt?: string;
  body?: string;
  seconds?: number;
  choices?: Choice[];
  coach_feedback?: { correct?: string; incorrect?: string };
  [key: string]: any;
}

interface PressureClockResult {
  correct: boolean;
  choiceId: string | null;
  expired: boolean;
}

interface Props {
  step: PressureClockStep;
  onComplete: (result: PressureClockResult) => void;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const RADIUS = 54;
const STROKE = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function PressureClock({ step, onComplete }: Props) {
  const totalSeconds = step.seconds ?? 15;
  const choices: Choice[] = step.choices ?? [];

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [phase, setPhase] = useState<'ticking' | 'result'>('ticking');
  const [selected, setSelected] = useState<Choice | null>(null);
  const [expired, setExpired] = useState(false);

  const doneRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const resultScaleAnim = useRef(new Animated.Value(0.85)).current;

  // Countdown
  useEffect(() => {
    if (phase !== 'ticking') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        // Haptic rhythm
        if (next > 0 && next % 2 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        if (next <= 3 && next > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        if (next <= 0) {
          clearInterval(interval);
          if (!doneRef.current) {
            doneRef.current = true;
            setExpired(true);
            setPhase('result');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Result entrance animation
  useEffect(() => {
    if (phase === 'result') {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(resultScaleAnim, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
      ]).start();
    }
  }, [phase]);

  function handleChoice(choice: Choice) {
    if (doneRef.current || phase !== 'ticking') return;
    doneRef.current = true;
    setSelected(choice);
    setPhase('result');
    if (choice.correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleContinue() {
    onComplete({
      correct: selected?.correct ?? false,
      choiceId: selected?.id ?? null,
      expired,
    });
  }

  // Ring math
  const progress = timeLeft / totalSeconds;
  const ringColor = progress > 0.6
    ? Colors.primary
    : progress > 0.3
    ? '#F5C518'
    : '#FF4444';
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const SIZE = (RADIUS + STROKE) * 2;

  return (
    <View style={styles.container}>
      {/* TIMER RING */}
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          {/* Track */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#1C1C1C"
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Progress */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={ringColor}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <View style={[styles.ringCenter, { width: SIZE, height: SIZE }]}>
          <Text style={[styles.timerNum, { color: ringColor }]}>{timeLeft}</Text>
          <Text style={styles.timerLabel}>sec</Text>
        </View>
      </View>

      {/* PROMPT */}
      <Text style={styles.prompt}>{step.prompt ?? step.body ?? step.title ?? ''}</Text>

      {/* CHOICES or RESULT */}
      {phase === 'ticking' ? (
        <View style={styles.choicesWrap}>
          {choices.map(c => (
            <Pressable
              key={c.id}
              style={({ pressed }) => [styles.choiceBtn, pressed && styles.choiceBtnPressed]}
              onPress={() => handleChoice(c)}
            >
              <Text style={styles.choiceText}>{c.text}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Animated.View
          style={[styles.resultWrap, { opacity: fadeAnim, transform: [{ scale: resultScaleAnim }] }]}
        >
          {expired ? (
            <>
              <Text style={styles.resultLabel}>Time&apos;s Up</Text>
              <Text style={styles.resultSub}>Clock ran out. Next time, trust your read faster.</Text>
            </>
          ) : selected?.correct ? (
            <>
              <Text style={[styles.resultLabel, { color: Colors.primary }]}>Clutch Read</Text>
              <Text style={styles.resultSub}>
                {step.coach_feedback?.correct ?? "That's the right call under pressure."}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.resultLabel, { color: '#FF4444' }]}>Wrong Read</Text>
              <Text style={styles.resultSub}>
                {step.coach_feedback?.incorrect ?? 'Study this one. The right read is there.'}
              </Text>
            </>
          )}
          <Pressable style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Got It →</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.xl,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNum: {
    fontSize: 38,
    fontFamily: 'Inter_700Bold',
    lineHeight: 42,
  },
  timerLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1,
  },
  prompt: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },
  choicesWrap: {
    width: '100%',
    gap: Spacing.sm,
  },
  choiceBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  choiceBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  choiceText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  resultWrap: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  resultSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  continueBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  continueBtnText: {
    color: '#000',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
