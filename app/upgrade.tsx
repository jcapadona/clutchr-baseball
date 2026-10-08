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
import Purchases, { PURCHASES_ERROR_CODE } from 'react-native-purchases';
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
import { useProContext, PRO_ENTITLEMENT_ID } from '@/context/ProContext';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { TopHighlight } from '@/constants/visualExtensions';

// ─── FREE vs PRO COMPARISON ───────────────────────────────────────────────────

const FREE_FEATURES = [
  { label: 'Playbook (3 cue slots)',                         included: true  },
  { label: 'Role-specific career path',                      included: false },
  { label: 'Hundreds of reps across every position and phase', included: false },
  { label: 'Slump reset system',                             included: false },
  { label: 'Between-innings tools (full)',                    included: false },
  { label: 'XP milestones & phase badges',                   included: false },
];

const PRO_FEATURES = [
  {
    icon: 'baseball',
    color: Colors.textSecondary,
    title: 'Full Career Path',
    desc: 'Hundreds of reps across every position and phase. Role-specific, season-aware, always adapting.',
  },
  {
    icon: 'pulse',
    color: Colors.textSecondary,
    title: 'Pressure & Slump Systems',
    desc: 'Dedicated slump-reset world. Clutch-moment training. Short memory reps.',
  },
  {
    icon: 'shield',
    color: Colors.textSecondary,
    title: 'Phase Badges & Milestones',
    desc: 'Earn clean rank progress from Foundation to Elite. Every rep builds.',
  },
  {
    icon: 'refresh',
    color: Colors.textSecondary,
    title: 'Full Between-Innings Tools',
    desc: 'Battery sync, inning transition, mid-game slump shrink. The full in-game toolkit.',
  },
  {
    icon: 'flash',
    color: Colors.textSecondary,
    title: 'Priority Lesson Routing',
    desc: 'The routing engine uses your full state (phase, struggles) to pick the perfect next rep.',
  },
];

// ─── PRICING PLANS ────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    period: '/month',
    highlight: false,
  },
  {
    id: 'annual',
    label: 'Annual',
    period: '/year',
    highlight: true,
  },
];

// ─── SOURCE CONTEXT COPY ──────────────────────────────────────────────────────
// These comparison lines are from the source docs — real-world framing

const COMPARISON_LINES = [
  { icon: 'person',   text: 'One pitching lesson with a coach: $75–150' },
  { icon: 'baseball', text: 'A new bat or glove: $80–300'               },
  { icon: 'flash',    text: 'Clutchr Pro for a full year'               },
];

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState } = useAthlete();
  const { refreshPro } = useProContext();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [offerings, setOfferings] = useState<any>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
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
    async function loadOfferings() {
      try {
        const o = await Purchases.getOfferings();
        if (o.current) setOfferings(o.current);
      } catch (e) {
        console.warn('RC offerings failed:', e);
      }
    }
    loadOfferings();
  }, []);

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

  // ── Live prices derived from RC offerings ────────────────────────────────
  const annualPkg      = offerings?.availablePackages?.find(
    (p: any) => p.identifier === 'yearly'  || p.packageType === 'ANNUAL'
  );
  const monthlyPkg     = offerings?.availablePackages?.find(
    (p: any) => p.identifier === 'monthly' || p.packageType === 'MONTHLY'
  );
  const annualPriceStr  = (annualPkg?.product.priceString  as string | undefined) ?? '$59.99';
  const monthlyPriceStr = (monthlyPkg?.product.priceString as string | undefined) ?? '$9.99';
  const annualPriceNum  = (annualPkg?.product.price        as number | undefined) ?? 59.99;
  const monthlyPriceNum = (monthlyPkg?.product.price       as number | undefined) ?? 9.99;
  const currencySymbol  = annualPriceStr.replace(/[\d.,\s]/g, '')[0] ?? '$';
  const monthlyEquivStr = `Best value: ${currencySymbol}${(annualPriceNum / 12).toFixed(2)}/mo`;
  // Only show a savings figure when both live packages are loaded.
  const savingsPct      = Math.floor((1 - annualPriceNum / (monthlyPriceNum * 12)) * 100);
  const savingsBadge    = annualPkg && monthlyPkg && savingsPct > 0 ? `Save ${savingsPct}%` : undefined;

  function handleSelectPlan(id: 'monthly' | 'annual') {
    H.select();
    setSelectedPlan(id);
  }

  async function handlePurchaseMonthly() {
    if (!offerings) return;
    const pkg = offerings.availablePackages.find(
      (p: any) => p.identifier === 'monthly' || p.packageType === 'MONTHLY'
    );
    if (!pkg) return;
    H.medium();
    setPurchaseLoading(true);
    setPurchaseError(null);
    try {
      await Purchases.purchasePackage(pkg);
      await refreshPro();
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        setPurchaseError('Purchase failed. Please try again.');
      }
    } finally {
      setPurchaseLoading(false);
    }
  }

  async function handlePurchaseYearly() {
    if (!offerings) return;
    const pkg = offerings.availablePackages.find(
      (p: any) => p.identifier === 'yearly' || p.packageType === 'ANNUAL'
    );
    if (!pkg) return;
    H.medium();
    setPurchaseLoading(true);
    setPurchaseError(null);
    try {
      await Purchases.purchasePackage(pkg);
      await refreshPro();
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        setPurchaseError('Purchase failed. Please try again.');
      }
    } finally {
      setPurchaseLoading(false);
    }
  }

  async function handleRestore() {
    setPurchaseLoading(true);
    setPurchaseError(null);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[PRO_ENTITLEMENT_ID]) {
        router.replace('/(tabs)');
      } else {
        setPurchaseError('No active subscription found.');
      }
    } catch (e) {
      setPurchaseError('Restore failed. Try again.');
    } finally {
      setPurchaseLoading(false);
    }
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
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── HERO ── */}
          <View style={styles.heroWrap}>
            <LinearGradient
              colors={['rgba(245,166,35,0.08)', 'transparent']}
              style={[StyleSheet.absoluteFill, { borderRadius: Radius.xl }]}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.heroIconWrap}>
              <LinearGradient
                colors={[Colors.warning, '#D4890A']}
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
                    color={i === 2 ? Colors.warning : Colors.textTertiary}
                  />
                </View>
                <Text style={[styles.comparisonText, i === 2 && styles.comparisonTextHighlight]}>
                  {i === 2 ? `${line.text}: ${annualPriceStr}` : line.text}
                </Text>
              </View>
            ))}
          </View>

          {/* ── PRO FEATURES ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WHAT YOU UNLOCK</Text>
            <View style={styles.featureList}>
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
                      color={f.included ? Colors.textSecondary : Colors.textTertiary}
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
              {PLANS.map((plan) => {
                const priceStr = plan.id === 'annual' ? annualPriceStr  : monthlyPriceStr;
                const noteStr  = plan.id === 'annual' ? monthlyEquivStr : 'Cancel anytime';
                const badge    = plan.id === 'annual' ? savingsBadge    : undefined;
                return (
                  <Pressable
                    key={plan.id}
                    style={[
                      styles.planCard,
                      selectedPlan === plan.id && styles.planCardSelected,
                      plan.highlight && selectedPlan === plan.id && styles.planCardHighlight,
                    ]}
                    onPress={() => handleSelectPlan(plan.id as any)}
                  >
                    {badge && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>{badge}</Text>
                      </View>
                    )}
                    <Text style={[styles.planLabel, selectedPlan === plan.id && { color: Colors.textPrimary }]}>
                      {plan.label}
                    </Text>
                    <View style={styles.planPriceRow}>
                      <Text style={[styles.planPrice, selectedPlan === plan.id && plan.highlight && { color: Colors.warning }]}>
                        {priceStr}
                      </Text>
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                    <Text style={styles.planNote}>{noteStr}</Text>
                    {selectedPlan === plan.id && (
                      <View style={styles.planCheckWrap}>
                        <Ionicons name="checkmark-circle" size={18} color={plan.highlight ? Colors.warning : Colors.textSecondary} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── FINE PRINT ── */}
          <View style={styles.finePrint}>
            <Pressable onPress={handleRestore} disabled={purchaseLoading} style={styles.restoreBtn}>
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
              Train the mind or don't. It's your career.
            </Text>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── STICKY CTA FOOTER ── */}
      <Animated.View style={[styles.stickyFooter, { paddingBottom: insets.bottom + Spacing.lg }, { opacity: fadeAnim }]}>
        <Pressable
          onPress={selectedPlan === 'annual' ? handlePurchaseYearly : handlePurchaseMonthly}
          onPressIn={ctaPressIn}
          onPressOut={ctaPressOut}
          disabled={purchaseLoading}
        >
          <Animated.View style={[styles.ctaBtn, { transform: [{ scale: ctaScale }], opacity: purchaseLoading ? 0.6 : ctaOpacity }]}>
            <LinearGradient
              colors={[Colors.warning, '#D4890A']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <Ionicons name="flash" size={16} color="#000" />
            <Text style={styles.ctaText}>
              {purchaseLoading
                ? 'Processing…'
                : `Start ${selectedPlan === 'annual' ? 'Annual' : 'Monthly'} Pro: ${selectedPlan === 'annual' ? `${annualPriceStr}/yr` : `${monthlyPriceStr}/mo`}`
              }
            </Text>
          </Animated.View>
        </Pressable>
        {purchaseError && (
          <Text style={styles.purchaseError}>{purchaseError}</Text>
        )}
      </Animated.View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: Spacing.md,
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
  proPillText: { fontSize: 10, lineHeight: 14, paddingTop: 2, fontFamily: 'Inter_700Bold', color: Colors.warning, letterSpacing: 1.2 },

  scroll: { paddingHorizontal: 20 },

  // Hero
  heroWrap: {
    alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.xl, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, borderTopColor: TopHighlight,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl,
  },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: Colors.warning, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 16,
  },
  heroIconGrad: { ...StyleSheet.absoluteFillObject },
  heroTitle: {
    fontSize: 24, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, textAlign: 'center', lineHeight: 32, paddingTop: 3,
  },
  heroSub: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary, textAlign: 'center', lineHeight: 20,
  },

  // Comparison
  comparisonWrap: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.lg,
  },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  comparisonIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  comparisonIconHighlight: { backgroundColor: Colors.warningMuted },
  comparisonText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  comparisonTextHighlight: { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  bestValueBadge: {
    backgroundColor: Colors.warningMuted, borderRadius: Radius.pill,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  bestValueText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.warning, letterSpacing: 0.8 },

  // Section
  section: { marginTop: Spacing.xxl, gap: Spacing.md },
  sectionTitle: {
    fontSize: 10, lineHeight: 16, paddingTop: 3, fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary, letterSpacing: 1.5,
  },
  featureList: { gap: Spacing.lg },

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
  featureTitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  featureDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 17 },

  // Free vs Pro table
  compTable: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  compTableHeader: {
    flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  compTableHeaderCell: {
    flex: 1, fontSize: 10, lineHeight: 14, fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8, textAlign: 'center',
  },
  compTableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12, minHeight: 44 },
  compTableRowAlt: { backgroundColor: Colors.surfaceElevated + '60' },
  compTableLabel: { flex: 3, fontSize: 12, lineHeight: 17, paddingRight: Spacing.sm, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  compTableCheck: { flex: 1, alignItems: 'center' },

  // Plan cards
  plansRow: { flexDirection: 'row', gap: Spacing.lg },
  planCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.border,
    gap: 4, position: 'relative',
  },
  planCardSelected: { borderColor: Colors.textSecondary + '60' },
  planCardHighlight: { borderColor: Colors.warning + '60', backgroundColor: Colors.warningMuted + '20' },
  savingsBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: Colors.warning, borderRadius: Radius.pill,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  savingsText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#000', letterSpacing: 0.5 },
  planLabel: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 0.5 },
  planPriceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 2 },
  planPrice: { fontSize: 22, lineHeight: 30, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  planPeriod: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  planNote: { fontSize: 10, lineHeight: 14, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  planCheckWrap: { position: 'absolute', bottom: 8, right: 8 },

  // Sticky footer
  stickyFooter: {
    paddingHorizontal: 20,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: Radius.lg, paddingVertical: 16,
    overflow: 'hidden',
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12,
  },
  ctaText: { flexShrink: 1, fontSize: 16, lineHeight: 22, fontFamily: 'Inter_700Bold', color: '#000' },

  // Purchase error
  purchaseError: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    color: '#FF4D4D', textAlign: 'center',
  },

  // Fine print
  finePrint: { marginTop: Spacing.xl, gap: Spacing.sm, alignItems: 'center', paddingBottom: Spacing.lg },
  restoreBtn: { minHeight: 44, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
  restoreText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  finePrintText: {
    fontSize: 11, fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary, textAlign: 'center', lineHeight: 20,
  },
  linkText: { color: Colors.warning, textDecorationLine: 'underline' },
});
