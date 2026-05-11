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
import ToolShelfModal from '@/components/ToolShelfModal';
import { pickNextLesson, type RoutingResult } from '@/lib/lessonRouter';
import { getBestCue } from '@/lib/personalCue';
import { SkeletonBox, SkeletonCard } from '@/components/SkeletonLoader';
import { ClutchrHeader } from '@/components/ClutchrHeader';
import { EmblemBadge } from '@/components/EmblemBadge';
import { getCurrentRank, getRankProgressPercent } from '@/lib/progressionRanks';

const MISSIONS_DATE_KEY  = 'missions_date';
const MISSIONS_PROG_KEY  = 'missions_progress';

interface MissionsProgress {
  lessonsCompleted: number;
  gameModeOpened: boolean;
}

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, isLoading, completedTodayCount, updateAthleteState } = useAthlete();
  const [toolShelfOpen, setToolShelfOpen]   = useState(false);
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
  const focusCue = getBestCue(athleteState, 'focus');

  if (isLoading || !athleteState) {
    return (
      <View style={s.container}>
        <ClutchrHeader
          variant="home"
          kicker="CLUTCHR BASEBALL"
          title="Your Next Rep"
          subtitle="Train. Track. Clutch."
          statusPill="LOADING"
          progress={0}
          style={{ paddingTop: insets.top + 12 }}
          rightAction={
            <View style={s.navRight}>
              <View style={s.streakPill}>
                <Ionicons name="flame" size={13} color="#F5A623" />
                <Text style={s.pillStat}>0</Text>
              </View>
              <View style={s.xpPillNav}>
                <Ionicons name="flash" size={13} color="#F5A623" />
                <Text style={s.pillStat}>0</Text>
              </View>
            </View>
          }
        />
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

  const rankProgressPercent = getRankProgressPercent(totalXp);

  const roleLabel = athleteState.primary_role
    ? athleteState.primary_role.charAt(0).toUpperCase() + athleteState.primary_role.slice(1)
    : 'Player';
  const phaseLabel = athleteState.season_phase
    ? athleteState.season_phase.replace(/_/g, ' ').replace(/\w/g, (char) => char.toUpperCase())
    : 'Train';
  const lesson        = routingResult?.lesson ?? null;
  const reason        = routingResult?.reason ?? '';

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

      {/* ── COMMAND HEADER ── */}
      <ClutchrHeader
        variant="home"
        kicker="CLUTCHR BASEBALL"
        title="Your Next Rep"
        subtitle={`${phaseLabel} · ${roleLabel}`}
        statusPill={currentRank.shortLabel}
        progress={rankProgressPercent}
        style={{ paddingTop: insets.top + 12 }}
        rightAction={
          <View style={s.navRight}>
            <View style={[s.rankChip, { borderColor: currentRank.borderColor }]}>
              <EmblemBadge rank={currentRank} size="small" />
              <Text style={[s.rankChipText, { color: currentRank.primaryColor }]}>{currentRank.name}</Text>
            </View>
            <View style={s.streakPill}>
              <Ionicons name="flame" size={13} color="#F5A623" />
              <Text style={s.pillStat}>{streak}</Text>
            </View>
            <View style={s.xpPillNav}>
              <Ionicons name="flash" size={13} color="#F5A623" />
              <Text style={s.pillStat}>{totalXp}</Text>
            </View>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── CONTINUE CAREER CARD ── */}
        {animCard(anim1,
          <Pressable
            style={({ pressed }) => [c.card, pressed && { opacity: 0.93, transform: [{ scale: 0.985 }] }]}
            onPress={handleContinueCareer}
            disabled={loadingLesson || !lesson}
          >
            <View style={c.topRow}>
              <View style={c.nextRepBadge}>
                <View style={c.greenDot} />
                <Text style={c.nextRepText}>NEXT REP</Text>
              </View>
              <Pressable
                style={c.playBtn}
                onPress={handleContinueCareer}
                disabled={loadingLesson || !lesson}
                hitSlop={8}
              >
                <Ionicons name="play" size={16} color="#000" />
              </Pressable>
            </View>

            {loadingLesson ? (
              <>
                <View style={[c.skeleton, { width: '85%', height: 28, marginTop: 10 }]} />
                <View style={[c.skeleton, { width: '60%', height: 16, marginTop: 8 }]} />
              </>
            ) : (
              <>
                <Text style={c.lessonTitle} numberOfLines={2}>
                  {lesson?.title ?? 'Control the Controllables'}
                </Text>
                <Text style={c.lessonSubtitle} numberOfLines={2}>
                  {reason || lesson?.subtitle || 'Your next rep is ready.'}
                </Text>
              </>
            )}

            <Pressable
              style={({ pressed }) => [c.ctaBtn, pressed && { opacity: 0.88 }]}
              onPress={handleContinueCareer}
              disabled={loadingLesson || !lesson}
            >
              <Text style={c.ctaBtnText}>Start Next Rep →</Text>
            </Pressable>
          </Pressable>
        )}

        <View style={s.todayCueCard}>
          <Text style={{ color: '#22CC5E', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>TODAY'S CUE</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>{focusCue}</Text>
        </View>

        {/* ── DAILY MISSIONS ── */}
        {animCard(anim2,
          <View style={s.missionsWrap}>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionHeader}>DAILY WORK</Text>
              {/* No "View all" until a dedicated missions screen exists */}
            </View>

            {/* Complete 2 lessons */}
            <View style={[m.row, mission1Done && { backgroundColor: '#0F2410' }]}>
              <View style={[m.iconBox, { backgroundColor: 'rgba(34,204,94,0.10)' }]}>
                <Ionicons name="book" size={16} color="#22CC5E" />
              </View>
              <View style={m.info}>
                <Text style={m.title}>Finish 2 reps</Text>
                <Text style={m.xp}>+30 XP</Text>
              </View>
              <View style={m.right}>
                <Text style={[m.progress, mission1Done && { color: '#22CC5E' }]}>{mission1Progress}/2</Text>
                <Text style={m.tag}>{mission1Done ? 'COMPLETE ✓' : 'IN PROGRESS'}</Text>
              </View>
            </View>

            {/* Run a Game Mode tool */}
            <View style={[m.row, mission2Done && { backgroundColor: '#0F2410' }]}>
              <View style={[m.iconBox, { backgroundColor: 'rgba(245,166,35,0.10)' }]}>
                <Ionicons name="flash" size={16} color="#F5A623" />
              </View>
              <View style={m.info}>
                <Text style={m.title}>Run 1 reset</Text>
                <Text style={m.xp}>+15 XP</Text>
              </View>
              <View style={m.right}>
                <Text style={[m.progress, mission2Done && { color: '#22CC5E' }]}>{mission2Progress}/1</Text>
                <Text style={m.tag}>{mission2Done ? 'COMPLETE ✓' : 'IN PROGRESS'}</Text>
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
              <Text style={s.shortcutSub}>Reset tools</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.shortcutCard, pressed && { opacity: 0.82 }]}
              onPress={() => router.push('/(tabs)/locker')}
            >
              <Ionicons name="library" size={22} color="#22CC5E" style={s.shortcutIcon} />
              <Text style={s.shortcutTitle}>LOCKER</Text>
              <Text style={s.shortcutSub}>Playbook · gear</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>

      {/* FAB */}
      <Pressable
        style={[s.fab, { bottom: insets.bottom + 72 }]}
        onPress={() => setToolShelfOpen(true)}
      >
        <Ionicons name="flash" size={15} color="#000" />
        <Text style={s.fabText}>TOOLS</Text>
      </Pressable>

      <ToolShelfModal visible={toolShelfOpen} onClose={() => setToolShelfOpen(false)} />
    </View>
  );
}

// ─── MAIN STYLES ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll:    { paddingTop: 8 },

  // Branded nav bar
  navBar: {
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakPill: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  xpPillNav: {
    backgroundColor: '#1A1200',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillStat: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  rankChip: {
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#111612',
    paddingLeft: 2,
    paddingRight: 9,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rankChipText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },

  // XP progress line
  xpLine: {
    height: 2,
    backgroundColor: '#22CC5E',
  },

  // Greeting
  goodWork: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginTop: 16,
    marginLeft: 16,
  },
  missionControl: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: 'Inter_700Bold',
    marginLeft: 16,
    marginBottom: 4,
  },
  todayCueCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#22CC5E33',
    backgroundColor: '#0F1612',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  // Missions
  missionsWrap: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  viewAll: {
    fontSize: 12,
    color: '#22CC5E',
    fontFamily: 'Inter_600SemiBold',
  },

  // Shortcuts
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 6,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#101412',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
  },
  shortcutIcon: {
    marginBottom: 8,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    marginBottom: 3,
  },
  shortcutSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_400Regular',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 18,
    backgroundColor: '#22CC5E',
    shadowColor: '#22CC5E',
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

// ─── CONTINUE CAREER CARD STYLES ─────────────────────────────────────────────

const c = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    backgroundColor: '#0D1A0E',
    borderWidth: 1.5,
    borderColor: '#22CC5E66',
    borderRadius: 18,
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextRepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Inter_700Bold',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22CC5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
    fontFamily: 'Inter_700Bold',
    lineHeight: 30,
  },
  lessonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  ctaBtn: {
    backgroundColor: '#22CC5E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    fontFamily: 'Inter_700Bold',
  },
});

// ─── MISSION ROW STYLES ───────────────────────────────────────────────────────

const m = StyleSheet.create({
  row: {
    backgroundColor: '#111111',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  xp: {
    fontSize: 11,
    color: '#22CC5E',
    fontFamily: 'Inter_600SemiBold',
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  progress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_400Regular',
  },
  tag: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 1,
    fontFamily: 'Inter_700Bold',
  },
});
