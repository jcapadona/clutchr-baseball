import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import type { SeasonPhase, Struggle, PositionRole } from '@/context/AthleteContext';

// ─── DATA ────────────────────────────────────────────────────────────────────

const POSITIONS: { id: PositionRole; label: string; desc: string }[] = [
  { id: 'pitcher',   label: 'Pitcher',    desc: 'On the mound'      },
  { id: 'catcher',   label: 'Catcher',    desc: 'Behind the dish'   },
  { id: 'infielder', label: 'Infielder',  desc: 'Corners or middle' },
  { id: 'outfielder',label: 'Outfielder', desc: 'Grass and gaps'    },
];

const SEASON_PHASES: { id: SeasonPhase; label: string }[] = [
  { id: 'preseason',      label: 'Preseason'       },
  { id: 'in_season',      label: 'In Season'       },
  { id: 'offseason_build',label: 'Offseason Build'  },
  { id: 'slump_reset',    label: 'Slump Reset'     },
  { id: 'return_to_throw',label: 'Return to Throw' },
];

const STRUGGLES: { id: Struggle; label: string }[] = [
  { id: 'bouncing_back',    label: 'Bouncing Back'    },
  { id: 'confidence',       label: 'Confidence'       },
  { id: 'pregame_nerves',   label: 'Pregame Nerves'   },
  { id: 'throwing_safely',  label: 'Throwing Safely'  },
  { id: 'throwing_strikes', label: 'Throwing Strikes' },
  { id: 'fielding_cleanly', label: 'Fielding Cleanly' },
  { id: 'better_routine',   label: 'Better Routine'   },
  { id: 'staying_locked_in',label: 'Staying Locked In'},
  { id: 'reading_hitters',  label: 'Reading Hitters'  },
  { id: 'plate_approach',   label: 'Plate Approach'   },
];

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, updateAthleteState } = useAthlete();

  const [selectedRole, setSelectedRole] = useState<PositionRole>(
    athleteState?.primary_role ?? 'infielder'
  );
  const [isTwoWay, setIsTwoWay] = useState(
    athleteState?.is_two_way ?? false
  );
  const [selectedPhase, setSelectedPhase] = useState<SeasonPhase>(
    athleteState?.season_phase ?? 'in_season'
  );
  const [selectedStruggles, setSelectedStruggles] = useState<Struggle[]>(
    athleteState?.biggest_struggle ?? []
  );
  const [nameValue, setNameValue] = useState(athleteState?.first_name ?? '');
  const [nameFocused, setNameFocused] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    selectedRole !== athleteState?.primary_role ||
    isTwoWay !== (athleteState?.is_two_way ?? false) ||
    selectedPhase !== athleteState?.season_phase ||
    nameValue.trim() !== (athleteState?.first_name ?? '') ||
    selectedStruggles.length !== (athleteState?.biggest_struggle ?? []).length ||
    selectedStruggles.some(s => !(athleteState?.biggest_struggle ?? []).includes(s));

  function toggleStruggle(id: Struggle) {
    setSelectedStruggles(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  async function handleSave() {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      await updateAthleteState({
        primary_role: selectedRole,
        is_two_way: isTwoWay,
        season_phase: selectedPhase,
        biggest_struggle: selectedStruggles,
        first_name: nameValue.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <Text style={styles.headerTitle}>EDIT PROFILE</Text>
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || saving}
          hitSlop={12}
        >
          <Text style={[styles.saveBtn, (!hasChanges || saving) && styles.saveBtnDisabled]}>
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── POSITION ── */}
        <Text style={styles.sectionLabel}>POSITION</Text>
        <View style={styles.roleGrid}>
          {POSITIONS.map(p => {
            const active = selectedRole === p.id;
            return (
              <Pressable
                key={p.id}
                style={[styles.roleCard, active && styles.roleCardActive]}
                onPress={() => setSelectedRole(p.id)}
              >
                <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>
                  {p.label}
                </Text>
                <Text style={styles.roleDesc}>{p.desc}</Text>
                {active && (
                  <Ionicons name="checkmark-circle" size={15} color="#22CC5E" style={styles.roleCheck} />
                )}
              </Pressable>
            );
          })}
        </View>

        {selectedRole === 'pitcher' && (
          <View style={styles.twoWaySection}>
            <Text style={[styles.sectionLabel, { marginTop: 0, marginBottom: 8 }]}>TWO-WAY?</Text>
            {[
              { val: false, label: 'Pitcher only', desc: "I don't take at-bats" },
              { val: true,  label: 'Two-way — I also hit', desc: 'I pitch and hit' },
            ].map(opt => (
              <Pressable
                key={String(opt.val)}
                style={[styles.optionCard, isTwoWay === opt.val && styles.optionCardActive]}
                onPress={() => setIsTwoWay(opt.val)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, isTwoWay === opt.val && styles.optionLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                </View>
                {isTwoWay === opt.val && (
                  <Ionicons name="checkmark" size={17} color="#22CC5E" />
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* ── SEASON PHASE ── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>SEASON PHASE</Text>
        <View style={styles.pillWrap}>
          {SEASON_PHASES.map(p => {
            const active = selectedPhase === p.id;
            return (
              <Pressable
                key={p.id}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSelectedPhase(p.id)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── BIGGEST STRUGGLE ── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>BIGGEST STRUGGLE</Text>
        <Text style={styles.sectionSub}>Pick up to 2</Text>
        <View style={styles.pillWrap}>
          {STRUGGLES.map(s => {
            const active = selectedStruggles.includes(s.id);
            const disabled = !active && selectedStruggles.length >= 2;
            return (
              <Pressable
                key={s.id}
                style={[styles.pill, active && styles.pillActive, disabled && styles.pillDisabled]}
                onPress={() => toggleStruggle(s.id)}
                disabled={disabled}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive, disabled && styles.pillTextDisabled]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── DISPLAY NAME ── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>YOUR NAME</Text>
        <TextInput
          style={[styles.nameInput, nameFocused && styles.nameInputFocused]}
          value={nameValue}
          onChangeText={setNameValue}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          placeholder="Your first name"
          placeholderTextColor="rgba(255,255,255,0.2)"
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
        />

      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080810',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: {
    width: 32,
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  saveBtn: {
    color: '#22CC5E',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    minWidth: 32,
    textAlign: 'right',
  },
  saveBtnDisabled: {
    color: 'rgba(255,255,255,0.25)',
  },

  scroll: {
    padding: 20,
  },

  sectionLabel: {
    color: '#22CC5E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionSub: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    marginBottom: 12,
    marginTop: -6,
  },

  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: '#111',
    borderWidth: 1.5,
    borderColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: {
    backgroundColor: '#0F2410',
    borderColor: '#22CC5E',
  },
  pillDisabled: {
    opacity: 0.35,
  },
  pillText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '400',
  },
  pillTextActive: {
    color: '#22CC5E',
    fontWeight: '700',
  },
  pillTextDisabled: {
    color: 'rgba(255,255,255,0.25)',
  },

  nameInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  nameInputFocused: {
    borderColor: '#22CC5E',
  },

  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleCard: {
    width: '48%',
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222',
    position: 'relative',
    gap: 4,
  },
  roleCardActive: {
    borderColor: '#22CC5E',
    backgroundColor: '#0F2410',
  },
  roleLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.5)',
  },
  roleLabelActive: {
    color: '#fff',
  },
  roleDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
  },
  roleCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  twoWaySection: {
    marginTop: 10,
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#222',
    gap: 8,
  },
  optionCardActive: {
    borderColor: '#22CC5E',
    backgroundColor: '#0F2410',
  },
  optionLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Inter_400Regular',
  },
  optionLabelActive: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
  optionDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
});
