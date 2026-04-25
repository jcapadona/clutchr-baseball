import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PressureBeat {
  id: string;
  scene: string;
  choices: { id: string; label: string; score: number }[];
  best_choice: string;
}

export interface PressureReplayData {
  prompt: string;
  instruction?: string;
  mode: string;
  timer_sec?: number;
  beats: PressureBeat[];
}

export interface PressureReplayResponses {
  pass_score: number;
  max_score: number;
}

export interface PressureReplayFeedback {
  success: string;
  failure: string;
}

interface Props {
  data: PressureReplayData;
  responses: PressureReplayResponses;
  feedback: PressureReplayFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PressureReplay({ data, responses, feedback, onComplete }: Props) {
  const [beatIndex, setBeatIndex] = useState(0);
  const [beatChoices, setBeatChoices] = useState<Record<string, string>>({}); // beatId → choiceId
  const [totalScore, setTotalScore] = useState(0);
  const [done, setDone] = useState(false);
  const [passed, setPassed] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(data.timer_sec ?? 0);
  const [timerStarted, setTimerStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const beats = data.beats ?? [];
  const currentBeat = beats[beatIndex];
  const isLastBeat = beatIndex >= beats.length - 1;
  const hasTimer = (data.timer_sec ?? 0) > 0;

  // Countdown timer
  useEffect(() => {
    if (!hasTimer || !timerStarted) return;
    if (timerRemaining <= 0) return;
    timerRef.current = setInterval(() => {
      setTimerRemaining((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  function startTimer() {
    setTimerStarted(true);
  }

  function animateNext(cb: () => void) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }

  function handleChoice(choiceId: string) {
    if (beatChoices[currentBeat.id]) return; // already chosen this beat
    Haptics.selectionAsync();
    const choice = currentBeat.choices.find((c) => c.id === choiceId);
    const score = choice?.score ?? 0;
    const newTotal = totalScore + score;
    const isBest = choiceId === currentBeat.best_choice;
    if (isBest) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setBeatChoices((prev) => ({ ...prev, [currentBeat.id]: choiceId }));
    setTotalScore(newTotal);

    // Auto-advance after short delay
    setTimeout(() => {
      if (isLastBeat) {
        const pass = newTotal >= responses.pass_score;
        setPassed(pass);
        setDone(true);
        onComplete(pass);
      } else {
        animateNext(() => setBeatIndex((i) => i + 1));
      }
    }, 700);
  }

  const timerFraction = hasTimer ? timerRemaining / (data.timer_sec ?? 1) : 0;

  return (
    <View style={styles.container}>
      {/* Timer */}
      {hasTimer && (
        <View style={styles.timerRow}>
          <View style={styles.timerTrack}>
            <View style={[styles.timerFill, { width: `${timerFraction * 100}%` as any }]} />
          </View>
          <Text style={styles.timerText}>{timerRemaining}s</Text>
          {!timerStarted && (
            <Pressable style={styles.timerStartBtn} onPress={startTimer}>
              <Ionicons name="play" size={12} color={Colors.primary} />
              <Text style={styles.timerStartText}>Start</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Beat indicator */}
      <View style={styles.beatDots}>
        {beats.map((_, i) => (
          <View
            key={i}
            style={[
              styles.beatDot,
              i < beatIndex && styles.beatDotDone,
              i === beatIndex && !done && styles.beatDotActive,
            ]}
          />
        ))}
      </View>

      {!done ? (
        <Animated.View style={[styles.beatCard, { opacity: fadeAnim }]}>
          <Text style={styles.beatScene}>{currentBeat?.scene}</Text>
          <View style={styles.choiceList}>
            {currentBeat?.choices.map((choice) => {
              const chosen = beatChoices[currentBeat.id] === choice.id;
              const isBest = choice.id === currentBeat.best_choice;
              const isAnswered = !!beatChoices[currentBeat.id];
              return (
                <Pressable
                  key={choice.id}
                  style={[
                    styles.choiceBtn,
                    chosen && styles.choiceBtnSelected,
                    isAnswered && chosen && isBest && styles.choiceBtnCorrect,
                    isAnswered && chosen && !isBest && styles.choiceBtnWrong,
                  ]}
                  onPress={() => handleChoice(choice.id)}
                  disabled={isAnswered}
                >
                  <View style={[
                    styles.choiceDot,
                    isAnswered && chosen && isBest && styles.choiceDotCorrect,
                    isAnswered && chosen && !isBest && styles.choiceDotWrong,
                  ]}>
                    {isAnswered && chosen && isBest && <Ionicons name="checkmark" size={11} color="#fff" />}
                    {isAnswered && chosen && !isBest && <Ionicons name="close" size={11} color="#fff" />}
                  </View>
                  <Text style={[
                    styles.choiceText,
                    isAnswered && chosen && isBest && styles.choiceTextCorrect,
                  ]}>
                    {choice.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      ) : (
        /* Results summary */
        <View style={[styles.resultCard, passed ? styles.resultPass : styles.resultFail]}>
          <View style={styles.resultIcon}>
            <Ionicons
              name={passed ? 'checkmark' : 'refresh'}
              size={22}
              color={Colors.background}
            />
          </View>
          <View style={styles.resultScoreRow}>
            <Text style={[styles.resultScore, { color: passed ? Colors.primary : Colors.warning }]}>
              {totalScore} / {responses.max_score}
            </Text>
            <Text style={styles.resultLabel}>RESET SCORE</Text>
          </View>
          <Text style={styles.resultText}>
            {passed ? feedback.success : feedback.failure}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timerTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  timerText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    minWidth: 28,
    textAlign: 'right',
  },
  timerStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  timerStartText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  beatDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  beatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  beatDotDone: { backgroundColor: Colors.primary, opacity: 0.5 },
  beatDotActive: { backgroundColor: Colors.primary },
  beatCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.lg,
  },
  beatScene: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  choiceList: { gap: Spacing.sm },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceBtnSelected: { borderColor: Colors.primary },
  choiceBtnCorrect: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  choiceBtnWrong: { borderColor: Colors.danger, backgroundColor: 'rgba(255,59,48,0.08)' },
  choiceDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  choiceDotCorrect: { backgroundColor: Colors.primary },
  choiceDotWrong: { backgroundColor: Colors.danger },
  choiceText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  choiceTextCorrect: { color: Colors.textPrimary, fontFamily: 'Inter_500Medium' },
  resultCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    alignItems: 'center',
  },
  resultPass: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryMuted },
  resultFail: { borderColor: Colors.warning, backgroundColor: 'rgba(255,183,0,0.06)' },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultScoreRow: { alignItems: 'center', gap: 2 },
  resultScore: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    lineHeight: 40,
  },
  resultLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
