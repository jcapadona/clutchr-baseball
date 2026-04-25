import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { Colors, Radius, Spacing } from '@/constants/theme';

const ROLE_LABELS: Record<string, string> = {
  pitcher: 'Pitcher',
  catcher: 'Catcher',
  infielder: 'Infielder',
  outfielder: 'Outfielder',
};

const LEVEL_LABELS: Record<string, string> = {
  youth: 'Youth',
  high_school: 'High School',
  college: 'College',
  pro: 'Pro / Advanced',
};

const PHASE_LABELS = [
  'Calibration',
  'Foundation',
  'Role Execution',
  'Approach',
  'Pressure',
  'Resilience',
  'Mastery',
  'Elite',
];

const XP_TO_NEXT = [200, 500, 1000, 2000, 3500, 5000, 7500, 10000];
const RANK_LABELS = ['Rookie', 'Prospect', 'Player', 'Starter', 'Veteran', 'All-Star', 'Ace', 'Legend'];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, session, signOut } = useAthlete();

  if (!athleteState) return null;

  const xp = athleteState.total_xp;
  const phase = athleteState.current_phase;
  const xpNeeded = XP_TO_NEXT[Math.min(phase, XP_TO_NEXT.length - 1)];
  const xpProgress = Math.min(xp / xpNeeded, 1);
  const rank = RANK_LABELS[Math.min(phase, RANK_LABELS.length - 1)];
  const phaseLabel = PHASE_LABELS[Math.min(phase, PHASE_LABELS.length - 1)];

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const ratings = athleteState.self_ratings;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.clutchrLogo}>{'<< CLUTCHR'}</Text>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity card */}
        <View style={styles.identityCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarLetter}>
              {athleteState.first_name[0]?.toUpperCase() ?? 'A'}
            </Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.identityName}>{athleteState.first_name}</Text>
            <Text style={styles.identityRole}>
              {ROLE_LABELS[athleteState.primary_role] ?? athleteState.primary_role}
            </Text>
            <Text style={styles.identityLevel}>
              {LEVEL_LABELS[athleteState.level_band] ?? athleteState.level_band}
            </Text>
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{rank.toUpperCase()}</Text>
          </View>
        </View>

        {/* XP / Progress */}
        <View style={styles.xpCard}>
          <View style={styles.xpRow}>
            <View style={styles.xpLeft}>
              <Ionicons name="flash" size={16} color={Colors.warning} />
              <Text style={styles.xpNum}>{xp.toLocaleString()} XP</Text>
            </View>
            <Text style={styles.xpPhase}>Phase {phase + 1} · {phaseLabel}</Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpProgress * 100}%` }]} />
          </View>
          <Text style={styles.xpSub}>{xpNeeded - xp > 0 ? `${(xpNeeded - xp).toLocaleString()} XP to ${RANK_LABELS[Math.min(phase + 1, RANK_LABELS.length - 1)]}` : 'Max rank reached'}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Lessons', value: athleteState.completed_lessons.length, icon: 'book' },
            { label: 'XP', value: xp.toLocaleString(), icon: 'flash' },
            { label: 'Routines', value: athleteState.saved_routines.length, icon: 'bookmark' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Season phase */}
        <Pressable style={styles.seasonBadge}>
          <View style={styles.seasonDot} />
          <Text style={styles.seasonText}>
            {athleteState.season_phase.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </Text>
        </Pressable>

        {/* Mental Edge ratings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MENTAL EDGE</Text>
            <Text style={styles.sectionSub}>Self-rated · 1–5</Text>
          </View>
          <View style={styles.ratingsCard}>
            {(
              [
                ['confidence', 'Confidence'],
                ['focus', 'Focus'],
                ['composure', 'Composure'],
                ['recovery_discipline', 'Recovery'],
                ['reset_skill', 'Reset Skill'],
              ] as [keyof typeof ratings, string][]
            ).map(([key, label]) => (
              <View key={key} style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>{label}</Text>
                <View style={styles.ratingDots}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <View
                      key={val}
                      style={[styles.dot, ratings[key] >= val && styles.dotActive]}
                    />
                  ))}
                </View>
                <Text style={styles.ratingNum}>{ratings[key]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Pressable
            style={styles.actionRow}
            onPress={() => router.push('/onboarding')}
          >
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.actionLabel}>Update Profile</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </Pressable>

          <Pressable style={styles.actionRow} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            <Text style={[styles.actionLabel, { color: Colors.danger }]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  clutchrLogo: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  identityInfo: { flex: 1, gap: 2 },
  identityName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  identityRole: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  identityLevel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  rankBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryMuted,
  },
  rankText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  xpCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  xpNum: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.warning,
  },
  xpPhase: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  xpTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  xpFill: {
    height: 6,
    backgroundColor: Colors.warning,
    borderRadius: 3,
  },
  xpSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  seasonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  seasonText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  section: { gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  sectionSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  ratingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ratingLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    width: 90,
  },
  ratingDots: { flexDirection: 'row', gap: 5, flex: 1 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.primary },
  ratingNum: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    width: 20,
    textAlign: 'right',
  },
  actionsSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionLabel: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    flex: 1,
  },
});
