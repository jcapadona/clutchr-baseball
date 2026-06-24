import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
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
import {
  useAthlete,
  buildDefaultState,
  type PositionRole,
  type LevelBand,
  type SeasonPhase,
  type Struggle,
} from '@/context/AthleteContext';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { H } from '@/utils/haptics';
import { registerForPushNotifications } from '@/lib/notifications';

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const POSITIONS = [
  { value: 'pitcher' as PositionRole, label: 'Pitcher', icon: 'baseball', desc: 'On the mound' },
  { value: 'catcher' as PositionRole, label: 'Catcher', icon: 'shield', desc: 'Behind the dish' },
  { value: 'infielder' as PositionRole, label: 'Infielder', icon: 'grid', desc: 'Corners or middle' },
  { value: 'outfielder' as PositionRole, label: 'Outfielder', icon: 'expand', desc: 'Grass and gaps' },
];

type Step = 'name' | 'role' | 'level' | 'season' | 'struggle' | 'complete';
const STEPS: Step[] = ['name', 'role', 'level', 'season', 'struggle', 'complete'];

const LEVELS: { value: LevelBand; label: string; desc: string }[] = [
  { value: 'youth',       label: 'Youth',       desc: '12U–14U' },
  { value: 'high_school', label: 'High School', desc: 'Freshman–Senior' },
  { value: 'college',     label: 'College',     desc: 'JUCO–D1' },
  { value: 'pro',         label: 'Adult',       desc: 'Semi-pro & up' },
];
const SEASONS: { value: SeasonPhase; label: string; desc: string }[] = [
  { value: 'preseason',       label: 'Preseason', desc: 'Building up' },
  { value: 'in_season',       label: 'In Season', desc: 'Games are live' },
  { value: 'offseason_build', label: 'Offseason', desc: 'Get better' },
];
const STRUGGLES: { value: Struggle; label: string }[] = [
  { value: 'confidence',        label: 'Confidence' },
  { value: 'pregame_nerves',    label: 'Pressure & Nerves' },
  { value: 'staying_locked_in', label: 'Focus' },
  { value: 'better_routine',    label: 'Consistency' },
  { value: 'bouncing_back',     label: 'Bouncing Back' },
  { value: 'throwing_strikes',  label: 'Throwing Strikes' },
  { value: 'fielding_cleanly',  label: 'Fielding Cleanly' },
  { value: 'reading_hitters',   label: 'Reading Hitters' },
  { value: 'plate_approach',    label: 'Plate Approach' },
  { value: 'throwing_safely',   label: 'Throwing Safely' },
];

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { session, saveAthleteState } = useAthlete();

  const [step, setStep] = useState<Step>('name');
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState<PositionRole>('infielder');
  const [isTwoWay, setIsTwoWay] = useState(false);
  const [level, setLevel] = useState<LevelBand>('high_school');
  const [seasonPhase, setSeasonPhase] = useState<SeasonPhase>('in_season');
  const [struggle, setStruggle] = useState<Struggle | null>(null);
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

  const handleComplete = async () => {
    if (saving) return;
    // TODO: fire onboarding_completed
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
        season_phase: seasonPhase,
        biggest_struggle: struggle ? [struggle] : [],
        self_ratings: { confidence: 3, focus: 3, composure: 3, recovery_discipline: 3, reset_skill: 3 },
        routine_consistency: 3,
        updated_at: new Date().toISOString(),
      });
      registerForPushNotifications().catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 300));
      router.replace('/lesson/onboarding-first-rep');
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

  const canContinue =
    step === 'name' ? firstName.trim().length > 0 :
    step === 'struggle' ? true : // optional
    true;

  const ctaScale = useRef(new Animated.Value(1)).current;
  const ctaOpacity = useRef(new Animated.Value(1)).current;

  function ctaPressIn() {
    H.tap();
    Animated.parallel([
      Animated.spring(ctaScale, { toValue: 0.97, tension: 300, friction: 20, useNativeDriver: true }),
      Animated.timing(ctaOpacity, { toValue: 0.88, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function ctaPressOut() {
    Animated.parallel([
      Animated.spring(ctaScale, { toValue: 1, tension: 280, friction: 18, useNativeDriver: true }),
      Animated.timing(ctaOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Back button — role step only */}
      {stepIndex > 0 && step !== 'complete' && (
        <Pressable style={styles.backBtn} onPress={back}>
          <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
        </Pressable>
      )}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* NAME */}
        {step === 'name' && (
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
            <Text style={styles.stepTitle}>What level do you play?</Text>
            <Text style={styles.stepSub}>This sets your difficulty and language.</Text>
            <View style={styles.roleGrid}>
              {LEVELS.map((l) => (
                <Pressable
                  key={l.value}
                  style={[styles.roleCard, level === l.value && styles.roleCardActive]}
                  onPress={() => setLevel(l.value)}
                >
                  <Text style={[styles.roleLabel, level === l.value && styles.roleLabelActive]}>
                    {l.label}
                  </Text>
                  <Text style={styles.roleDesc}>{l.desc}</Text>
                  {level === l.value && (
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
          </View>
        )}

        {/* SEASON */}
        {step === 'season' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepTag}>SEASON</Text>
            <Text style={styles.stepTitle}>Where are you right now?</Text>
            <Text style={styles.stepSub}>Your reps match your season.</Text>
            <View style={styles.roleGrid}>
              {SEASONS.map((s) => (
                <Pressable
                  key={s.value}
                  style={[styles.roleCard, seasonPhase === s.value && styles.roleCardActive]}
                  onPress={() => setSeasonPhase(s.value)}
                >
                  <Text style={[styles.roleLabel, seasonPhase === s.value && styles.roleLabelActive]}>
                    {s.label}
                  </Text>
                  <Text style={styles.roleDesc}>{s.desc}</Text>
                  {seasonPhase === s.value && (
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
          </View>
        )}

        {/* STRUGGLE */}
        {step === 'struggle' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepTag}>FOCUS</Text>
            <Text style={styles.stepTitle}>What do you want to lock in first?</Text>
            <Text style={styles.stepSub}>Pick one. You can change this anytime.</Text>
            <View style={styles.pillWrap}>
              {STRUGGLES.map((s) => {
                const active = struggle === s.value;
                return (
                  <Pressable
                    key={s.value}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setStruggle(active ? null : s.value)}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={next}>
              <Text style={styles.skipLink}>Skip for now</Text>
            </Pressable>
          </View>
        )}

        {/* COMPLETE */}
        {step === 'complete' && (() => {
          const levelLabel = LEVELS.find(l => l.value === level)?.label ?? level;
          const roleLabel = POSITIONS.find(p => p.value === role)?.label ?? role;
          const seasonLabel = SEASONS.find(s => s.value === seasonPhase)?.label ?? seasonPhase;
          return (
            <View style={[styles.stepWrap, { alignItems: 'center' }]}>
              <View style={styles.logoMark}>
                <Text style={styles.logoChevron}>{'<<'}</Text>
              </View>
              <Text style={styles.stepTitle}>
                You're set, {firstName || 'Athlete'}.
              </Text>
              <Text style={styles.stepSub}>
                {levelLabel} {roleLabel}, {seasonLabel.toLowerCase()} — your first rep is ready.
              </Text>
            </View>
          );
        })()}
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaArea, { paddingBottom: insets.bottom + Spacing.md }]}>
        {step === 'complete' ? (
          <Pressable
            onPress={saving ? undefined : handleComplete}
            onPressIn={saving ? undefined : ctaPressIn}
            onPressOut={ctaPressOut}
            style={saving ? { opacity: 0.5 } : undefined}
          >
            <Animated.View style={[styles.cta, Shadow.green, { transform: [{ scale: ctaScale }], opacity: ctaOpacity }]}>
              <Ionicons name="flash" size={20} color={Colors.background} />
              <Text style={styles.ctaText}>
                {saving ? 'Building your path...' : 'Start First Rep'}
              </Text>
            </Animated.View>
          </Pressable>
        ) : (
          <Pressable
            onPress={!canContinue ? undefined : next}
            onPressIn={!canContinue ? undefined : ctaPressIn}
            onPressOut={ctaPressOut}
            style={!canContinue ? { opacity: 0.5 } : undefined}
          >
            <Animated.View style={[styles.cta, Shadow.green, { transform: [{ scale: ctaScale }], opacity: ctaOpacity }]}>
              <Text style={styles.ctaText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.background} />
            </Animated.View>
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
  backBtn: { position: 'absolute', top: 72, left: 16, zIndex: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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
  optionLabel: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  optionLabelActive: { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  optionDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, marginTop: 2 },
  ctaArea: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
    backgroundColor: Colors.background,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.lg, gap: Spacing.sm,
  },
  ctaDisabled: { backgroundColor: Colors.textTertiary },
  ctaText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.background },
  signOutLink: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 16,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  pillText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  pillTextActive: {
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  skipLink: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
