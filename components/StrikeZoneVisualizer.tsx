import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── Zone definitions ────────────────────────────────────────────────────────

const ZONES_9 = [
  { id: 'up_in',       label: 'UP\nIN',     row: 0, col: 0 },
  { id: 'up_mid',      label: 'UP\nMID',    row: 0, col: 1 },
  { id: 'up_away',     label: 'UP\nAWAY',   row: 0, col: 2 },
  { id: 'mid_in',      label: 'MID\nIN',    row: 1, col: 0 },
  { id: 'middle',      label: 'MIDDLE',     row: 1, col: 1 },
  { id: 'middle_away', label: 'MID\nAWAY',  row: 1, col: 2 },
  { id: 'down_in',     label: 'DOWN\nIN',   row: 2, col: 0 },
  { id: 'down_mid',    label: 'DOWN\nMID',  row: 2, col: 1 },
  { id: 'down_away',   label: 'DOWN\nAWAY', row: 2, col: 2 },
];

// Edge zones for swing_take mode
const EDGE_ZONES = [
  { id: 'up_edge',          label: 'ABOVE ZONE',       row: -1, col: 1 },
  { id: 'down_away_edge',   label: 'OFF AWAY EDGE',    row: 3,  col: 2 },
  { id: 'down_in_edge',     label: 'OFF IN EDGE',      row: 3,  col: 0 },
  { id: 'away_edge',        label: 'OFF AWAY',         row: 1,  col: 3 },
];

// Alias map to unify zone name variants used in the pack data
const ZONE_ALIASES: Record<string, string> = {
  away:      'middle_away',
  mid_away:  'middle_away',
  in:        'mid_in',
  up:        'up_mid',
  down:      'down_mid',
};

function resolveZone(z: string): string {
  return ZONE_ALIASES[z] ?? z;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StrikeZoneData {
  prompt: string;
  instruction?: string;
  mode: 'hunt_zone' | 'swing_take';
  zone_layout?: '9_box' | '9_box_plus_edges';
  show_pitch_path?: boolean;
  context?: Record<string, any>;
}

export interface StrikeZoneResponses {
  correct_zones?: string[];
  acceptable_zones?: string[];
  wrong_zones?: string[];
  correct_action?: string;
  correct_finish_zone?: string;
  acceptable_actions?: string[];
  wrong_actions?: string[];
}

export interface StrikeZoneFeedback {
  correct: string;
  acceptable?: string;
  wrong: string;
}

interface Props {
  data: StrikeZoneData;
  responses: StrikeZoneResponses;
  feedback: StrikeZoneFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── Hunt Zone Mode ───────────────────────────────────────────────────────────

function HuntZoneMode({ data, responses, feedback, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'acceptable' | 'wrong' | null>(null);

  const correctZones = (responses.correct_zones ?? []).map(resolveZone);
  const acceptableZones = (responses.acceptable_zones ?? []).map(resolveZone);

  function handleTap(zoneId: string) {
    if (result) return;
    Haptics.selectionAsync();
    const resolved = resolveZone(zoneId);
    setSelected(resolved);
    let outcome: 'correct' | 'acceptable' | 'wrong';
    if (correctZones.includes(resolved)) {
      outcome = 'correct';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (acceptableZones.includes(resolved)) {
      outcome = 'acceptable';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      outcome = 'wrong';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setResult(outcome);
    onComplete(outcome !== 'wrong');
  }

  const zones = ZONES_9;
  const rows = [
    zones.filter((z) => z.row === 0),
    zones.filter((z) => z.row === 1),
    zones.filter((z) => z.row === 2),
  ];

  function zoneStyle(zoneId: string) {
    const resolved = resolveZone(zoneId);
    if (!result || selected !== resolved) return {};
    if (result === 'correct') return { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted };
    if (result === 'acceptable') return { borderColor: Colors.warning, backgroundColor: 'rgba(255,183,0,0.12)' };
    return { borderColor: Colors.danger, backgroundColor: 'rgba(255,59,48,0.10)' };
  }

  function isCorrectZone(zoneId: string) {
    return result && correctZones.includes(resolveZone(zoneId));
  }

  return (
    <View style={styles.container}>
      {/* Context badge */}
      {data.context && (
        <ContextBadge ctx={data.context} />
      )}

      <Text style={styles.instruction}>{data.instruction ?? 'Tap your damage lane.'}</Text>

      {/* Zone grid */}
      <View style={styles.zoneGrid}>
        {/* Batter label */}
        <View style={styles.zoneGridLabels}>
          <Text style={styles.sideLabel}>IN</Text>
          <Text style={styles.sideLabel}>AWAY</Text>
        </View>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.zoneRow}>
            {row.map((zone) => {
              const isSelected = selected === resolveZone(zone.id);
              const isCorrectHighlight = isCorrectZone(zone.id);
              return (
                <Pressable
                  key={zone.id}
                  style={[
                    styles.zoneCell,
                    isSelected && styles.zoneCellSelected,
                    isSelected && zoneStyle(zone.id),
                    result && !isSelected && isCorrectHighlight && styles.zoneCellCorrectHint,
                  ]}
                  onPress={() => handleTap(zone.id)}
                  disabled={!!result}
                >
                  {isSelected && result === 'correct' && (
                    <Ionicons name="checkmark" size={14} color={Colors.primary} />
                  )}
                  {isSelected && result === 'wrong' && (
                    <Ionicons name="close" size={14} color={Colors.danger} />
                  )}
                  {isSelected && result === 'acceptable' && (
                    <Ionicons name="remove" size={14} color={Colors.warning} />
                  )}
                  {!isSelected && (
                    <Text style={styles.zoneCellLabel}>{zone.label}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
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

// ─── Swing / Take Mode ────────────────────────────────────────────────────────

function SwingTakeMode({ data, responses, feedback, onComplete }: Props) {
  const [action, setAction] = useState<'take' | 'swing' | null>(null);
  const [result, setResult] = useState<'correct' | 'acceptable' | 'wrong' | null>(null);

  const correctAction = responses.correct_action ?? 'take';

  function handleAction(act: 'take' | 'swing') {
    if (result) return;
    Haptics.selectionAsync();
    setAction(act);
    let outcome: 'correct' | 'acceptable' | 'wrong';
    if (act === correctAction) {
      outcome = 'correct';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if ((responses.acceptable_actions ?? []).includes(act)) {
      outcome = 'acceptable';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      outcome = 'wrong';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setResult(outcome);
    onComplete(outcome !== 'wrong');
  }

  return (
    <View style={styles.container}>
      {data.context && <ContextBadge ctx={data.context} />}

      {/* Pitch path indicator */}
      {data.show_pitch_path && (
        <View style={styles.pitchPathWrap}>
          <View style={styles.pitchPathTrack}>
            <View style={styles.pitchPathBall} />
            <View style={styles.pitchPathArrow}>
              <Text style={styles.pitchPathText}>starts middle → breaks late off plate</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.instruction}>{data.instruction ?? 'Swing or take?'}</Text>

      {/* Take / Swing buttons */}
      <View style={styles.swingTakeRow}>
        {(['take', 'swing'] as const).map((act) => {
          const isSelected = action === act;
          const isCurrent = !!result && isSelected;
          const isRight = isCurrent && result === 'correct';
          const isWrong = isCurrent && result === 'wrong';
          return (
            <Pressable
              key={act}
              style={[
                styles.swingTakeBtn,
                act === 'take' && styles.swingTakeBtnTake,
                act === 'swing' && styles.swingTakeBtnSwing,
                isRight && styles.swingTakeBtnCorrect,
                isWrong && styles.swingTakeBtnWrong,
              ]}
              onPress={() => handleAction(act)}
              disabled={!!result}
            >
              <Text style={[
                styles.swingTakeBtnText,
                isRight && { color: Colors.primary },
                isWrong && { color: Colors.danger },
              ]}>
                {act.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

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

// ─── Context Badge ────────────────────────────────────────────────────────────

function ContextBadge({ ctx }: { ctx: Record<string, any> }) {
  const parts: string[] = [];
  if (ctx.count) parts.push(ctx.count);
  if (ctx.outs !== undefined) parts.push(`${ctx.outs} out${ctx.outs !== 1 ? 's' : ''}`);
  if (ctx.runners?.length) parts.push(`Runners: ${ctx.runners.join(', ')}`);
  if (ctx.score_state) parts.push(ctx.score_state.replace('_', ' '));
  if (!parts.length) return null;
  return (
    <View style={styles.contextBadge}>
      {parts.map((p, i) => (
        <View key={i} style={styles.contextPill}>
          <Text style={styles.contextPillText}>{p}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function StrikeZoneVisualizer(props: Props) {
  if (props.data.mode === 'swing_take') {
    return <SwingTakeMode {...props} />;
  }
  return <HuntZoneMode {...props} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  contextPill: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contextPillText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  zoneGrid: {
    gap: 4,
    alignSelf: 'center',
    width: '100%',
  },
  zoneGridLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sideLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  zoneRow: {
    flexDirection: 'row',
    gap: 4,
  },
  zoneCell: {
    flex: 1,
    aspectRatio: 1.1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 68,
  },
  zoneCellSelected: {
    borderWidth: 2,
  },
  zoneCellCorrectHint: {
    borderColor: Colors.primaryBorder,
    opacity: 0.6,
  },
  zoneCellLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textTertiary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  pitchPathWrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pitchPathTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pitchPathBall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.warning,
  },
  pitchPathArrow: { flex: 1 },
  pitchPathText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  swingTakeRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  swingTakeBtn: {
    flex: 1,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swingTakeBtnTake: { borderColor: Colors.info ?? Colors.primary },
  swingTakeBtnSwing: { borderColor: Colors.warning },
  swingTakeBtnCorrect: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  swingTakeBtnWrong: { borderColor: Colors.danger, backgroundColor: 'rgba(255,59,48,0.08)' },
  swingTakeBtnText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
    letterSpacing: 2,
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
