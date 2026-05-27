import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
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
import {
  useAthlete,
  buildDefaultState,
  type PositionRole,
  type LevelBand,
  type SeasonPhase,
  type Struggle,
} from '@/context/AthleteContext';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { registerForPushNotifications } from '@/lib/notifications';

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const POSITIONS = [
  { value: 'pitcher' as PositionRole, label: 'Pitcher', icon: 'baseball', desc: 'On the mound' },
  { value: 'catcher' as PositionRole, label: 'Catcher', icon: 'shield', desc: 'Behind the dish' },
  { value: 'infielder' as PositionRole, label: 'Infielder', icon: 'grid', desc: 'Corners or middle' },
  { value: 'outfielder' as PositionRole, label: 'Outfielder', icon: 'expand', desc: 'Grass and gaps' },
];

const LEVELS = [
  { value: 'youth' as LevelBand, label: 'Youth', desc: '12–14 years old' },
  { value: 'high_school' as LevelBand, label: 'High School', desc: '14–18 years old' },
  { value: 'college' as LevelBand, label: 'College', desc: '18–22 years old' },
  { value: 'pro' as LevelBand, label: 'Pro / Advanced', desc: 'Beyond college' },
];

const SEASONS = [
  { value: 'preseason' as SeasonPhase, label: 'Preseason', desc: 'Building toward the season' },
  { value: 'in_season' as SeasonPhase, label: 'In-Season', desc: 'Competing right now' },
  { value: 'slump_reset' as SeasonPhase, label: 'Slump / Reset', desc: 'Working through a rough stretch' },
  { value: 'offseason_build' as SeasonPhase, label: 'Offseason', desc: 'Building for next year' },
  { value: 'return_to_throw' as SeasonPhase, label: 'Return to Throw', desc: 'Coming back from injury' },
];

const STRUGGLES: { value: Struggle; label: string }[] = [
  { value: 'bouncing_back', label: 'Bouncing back after mistakes' },
  { value: 'confidence', label: 'Confidence at the plate or mound' },
  { value: 'pregame_nerves', label: 'Pregame nerves' },
  { value: 'throwing_strikes', label: 'Throwing more strikes' },
  { value: 'staying_locked_in', label: 'Staying locked in' },
  { value: 'better_routine', label: 'Building a better routine' },
  { value: 'plate_approach', label: 'Better approach at the plate' },
  { value: 'fielding_cleanly', label: 'Fielding cleanly' },
  { value: 'reading_hitters', label: 'Reading hitters' },
  { value: 'throwing_safely', label: 'Throwing harder safely' },
];

type Step = 'welcome' | 'role' | 'level' | 'season' | 'struggles' | 'ratings' | 'complete';
const STEPS: Step[] = ['welcome', 'role', 'level', 'season', 'struggles', 'ratings', 'complete'];

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { session, saveAthleteState } = useAthlete();

  const [step, setStep] = useState<Step>('welcome');
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState<PositionRole>('infielder');
  const [isTwoWay, setIsTwoWay] = useState(false);
  const [level, setLevel] = useState<LevelBand>('high_school');
  const [season, setSeason] = useState<SeasonPhase>('in_season');
  const [struggles, setStruggles] = useState<Struggle[]>([]);
  const [ratings, setRatings] = useState({
    confidence: 3,
    focus: 3,
    composure: 3,
    recovery_discipline: 3,
    reset_skill: 3,
  });
  const [saving, setSaving] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex + 1) / STEPS.length;

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const back = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const toggleStruggle = (s: Struggle) => {
    setStruggles((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      if (prev.length >= 2) return prev;
      return [...prev, s];
    });
  };

  const handleComplete = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const name = firstName.trim() ||
        session?.user?.user_metadata?.full_name?.split(' ')[0] ||
        'Athlete';
      const base = buildDefaultState(name);
      await saveAthleteState({
        ...base,
        first_name: name,
        primary_role: role,
        is_two_way: isTwoWay,
        level_band: level,
        season_phase: season,
        biggest_struggle: struggles,
        self_ratings: ratings,
        routine_consistency: ratings.recovery_discipline,
        updated_at: new Date().toISOString(),
      });
      registerForPushNotifications().catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 300));
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Onboarding save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  const canContinue = step === 'welcome' ? firstName.trim().length > 0 : true;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Back button — steps 2-6 only */}
      {stepIndex > 0 && step !== 'complete' && (
        <Pressable style={styles.backBtn} onPress={back}>
          <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
        </Pressable>
      )}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* WELCOME */}
        {step === 'welcome' && (
          <View style={styles.stepWrap}>
            <View style={styles.logoMark}>
              <Text style={styles.logoChevron}>{'<<'}</Text>
            </View>
            <Text style={styles.stepTitle}>What should we call you?</Text>
            <Text style={styles.stepSub}>
              This is your career path. Let's build it right.
            </Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => firstName.trim() && next()}
            />
          </View>
        )}

        {/* ROLE */}
        {step === 'role' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepTag}>POSITION</Text>
            <Text style={styles.stepTitle}>What's your primary position?</Text>
            <Text style={styles.stepSub}>
              Your content is built around this. Choose your main spot.
            </Text>
            <View style={styles.roleGrid}>
              {POSITIONS.map((p) => (
                <Pressable
                  key={p.value}
                  style={[styles.roleCard, role === p.value && styles.roleCardActive]}
                  onPress={() => setRole(p.value)}
                >
                  <Ionicons
                    name={p.icon as any}
                    size={22}
                    color={role === p.value ? Colors.primary : Colors.textTertiary}
                  />
                  <Text style={[styles.roleLabel, role === p.value && styles.roleLabelActive]}>
                    {p.label}
                  </Text>
                  <Text style={styles.roleDesc}>{p.desc}</Text>
                  {role === p.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={Colors.primary}
                      style={styles.roleCheck}
                    />
                  )}
                </Pressable>
              ))}
            </View>

            {role === 'pitcher' && (
              <View style={styles.twoWaySection}>
                <Text style={styles.stepTag}>TWO-WAY?</Text>
                <View style={styles.optionList}>
                  {[
                    { val: false, label: 'Pitcher only', desc: "I don't take at-bats" },
                    { val: true, label: 'Two-way — I also hit', desc: 'I pitch and hit' },
                  ].map((opt) => (
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
                        <Ionicons name="checkmark" size={18} color={Colors.primary} />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* LEVEL */}
        {step === 'level' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepTag}>LEVEL</Text>
            <Text style={styles.stepTitle}>Where do you compete?</Text>
            <Text style={styles.stepSub}>Content difficulty is calibrated to your level.</Text>
            <View style={styles.optionList}>
              {LEVELS.map((l) => (
                <Pressable
                  key={l.value}
                  style={[styles.optionCard, level === l.value && styles.optionCardActive]}
                  onPress={() => setLevel(l.value)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, level === l.value && styles.optionLabelActive]}>
                      {l.label}
                    </Text>
                    <Text style={styles.optionDesc}>{l.desc}</Text>
                  </View>
                  {level === l.value && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SEASON */}
        {step === 'season' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepTag}>SEASON</Text>
            <Text style={styles.stepTitle}>Where are you right now?</Text>
            <Text style={styles.stepSub}>
              Lessons and Game Mode are routed around this.
            </Text>
            <View style={styles.optionList}>
              {SEASONS.map((s) => (
                <Pressable
                  key={s.value}
                  style={[styles.optionCard, season === s.value && styles.optionCardActive]}
                  onPress={() => setSeason(s.value)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, season === s.value && styles.optionLabelActive]}>
                      {s.label}
                    </Text>
                    <Text style={styles.optionDesc}>{s.desc}</Text>
                  </View>
                  {season === s.value && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* STRUGGLES */}
        {step === 'struggles' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepTag}>FOCUS AREAS</Text>
            <Text style={styles.stepTitle}>What are you working on?</Text>
            <Text style={styles.stepSub}>
              Pick up to 2. Your path is routed around these.
            </Text>
            <View style={styles.optionList}>
              {STRUGGLES.map((s) => {
                const selected = struggles.includes(s.value);
                const disabled = !selected && struggles.length >= 2;
                return (
                  <Pressable
                    key={s.value}
                    style={[
                      styles.optionCard,
                      selected && styles.optionCardActive,
                      disabled && styles.optionCardDisabled,
                    ]}
                    onPress={() => !disabled && toggleStruggle(s.value)}
                  >
                    <Text style={[
                      styles.optionLabel,
                      selected && styles.optionLabelActive,
                      disabled && { color: Colors.textDisabled },
                    ]}>
                      {s.label}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* SELF RATINGS */}
        {step === 'ratings' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepTag}>SELF ASSESSMENT</Text>
            <Text style={styles.stepTitle}>Rate yourself honestly.</Text>
            <Text style={styles.stepSub}>1 = needs work. 5 = locked in.</Text>
            <View style={styles.ratingsCard}>
              {(
                [
                  ['confidence', 'Confidence', 'Belief in my ability'],
                  ['focus', 'Focus', 'Stay present on the next pitch'],
                  ['composure', 'Composure', 'Stay calm when things go sideways'],
                  ['recovery_discipline', 'Recovery', 'Bounce back after bad reps'],
                  ['reset_skill', 'Reset Skill', 'Flush the last pitch fast'],
                ] as [keyof typeof ratings, string, string][]
              ).map(([key, label, hint]) => (
                <View key={key} style={styles.ratingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ratingLabel}>{label}</Text>
                    <Text style={styles.ratingHint}>{hint}</Text>
                  </View>
                  <View style={styles.ratingDots}>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <Pressable
                        key={val}
                        style={[
                          styles.dot,
                          ratings[key] >= val && styles.dotActive,
                        ]}
                        onPress={() =>
                          setRatings((prev) => ({ ...prev, [key]: val }))
                        }
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* COMPLETE */}
        {step === 'complete' && (
          <View style={[styles.stepWrap, { alignItems: 'center' }]}>
            <View style={styles.logoMark}>
              <Text style={styles.logoChevron}>{'<<'}</Text>
            </View>
            <Text style={styles.stepTitle}>
              Locked in, {firstName || 'Athlete'}.
            </Text>
            <Text style={styles.stepSub}>
              Your career path is ready. Continue Career and Game Mode are waiting.
            </Text>
            <View style={styles.summaryCard}>
              {[
                ['baseball', 'Position', POSITIONS.find((p) => p.value === role)?.label || role],
                ['school', 'Level', LEVELS.find((l) => l.value === level)?.label || level],
                ['calendar', 'Phase', SEASONS.find((s) => s.value === season)?.label || season],
                [
                  'trending-up',
                  'Focus',
                  struggles.length > 0
                    ? struggles.map((s) => STRUGGLES.find((st) => st.value === s)?.label?.split(' ')[0]).join(', ')
                    : 'All areas',
                ],
              ].map(([icon, label, value]) => (
                <View key={label} style={styles.summaryRow}>
                  <Ionicons name={icon as any} size={16} color={Colors.primary} />
                  <Text style={styles.summaryLabel}>{label}</Text>
                  <Text style={styles.summaryValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaArea, { paddingBottom: insets.bottom + Spacing.md }]}>
        {step === 'complete' ? (
          <>
            <Text style={styles.notifHint}>Enable notifications to keep your streak alive.</Text>
            <Pressable
              style={({ pressed }) => [styles.cta, saving && styles.ctaDisabled, pressed && styles.ctaPressed]}
              onPress={handleComplete}
              disabled={saving}
            >
              <Ionicons name="flash" size={20} color={Colors.background} />
              <Text style={styles.ctaText}>
                {saving ? 'Building your path...' : 'Enter Clutchr'}
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              !canContinue && styles.ctaDisabled,
              pressed && styles.ctaPressed,
            ]}
            onPress={next}
            disabled={!canContinue}
          >
            <Text style={styles.ctaText}>
              {step === 'ratings' ? 'Review & Complete' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.background} />
          </Pressable>
        )}
        <Pressable onPress={handleSignOut}>
          <Text style={styles.signOutLink}>Wrong account? Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressTrack: { height: 2, backgroundColor: Colors.border },
  progressFill: { height: 2, backgroundColor: Colors.primary },
  backBtn: { position: 'absolute', top: 52, left: 16, zIndex: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  stepWrap: { gap: Spacing.xl },
  logoMark: {
    width: 64, height: 64, borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  logoChevron: {
    fontSize: 24, fontFamily: 'Inter_700Bold',
    color: Colors.background, letterSpacing: -2,
  },
  stepTag: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary, letterSpacing: 1 },
  stepTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, lineHeight: 32 },
  stepSub: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 22 },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.lg, fontSize: 18, fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
  },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  roleCard: {
    width: '48%', backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.lg, gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border,
    position: 'relative',
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  roleLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  roleLabelActive: { color: Colors.textPrimary },
  roleDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  roleCheck: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  twoWaySection: { gap: Spacing.sm, marginTop: Spacing.xs },
  optionList: { gap: Spacing.sm },
  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  optionCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  optionCardDisabled: { opacity: 0.4 },
  optionLabel: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  optionLabelActive: { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  optionDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, marginTop: 2 },
  ratingsCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ratingLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  ratingHint: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, marginTop: 2 },
  ratingDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary },
  summaryCard: {
    width: '100%', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  summaryLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, flex: 1 },
  summaryValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, textAlign: 'right', flex: 2 },
  ctaArea: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
    backgroundColor: Colors.background,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.lg, gap: Spacing.sm,
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ctaDisabled: { backgroundColor: Colors.textTertiary },
  ctaText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.background },
  notifHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  signOutLink: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 16,
  },
});