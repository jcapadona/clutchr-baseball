import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAthlete } from '@/context/AthleteContext';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Phase = 'breath' | 'scene' | 'commitment';

interface VisualizationRepStep {
  title?: string;
  prompt?: string;
  scene_text?: string;
  cue_words?: string[];
  breath_seconds?: number;
  save_cue_to?: string;
  [key: string]: any;
}

interface Props {
  step: VisualizationRepStep;
  onComplete: () => void;
}

// ─── BREATH ANIMATION ─────────────────────────────────────────────────────────

function BreathCircle({ onDone }: { onDone: () => void }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const mountedRef = useRef(true);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [breathLabel, setBreathLabel] = useState('Breathe in');

  useEffect(() => {
    let cancelled = false;

    function cycle() {
      if (cancelled) return;
      setBreathLabel('Breathe in');
      // Expand (4s inhale)
      Animated.timing(scale, { toValue: 1, duration: 4000, useNativeDriver: true }).start(({ finished }) => {
        if (!finished || cancelled) return;
        setBreathLabel('Hold');
        // Hold (2s)
        holdTimerRef.current = setTimeout(() => {
          if (cancelled) return;
          setBreathLabel('Breathe out');
          // Contract (4s exhale)
          Animated.timing(scale, { toValue: 0.6, duration: 4000, useNativeDriver: true }).start(({ finished: f2 }) => {
            if (!f2 || cancelled) return;
            // One cycle done — advance
            if (mountedRef.current) onDone();
          });
        }, 2000);
      });
    }

    cycle();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      scale.stopAnimation();
    };
  }, []);

  const ringOpacity = scale.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0.25, 0.6],
  });

  return (
    <View style={breathStyles.container}>
      {/* Outer pulse ring */}
      <Animated.View style={[breathStyles.ring, { transform: [{ scale }], opacity: ringOpacity }]} />
      {/* Inner circle */}
      <Animated.View style={[breathStyles.circle, { transform: [{ scale }] }]}>
        <Text style={breathStyles.label}>{breathLabel}</Text>
      </Animated.View>
    </View>
  );
}

const breathStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 220,
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#0D2010',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    textAlign: 'center',
  },
});

// ─── SCENE REVEAL ─────────────────────────────────────────────────────────────

function SceneReveal({ text, onDone }: { text: string; onDone: () => void }) {
  const words = text.split(' ');
  const [revealed, setRevealed] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    let i = 0;
    function revealNext() {
      if (!mountedRef.current) return;
      if (i >= words.length) {
        // Pause 1.5s after last word, then advance
        setTimeout(() => { if (mountedRef.current) onDone(); }, 1500);
        return;
      }
      setRevealed(i + 1);
      i++;
      // Delay before next word — longer after punctuation
      const word = words[i - 1] ?? '';
      const delay = /[.!?,]$/.test(word) ? 420 : 200;
      setTimeout(revealNext, delay);
    }
    revealNext();
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <View style={sceneStyles.container}>
      <Text style={sceneStyles.text}>
        {words.slice(0, revealed).join(' ')}
        <Text style={{ color: 'transparent' }}>{words.slice(revealed).join(' ')}</Text>
      </Text>
    </View>
  );
}

const sceneStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  text: {
    fontSize: 20,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    lineHeight: 32,
    textAlign: 'center',
  },
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function VisualizationRep({ step, onComplete }: Props) {
  const { updateAthleteState } = useAthlete();
  const cueWords: string[] = step.cue_words ?? ['Locked in', 'Trust it', 'Next pitch'];
  const sceneText = step.scene_text ?? step.prompt ?? '';

  const [phase, setPhase] = useState<Phase>('breath');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function transitionTo(next: Phase) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setPhase(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  }

  async function handleCueSelect(word: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (step.save_cue_to) {
      await updateAthleteState({ [step.save_cue_to]: word } as any);
    }
    onComplete();
  }

  return (
    <View style={styles.container}>
      {/* PHASE LABEL */}
      <View style={styles.phaseRow}>
        {(['breath', 'scene', 'commitment'] as Phase[]).map((p, i) => (
          <View key={p} style={[styles.phaseDot, phase === p && styles.phaseDotActive]} />
        ))}
      </View>

      <Animated.View style={[styles.phaseContent, { opacity: fadeAnim }]}>
        {phase === 'breath' && (
          <View style={styles.breathWrap}>
            <Text style={styles.phaseTag}>RESET</Text>
            <Text style={styles.phaseTitle}>One breath before you rep it.</Text>
            <BreathCircle onDone={() => transitionTo('scene')} />
            <Pressable onPress={() => transitionTo('scene')} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip →</Text>
            </Pressable>
          </View>
        )}

        {phase === 'scene' && (
          <View style={styles.sceneWrap}>
            <Text style={styles.phaseTag}>VISUALIZE</Text>
            <SceneReveal text={sceneText || 'See yourself locked in. Calm. Ready.'} onDone={() => transitionTo('commitment')} />
          </View>
        )}

        {phase === 'commitment' && (
          <View style={styles.commitWrap}>
            <Text style={styles.phaseTag}>LOCK IN</Text>
            <Text style={styles.commitTitle}>Pick your cue word.</Text>
            <Text style={styles.commitSub}>
              This is your anchor. You'll use it when pressure hits.
            </Text>
            <View style={styles.cueGrid}>
              {cueWords.map(word => (
                <Pressable
                  key={word}
                  style={({ pressed }) => [styles.cueBtn, pressed && styles.cueBtnPressed]}
                  onPress={() => handleCueSelect(word)}
                >
                  <Text style={styles.cueBtnText}>{word}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  phaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A2A',
  },
  phaseDotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  phaseContent: {
    flex: 1,
  },
  breathWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  phaseTag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  phaseTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 27,
  },
  skipBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  skipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Inter_500Medium',
  },
  sceneWrap: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
    alignItems: 'center',
  },
  commitWrap: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.xl,
    alignItems: 'center',
  },
  commitTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  commitSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  cueGrid: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cueBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cueBtnPressed: {
    backgroundColor: '#0D2010',
    borderColor: Colors.primary,
    transform: [{ scale: 0.98 }],
  },
  cueBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
});
