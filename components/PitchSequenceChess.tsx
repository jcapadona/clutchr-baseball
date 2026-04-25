import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrevPitch {
  pitch: string;
  location: string;
  result: string;
}

export interface PitchSeqData {
  prompt: string;
  instruction?: string;
  mode: 'choose_next_pitch' | 'catcher_call' | string;
  context?: Record<string, any>;
  previous_pitches?: PrevPitch[];
  pitch_options: string[];
  target_options: string[];
}

export interface PitchCombo {
  pitch: string;
  target: string;
}

export interface PitchSeqResponses {
  best_combo: PitchCombo;
  acceptable_combos?: PitchCombo[];
}

export interface PitchSeqFeedback {
  correct: string;
  acceptable?: string;
  wrong: string;
}

interface Props {
  data: PitchSeqData;
  responses: PitchSeqResponses;
  feedback: PitchSeqFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── Pitch & Target display maps ──────────────────────────────────────────────

const PITCH_LABELS: Record<string, string> = {
  '4_seam':   '4-SEAM FB',
  '2_seam':   '2-SEAM FB',
  slider:     'SLIDER',
  changeup:   'CHANGEUP',
  curveball:  'CURVEBALL',
  cutter:     'CUTTER',
  sinker:     'SINKER',
  splitter:   'SPLITTER',
};

const PITCH_COLORS: Record<string, string> = {
  '4_seam':  Colors.primary,
  '2_seam':  '#5CE87A',
  slider:    '#4BA3E3',
  changeup:  Colors.warning,
  curveball: '#9B7FD4',
  cutter:    '#E34B7A',
  sinker:    '#7FD49B',
  splitter:  Colors.danger,
};

const TARGET_LABELS: Record<string, string> = {
  down_away:       'DOWN AWAY',
  waste_up:        'WASTE UP',
  back_foot:       'BACK FOOT',
  middle:          'MIDDLE',
  glove_side_knee: 'GLOVE-SIDE KNEE',
  middle_down:     'MIDDLE DOWN',
  middle_in:       'MIDDLE IN',
  up_away:         'UP AWAY',
  down_in:         'DOWN IN',
  arm_side:        'ARM SIDE',
};

const RESULT_ICONS: Record<string, string> = {
  ball:    '●',
  foul:    '▶',
  strike:  '✕',
  hit:     '↑',
};

function pitchLabel(p: string) { return PITCH_LABELS[p] ?? p.toUpperCase().replace(/_/g, ' '); }
function pitchColor(p: string) { return PITCH_COLORS[p] ?? Colors.textSecondary; }
function targetLabel(t: string) { return TARGET_LABELS[t] ?? t.toUpperCase().replace(/_/g, ' '); }

// ─── Component ────────────────────────────────────────────────────────────────

export default function PitchSequenceChess({ data, responses, feedback, onComplete }: Props) {
  const [selectedPitch, setSelectedPitch] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'acceptable' | 'wrong' | null>(null);
  const [step, setStep] = useState<'pitch' | 'target' | 'done'>('pitch');

  function handlePitchSelect(pitch: string) {
    if (step !== 'pitch') return;
    Haptics.selectionAsync();
    setSelectedPitch(pitch);
    setStep('target');
  }

  function handleTargetSelect(target: string) {
    if (step !== 'target' || !selectedPitch) return;
    Haptics.selectionAsync();
    setSelectedTarget(target);

    const best = responses.best_combo;
    const acceptable = responses.acceptable_combos ?? [];

    let outcome: 'correct' | 'acceptable' | 'wrong';
    if (selectedPitch === best.pitch && target === best.target) {
      outcome = 'correct';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (acceptable.some((c) => c.pitch === selectedPitch && c.target === target)) {
      outcome = 'acceptable';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      outcome = 'wrong';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setResult(outcome);
    setStep('done');
    onComplete(outcome !== 'wrong');
  }

  const ctx = data.context ?? {};

  return (
    <View style={styles.container}>
      {/* Context */}
      {ctx.count && (
        <View style={styles.ctxRow}>
          <View style={styles.ctxPill}><Text style={styles.ctxPillText}>COUNT {ctx.count}</Text></View>
          {ctx.outs !== undefined && <View style={styles.ctxPill}><Text style={styles.ctxPillText}>{ctx.outs} OUT{ctx.outs !== 1 ? 'S' : ''}</Text></View>}
          {ctx.runners?.length > 0 && <View style={styles.ctxPill}><Text style={styles.ctxPillText}>{ctx.runners.join(', ')}</Text></View>}
          {ctx.batter_side && <View style={styles.ctxPill}><Text style={styles.ctxPillText}>{ctx.batter_side.toUpperCase()} HITTER</Text></View>}
        </View>
      )}

      {/* Previous pitch timeline */}
      {(data.previous_pitches?.length ?? 0) > 0 && (
        <View style={styles.prevSection}>
          <Text style={styles.prevLabel}>PREVIOUS PITCHES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prevScroll}>
            {data.previous_pitches!.map((pp, i) => (
              <View key={i} style={styles.prevPill}>
                <View style={[styles.prevDot, { backgroundColor: pitchColor(pp.pitch) }]} />
                <View>
                  <Text style={[styles.prevPitchName, { color: pitchColor(pp.pitch) }]}>
                    {pitchLabel(pp.pitch)}
                  </Text>
                  <Text style={styles.prevDetail}>
                    {pp.location.replace(/_/g, ' ')} · {RESULT_ICONS[pp.result] ?? ''} {pp.result}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Step 1: Pick pitch */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.stepBadge, step !== 'pitch' && styles.stepBadgeDone]}>
            {step === 'pitch' ? (
              <Text style={styles.stepBadgeNum}>1</Text>
            ) : (
              <Ionicons name="checkmark" size={12} color={Colors.background} />
            )}
          </View>
          <Text style={styles.sectionLabel}>SELECT PITCH</Text>
        </View>
        <View style={styles.optionGrid}>
          {data.pitch_options.map((pitch) => {
            const isSelected = selectedPitch === pitch;
            const color = pitchColor(pitch);
            return (
              <Pressable
                key={pitch}
                style={[
                  styles.optionBtn,
                  isSelected && { borderColor: color, backgroundColor: `${color}18` },
                  step === 'done' && !isSelected && styles.optionFaded,
                  step === 'target' && !isSelected && styles.optionFaded,
                ]}
                onPress={() => handlePitchSelect(pitch)}
                disabled={step !== 'pitch'}
              >
                <View style={[styles.optionDot, { backgroundColor: color }]} />
                <Text style={[styles.optionText, isSelected && { color: color }]}>
                  {pitchLabel(pitch)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Step 2: Pick target */}
      <View style={[styles.section, step === 'pitch' && styles.sectionLocked]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.stepBadge, step === 'done' && styles.stepBadgeDone]}>
            {step === 'done' ? (
              <Ionicons name="checkmark" size={12} color={Colors.background} />
            ) : (
              <Text style={styles.stepBadgeNum}>2</Text>
            )}
          </View>
          <Text style={[styles.sectionLabel, step === 'pitch' && styles.sectionLabelLocked]}>
            SELECT TARGET
          </Text>
        </View>
        <View style={styles.optionGrid}>
          {data.target_options.map((target) => {
            const isSelected = selectedTarget === target;
            const isBest = result && responses.best_combo.target === target && responses.best_combo.pitch === selectedPitch;
            return (
              <Pressable
                key={target}
                style={[
                  styles.optionBtn,
                  styles.optionBtnTarget,
                  isSelected && result === 'correct' && styles.optionBtnCorrect,
                  isSelected && result === 'acceptable' && styles.optionBtnAcceptable,
                  isSelected && result === 'wrong' && styles.optionBtnWrong,
                  result && !isSelected && isBest && styles.optionBtnHint,
                  step === 'pitch' && styles.optionFaded,
                ]}
                onPress={() => handleTargetSelect(target)}
                disabled={step !== 'target'}
              >
                <Ionicons
                  name="locate"
                  size={11}
                  color={
                    isSelected && result === 'correct' ? Colors.primary :
                    isSelected && result === 'wrong' ? Colors.danger :
                    isSelected && result === 'acceptable' ? Colors.warning :
                    Colors.textTertiary
                  }
                />
                <Text style={[
                  styles.optionText,
                  isSelected && result === 'correct' && { color: Colors.primary },
                  isSelected && result === 'wrong' && { color: Colors.danger },
                  isSelected && result === 'acceptable' && { color: Colors.warning },
                ]}>
                  {targetLabel(target)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Feedback */}
      {result && (
        <View style={[
          styles.feedbackCard,
          result === 'correct' && styles.feedbackCorrect,
          result === 'acceptable' && styles.feedbackAcceptable,
          result === 'wrong' && styles.feedbackWrong,
        ]}>
          <Ionicons
            name={result === 'correct' ? 'checkmark-circle' : result === 'acceptable' ? 'alert-circle' : 'close-circle'}
            size={18}
            color={result === 'correct' ? Colors.primary : result === 'acceptable' ? Colors.warning : Colors.danger}
          />
          <View style={{ flex: 1 }}>
            {selectedPitch && selectedTarget && (
              <Text style={styles.feedbackCombo}>
                {pitchLabel(selectedPitch)} → {targetLabel(selectedTarget)}
              </Text>
            )}
            <Text style={[
              styles.feedbackText,
              { color: result === 'correct' ? Colors.primary : result === 'acceptable' ? Colors.warning : Colors.danger },
            ]}>
              {result === 'correct' ? feedback.correct : result === 'acceptable' ? (feedback.acceptable ?? feedback.correct) : feedback.wrong}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  ctxRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  ctxPill: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ctxPillText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  prevSection: { gap: Spacing.sm },
  prevLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  prevScroll: { gap: Spacing.sm, paddingRight: Spacing.lg },
  prevPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prevDot: { width: 8, height: 8, borderRadius: 4 },
  prevPitchName: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  prevDetail: { fontSize: 9, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  section: { gap: Spacing.sm },
  sectionLocked: { opacity: 0.45 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeDone: { backgroundColor: Colors.primary },
  stepBadgeNum: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
  },
  sectionLabelLocked: { color: Colors.textTertiary },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionBtnTarget: {},
  optionBtnCorrect: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  optionBtnAcceptable: { borderColor: Colors.warning, backgroundColor: 'rgba(255,183,0,0.1)' },
  optionBtnWrong: { borderColor: Colors.danger, backgroundColor: 'rgba(255,59,48,0.1)' },
  optionBtnHint: { borderColor: Colors.primaryBorder, opacity: 0.7 },
  optionFaded: { opacity: 0.4 },
  optionDot: { width: 8, height: 8, borderRadius: 4 },
  optionText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedbackCorrect: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryMuted },
  feedbackAcceptable: { borderColor: Colors.warning, backgroundColor: 'rgba(255,183,0,0.08)' },
  feedbackWrong: { borderColor: Colors.danger, backgroundColor: 'rgba(255,59,48,0.08)' },
  feedbackCombo: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  feedbackText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    flex: 1,
    lineHeight: 20,
  },
});
