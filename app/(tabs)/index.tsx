import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { fetchLessons } from '@/lib/supabase';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { Assets } from '@/constants/assets';
import { pickNextLesson, type RoutingResult } from '@/lib/lessonRouter';
import { SkeletonBox, SkeletonCard } from '@/components/SkeletonLoader';
import { EmblemBadge } from '@/components/EmblemBadge';
import { getCurrentRank, getRankProgress } from '@/lib/progressionRanks';
import { useMicrocopy } from '@/hooks/useMicrocopy';
import { Btn } from '@/components/ui';
import { ProgressRing } from '@/components/ProgressRing';
import { useToast } from '@/components/Toast';

const MISSIONS_DATE_KEY  = 'missions_date';
const MISSIONS_PROG_KEY  = 'missions_progress';

interface MissionsProgress {
  lessonsCompleted: number;
  gameModeOpened: boolean;
}

function formatLabel(value?: string | null) {
  if (!value) return '';
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

// ─── SCREEN ──────────────────────────────────────────────────────────────────

const LAST_ACTIVE_KEY = 'last_active_date';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, isLoading, completedTodayCount, updateAthleteState } = useAthlete();
  const [routingResult, setRoutingResult]   = useState<RoutingResult | null>(null);
  const [loadingLesson, setLoadingLesson]   = useState(true);
  const [missions, setMissions]             = useState<MissionsProgress>({ lessonsCompleted: 0, gameModeOpened: false });
  const [isReturn, setIsReturn]             = useState(false);

  const microcopy = useMicrocopy();
  const { showToast } = useToast();
  // TODO: wire isGameDay from AthleteState or schedule data (added during game-mode prompt)
  const isGameDay = false;
  const greetingRef = useRef<string | null>(null);

  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;
  const anim5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(70, [
      Animated.spring(anim1, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.spring(anim2, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.spring(anim3, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.spring(anim4, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.spring(anim5, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
    ]).start();
  }, []);

  // Track return status and stamp last_active_date
  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const last = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
      if (last) {
        const dayGap = Math.round((new Date(today).getTime() - new Date(last).getTime()) / 86400000);
        if (dayGap >= 3) setIsReturn(true);
      }
      await AsyncStorage.setItem(LAST_ACTIVE_KEY, today);
    })();
  }, []);

  // Daily missions — reset on new day, hydrate from storage
  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const storedDate = await AsyncStorage.getItem(MISSIONS_DATE_KEY);
      if (storedDate !== today) {
        const fresh: MissionsProgress = { lessonsCompleted: 0, gameModeOpened: false };
        await AsyncStorage.setItem(MISSIONS_DATE_KEY, today);
        await AsyncStorage.setItem(MISSIONS_PROG_KEY, JSON.stringify(fresh));
        setMissions(fresh);
      } else {
        const raw = await AsyncStorage.getItem(MISSIONS_PROG_KEY);
        if (raw) setMissions(JSON.parse(raw));
      }
    })();
  }, []);

  // Keep mission lessons count in sync with athlete context
  useEffect(() => {
    setMissions(prev => {
      const next = { ...prev, lessonsCompleted: completedTodayCount };
      AsyncStorage.setItem(MISSIONS_PROG_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [completedTodayCount]);

  // Routing engine
  useEffect(() => {
    if (!athleteState) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingLesson(true);
        const lessons = await fetchLessons({ limit: 200 });
        if (cancelled) return;
        setRoutingResult(pickNextLesson(lessons, athleteState));
      } catch (err) {
        console.error('Lesson routing failed:', err);
      } finally {
        if (!cancelled) setLoadingLesson(false);
      }
    })();
    return () => { cancelled = true; };
  }, [
    athleteState?.completed_lessons?.length,
    athleteState?.season_phase,
    athleteState?.biggest_struggle?.join(','),
    athleteState?.primary_role,
  ]);

  const [gmDoneToday, setGmDoneToday] = useState(false);

  useEffect(() => {
    const checkGM = async () => {
      const date = await AsyncStorage.getItem('gm_completed_date');
      setGmDoneToday(date === new Date().toDateString());
    };
    checkGM();
  }, []);

  const lessonsToday    = completedTodayCount;
  const mission1Progress = Math.min(lessonsToday, 2);
  const mission1Done    = mission1Progress >= 2;
  const mission2Progress = gmDoneToday ? 1 : 0;
  const mission2Done    = gmDoneToday;

  useEffect(() => {
    if (!athleteState || !mission1Done) return;
    const today = new Date().toDateString();
    const key = `mission1_awarded_${today}`;
    (async () => {
      const already = await AsyncStorage.getItem(key);
      if (already) return;
      await updateAthleteState({ total_xp: (athleteState.total_xp ?? 0) + 30 });
      await AsyncStorage.setItem(key, '1');
    })();
  }, [mission1Done]);

  useEffect(() => {
    if (!athleteState || !mission2Done) return;
    const today = new Date().toDateString();
    const key = `mission2_awarded_${today}`;
    (async () => {
      const already = await AsyncStorage.getItem(key);
      if (already) return;
      await updateAthleteState({ total_xp: (athleteState.total_xp ?? 0) + 15 });
      await AsyncStorage.setItem(key, '1');
    })();
  }, [mission2Done]);

  const totalXp     = athleteState?.total_xp ?? 0;
  const currentRank = getCurrentRank(totalXp);
  const rankProgress = getRankProgress(totalXp);
  const streak      = athleteState?.streak_count ?? 0;

  if (isLoading || !athleteState) {
    return (
      <View style={s.container}>
        <View style={[s.header, { paddingTop: insets.top + 12 }]}>
          <Image source={Assets.branding.mainWordmark} style={s.headerWordmark} resizeMode="contain" />
          <View style={s.headerIcons}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
            <Ionicons name="calendar-outline" size={22} color={Colors.textSecondary} />
          </View>
        </View>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 140 }]}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonBox width="55%" height={20} radius={6} />
          <SkeletonBox width="75%" height={13} radius={5} style={{ marginTop: 4 }} />
          <SkeletonCard style={{ marginTop: 10 }} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <SkeletonBox width="47%" height={80} radius={12} />
            <SkeletonBox width="47%" height={80} radius={12} />
          </View>
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  const roleLabel    = athleteState.primary_role
    ? athleteState.primary_role.charAt(0).toUpperCase() + athleteState.primary_role.slice(1)
    : 'Player';
  const phaseLabel   = formatLabel(athleteState.season_phase) || 'Train';
  const lesson       = routingResult?.lesson ?? null;
  const reason       = routingResult?.reason ?? '';
  const heroSubtitle = lesson?.subtitle || 'Command, tempo, and mound IQ.';
  const firstName    = athleteState.first_name?.trim();
  if (greetingRef.current === null) {
    greetingRef.current = microcopy.useHomeGreeting({ isGameDay, isReturn });
  }
  const planTitle    = greetingRef.current;
  const planSubtitle = firstName ? `${firstName} · ${phaseLabel} · ${roleLabel}` : `${phaseLabel} · ${roleLabel} · Next rep loaded`;
  const edgeLine     = reason && reason.length <= 82 ? reason : 'Build command and tempo before the game speeds up.';
  const repsProgressPercent  = `${(mission1Progress / 2) * 100}%`;
  const resetProgressPercent = `${mission2Progress * 100}%`;
  const earnedMissionXp = (mission1Done ? 30 : 0) + (mission2Done ? 15 : 0);

  function handleContinueCareer() {
    if (!routingResult?.lesson) return;
    const encodedReason = encodeURIComponent(routingResult.reason ?? '');
    router.push(`/lesson/${routingResult.lesson.id}?reason=${encodedReason}`);
  }

  async function handleGameModePress() {
    const next = { ...missions, gameModeOpened: true };
    setMissions(next);
    await AsyncStorage.setItem(MISSIONS_PROG_KEY, JSON.stringify(next));
    router.push('/(tabs)/gamemode');
  }

  const animCard = (anim: Animated.Value, child: React.ReactNode) => (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
    }}>
      {child}
    </Animated.View>
  );

  return (
    <View style={s.container}>

      {/* ── HEADER ── */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Image source={Assets.branding.mainWordmark} style={s.headerWordmark} resizeMode="contain" />
        <View style={s.headerIcons}>
          <ProgressRing
            value={completedTodayCount / 3}
            size={48}
            label="TODAY"
            valueLabel={String(completedTodayCount)}
          />
          {streak > 0 && (
            <View style={s.streakPill}>
              <Ionicons name="flame" size={13} color={Colors.warning} />
              <Text style={s.streakText}>{streak}</Text>
            </View>
          )}
          <Pressable hitSlop={10} onPress={() => showToast('Coming soon — reminders', 'info')}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
          </Pressable>
          <Pressable hitSlop={10} onPress={() => showToast('Coming soon — schedule', 'info')}>
            <Ionicons name="calendar-outline" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. UPCOMING GAME CARD ── */}
        {/* TODO: wire real game schedule */}
        {animCard(anim1,
          <View style={s.gameCard}>
            <Text style={s.sectionLabel}>UPCOMING GAME</Text>
            <View style={s.teamsRow}>
              {/* Your team */}
              <View style={s.teamBlock}>
                <View style={s.teamLogoBox}>
                  <Text style={s.teamLogoLetter}>R</Text>
                </View>
                <Text style={s.teamNameLabel}>YOUR TEAM</Text>
              </View>
              {/* Center info */}
              <View style={s.vsBlock}>
                <Text style={s.vsText}>VS</Text>
                <Text style={s.gameDetail}>TODAY • 7:00 PM</Text>
                <Text style={s.gameDetail}>RIVERSIDE FIELD</Text>
              </View>
              {/* Opponent */}
              <View style={[s.teamBlock, { alignItems: 'flex-end' }]}>
                <View style={[s.teamLogoBox, s.opponentLogoBox]}>
                  <Ionicons name="shield-outline" size={20} color={Colors.textTertiary} />
                </View>
                <Text style={s.teamNameLabel}>KNIGHTS</Text>
              </View>
            </View>

            <Text style={s.firstPitchLabel}>FIRST PITCH IN</Text>
            <View style={s.countdownRow}>
              <View style={s.countdownUnit}>
                <Text style={s.countdownValue}>02</Text>
                <Text style={s.countdownUnitLabel}>HRS</Text>
              </View>
              <Text style={s.countdownColon}>:</Text>
              <View style={s.countdownUnit}>
                <Text style={s.countdownValue}>37</Text>
                <Text style={s.countdownUnitLabel}>MIN</Text>
              </View>
              <Text style={s.countdownColon}>:</Text>
              <View style={s.countdownUnit}>
                <Text style={s.countdownValue}>45</Text>
                <Text style={s.countdownUnitLabel}>SEC</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── 2. THREE-COLUMN WIDGET ROW ── */}
        {animCard(anim2,
          <View style={s.widgetRow}>
            {/* Weather — TODO: weather API */}
            <View style={s.widget}>
              <Text style={s.weatherEmoji}>☀️</Text>
              <Text style={s.widgetMain}>72°</Text>
              <Text style={s.widgetSub}>Clear</Text>
            </View>
            {/* Readiness */}
            <View style={s.widget}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              <Text style={[s.widgetMain, s.widgetGreen]}>GOOD</Text>
              <Text style={s.widgetSub}>Readiness</Text>
            </View>
            {/* Routine */}
            <View style={s.widget}>
              <Ionicons name="book-outline" size={20} color={Colors.textTertiary} />
              <Text style={s.widgetMain}>—%</Text>
              <Text style={s.widgetSub}>Routine</Text>
            </View>
          </View>
        )}

        {/* ── 3. OPPONENT INTEL ── */}
        {/* TODO: wire opponent intel input */}
        {animCard(anim3,
          <View style={s.intelSection}>
            <Text style={s.intelHeader}>OPPONENT INTEL</Text>
            <View style={s.intelCard}>
              {[
                { icon: 'people-outline' as const, title: 'Team Tendencies', sub: 'Aggressive early. 75% swing on 1st pitch.' },
                { icon: 'baseball-outline' as const, title: 'Key Pitcher',    sub: 'RHP · 88–90 MPH · 2-Seam / Slider' },
                { icon: 'star-outline' as const,    title: 'Your Edge',       sub: 'Stay on fastball up. Drive the gaps.' },
              ].map((row, i, arr) => (
                <React.Fragment key={row.title}>
                  <Pressable
                    style={({ pressed }) => [s.intelRow, pressed && { opacity: 0.72 }]}
                    onPress={() => showToast('Coming soon — opponent intel', 'info')}
                  >
                    <View style={s.intelIconBox}>
                      <Ionicons name={row.icon} size={16} color={Colors.primary} />
                    </View>
                    <View style={s.intelContent}>
                      <Text style={s.intelTitle}>{row.title}</Text>
                      <Text style={s.intelSub}>{row.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={Colors.textTertiary} />
                  </Pressable>
                  {i < arr.length - 1 && <View style={s.intelDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* ── 4. CONTINUE CAREER CARD ── */}
        {animCard(anim4,
          <Pressable
            style={({ pressed }) => [c.card, pressed && { opacity: 0.95, transform: [{ scale: 0.992 }] }]}
            onPress={handleContinueCareer}
            disabled={loadingLesson || !lesson}
          >
            <View pointerEvents="none" style={c.plateMark} />
            <Image
              pointerEvents="none"
              source={Assets.branding.cMark}
              style={c.heroCMark}
              resizeMode="contain"
            />
            <View style={c.nextRepBadge}>
              <View style={c.greenDot} />
              <Text style={c.nextRepText}>NEXT REP</Text>
            </View>

            {loadingLesson ? (
              <>
                <View style={[c.skeleton, { width: '85%', height: 28, marginTop: 18 }]} />
                <View style={[c.skeleton, { width: '60%', height: 16, marginTop: 8 }]} />
              </>
            ) : (
              <>
                <Text style={c.lessonTitle} numberOfLines={2}>
                  {lesson?.title ?? 'Control the Controllables'}
                </Text>
                <Text style={c.lessonSubtitle} numberOfLines={2}>
                  {heroSubtitle}
                </Text>
              </>
            )}

            <View style={c.edgeNote}>
              <Text style={c.edgeLabel}>TODAY'S EDGE</Text>
              <Text style={c.edgeText} numberOfLines={2}>{edgeLine}</Text>
            </View>

            <View style={c.rankMini}>
              <EmblemBadge rank={currentRank} size="small" />
              <View style={c.rankMiniCopy}>
                <Text style={c.rankMiniText}>{currentRank.name}</Text>
                <Text style={c.rankMiniSub}>{rankProgress.nextRank ? `Next rank: ${rankProgress.nextRank.name}` : 'Elite standard held'}</Text>
              </View>
            </View>

            {!isGameDay && (
              <Pressable
                style={({ pressed }) => [c.ctaBtn, pressed && { opacity: 0.9 }]}
                onPress={handleContinueCareer}
                disabled={loadingLesson || !lesson}
              >
                <Text style={c.ctaBtnText}>Start Next Rep →</Text>
              </Pressable>
            )}
          </Pressable>
        )}

        {/* ── 5. COACH C QUOTE ── */}
        {animCard(anim5,
          <View style={s.quoteCard}>
            <Text style={s.quoteMark}>"</Text>
            <Text style={s.quoteText}>Trust your work.{'\n'}Win the next pitch.</Text>
            <Text style={s.quoteAttrib}>— Coach C</Text>
          </View>
        )}

        {/* ── 6. START GAME PREP CTA (game day only) ── */}
        {isGameDay && (
          <View style={s.gameCtaWrap}>
            <Btn label="START GAME PREP" onPress={handleGameModePress} />
          </View>
        )}

      </ScrollView>

    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingTop: Spacing.sm, gap: Spacing.md },

  // ── Header ──
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
  },
  headerWordmark: { width: 120, height: 28 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warningMuted,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  streakText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.warning,
  },
  // ── Upcoming Game Card ──
  gameCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceGlow,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  sectionLabel: {
    color: Colors.primary,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2.2,
    marginBottom: Spacing.md,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  teamBlock: {
    flex: 1,
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  teamLogoBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opponentLogoBox: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.surfaceGlow,
  },
  teamLogoLetter: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  teamNameLabel: {
    color: Colors.textTertiary,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  vsBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  vsText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  gameDetail: {
    color: Colors.textTertiary,
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  firstPitchLabel: {
    color: Colors.primary,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  countdownUnit: { alignItems: 'center', minWidth: 60 },
  countdownValue: {
    color: Colors.primary,
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
    lineHeight: 48,
  },
  countdownUnitLabel: {
    color: Colors.textTertiary,
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  countdownColon: {
    color: Colors.primary,
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
  },

  // ── Widget row ──
  widgetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
  },
  widget: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  weatherEmoji: { fontSize: 18, lineHeight: 22 },
  widgetMain: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  widgetGreen: { color: Colors.primary },
  widgetSub: {
    color: Colors.textTertiary,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  // ── Opponent Intel ──
  intelSection: { marginHorizontal: Spacing.lg },
  intelHeader: {
    color: Colors.primary,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2.2,
    marginBottom: Spacing.sm,
  },
  intelCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  intelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  intelIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intelContent: { flex: 1 },
  intelTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  intelSub: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    lineHeight: 16,
  },
  intelDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.lg + 32 + Spacing.md,
  },

  // ── Coach C Quote ──
  quoteCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  quoteMark: {
    color: Colors.primary,
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    lineHeight: 44,
    marginBottom: -Spacing.md,
  },
  quoteText: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontStyle: 'italic',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  quoteAttrib: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginTop: Spacing.sm,
  },

  // ── Game Day CTA ──
  gameCtaWrap: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
});

// ─── CONTINUE CAREER CARD STYLES ─────────────────────────────────────────────

const c = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceGlow,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
  },
  plateMark: {
    position: 'absolute',
    right: -14,
    top: 18,
    width: 118,
    height: 118,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    transform: [{ rotate: '45deg' }],
  },
  heroCMark: {
    position: 'absolute',
    right: 12,
    top: 18,
    width: 112,
    height: 112,
    opacity: 0.10,
  },
  nextRepBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  nextRepText: {
    fontSize: 10,
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2.2,
  },
  skeleton: {
    backgroundColor: Colors.borderSubtle,
    borderRadius: Radius.sm,
  },
  lessonTitle: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  lessonSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 7,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  edgeNote: {
    marginTop: 17,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primaryBorder,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.xs,
  },
  edgeLabel: {
    color: Colors.primary,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.4,
    marginBottom: 4,
    opacity: 0.9,
  },
  edgeText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  rankMini: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    opacity: 0.78,
  },
  rankMiniCopy: { gap: 1 },
  rankMiniText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  rankMiniSub: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  ctaBtnText: {
    fontSize: 15,
    color: Colors.background,
    fontFamily: 'Inter_700Bold',
  },
});
