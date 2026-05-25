import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

let diamondOverlay: any = null;
try { diamondOverlay = require('../assets/overlays/diamond-decision-board.png'); } catch (_) {}

// ─── Target definitions ───────────────────────────────────────────────────────

type BaseTarget =
  | 'home' | '1B' | '2B' | '3B'
  | 'cutoff_home' | 'cutoff_2B'
  | 'charge_bunt' | 'hold_and_read' | 'cover_3B' | 'drift_back'
  | '1B_if_no_play' | '3B_if_runner_breaks_bad'
  | string;

interface Target {
  id: string;
  label: string;
  x: number; // 0–1 fraction of board width
  y: number; // 0–1 fraction of board height
  shape?: 'base' | 'circle' | 'action';
}

// Positions on the bird's-eye diamond board
// Board: 280×280, home at bottom center, 1B right, 2B top, 3B left
const BASE_TARGETS: Target[] = [
  { id: 'home',        label: 'HOME',   x: 0.5,  y: 0.88, shape: 'base'   },
  { id: '1B',          label: '1B',     x: 0.88, y: 0.5,  shape: 'base'   },
  { id: '2B',          label: '2B',     x: 0.5,  y: 0.12, shape: 'base'   },
  { id: '3B',          label: '3B',     x: 0.12, y: 0.5,  shape: 'base'   },
  { id: 'cutoff_home', label: 'CUTOFF\nHOME',  x: 0.5,  y: 0.65, shape: 'circle' },
  { id: 'cutoff_2B',   label: 'CUTOFF\n2B',    x: 0.5,  y: 0.35, shape: 'circle' },
];

const ACTION_TARGETS: Target[] = [
  { id: 'charge_bunt',     label: 'CHARGE\nBUNT',    x: 0.18, y: 0.72, shape: 'action' },
  { id: 'hold_and_read',   label: 'HOLD &\nREAD',    x: 0.5,  y: 0.6,  shape: 'action' },
  { id: 'cover_3B',        label: 'COVER\n3B',       x: 0.12, y: 0.5,  shape: 'action' },
  { id: 'drift_back',      label: 'DRIFT\nBACK',     x: 0.18, y: 0.28, shape: 'action' },
  { id: '1B_if_no_play',   label: '1B IF\nNO PLAY',  x: 0.88, y: 0.5,  shape: 'action' },
];

function getAllTargets(mode: string): Target[] {
  if (mode === 'defensive_alignment') {
    return [
      ...BASE_TARGETS.filter((t) => ['home', '1B', '2B', '3B'].includes(t.id)),
      ...ACTION_TARGETS,
    ];
  }
  return BASE_TARGETS;
}

// Aliases so pack data matches rendered targets
const TARGET_ALIASES: Record<string, string> = {
  '3B_if_runner_breaks_bad': '3B_if_runner_breaks_bad',
};

function resolveTarget(t: string): string {
  return TARGET_ALIASES[t] ?? t;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FieldIQData {
  prompt: string;
  instruction?: string;
  mode: 'throw_priority' | 'defensive_alignment';
  field_view?: 'birds_eye';
  context?: Record<string, any>;
}

export interface FieldIQResponses {
  correct_target: string;
  acceptable_targets?: string[];
  wrong_targets?: string[];
}

export interface FieldIQFeedback {
  correct: string;
  acceptable?: string;
  wrong: string;
}

interface Props {
  data: FieldIQData;
  responses: FieldIQResponses;
  feedback: FieldIQFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── Diamond Board ────────────────────────────────────────────────────────────

const BOARD_SIZE = 260;

function DiamondBoard({
  targets,
  selected,
  result,
  correctTarget,
  onTap,
}: {
  targets: Target[];
  selected: string | null;
  result: 'correct' | 'acceptable' | 'wrong' | null;
  correctTarget: string;
  onTap: (id: string) => void;
}) {
  return (
    <ImageBackground source={diamondOverlay} style={[boardStyles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]} imageStyle={{ opacity: 0.25 }} resizeMode="contain">
      {/* Diamond field lines */}
      <View style={boardStyles.fieldCircle} />
      <View style={boardStyles.diamondLines}>
        {/* Base paths drawn as thin lines using rotation trick */}
        <View style={boardStyles.basePath1} />
        <View style={boardStyles.basePath2} />
      </View>

      {/* Targets */}
      {targets.map((t) => {
        const isSelected = selected === t.id;
        const isCorrectHint = result && resolveTarget(correctTarget) === t.id;
        const isRight = isSelected && result === 'correct';
        const isAcceptable = isSelected && result === 'acceptable';
        const isWrong = isSelected && result === 'wrong';

        return (
          <Pressable
            key={t.id}
            style={[
              boardStyles.target,
              t.shape === 'base' && boardStyles.baseTarget,
              t.shape === 'circle' && boardStyles.circleTarget,
              t.shape === 'action' && boardStyles.actionTarget,
              {
                left: t.x * BOARD_SIZE - (t.shape === 'action' ? 30 : 22),
                top: t.y * BOARD_SIZE - (t.shape === 'action' ? 20 : 22),
              },
              isSelected && boardStyles.targetSelected,
              isRight && boardStyles.targetCorrect,
              isAcceptable && boardStyles.targetAcceptable,
              isWrong && boardStyles.targetWrong,
              result && !isSelected && isCorrectHint && boardStyles.targetHint,
            ]}
            onPress={() => onTap(t.id)}
            disabled={!!result}
          >
            {isRight && <Ionicons name="checkmark" size={10} color={Colors.primary} />}
            {isWrong && <Ionicons name="close" size={10} color={Colors.danger} />}
            <Text style={[
              boardStyles.targetLabel,
              t.shape === 'action' && boardStyles.targetLabelAction,
              isRight && { color: Colors.primary },
              isWrong && { color: Colors.danger },
              isAcceptable && { color: Colors.warning },
            ]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </ImageBackground>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FieldIQBoard({ data, responses, feedback, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'acceptable' | 'wrong' | null>(null);

  const targets = getAllTargets(data.mode);
  const correctTarget = resolveTarget(responses.correct_target);
  const acceptableTargets = (responses.acceptable_targets ?? []).map(resolveTarget);

  function handleTap(id: string) {
    if (result) return;
    Haptics.selectionAsync();
    setSelected(id);
    let outcome: 'correct' | 'acceptable' | 'wrong';
    if (resolveTarget(id) === correctTarget) {
      outcome = 'correct';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (acceptableTargets.includes(resolveTarget(id))) {
      outcome = 'acceptable';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      outcome = 'wrong';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setResult(outcome);
    onComplete(outcome !== 'wrong');
  }

  // Context display
  const ctx = data.context ?? {};
  const contextParts: string[] = [];
  if (ctx.outs !== undefined) contextParts.push(`${ctx.outs} out${ctx.outs !== 1 ? 's' : ''}`);
  if (ctx.runners?.length) contextParts.push(`Runners: ${Array.isArray(ctx.runners) ? ctx.runners.join(', ') : String(ctx.runners)}`);
  if (ctx.score_state) contextParts.push(ctx.score_state.replace(/_/g, ' '));
  if (ctx.position) contextParts.push(`Position: ${ctx.position}`);

  return (
    <View style={styles.container}>
      {contextParts.length > 0 && (
        <View style={styles.contextBadge}>
          {contextParts.map((p, i) => (
            <View key={i} style={styles.pill}>
              <Text style={styles.pillText}>{p}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.instruction}>{data.instruction ?? 'Tap the best play.'}</Text>

      {/* Board */}
      <View style={styles.boardWrap}>
        <DiamondBoard
          targets={targets}
          selected={selected}
          result={result}
          correctTarget={correctTarget}
          onTap={handleTap}
        />
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
          <Text style={[
            styles.feedbackText,
            { color: result === 'correct' ? Colors.primary : result === 'acceptable' ? Colors.warning : Colors.danger },
          ]}>
            {result === 'correct' ? feedback.correct : result === 'acceptable' ? (feedback.acceptable ?? feedback.correct) : feedback.wrong}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const boardStyles = StyleSheet.create({
  board: {
    position: 'relative',
    backgroundColor: 'rgba(34,204,94,0.04)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'visible',
  },
  fieldCircle: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    borderRadius: 200,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    top: '15%',
    left: '15%',
  },
  diamondLines: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  basePath1: {
    position: 'absolute',
    width: '71%',
    height: 1,
    backgroundColor: Colors.border,
    top: '50%',
    left: '14.5%',
    transform: [{ rotate: '45deg' }],
  },
  basePath2: {
    position: 'absolute',
    width: '71%',
    height: 1,
    backgroundColor: Colors.border,
    top: '50%',
    left: '14.5%',
    transform: [{ rotate: '-45deg' }],
  },
  target: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseTarget: {
    width: 44,
    height: 44,
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
  },
  circleTarget: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  actionTarget: {
    width: 60,
    height: 40,
    borderRadius: Radius.sm,
    borderStyle: 'dashed',
  },
  targetSelected: { borderColor: Colors.primary },
  targetCorrect: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  targetAcceptable: { borderColor: Colors.warning, backgroundColor: 'rgba(255,183,0,0.1)' },
  targetWrong: { borderColor: Colors.danger, backgroundColor: 'rgba(255,59,48,0.1)' },
  targetHint: { borderColor: Colors.primaryBorder, opacity: 0.7 },
  targetLabel: {
    fontSize: 7,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    textAlign: 'center',
    letterSpacing: 0.3,
    transform: [{ rotate: '-45deg' }],
  },
  targetLabelAction: {
    fontSize: 7,
    transform: [],
  },
});

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  instruction: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  contextBadge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  boardWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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
  feedbackText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    flex: 1,
    lineHeight: 20,
  },
});
