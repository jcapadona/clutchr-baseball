import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThrowTarget {
  id: string;
  label: string;
  short_label: string;
  quality: 'correct' | 'acceptable' | 'poor';
  feedback: string;
}

export interface ThrowDecisionData {
  prompt: string;
  inning: string;
  outs: number;
  score_state: string;
  runners: string;
  ball_location: string;
  role: string;
  targets: ThrowTarget[];
}

export interface ThrowDecisionResponses {
  correct_id: string;
  acceptable_ids?: string[];
}

export interface ThrowDecisionFeedback {
  correct: string;
  acceptable: string;
  poor: string;
}

interface Props {
  data: ThrowDecisionData;
  responses: ThrowDecisionResponses;
  feedback: ThrowDecisionFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── Field diagram ─────────────────────────────────────────────────────────────

function FieldDiagram({ runners }: { runners: string }) {
  return (
    <View style={fStyles.field}>
      {/* Diamond */}
      <View style={fStyles.diamond}>
        <View style={fStyles.base2} />
        <View style={fStyles.baseRow}>
          <View style={fStyles.base3} />
          <View style={fStyles.base1} />
        </View>
        <View style={fStyles.homeBase} />
        <View style={fStyles.baseLine12} />
        <View style={fStyles.baseLine23} />
        <View style={fStyles.baseLine34} />
        <View style={fStyles.baseLine4h} />
      </View>
      <Text style={fStyles.runnerLabel}>{runners}</Text>
    </View>
  );
}

const fStyles = StyleSheet.create({
  field: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: '#111',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  diamond: {
    width: 80,
    height: 80,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  base2: {
    position: 'absolute',
    top: 2,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  baseRow: {
    position: 'absolute',
    flexDirection: 'row',
    top: '50%',
    marginTop: -8,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
  },
  base3: { width: 16, height: 16, backgroundColor: '#fff', transform: [{ rotate: '45deg' }], borderRadius: 2 },
  base1: { width: 16, height: 16, backgroundColor: Colors.warning, transform: [{ rotate: '45deg' }], borderRadius: 2 },
  homeBase: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    backgroundColor: Colors.primary,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  baseLine12: { position: 'absolute', width: 1, height: 50, backgroundColor: `${Colors.border}55`, top: '25%', left: '75%' },
  baseLine23: { position: 'absolute', width: 50, height: 1, backgroundColor: `${Colors.border}55`, top: '25%', left: '25%' },
  baseLine34: { position: 'absolute', width: 1, height: 50, backgroundColor: `${Colors.border}55`, top: '25%', left: '25%' },
  baseLine4h: { position: 'absolute', width: 50, height: 1, backgroundColor: `${Colors.border}55`, bottom: '25%', left: '25%' },
  runnerLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textTertiary },
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function ThrowDecisionBoard({ data, responses, feedback, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const selectedTarget = data.targets.find((t) => t.id === selected);
  const quality = selectedTarget?.quality ?? null;

  const qualityColor =
    quality === 'correct' ? Colors.primary
    : quality === 'acceptable' ? Colors.warning
    : quality === 'poor' ? Colors.danger
    : Colors.border;

  const globalFeedback =
    quality === 'correct' ? feedback.correct
    : quality === 'acceptable' ? feedback.acceptable
    : quality === 'poor' ? feedback.poor
    : '';

  function handleSelect(id: string) {
    if (resolved) return;
    Haptics.selectionAsync();
    setSelected(id);
    const target = data.targets.find((t) => t.id === id);
    if (target?.quality === 'correct') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (target?.quality === 'poor') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTimeout(() => {
      setResolved(true);
      onComplete(target?.quality === 'correct' || target?.quality === 'acceptable');
    }, 380);
  }

  function handleRetry() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setSelected(null);
      setResolved(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }

  return (
    <View style={styles.container}>
      {/* Situation strip */}
      <View style={styles.situation}>
        <View style={styles.situationRow}>
          <View style={styles.chip}>
            <Ionicons name="baseball" size={9} color={Colors.warning} />
            <Text style={styles.chipText}>{data.inning}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{data.outs} OUT{data.outs !== 1 ? 'S' : ''}</Text>
          </View>
          <View style={[styles.chip, { borderColor: `${Colors.info ?? '#4BA3E3'}44` }]}>
            <Text style={[styles.chipText, { color: Colors.info ?? '#4BA3E3' }]}>{data.score_state}</Text>
          </View>
        </View>

        <View style={styles.situationBody}>
          <FieldDiagram runners={data.runners} />
          <View style={styles.situationDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={12} color={Colors.textTertiary} />
              <Text style={styles.detailText}>{data.ball_location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person" size={12} color={Colors.textTertiary} />
              <Text style={styles.detailText}>{data.role}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Prompt */}
      <Text style={styles.prompt}>{data.prompt}</Text>

      {/* Throw targets */}
      <Animated.View style={{ opacity: fadeAnim, gap: Spacing.sm }}>
        <View style={styles.targetGrid}>
          {data.targets.map((target) => {
            const isSelected = selected === target.id;
            const isAnswered = !!selected;
            const borderColor =
              isAnswered && isSelected
                ? target.quality === 'correct' ? Colors.primary
                  : target.quality === 'acceptable' ? Colors.warning
                  : Colors.danger
                : Colors.border;
            const bgColor =
              isAnswered && isSelected
                ? target.quality === 'correct' ? Colors.primaryMuted
                  : target.quality === 'acceptable' ? 'rgba(245,166,35,0.1)'
                  : 'rgba(255,59,48,0.08)'
                : Colors.surface;

            return (
              <Pressable
                key={target.id}
                style={[
                  styles.targetBtn,
                  { borderColor, backgroundColor: bgColor },
                ]}
                onPress={() => handleSelect(target.id)}
                disabled={isAnswered}
              >
                <Text style={[
                  styles.targetShort,
                  isSelected && { color: borderColor },
                ]}>
                  {target.short_label}
                </Text>
                <Text style={styles.targetFull} numberOfLines={2}>{target.label}</Text>
                {isAnswered && isSelected && (
                  <Ionicons
                    name={
                      target.quality === 'correct' ? 'checkmark-circle'
                      : target.quality === 'acceptable' ? 'ellipse'
                      : 'close-circle'
                    }
                    size={18}
                    color={borderColor}
                    style={styles.targetIcon}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Feedback */}
      {resolved && selectedTarget && (
        <View style={[styles.feedbackCard, { borderColor: qualityColor }]}>
          <View style={styles.fbHeaderRow}>
            <View style={[styles.fbBadge, { borderColor: qualityColor }]}>
              <Text style={[styles.fbBadgeText, { color: qualityColor }]}>
                {quality === 'correct' ? 'BEST THROW' : quality === 'acceptable' ? 'ACCEPTABLE' : 'WRONG TARGET'}
              </Text>
            </View>
          </View>
          <Text style={styles.fbGlobal}>{globalFeedback}</Text>
          <Text style={styles.fbDetail}>{selectedTarget.feedback}</Text>
          {quality === 'poor' && (
            <Pressable style={styles.retryBtn} onPress={handleRetry}>
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

  situation: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  situationRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: `${Colors.warning}44`,
    backgroundColor: 'rgba(245,166,35,0.08)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.warning, letterSpacing: 0.5 },

  situationBody: { flexDirection: 'row', gap: Spacing.lg, alignItems: 'flex-start' },
  situationDetails: { flex: 1, gap: Spacing.sm, paddingTop: Spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs },
  detailText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, flex: 1, lineHeight: 17 },

  prompt: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },

  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  targetBtn: {
    width: '48%',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 2,
    gap: 4,
    position: 'relative',
    minHeight: 80,
  },
  targetShort: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  targetFull: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    lineHeight: 15,
  },
  targetIcon: { position: 'absolute', top: 10, right: 10 },

  feedbackCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  fbHeaderRow: { flexDirection: 'row' },
  fbBadge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  fbBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.3 },
  fbGlobal: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, lineHeight: 21 },
  fbDetail: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 19 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginTop: Spacing.xs,
  },
  retryText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
});
