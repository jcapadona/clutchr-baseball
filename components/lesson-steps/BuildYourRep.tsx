import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAthlete } from '@/context/AthleteContext';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface RepItem {
  id: string;
  label: string;
  description?: string;
  category?: string;
}

interface BuildYourRepStep {
  title?: string;
  prompt?: string;
  instructions?: string;
  body?: string;
  available_items?: RepItem[];
  items?: RepItem[];
  save_to_profile_key?: string;
  min_selections?: number;
  max_selections?: number;
  [key: string]: any;
}

interface Props {
  step: BuildYourRepStep;
  onComplete: () => void;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function BuildYourRep({ step, onComplete }: Props) {
  const { updateAthleteState } = useAthlete();
  const items: RepItem[] = step.available_items ?? step.items ?? [];
  const minSelections = step.min_selections ?? 1;
  const maxSelections = step.max_selections ?? items.length;
  const saveKey = step.save_to_profile_key;

  const [sequence, setSequence] = useState<RepItem[]>([]);
  const [saving, setSaving] = useState(false);

  function handleItemTap(item: RepItem) {
    // Already in sequence — remove it
    if (sequence.some(s => s.id === item.id)) {
      setSequence(prev => prev.filter(s => s.id !== item.id));
      return;
    }
    if (sequence.length >= maxSelections) return;
    setSequence(prev => [...prev, item]);
  }

  function handleRemoveFromSequence(id: string) {
    setSequence(prev => prev.filter(s => s.id !== id));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      if (saveKey && sequence.length > 0) {
        await updateAthleteState({ [saveKey]: sequence.map(s => s.id) } as any);
      }
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  const groupedItems: Record<string, RepItem[]> = {};
  for (const item of items) {
    const cat = item.category ?? 'Items';
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat].push(item);
  }
  const categories = Object.keys(groupedItems);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.tag}>BUILD YOUR REP</Text>
        <Text style={styles.title}>{step.title ?? step.prompt ?? 'Build Your Routine'}</Text>
        {(step.instructions ?? step.body) && (
          <Text style={styles.sub}>{step.instructions ?? step.body}</Text>
        )}
      </View>

      {/* SEQUENCE STRIP */}
      {sequence.length > 0 && (
        <View style={styles.sequenceWrap}>
          <Text style={styles.sequenceLabel}>Your sequence</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sequenceScroll}>
            <View style={styles.sequenceRow}>
              {sequence.map((item, idx) => (
                <Pressable
                  key={item.id}
                  style={styles.sequenceChip}
                  onPress={() => handleRemoveFromSequence(item.id)}
                >
                  <Text style={styles.sequenceNum}>{idx + 1}</Text>
                  <Text style={styles.sequenceChipText}>{item.label}</Text>
                  <Text style={styles.sequenceX}>×</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ITEM GRID */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.itemsContent}
        style={styles.itemsScroll}
      >
        {categories.map(cat => (
          <View key={cat} style={styles.categoryBlock}>
            {categories.length > 1 && (
              <Text style={styles.categoryLabel}>{cat.toUpperCase()}</Text>
            )}
            {groupedItems[cat].map(item => {
              const inSeq = sequence.some(s => s.id === item.id);
              const seqIdx = sequence.findIndex(s => s.id === item.id);
              const disabled = !inSeq && sequence.length >= maxSelections;
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.itemCard,
                    inSeq && styles.itemCardActive,
                    disabled && styles.itemCardDisabled,
                  ]}
                  onPress={() => handleItemTap(item)}
                  disabled={disabled}
                >
                  <View style={styles.itemLeft}>
                    {inSeq && (
                      <View style={styles.itemBadge}>
                        <Text style={styles.itemBadgeNum}>{seqIdx + 1}</Text>
                      </View>
                    )}
                    <View style={styles.itemText}>
                      <Text style={[styles.itemLabel, inSeq && styles.itemLabelActive]}>
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text style={styles.itemDesc}>{item.description}</Text>
                      )}
                    </View>
                  </View>
                  {inSeq && (
                    <Text style={styles.itemCheck}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* SAVE BUTTON */}
      <Pressable
        style={[styles.saveBtn, (sequence.length < minSelections || saving) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={sequence.length < minSelections || saving}
      >
        <Text style={styles.saveBtnText}>
          {saving
            ? 'Saving...'
            : sequence.length < minSelections
            ? `Pick at least ${minSelections}`
            : `Lock In Rep (${sequence.length})`}
        </Text>
      </Pressable>
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
  header: {
    gap: Spacing.xs,
  },
  tag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  sub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  sequenceWrap: {
    gap: Spacing.xs,
  },
  sequenceLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sequenceScroll: {
    flexGrow: 0,
  },
  sequenceRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: 2,
  },
  sequenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2410',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 5,
  },
  sequenceNum: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    minWidth: 14,
    textAlign: 'center',
  },
  sequenceChipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
  },
  sequenceX: {
    fontSize: 13,
    color: 'rgba(34,204,94,0.6)',
    lineHeight: 16,
  },
  itemsScroll: {
    flex: 1,
  },
  itemsContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  categoryBlock: {
    gap: Spacing.sm,
  },
  categoryLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1C1C1C',
  },
  itemCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#0D1F0F',
  },
  itemCardDisabled: {
    opacity: 0.35,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  itemBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBadgeNum: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.6)',
  },
  itemLabelActive: {
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  itemDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.3)',
    lineHeight: 15,
  },
  itemCheck: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  saveBtnDisabled: {
    backgroundColor: '#1A1A1A',
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
});
