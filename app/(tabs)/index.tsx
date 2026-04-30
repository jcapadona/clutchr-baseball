import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { pickNextLesson, type RoutingResult } from '@/lib/lessonRouter';

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
  pitcher:   ['Attack the zone. No free passes.', 'Hip drive leads. Arm follows.', 'Next pitch. Short memory.', 'Tempo controls the game.', 'Read the swing. Adjust the sequence.'],
  catcher:   ['You run this game. Own every pitch.', 'Frame early. Block hard. Lead loud.', 'Your energy sets your pitcher\'s energy.', 'The best mound visit is short and direct.'],
  infielder: ['Ready hop. Soft hands. Attack.', 'Know the situation before every pitch.', 'Routine play first. Every single time.', 'Quick transfer. Strong throw. No hesitation.'],
  outfielder:['First step wins the play — build it now.', 'Read the pitch before you read the ball.', 'Crow hop on every throw. No exceptions.', 'Track it early. Move before you are sure.'],
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
  if (count === 3)  return '3-Day Streak 🔥';
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

// ─── HERO CONTINUE CARD ───────────────────────────────────────────────────────
// Now accepts a RoutingResult so the "why it matters" reason shows on the card.

function HeroContinueCard({ lesson, reason, loading, onPress }: {
  lesson: LegacyLesson | null;
  reason: string;
  loading: boolean;
  onPress: () => void;
}) {
  const dotAnim = useRef(new Animated.Value(0.3)).current;
  const glowFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!loading && lesson) {
      Animated.timing(glowFade, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }
  }, [loading, lesson]);

  const difficultyColor =
    lesson?.difficulty_tier === 'advanced' ? Colors.warning :
    lesson?.difficulty_tier === 'intermediate' ? Colors.info :
    Colors.primary;

  return (
    <Pressable
      style={({ pressed }) => [heroStyles.outer, pressed && { opacity: 0.93, transform: [{ scale: 0.985 }] }]}
      onPress={onPress}
      disabled={loading || !lesson}
    >
      {/* Dark base */}
      <LinearGradient
        colors={['#0D1F11', '#090E0A', '#060606']}
        style={heroStyles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Green radial bloom from top */}
      <Animated.View style={[heroStyles.bloomWrap, { opacity: glowFade }]}>
        <LinearGradient
          colors={[
            'rgba(34,204,94,0.22)',
            'rgba(34,204,94,0.08)',
            'rgba(34,204,94,0.02)',
            'transparent',
          ]}
          style={heroStyles.bloom}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Card border */}
      <View style={heroStyles.border} />

      {/* Content */}
      <View style={heroStyles.content}>

        {/* Top: badge + meta */}
        <View style={heroStyles.topRow}>
          <View style={heroStyles.liveBadge}>
            <Animated.View style={[heroStyles.liveDot, { opacity: dotAnim }]} />
            <Text style={heroStyles.liveBadgeText}>CONTINUE CAREER</Text>
          </View>
          {!loading && lesson && (
            <View style={heroStyles.topMeta}>
              <View style={[heroStyles.tierPill, { borderColor: difficultyColor + '50', backgroundColor: difficultyColor + '12' }]}>
                <Text style={[heroStyles.tierText, { color: difficultyColor }]}>
                  {lesson.difficulty_tier ?? 'starter'}
                </Text>
              </View>
              <Text style={heroStyles.durationMeta}>
                {Math.ceil((lesson.duration_sec ?? 90) / 60)} min
              </Text>
            </View>
          )}
        </View>

        {/* Title block — the hero moment */}
        <View style={heroStyles.titleBlock}>
          {loading ? (
            <>
              <View style={[heroStyles.skeletonLine, { width: '85%', height: 32 }]} />
              <View style={[heroStyles.skeletonLine, { width: '60%', height: 18, marginTop: 6 }]} />
            </>
          ) : (
            <>
              <Text style={heroStyles.title} numberOfLines={3}>
                {lesson?.title ?? 'Control the Controllables'}
              </Text>
              {/* ── ROUTING REASON — the "why it matters" line ─────────────
                  Previously showed lesson.subtitle (often null).
                  Now shows the router's reason — always specific and relevant. */}
              <Text style={heroStyles.subtitle} numberOfLines={2}>
                {reason || lesson?.subtitle || 'Your next rep is ready.'}
              </Text>
            </>
          )}
        </View>

        {/* Bottom row: XP + CTA button */}
        <View style={heroStyles.bottomRow}>
          <View style={heroStyles.xpRow}>
            <View style={heroStyles.xpIconBox}>
              <Ionicons name="flash" size={12} color={Colors.warning} />
            </View>
            <Text style={heroStyles.xpAmount}>+{lesson?.xp_reward ?? 50}</Text>
            <Text style={heroStyles.xpUnit}>XP</Text>
          </View>

          <View style={heroStyles.ctaBtn}>
            <Text style={heroStyles.ctaText}>Let's go</Text>
            <Ionicons name="arrow-forward" size={13} color="#000" />
          </View>
        </View>
      </View>

      {/* Bottom glow line */}
      <View style={heroStyles.bottomGlow} />
    </Pressable>
  );
}

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, streakStatus, completedTodayCount } = useAthlete();
  const [toolShelfOpen, setToolShelfOpen] = useState(false);
  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(true);

  // Staggered entry animations
  const anim0 = useRef(new Animated.Value(0)).current;
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(70, [
      Animated.spring(anim0, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.spring(anim1, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.spring(anim2, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.spring(anim3, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.spring(anim4, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── ROUTING ENGINE — replaces the old dumb find() ──────────────────────────
  useEffect(() => {
    if (!athleteState) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingLesson(true);
        // Fetch a larger pool so the router has full visibility.
        // The router handles all selection logic client-side.
        const lessons = await fetchLessons({ limit: 200 });
        if (cancelled) return;
        const result = pickNextLesson(lessons, athleteState);
        setRoutingResult(result);
      } catch (err) {
        console.error('Lesson routing failed:', err);
      } finally {
        if (!cancelled) setLoadingLesson(false);
      }
    })();
    return () => { cancelled = true; };
  }, [
    // Re-route whenever any of these change — covers lesson completion,
    // phase change, or struggle update without requiring a full app restart.
    athleteState?.completed_lessons?.length,
    athleteState?.season_phase,
    athleteState?.biggest_struggle?.join(','),
    athleteState?.primary_role,
  ]);

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
    if (!routingResult?.lesson) return;
    router.push(`/lesson/${routingResult.lesson.id}`);
  }

  const FAB_BOTTOM = insets.bottom + 72;

  // Animated card wrapper helper
  const animCard = (anim: Animated.Value, child: React.ReactNode) => (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
    }}>
      {child}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── HEADER ── */}
        {animCard(anim0,
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.clutchrWordmark}>{'<< CLUTCHR'}</Text>
              <View style={styles.greetingRow}>
                <Text style={styles.greetingLight}>{greeting}, </Text>
                <Text style={styles.greetingBold}>{athleteState.first_name}.</Text>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{getRoleLabel(athleteState.primary_role).toUpperCase()}</Text>
                </View>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.seasonText}>
                  {athleteState.season_phase.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.xpBlock}>
                <Ionicons name="flash" size={12} color={Colors.warning} />
                <Text style={styles.xpNumber}>{athleteState.total_xp}</Text>
              </View>
              <Text style={styles.xpSuffix}>XP</Text>
            </View>
          </View>
        )}

        {/* ── STREAK BANNER ── */}
        {animCard(anim1,
          <StreakBanner
            streakCount={athleteState.streak_count ?? 0}
            streakStatus={streakStatus}
            completedToday={completedTodayCount}
            streakBest={athleteState.streak_best ?? 0}
            onContinue={handleContinueCareer}
          />
        )}

        {/* ── HERO CARD — the centerpiece ── */}
        {animCard(anim2,
          <HeroContinueCard
            lesson={routingResult?.lesson ?? null}
            reason={routingResult?.reason ?? ''}
            loading={loadingLesson}
            onPress={handleContinueCareer}
          />
        )}

        {/* ── QUICK ACTIONS ── */}
        {animCard(anim3,
          <View style={styles.quickRow}>
            <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/gamemode')}>
              <LinearGradient
                colors={['rgba(245,166,35,0.10)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <View style={[styles.quickIconBox, { backgroundColor: Colors.warningMuted }]}>
                <Ionicons name="flash" size={17} color={Colors.warning} />
              </View>
              <View style={styles.quickMeta}>
                <Text style={styles.quickTitle}>GAME MODE</Text>
                <Text style={styles.quickDesc}>Pre · in · post</Text>
              </View>
              <Ionicons name="chevron-forward" size={12} color={Colors.warning + '60'} />
            </Pressable>

            <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/locker')}>
              <LinearGradient
                colors={['rgba(34,204,94,0.08)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <View style={[styles.quickIconBox, { backgroundColor: Colors.primaryGlow }]}>
                <Ionicons name="library" size={17} color={Colors.primary} />
              </View>
              <View style={styles.quickMeta}>
                <Text style={styles.quickTitle}>LOCKER</Text>
                <Text style={styles.quickDesc}>Articles · tools</Text>
              </View>
              <Ionicons name="chevron-forward" size={12} color={Colors.primary + '60'} />
            </Pressable>
          </View>
        )}

        {/* ── TODAY'S FOCUS ── */}
        {animCard(anim3,
          <View style={styles.focusCard}>
            <View style={styles.focusLeftBar} />
            <View style={styles.focusBody}>
              <View style={styles.focusHeader}>
                <Text style={styles.focusEyebrow}>TODAY'S FOCUS</Text>
                <View style={styles.focusTagPill}>
                  <Text style={styles.focusTagText}>{focusLabel}</Text>
                </View>
              </View>
              <Text style={styles.focusText}>{focus}</Text>
            </View>
          </View>
        )}

        {/* ── PLAYBOOK ── */}
        {animCard(anim4,
          <Pressable
            style={({ pressed }) => [
              playbookBuilt ? styles.playbookBuilt : styles.playbookCta,
              pressed && { opacity: 0.82 },
            ]}
            onPress={() => router.push('/playbook')}
          >
            {playbookBuilt && (
              <LinearGradient
                colors={['rgba(191,90,242,0.10)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
            )}
            <View style={[styles.playbookIcon, { backgroundColor: Colors.purple + '18' }]}>
              <Ionicons name="book" size={16} color={Colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playbookEyebrow}>
                {playbookBuilt ? 'MY PLAYBOOK' : 'BUILD YOUR PLAYBOOK'}
              </Text>
              <Text style={styles.playbookSub} numberOfLines={1}>
                {playbookBuilt ? (approachCue || 'Your cues are set') : 'Create your 5 personal cues'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={playbookBuilt ? Colors.purple : Colors.textTertiary} />
          </Pressable>
        )}

        {/* ── PROGRESS ── */}
        {animCard(anim4,
          <View style={styles.progressWrap}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressPhaseText}>Phase {phaseNum}</Text>
              <Text style={styles.progressCountText}>{completedCount} lessons</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, phaseProgress * 100)}%` }]} />
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── FAB ── */}
      <Pressable
        style={[styles.fab, { bottom: FAB_BOTTOM }]}
        onPress={() => setToolShelfOpen(true)}
      >
        <LinearGradient
          colors={[Colors.primary, '#18A84A']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <Ionicons name="flash" size={15} color="#000" />
        <Text style={styles.fabText}>TOOLS</Text>
      </Pressable>

      <ToolShelfModal visible={toolShelfOpen} onClose={() => setToolShelfOpen(false)} />
    </View>
  );
}

// ─── HERO STYLES ─────────────────────────────────────────────────────────────

const heroStyles = StyleSheet.create({
  outer: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    minHeight: 210,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bloomWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  bloom: {
    flex: 1,
  },
  border: {
    position: 'absolute',
    inset: 0,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(34,204,94,0.18)',
  } as any,
  content: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34,204,94,0.12)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(34,204,94,0.20)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  liveBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 1.4,
  },
  topMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    textTransform: 'capitalize',
  },
  durationMeta: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  titleBlock: {
    gap: 4,
  },
  skeletonLine: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.primary,
    lineHeight: 18,
    opacity: 0.85,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpAmount: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.warning,
  },
  xpUnit: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
  },
  ctaText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#000',
    letterSpacing: 0.3,
  },
  bottomGlow: {
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.25,
  },
});

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  headerLeft: { gap: 3 },
  clutchrWordmark: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 2,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'baseline' },
  greetingLight: { fontSize: 26, fontFamily: 'Inter_300Light', color: Colors.textSecondary },
  greetingBold: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  rolePill: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  rolePillText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.8 },
  metaSep: { fontSize: 11, color: Colors.textTertiary },
  seasonText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  headerRight: { alignItems: 'flex-end', paddingTop: 4, gap: 1 },
  xpBlock: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  xpNumber: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.warning,
  },
  xpSuffix: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1,
    textAlign: 'right',
  },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  quickIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickMeta: { flex: 1, gap: 2 },
  quickTitle: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 0.8,
  },
  quickDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },

  // Focus card
  focusCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  focusLeftBar: {
    width: 3,
    backgroundColor: Colors.primary,
  },
  focusBody: {
    flex: 1,
    padding: Spacing.lg,
    gap: 8,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  focusEyebrow: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  focusTagPill: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  focusTagText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  focusText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  // Playbook
  playbookCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.purple + '38',
    padding: Spacing.md,
    backgroundColor: Colors.purple + '07',
    overflow: 'hidden',
  },
  playbookBuilt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.purple + '28',
    padding: Spacing.md,
    overflow: 'hidden',
  },
  playbookIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  playbookEyebrow: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.purple,
    letterSpacing: 1,
    marginBottom: 2,
  },
  playbookSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // Progress
  progressWrap: { gap: 6, paddingBottom: 4 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPhaseText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textTertiary,
  },
  progressCountText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.pill,
    paddingVertical: 11,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#000',
    letterSpacing: 1.2,
  },
});

// ─── BANNER STYLES ────────────────────────────────────────────────────────────

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
