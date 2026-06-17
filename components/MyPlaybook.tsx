import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ProgressBar } from '@/components/ProgressBar';

// ─── CUE SLOT DEFINITIONS ────────────────────────────────────────────────────
// Five situations every baseball player faces. Each gets one personal cue.
// The athlete chooses from curated options OR writes their own.
// These slots are used throughout every lesson, tool, and print card.

export interface CueSlot {
  id: string;
  situation: string;            // when this cue fires
  prompt: string;               // the question we ask the athlete
  examples: string[];           // curated options drawn from source files
  hint: string;                 // coaching context for why this matters
  placeholder: string;          // text input placeholder
}

const CUE_SLOTS: CueSlot[] = [
  {
    id: 'reset',
    situation: 'After a mistake',
    prompt: 'What is your one word or phrase after an error, strikeout, or bad pitch?',
    hint: 'This fires immediately after a mistake — before your brain has time to spiral. It has to be short enough to say in half a second. Elite players practice this word the same way they practice their swing.',
    examples: ['Next.', 'Flush it.', 'Next play.', 'So what.', 'Move on.', 'Short memory.', 'Same player.', 'Play!'],
    placeholder: 'e.g. Next.',
  },
  {
    id: 'approach',
    situation: 'Stepping into the box or onto the rubber',
    prompt: 'What is your pre-pitch thought every time you are about to compete?',
    hint: 'This is what Mike Trout calls his "swing thought" and what pitchers call their "mound cue." It fires right before every rep. It should direct your attention to exactly one thing — not fix everything.',
    examples: ['See it early.', 'Attack the zone.', 'Hunt middle.', 'Trust my stuff.', 'Short and quick.', 'One pitch.', 'See the glove.', 'My zone.'],
    placeholder: 'e.g. See it early.',
  },
  {
    id: 'pressure',
    situation: 'When the moment gets big',
    prompt: 'What do you tell yourself when the pressure spikes — bases loaded, big count, late game?',
    hint: 'Pressure is when cues matter most. Without one, your brain defaults to "do not screw this up." With one, it defaults to your process. This cue should feel like a hand on your shoulder.',
    examples: ['One pitch.', 'I have been here.', 'My process.', 'Same pitch, new count.', 'Compete.', 'Execute.', 'This is my moment.', 'Stay in it.'],
    placeholder: 'e.g. One pitch.',
  },
  {
    id: 'confidence',
    situation: 'When your confidence drops',
    prompt: 'What is your identity cue — the one thing you say to remind yourself who you are as a player?',
    hint: 'This is different from the others. This one is not about the next pitch. It is about who you are at your best. Athletes who have this cue recover from slumps faster because they have an anchor outside of results.',
    examples: ['I belong here.', 'I have done the work.', 'Built different.', 'I compete.', 'I am ready.', 'Trust the process.', 'I earn it every day.', 'I know who I am.'],
    placeholder: 'e.g. I belong here.',
  },
  {
    id: 'focus',
    situation: 'Between pitches — staying locked in',
    prompt: 'What pulls your focus back to the present when your mind starts to wander?',
    hint: 'Every inning has dead time. Pitchers wait for signs. Hitters sit in the dugout. Fielders stand and wait. Elite players use this space to stay mentally ready. Your between-pitch thought is what brings you back.',
    examples: ['This pitch.', 'Lock in.', 'Be here.', 'Ready position.', 'See the ball.', 'Breathe.', 'Stay in it.', 'Right now.'],
    placeholder: 'e.g. This pitch.',
  },
];

// ─── LABEL NAMES (used throughout the app) ───────────────────────────────────
// Your source files use all of these interchangeably — so we do too.

const SLOT_LABELS: Record<string, { noun: string; verb: string }> = {
  reset:      { noun: 'Reset Cue',         verb: 'your reset' },
  approach:   { noun: 'Pre-Pitch Thought',  verb: 'your approach cue' },
  pressure:   { noun: 'Pressure Cue',       verb: 'your pressure thought' },
  confidence: { noun: 'Identity Cue',       verb: 'your identity' },
  focus:      { noun: 'Focus Trigger',      verb: 'your focus trigger' },
};

// ─── CUE SLOT ICONS ──────────────────────────────────────────────────────────

const SLOT_ICONS: Record<string, string> = {
  reset:      'refresh-circle',
  approach:   'eye',
  pressure:   'flame',
  confidence: 'shield-checkmark',
  focus:      'radio-button-on',
};

const SLOT_COLORS: Record<string, string> = {
  reset:      Colors.warning,
  approach:   Colors.primary,
  pressure:   Colors.danger,
  confidence: Colors.purple,
  focus:      Colors.info,
};

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface PlayerPlaybook {
  reset: string;
  approach: string;
  pressure: string;
  confidence: string;
  focus: string;
  built_at: string;
}

// Default empty playbook
export const EMPTY_PLAYBOOK: PlayerPlaybook = {
  reset: '',
  approach: '',
  pressure: '',
  confidence: '',
  focus: '',
  built_at: '',
};

// ─── EXAMPLE CHIP ─────────────────────────────────────────────────────────────

function ExampleChip({
  text,
  selected,
  onPress,
}: {
  text: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[chipStyles.chip, selected && chipStyles.chipSelected]}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
    >
      {selected && <Ionicons name="checkmark" size={11} color={Colors.primary} />}
      <Text style={[chipStyles.chipText, selected && chipStyles.chipTextSelected]}>{text}</Text>
    </Pressable>
  );
}

// ─── SLOT BUILDER ─────────────────────────────────────────────────────────────

function SlotBuilder({
  slot,
  value,
  onChange,
  isActive,
  isComplete,
  onActivate,
}: {
  slot: CueSlot;
  value: string;
  onChange: (v: string) => void;
  isActive: boolean;
  isComplete: boolean;
  onActivate: () => void;
}) {
  const color = SLOT_COLORS[slot.id];
  const label = SLOT_LABELS[slot.id];
  const icon = SLOT_ICONS[slot.id];
  const expandAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isActive ? 1 : 0,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  return (
    <Pressable
      style={[
        slotStyles.card,
        isActive && { borderColor: color + '60', borderWidth: 1.5 },
        isComplete && !isActive && slotStyles.cardComplete,
      ]}
      onPress={onActivate}
    >
      {/* Header row */}
      <View style={slotStyles.header}>
        <View style={[slotStyles.iconWrap, { backgroundColor: color + '18' }]}>
          {isComplete && !isActive
            ? <Ionicons name="checkmark" size={16} color={color} />
            : <Ionicons name={icon as any} size={16} color={color} />
          }
        </View>
        <View style={slotStyles.headerText}>
          <Text style={[slotStyles.situationLabel, { color }]}>{label.noun.toUpperCase()}</Text>
          <Text style={slotStyles.situationText}>{slot.situation}</Text>
        </View>
        {isComplete && !isActive && (
          <View style={[slotStyles.cuePreview, { borderColor: color + '40', backgroundColor: color + '10' }]}>
            <Text style={[slotStyles.cuePreviewText, { color }]} numberOfLines={1}>{value}</Text>
          </View>
        )}
        {!isComplete && (
          <View style={slotStyles.emptyBadge}>
            <Text style={slotStyles.emptyBadgeText}>TAP</Text>
          </View>
        )}
      </View>

      {/* Expanded content */}
      {isActive && (
        <Animated.View style={{ opacity: expandAnim, gap: Spacing.lg }}>
          <View style={slotStyles.divider} />

          {/* Coaching hint */}
          <View style={[slotStyles.hintBox, { borderLeftColor: color }]}>
            <Text style={slotStyles.hintText}>{slot.hint}</Text>
          </View>

          {/* Question */}
          <Text style={slotStyles.prompt}>{slot.prompt}</Text>

          {/* Example chips */}
          <Text style={slotStyles.examplesLabel}>
            WHAT OTHER PLAYERS USE — OR WRITE YOUR OWN BELOW
          </Text>
          <View style={slotStyles.chipGrid}>
            {slot.examples.map((ex) => (
              <ExampleChip
                key={ex}
                text={ex}
                selected={value === ex}
                onPress={() => onChange(ex)}
              />
            ))}
          </View>

          {/* Custom input */}
          <View style={[slotStyles.inputWrap, { borderColor: value && !slot.examples.includes(value) ? color : Colors.border }]}>
            <TextInput
              style={slotStyles.input}
              value={slot.examples.includes(value) ? '' : value}
              onChangeText={(t) => onChange(t)}
              placeholder={slot.placeholder}
              placeholderTextColor={Colors.textTertiary}
              maxLength={40}
              returnKeyType="done"
            />
            {value !== '' && !slot.examples.includes(value) && (
              <Ionicons name="checkmark-circle" size={18} color={color} />
            )}
          </View>

          {value !== '' && (
            <View style={[slotStyles.lockedCue, { backgroundColor: color + '12', borderColor: color + '40' }]}>
              <Text style={slotStyles.lockedCueLabel}>{label.noun.toUpperCase()}</Text>
              <Text style={[slotStyles.lockedCueText, { color }]}>{value}</Text>
            </View>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

// ─── PLAYBOOK COMPLETE VIEW ───────────────────────────────────────────────────

function PlaybookComplete({
  playbook,
  onEdit,
  onBack,
}: {
  playbook: PlayerPlaybook;
  onEdit: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <View style={completeStyles.container}>
      {/* Back button */}
      <Pressable style={completeStyles.backRow} onPress={onBack}>
        <Ionicons name="arrow-back" size={16} color={Colors.primary} />
        <Text style={completeStyles.backText}>Back</Text>
      </Pressable>

      <View style={completeStyles.headerRow}>
        <Text style={completeStyles.title}>MY PLAYBOOK</Text>
        <Text style={completeStyles.subtitle}>Your personal mental vocabulary</Text>
      </View>

      <View style={completeStyles.card}>
        {CUE_SLOTS.map((slot, i) => {
          const color = SLOT_COLORS[slot.id];
          const label = SLOT_LABELS[slot.id];
          const value = (playbook as any)[slot.id] ?? '';
          return (
            <Pressable
              key={slot.id}
              style={[
                completeStyles.row,
                i < CUE_SLOTS.length - 1 && completeStyles.rowBorder,
              ]}
              onPress={() => onEdit(slot.id)}
            >
              <View style={[completeStyles.rowIcon, { backgroundColor: color + '18' }]}>
                <Ionicons name={SLOT_ICONS[slot.id] as any} size={14} color={color} />
              </View>
              <View style={completeStyles.rowText}>
                <Text style={[completeStyles.rowLabel, { color }]}>{label.noun}</Text>
                <Text style={completeStyles.rowSituation}>{slot.situation}</Text>
              </View>
              <Text style={[completeStyles.rowCue, { color }]}>
                {value || '—'}
              </Text>
              <Ionicons name="create-outline" size={14} color={Colors.textTertiary} />
            </Pressable>
          );
        })}
      </View>

      <View style={completeStyles.infoBox}>
        <Ionicons name="information-circle" size={14} color={Colors.primary} />
        <Text style={completeStyles.infoText}>
          These cues now appear throughout your Clutchr lessons, tools, and print cards. Every rep speaks your language.
        </Text>
      </View>
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function MyPlaybookScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, updateAthleteState } = useAthlete();

  // Load existing playbook from athlete state
  const existingPlaybook: PlayerPlaybook = (athleteState as any)?.playbook ?? EMPTY_PLAYBOOK;

  const [cues, setCues] = useState<Record<string, string>>({
    reset:      existingPlaybook.reset ?? '',
    approach:   existingPlaybook.approach ?? '',
    pressure:   existingPlaybook.pressure ?? '',
    confidence: existingPlaybook.confidence ?? '',
    focus:      existingPlaybook.focus ?? '',
  });
  const [activeSlot, setActiveSlot] = useState<string | null>(
    existingPlaybook.reset === '' ? 'reset' : null
  );
  const [saved, setSaved] = useState(existingPlaybook.built_at !== '');
  const [justSaved, setJustSaved] = useState(false);
  const saveAnim = useRef(new Animated.Value(1)).current;

  const completedCount = Object.values(cues).filter((v) => v !== '').length;
  const allComplete = completedCount === CUE_SLOTS.length;

  function handleChange(slotId: string, value: string) {
    setCues((prev) => ({ ...prev, [slotId]: value }));
    setSaved(false);
  }

  function handleActivate(slotId: string) {
    setActiveSlot((prev) => prev === slotId ? null : slotId);
    Haptics.selectionAsync();
  }

  async function handleSave() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const playbook: PlayerPlaybook = {
      ...cues,
      built_at: new Date().toISOString(),
    } as PlayerPlaybook;

    await updateAthleteState({ playbook } as any);
    setSaved(true);
    setJustSaved(true);
    setActiveSlot(null);

    // Bounce animation
    Animated.sequence([
      Animated.spring(saveAnim, { toValue: 1.08, tension: 200, friction: 8, useNativeDriver: true }),
      Animated.spring(saveAnim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start(() => setTimeout(() => setJustSaved(false), 2000));
  }

  // Show the complete view when fully built and saved
  if (saved && activeSlot === null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <PlaybookComplete
            playbook={{ ...cues, built_at: existingPlaybook.built_at } as PlayerPlaybook}
            onEdit={(id) => { setActiveSlot(id); setSaved(false); }}
            onBack={() => router.back()}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with back button */}
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color={Colors.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>MY PLAYBOOK</Text>
          <Text style={styles.subtitle}>
            Build your personal mental vocabulary. These cues will appear throughout every lesson and rep in Clutchr.
          </Text>
        </View>

        {/* Progress strip */}
        <View style={styles.progressStrip}>
          <ProgressBar value={completedCount / CUE_SLOTS.length} height={4} />
          <Text style={styles.progressLabel}>
            {completedCount} of {CUE_SLOTS.length} cues built
          </Text>
        </View>

        {/* What this is */}
        {completedCount === 0 && (
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Why this matters</Text>
            <Text style={styles.introText}>
              Every elite player has a personal mental vocabulary — specific words or phrases they use in specific situations. Mike Trout calls it his swing thought. Pitchers call it their mound cue. Infielders call it their pre-pitch thought.
            </Text>
            <Text style={styles.introText}>
              Research is clear: self-generated cues outperform assigned ones. Clutchr assigns you cues by default. This is where you replace them with yours.
            </Text>
            <Text style={styles.introCallout}>
              Once you build your playbook, every lesson in the app speaks your language — not a generic one.
            </Text>
          </View>
        )}

        {/* Slot builders */}
        <View style={styles.slots}>
          {CUE_SLOTS.map((slot) => (
            <SlotBuilder
              key={slot.id}
              slot={slot}
              value={cues[slot.id] ?? ''}
              onChange={(v) => handleChange(slot.id, v)}
              isActive={activeSlot === slot.id}
              isComplete={cues[slot.id] !== ''}
              onActivate={() => handleActivate(slot.id)}
            />
          ))}
        </View>

        {/* Save button */}
        {completedCount > 0 && (
          <Animated.View style={{ transform: [{ scale: saveAnim }] }}>
            <Pressable
              style={[styles.saveBtn, !allComplete && styles.saveBtnPartial]}
              onPress={handleSave}
            >
              <Ionicons
                name={justSaved ? 'checkmark-circle' : 'book'}
                size={18}
                color={Colors.background}
              />
              <Text style={styles.saveBtnText}>
                {justSaved
                  ? 'Playbook saved. Every rep speaks your language.'
                  : allComplete
                  ? 'Save My Playbook'
                  : `Save ${completedCount} of ${CUE_SLOTS.length} cues`}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Skip note */}
        {completedCount < CUE_SLOTS.length && completedCount > 0 && (
          <Text style={styles.skipNote}>
            You can save a partial playbook and finish the rest later. Tap any slot to add or update your cue.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },

  header: { paddingTop: Spacing.md, gap: 6 },
  headerRow: { paddingTop: Spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.sm },
  backBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 1 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 19 },

  progressStrip: { gap: 5 },
  progressLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  introCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
    padding: Spacing.lg, gap: Spacing.sm,
  },
  introTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary },
  introText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 21 },
  introCallout: {
    fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary,
    lineHeight: 21, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },

  slots: { gap: Spacing.md },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: Radius.lg, paddingVertical: Spacing.lg,
  },
  saveBtnPartial: { backgroundColor: Colors.primaryBorder },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.background },

  skipNote: {
    fontSize: 12, fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary, textAlign: 'center', lineHeight: 17,
  },
});

const slotStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.md,
  },
  cardComplete: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryGlow },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconWrap: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerText: { flex: 1, gap: 2 },
  situationLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  situationText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  cuePreview: {
    borderRadius: Radius.pill, borderWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, maxWidth: 120,
  },
  cuePreviewText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  emptyBadge: {
    backgroundColor: Colors.surface, borderRadius: Radius.pill,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyBadgeText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },

  divider: { height: 1, backgroundColor: Colors.border },

  hintBox: {
    borderLeftWidth: 3, paddingLeft: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  hintText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 20 },

  prompt: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, lineHeight: 22 },

  examplesLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 2 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.md,
    borderWidth: 1.5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary, paddingVertical: 4,
  },

  lockedCue: {
    borderRadius: Radius.md, borderWidth: 1,
    padding: Spacing.lg, gap: 6, marginTop: Spacing.sm,
  },
  lockedCueLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },
  lockedCueText: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
});

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.pill, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
});

const completeStyles = StyleSheet.create({
  container: { gap: Spacing.lg },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: Spacing.md },
  backText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  headerRow: { gap: 4 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 1 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, gap: Spacing.sm,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowText: { flex: 1, gap: 1 },
  rowLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  rowSituation: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  rowCue: { fontSize: 13, fontFamily: 'Inter_700Bold', maxWidth: 120, textAlign: 'right' },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.primaryMuted, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primaryBorder,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },
});
