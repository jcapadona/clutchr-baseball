import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimingTrackData {
  prompt: string;
  instruction: string;
  reps: number;
  duration_ms: number;
  perfect_window_ms: number;
  early_window_ms: number;
}

export interface TimingTrackResponses {
  pass_perfect: number;
}

export interface TimingTrackFeedback {
  synced: string;
  rushing: string;
}

interface Props {
  data: TimingTrackData;
  responses: TimingTrackResponses;
  feedback: TimingTrackFeedback;
  onComplete: (passed: boolean) => void;
}

type TapResult = 'PERFECT' | 'EARLY' | 'LATE';

// ─── Component ────────────────────────────────────────────────────────────────

const RING_MIN = 0.15;
const RING_MAX = 1.0;

export default function TimingTrack({ data, responses, feedback, onComplete }: Props) {
  const totalReps = data.reps ?? 5;
  const duration = data.duration_ms ?? 1800;
  const perfectWindow = data.perfect_window_ms ?? 220;
  const earlyWindow = data.early_window_ms ?? 400;

  const [phase, setPhase] = useState<'intro' | 'running' | 'done'>('intro');
  const [repIndex, setRepIndex] = useState(0);
  const [results, setResults] = useState<TapResult[]>([]);
  const [lastResult, setLastResult] = useState<TapResult | null>(null);
  const [missed, setMissed] = useState(false);

  const ringAnim = useRef(new Animated.Value(RING_MIN)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const resultFade = useRef(new Animated.Value(0)).current;
  const startTimeRef = useRef<number>(0);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => {
    animRef.current?.stop();
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    resultFade.stopAnimation();
    ringAnim.stopAnimation();
    opacityAnim.stopAnimation();
  }, [opacityAnim, resultFade, ringAnim]);

  const pulseResult = useCallback((result: TapResult) => {
    setLastResult(result);
    resultFade.setValue(1);
    Animated.timing(resultFade, { toValue: 0, duration: 700, useNativeDriver: true }).start();
  }, [resultFade]);

  const startRep = useCallback(() => {
    setMissed(false);
    ringAnim.setValue(RING_MIN);
    opacityAnim.setValue(1);
    startTimeRef.current = Date.now();

    animRef.current = Animated.timing(ringAnim, {
      toValue: RING_MAX,
      duration,
      useNativeDriver: false,
    });

    animRef.current.start(({ finished }) => {
      if (!finished) return;
      // Missed — auto-advance
      setMissed(true);
      pulseResult('LATE');
      setResults((prev) => {
        const next: TapResult[] = [...prev, 'LATE'];
        if (next.length >= totalReps) {
          timeoutRefs.current.push(setTimeout(() => finalize(next), 500));
        }
        return next;
      });
      timeoutRefs.current.push(setTimeout(() => {
        setRepIndex((r) => r + 1);
      }, 800));
    });
  }, [ringAnim, opacityAnim, duration, pulseResult, totalReps]);

  function finalize(final: TapResult[]) {
    const perfects = final.filter((r) => r === 'PERFECT').length;
    const passed = perfects >= (responses.pass_perfect ?? 3);
    setPhase('done');
    onComplete(passed);
  }

  useEffect(() => {
    if (phase === 'running' && repIndex < totalReps) {
      const delay = repIndex === 0 ? 300 : 600;
      const t = setTimeout(startRep, delay);
      return () => clearTimeout(t);
    }
  }, [phase, repIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTap() {
    if (phase !== 'running' || missed) return;

    const elapsed = Date.now() - startTimeRef.current;
    const total = duration;
    const target = total * 0.82; // ring hits center at ~82% of travel (visual sweet spot)
    const diff = Math.abs(elapsed - target);

    let result: TapResult;
    if (diff <= perfectWindow / 2) {
      result = 'PERFECT';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (elapsed < target - earlyWindow / 2) {
      result = 'EARLY';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      result = 'LATE';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    animRef.current?.stop();
    pulseResult(result);

    setResults((prev) => {
      const next = [...prev, result];
      if (next.length >= totalReps) {
        timeoutRefs.current.push(setTimeout(() => finalize(next), 600));
      }
      return next;
    });
    setRepIndex((r) => r + 1);
  }

  const ringSize = ringAnim.interpolate({
    inputRange: [RING_MIN, RING_MAX],
    outputRange: [40, 200],
  });
  const ringOpacity = ringAnim.interpolate({
    inputRange: [RING_MIN, 0.85, RING_MAX],
    outputRange: [0.9, 1, 0.3],
  });
  const ringColor = ringAnim.interpolate({
    inputRange: [RING_MIN, 0.7, 0.85, RING_MAX],
    outputRange: [Colors.primary, Colors.primary, Colors.warning, Colors.danger],
  });

  const perfects = results.filter((r) => r === 'PERFECT').length;
  const passed = phase === 'done' && perfects >= (responses.pass_perfect ?? 3);

  return (
    <View style={styles.container}>
      {/* Prompt */}
      <View style={styles.promptBlock}>
        <View style={styles.promptBadge}>
          <Ionicons name="eye" size={9} color={Colors.primary} />
          <Text style={styles.promptBadgeText}>VISUAL REP</Text>
        </View>
        <Text style={styles.promptText}>{data.prompt}</Text>
        <Text style={styles.instruction}>{data.instruction}</Text>
      </View>

      {phase === 'intro' && (
        <Pressable style={styles.startBtn} onPress={() => setPhase('running')}>
          <Ionicons name="play" size={18} color={Colors.background} />
          <Text style={styles.startText}>Begin Timing Rep</Text>
        </Pressable>
      )}

      {phase === 'running' && (
        <Pressable style={styles.arena} onPress={handleTap}>
          {/* Target bullseye */}
          <View style={styles.target}>
            <View style={styles.targetInner} />
          </View>

          {/* Expanding ring */}
          <Animated.View
            style={[
              styles.ring,
              {
                width: ringSize,
                height: ringSize,
                borderRadius: 150,
                borderColor: ringColor,
                opacity: ringOpacity,
              },
            ]}
            pointerEvents="none"
          />

          {/* Result flash */}
          <Animated.Text style={[styles.resultFlash, { opacity: resultFade }]}>
            {lastResult}
          </Animated.Text>

          {/* Tap cue */}
          <Text style={styles.tapCue}>TAP</Text>
        </Pressable>
      )}

      {/* Rep dots */}
      <View style={styles.repDots}>
        {Array.from({ length: totalReps }).map((_, i) => {
          const result = results[i];
          return (
            <View
              key={i}
              style={[
                styles.repDot,
                result === 'PERFECT' && styles.repDotPerfect,
                result === 'EARLY' && styles.repDotEarly,
                result === 'LATE' && styles.repDotLate,
                i === repIndex && phase === 'running' && !result && styles.repDotActive,
              ]}
            />
          );
        })}
      </View>

      {/* Rep counter during play */}
      {phase === 'running' && (
        <View style={styles.repCounter}>
          <Text style={styles.repCounterText}>
            REP {Math.min(repIndex + 1, totalReps)} / {totalReps}
          </Text>
          <Text style={[styles.repPerfectCount, perfects > 0 && styles.repPerfectActive]}>
            {perfects} PERFECT
          </Text>
        </View>
      )}

      {/* Results summary */}
      {phase === 'done' && (
        <View style={[styles.doneCard, passed ? styles.donePass : styles.doneFail]}>
          <View style={styles.doneScoreRow}>
            <Text style={[styles.doneScore, { color: passed ? Colors.primary : Colors.warning }]}>
              {perfects} / {totalReps}
            </Text>
            <Text style={styles.doneScoreLabel}>PERFECT</Text>
          </View>
          <Text style={styles.doneFeedback}>
            {passed ? feedback.synced : feedback.rushing}
          </Text>
          {!passed && (
            <Pressable style={styles.retryBtn} onPress={() => {
              setPhase('intro');
              setRepIndex(0);
              setResults([]);
              setLastResult(null);
            }}>
              <Ionicons name="refresh" size={13} color={Colors.primary} />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },

  promptBlock: { gap: Spacing.sm },
  promptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  promptBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1.2 },
  promptText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, lineHeight: 22 },
  instruction: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  startText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.background },

  arena: {
    height: 220,
    backgroundColor: '#0D0D0D',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  target: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  targetInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2.5,
    backgroundColor: 'transparent',
  },
  resultFlash: {
    position: 'absolute',
    bottom: 20,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
  },
  tapCue: {
    position: 'absolute',
    top: 16,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 2,
  },

  repDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  repDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
  },
  repDotPerfect: { backgroundColor: Colors.primary },
  repDotEarly: { backgroundColor: Colors.warning },
  repDotLate: { backgroundColor: Colors.danger, opacity: 0.6 },
  repDotActive: { backgroundColor: `${Colors.primary}55`, width: 14, borderRadius: 7 },

  repCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repCounterText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary },
  repPerfectCount: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textTertiary },
  repPerfectActive: { color: Colors.primary },

  doneCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  donePass: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryMuted },
  doneFail: { borderColor: Colors.warning, backgroundColor: 'rgba(245,166,35,0.07)' },
  doneScoreRow: { alignItems: 'center', gap: 2 },
  doneScore: { fontSize: 40, fontFamily: 'Inter_700Bold', lineHeight: 44 },
  doneScoreLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1.5 },
  doneFeedback: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  retryText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
});
