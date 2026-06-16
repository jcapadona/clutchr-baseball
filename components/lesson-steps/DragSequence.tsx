import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface SequenceItem {
  id: string;
  label: string;
  description?: string;
}

interface DragSequenceStep {
  type?: string;
  prompt?: string;
  scenario?: string;
  instruction?: string;
  instructions?: string;
  items?: SequenceItem[];
  correct_order?: string[];
  tolerance?: number;
  feedback?: {
    correct?: string;
    acceptable?: string;
    poor?: string;
  };
  [key: string]: any;
}

interface Props {
  step: DragSequenceStep;
  onComplete: () => void;
}

type Result = 'correct' | 'acceptable' | 'poor';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function shuffleOnce<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scoreOrder(submitted: string[], correct: string[], tolerance: number): Result {
  const len = Math.max(submitted.length, correct.length);
  let misplaced = 0;
  for (let i = 0; i < len; i++) {
    if (submitted[i] !== correct[i]) misplaced++;
  }
  if (misplaced === 0) return 'correct';
  if (misplaced <= tolerance) return 'acceptable';
  return 'poor';
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function DragSequence({ step, onComplete }: Props) {
  const rawItems: SequenceItem[] = Array.isArray(step.items) ? step.items : [];
  const tolerance = step.tolerance ?? 0;

  // Build item lookup and validated correct_order
  const itemMap = useRef(new Map(rawItems.map(item => [item.id, item]))).current;
  const validCorrectOrder = useRef(
    Array.isArray(step.correct_order)
      ? step.correct_order.filter(id => itemMap.has(id))
      : rawItems.map(item => item.id)
  ).current;

  if (__DEV__) {
    if (!Array.isArray(step.correct_order)) {
      console.warn('[DragSequence] correct_order missing — using item input order as fallback');
    } else if (validCorrectOrder.length !== step.correct_order.length) {
      console.warn('[DragSequence] correct_order contains unknown IDs', {
        unknown: step.correct_order.filter(id => !itemMap.has(id)),
      });
    }
  }

  // Shuffled pool order (stable across renders)
  const shuffledItems = useRef(shuffleOnce(rawItems)).current;

  // Slots: array of item IDs (null = empty), one per item
  const [slots, setSlots] = useState<(string | null)[]>(
    Array(rawItems.length).fill(null)
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const placedIds = new Set(slots.filter((id): id is string => id !== null));
  const availableItems = shuffledItems.filter(item => !placedIds.has(item.id));
  const placedCount = placedIds.size;
  const allFilled = placedCount === rawItems.length;

  // ── Interaction handlers ──────────────────────────────────────────────────

  function handleAvailableTap(itemId: string) {
    if (submitted) return;
    Haptics.selectionAsync();
    setSelectedId(prev => (prev === itemId ? null : itemId));
  }

  function handleSlotTap(slotIndex: number) {
    if (submitted) return;
    const occupant = slots[slotIndex];

    if (selectedId) {
      // Place selected item — if slot occupied, return occupant to pool first
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSlots(prev => {
        const next = [...prev];
        next[slotIndex] = selectedId;
        return next;
      });
      setSelectedId(null);
    } else if (occupant) {
      // No selection — tap filled slot to remove
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSlots(prev => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
    }
    // Tap empty slot with no selection → do nothing
  }

  function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSlots(Array(rawItems.length).fill(null));
    setSelectedId(null);
  }

  function handleSubmit() {
    if (!allFilled || submitted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const submittedOrder = slots.filter((id): id is string => id !== null);
    const outcome = scoreOrder(submittedOrder, validCorrectOrder, tolerance);
    if (outcome === 'poor') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (outcome === 'acceptable') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setResult(outcome);
    setSubmitted(true);
    setSelectedId(null);
  }

  // ── Fallback: not enough items ────────────────────────────────────────────

  if (rawItems.length < 2) {
    if (__DEV__) console.warn('[DragSequence] Fewer than 2 items defined — rendering fallback');
    return (
      <View style={styles.fallback}>
        <Ionicons name="alert-circle" size={18} color={Colors.warning} />
        <View style={{ flex: 1 }}>
          <Text style={styles.fallbackTitle}>This sequence rep needs an update.</Text>
          <Text style={styles.fallbackBody}>Items have not been added yet. Keep moving.</Text>
        </View>
        <Pressable style={styles.continueBtn} onPress={onComplete}>
          <Text style={styles.continueBtnText}>Continue →</Text>
        </Pressable>
      </View>
    );
  }

  // ── Derived values for result display ─────────────────────────────────────

  const resultColor =
    result === 'correct'    ? Colors.primary :
    result === 'acceptable' ? Colors.warning :
    Colors.danger;

  const resultLabel =
    result === 'correct'    ? 'CORRECT ORDER' :
    result === 'acceptable' ? 'CLOSE ENOUGH'  :
    result === 'poor'       ? 'OUT OF ORDER'  : '';

  const feedbackText =
    result === 'correct'    ? (step.feedback?.correct    ?? 'Right sequence. Lock that in.') :
    result === 'acceptable' ? (step.feedback?.acceptable ?? 'Close. One step is off, but the core routine is there.') :
    result === 'poor'       ? (step.feedback?.poor       ?? 'Sequence matters. Study the correct order below.') : '';

  const submittedOrder = slots.filter((id): id is string => id !== null);

  return (
    <View style={styles.container}>
      {/* TAG */}
      <Text style={styles.tag}>SEQUENCE REP</Text>

      {/* SCENARIO */}
      {step.scenario ? (
        <View style={styles.scenarioCard}>
          <Text style={styles.scenarioLabel}>SITUATION</Text>
          <Text style={styles.scenarioText}>{step.scenario}</Text>
        </View>
      ) : null}

      {/* PROMPT */}
      <Text style={styles.prompt}>
        {step.prompt ?? step.instruction ?? step.instructions ?? 'Put these steps in order.'}
      </Text>

      {/* ── NUMBERED SLOTS ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>YOUR SEQUENCE</Text>
          {!submitted && placedCount > 0 && (
            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <Ionicons name="refresh" size={11} color="rgba(255,255,255,0.35)" />
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.slotList}>
          {slots.map((occupantId, idx) => {
            const occupant = occupantId ? itemMap.get(occupantId) : null;
            const hasSelection = !!selectedId;
            const isReadyToReceive = hasSelection && !submitted;

            // Post-submit slot coloring
            let slotResultColor: string | null = null;
            if (submitted && occupantId) {
              slotResultColor = occupantId === validCorrectOrder[idx] ? Colors.primary : Colors.danger;
            }

            return (
              <Pressable
                key={idx}
                style={[
                  styles.slot,
                  occupant ? styles.slotFilled : styles.slotEmpty,
                  isReadyToReceive && styles.slotReady,
                  slotResultColor === Colors.primary && styles.slotCorrect,
                  slotResultColor === Colors.danger && styles.slotWrong,
                ]}
                onPress={() => handleSlotTap(idx)}
                disabled={submitted && !occupant}
              >
                {/* Number badge */}
                <View style={[
                  styles.slotBadge,
                  slotResultColor ? { backgroundColor: slotResultColor } : null,
                ]}>
                  <Text style={styles.slotBadgeNum}>{idx + 1}</Text>
                </View>

                {occupant ? (
                  <Text style={[styles.slotLabel, slotResultColor ? { color: slotResultColor } : null]}>
                    {occupant.label}
                  </Text>
                ) : (
                  <Text style={styles.slotPlaceholder}>
                    {isReadyToReceive ? 'Tap to place here' : 'Empty'}
                  </Text>
                )}

                {/* Remove indicator when tappable and filled */}
                {occupant && !submitted && (
                  <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.2)" />
                )}

                {/* Result icon post-submit */}
                {submitted && occupant && (
                  <Ionicons
                    name={slotResultColor === Colors.primary ? 'checkmark-circle' : 'close-circle'}
                    size={15}
                    color={slotResultColor ?? Colors.textTertiary}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── AVAILABLE ITEMS ──────────────────────────────────────────────────── */}
      {!submitted && availableItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>AVAILABLE</Text>
            <Text style={styles.progressLabel}>
              {placedCount} / {rawItems.length} placed
            </Text>
          </View>

          <View style={styles.itemList}>
            {availableItems.map(item => {
              const isSelected = selectedId === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                  onPress={() => handleAvailableTap(item.id)}
                >
                  {isSelected && (
                    <View style={styles.selectedDot} />
                  )}
                  <View style={styles.itemCardText}>
                    <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>
                      {item.label}
                    </Text>
                    {item.description ? (
                      <Text style={styles.itemDesc}>{item.description}</Text>
                    ) : null}
                  </View>
                  {isSelected && (
                    <Ionicons name="arrow-forward-circle" size={18} color={Colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* SUBMIT */}
      {!submitted && (
        <Pressable
          style={[styles.submitBtn, !allFilled && styles.submitBtnOff]}
          onPress={handleSubmit}
          disabled={!allFilled}
        >
          <Text style={[styles.submitBtnText, !allFilled && styles.submitBtnTextOff]}>
            {allFilled ? 'Check Sequence →' : `${placedCount} / ${rawItems.length} placed`}
          </Text>
        </Pressable>
      )}

      {/* ── POST-SUBMIT ───────────────────────────────────────────────────────── */}
      {submitted && result && (
        <>
          {/* RESULT FEEDBACK */}
          <View style={[
            styles.feedbackCard,
            result === 'correct'    && styles.feedbackCorrect,
            result === 'acceptable' && styles.feedbackAcceptable,
            result === 'poor'       && styles.feedbackPoor,
          ]}>
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={
                  result === 'correct'    ? 'checkmark-circle' :
                  result === 'acceptable' ? 'alert-circle'     :
                  'close-circle'
                }
                size={16}
                color={resultColor}
              />
              <Text style={[styles.feedbackLabel, { color: resultColor }]}>
                {resultLabel}
              </Text>
            </View>
            <Text style={styles.feedbackText}>{feedbackText}</Text>
          </View>

          {/* CORRECT SEQUENCE REVEAL */}
          {result !== 'correct' && (
            <View style={styles.correctReveal}>
              <Text style={styles.revealLabel}>CORRECT SEQUENCE</Text>
              <View style={styles.revealList}>
                {validCorrectOrder.map((id, idx) => {
                  const item = itemMap.get(id);
                  const userHadItRight = submittedOrder[idx] === id;
                  if (!item) return null;
                  return (
                    <View key={id} style={styles.revealRow}>
                      <Text style={styles.revealNum}>{idx + 1}</Text>
                      <Text style={[
                        styles.revealItemLabel,
                        userHadItRight && styles.revealItemCorrect,
                      ]}>
                        {item.label}
                      </Text>
                      {userHadItRight && (
                        <Ionicons name="checkmark" size={12} color={Colors.primary} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* CONTINUE */}
          <Pressable style={styles.continueBtn} onPress={onComplete}>
            <Text style={styles.continueBtnText}>Continue →</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  tag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
  },

  // Scenario
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
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // Prompt
  prompt: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 23,
  },

  // Section
  section: {
    gap: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.3)',
  },

  // Slots
  slotList: {
    gap: Spacing.xs,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  slotEmpty: {
    backgroundColor: Colors.surface,
    borderColor: '#242424',
    borderStyle: 'dashed',
  },
  slotFilled: {
    backgroundColor: Colors.surface,
    borderColor: '#2A2A2A',
    borderStyle: 'solid',
  },
  slotReady: {
    borderColor: 'rgba(0,255,102,0.28)',
  },
  slotCorrect: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryMuted,
  },
  slotWrong: {
    borderColor: 'rgba(255,59,48,0.3)',
    backgroundColor: 'rgba(255,59,48,0.06)',
  },
  slotBadge: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  slotBadgeNum: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.5)',
  },
  slotLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  slotPlaceholder: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.2)',
    fontStyle: 'italic',
  },

  // Reset
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.3)',
  },

  // Available items
  itemList: {
    gap: Spacing.xs,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#1C1C1C',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 46,
  },
  itemCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#0D1F0F',
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    flexShrink: 0,
  },
  itemCardText: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.65)',
  },
  itemLabelSelected: {
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  itemDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.3)',
    lineHeight: 15,
  },

  // Submit
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  submitBtnOff: {
    backgroundColor: '#1A1A1A',
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
  submitBtnTextOff: {
    color: 'rgba(255,255,255,0.22)',
  },

  // Feedback
  feedbackCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  feedbackCorrect: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryMuted,
  },
  feedbackAcceptable: {
    borderColor: 'rgba(245,166,35,0.35)',
    backgroundColor: 'rgba(245,166,35,0.08)',
  },
  feedbackPoor: {
    borderColor: 'rgba(255,59,48,0.35)',
    backgroundColor: 'rgba(255,59,48,0.08)',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  feedbackLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  feedbackText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    lineHeight: 20,
  },

  // Correct sequence reveal
  correctReveal: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#242424',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  revealLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2,
  },
  revealList: {
    gap: 6,
  },
  revealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  revealNum: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.3)',
    width: 16,
    textAlign: 'right',
  },
  revealItemLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
  revealItemCorrect: {
    color: Colors.primary,
    fontFamily: 'Inter_500Medium',
  },

  // Continue
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

  // Fallback
  fallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  fallbackTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  fallbackBody: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
});
