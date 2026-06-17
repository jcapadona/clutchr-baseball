import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { H } from '@/utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { supabase } from '@/lib/supabase';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { stopSpeech } from '@/lib/lessonAudio';
import { ClutchrHeader } from '@/components/ClutchrHeader';
import { CompletionInteraction, type CompletionIntent } from '@/components/CompletionInteraction';
import { EmblemBadge } from '@/components/EmblemBadge';
import { getCurrentRank, getRankProgress, getRankProgressPercent } from '@/lib/progressionRanks';

import { useMicrocopy } from '@/hooks/useMicrocopy';
import StrikeZoneVisualizer from '@/components/StrikeZoneVisualizer';
import PitchSequenceChess from '@/components/PitchSequenceChess';
import FieldIQBoard from '@/components/FieldIQBoard';
import ThrowDecisionBoard from '@/components/ThrowDecisionBoard';
import LeverageLadder from '@/components/LeverageLadder';
import RoutineCardBuilder from '@/components/RoutineCardBuilder';
import PressureReplay from '@/components/PressureReplay';
import SnapshotRead from '@/components/SnapshotRead';
import JumpRead from '@/components/JumpRead';
import TimingTrack from '@/components/TimingTrack';
import ConfidenceSlider from '@/components/ConfidenceSlider';
import PitchCountBoard from '@/components/PitchCountBoard';
import PressureClock from '@/components/lesson-steps/PressureClock';
import FilmRoom from '@/components/lesson-steps/FilmRoom';
import BuildYourRep from '@/components/lesson-steps/BuildYourRep';
import HotRead from '@/components/lesson-steps/HotRead';
import VisualizationRep from '@/components/lesson-steps/VisualizationRep';
import OneWordLock from '@/components/lesson-steps/OneWordLock';
import DragSequence from '@/components/lesson-steps/DragSequence';
import DiamondCursor from '@/components/DiamondCursor';

const LESSON_BACKGROUNDS = {
  boss: require('../../assets/backgrounds/boss-battle-entrance.png'),
  pressure: require('../../assets/backgrounds/pressure-rep-background.png'),
  scenario: require('../../assets/backgrounds/scenario-pick-screen.png'),
  default: require('../../assets/backgrounds/lesson-background-screen.png'),
};

const completionBg = require('../../assets/backgrounds/lesson-completion-background.png');
const completionGlow = require('../../assets/overlays/completion-glow.png');
const ccsTakeIcon = require('../../assets/icons/coach-cap-ccs-take.png');

const STEP_TYPE_ICONS: Record<string, any> = {
  choice: require('../../assets/icons/scenario-pick.png'),
  notice_wonder: require('../../assets/icons/freeze-frame-icon.png'),
  checklist: require('../../assets/icons/routine-builder.png'),
  action: require('../../assets/icons/clipboard-icon.png'),
  boss: require('../../assets/icons/boss-challenge-icon.png'),
};

// ─── SELF-RATING CHECK-IN ─────────────────────────────────────────────────────

const RATING_QUESTIONS: Record<string, { key: string; question: string }[]> = {
  pitcher:   [{ key: 'composure', question: 'How steady were you under pressure?' }, { key: 'focus', question: 'How sharp was your focus on each pitch?' }, { key: 'reset_skill', question: 'How well did you reset between mistakes?' }],
  catcher:   [{ key: 'composure', question: 'How calm were you calling the game?' }, { key: 'confidence', question: 'How confident were your pitch calls?' }, { key: 'focus', question: 'How locked in were you to the situation?' }],
  infielder: [{ key: 'composure', question: 'How composed were you on tough plays?' }, { key: 'reset_skill', question: 'How fast did you move on from errors?' }, { key: 'focus', question: 'How sharp was your pre-pitch preparation?' }],
  outfielder:[{ key: 'composure', question: 'How steady were you on pressure reads?' }, { key: 'focus', question: 'How early were you picking up the ball?' }, { key: 'reset_skill', question: 'How well did you reset after misreads?' }],
  default:   [{ key: 'composure', question: 'How steady did you feel under pressure?' }, { key: 'confidence', question: 'How confident did you feel overall?' }, { key: 'focus', question: 'How focused were you throughout?' }],
};

function DotRating({ value, onChange, color = Colors.primary }: { value: number; onChange: (v: number) => void; color?: string }) {
  return (
    <View style={ratingStyles.dotsRow}>
      {[1,2,3,4,5].map((n) => (
        <Pressable key={n} onPress={() => { H.select(); onChange(n); }} hitSlop={8}
          style={[ratingStyles.dot, value >= n ? { backgroundColor: color, borderColor: color } : { backgroundColor: 'transparent', borderColor: Colors.border }]}>
          {value >= n && <View style={[ratingStyles.dotFill, { backgroundColor: color }]} />}
        </Pressable>
      ))}
      <Text style={[ratingStyles.dotLabel, value > 0 && { color }]}>
        {value===0?'—':value===1?'Low':value===2?'Okay':value===3?'Solid':value===4?'Strong':'Elite'}
      </Text>
    </View>
  );
}

function SelfRatingCheckIn({ role, lessonTitle, isBoss, onSubmit }: { role: string; lessonTitle: string; isBoss: boolean; onSubmit: (r: Record<string, number>) => void }) {
  const questions = RATING_QUESTIONS[role] ?? RATING_QUESTIONS.default;
  const [ratings, setRatings] = useState<Record<string, number>>(Object.fromEntries(questions.map((q) => [q.key, 0])));
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    H.success();
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);
  const allRated = Object.values(ratings).every((v) => v > 0);
  return (
    <Animated.View style={[checkInStyles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[checkInStyles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={checkInStyles.headerRow}>
          <View style={checkInStyles.iconWrap}><Ionicons name={isBoss ? 'trophy' : 'flag'} size={18} color={isBoss ? Colors.warning : Colors.info} /></View>
          <View style={{ flex: 1 }}>
            <Text style={checkInStyles.eyebrow}>{isBoss ? 'BOSS COMPLETE' : 'CHECKPOINT CLEARED'}</Text>
            <Text style={checkInStyles.title} numberOfLines={1}>{lessonTitle}</Text>
          </View>
        </View>
        <View style={checkInStyles.divider} />
        <Text style={checkInStyles.prompt}>Rate yourself honestly. This updates your training focus.</Text>
        <View style={checkInStyles.questions}>
          {questions.map((q) => (
            <View key={q.key} style={checkInStyles.questionRow}>
              <Text style={checkInStyles.questionText}>{q.question}</Text>
              <DotRating value={ratings[q.key]??0} onChange={(v) => setRatings((p) => ({...p,[q.key]:v}))} color={isBoss ? Colors.warning : Colors.primary} />
            </View>
          ))}
        </View>
        <Pressable style={[checkInStyles.submitBtn, !allRated && checkInStyles.submitBtnDisabled, isBoss && allRated && checkInStyles.submitBtnBoss]}
          onPress={() => { if (!allRated) return; H.success(); onSubmit(ratings); }} disabled={!allRated}>
          <Text style={[checkInStyles.submitBtnText, !allRated && { color: Colors.textTertiary }]}>{allRated ? 'See Results →' : 'Rate all three to continue'}</Text>
        </Pressable>
        <Text style={checkInStyles.hint}>Honest ratings help Clutchr surface the right next lesson for you.</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ─── UI VARIANT ROUTER ────────────────────────────────────────────────────────

function VariantRenderer({ step, onAdvance }: { step: any; onAdvance: (passed?: boolean) => void }) {
  const firedRef = useRef(false);
  const variantKey = `${step?.ui_variant ?? 'unsupported'}:${step?.id ?? step?.prompt ?? step?.title ?? ''}`;

  useEffect(() => {
    firedRef.current = false;
  }, [variantKey]);

  const handleComplete = useCallback((passed: boolean) => {
    if (firedRef.current) return;
    firedRef.current = true;
    setTimeout(() => onAdvance(passed), 1800);
  }, [onAdvance]);

  const props = { data: step?.data ?? {}, responses: step?.responses ?? {}, feedback: step?.feedback ?? {}, onComplete: handleComplete };
  switch (step?.ui_variant) {
    case 'strike_zone_visualizer':   return <StrikeZoneVisualizer key={variantKey} {...props} />;
    case 'pitch_sequence_chess':     return <PitchSequenceChess key={variantKey} {...props} />;
    case 'field_iq_board':           return <FieldIQBoard key={variantKey} {...props} />;
    case 'throw_decision_board':     return <ThrowDecisionBoard key={variantKey} {...props} />;
    case 'leverage_ladder':          return <LeverageLadder key={variantKey} {...props} />;
    case 'routine_card_builder':     return <RoutineCardBuilder key={variantKey} {...props} />;
    case 'pressure_replay':          return <PressureReplay key={variantKey} {...props} />;
    case 'snapshot_read':            return <SnapshotRead key={variantKey} {...props} />;
    case 'jump_read':                return <JumpRead key={variantKey} {...props} />;
    case 'timing_track':             return <TimingTrack key={variantKey} {...props} />;
    case 'confidence_slider':        return <ConfidenceSlider key={variantKey} {...props} />;
    case 'pitch_count_board':        return <PitchCountBoard key={variantKey} {...props} />;
    case 'diamond_cursor':           return <DiamondCursor key={variantKey} {...props} />;
    case 'film_room': {
      // Merge data + feedback into step-like shape FilmRoom expects
      const filmStep = { ...(step?.data ?? {}), coach_feedback: step?.feedback ? { correct: step.feedback.correct, incorrect: step.feedback.wrong ?? step.feedback.poor } : undefined };
      return <FilmRoom key={variantKey} step={filmStep} onComplete={(r) => handleComplete(r.correct)} />;
    }
    default:
      return (
        <View style={stepRouterStyles.fallbackCard}>
          <Ionicons name="alert-circle" size={18} color={Colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={stepRouterStyles.fallbackTitle}>This rep needs cleanup.</Text>
            <Text style={stepRouterStyles.fallbackText}>This interactive setup is unsupported or missing data. Skip this step and keep the session moving.</Text>
          </View>
          <AdvanceButton label="Skip Step →" onPress={() => onAdvance(false)} />
        </View>
      );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP RENDERERS — Each has its own distinct visual identity
// ═════════════════════════════════════════════════════════════════════════════

// ─── SPARK STEP — Editorial pull-quote style ──────────────────────────────────
// The "here's the insight" moment. Big, bold, almost like a magazine spread.

function SparkStep({ step, onAdvance, finalAction }: { step: any; onAdvance: () => void; finalAction?: React.ReactNode }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const headline = step.headline ?? '';
  const bodyText = step.content ?? step.text ?? step.body ?? step.prompt ?? step.message ?? step.instructions ?? step.action ?? '';
  const content = headline && bodyText && headline !== bodyText ? '' : (headline || bodyText);
  const hasHeadlineAndBody = !!(headline && bodyText && headline !== bodyText);
  const cue = step.cue ?? '';
  const action = (!hasHeadlineAndBody && step.action) ? step.action : '';
  if (__DEV__ && !content && !hasHeadlineAndBody) {
    console.warn('[StepFallback] SparkStep has no displayable content', { type: step.type, keys: Object.keys(step) });
  }

  return (
    <Animated.View style={[sparkStyles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Top accent — green rule + SPARK label */}
      <View style={sparkStyles.topAccent}>
        <View style={sparkStyles.accentLine} />
        <Text style={sparkStyles.accentLabel}>SPARK</Text>
        <View style={sparkStyles.accentLineFade} />
      </View>

      {/* The insight text — large, editorial */}
      {hasHeadlineAndBody ? (
        <>
          <Text style={[sparkStyles.body, { fontFamily: 'Inter_700Bold', marginBottom: 8 }]}>{headline}</Text>
          <Text style={sparkStyles.body}>{bodyText}</Text>
        </>
      ) : (
        <Text style={sparkStyles.body}>{content}</Text>
      )}

      {/* Cue box — if present */}
      {cue !== '' && <CueBox cue={cue} />}

      {/* Action box */}
      {action !== '' && (
        <View style={sparkStyles.actionBox}>
          <Ionicons name="arrow-forward-circle" size={16} color={Colors.primary} />
          <Text style={sparkStyles.actionText}>{action}</Text>
        </View>
      )}

      {finalAction ?? <AdvanceButton label="Got it →" onPress={onAdvance} />}
    </Animated.View>
  );
}

// ─── CUE BOX — The sacred cue moment. Used across multiple step types. ────────

function CueBox({ cue, label = 'YOUR CUE' }: { cue: string; label?: string }) {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[cueStyles.wrap, { transform: [{ scale: scaleAnim }] }]}>
      {/* Dark green background gradient */}
      <LinearGradient
        colors={['rgba(34,204,94,0.18)', 'rgba(34,204,94,0.08)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Left accent bar */}
      <View style={cueStyles.leftBar} />
      <View style={cueStyles.inner}>
        <View style={cueStyles.labelRow}>
          <View style={cueStyles.labelPill}>
            <Ionicons name="flash" size={9} color={Colors.primary} />
            <Text style={cueStyles.labelText}>{label}</Text>
          </View>
        </View>
        <Text style={cueStyles.cueText}>{cue}</Text>
      </View>
    </Animated.View>
  );
}

// ─── CHOICE STEP — High-stakes decision cards ────────────────────────────────
// Before: clean bordered tiles. After: dramatic success/fail states.

function getChoiceId(choice: any, index: number): string {
  return String(choice?.id ?? choice?.key ?? choice?.value ?? index);
}

function getChoiceQuality(choice: any, step: any, index: number): 'correct' | 'acceptable' | 'wrong' {
  const raw = String(choice?.quality ?? choice?.outcome ?? choice?.status ?? '').toLowerCase();
  if (choice?.is_correct === true || choice?.correct === true || raw === 'success' || raw === 'correct' || raw === 'best') return 'correct';
  if (raw === 'acceptable' || raw === 'partial' || raw === 'ok') return 'acceptable';
  const choiceId = getChoiceId(choice, index);
  const correctId = step?.correct_choice_id ?? step?.correct_answer_id ?? step?.answer_id;
  if (correctId !== undefined && correctId !== null && String(correctId) === choiceId) return 'correct';
  const correctIndex = step?.correct_index ?? step?.answer_index;
  if (typeof correctIndex === 'number' && correctIndex === index) return 'correct';
  return 'wrong';
}

function choiceFallbackFeedback(quality: 'correct' | 'acceptable' | 'wrong'): string {
  if (quality === 'correct') return 'Good read. That choice keeps the rep under control.';
  if (quality === 'acceptable') return 'That can work, but there is a cleaner baseball decision here.';
  return 'Not the move. Reset the situation, simplify the decision, and try again.';
}

function ChoiceStep({ step, onAdvance, finalAction, advanceLabel = 'Next Rep →' }: { step: any; onAdvance: (passed?: boolean) => void; finalAction?: React.ReactNode; advanceLabel?: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [selectedPassed, setSelectedPassed] = useState<boolean | undefined>(undefined);

  const microcopy = useMicrocopy();
  const correctFbRef = useRef<string | null>(null);
  const wrongFbRef = useRef<string | null>(null);
  if (correctFbRef.current === null) correctFbRef.current = microcopy.useStepFeedback(true);
  if (wrongFbRef.current === null) wrongFbRef.current = microcopy.useStepFeedback(false);

  // Shuffle once on mount so correctness never relies on answer position.
  const shuffledRef = useRef<any[] | null>(null);
  if (shuffledRef.current === null) {
    const raw = Array.isArray(step?.choices) ? step.choices : Array.isArray(step?.options) ? step.options : [];
    shuffledRef.current = [...raw].sort(() => Math.random() - 0.5);
  }
  const choices = shuffledRef.current;

  function handlePick(id: string, quality: 'correct' | 'acceptable' | 'wrong') {
    if (revealed) return;
    H.select();
    setSelected(id);
    setRevealed(true);
    const passed = quality !== 'wrong';
    setSelectedPassed(passed);
    if (quality === 'correct') {
      H.success();
    } else if (quality === 'acceptable') {
      H.medium();
    } else {
      H.error();
    }
  }

  if (choices.length === 0) {
    if (__DEV__) console.warn('[StepFallback] ChoiceStep has no choices/options', { type: step.type, keys: Object.keys(step) });
    return (
      <View style={choiceStyles.container}>
        {(step.prompt ?? step.question) ? <Text style={choiceStyles.prompt}>{step.prompt ?? step.question}</Text> : null}
        <View style={stepRouterStyles.fallbackCard}>
          <Ionicons name="alert-circle" size={18} color={Colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={stepRouterStyles.fallbackTitle}>This rep needs an update.</Text>
            <Text style={stepRouterStyles.fallbackText}>Answer choices haven't been added yet. Keep moving.</Text>
          </View>
        </View>
        {finalAction ?? <AdvanceButton label="Continue →" onPress={() => onAdvance(undefined)} />}
      </View>
    );
  }

  return (
    <View style={choiceStyles.container}>
      <Text style={choiceStyles.prompt}>{step.prompt ?? step.question ?? ''}</Text>

      <View style={choiceStyles.list}>
        {choices.map((c: any, i: number) => {
          const cid = getChoiceId(c, i);
          const isSel = selected === cid;
          const quality = getChoiceQuality(c, step, i);
          const isOk = quality === 'correct';

          return (
            <ChoiceButton
              key={cid}
              label={c.text ?? c.label ?? ''}
              feedback={c.feedback ?? (quality !== 'wrong' ? correctFbRef.current! : wrongFbRef.current!)}
              quality={quality}
              isSelected={isSel}
              isRevealed={revealed}
              isCorrect={isOk}
              index={i}
              onPress={() => handlePick(cid, quality)}
              disabled={revealed}
            />
          );
        })}
      </View>

      {revealed && finalAction ? finalAction : <AdvanceButton label={revealed ? advanceLabel : 'Lock in a read'} onPress={revealed ? () => onAdvance(selectedPassed) : undefined} disabled={!revealed} />}
    </View>
  );
}

function ChoiceButton({ label, feedback, quality, isSelected, isRevealed, isCorrect, index, onPress, disabled }: {
  label: string; feedback?: string; quality: 'correct' | 'acceptable' | 'wrong'; isSelected: boolean; isRevealed: boolean;
  isCorrect: boolean; index: number; onPress: () => void; disabled: boolean;
}) {
  const revealAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelected && isRevealed) {
      Animated.timing(revealAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
      if (quality === 'wrong') {
        // Shake on wrong answer
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
      }
    }
  }, [isSelected, isRevealed]);

  // Determine visual state
  let borderColor = Colors.border;
  let bgColor = Colors.surface;
  let textColor = Colors.textPrimary;
  let iconName: any = null;

  if (isSelected && isRevealed) {
    if (isCorrect) {
      borderColor = Colors.primary;
      bgColor = 'rgba(34,204,94,0.10)';
      iconName = 'checkmark-circle';
    } else if (quality === 'acceptable') {
      borderColor = Colors.warning;
      bgColor = 'rgba(245,158,11,0.08)';
      iconName = 'information-circle';
      textColor = Colors.warning;
    } else {
      borderColor = Colors.danger;
      bgColor = 'rgba(255,59,48,0.08)';
      iconName = 'close-circle';
      textColor = Colors.danger;
    }
  } else if (!isSelected && isRevealed) {
    borderColor = Colors.border + '40';
    bgColor = Colors.surface;
    textColor = Colors.textTertiary;
  }

  const alphaIndex = ['A', 'B', 'C', 'D'][index] ?? String(index + 1);

  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[choiceStyles.btn, { borderColor, backgroundColor: bgColor }]}
      >
        {/* Option letter */}
        <View style={[choiceStyles.optionLetter, {
          backgroundColor: isSelected && isRevealed
            ? (isCorrect ? Colors.primary : Colors.danger)
            : Colors.surfaceElevated,
          borderColor: isSelected && isRevealed
            ? (isCorrect ? Colors.primary : Colors.danger)
            : Colors.border,
        }]}>
          <Text style={[choiceStyles.optionLetterText, {
            color: isSelected && isRevealed ? '#000' : Colors.textTertiary,
          }]}>{alphaIndex}</Text>
        </View>

        <View style={choiceStyles.btnContent}>
          <Text style={[choiceStyles.btnText, { color: textColor }]}>{label}</Text>

          {/* Feedback slides in after reveal */}
          {isSelected && isRevealed && feedback && (
            <Animated.View style={{ opacity: revealAnim }}>
              <Text style={[choiceStyles.feedback, { color: isCorrect ? Colors.primary : quality === 'acceptable' ? Colors.warning : Colors.textSecondary }]}>
                {feedback}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Result icon */}
        {isSelected && isRevealed && iconName && (
          <Ionicons name={iconName} size={20} color={isCorrect ? Colors.primary : quality === 'acceptable' ? Colors.warning : Colors.danger} />
        )}
      </Pressable>

      {/* Correct answer glow */}
      {isSelected && isRevealed && isCorrect && (
        <View style={choiceStyles.correctGlow} />
      )}
    </Animated.View>
  );
}

// ─── CHECKLIST STEP — Pregame card, satisfying completion ────────────────────

function ChecklistStep({ step, onAdvance, finalAction }: { step: any; onAdvance: () => void; finalAction?: React.ReactNode }) {
  const rawItems = step.instructions ?? step.items ?? step.steps ?? [];
  const items: string[] = Array.isArray(rawItems) ? rawItems.map(String) : [];
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const allDone = checked.size >= items.length && items.length > 0;
  const progress = items.length > 0 ? checked.size / items.length : 0;

  return (
    <View style={checklistStyles.container}>
      {step.prompt && <Text style={checklistStyles.prompt}>{step.prompt}</Text>}

      {/* Progress bar at top */}
      <View style={checklistStyles.progressWrap}>
        <View style={checklistStyles.progressTrack}>
          <Animated.View style={[checklistStyles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={checklistStyles.progressLabel}>{checked.size}/{items.length}</Text>
      </View>

      <View style={checklistStyles.list}>
        {items.map((item, i) => {
          const done = checked.has(i);
          return (
            <ChecklistRow
              key={i}
              text={item}
              done={done}
              index={i}
              onToggle={() => {
                H.select();
                setChecked((p) => {
                  const n = new Set(p);
                  n.has(i) ? n.delete(i) : n.add(i);
                  return n;
                });
              }}
            />
          );
        })}
      </View>

      {allDone && finalAction ? finalAction : (
        <AdvanceButton
          label={allDone ? 'Done →' : `${checked.size}/${items.length} checked`}
          onPress={allDone ? onAdvance : undefined}
          disabled={!allDone}
        />
      )}
    </View>
  );
}

function ChecklistRow({ text, done, index, onToggle }: { text: string; done: boolean; index: number; onToggle: () => void }) {
  const checkAnim = useRef(new Animated.Value(0)).current;
  const strikeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(checkAnim, { toValue: done ? 1 : 0, tension: 100, friction: 8, useNativeDriver: true }),
      Animated.timing(strikeAnim, { toValue: done ? 1 : 0, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [done]);

  return (
    <Pressable style={[checklistStyles.row, done && checklistStyles.rowDone]} onPress={onToggle}>
      {/* Animated checkbox */}
      <Animated.View style={[
        checklistStyles.checkbox,
        {
          backgroundColor: checkAnim.interpolate({ inputRange: [0, 1], outputRange: [Colors.surface, Colors.primary] }),
          borderColor: checkAnim.interpolate({ inputRange: [0, 1], outputRange: [Colors.border, Colors.primary] }),
          transform: [{ scale: checkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] }) }],
        },
      ]}>
        <Animated.View style={{ opacity: checkAnim }}>
          <Ionicons name="checkmark" size={13} color="#000" />
        </Animated.View>
      </Animated.View>

      <Text style={[checklistStyles.itemText, done && checklistStyles.itemTextDone]}>{text}</Text>
    </Pressable>
  );
}

// ─── VISUALIZATION / CUE STEP — Focused, meditative ─────────────────────────

function VisualizationStep({ step, onAdvance, finalAction }: { step: any; onAdvance: () => void; finalAction?: React.ReactNode }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const body = step.content ?? step.text ?? step.visualization ?? step.body ?? '';
  const cue = step.cue ?? step.focal_cue ?? step.example_reframe ?? '';

  return (
    <Animated.View style={[vizStyles.container, { opacity: fadeAnim }]}>
      {/* Pulsing eye orb */}
      <Animated.View style={[vizStyles.orb, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={[Colors.primaryMuted, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <Ionicons name="eye-outline" size={32} color={Colors.primary} />
      </Animated.View>

      <Text style={vizStyles.body}>{body}</Text>

      {cue !== '' && <CueBox cue={cue} />}

      {finalAction ?? <AdvanceButton label="Locked in →" onPress={onAdvance} />}
    </Animated.View>
  );
}

// ─── TIMER STEP — Athletic game clock ────────────────────────────────────────

function TimerStep({ step, onAdvance, finalAction }: { step: any; onAdvance: () => void; finalAction?: React.ReactNode }) {
  const duration = step.timer_sec ?? step.duration ?? 15;
  const [seconds, setSeconds] = useState(duration);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  function startTimer() {
    setRunning(true);
    H.medium();
    // Animate the progress arc
    Animated.timing(progressAnim, { toValue: 1, duration: duration * 1000, useNativeDriver: false }).start();
    Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setDone(true);
          setRunning(false);
          H.success();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  const instruction = step.instructions
    ? (Array.isArray(step.instructions) ? step.instructions.join('\n') : step.instructions)
    : step.simulation_description ?? step.action ?? '';

  // Progress ring circumference
  const RADIUS = 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  return (
    <View style={timerStyles.container}>
      <Text style={timerStyles.instruction}>{instruction}</Text>

      {/* Ring + number */}
      <View style={timerStyles.ringWrap}>
        {/* Outer track ring */}
        <View style={timerStyles.ringTrack} />

        {/* Animated glow fill overlay */}
        <Animated.View style={[timerStyles.ringGlow, { opacity: glowAnim }]} />

        {/* Center number */}
        <View style={timerStyles.ringCenter}>
          <Text style={[timerStyles.ringNum, done && { color: Colors.primary }]}>{seconds}</Text>
          <Text style={timerStyles.ringUnit}>{running || done ? 'sec' : `sec`}</Text>
        </View>

        {/* Running pulse ring */}
        {running && (
          <Animated.View style={[timerStyles.pulseRing, {
            opacity: progressAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.15, 0.05] }),
          }]} />
        )}
      </View>

      {done && <Text style={timerStyles.doneText}>Time's up. Lock it in.</Text>}

      {!running && !done && (
        <Pressable style={timerStyles.startBtn} onPress={startTimer}>
          <LinearGradient
            colors={[Colors.primary, '#18A84A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <Ionicons name="play" size={14} color="#000" />
          <Text style={timerStyles.startBtnText}>Start</Text>
        </Pressable>
      )}

      {running && (
        <View style={timerStyles.runningLabel}>
          <View style={timerStyles.runningDot} />
          <Text style={timerStyles.runningText}>Focus. Go.</Text>
        </View>
      )}

      {done && (finalAction ?? <AdvanceButton label="Done →" onPress={onAdvance} />)}
    </View>
  );
}

// ─── REFLECTION STEP ─────────────────────────────────────────────────────────

function ReflectionStep({ step, onAdvance, finalAction }: { step: any; onAdvance: () => void; finalAction?: React.ReactNode }) {
  return (
    <View style={reflectStyles.container}>
      <View style={reflectStyles.bulbWrap}>
        <LinearGradient
          colors={[Colors.warningMuted, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <Ionicons name="bulb" size={28} color={Colors.warning} />
      </View>
      <Text style={reflectStyles.body}>{step.content ?? step.text ?? step.prompt ?? step.reframe_prompt ?? ''}</Text>
      {step.example_reframe && (
        <View style={reflectStyles.exampleBox}>
          <Text style={reflectStyles.exampleLabel}>REP EXAMPLE</Text>
          <Text style={reflectStyles.exampleText}>{step.example_reframe}</Text>
        </View>
      )}
      {finalAction ?? <AdvanceButton label="Got it →" onPress={onAdvance} />}
    </View>
  );
}

// ─── FEEDBACK STEP ───────────────────────────────────────────────────────────

function FeedbackStep({ step, onAdvance, finalAction }: { step: any; onAdvance: () => void; finalAction?: React.ReactNode }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
  }, []);
  return (
    <View style={feedbackStyles.container}>
      <Animated.View style={[feedbackStyles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="checkmark-circle" size={44} color={Colors.primary} />
      </Animated.View>
      <Text style={feedbackStyles.text}>{step.content ?? step.text ?? step.message ?? ''}</Text>
      {finalAction ?? <AdvanceButton label="Continue →" onPress={onAdvance} />}
    </View>
  );
}

// ─── NOTICE/WONDER STEP — Three completely different phase identities ─────────

function NoticeWonderStep({ step, onAdvance, finalAction }: { step: any; onAdvance: () => void; finalAction?: React.ReactNode }) {
  type Phase = 'notice' | 'wonder' | 'reveal';
  const [phase, setPhase] = useState<Phase>('notice');
  const [noticePicks, setNoticePicks] = useState<string[]>([]);
  const [wonderPick, setWonderPick] = useState<string | null>(null);
  const phaseAnim = useRef(new Animated.Value(1)).current;
  const noticeItems: string[] = Array.isArray(step.notice_items) ? step.notice_items.map(String) : [];
  const wonderOptions: { id: string; text: string }[] = Array.isArray(step.wonder_options) ? step.wonder_options.map((opt: any, i: number) => ({ id: String(opt?.id ?? i), text: String(opt?.text ?? opt?.label ?? opt ?? '') })) : [];

  // Legacy schema detection
  const isLegacyNotice = noticeItems.length === 0 && typeof step.notice === 'string' && step.notice.length > 0;
  const isLegacyWonder = wonderOptions.length === 0 && typeof step.wonder === 'string' && step.wonder.length > 0;
  if (__DEV__ && (isLegacyNotice || isLegacyWonder)) {
    console.warn('[StepFallback] NoticeWonderStep using legacy schema', { reason: isLegacyNotice ? 'no notice_items' : 'no wonder_options', keys: Object.keys(step) });
  }

  const situation = step.situation ?? step.content ?? step.body ?? step.notice ?? step.headline ?? '';
  const revealCue = step.reveal_cue ?? step.cue ?? step.takeaway_cue ?? '';

  function transition(next: Phase) {
    H.select();
    Animated.timing(phaseAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setPhase(next);
      Animated.spring(phaseAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }).start();
    });
  }

  const guessedRight = wonderPick === step.wonder_correct_id;

  // ── NOTICE PHASE — cool blue-tinted ──
  if (phase === 'notice') {
    return (
      <Animated.View style={[nwStyles.container, { opacity: phaseAnim }]}>
        {/* Phase header */}
        <View style={nwStyles.noticeHeader}>
          <View style={nwStyles.noticePhaseBadge}>
            <Ionicons name="eye" size={11} color={Colors.info} />
            <Text style={[nwStyles.phaseBadgeText, { color: Colors.info }]}>NOTICE</Text>
          </View>
          <Text style={nwStyles.phaseStep}>1 of 3</Text>
        </View>

        {/* Situation card — blue left border */}
        <View style={nwStyles.situationCard}>
          <View style={[nwStyles.situationBorder, { backgroundColor: Colors.info }]} />
          <View style={nwStyles.situationInner}>
            <Text style={nwStyles.situationLabel}>THE SITUATION</Text>
            <Text style={nwStyles.situationText}>{situation}</Text>
          </View>
        </View>

        {isLegacyNotice ? (
          // Legacy: show notice text directly, no chip tap required
          <>
            <View style={nwStyles.situationCard}>
              <View style={[nwStyles.situationBorder, { backgroundColor: Colors.info }]} />
              <View style={nwStyles.situationInner}>
                <Text style={nwStyles.situationLabel}>NOTICE</Text>
                <Text style={nwStyles.situationText}>{step.notice}</Text>
              </View>
            </View>
            <Pressable style={nwStyles.phaseBtn} onPress={() => transition('wonder')}>
              <Text style={nwStyles.phaseBtnText}>Wonder →</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" />
            </Pressable>
          </>
        ) : (
          <>
            <Text style={nwStyles.noticeInstruct}>Scout the scene. Tap every clue you see.</Text>

            {/* Chip grid */}
            <View style={nwStyles.chipGrid}>
              {noticeItems.map((item, i) => {
                const picked = noticePicks.includes(item);
                return (
                  <Pressable
                    key={i}
                    style={[nwStyles.chip, picked && nwStyles.chipPicked]}
                    onPress={() => {
                      H.select();
                      setNoticePicks((p) => p.includes(item) ? p.filter((x) => x !== item) : [...p, item]);
                    }}
                  >
                    {picked && <Ionicons name="checkmark" size={10} color={Colors.primary} style={{ marginRight: 3 }} />}
                    <Text style={[nwStyles.chipText, picked && nwStyles.chipTextPicked]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[nwStyles.phaseBtn, noticePicks.length === 0 && nwStyles.phaseBtnDisabled]}
              onPress={noticePicks.length > 0 ? () => transition('wonder') : undefined}
            >
              <Text style={nwStyles.phaseBtnText}>
                {noticePicks.length === 0 ? 'Tap what you notice' : `I noticed ${noticePicks.length} → Wonder`}
              </Text>
              {noticePicks.length > 0 && <Ionicons name="arrow-forward" size={14} color="#000" />}
            </Pressable>
          </>
        )}
      </Animated.View>
    );
  }

  // ── WONDER PHASE — warm amber tinted ──
  if (phase === 'wonder') {
    return (
      <Animated.View style={[nwStyles.container, { opacity: phaseAnim }]}>
        <View style={nwStyles.wonderHeader}>
          <View style={nwStyles.wonderPhaseBadge}>
            <Ionicons name="help-circle" size={11} color={Colors.warning} />
            <Text style={[nwStyles.phaseBadgeText, { color: Colors.warning }]}>WONDER</Text>
          </View>
          <Text style={nwStyles.phaseStep}>2 of 3</Text>
        </View>

        <Text style={nwStyles.wonderPrompt}>{step.wonder_prompt ?? 'What do you think happens next?'}</Text>

        {isLegacyWonder ? (
          // Legacy: show wonder text directly, no option tap required
          <>
            <View style={nwStyles.situationCard}>
              <View style={[nwStyles.situationBorder, { backgroundColor: Colors.warning }]} />
              <View style={nwStyles.situationInner}>
                <Text style={nwStyles.situationText}>{step.wonder}</Text>
              </View>
            </View>
            <Pressable style={[nwStyles.phaseBtn, nwStyles.phaseBtnWonder]} onPress={() => transition('reveal')}>
              <Text style={nwStyles.phaseBtnText}>Reveal →</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={nwStyles.wonderList}>
              {wonderOptions.map((opt) => {
                const picked = wonderPick === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    style={[nwStyles.wonderOption, picked && nwStyles.wonderOptionPicked]}
                    onPress={() => {
                      H.medium();
                      setWonderPick(opt.id);
                    }}
                  >
                    <View style={[nwStyles.wonderRadio, picked && nwStyles.wonderRadioFilled]}>
                      {picked && <View style={nwStyles.wonderRadioDot} />}
                    </View>
                    <Text style={[nwStyles.wonderOptionText, picked && { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' }]}>
                      {opt.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {wonderPick && (
              <Pressable style={[nwStyles.phaseBtn, nwStyles.phaseBtnWonder]} onPress={() => transition('reveal')}>
                <Text style={nwStyles.phaseBtnText}>Show me what happens →</Text>
              </Pressable>
            )}
          </>
        )}
      </Animated.View>
    );
  }

  // ── REVEAL PHASE — green tinted, the payoff ──
  return (
    <Animated.View style={[nwStyles.container, { opacity: phaseAnim }]}>
      <View style={nwStyles.revealHeader}>
        <View style={nwStyles.revealPhaseBadge}>
          <Ionicons name="bulb" size={11} color={Colors.primary} />
          <Text style={[nwStyles.phaseBadgeText, { color: Colors.primary }]}>REVEAL</Text>
        </View>
        <Text style={nwStyles.phaseStep}>3 of 3</Text>
      </View>

      {/* Right/wrong guess result */}
      {wonderPick && (
        <View style={[nwStyles.guessBanner, guessedRight ? nwStyles.guessBannerRight : nwStyles.guessBannerWrong]}>
          <Ionicons
            name={guessedRight ? 'checkmark-circle' : 'information-circle'}
            size={16}
            color={guessedRight ? Colors.primary : Colors.warning}
          />
          <Text style={[nwStyles.guessText, { color: guessedRight ? Colors.primary : Colors.warning }]}>
            {guessedRight ? 'Your prediction was right.' : 'Here is what actually happens.'}
          </Text>
        </View>
      )}

      {/* Reveal text card — green left border */}
      <View style={nwStyles.revealCard}>
        <View style={[nwStyles.situationBorder, { backgroundColor: Colors.primary }]} />
        <View style={nwStyles.situationInner}>
          <Text style={nwStyles.revealText}>{step.reveal ?? ''}</Text>
        </View>
      </View>

      {/* What you noticed recap */}
      {noticePicks.length > 0 && (
        <View style={nwStyles.recapWrap}>
          <Text style={nwStyles.recapLabel}>YOU NOTICED</Text>
          <View style={nwStyles.recapChips}>
            {noticePicks.map((item, i) => (
              <View key={i} style={nwStyles.recapChip}>
                <Text style={nwStyles.recapChipText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Cue box — the stamped takeaway */}
      {revealCue !== '' && (
        <CueBox cue={revealCue} label="LOCK IN YOUR CUE" />
      )}

      {finalAction ?? <AdvanceButton label="Locked in →" onPress={onAdvance} variant="primary" />}
    </Animated.View>
  );
}

// ─── SHARED: ADVANCE BUTTON ───────────────────────────────────────────────────

function AdvanceButton({ label, onPress, disabled = false, variant = 'default' }: {
  label: string; onPress?: () => void; disabled?: boolean; variant?: 'default' | 'primary';
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        advanceStyles.btn,
        variant === 'primary' && advanceStyles.btnPrimary,
        disabled && advanceStyles.btnDisabled,
        pressed && !disabled && { opacity: 0.88 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {variant === 'primary' && !disabled && (
        <LinearGradient
          colors={[Colors.primary, '#18A84A']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      )}
      <Text style={[advanceStyles.btnText, variant === 'primary' && !disabled && { color: '#000' }, disabled && { color: Colors.textTertiary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── STEP ROUTER ─────────────────────────────────────────────────────────────

function StepRenderer({
  step,
  onAdvance,
  isFinal = false,
  completionIntent = 'rep',
}: {
  step: any;
  onAdvance: (passed?: boolean) => void;
  isFinal?: boolean;
  completionIntent?: CompletionIntent;
}) {
  const [finalVariantPassed, setFinalVariantPassed] = useState<boolean | null>(null);
  useEffect(() => { setFinalVariantPassed(null); }, [step]);
  const adv = () => onAdvance();
  const finalAction = isFinal ? (
    <CompletionInteraction
      variant={completionIntent === 'boss' ? 'card-swipe' : 'swipe'}
      intent={completionIntent}
      fallbackLabel="Finish Rep"
      onComplete={() => onAdvance(finalVariantPassed ?? undefined)}
    />
  ) : undefined;
  if (step.ui_variant) {
    return (
      <View style={stepRouterStyles.interactiveWrap}>
        <VariantRenderer
          step={step}
          onAdvance={(passed) => {
            if (isFinal) setFinalVariantPassed(passed ?? true);
            else onAdvance(passed);
          }}
        />
        {finalVariantPassed !== null && finalAction}
      </View>
    );
  }
  switch (step.type ?? '') {
    case 'spark': case 'text': case 'action':
      return <SparkStep step={step} onAdvance={adv} finalAction={finalAction} />;
    case 'choice': case 'scenario': case 'scenario_pick': case 'decision': case 'freeze_frame':
      return <ChoiceStep step={step} onAdvance={onAdvance} finalAction={isFinal ? undefined : finalAction} advanceLabel={isFinal ? 'Finish Rep →' : 'Next Rep →'} />;
    case 'checklist': case 'quick_reset':
      return <ChecklistStep step={step} onAdvance={adv} finalAction={finalAction} />;
    case 'cue': case 'visualization': case 'reframe_builder': case 'pressureRep':
      return <VisualizationStep step={step} onAdvance={adv} finalAction={finalAction} />;
    case 'timer': case 'pressure_rep':
      return <TimerStep step={step} onAdvance={adv} finalAction={finalAction} />;
    case 'reflection':
      return <ReflectionStep step={step} onAdvance={adv} finalAction={finalAction} />;
    case 'feedback': case 'reward':
      return <FeedbackStep step={step} onAdvance={adv} finalAction={finalAction} />;
    case 'notice_wonder':
      return <NoticeWonderStep step={step} onAdvance={adv} finalAction={finalAction} />;
    case 'pressure_clock':
      return <PressureClock step={step} onComplete={(r) => onAdvance(r.correct)} />;
    case 'film_room':
      return <FilmRoom step={step} onComplete={(r) => onAdvance(r.correct)} />;
    case 'build_your_rep':
      return <BuildYourRep step={step} onComplete={() => onAdvance(true)} />;
    case 'hot_read':
      return <HotRead step={step} onComplete={() => onAdvance(true)} />;
    case 'visualization_rep':
      return <VisualizationRep step={step} onComplete={() => onAdvance(true)} />;
    case 'one_word_lock':
      return <OneWordLock step={step} onComplete={() => onAdvance(true)} />;
    case 'drag_sequence':
      return <DragSequence step={step} onComplete={() => onAdvance(true)} />;
    default:
      return <SparkStep step={step} onAdvance={adv} finalAction={finalAction} />;
  }
}

function StepTypeIcon({ stepType, isBoss, isFinal }: { stepType: string; isBoss: boolean; isFinal: boolean }) {
  if (isBoss && isFinal) {
    return <Image source={STEP_TYPE_ICONS.boss} style={{ width: 26, height: 26 }} resizeMode="contain" />;
  }
  const src = STEP_TYPE_ICONS[stepType];
  if (!src) return null;
  return <Image source={src} style={{ width: 22, height: 22 }} resizeMode="contain" />;
}

type CompletionKind = 'lesson' | 'checkpoint' | 'boss';

function LessonCompletionPayoff({
  lesson,
  xpDisplay,
  contentFadeAnim,
  type,
  onContinue,
  athleteState,
  startingXP,
  awardedXP,
}: {
  lesson: any;
  xpDisplay: number;
  contentFadeAnim: Animated.Value;
  type: CompletionKind;
  onContinue: () => void;
  athleteState: any;
  startingXP: number;
  awardedXP: number;
}) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(18)).current;
  const pathFill = useRef(new Animated.Value(0)).current;
  const badgeFill = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const ctaOpacity = useRef(new Animated.Value(1)).current;

  const xpBounce = useSharedValue(0.4);
  const boltScale = useSharedValue(0.3);
  const boltOpacity = useSharedValue(0);

  const xpBounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpBounce.value }],
    opacity: Math.min(1, xpBounce.value * 2.5),
  }));
  const boltAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boltScale.value }],
    opacity: boltOpacity.value,
  }));

  function ctaPressIn() {
    H.tap();
    Animated.parallel([
      Animated.spring(ctaScale, { toValue: 0.97, tension: 300, friction: 20, useNativeDriver: true }),
      Animated.timing(ctaOpacity, { toValue: 0.88, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function ctaPressOut() {
    Animated.parallel([
      Animated.spring(ctaScale, { toValue: 1, tension: 280, friction: 18, useNativeDriver: true }),
      Animated.timing(ctaOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }

  const microcopy = useMicrocopy();
  const capLineRef = useRef<string | null>(null);
  if (capLineRef.current === null) {
    capLineRef.current = type === 'boss'
      ? microcopy.useBossComplete()
      : type === 'checkpoint'
      ? microcopy.useWorldComplete()
      : microcopy.useLessonComplete();
  }

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      Animated.timing(pathFill, { toValue: Math.min(0.92, ((athleteState?.completed_lessons?.length ?? 0) % 5 + 1) / 5), duration: 780, useNativeDriver: false }),
      Animated.timing(badgeFill, { toValue: getRankProgressPercent(startingXP + awardedXP), duration: 900, useNativeDriver: false }),
    ]).start();
    xpBounce.value = withDelay(500, withSpring(1, { damping: 10, stiffness: 180, mass: 0.7 }));
    boltScale.value = withDelay(460, withSpring(1, { damping: 8, stiffness: 200, mass: 0.6 }));
    boltOpacity.value = withDelay(460, withSpring(1, { damping: 14, stiffness: 220 }));
  }, []);

  const isBoss = type === 'boss';
  const title = capLineRef.current!;
  const currentPathName = lesson?.path_name ?? lesson?.lesson_family ?? lesson?.pillar_id ?? 'Career Path';
  const beforeRank = getCurrentRank(startingXP);
  const afterTotalXP = startingXP + awardedXP;
  const rankProgress = getRankProgress(afterTotalXP);
  const afterRank = rankProgress.currentRank;
  const rankUpgraded = beforeRank.id !== afterRank.id;
  const isReplay = awardedXP <= 0;
  const isFirstClear = !isReplay;
  const rankProgressLabel = rankProgress.nextRank
    ? `${rankProgress.xpIntoCurrentRank.toLocaleString()} / ${rankProgress.xpNeededForNextRank?.toLocaleString()} XP`
    : 'Elite standard held';
  const pathWidth = pathFill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const badgeWidth = badgeFill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const secondary = isBoss ? { label: 'Back Home', route: '/(tabs)' } : { label: 'Open Playbook', route: '/playbook' };
  const topSafePadding = Math.max(insets.top + Spacing.lg, Spacing.xxxl);

  return (
    <Animated.View style={[payoffStyles.wrap, { opacity: contentFadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <ImageBackground source={completionBg} style={StyleSheet.absoluteFill} resizeMode="cover">
        <View style={payoffStyles.bgOverlay} />
      </ImageBackground>
      <Image source={completionGlow} style={payoffStyles.completionGlowImg} pointerEvents="none" />
      <ScrollView contentContainerStyle={[payoffStyles.scrollContent, { paddingTop: topSafePadding }]} showsVerticalScrollIndicator={false}>
        <View style={payoffStyles.heroCard}>
          <LinearGradient colors={['rgba(35,209,96,0.16)', 'rgba(5,8,6,0)']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Image
            pointerEvents="none"
            source={require('../../assets/branding/c-mark.png')}
            style={payoffStyles.heroWatermark}
            resizeMode="contain"
          />
          <View style={payoffStyles.signalLine} />
          <Image
            source={require('../../assets/branding/simplified-wordmark.png')}
            style={payoffStyles.heroWordmark}
            resizeMode="contain"
          />
          <View style={payoffStyles.heroTopRow}>
            <View>
              {isBoss && <Text style={payoffStyles.bossCleared}>BOSS CLEARED</Text>}
              <Text style={payoffStyles.kicker}>{isBoss ? 'CLOSE IT OUT' : 'REP COMPLETE'}</Text>
              <Text style={payoffStyles.title}>{title}</Text>
            </View>
            <CoachCapMoment />
          </View>
          <Text style={payoffStyles.lessonTitle} numberOfLines={2}>{lesson?.title}</Text>
          <Reanimated.View style={[payoffStyles.xpRow, xpBounceStyle]}>
            <Reanimated.View style={boltAnimStyle}>
              <Ionicons name="flash" size={32} color="#39FF88" />
            </Reanimated.View>
            <Text style={payoffStyles.xpText}>+{xpDisplay}</Text>
            <View style={{ justifyContent: 'flex-end', paddingBottom: 7, gap: 4 }}>
              <Text style={[payoffStyles.xpLabel, { paddingBottom: 0 }]}>{isReplay ? 'REPLAY' : 'EARNED XP'}</Text>
              {isFirstClear && (
                <View style={payoffStyles.firstClearBadge}>
                  <Text style={payoffStyles.firstClearText}>FIRST CLEAR</Text>
                </View>
              )}
            </View>
          </Reanimated.View>
        </View>

        <View style={payoffStyles.card}>
          <View style={payoffStyles.cardHeaderRow}>
            <Text style={payoffStyles.cardLabel}>{currentPathName}</Text>
            <Text style={payoffStyles.cardValue}>{isBoss ? 'Boss cleared' : 'Next rep loaded'}</Text>
          </View>
          <View style={payoffStyles.progressTrack}><Animated.View style={[payoffStyles.progressFill, { width: pathWidth }]} /></View>
        </View>

        <View style={payoffStyles.card}>
          <View style={payoffStyles.cardHeaderRow}>
            <Text style={payoffStyles.cardLabel}>Rank Progress</Text>
            <Text style={[payoffStyles.cardValue, { color: rankUpgraded ? afterRank.accentColor : afterRank.primaryColor }]}>{rankUpgraded ? 'Rank upgraded' : rankProgressLabel}</Text>
          </View>
          <View style={payoffStyles.badgeRow}>
            <EmblemBadge rank={afterRank} size="small" />
            <View style={{ flex: 1 }}>
              <View style={[payoffStyles.rankTrack, { borderColor: afterRank.borderColor }]}><Animated.View style={[payoffStyles.rankFill, { width: badgeWidth, backgroundColor: afterRank.accentColor }]} /></View>
              <Text style={payoffStyles.helperText}>{isReplay ? 'Replay logged for practice. XP is earned on first clear.' : rankUpgraded ? `${afterRank.name} unlocked. Standard raised.` : rankProgress.nextRank ? `Rank progress moved. Next rank: ${rankProgress.nextRank.name}. ${rankProgress.xpRemaining.toLocaleString()} XP left.` : 'Elite held. Keep stacking clean reps.'}</Text>
            </View>
          </View>
        </View>

        <View style={payoffStyles.takeCard}>
          <View style={payoffStyles.takeHeaderRow}>
            <Image source={ccsTakeIcon} style={payoffStyles.takeIcon} resizeMode="cover" />
            <Text style={payoffStyles.takeLabel}>CC'S TAKE</Text>
          </View>
          <Text style={payoffStyles.takeText}>{lesson?.cc_take ?? 'You stayed with the cue. Next time the count gets loud, shrink it: target, breath, attack.'}</Text>
        </View>

        <View style={payoffStyles.actions}>
          <Pressable onPress={onContinue} onPressIn={ctaPressIn} onPressOut={ctaPressOut}>
            <Animated.View style={[payoffStyles.primaryCta, Shadow.green, { transform: [{ scale: ctaScale }], opacity: ctaOpacity }]}>
              <View style={[StyleSheet.absoluteFill, { borderRadius: Radius.md, overflow: 'hidden' }]}>
                <LinearGradient colors={['#23D160', '#18A84A']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              </View>
              <Text style={payoffStyles.primaryCtaText}>Continue Career</Text>
              <Ionicons name="arrow-forward" size={18} color="#050806" />
            </Animated.View>
          </Pressable>
          <Pressable onPress={() => router.push(secondary.route as any)} onPressIn={ctaPressIn} onPressOut={ctaPressOut}>
            <Animated.View style={[payoffStyles.secondaryCta, { transform: [{ scale: ctaScale }], opacity: ctaOpacity }]}>
              <Text style={payoffStyles.secondaryCtaText}>{secondary.label}</Text>
            </Animated.View>
          </Pressable>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

function CoachCapMoment() {
  return (
    <View style={payoffStyles.ccHook}>
      <Image
        source={require('../../assets/coach-cap/circular-avatar.png')}
        style={payoffStyles.ccImage}
        resizeMode="cover"
      />
    </View>
  );
}

// ─── STEP TEXT EXTRACTOR ─────────────────────────────────────────────────────

function getStepReadText(step: any): string | null {
  if (!step) return null;
  return step.content ?? step.text ?? step.prompt ??
         step.question ?? step.body ?? step.title ?? null;
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function LessonPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string; reason?: string }>();
  const insets = useSafeAreaInsets();
  const { athleteState, completeLesson, updateAthleteState } = useAthlete();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [sessionPassed, setSessionPassed] = useState(true);
  const [completionStage, setCompletionStage] = useState<'none'|'check_in'|'overlay'>('none');
  const completionTriggered = useRef(false);
  const stepFade = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [showComplete, setShowComplete] = useState<'lesson' | 'checkpoint' | 'boss' | null>(null);
  const [xpDisplay, setXpDisplay] = useState(0);
  const overlayFadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const xpCountAnim = useRef(new Animated.Value(0)).current;
  const finalXPRef = useRef(0);
  const startingXPRef = useRef(0);
  const lessonStartTime = useRef(Date.now());
  const visitedSteps = useRef(new Set<number>());

  useEffect(() => {
    lessonStartTime.current = Date.now();
    visitedSteps.current = new Set<number>();
  }, [id]);

  useEffect(() => {
    visitedSteps.current.add(stepIndex);
  }, [stepIndex]);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('lesson_tts_muted').then(val => {
      if (val === 'true') setIsMuted(true);
    });
  }, []);

  useEffect(() => {
    return () => { stopSpeech(); };
  }, []);

  async function toggleMute() {
    const next = !isMuted;
    setIsMuted(next);
    await AsyncStorage.setItem('lesson_tts_muted', String(next));
    if (next) stopSpeech();
    H.tap();
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error: err } = await supabase.from('legacy_lessons_staging').select('*').eq('id', id).single();
        if (err || !data) {
          const { data: cc, error: err2 } = await supabase.from('content_cards').select('*').eq('id', id).single();
          if (err2 || !cc) throw new Error('Lesson not found');
          setLesson(cc);
        } else { setLesson(data); }
      } catch (e: any) { setError(e.message ?? 'Failed to load'); }
      finally { setLoading(false); }
    })();
  }, [id]);
  const steps: any[] = Array.isArray(lesson?.steps) ? lesson.steps : [];

  useEffect(() => {
    stopSpeech();
    return () => { stopSpeech(); };
  }, [id]);
  const totalSteps = steps.length;

  useEffect(() => {
    if (!lesson || totalSteps === 0) return;
    const step = steps[Math.min(stepIndex, totalSteps - 1)];
    const text = getStepReadText(step);
    if (text && !isMuted) {
      stopSpeech();
      Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 0.92 });
    }
    return () => { stopSpeech(); };
  }, [stepIndex, isMuted, totalSteps, lesson]);

  useEffect(() => {
    if (totalSteps === 0) return;
    Animated.spring(progressAnim, { toValue: (stepIndex + 1) / totalSteps, tension: 60, friction: 10, useNativeDriver: false }).start();
  }, [stepIndex, totalSteps]);

  useEffect(() => {
    if (!showComplete) return;
    overlayFadeAnim.setValue(0);
    contentFadeAnim.setValue(0);
    xpCountAnim.setValue(0);
    setXpDisplay(0);
    Animated.timing(overlayFadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(contentFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 200);
    const xp = finalXPRef.current;
    if (xp > 0) {
      const listenerId = xpCountAnim.addListener(({ value }) => setXpDisplay(Math.round(value)));
      setTimeout(() => {
        Animated.timing(xpCountAnim, { toValue: xp, duration: 800, useNativeDriver: false }).start();
      }, 400);
      return () => xpCountAnim.removeListener(listenerId);
    }
  }, [showComplete]);

  const advanceStep = useCallback((passed?: boolean) => {
    if (completionTriggered.current) return;
    if (passed === false) setSessionPassed(false);
    if (stepIndex >= totalSteps - 1) {
      const elapsed = Date.now() - lessonStartTime.current;
      if (elapsed < 45000 && !__DEV__) return;
      const allVisited = visitedSteps.current.size >= totalSteps - 1;
      if (!allVisited && !__DEV__) return;
      completionTriggered.current = true;
      const xp = lesson?.xp_reward ?? 50;
      const finalPassed = passed !== false && sessionPassed;
      const lessonKey = String(lesson?.id ?? id);
      const alreadyCompleted = !!athleteState?.completed_lessons?.includes(lessonKey);
      const awardedXP = alreadyCompleted ? 0 : finalPassed ? xp : Math.floor(xp * 0.5);
      startingXPRef.current = athleteState?.total_xp ?? 0;
      if (athleteState && lesson && !alreadyCompleted) completeLesson(lessonKey, awardedXP);
      finalXPRef.current = awardedXP;
      if (lesson?.is_boss || lesson?.is_checkpoint) {
        setCompletionStage('check_in');
      } else {
        H.success();
        setTimeout(() => H.tap(), 250);
        setShowComplete('lesson');
      }
      return;
    }
    Animated.timing(stepFade, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setStepIndex((s) => s + 1);
      Animated.timing(stepFade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
    H.select();
  }, [stepIndex, totalSteps, lesson, athleteState, completeLesson, id, sessionPassed]);

  async function handleRatingsSubmit(ratings: Record<string, number>) {
    if (!athleteState) { setShowComplete('lesson'); return; }
    const current = athleteState.self_ratings;
    const merged: any = { ...current };
    Object.entries(ratings).forEach(([key, val]) => {
      const existing = (current as any)[key] ?? 3;
      merged[key] = Math.round((val * 0.6 + existing * 0.4) * 10) / 10;
    });
    await updateAthleteState({ self_ratings: merged });
    if (lesson?.is_boss) {
      H.lessonComplete();
      setShowComplete('boss');
    } else {
      H.success();
      setShowComplete('checkpoint');
    }
  }

  function handleExit() {
    stopSpeech();
    if (completionStage !== 'none' || stepIndex === 0) { router.back(); return; }
    Alert.alert('Exit lesson?', "Progress won't be saved.", [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (loading) return <View style={[screenStyles.center, { paddingTop: insets.top }]}><Text style={screenStyles.loadingText}>Loading rep...</Text></View>;
  if (error || !lesson) return (
    <View style={[screenStyles.center, { paddingTop: insets.top }]}>
      <Text style={screenStyles.errorText}>{error ?? 'Lesson not found'}</Text>
      <Pressable style={screenStyles.backBtn} onPress={() => router.back()}><Text style={screenStyles.backBtnText}>← Go back</Text></Pressable>
    </View>
  );
  if (totalSteps === 0) return (
    <View style={[screenStyles.container, { paddingTop: insets.top }]}>
      <ClutchrHeader
        variant="flow"
        title={lesson?.title ?? 'Finish the Rep'}
        leftAction={
          <Pressable onPress={handleExit} hitSlop={12} style={screenStyles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </Pressable>
        }
      />
      <View style={screenStyles.center}>
        <Text style={screenStyles.loadingText}>This rep needs cleanup.</Text>
        <Pressable style={screenStyles.backBtn} onPress={() => router.back()}><Text style={screenStyles.backBtnText}>Return Home</Text></Pressable>
      </View>
    </View>
  );

  const safeIndex = Math.min(stepIndex, totalSteps - 1);
  const currentStep = steps[safeIndex] ?? null;
  const lessonFamily = lesson.lesson_family ?? lesson.pillar_id ?? 'Spark Card';
  const isBoss = !!lesson.is_boss;
  const isCheckpoint = !!lesson.is_checkpoint;
  const finalStepType = String(currentStep?.type ?? currentStep?.ui_variant ?? '');
  const completionIntent: CompletionIntent = isBoss || isCheckpoint
    ? 'boss'
    : finalStepType.includes('cue') || finalStepType.includes('routine')
      ? 'save'
      : 'rep';

  const hasChoiceStep = steps.some((s: any) => s.type === 'choice' || s.ui_variant === 'choice');
  const isPressure = lessonFamily === 'Pressure Rep' || hasChoiceStep || (Array.isArray(lesson.skill_tags) && lesson.skill_tags.includes('pressure'));
  const backgroundSource = isBoss
    ? LESSON_BACKGROUNDS.boss
    : isPressure
      ? LESSON_BACKGROUNDS.pressure
      : LESSON_BACKGROUNDS.default;

  return (
    <View style={[screenStyles.container, { paddingTop: insets.top }]}>
      <ImageBackground source={backgroundSource} style={screenStyles.background} resizeMode="cover" />
      <View style={screenStyles.backgroundOverlay} />
      {isBoss && <View style={screenStyles.bossAccentBorder} />}

      {/* ── HEADER ── */}
      <ClutchrHeader
        variant="flow"
        kicker={lessonFamily.toUpperCase()}
        title={lesson.title}
        leftAction={
          <Pressable onPress={handleExit} hitSlop={12} style={screenStyles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </Pressable>
        }
        rightAction={
          <View style={screenStyles.flowRightActions}>
            <Pressable
              onPress={toggleMute}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                screenStyles.muteBtn,
                {
                  backgroundColor: isMuted ? '#1a1a1a' : '#0F2410',
                  borderColor: isMuted ? '#333' : '#22CC5E44',
                },
              ]}
            >
              <Ionicons
                name={isMuted ? 'volume-mute-outline' : 'volume-medium-outline'}
                size={15}
                color={isMuted ? '#555' : '#22CC5E'}
              />
            </Pressable>
            <Text style={screenStyles.durationText}>{safeIndex + 1} / {totalSteps}</Text>
          </View>
        }
      />

      {/* ── PROGRESS BAR ── */}
      <View style={screenStyles.progressTrack}>
        <Animated.View style={[
          screenStyles.progressFill,
          {
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: isBoss ? Colors.warning : isCheckpoint ? Colors.info : Colors.primary,
          },
        ]} />
        {/* Glow tip */}
        <Animated.View style={[
          screenStyles.progressTip,
          {
            left: progressAnim.interpolate({ inputRange: [0.01, 1], outputRange: ['1%', '98%'] }),
            backgroundColor: isBoss ? Colors.warning : isCheckpoint ? Colors.info : Colors.primary,
          },
        ]} />
      </View>

      {/* ── LESSON HEADER (first step only) ── */}
      {safeIndex === 0 && (
        <View style={screenStyles.lessonHeader}>
          <Text style={screenStyles.lessonFamily}>{lessonFamily.toUpperCase()}</Text>
          {lesson.subtitle && <Text style={screenStyles.lessonSubtitle}>{lesson.subtitle}</Text>}
        </View>
      )}

      {/* ── STEP COUNTER ── */}
      <View style={[screenStyles.stepCounter, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
        <StepTypeIcon stepType={finalStepType} isBoss={isBoss} isFinal={safeIndex === totalSteps - 1} />
        <Text style={screenStyles.stepCounterText}>{safeIndex + 1} / {totalSteps}</Text>
      </View>

      {/* ── STEP CONTENT ── */}
      <ScrollView
        style={screenStyles.scroll}
        contentContainerStyle={screenStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: stepFade }}>
          {currentStep && (
            <StepRenderer
              key={stepIndex}
              step={currentStep}
              onAdvance={advanceStep}
              isFinal={safeIndex === totalSteps - 1}
              completionIntent={completionIntent}
            />
          )}
        </Animated.View>
      </ScrollView>

      {completionStage === 'check_in' && (
        <SelfRatingCheckIn
          role={athleteState?.primary_role ?? 'default'}
          lessonTitle={lesson.title}
          isBoss={isBoss}
          onSubmit={handleRatingsSubmit}
        />
      )}
      {showComplete !== null && (
        <Animated.View style={[celebStyles.overlay, { opacity: overlayFadeAnim }]}>
          <LessonCompletionPayoff
            lesson={lesson}
            xpDisplay={xpDisplay}
            contentFadeAnim={contentFadeAnim}
            type={showComplete}
            athleteState={athleteState}
            startingXP={startingXPRef.current}
            awardedXP={finalXPRef.current}
            onContinue={() => router.push('/(tabs)/career')}
          />
        </Animated.View>
      )}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════

// ─── Spark ────────────────────────────────────────────────────────────────────
const sparkStyles = StyleSheet.create({
  container: { gap: Spacing.lg },
  topAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  accentLine: {
    width: 28,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  accentLineFade: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.primary,
    opacity: 0.15,
    borderRadius: 1,
  },
  accentLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
  },
  body: {
    fontSize: 19,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    lineHeight: 30,
    letterSpacing: -0.1,
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});

// ─── Cue Box ─────────────────────────────────────────────────────────────────
const cueStyles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    overflow: 'hidden',
    flexDirection: 'row',
    // Glow shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  leftBar: {
    width: 3,
    backgroundColor: Colors.primary,
  },
  inner: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  labelText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 1.2,
  },
  cueText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
});

// ─── Choice ───────────────────────────────────────────────────────────────────
const choiceStyles = StyleSheet.create({
  container: { gap: Spacing.lg },
  prompt: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  list: { gap: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  optionLetterText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  btnContent: { flex: 1, gap: 6 },
  btnText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  feedback: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  correctGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    pointerEvents: 'none',
  },
});

// ─── Checklist ────────────────────────────────────────────────────────────────
const checklistStyles = StyleSheet.create({
  container: { gap: Spacing.lg },
  prompt: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    minWidth: 30,
    textAlign: 'right',
  },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowDone: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryGlow,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  itemText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 21,
  },
  itemTextDone: {
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
});

// ─── Visualization / Cue ──────────────────────────────────────────────────────
const vizStyles = StyleSheet.create({
  container: { gap: Spacing.xl, alignItems: 'center' },
  orb: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  body: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    lineHeight: 27,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});

// ─── Timer ────────────────────────────────────────────────────────────────────
const timerStyles = StyleSheet.create({
  container: { gap: Spacing.xl, alignItems: 'center' },
  instruction: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    lineHeight: 24,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  ringWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTrack: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: Colors.surfaceElevated,
  },
  ringGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  ringCenter: {
    alignItems: 'center',
    gap: 2,
  },
  ringNum: {
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 48,
  },
  ringUnit: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  doneText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  startBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#000',
    letterSpacing: 0.3,
  },
  runningLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  runningDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  runningText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    letterSpacing: 1,
  },
});

// ─── Reflection ───────────────────────────────────────────────────────────────
const reflectStyles = StyleSheet.create({
  container: { gap: Spacing.lg, alignItems: 'center' },
  bulbWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${Colors.warning}35`,
  },
  body: {
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    lineHeight: 26,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  exampleBox: {
    alignSelf: 'stretch',
    backgroundColor: Colors.warningMuted,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.warning}35`,
    gap: 5,
  },
  exampleLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.warning,
    letterSpacing: 1.2,
  },
  exampleText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

// ─── Feedback ────────────────────────────────────────────────────────────────
const feedbackStyles = StyleSheet.create({
  container: { gap: Spacing.xl, alignItems: 'center' },
  iconWrap: { alignItems: 'center' },
  text: {
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
    alignSelf: 'stretch',
  },
});

// ─── Notice/Wonder ────────────────────────────────────────────────────────────
const nwStyles = StyleSheet.create({
  container: { gap: Spacing.lg },

  // Phase headers
  noticeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wonderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  revealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  noticePhaseBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: `${Colors.info}18`, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: `${Colors.info}35`,
  },
  wonderPhaseBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: `${Colors.warning}18`, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: `${Colors.warning}35`,
  },
  revealPhaseBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryMuted, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primaryBorder,
  },
  phaseBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },
  phaseStep: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  // Situation card
  situationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  situationBorder: { width: 3 },
  situationInner: { flex: 1, padding: Spacing.lg, gap: 6 },
  situationLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1.2 },
  situationText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, lineHeight: 23 },

  noticeInstruct: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // Chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipPicked: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  chipTextPicked: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },

  // Wonder
  wonderPrompt: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  wonderList: { gap: 10 },
  wonderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  wonderOptionPicked: {
    borderColor: Colors.warning,
    backgroundColor: `${Colors.warning}10`,
  },
  wonderRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  wonderRadioFilled: { borderColor: Colors.warning, backgroundColor: Colors.warning },
  wonderRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#000' },
  wonderOptionText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },

  // Reveal
  guessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  guessBannerRight: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primaryBorder },
  guessBannerWrong: { backgroundColor: Colors.warningMuted, borderColor: `${Colors.warning}40` },
  guessText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },

  revealCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    overflow: 'hidden',
  },
  revealText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, lineHeight: 25 },

  recapWrap: { gap: 6 },
  recapLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1.5 },
  recapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  recapChip: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  recapChipText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  // Phase buttons
  phaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  phaseBtnWonder: { backgroundColor: Colors.warning, shadowColor: Colors.warning },
  phaseBtnDisabled: {
    backgroundColor: Colors.surfaceElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  phaseBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#000' },
});

// ─── Advance Button ────────────────────────────────────────────────────────────
const advanceStyles = StyleSheet.create({
  btn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  btnPrimary: {
    borderColor: Colors.primaryBorder,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    opacity: 0.5,
  },
  btnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
});

// ─── Step Router ──────────────────────────────────────────────────────────────
const stepRouterStyles = StyleSheet.create({
  interactiveWrap: { gap: Spacing.lg },
  fallbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fallbackTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  fallbackText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  background: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.18 },
  backgroundOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 8, 6, 0.72)' },
  bossAccentBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#F5A623', opacity: 0.7, zIndex: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  errorText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.danger, textAlign: 'center' },
  backBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  backBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  flowRightActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.sm },
  muteBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadges: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  roleBadge: {
    backgroundColor: Colors.primaryMuted, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.primaryBorder,
  },
  roleBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.8 },
  interactiveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.purpleMuted, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.purple}40`,
  },
  interactiveBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.purple, letterSpacing: 0.8 },
  bossBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.warningMuted, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.warning}50`,
  },
  bossBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.warning, letterSpacing: 0.8 },
  checkpointBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.infoMuted, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.info}50`,
  },
  checkpointBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.info, letterSpacing: 0.8 },
  diffText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textTransform: 'capitalize' },
  durationText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  progressTrack: { height: 3, backgroundColor: Colors.border, marginHorizontal: Spacing.xl, borderRadius: 2, overflow: 'visible' },
  progressFill: { height: 3, borderRadius: 2 },
  progressTip: {
    position: 'absolute',
    top: -2, width: 7, height: 7, borderRadius: 4,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6,
  },

  lessonHeader: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: 4 },
  lessonFamily: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1.4, marginBottom: 2 },
  lessonTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, lineHeight: 30, letterSpacing: -0.3 },
  lessonSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 20, marginTop: 2 },

  stepCounter: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  stepCounterText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary, letterSpacing: 0.5 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: 60 },
});

// ─── Completion ────────────────────────────────────────────────────────────────
const completionStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, zIndex: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.primaryBorder, padding: Spacing.xxxl, alignItems: 'center', gap: Spacing.lg, width: '100%' },
  xpBurst: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  xpBurstPartial: { backgroundColor: Colors.warning },
  xpNum: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.background, lineHeight: 22 },
  xpLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.background, letterSpacing: 1, lineHeight: 14 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, textAlign: 'center' },
  feedback: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryMuted, borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderWidth: 1, borderColor: Colors.primaryBorder },
  retryBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  nextBtn: { borderRadius: Radius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, marginTop: Spacing.sm, width: '100%', alignItems: 'center', overflow: 'hidden', backgroundColor: Colors.primary },
  nextBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#000' },
});

// ─── Self-rating check-in ─────────────────────────────────────────────────────
const checkInStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, zIndex: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, width: '100%', gap: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.warningMuted, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eyebrow: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1.2 },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border },
  prompt: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 20, textAlign: 'center' },
  questions: { gap: Spacing.lg },
  questionRow: { gap: Spacing.sm },
  questionText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, lineHeight: 20 },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: Colors.surfaceElevated },
  submitBtnBoss: { backgroundColor: Colors.warning },
  submitBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.background },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textAlign: 'center', lineHeight: 16 },
});

const ratingStyles = StyleSheet.create({
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dotFill: { width: 10, height: 10, borderRadius: 5 },
  dotLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary, marginLeft: 4, minWidth: 40 },
});

// ─── Celebration ──────────────────────────────────────────────────────────────

const payoffStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 10, 6, 0.78)',
  },
  completionGlowImg: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: 260,
    height: 260,
    opacity: 0.55,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  heroCard: {
    backgroundColor: '#111612',
    borderColor: '#242B26',
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
    gap: Spacing.md,
  },
  signalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    backgroundColor: '#39FF88',
    shadowColor: '#39FF88',
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  heroWatermark: {
    position: 'absolute',
    right: -18,
    bottom: -24,
    width: 142,
    height: 142,
    opacity: 0.08,
  },
  heroWordmark: {
    width: 104,
    height: 28,
    marginBottom: -Spacing.xs,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md },
  kicker: { color: '#23D160', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.8 },
  title: { color: '#F7FFF9', fontFamily: 'Inter_700Bold', fontSize: 34, lineHeight: 38, letterSpacing: -0.8, marginTop: 4 },
  lessonTitle: { color: '#A8B3AA', fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20 },
  xpRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginTop: Spacing.xs },
  xpText: { color: '#39FF88', fontFamily: 'Inter_700Bold', fontSize: 44, lineHeight: 48, letterSpacing: -1 },
  xpLabel: { color: '#23D160', fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 1.8, paddingBottom: 7 },
  ccHook: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(35,209,96,0.3)',
    backgroundColor: '#0B100C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ccImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  card: {
    backgroundColor: '#111612',
    borderColor: '#242B26',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md },
  cardLabel: { color: '#F7FFF9', fontFamily: 'Inter_700Bold', fontSize: 14, flex: 1 },
  cardValue: { color: '#A8B3AA', fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  progressTrack: { height: 9, borderRadius: 5, backgroundColor: '#050806', borderWidth: 1, borderColor: '#242B26', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#23D160', shadowColor: '#39FF88', shadowOpacity: 0.55, shadowRadius: 9 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  badgeMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.42)',
    backgroundColor: 'rgba(245,166,35,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTrack: { height: 8, borderRadius: 4, backgroundColor: '#050806', overflow: 'hidden', borderWidth: 1, borderColor: '#2A2518' },
  rankFill: { height: '100%', backgroundColor: Colors.warning },
  helperText: { color: '#A8B3AA', fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: Spacing.sm },
  takeCard: {
    backgroundColor: '#0B100C',
    borderColor: 'rgba(35,209,96,0.24)',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  takeHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  takeIcon: { width: 40, height: 40, borderRadius: 8, marginRight: 10 },
  takeLabel: { color: '#23D160', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.6 },
  takeText: { color: '#F7FFF9', fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 23 },
  bossCleared: { fontSize: 11, letterSpacing: 2.5, fontFamily: 'Inter_700Bold', color: '#F5A623', alignSelf: 'center', marginBottom: 6 },
  firstClearBadge: { backgroundColor: 'rgba(34, 204, 94, 0.15)', borderColor: 'rgba(34, 204, 94, 0.4)', borderWidth: 1, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  firstClearText: { fontSize: 10, color: '#22CC5E', fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
  primaryCta: {
    minHeight: 54,
    borderRadius: Radius.md,
    backgroundColor: '#23D160',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryCtaText: { color: '#050806', fontFamily: 'Inter_700Bold', fontSize: 15, letterSpacing: 0.3 },
  secondaryCta: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#242B26',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111612',
  },
  secondaryCtaText: { color: '#A8B3AA', fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 0.4 },
});

const celebStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    paddingHorizontal: Spacing.xl,
  },
  contentCenter: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  voltAvatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 8,
  },
  voltAvatarLg: {
    width: 110,
    height: 110,
    borderRadius: 14,
    marginBottom: 8,
  },
  tierLabel: {
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: 1.2,
  },
  lessonTitleText: {
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  xpPillText: {
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  voltLine: {
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  voltLabel: {
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  bossScroll: { width: '100%', maxHeight: '90%' },
  bossScrollContent: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  bossQuote: {
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.85,
  },
  dividerLine: {
    width: 60,
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  crown: {
    fontSize: 36,
    color: Colors.warning,
  },
  bossBattleLabel: {
    color: Colors.warning,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 2,
  },
  defeatedLabel: {
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 1,
  },
  continueBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#000',
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: 0.4,
  },
  backBtn: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  backBtnText: {
    color: '#000',
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: 0.4,
  },
});
