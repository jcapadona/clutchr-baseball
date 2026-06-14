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
import { Colors } from '@/constants/theme';
import { pickNextLesson, type RoutingResult } from '@/lib/lessonRouter';
import { SkeletonBox, SkeletonCard } from '@/components/SkeletonLoader';
import { EmblemBadge } from '@/components/EmblemBadge';
import { getCurrentRank, getRankProgress } from '@/lib/progressionRanks';
import { useMicrocopy } from '@/hooks/useMicrocopy';

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
  // TODO: wire isGameDay from AthleteState or schedule data (added during game-mode prompt)
  const isGameDay = false;
  const greetingRef = useRef<string | null>(null);

  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(70, [
      Animated.spring(anim1, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.spring(anim2, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
      Animated.spring(anim3, { toValue: 1, tension: 80, friction: 11, useNativeDriver: true }),
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

  const totalXp  = athleteState?.total_xp ?? 0;
  const currentRank = getCurrentRank(totalXp);
  const rankProgress = getRankProgress(totalXp);
  const streak   = athleteState?.streak_count ?? 0;

  if (isLoading || !athleteState) {
    return (
      <View style={s.container}>
        <View style={[s.topHeader, { paddingTop: insets.top + 14 }]}>
          <Image
            source={require('../../assets/branding/main-wordmark.png')}
            style={s.headerWordmark}
            resizeMode="contain"
          />
          <View style={s.navRight}>
            <View style={s.statPill}>
              <Ionicons name="flame" size={12} color="#C58A2A" />
              <Text style={s.pillStat}>0</Text>
            </View>
            <View style={s.statPill}>
              <Ionicons name="flash" size={12} color="#C58A2A" />
              <Text style={s.pillStat}>0</Text>
            </View>
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

  const roleLabel = athleteState.primary_role
    ? athleteState.primary_role.charAt(0).toUpperCase() + athleteState.primary_role.slice(1)
    : 'Player';
  const phaseLabel = formatLabel(athleteState.season_phase) || 'Train';
  const lesson        = routingResult?.lesson ?? null;
  const reason        = routingResult?.reason ?? '';
  const heroSubtitle  = lesson?.subtitle || 'Command, tempo, and mound IQ.';
  const firstName     = athleteState.first_name?.trim();
  // Compute greeting once per mount via ref so re-renders don't re-pick
  if (greetingRef.current === null) {
    greetingRef.current = microcopy.useHomeGreeting({ isGameDay, isReturn });
  }
  const planTitle     = greetingRef.current;
  const planSubtitle  = firstName ? `${firstName} · ${phaseLabel} · ${roleLabel}` : `${phaseLabel} · ${roleLabel} · Next rep loaded`;
  const edgeLine      = reason && reason.length <= 82 ? reason : 'Build command and tempo before the game speeds up.';
  const repsProgressPercent = `${(mission1Progress / 2) * 100}%`;
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

      {/* ── CLEAN COMMAND HEADER ── */}
      <View style={[s.topHeader, { paddingTop: insets.top + 14 }]}>
        <Image
          source={require('../../assets/branding/main-wordmark.png')}
          style={s.headerWordmark}
          resizeMode="contain"
        />
        <View style={s.navRight}>
          <View style={s.statPill}>
            <Ionicons name="flame" size={12} color="#C58A2A" />
            <Text style={s.pillStat}>{streak}</Text>
          </View>
          <View style={s.statPill}>
            <Ionicons name="flash" size={12} color="#C58A2A" />
            <Text style={s.pillStat}>{totalXp}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >

        <View style={s.planIntro}>
          <Text style={s.planTitle}>{planTitle}</Text>
          <Text style={s.planSubtitle}>{planSubtitle}</Text>
        </View>

        {/* ── NEXT REP HERO ── */}
        {animCard(anim1,
          <Pressable
            style={({ pressed }) => [c.card, pressed && { opacity: 0.95, transform: [{ scale: 0.992 }] }]}
            onPress={handleContinueCareer}
            disabled={loadingLesson || !lesson}
          >
            <View pointerEvents="none" style={c.plateMark} />
            <Image
              pointerEvents="none"
              source={require('../../assets/branding/c-mark.png')}
              style={c.heroCMark}
              resizeMode="contain"
            />
            <View pointerEvents="none" style={c.ctaGlow} />
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

            <Pressable
              style={({ pressed }) => [c.ctaBtn, pressed && { opacity: 0.9 }]}
              onPress={handleContinueCareer}
              disabled={loadingLesson || !lesson}
            >
              <Text style={c.ctaBtnText}>Start Next Rep →</Text>
            </Pressable>
          </Pressable>
        )}


        {/* ── TODAY'S PROGRESS ── */}
        {animCard(anim2,
          <View style={s.progressWrap}>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionHeader}>TODAY'S PROGRESS</Text>
              <Text style={s.progressSummary}>+{earnedMissionXp} XP</Text>
            </View>

            <View style={s.progressPanel}>
              <View style={s.progressLineRow}>
                <View style={s.progressCopy}>
                  <Text style={s.progressLabel}>Reps complete</Text>
                  <Text style={s.progressValue}>{mission1Progress}/2</Text>
                </View>
                <View style={s.miniTrack}>
                  <View style={[s.miniFill, { width: repsProgressPercent }]} />
                </View>
              </View>
              <View style={s.progressDivider} />
              <View style={s.progressLineRow}>
                <View style={s.progressCopy}>
                  <Text style={s.progressLabel}>Run 1 reset</Text>
                  <Text style={s.progressValue}>{mission2Progress}/1</Text>
                </View>
                <View style={s.miniTrack}>
                  <View style={[s.miniFill, { width: resetProgressPercent, backgroundColor: mission2Done ? '#22CC5E' : '#C58A2A' }]} />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── SHORTCUTS ── */}
        {animCard(anim3,
          <View style={s.shortcutsRow}>
            <Pressable
              style={({ pressed }) => [s.shortcutCard, pressed && { opacity: 0.82 }]}
              onPress={handleGameModePress}
            >
              <View style={s.shortcutTopRow}>
                <Ionicons name="flash" size={22} color="#F5A623" style={s.shortcutIcon} />
                <Ionicons name="chevron-forward" size={16} color="rgba(247,255,249,0.42)" />
              </View>
              <Text style={s.shortcutTitle}>GAME MODE</Text>
              <Text style={s.shortcutSub}>Pre · In · Post</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.shortcutCard, pressed && { opacity: 0.82 }]}
              onPress={() => router.push('/(tabs)/locker')}
            >
              <View style={s.shortcutTopRow}>
                <Image
                  source={require('../../assets/branding/simplified-wordmark.png')}
                  style={s.shortcutWordmark}
                  resizeMode="contain"
                />
                <Ionicons name="chevron-forward" size={16} color="rgba(247,255,249,0.42)" />
              </View>
              <Text style={s.shortcutTitle}>LOCKER</Text>
              <Text style={s.shortcutSub}>Articles · Tools</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>

    </View>
  );
}

// ─── MAIN STYLES ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingTop: 10 },
  topHeader: {
    paddingHorizontal: 22,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
  },
  headerWordmark: {
    width: 132,
    height: 34,
  },
  brandText: {
    color: '#F7FFF9',
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 4,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  pillStat: {
    color: 'rgba(247,255,249,0.88)',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  planIntro: {
    marginHorizontal: 18,
    marginBottom: 16,
  },
  planTitle: {
    color: '#F7FFF9',
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.6,
    lineHeight: 35,
  },
  planSubtitle: {
    marginTop: 5,
    color: 'rgba(247,255,249,0.52)',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  progressWrap: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.34)',
    letterSpacing: 2,
    fontFamily: 'Inter_700Bold',
  },
  progressSummary: {
    color: 'rgba(197,138,42,0.86)',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  progressPanel: {
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 13,
    backgroundColor: '#0D100E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.065)',
  },
  progressLineRow: {
    gap: 8,
  },
  progressCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: 'rgba(247,255,249,0.68)',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  progressValue: {
    color: '#F7FFF9',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  miniTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  miniFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#22CC5E',
  },
  progressDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.055)',
    marginVertical: 12,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 18,
  },
  shortcutCard: {
    flex: 1,
    minHeight: 116,
    backgroundColor: '#0D100E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
  },
  shortcutTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shortcutIcon: { marginBottom: 10 },
  shortcutWordmark: {
    width: 88,
    height: 26,
    marginBottom: 8,
  },
  shortcutTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#F7FFF9',
    marginBottom: 5,
  },
  shortcutSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.42)',
    fontFamily: 'Inter_400Regular',
  },
});

// ─── CONTINUE CAREER CARD STYLES ─────────────────────────────────────────────

const c = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: '#0B150D',
    borderWidth: 1,
    borderColor: 'rgba(35,209,96,0.24)',
    borderRadius: 26,
    padding: 22,
  },
  plateMark: {
    position: 'absolute',
    right: -14,
    top: 18,
    width: 118,
    height: 118,
    borderWidth: 1,
    borderColor: 'rgba(247,255,249,0.055)',
    transform: [{ rotate: '45deg' }],
  },
  heroCMark: {
    position: 'absolute',
    right: 12,
    top: 18,
    width: 112,
    height: 112,
    opacity: 0.12,
  },
  ctaGlow: {
    position: 'absolute',
    left: 26,
    right: 26,
    bottom: 18,
    height: 54,
    borderRadius: 24,
    backgroundColor: 'rgba(35,209,96,0.12)',
  },
  nextRepBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22CC5E',
  },
  nextRepText: {
    fontSize: 10,
    color: '#22CC5E',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2.2,
  },
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
  },
  lessonTitle: {
    fontSize: 28,
    color: '#F7FFF9',
    fontFamily: 'Inter_700Bold',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  lessonSubtitle: {
    fontSize: 14,
    color: 'rgba(247,255,249,0.56)',
    marginTop: 7,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  edgeNote: {
    marginTop: 17,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(35,209,96,0.52)',
    paddingLeft: 10,
    paddingRight: 4,
  },
  edgeLabel: {
    color: 'rgba(35,209,96,0.9)',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  edgeText: {
    color: 'rgba(247,255,249,0.70)',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  rankMini: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 18,
    opacity: 0.78,
  },
  rankMiniCopy: { gap: 1 },
  rankMiniText: {
    color: 'rgba(247,255,249,0.68)',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  rankMiniSub: {
    color: 'rgba(247,255,249,0.38)',
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  ctaBtn: {
    backgroundColor: '#22CC5E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 22,
  },
  ctaBtnText: {
    fontSize: 15,
    color: '#050806',
    fontFamily: 'Inter_700Bold',
  },
});
