import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JumpReadOption {
  id: string;
  label: string;
  quality: 'correct' | 'acceptable' | 'poor';
  feedback: string;
}

export interface JumpReadData {
  prompt: string;
  scenario: string;
  cue?: string;
  options: JumpReadOption[];
}

export interface JumpReadResponses {
  correct_id: string;
  acceptable_ids?: string[];
}

export interface JumpReadFeedback {
  correct: string;
  acceptable: string;
  poor: string;
}

interface Props {
  data: JumpReadData;
  responses: JumpReadResponses;
  feedback: JumpReadFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JumpRead({ data, responses, feedback, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const selectedOption = data.options.find((o) => o.id === selected);
  const quality = selectedOption?.quality ?? null;

  const qualityColor =
    quality === 'correct' ? Colors.primary
    : quality === 'acceptable' ? Colors.warning
    : quality === 'poor' ? Colors.danger
    : Colors.textTertiary;

  const globalFeedback =
    quality === 'correct' ? feedback.correct
    : quality === 'acceptable' ? feedback.acceptable
    : quality === 'poor' ? feedback.poor
    : '';

  function handleSelect(id: string) {
    if (resolved) return;
    Haptics.selectionAsync();
    setSelected(id);
    const opt = data.options.find((o) => o.id === id);
    if (opt?.quality === 'correct') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (opt?.quality === 'poor') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTimeout(() => {
      setResolved(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      onComplete(opt?.quality === 'correct' || opt?.quality === 'acceptable');
    }, 400);
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
      {/* Scenario block */}
      <View style={styles.scenarioCard}>
        <View style={styles.scenarioHeader}>
          <View style={styles.situationBadge}>
            <Ionicons name="baseball" size={10} color={Colors.warning} />
            <Text style={styles.situationText}>SITUATION</Text>
          </View>
        </View>
        <Text style={styles.scenarioText}>{data.scenario}</Text>
        {data.cue && (
          <View style={styles.cueRow}>
            <View style={styles.cueDot} />
            <Text style={styles.cueText}>{data.cue}</Text>
          </View>
        )}
      </View>

      {/* Prompt */}
      <Text style={styles.prompt}>{data.prompt}</Text>

      {/* Options */}
      <View style={styles.optionGrid}>
        {data.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswered = !!selected;

          const borderColor =
            isAnswered && isSelected
              ? opt.quality === 'correct' ? Colors.primary
                : opt.quality === 'acceptable' ? Colors.warning
                : Colors.danger
              : isAnswered && opt.id === responses.correct_id
              ? `${Colors.primary}33`
              : Colors.border;

          const bgColor =
            isAnswered && isSelected
              ? opt.quality === 'correct' ? Colors.primaryMuted
                : opt.quality === 'acceptable' ? 'rgba(245,166,35,0.1)'
                : 'rgba(255,59,48,0.08)'
              : Colors.surface;

          return (
            <Pressable
              key={opt.id}
              style={[
                styles.optionBtn,
                { borderColor, backgroundColor: bgColor },
                isSelected && styles.optionBtnSelected,
              ]}
              onPress={() => handleSelect(opt.id)}
              disabled={isAnswered}
            >
              <Text style={[
                styles.optionLabel,
                isSelected && { color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
              ]}>
                {opt.label}
              </Text>
              {isAnswered && isSelected && (
                <Ionicons
                  name={opt.quality === 'correct' ? 'checkmark-circle' : opt.quality === 'acceptable' ? 'ellipse' : 'close-circle'}
                  size={16}
                  color={borderColor}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Feedback + Retry */}
      {resolved && selectedOption && (
        <Animated.View style={[styles.feedbackCard, { borderColor: qualityColor, opacity: fadeAnim }]}>
          <View style={styles.feedbackHeader}>
            <View style={[styles.qualityBadge, { borderColor: qualityColor }]}>
              <Text style={[styles.qualityText, { color: qualityColor }]}>
                {quality === 'correct' ? 'BEST READ' : quality === 'acceptable' ? 'SAFE READ' : 'WRONG READ'}
              </Text>
            </View>
          </View>
          <Text style={styles.feedbackGlobal}>{globalFeedback}</Text>
          <Text style={styles.feedbackDetail}>{selectedOption.feedback}</Text>
          {quality === 'poor' && (
            <Pressable style={styles.retryBtn} onPress={handleRetry}>
              <Ionicons name="refresh" size={13} color={Colors.primary} />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },

  scenarioCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  scenarioHeader: { flexDirection: 'row', alignItems: 'center' },
  situationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: `${Colors.warning}55`,
    backgroundColor: 'rgba(245,166,35,0.08)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  situationText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.warning, letterSpacing: 1.2 },
  scenarioText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 23,
  },
  cueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
    marginTop: 5,
    flexShrink: 0,
  },
  cueText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    lineHeight: 19,
    flex: 1,
  },

  prompt: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 2,
    gap: Spacing.xs,
  },
  optionBtnSelected: {},
  optionLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    flex: 1,
  },

  feedbackCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center' },
  qualityBadge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  qualityText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.3 },
  feedbackGlobal: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  feedbackDetail: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
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
