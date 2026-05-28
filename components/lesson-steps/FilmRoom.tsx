import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Choice {
  id: string;
  text: string;
  correct?: boolean;
}

interface FilmRoomStep {
  title?: string;
  prompt?: string;
  body?: string;
  study_seconds?: number;
  question?: string;
  choices?: Choice[];
  scene_tags?: string[];
  coach_feedback?: { correct?: string; incorrect?: string };
  [key: string]: any;
}

interface FilmRoomResult {
  correct: boolean;
  choiceId: string | null;
}

interface Props {
  step: FilmRoomStep;
  onComplete: (result: FilmRoomResult) => void;
}

// ─── DIAMOND ─────────────────────────────────────────────────────────────────

function DiamondScene({ sceneTags }: { sceneTags: string[] }) {
  const hasRunner = (base: string) =>
    sceneTags.some(t => t.toLowerCase().includes(base));

  const runners = {
    first:  hasRunner('runner_1') || hasRunner('runners_1'),
    second: hasRunner('runner_2') || hasRunner('runners_12') || hasRunner('runners_23'),
    third:  hasRunner('runner_3') || hasRunner('runners_13') || hasRunner('runners_23'),
  };

  // Diamond coords — 120x120 SVG, home at bottom
  const home  = { x: 60, y: 108 };
  const first = { x: 108, y: 60 };
  const sec   = { x: 60, y: 12 };
  const third = { x: 12, y: 60 };

  const basePos = [
    { pos: home,  label: 'H', active: false },
    { pos: first, label: '1', active: runners.first },
    { pos: sec,   label: '2', active: runners.second },
    { pos: third, label: '3', active: runners.third },
  ];

  return (
    <Svg width={120} height={120}>
      {/* Baseline paths */}
      <Line x1={home.x} y1={home.y} x2={first.x} y2={first.y} stroke="#2A2A2A" strokeWidth={1.5} />
      <Line x1={first.x} y1={first.y} x2={sec.x} y2={sec.y} stroke="#2A2A2A" strokeWidth={1.5} />
      <Line x1={sec.x} y1={sec.y} x2={third.x} y2={third.y} stroke="#2A2A2A" strokeWidth={1.5} />
      <Line x1={third.x} y1={third.y} x2={home.x} y2={home.y} stroke="#2A2A2A" strokeWidth={1.5} />
      {/* Bases */}
      {basePos.map(({ pos, active }) => (
        <Circle
          key={`${pos.x}-${pos.y}`}
          cx={pos.x}
          cy={pos.y}
          r={9}
          fill={active ? Colors.primary : '#1C1C1C'}
          stroke={active ? Colors.primary : '#333'}
          strokeWidth={1.5}
        />
      ))}
    </Svg>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function FilmRoom({ step, onComplete }: Props) {
  const studyMs = (step.study_seconds ?? 6) * 1000;
  const choices: Choice[] = step.choices ?? [];
  const sceneTags: string[] = step.scene_tags ?? [];

  const [phase, setPhase] = useState<'study' | 'question' | 'reveal'>('study');
  const [selected, setSelected] = useState<Choice | null>(null);
  const [studyProgress, setStudyProgress] = useState(0);

  const sceneOpacity = useRef(new Animated.Value(1)).current;
  const resultFade = useRef(new Animated.Value(0)).current;
  const studyStart = useRef(Date.now());

  // Study timer — progress bar + fade out
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - studyStart.current;
      const pct = Math.min(1, elapsed / studyMs);
      setStudyProgress(pct);
      if (pct >= 1) {
        clearInterval(interval);
        // Fade scene to near-invisible, then show question
        Animated.timing(sceneOpacity, {
          toValue: 0.1,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setPhase('question'));
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase === 'reveal') {
      Animated.timing(resultFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [phase]);

  function handleChoice(choice: Choice) {
    if (selected || phase !== 'question') return;
    setSelected(choice);
    Animated.timing(sceneOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setPhase('reveal');
  }

  function handleContinue() {
    onComplete({ correct: selected?.correct ?? false, choiceId: selected?.id ?? null });
  }

  const isQuestionOrReveal = phase === 'question' || phase === 'reveal';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* SCENE CARD */}
      <Animated.View style={[styles.sceneCard, { opacity: sceneOpacity }]}>
        <View style={styles.sceneHeader}>
          <Text style={styles.sceneTag}>FILM ROOM</Text>
          {phase === 'study' && (
            <Text style={styles.sceneTimer}>{step.study_seconds ?? 6}s</Text>
          )}
        </View>

        {/* Diamond */}
        <View style={styles.diamondWrap}>
          <DiamondScene sceneTags={sceneTags} />
        </View>

        {/* Context tags */}
        {sceneTags.length > 0 && (
          <View style={styles.tagRow}>
            {sceneTags.map(t => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Study progress bar */}
        {phase === 'study' && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${studyProgress * 100}%` }]} />
          </View>
        )}
      </Animated.View>

      {/* PROMPT/QUESTION */}
      <Text style={styles.question}>
        {isQuestionOrReveal
          ? (step.question ?? step.prompt ?? "What's the right play?")
          : (step.prompt ?? step.body ?? step.title ?? 'Study the situation.')}
      </Text>

      {/* CHOICES */}
      {phase === 'question' && (
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
      )}

      {/* RESULT */}
      {phase === 'reveal' && (
        <Animated.View style={[styles.resultWrap, { opacity: resultFade }]}>
          {selected?.correct ? (
            <Text style={[styles.resultLabel, { color: Colors.primary }]}>Right Read</Text>
          ) : (
            <Text style={[styles.resultLabel, { color: '#FF4444' }]}>Wrong Read</Text>
          )}
          <Text style={styles.resultSub}>
            {selected?.correct
              ? (step.coach_feedback?.correct ?? 'Good film study. You saw it.')
              : (step.coach_feedback?.incorrect ?? 'Watch this one again. The tell is there.')}
          </Text>
          <Pressable style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Got It →</Text>
          </Pressable>
        </Animated.View>
      )}
    </ScrollView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  sceneCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#1C1C1C',
  },
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sceneTag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
  },
  sceneTimer: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.4)',
  },
  diamondWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: '#1A1A1A',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_400Regular',
    textTransform: 'capitalize',
  },
  progressTrack: {
    height: 2,
    backgroundColor: '#1C1C1C',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  question: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  choicesWrap: {
    gap: Spacing.sm,
    minHeight: 120,
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
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
