import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAthlete } from '@/context/AthleteContext';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface OneWordLockStep {
  type?: string;
  prompt?: string;
  scenario?: string;
  word_bank?: string[];
  allow_custom?: boolean;
  save_to?: string;
  cue?: string;
  [key: string]: any;
}

interface Props {
  step: OneWordLockStep;
  onComplete: () => void;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const DEFAULT_BANK = ['RESET', 'ATTACK', 'CALM', 'NEXT', 'COMPETE', 'LOCKED'];
const DEFAULT_PROMPT = 'Lock one word for this rep.';

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function OneWordLock({ step, onComplete }: Props) {
  const { updateAthleteState } = useAthlete();

  const rawBank: string[] =
    Array.isArray(step.word_bank) && step.word_bank.length > 0
      ? step.word_bank
      : DEFAULT_BANK;
  const wordBank = rawBank.map((w) => w.toUpperCase());
  const prompt = step.prompt ?? DEFAULT_PROMPT;
  const allowCustom = step.allow_custom ?? false;

  const [bankSelection, setBankSelection] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState('');
  const [locked, setLocked] = useState(false);
  const [lockedWord, setLockedWord] = useState('');

  const selectFade = useRef(new Animated.Value(1)).current;
  const lockScale = useRef(new Animated.Value(0.5)).current;
  const lockOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  // Bank tap takes priority; fall back to first word of custom input
  const customWord =
    customInput.trim() ? customInput.trim().split(/\s+/)[0].toUpperCase() : null;
  const effectiveWord = bankSelection ?? customWord;

  function handleBankTap(word: string) {
    Haptics.selectionAsync();
    setBankSelection(word);
    setCustomInput('');
    setCustomError('');
  }

  function handleCustomChange(text: string) {
    setCustomInput(text);
    setBankSelection(null);
    setCustomError('');
  }

  function handleLock() {
    if (!effectiveWord) return;

    if (allowCustom && !bankSelection && customInput.trim().includes(' ')) {
      setCustomError(`Using first word: ${effectiveWord}`);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLockedWord(effectiveWord);

    if (step.save_to) {
      // TODO: save_to writes a dynamic key — not typed in AthleteState; deferred to profile schema expansion
      updateAthleteState({ [step.save_to]: effectiveWord } as any);
    }

    Animated.timing(selectFade, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setLocked(true);
      Animated.parallel([
        Animated.spring(lockScale, {
          toValue: 1,
          tension: 70,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(lockOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(btnOpacity, {
          toValue: 1,
          duration: 350,
          delay: 320,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.tag}>ONE WORD LOCK</Text>

      {!locked ? (
        <Animated.View style={[styles.selectPhase, { opacity: selectFade }]}>
          {/* SITUATION CARD */}
          {step.scenario ? (
            <View style={styles.scenarioCard}>
              <Text style={styles.scenarioLabel}>SITUATION</Text>
              <Text style={styles.scenarioText}>{step.scenario}</Text>
            </View>
          ) : null}

          {/* PROMPT */}
          <Text style={styles.prompt}>{prompt}</Text>

          {/* WORD BANK */}
          <View style={styles.chipGrid}>
            {wordBank.map((word) => (
              <Pressable
                key={word}
                style={[
                  styles.chip,
                  bankSelection === word && styles.chipActive,
                ]}
                onPress={() => handleBankTap(word)}
              >
                <Text
                  style={[
                    styles.chipText,
                    bankSelection === word && styles.chipTextActive,
                  ]}
                >
                  {word}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* CUSTOM INPUT */}
          {allowCustom && (
            <View style={styles.customWrap}>
              <TextInput
                style={[
                  styles.customInput,
                  customWord !== null && !bankSelection && styles.customInputActive,
                ]}
                value={customInput}
                onChangeText={handleCustomChange}
                placeholder="Or type your word"
                placeholderTextColor="rgba(255,255,255,0.22)"
                autoCapitalize="characters"
                returnKeyType="done"
                maxLength={24}
              />
              {customError ? (
                <Text style={styles.customError}>{customError}</Text>
              ) : null}
            </View>
          )}

          {/* LOCK BUTTON */}
          <Pressable
            style={[styles.lockBtn, !effectiveWord && styles.lockBtnOff]}
            onPress={handleLock}
            disabled={!effectiveWord}
          >
            <Text
              style={[
                styles.lockBtnText,
                !effectiveWord && styles.lockBtnTextOff,
              ]}
            >
              Lock It In →
            </Text>
          </Pressable>
        </Animated.View>
      ) : (
        <View style={styles.lockedPhase}>
          <Animated.View
            style={[
              styles.lockedWrap,
              { transform: [{ scale: lockScale }], opacity: lockOpacity },
            ]}
          >
            <Text style={styles.lockedWord}>{lockedWord}</Text>
            <View style={styles.lockedDivider} />
            <Text style={styles.lockedLabel}>WORD LOCKED</Text>
          </Animated.View>

          <Animated.View style={[styles.continueBtnWrap, { opacity: btnOpacity }]}>
            <Pressable style={styles.continueBtn} onPress={onComplete}>
              <Text style={styles.continueBtnText}>Continue →</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  tag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
  },

  // ── Select phase ──────────────────────────────────────────────────────────
  selectPhase: {
    flex: 1,
    gap: Spacing.lg,
  },
  scenarioCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  scenarioLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.warning,
    letterSpacing: 2,
  },
  scenarioText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  prompt: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 29,
  },

  // ── Chip grid ─────────────────────────────────────────────────────────────
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chipActive: {
    backgroundColor: '#0D2010',
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: Colors.primary,
  },

  // ── Custom input ──────────────────────────────────────────────────────────
  customWrap: {
    gap: Spacing.xs,
  },
  customInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  customInputActive: {
    borderColor: Colors.primary,
    backgroundColor: '#0D2010',
  },
  customError: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.warning,
    paddingHorizontal: Spacing.xs,
  },

  // ── Lock button ────────────────────────────────────────────────────────────
  lockBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
  lockBtnOff: {
    backgroundColor: '#1A1A1A',
  },
  lockBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
  lockBtnTextOff: {
    color: 'rgba(255,255,255,0.2)',
  },

  // ── Locked phase ──────────────────────────────────────────────────────────
  lockedPhase: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxxl,
  },
  lockedWrap: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  lockedWord: {
    fontSize: 62,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  lockedDivider: {
    width: 48,
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.5,
    borderRadius: 1,
  },
  lockedLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 3,
  },

  // ── Continue button ────────────────────────────────────────────────────────
  continueBtnWrap: {
    width: '100%',
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
});
