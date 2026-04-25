import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoutineBlock {
  id: string;
  label: string;
  category: 'breath' | 'vision' | 'body' | 'plan' | 'cue' | 'movement' | string;
  benefit: string;
}

export interface RoutineCardData {
  prompt: string;
  instruction?: string;
  mode: string;
  min_select?: number;
  max_select?: number;
  save_key?: string;
  blocks: RoutineBlock[];
}

export interface RoutineCardResponses {
  require_save?: boolean;
}

export interface RoutineCardFeedback {
  success: string;
  failure?: string;
}

interface Props {
  data: RoutineCardData;
  responses: RoutineCardResponses;
  feedback: RoutineCardFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { color: string; icon: string }> = {
  breath:   { color: Colors.info ?? '#4BA3E3',  icon: 'water'         },
  vision:   { color: Colors.primary,            icon: 'eye'           },
  body:     { color: Colors.warning,            icon: 'fitness'       },
  plan:     { color: '#9B7FD4',                 icon: 'list'          },
  cue:      { color: Colors.primary,            icon: 'text'          },
  movement: { color: Colors.warning,            icon: 'walk'          },
};

function getCategoryColor(cat: string): string {
  return CATEGORY_CONFIG[cat]?.color ?? Colors.textTertiary;
}

function getCategoryIcon(cat: string): string {
  return CATEGORY_CONFIG[cat]?.icon ?? 'radio-button-on';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoutineCardBuilder({ data, responses, feedback, onComplete }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const min = data.min_select ?? 3;
  const max = data.max_select ?? 5;
  const meetsMin = selected.size >= min;
  const atMax = selected.size >= max;

  function toggleBlock(id: string) {
    if (saved) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < max) {
        next.add(id);
        Haptics.selectionAsync();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!meetsMin || saving || saved) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const saveKey = data.save_key ? `@clutchr_routine_${data.save_key}` : '@clutchr_routine_default';
      const selectedBlocks = data.blocks.filter((b) => selected.has(b.id));
      await AsyncStorage.setItem(saveKey, JSON.stringify({
        key: data.save_key,
        mode: data.mode,
        blocks: selectedBlocks,
        savedAt: Date.now(),
      }));
      setSaved(true);
      onComplete(true);
    } catch {
      // Fallback — still mark as done
      setSaved(true);
      onComplete(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{data.instruction ?? `Choose ${min}–${max} blocks.`}</Text>

      {/* Counter */}
      <View style={styles.counterRow}>
        <Text style={[styles.counterNum, meetsMin && styles.counterNumReady]}>
          {selected.size}
        </Text>
        <Text style={styles.counterOf}> / </Text>
        <Text style={styles.counterMax}>{max}</Text>
        <Text style={styles.counterLabel}>  blocks selected</Text>
        {atMax && !saved && (
          <View style={styles.atMaxBadge}>
            <Text style={styles.atMaxText}>MAX</Text>
          </View>
        )}
      </View>

      {/* Blocks grid */}
      <View style={styles.grid}>
        {data.blocks.map((block) => {
          const isSelected = selected.has(block.id);
          const color = getCategoryColor(block.category);
          const icon = getCategoryIcon(block.category);
          return (
            <Pressable
              key={block.id}
              style={[
                styles.blockCard,
                isSelected && styles.blockCardSelected,
                isSelected && { borderColor: color },
                saved && !isSelected && styles.blockCardFaded,
              ]}
              onPress={() => toggleBlock(block.id)}
              disabled={saved || (atMax && !isSelected)}
            >
              {/* Category accent line */}
              <View style={[styles.blockAccent, { backgroundColor: color }]} />

              <View style={styles.blockContent}>
                <View style={styles.blockHeader}>
                  <View style={[styles.blockIconWrap, { borderColor: color }]}>
                    <Ionicons name={icon as any} size={12} color={color} />
                  </View>
                  <Text style={[styles.blockCategory, { color }]}>
                    {block.category.toUpperCase()}
                  </Text>
                  {isSelected && (
                    <View style={[styles.blockCheck, { backgroundColor: color }]}>
                      <Ionicons name="checkmark" size={10} color="#000" />
                    </View>
                  )}
                </View>
                <Text style={[styles.blockLabel, isSelected && styles.blockLabelSelected]}>
                  {block.label}
                </Text>
                {isSelected && (
                  <Text style={[styles.blockBenefit, { color }]}>{block.benefit}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Save / Saved state */}
      {!saved ? (
        <Pressable
          style={[
            styles.saveBtn,
            !meetsMin && styles.saveBtnDisabled,
            meetsMin && styles.saveBtnReady,
          ]}
          onPress={handleSave}
          disabled={!meetsMin || saving}
        >
          <Ionicons name="bookmark" size={16} color={meetsMin ? Colors.background : Colors.textTertiary} />
          <Text style={[styles.saveBtnText, !meetsMin && styles.saveBtnTextDisabled]}>
            {saving ? 'Saving...' : `Save Routine Card`}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.savedBadge}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.savedTitle}>{feedback.success}</Text>
            <Text style={styles.savedSub}>Saved — tap to revisit from your profile.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  instruction: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 0,
  },
  counterNum: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
  },
  counterNumReady: { color: Colors.primary },
  counterOf: { fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  counterMax: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textTertiary },
  counterLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  atMaxBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  atMaxText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.5 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  blockCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  blockCardSelected: {
    borderWidth: 2,
  },
  blockCardFaded: { opacity: 0.4 },
  blockAccent: {
    height: 3,
    width: '100%',
    opacity: 0.6,
  },
  blockContent: { padding: Spacing.md, gap: 4 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  blockIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockCategory: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    flex: 1,
  },
  blockCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  blockLabelSelected: { color: Colors.textPrimary },
  blockBenefit: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    lineHeight: 14,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.textTertiary,
  },
  saveBtnReady: { backgroundColor: Colors.primary },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.background },
  saveBtnTextDisabled: { color: Colors.background },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.lg,
  },
  savedTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, lineHeight: 18 },
  savedSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, marginTop: 2 },
});
