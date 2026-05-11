import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
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
import { fetchLessons } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { pickNextLesson, type RoutingResult } from '@/lib/lessonRouter';
import { SkeletonBox, SkeletonCard } from '@/components/SkeletonLoader';
import { EmblemBadge } from '@/components/EmblemBadge';
import { getCurrentRank } from '@/lib/progressionRanks';

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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, isLoading, completedTodayCount, updateAthleteState } = useAthlete();
  const [routingResult, setRoutingResult]   = useState<RoutingResult | null>(null);
  const [loadingLesson, setLoadingLesson]   = useState(true);
  const [missions, setMissions]             = useState<MissionsProgress>({ lessonsCompleted: 0, gameModeOpened: false });

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
  const streak   = athleteState?.streak_count ?? 0;

  if (isLoading || !athleteState) {
    return (
      <View style={s.container}>
        <View style={[s.topHeader, { paddingTop: insets.top + 14 }]}>
          <Text style={s.brandText}>CLUTCHR</Text>
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
  const whyThisRep    = reason || 'Build command and tempo before the game speeds up.';

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
        <Text style={s.brandText}>CLUTCHR</Text>
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

        {/* ── NEXT REP HERO ── */}
        {animCard(anim1,
          <Pressable
            style={({ pressed }) => [c.card, pressed && { opacity: 0.95, transform: [{ scale: 0.992 }] }]}
            onPress={handleContinueCareer}
            disabled={loadingLesson || !lesson}
          >
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

            <View style={c.metaRow}>
              <View style={c.metaChips}>
                <Text style={c.metaChip}>{phaseLabel}</Text>
                <Text style={c.metaChip}>{roleLabel}</Text>
              </View>
              <View style={c.rankMini}>
                <EmblemBadge rank={currentRank} size="small" />
                <Text style={c.rankMiniText}>{currentRank.name}</Text>
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

        <View style={s.whyCard}>
          <Text style={s.whyLabel}>WHY THIS REP</Text>
          <Text style={s.whyText}>{whyThisRep}</Text>
        </View>

        {/* ── DAILY WORK ── */}
        {animCard(anim2,
          <View style={s.missionsWrap}>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionHeader}>DAILY WORK</Text>
            </View>

            <View style={m.grid}>
              <View style={[m.compactCard, mission1Done && m.compactCardDone]}>
                <View style={m.compactTop}>
                  <Ionicons name="book" size={14} color={mission1Done ? '#22CC5E' : 'rgba(255,255,255,0.42)'} />
                  <Text style={[m.progress, mission1Done && { color: '#22CC5E' }]}>{mission1Progress}/2</Text>
                </View>
                <Text style={m.title}>Finish 2 reps</Text>
                <Text style={m.xp}>+30 XP</Text>
              </View>

              <View style={[m.compactCard, mission2Done && m.compactCardDone]}>
                <View style={m.compactTop}>
                  <Ionicons name="flash" size={14} color={mission2Done ? '#22CC5E' : '#C58A2A'} />
                  <Text style={[m.progress, mission2Done && { color: '#22CC5E' }]}>{mission2Progress}/1</Text>
                </View>
                <Text style={m.title}>Run 1 reset</Text>
                <Text style={m.xp}>+15 XP</Text>
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
              <Ionicons name="flash" size={22} color="#F5A623" style={s.shortcutIcon} />
              <Text style={s.shortcutTitle}>GAME MODE</Text>
              <Text style={s.shortcutSub}>Pre · In · Post</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.shortcutCard, pressed && { opacity: 0.82 }]}
              onPress={() => router.push('/(tabs)/locker')}
            >
              <Ionicons name="library" size={22} color="#22CC5E" style={s.shortcutIcon} />
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
  scroll: { paddingTop: 18 },
  topHeader: {
    paddingHorizontal: 22,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
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
  whyCard: {
    marginHorizontal: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#0D100E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  whyLabel: {
    color: 'rgba(255,255,255,0.36)',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  whyText: {
    color: 'rgba(247,255,249,0.78)',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  missionsWrap: {
    paddingHorizontal: 16,
    marginBottom: 22,
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
  shortcutsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 18,
  },
  shortcutCard: {
    flex: 1,
    minHeight: 110,
    backgroundColor: '#0D100E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: 16,
    justifyContent: 'flex-end',
  },
  shortcutIcon: { marginBottom: 14 },
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
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#0B150D',
    borderWidth: 1,
    borderColor: 'rgba(35,209,96,0.28)',
    borderRadius: 24,
    padding: 22,
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
  metaRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaChips: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  metaChip: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: 'rgba(247,255,249,0.68)',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  rankMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.78,
  },
  rankMiniText: {
    color: 'rgba(247,255,249,0.64)',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
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

// ─── MISSION ROW STYLES ───────────────────────────────────────────────────────

const m = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  compactCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 16,
    padding: 13,
    backgroundColor: '#101110',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  compactCardDone: {
    backgroundColor: 'rgba(35,209,96,0.08)',
    borderColor: 'rgba(35,209,96,0.18)',
  },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    color: '#F7FFF9',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 3,
  },
  xp: {
    fontSize: 11,
    color: 'rgba(35,209,96,0.72)',
    fontFamily: 'Inter_600SemiBold',
  },
  progress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.46)',
    fontFamily: 'Inter_700Bold',
  },
});
