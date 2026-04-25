import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LadderItem {
  id: string;
  label: string;
}

export interface LeverageLadderData {
  prompt: string;
  situation: string;
  instruction: string;
  items: LadderItem[];
}

export interface LeverageLadderResponses {
  correct_order: string[];
  feedback_by_rank?: Record<string, string>;
}

export interface LeverageLadderFeedback {
  correct: string;
  acceptable: string;
  poor: string;
}

interface Props {
  data: LeverageLadderData;
  responses: LeverageLadderResponses;
  feedback: LeverageLadderFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeverageLadder({ data, responses, feedback, onComplete }: Props) {
  // ranked = ordered list of item IDs the user has placed
  const [ranked, setRanked] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null); // id highlighted for placement
  const [submitted, setSubmitted] = useState(false);
  const [scoreLabel, setScoreLabel] = useState<'correct' | 'acceptable' | 'poor' | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const unranked = data.items.filter((item) => !ranked.includes(item.id));
  const canSubmit = ranked.length === data.items.length && !submitted;

  function handleTapUnranked(id: string) {
    if (submitted) return;
    Haptics.selectionAsync();
    if (pending === id) {
      setPending(null);
    } else {
      setPending(id);
    }
  }

  function handleTapSlot(slotIndex: number) {
    if (submitted || pending === null) return;
    // If slot is occupied, swap: move existing back to unranked pool then place pending
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRanked((prev) => {
      const next = [...prev];
      // extend to length if needed
      while (next.length <= slotIndex) next.push('');
      next[slotIndex] = pending!;
      // remove duplicate occurrences of pending at other indices
      const filtered = next.map((v, i) => (v === pending && i !== slotIndex ? '' : v));
      return filtered;
    });
    setPending(null);
  }

  function handleRemoveFromSlot(slotIndex: number) {
    if (submitted) return;
    Haptics.selectionAsync();
    setRanked((prev) => {
      const next = [...prev];
      next[slotIndex] = '';
      return next;
    });
  }

  function handleSubmit() {
    if (!canSubmit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Score: compare ranked order vs correct_order
    // each position match = 1 point
    const correct = responses.correct_order;
    let matches = 0;
    for (let i = 0; i < ranked.length; i++) {
      if (ranked[i] === correct[i]) matches++;
    }
    const ratio = matches / correct.length;
    const result: 'correct' | 'acceptable' | 'poor' =
      ratio >= 0.75 ? 'correct'
      : ratio >= 0.5 ? 'acceptable'
      : 'poor';

    setScoreLabel(result);
    setSubmitted(true);
    onComplete(result !== 'poor');
  }

  function handleRetry() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setRanked([]);
      setPending(null);
      setSubmitted(false);
      setScoreLabel(null);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }

  const qualityColor =
    scoreLabel === 'correct' ? Colors.primary
    : scoreLabel === 'acceptable' ? Colors.warning
    : scoreLabel === 'poor' ? Colors.danger
    : Colors.border;

  const globalFeedback =
    scoreLabel === 'correct' ? feedback.correct
    : scoreLabel === 'acceptable' ? feedback.acceptable
    : scoreLabel === 'poor' ? feedback.poor
    : '';

  const slots = Array.from({ length: data.items.length }, (_, i) => ranked[i] ?? '');

  return (
    <View style={styles.container}>
      {/* Situation */}
      <View style={styles.situationCard}>
        <View style={styles.situationBadge}>
          <Ionicons name="layers" size={9} color={Colors.danger} />
          <Text style={styles.situationBadgeText}>HIGH LEVERAGE</Text>
        </View>
        <Text style={styles.situationText}>{data.situation}</Text>
      </View>

      <Text style={styles.instruction}>{data.instruction}</Text>

      <Animated.View style={{ opacity: fadeAnim, gap: Spacing.md }}>
        {/* Ranked slots (top = #1 = highest priority) */}
        <View style={styles.slotsSection}>
          <Text style={styles.slotsLabel}>RANK ORDER  ↑  HIGHEST PRIORITY</Text>
          <View style={styles.slots}>
            {slots.map((itemId, i) => {
              const item = data.items.find((it) => it.id === itemId);
              const hasPending = pending !== null;
              const isSlotFilled = !!item;

              // After submit: color by match
              let slotBorder = hasPending && !isSlotFilled ? `${Colors.primary}66` : Colors.border;
              let slotBg = Colors.surface;
              if (submitted && isSlotFilled) {
                const correct = responses.correct_order[i] === itemId;
                slotBorder = correct ? Colors.primary : Colors.warning;
                slotBg = correct ? Colors.primaryMuted : 'rgba(245,166,35,0.09)';
              }

              return (
                <Pressable
                  key={i}
                  style={[styles.slot, { borderColor: slotBorder, backgroundColor: slotBg }]}
                  onPress={() => isSlotFilled ? handleRemoveFromSlot(i) : handleTapSlot(i)}
                  disabled={submitted}
                >
                  <View style={[styles.rankBadge, i === 0 && styles.rankBadgeTop]}>
                    <Text style={[styles.rankNum, i === 0 && styles.rankNumTop]}>#{i + 1}</Text>
                  </View>
                  {item ? (
                    <Text style={styles.slotItemText} numberOfLines={2}>{item.label}</Text>
                  ) : (
                    <Text style={styles.slotEmpty}>
                      {hasPending ? 'Tap to place' : 'Empty'}
                    </Text>
                  )}
                  {submitted && isSlotFilled && (
                    <Ionicons
                      name={responses.correct_order[i] === itemId ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={responses.correct_order[i] === itemId ? Colors.primary : Colors.warning}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                  {!submitted && isSlotFilled && (
                    <Ionicons name="close" size={14} color={Colors.textTertiary} style={{ marginLeft: 'auto' }} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Unranked pool */}
        {!submitted && unranked.length > 0 && (
          <View style={styles.pool}>
            <Text style={styles.poolLabel}>TAP TO SELECT  →  TAP A SLOT TO PLACE</Text>
            <View style={styles.poolItems}>
              {unranked.map((item) => {
                const isPending = pending === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.poolItem,
                      isPending && styles.poolItemPending,
                    ]}
                    onPress={() => handleTapUnranked(item.id)}
                  >
                    <Text style={[styles.poolItemText, isPending && styles.poolItemTextPending]}>
                      {item.label}
                    </Text>
                    {isPending && (
                      <Ionicons name="arrow-up" size={14} color={Colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </Animated.View>

      {/* Submit */}
      {!submitted && (
        <Pressable
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Ionicons name="checkmark" size={16} color={canSubmit ? Colors.background : Colors.textTertiary} />
          <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
            Lock In Order
          </Text>
        </Pressable>
      )}

      {/* Feedback */}
      {submitted && scoreLabel && (
        <View style={[styles.feedbackCard, { borderColor: qualityColor }]}>
          <View style={[styles.fbBadge, { borderColor: qualityColor }]}>
            <Text style={[styles.fbBadgeText, { color: qualityColor }]}>
              {scoreLabel === 'correct' ? 'EXECUTION FIRST' : scoreLabel === 'acceptable' ? 'CLOSE' : 'REORDER NEEDED'}
            </Text>
          </View>
          <Text style={styles.fbGlobal}>{globalFeedback}</Text>
          {scoreLabel === 'poor' && (
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

  situationCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  situationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: `${Colors.danger}55`,
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  situationBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.danger, letterSpacing: 1.2 },
  situationText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, lineHeight: 22 },

  instruction: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },

  slotsSection: { gap: Spacing.sm },
  slotsLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1.2 },
  slots: { gap: Spacing.sm },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    minHeight: 52,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankBadgeTop: { backgroundColor: Colors.danger },
  rankNum: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textTertiary },
  rankNumTop: { color: '#fff' },
  slotItemText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, flex: 1, lineHeight: 18 },
  slotEmpty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, flex: 1, fontStyle: 'italic' },

  pool: { gap: Spacing.sm },
  poolLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1.2 },
  poolItems: { gap: Spacing.sm },
  poolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  poolItemPending: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  poolItemText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, flex: 1 },
  poolItemTextPending: { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.danger,
  },
  submitBtnDisabled: { backgroundColor: Colors.border, opacity: 0.5 },
  submitText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.background },
  submitTextDisabled: { color: Colors.textTertiary },

  feedbackCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  fbBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  fbBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.3 },
  fbGlobal: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, lineHeight: 21 },
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
  },
  retryText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
});
