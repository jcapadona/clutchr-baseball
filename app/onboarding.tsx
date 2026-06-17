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

type Step = 'name' | 'role' | 'complete';
const STEPS: Step[] = ['name', 'role', 'complete'];

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { session, saveAthleteState } = useAthlete();

  const [step, setStep] = useState<Step>('name');
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState<PositionRole>('infielder');
  const [isTwoWay, setIsTwoWay] = useState(false);
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
        level_band: 'high_school',
        season_phase: 'in_season',
        biggest_struggle: ['staying_locked_in'],
        self_ratings: { confidence: 3, focus: 3, composure: 3, recovery_discipline: 3, reset_skill: 3 },
        routine_consistency: 3,
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

  const canContinue = step === 'name' ? firstName.trim().length > 0 : true;

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

        {/* COMPLETE */}
        {step === 'complete' && (
          <View style={[styles.stepWrap, { alignItems: 'center' }]}>
            <View style={styles.logoMark}>
              <Text style={styles.logoChevron}>{'<<'}</Text>
            </View>
            <Text style={styles.stepTitle}>
              You're in, {firstName || 'Athlete'}.
            </Text>
            <Text style={styles.stepSub}>
              {POSITIONS.find(p => p.value === role)?.label ?? role} — your path is built. Time to rep it.
            </Text>
          </View>
        )}
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
                {saving ? 'Building your path...' : 'Enter Clutchr'}
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
});
