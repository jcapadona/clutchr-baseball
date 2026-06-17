/**
 * app/upgrade.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The Clutchr Pro upgrade screen.
 *
 * Design principles (from source docs):
 *  - "Ridiculous free tier that still feels complete"
 *  - Transparent pricing, no fake timers, no nagging popups
 *  - Value framed in real-world athlete comparison terms
 *  - "Serious mission" stance — not a casino, not a gimmick
 *  - Sport-specific symbolism, professional tone
 *
 * HOW TO TRIGGER:
 *  router.push('/upgrade')           — from anywhere
 *  router.push('/upgrade?source=lesson_gate')  — after free lesson limit
 *  router.push('/upgrade?source=profile')      — from profile "Upgrade" row
 *
 * WHEN TO TRIGGER (recommended trigger points):
 *  1. After 5th lesson completed (soft gate — not a hard block)
 *  2. Tapping "Upgrade to Pro" in Profile
 *  3. Tapping a locked feature (advanced lessons, full career path)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { H } from '@/utils/haptics';
import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── FREE vs PRO COMPARISON ───────────────────────────────────────────────────

const FREE_FEATURES = [
  { label: 'First 5 Career lessons',           included: true  },
  { label: 'Foundation pillar (full)',           included: true  },
  { label: 'Game Mode — all pre/post tools',    included: true  },
  { label: 'Streak tracking',                   included: true  },
  { label: 'Playbook (5 cue words)',            included: true  },
  { label: 'Role-specific career path',         included: false },
  { label: 'All 50+ gold-standard lessons',     included: false },
  { label: 'Pressure & resilience worlds',      included: false },
  { label: 'Slump reset system',                included: false },
  { label: 'Between-innings tools (full)',       included: false },
  { label: 'XP milestones & phase badges',      included: false },
];

const PRO_FEATURES = [
  {
    icon: 'baseball',
    color: Colors.primary,
    title: 'Full Career Path',
    desc: '50+ lessons across all 7 phases. Role-specific, season-aware, always adapting.',
  },
  {
    icon: 'pulse',
    color: Colors.warning,
    title: 'Pressure & Slump Systems',
    desc: 'Dedicated slump-reset world. Clutch-moment training. Short memory reps.',
  },
  {
    icon: 'shield',
    color: Colors.purple,
    title: 'Phase Badges & Milestones',
    desc: 'Earn clean rank progress from Foundation to Elite. Every rep builds.',
  },
  {
    icon: 'refresh',
    color: Colors.info,
    title: 'Full Between-Innings Tools',
    desc: 'Battery sync, inning transition, mid-game slump shrink. The full in-game toolkit.',
  },
  {
    icon: 'flash',
    color: Colors.warning,
    title: 'Priority Lesson Routing',
    desc: 'The routing engine uses your full state — phase, phase, struggles — to pick the perfect next rep.',
  },
];

// ─── PRICING PLANS ────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$7.99',
    period: '/month',
    note: 'Cancel anytime',
    highlight: false,
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$39.99',
    period: '/year',
    note: 'Best value — $3.33/mo',
    highlight: true,
    savings: 'Save 58%',
  },
];

// ─── SOURCE CONTEXT COPY ──────────────────────────────────────────────────────
// These comparison lines are from the source docs — real-world framing

const COMPARISON_LINES = [
  { icon: 'person',    text: 'One pitching lesson with a coach: $75–150' },
  { icon: 'baseball',  text: 'A new bat or glove: $80–300'               },
  { icon: 'flash',     text: 'Clutchr Pro for a full year: $39.99'       },
];

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState } = useAthlete();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(20)).current;
  const ctaScale   = useRef(new Animated.Value(1)).current;
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  // Context-aware headline based on what triggered the screen
  const headline = source === 'lesson_gate'
    ? "You've hit the free limit."
    : source === 'slump'
    ? "The slump reset is a Pro feature."
    : "Train the mind that wins the game.";

  const subhead = source === 'lesson_gate'
    ? `You've completed 5 lessons, ${athleteState?.first_name ?? 'athlete'}. The full career path is waiting.`
    : "One subscription. Your full career path. Every day.";

  function handleSelectPlan(id: 'monthly' | 'annual') {
    H.select();
    setSelectedPlan(id);
  }

  function handleSubscribe() {
    H.medium();
    // TODO: Wire to RevenueCat / Stripe / App Store IAP
    // For now, show a placeholder
    alert('Subscription coming soon. Thank you for your interest!');
  }

  function handleRestore() {
    // TODO: Wire to RevenueCat restorePurchases()
    alert('Restore purchases coming soon.');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Close button */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.proPill}>
          <Ionicons name="flash" size={10} color={Colors.warning} />
          <Text style={styles.proPillText}>CLUTCHR PRO</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── HERO ── */}
          <View style={styles.heroWrap}>
            <LinearGradient
              colors={['rgba(34,204,94,0.08)', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.heroIconWrap}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDim]}
                style={styles.heroIconGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <Ionicons name="flash" size={28} color="#000" />
            </View>
            <Text style={styles.heroTitle}>{headline}</Text>
            <Text style={styles.heroSub}>{subhead}</Text>
          </View>

          {/* ── REAL-WORLD COMPARISON ── */}
          <View style={styles.comparisonWrap}>
            {COMPARISON_LINES.map((line, i) => (
              <View key={i} style={styles.comparisonRow}>
                <View style={[styles.comparisonIcon, i === 2 && styles.comparisonIconHighlight]}>
                  <Ionicons
                    name={line.icon as any}
                    size={14}
                    color={i === 2 ? Colors.primary : Colors.textTertiary}
                  />
                </View>
                <Text style={[styles.comparisonText, i === 2 && styles.comparisonTextHighlight]}>
                  {line.text}
                </Text>
                {i === 2 && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>THAT'S YOU</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* ── PRO FEATURES ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WHAT YOU UNLOCK</Text>
            {PRO_FEATURES.map((feat) => (
              <View key={feat.title} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: feat.color + '15' }]}>
                  <Ionicons name={feat.icon as any} size={16} color={feat.color} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feat.title}</Text>
                  <Text style={styles.featureDesc}>{feat.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── FREE vs PRO TABLE ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FREE vs PRO</Text>
            <View style={styles.compTable}>
              {/* Header */}
              <View style={styles.compTableHeader}>
                <Text style={styles.compTableHeaderCell} />
                <Text style={[styles.compTableHeaderCell, { color: Colors.textTertiary }]}>FREE</Text>
                <Text style={[styles.compTableHeaderCell, { color: Colors.warning }]}>PRO</Text>
              </View>
              {FREE_FEATURES.map((f, i) => (
                <View key={i} style={[styles.compTableRow, i % 2 === 0 && styles.compTableRowAlt]}>
                  <Text style={styles.compTableLabel}>{f.label}</Text>
                  <View style={styles.compTableCheck}>
                    <Ionicons
                      name={f.included ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={f.included ? Colors.primary : Colors.textTertiary}
                    />
                  </View>
                  <View style={styles.compTableCheck}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.warning} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── PLAN SELECTOR ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CHOOSE YOUR PLAN</Text>
            <View style={styles.plansRow}>
              {PLANS.map((plan) => (
                <Pressable
                  key={plan.id}
                  style={[
                    styles.planCard,
                    selectedPlan === plan.id && styles.planCardSelected,
                    plan.highlight && selectedPlan === plan.id && styles.planCardHighlight,
                  ]}
                  onPress={() => handleSelectPlan(plan.id as any)}
                >
                  {plan.savings && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>{plan.savings}</Text>
                    </View>
                  )}
                  <Text style={[styles.planLabel, selectedPlan === plan.id && { color: Colors.textPrimary }]}>
                    {plan.label}
                  </Text>
                  <View style={styles.planPriceRow}>
                    <Text style={[styles.planPrice, selectedPlan === plan.id && plan.highlight && { color: Colors.warning }]}>
                      {plan.price}
                    </Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                  <Text style={styles.planNote}>{plan.note}</Text>
                  {selectedPlan === plan.id && (
                    <View style={styles.planCheckWrap}>
                      <Ionicons name="checkmark-circle" size={18} color={plan.highlight ? Colors.warning : Colors.primary} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── CTA ── */}
          <Pressable onPress={handleSubscribe} onPressIn={ctaPressIn} onPressOut={ctaPressOut}>
            <Animated.View style={[styles.ctaBtn, { transform: [{ scale: ctaScale }], opacity: ctaOpacity }]}>
              <LinearGradient
                colors={selectedPlan === 'annual' ? [Colors.warning, '#D4890A'] : [Colors.primary, Colors.primaryDim]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <Ionicons name="flash" size={16} color="#000" />
              <Text style={styles.ctaText}>
                Start {selectedPlan === 'annual' ? 'Annual' : 'Monthly'} Pro —{' '}
                {selectedPlan === 'annual' ? '$39.99/yr' : '$7.99/mo'}
              </Text>
            </Animated.View>
          </Pressable>

          {/* ── FINE PRINT ── */}
          <View style={styles.finePrint}>
            <Pressable onPress={handleRestore}>
              <Text style={styles.restoreText}>Restore purchases</Text>
            </Pressable>
            <Text style={styles.finePrintText}>
              Subscription auto-renews. Cancel anytime in Settings. No refunds for partial periods.
              By subscribing you agree to our{' '}
              <Text
                style={styles.linkText}
                onPress={() => Linking.openURL('https://clutchr.app/terms')}
              >
                Terms
              </Text>
              {' '}and{' '}
              <Text
                style={styles.linkText}
                onPress={() => Linking.openURL('https://clutchr.app/privacy')}
              >
                Privacy Policy
              </Text>.
            </Text>
            <Text style={[styles.finePrintText, { marginTop: 4, color: Colors.textTertiary + 'AA' }]}>
              No dark patterns. No fake timers. No guilt trips.{'\n'}
              Train the mind or don't — it's your career.
            </Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  proPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.warningMuted, borderRadius: Radius.pill,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.warning + '40',
  },
  proPillText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.warning, letterSpacing: 1.2 },

  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },

  // Hero
  heroWrap: {
    alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.xl, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.primaryBorder,
    overflow: 'hidden', paddingHorizontal: Spacing.lg,
  },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 16,
  },
  heroIconGrad: { ...StyleSheet.absoluteFillObject },
  heroTitle: {
    fontSize: 24, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, textAlign: 'center', lineHeight: 30,
  },
  heroSub: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary, textAlign: 'center', lineHeight: 20,
  },

  // Comparison
  comparisonWrap: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  comparisonIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  comparisonIconHighlight: { backgroundColor: Colors.primaryMuted },
  comparisonText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  comparisonTextHighlight: { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  bestValueBadge: {
    backgroundColor: Colors.primaryMuted, borderRadius: Radius.pill,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.primaryBorder,
  },
  bestValueText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.8 },

  // Section
  section: { gap: Spacing.md },
  sectionTitle: {
    fontSize: 10, fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary, letterSpacing: 1.5,
  },

  // Feature rows
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  featureIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureText: { flex: 1, gap: 3 },
  featureTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  featureDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 17 },

  // Free vs Pro table
  compTable: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  compTableHeader: {
    flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  compTableHeaderCell: {
    flex: 1, fontSize: 10, fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8, textAlign: 'center',
  },
  compTableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  compTableRowAlt: { backgroundColor: Colors.surfaceElevated + '60' },
  compTableLabel: { flex: 3, fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  compTableCheck: { flex: 1, alignItems: 'center' },

  // Plan cards
  plansRow: { flexDirection: 'row', gap: Spacing.sm },
  planCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.border,
    gap: 4, position: 'relative', overflow: 'hidden',
  },
  planCardSelected: { borderColor: Colors.primary + '60' },
  planCardHighlight: { borderColor: Colors.warning + '60', backgroundColor: Colors.warningMuted + '20' },
  savingsBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: Colors.warning, borderRadius: Radius.pill,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  savingsText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#000', letterSpacing: 0.5 },
  planLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 0.5 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  planPrice: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  planPeriod: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  planNote: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  planCheckWrap: { position: 'absolute', bottom: 8, right: 8 },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: Radius.lg, paddingVertical: 16,
    overflow: 'hidden',
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12,
  },
  ctaText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#000' },

  // Fine print
  finePrint: { gap: 8, alignItems: 'center', paddingBottom: Spacing.lg },
  restoreText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  finePrintText: {
    fontSize: 11, fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary, textAlign: 'center', lineHeight: 17,
  },
  linkText: { color: Colors.primary, textDecorationLine: 'underline' },
});
