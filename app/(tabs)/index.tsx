import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { fetchLessons, type LegacyLesson } from '@/lib/supabase';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { PositionRole, SeasonPhase, Struggle } from '@/context/AthleteContext';
import ToolShelfModal from '@/components/ToolShelfModal';

// ─── PERSONALIZED FOCUS ENGINE ────────────────────────────────────────────────

interface FocusMessage { focus: string; label: string; }

const STRUGGLE_FOCUS: Record<Struggle, FocusMessage> = {
  bouncing_back:     { label: 'BOUNCE BACK',    focus: 'One bad rep does not define the next. Short memory is a skill. Practice it today.' },
  confidence:        { label: 'CONFIDENCE',     focus: 'Confidence is built rep by rep. Do the work today. Let the results follow.' },
  pregame_nerves:    { label: 'PREGAME MIND',   focus: 'Nerves mean you care. Rename it: not nervous — ready. Channel it.' },
  throwing_safely:   { label: 'ARM HEALTH',     focus: 'Take care of the arm today. Warmup fully. Do not rush the progression.' },
  throwing_strikes:  { label: 'COMMAND',        focus: 'Attack the zone. Every pitch has a target. See the glove. Throw to it.' },
  fielding_cleanly:  { label: 'FIELDING',       focus: 'Soft hands start in the ready position. See the ball early. Trust your feet.' },
  better_routine:    { label: 'ROUTINE',        focus: 'The routine is your armor. Same process every time — the game cannot break what is already set.' },
  staying_locked_in: { label: 'FOCUS',          focus: 'One pitch. This pitch. Everything else is noise. See it early and compete.' },
  reading_hitters:   { label: 'READ HITTERS',   focus: 'Every swing is information. Watch the load, watch the timing, adjust.' },
  plate_approach:    { label: 'APPROACH',       focus: 'Know your damage zone before you step in. Hunt your pitch. Attack it.' },
};

const SEASON_FOCUS: Record<SeasonPhase, FocusMessage> = {
  preseason:       { label: 'PRESEASON',        focus: 'Build the habits now that will hold up in June. Reps in February pay dividends in the playoffs.' },
  in_season:       { label: 'IN SEASON',        focus: 'You are in it now. Compete today. Process over results. One rep at a time.' },
  slump_reset:     { label: 'SLUMP RESET',      focus: 'Slumps end when you stop trying to fix them and start competing in the process.' },
  offseason_build: { label: 'OFF SEASON',       focus: 'This is when the gap closes. The work you do now shows up when the games matter.' },
  return_to_throw: { label: 'RETURN TO THROW',  focus: 'Patience is the work right now. Trust the progression. The arm comes back.' },
};

const ROLE_FOCUS: Record<PositionRole, string[]> = {
  pitcher:   ['Attack the zone. No free passes.', 'Hip drive leads. Arm follows.', 'Next pitch. Short memory.', 'Tempo controls the game.', 'Read the swing. Adjust the sequence.', 'See the glove. Trust the stuff.', 'Pound the zone. Make them earn it.'],
  catcher:   ['You run this game. Own every pitch.', 'Frame early. Block hard. Lead loud.', 'Your energy sets your pitcher\'s energy.', 'Pre-pitch plan on every single rep.', 'The best mound visit is short and direct.', 'Know the hitter before he steps in.'],
  infielder: ['Ready hop. Soft hands. Attack.', 'Know the situation before every pitch.', 'See the ball early. Trust your feet.', 'Routine play first. Every single time.', 'Quick transfer. Strong throw. No hesitation.', 'Get low on the short hop. Always.'],
  outfielder:['First step wins the play — build it now.', 'Read the pitch before you read the ball.', 'Go get everything in your zone.', 'Crow hop on every throw. No exceptions.', 'Charge hard on grounders. Trust your arm.', 'Track it early. Move before you are sure.'],
};

function getPersonalizedFocus(role: PositionRole, struggles: Struggle[], phase: SeasonPhase): FocusMessage {
  if (struggles.length > 0) {
    const idx = new Date().getDay() % struggles.length;
    return STRUGGLE_FOCUS[struggles[idx]];
  }
  if (phase === 'slump_reset' || phase === 'return_to_throw' || phase === 'preseason') return SEASON_FOCUS[phase];
  const list = ROLE_FOCUS[role] ?? ROLE_FOCUS.infielder;
  return { label: role.toUpperCase(), focus: list[new Date().getDay() % list.length] };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = { pitcher: 'Pitcher', catcher: 'Catcher', infielder: 'Infielder', outfielder: 'Outfielder' };
  return map[role] ?? role;
}

function getStreakMilestone(count: number): string | null {
  if (count === 3)  return '3-Day Streak';
  if (count === 7)  return '7-Day Commander';
  if (count === 14) return '14-Day Grinder';
  if (count === 21) return '21-Day Pro';
  if (count === 30) return '30-Day Legend';
  return null;
}

// ─── STREAK BANNER ────────────────────────────────────────────────────────────

function StreakBanner({ streakCount, streakStatus, completedToday, streakBest, onContinue }: {
  streakCount: number; streakStatus: 'none'|'active'|'at_risk'|'done_today';
  completedToday: number; streakBest: number; onContinue: () => void;
}) {
  const milestone = getStreakMilestone(streakCount);

  if (streakStatus === 'done_today') {
    return (
      <View style={[bannerStyles.wrap, bannerStyles.wrapDone]}>
        <View style={bannerStyles.row}>
          <Text style={bannerStyles.fireEmoji}>🔥</Text>
          <View style={bannerStyles.info}>
            <Text style={bannerStyles.title}>{milestone ? `${milestone} unlocked` : 'Rep done. Streak active.'}</Text>
            <Text style={bannerStyles.sub}>{completedToday} today · {streakCount}-day streak{streakBest > streakCount ? ` · Best: ${streakBest}` : ''}</Text>
          </View>
          <View style={bannerStyles.checkCircle}><Ionicons name="checkmark" size={14} color="#fff" /></View>
        </View>
        {milestone && (
          <View style={bannerStyles.milestoneBar}>
            <Ionicons name="trophy" size={11} color={Colors.warning} />
            <Text style={bannerStyles.milestoneText}>{milestone} achieved today</Text>
          </View>
        )}
      </View>
    );
  }

  if (streakStatus === 'at_risk') {
    return (
      <Pressable style={[bannerStyles.wrap, bannerStyles.wrapRisk]} onPress={onContinue}>
        <View style={bannerStyles.row}>
          <Text style={[bannerStyles.fireEmoji, { opacity: 0.5 }]}>🔥</Text>
          <View style={bannerStyles.info}>
            <Text style={[bannerStyles.title, { color: Colors.warning }]}>Streak at risk — do a rep today</Text>
            <Text style={bannerStyles.sub}>Miss again and your {streakCount}-day streak resets</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={Colors.warning} />
        </View>
      </Pressable>
    );
  }

  if (streakStatus === 'active' && streakCount > 0) {
    return (
      <Pressable style={[bannerStyles.wrap, bannerStyles.wrapActive]} onPress={onContinue}>
        <View style={bannerStyles.row}>
          <Text style={bannerStyles.fireEmoji}>🔥</Text>
          <View style={bannerStyles.info}>
            <Text style={bannerStyles.title}>{streakCount}-day streak — keep it going</Text>
            <Text style={bannerStyles.sub}>Do your rep today to extend it</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={[bannerStyles.wrap, bannerStyles.wrapNone]} onPress={onContinue}>
      <View style={bannerStyles.row}>
        <Text style={[bannerStyles.fireEmoji, { opacity: 0.35 }]}>🔥</Text>
        <View style={bannerStyles.info}>
          <Text style={bannerStyles.title}>Start your streak today</Text>
          <Text style={bannerStyles.sub}>Complete one lesson to light the fire</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
      </View>
    </Pressable>
  );
}

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, streakStatus, completedTodayCount } = useAthlete();
  const [toolShelfOpen, setToolShelfOpen] = useState(false);
  const [nextLesson, setNextLesson] = useState<LegacyLesson | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(true);

  useEffect(() => {
    if (!athleteState) return;
    (async () => {
      try {
        const lessons = await fetchLessons({ limit: 50 });
        const next = lessons.find((l) => !athleteState.completed_lessons.includes(l.id));
        setNextLesson(next ?? lessons[0] ?? null);
      } catch (err) {
        console.error('Failed to fetch lessons:', err);
      } finally {
        setLoadingLesson(false);
      }
    })();
  }, [athleteState]);

  if (!athleteState) return null;

  const greeting = getGreeting();
  const completedCount = athleteState.completed_lessons.length;
  const phaseProgress = (completedCount % 5) / 5;
  const phaseNum = athleteState.current_phase + 1;
  const playbookBuilt = !!(athleteState as any)?.playbook?.built_at;
  const approachCue = (athleteState as any)?.playbook?.approach ?? '';

  const { focus, label: focusLabel } = getPersonalizedFocus(
    athleteState.primary_role,
    athleteState.biggest_struggle ?? [],
    athleteState.season_phase
  );

  function handleContinueCareer() {
    if (!nextLesson) return;
    router.push(`/lesson/${nextLesson.id}`);
  }

  // FAB sits above the tab bar — calculate correct bottom offset
  const FAB_BOTTOM = insets.bottom + 72; // 72 = tab bar height

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── HEADER ROW: logo + greeting in one compact block ── */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Text style={styles.clutchrLogo}>{'<< CLUTCHR'}</Text>
            <Text style={styles.greeting}>{greeting}, {athleteState.first_name}.</Text>
            <View style={styles.greetingMeta}>
              <Text style={styles.roleTag}>{getRoleLabel(athleteState.primary_role)}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.seasonTag}>
                {athleteState.season_phase.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Text>
            </View>
          </View>
          {/* XP pill — top right corner */}
          <View style={styles.xpPill}>
            <Ionicons name="flash" size={11} color={Colors.warning} />
            <Text style={styles.xpPillText}>{athleteState.total_xp} XP</Text>
          </View>
        </View>

        {/* ── STREAK BANNER ── */}
        <StreakBanner
          streakCount={athleteState.streak_count ?? 0}
          streakStatus={streakStatus}
          completedToday={completedTodayCount}
          streakBest={athleteState.streak_best ?? 0}
          onContinue={handleContinueCareer}
        />

        {/* ── CONTINUE CAREER — primary action, full visual weight ── */}
        <Pressable
          style={({ pressed }) => [styles.continueCard, pressed && styles.continueCardPressed]}
          onPress={handleContinueCareer}
          disabled={loadingLesson || !nextLesson}
        >
          <LinearGradient
            colors={['#0D2418', '#0A1A10', '#060606']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.continueTop}>
            <View style={styles.continueBadge}>
              <Text style={styles.continueBadgeText}>CONTINUE CAREER</Text>
            </View>
            <Text style={styles.continueMeta}>
              {loadingLesson ? '...' : nextLesson
                ? `${nextLesson.difficulty_tier ?? 'Starter'} · ${Math.ceil((nextLesson.duration_sec ?? 90) / 60)} min`
                : 'All caught up'}
            </Text>
          </View>
          <Text style={styles.continueTitle}>
            {loadingLesson ? 'Loading your next rep...' : nextLesson?.title ?? 'Control the Controllables'}
          </Text>
          {nextLesson?.subtitle && (
            <Text style={styles.continueDesc}>{nextLesson.subtitle}</Text>
          )}
          <View style={styles.continueBottom}>
            <View style={styles.xpBadge}>
              <Ionicons name="flash" size={12} color={Colors.warning} />
              <Text style={styles.xpBadgeText}>+{nextLesson?.xp_reward ?? 50} XP</Text>
            </View>
            <Text style={styles.letsGo}>{loadingLesson ? '' : "Let's go →"}</Text>
          </View>
        </Pressable>

        {/* ── QUICK ACTIONS — compact horizontal row ── */}
        <View style={styles.quickRow}>
          <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/gamemode')}>
            <View style={[styles.quickIcon, { backgroundColor: Colors.warningMuted }]}>
              <Ionicons name="flash" size={18} color={Colors.warning} />
            </View>
            <View style={styles.quickText}>
              <Text style={styles.quickLabel}>GAME MODE</Text>
              <Text style={styles.quickDesc}>Pre, in, post-game</Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color={Colors.textTertiary} />
          </Pressable>
          <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/locker')}>
            <View style={[styles.quickIcon, { backgroundColor: Colors.primaryGlow }]}>
              <Ionicons name="library" size={18} color={Colors.primary} />
            </View>
            <View style={styles.quickText}>
              <Text style={styles.quickLabel}>LOCKER</Text>
              <Text style={styles.quickDesc}>Articles & tools</Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color={Colors.textTertiary} />
          </Pressable>
        </View>

        {/* ── TODAY'S FOCUS ── */}
        <View style={styles.focusCard}>
          <View style={styles.focusAccent} />
          <View style={styles.focusContent}>
            <Text style={styles.focusLabel}>{focusLabel}</Text>
            <Text style={styles.focusText}>{focus}</Text>
          </View>
        </View>

        {/* ── PLAYBOOK — secondary card, lighter weight ── */}
        <Pressable
          style={({ pressed }) => [
            playbookBuilt ? styles.playbookBuilt : styles.playbookCta,
            pressed && { opacity: 0.82 },
          ]}
          onPress={() => router.push('/playbook')}
        >
          <View style={[styles.playbookIcon, { backgroundColor: playbookBuilt ? Colors.purple + '15' : Colors.purple + '18' }]}>
            <Ionicons name="book" size={16} color={Colors.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.playbookLabel}>
              {playbookBuilt ? 'MY PLAYBOOK' : 'BUILD YOUR PLAYBOOK'}
            </Text>
            <Text style={[styles.playbookSub, playbookBuilt && { color: Colors.purple }]} numberOfLines={1}>
              {playbookBuilt
                ? (approachCue || 'Your cues are set')
                : 'Create your 5 personal cues'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={playbookBuilt ? Colors.purple : Colors.textTertiary} />
        </Pressable>

        {/* ── PROGRESS — slim, bottom of scroll ── */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressPhase}>Phase {phaseNum}</Text>
            <Text style={styles.progressCount}>{completedCount} lessons</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, phaseProgress * 100)}%` }]} />
          </View>
        </View>

      </ScrollView>

      {/* ── TOOLS FAB — positioned above tab bar, never overlaps content ── */}
      <Pressable
        style={[styles.fab, { bottom: FAB_BOTTOM }]}
        onPress={() => setToolShelfOpen(true)}
      >
        <Ionicons name="flash" size={17} color={Colors.background} />
        <Text style={styles.fabText}>TOOLS</Text>
      </Pressable>

      <ToolShelfModal visible={toolShelfOpen} onClose={() => setToolShelfOpen(false)} />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // Tighter gap — cards breathe but don't float
  scroll: { paddingHorizontal: Spacing.xl, gap: 10 },

  // ── Header ──
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: Spacing.md, paddingBottom: 4 },
  topLeft: { gap: 3 },
  clutchrLogo: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1.2 },
  greeting: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 2 },
  greetingMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  roleTag: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  metaDot: { fontSize: 12, color: Colors.textTertiary },
  seasonTag: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  xpPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warningMuted, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.pill, marginTop: Spacing.sm },
  xpPillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.warning },

  // ── Continue Career ──
  continueCard: { borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.primaryBorder, padding: Spacing.xl, gap: 8, overflow: 'hidden' },
  continueCardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  continueTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  continueBadge: { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 3 },
  continueBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.background, letterSpacing: 1 },
  continueMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  continueTitle: { fontSize: 21, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, lineHeight: 27 },
  continueDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 19 },
  continueBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.warning },
  letsGo: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  // ── Quick Actions — horizontal, compact ──
  quickRow: { flexDirection: 'row', gap: 8 },
  quickCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.sm,
  },
  quickIcon: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  quickText: { flex: 1, gap: 1 },
  quickLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.textSecondary, letterSpacing: 0.8 },
  quickDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  // ── Focus card ──
  focusCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  focusAccent: { width: 3, backgroundColor: Colors.primary },
  focusContent: { flex: 1, padding: Spacing.md, gap: 3 },
  focusLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1 },
  focusText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, lineHeight: 21 },

  // ── Playbook card ──
  playbookCta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: `${Colors.purple}35`, padding: Spacing.md, backgroundColor: `${Colors.purple}07` },
  playbookBuilt: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  playbookIcon: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  playbookLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.purple, letterSpacing: 1, marginBottom: 2 },
  playbookSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 16 },

  // ── Progress — slim strip, no big card ──
  progressCard: { gap: 5, paddingBottom: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPhase: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  progressCount: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  progressTrack: { height: 2, backgroundColor: Colors.border, borderRadius: 1 },
  progressFill: { height: 2, backgroundColor: Colors.primary, borderRadius: 1 },

  // ── FAB — never overlaps content ──
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.background, letterSpacing: 1 },
});

const bannerStyles = StyleSheet.create({
  wrap: { borderRadius: Radius.lg, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: 10 },
  wrapDone:   { backgroundColor: Colors.primaryMuted, borderColor: Colors.primaryBorder },
  wrapActive: { backgroundColor: Colors.surface, borderColor: Colors.primaryBorder },
  wrapRisk:   { backgroundColor: Colors.warningMuted, borderColor: `${Colors.warning}50` },
  wrapNone:   { backgroundColor: Colors.surface, borderColor: Colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  fireEmoji: { fontSize: 18, lineHeight: 22 },
  info: { flex: 1, gap: 1 },
  title: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  sub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  checkCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  milestoneBar: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7, paddingTop: 7, borderTopWidth: 1, borderTopColor: Colors.primaryBorder },
  milestoneText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.warning },
});
