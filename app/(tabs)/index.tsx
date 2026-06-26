import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';
import {
  updateMentalGameScore,
  MentalGameScoreHistory,
  MentalGameScoreDay,
} from '@/lib/mentalGameScore';

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

// ─── SCORE SPARKLINE ─────────────────────────────────────────────────────────

function HomeScoreSparkline({ days, positive }: { days: MentalGameScoreDay[]; positive: boolean }) {
  const [cardWidth, setCardWidth] = useState(0);
  const color = positive ? Colors.primary : Colors.danger;
  const H = 80;
  const PAD = 8;
  const last7 = days.slice(-7);
  const hasData = last7.length >= 2;

  function buildPaths(w: number) {
    const drawH = H - PAD * 2;
    if (!hasData) {
      const y = H / 2;
      return { line: `M 0,${y} L ${w},${y}`, fill: '', dotX: w, dotY: y };
    }
    const scores = last7.map(d => d.score);
    const minS = Math.min(...scores);
    const maxS = Math.max(...scores);
    const span = Math.max(maxS - minS, 1);
    const pts = scores.map((s, i) => ({
      x: (i / (scores.length - 1)) * w,
      y: PAD + drawH - ((s - minS) / span) * drawH,
    }));
    let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const next = pts[i];
      const cpx = (next.x - prev.x) / 3;
      d += ` C ${(prev.x + cpx).toFixed(1)},${prev.y.toFixed(1)} ${(next.x - cpx).toFixed(1)},${next.y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
    }
    const last = pts[pts.length - 1];
    const fill = `${d} L ${last.x.toFixed(1)},${H} L ${pts[0].x.toFixed(1)},${H} Z`;
    return { line: d, fill, dotX: last.x, dotY: last.y };
  }

  const paths = cardWidth > 0 ? buildPaths(cardWidth) : null;

  return (
    <View
      style={{ width: '100%', height: H }}
      onLayout={e => setCardWidth(e.nativeEvent.layout.width)}
    >
      {paths && (
        <Svg width={cardWidth} height={H}>
          <Defs>
            <SvgLinearGradient id="mgs_hm_grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset={0} stopColor={color} stopOpacity="0.25" />
              <Stop offset={1} stopColor={color} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          {paths.fill ? <Path d={paths.fill} fill="url(#mgs_hm_grad)" stroke="none" /> : null}
          <Path
            d={paths.line}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {hasData && (
            <>
              <Circle cx={paths.dotX} cy={paths.dotY} r={8} fill={color} opacity={0.2} />
              <Circle cx={paths.dotX} cy={paths.dotY} r={4} fill={color} />
            </>
          )}
        </Svg>
      )}
    </View>
  );
}

// ─── HOME PILL ────────────────────────────────────────────────────────────────

interface HomePillProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  side: 'left' | 'right';
  topPct: number;
  heroHeight: number;
  onPress: () => void;
  isActive?: boolean;
}

function HomePill({ title, subtitle, icon, side, topPct, heroHeight, onPress, isActive }: HomePillProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 10 }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
  }

  return (
    <Animated.View
      style={[
        hp.container,
        side === 'left' ? { left: '3%' } : { right: '3%' },
        { top: topPct * heroHeight },
        isActive ? { shadowOpacity: 0.5 } : null,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        style={[hp.inner, isActive && hp.innerActive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={hp.iconBox}>
          <Ionicons name={icon} size={16} color={Colors.primary} />
        </View>
        <View style={hp.textBlock}>
          <Text style={hp.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={hp.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
      </Pressable>
    </Animated.View>
  );
}

// ─── WEATHER MODAL ───────────────────────────────────────────────────────────

interface WeatherModalProps {
  visible: boolean;
  onClose: () => void;
  temp: number | null;
  label: string | null;
}

function weatherIcon(label: string | null): keyof typeof Ionicons.glyphMap {
  if (!label || label === 'Unavailable' || label === 'Clear') return 'sunny-outline';
  if (label === 'Partly Cloudy') return 'partly-sunny-outline';
  if (label === 'Foggy') return 'cloud-outline';
  if (label === 'Rainy' || label === 'Showers') return 'rainy-outline';
  if (label === 'Snowy') return 'snow-outline';
  if (label === 'Stormy') return 'thunderstorm-outline';
  return 'sunny-outline';
}

function WeatherModal({ visible, onClose, temp, label }: WeatherModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={wm.overlay} onPress={onClose}>
        <Pressable style={wm.sheet} onPress={e => e.stopPropagation()}>
          <View style={wm.handle} />
          <Ionicons name={weatherIcon(label)} size={64} color={Colors.primary} style={wm.icon} />
          <Text style={wm.temp}>{temp !== null ? `${temp}°` : '—'}</Text>
          <Text style={wm.condition}>{label ?? 'Unavailable'}</Text>
          <Text style={wm.note}>Game day conditions at your location</Text>
          <Pressable style={({ pressed }) => [wm.closeBtn, pressed && { opacity: 0.85 }]} onPress={onClose}>
            <Text style={wm.closeBtnText}>Got It</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const wm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111612',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 32,
    borderTopWidth: 1.5,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textTertiary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  icon: {
    marginBottom: 12,
  },
  temp: {
    fontSize: 72,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 80,
  },
  condition: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
  },
  note: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontFamily: 'Inter_400Regular',
    marginTop: 16,
    marginBottom: 32,
  },
  closeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    color: Colors.background,
    fontFamily: 'Inter_700Bold',
  },
});

// ─── SCREEN ──────────────────────────────────────────────────────────────────

const LAST_ACTIVE_KEY = 'last_active_date';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { athleteState, isLoading, completedTodayCount, updateAthleteState } = useAthlete();
  const [routingResult, setRoutingResult]   = useState<RoutingResult | null>(null);
  const [loadingLesson, setLoadingLesson]   = useState(true);
  const [missions, setMissions]             = useState<MissionsProgress>({ lessonsCompleted: 0, gameModeOpened: false });
  const [isReturn, setIsReturn]             = useState(false);
  const [mgsHistory, setMgsHistory]         = useState<MentalGameScoreHistory | null>(null);
  const [weatherTemp, setWeatherTemp]       = useState<number | null>(null);
  const [weatherLabel, setWeatherLabel]     = useState<string | null>(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

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

  // Weather — live location + Open-Meteo
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('[Weather] permission status:', status);
        if (status !== 'granted') { setWeatherLabel('Unavailable'); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
        console.log('[Weather] coords:', loc.coords.latitude, loc.coords.longitude);
        const { latitude: lat, longitude: lon } = loc.coords;
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`
        );
        const data = await res.json();
        console.log('[Weather] raw response:', JSON.stringify(data));
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode as number;
        let label = 'Clear';
        if (code >= 1 && code <= 3)   label = 'Partly Cloudy';
        else if (code >= 45 && code <= 48) label = 'Foggy';
        else if (code >= 51 && code <= 67) label = 'Rainy';
        else if (code >= 71 && code <= 77) label = 'Snowy';
        else if (code >= 80 && code <= 82) label = 'Showers';
        else if (code === 95)              label = 'Stormy';
        setWeatherTemp(temp);
        setWeatherLabel(label);
      } catch (err) {
        console.log('[Weather] error:', err);
        setWeatherLabel('Unavailable');
      }
    })();
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

  // Mental Game Score — recompute when rep count or streak changes
  useEffect(() => {
    if (!athleteState) return;
    const playbookBuilt = !!(athleteState as any)?.playbook?.built_at;
    updateMentalGameScore({
      repsCompletedToday: completedTodayCount,
      cuesSavedToday: playbookBuilt ? 1 : 0,
      streakActiveToday: (athleteState.streak_count ?? 0) > 0,
    })
      .then(setMgsHistory)
      .catch(() => {});
  }, [completedTodayCount, athleteState?.streak_count]);

  // DEV ONLY: seed 7 days of sample history so the sparkline curve is visible during development
  useEffect(() => {
    if (!__DEV__ || !mgsHistory || mgsHistory.days.length >= 3) return;
    const today = new Date();
    const seedScores = [58, 59, 60, 59, 61, 62, 63];
    setMgsHistory(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        days: seedScores.map((score, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() - (6 - i));
          return {
            date: d.toISOString().slice(0, 10),
            score,
            delta: i === 0 ? 0 : score - seedScores[i - 1],
            reps_completed: 1,
            cues_saved: 0,
            streak_active: true,
          };
        }),
      };
    });
  }, [mgsHistory?.days.length]);

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

  const mgsToday      = mgsHistory?.days[mgsHistory.days.length - 1];
  const mgsScore      = mgsToday?.score ?? 60;
  const mgsDelta      = mgsToday?.delta ?? 0;
  const mgsIsPositive = mgsDelta >= 0;

  // Hero pill computed subtitles
  const heroHeight      = screenHeight * 0.50;
  const edgeSubtitle    = ((athleteState as any)?.playbook?.focus ?? '').slice(0, 20) || 'Stay locked';
  const nextRepSubtitle = (routingResult?.lesson?.title ?? '').slice(0, 20) || 'Load next rep';

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

      {/* ── FULL-SCREEN BACKGROUND ── */}
      <ImageBackground
        source={Assets.backgrounds.homeStadiumWalk}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.20)', 'rgba(0,0,0,0.10)', 'rgba(0,0,0,0.75)', '#050806']}
        locations={[0, 0.35, 0.70, 1.0]}
        style={StyleSheet.absoluteFill}
      />

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
        scrollEnabled={false}
      >

        {/* ── 1. HERO AREA WITH PILLS ── */}
        <Animated.View style={[s.heroArea, { height: heroHeight, opacity: anim1 }]}>

          {/* Left pills */}
          <HomePill
            title="Upcoming Game"
            subtitle="TODAY · 7:00 PM"
            icon="calendar-outline"
            side="left"
            topPct={0.06}
            heroHeight={heroHeight}
            onPress={() => showToast('Coming soon — schedule', 'info')}
          />
          <HomePill
            title="Weather"
            subtitle={weatherTemp !== null && weatherLabel !== null ? `${weatherTemp}° · ${weatherLabel}` : weatherLabel === 'Unavailable' ? 'Unavailable' : 'Checking...'}
            icon="sunny-outline"
            side="left"
            topPct={0.22}
            heroHeight={heroHeight}
            onPress={() => setShowWeatherModal(true)}
          />
          <HomePill
            title="Readiness"
            subtitle={`MGS · ${mgsScore}`}
            icon="checkmark-circle-outline"
            side="left"
            topPct={0.38}
            heroHeight={heroHeight}
            onPress={() => showToast('Coming soon — readiness check', 'info')}
          />
          <HomePill
            title="Opponent Intel"
            subtitle="Aggressive early."
            icon="locate-outline"
            side="left"
            topPct={0.54}
            heroHeight={heroHeight}
            onPress={() => showToast('Coming soon — opponent intel', 'info')}
          />
          <HomePill
            title="Key Pitcher"
            subtitle="RHP · 88–90 MPH"
            icon="baseball-outline"
            side="left"
            topPct={0.70}
            heroHeight={heroHeight}
            onPress={() => showToast('Coming soon — opponent intel', 'info')}
          />

          {/* Right pills */}
          <HomePill
            title="Locker"
            subtitle="Open Locker"
            icon="book-outline"
            side="right"
            topPct={0.06}
            heroHeight={heroHeight}
            onPress={() => router.push('/(tabs)/locker')}
          />
          <HomePill
            title="Weight Room"
            subtitle="Strength · Power"
            icon="barbell-outline"
            side="right"
            topPct={0.22}
            heroHeight={heroHeight}
            onPress={() => showToast('Coming soon — strength tools', 'info')}
          />
          <HomePill
            title="Film Room"
            subtitle="Game Prep"
            icon="film-outline"
            side="right"
            topPct={0.38}
            heroHeight={heroHeight}
            onPress={handleGameModePress}
          />
          <HomePill
            title="Your Edge"
            subtitle={edgeSubtitle}
            icon="star-outline"
            side="right"
            topPct={0.54}
            heroHeight={heroHeight}
            onPress={() => {
              if ((athleteState as any)?.playbook?.built_at) {
                router.push('/(tabs)/locker');
              } else {
                showToast('Build your playbook in a lesson', 'info');
              }
            }}
          />
          <HomePill
            title="Start Next Rep"
            subtitle={nextRepSubtitle}
            icon="play-circle-outline"
            side="right"
            topPct={0.70}
            heroHeight={heroHeight}
            onPress={handleContinueCareer}
            isActive
          />
        </Animated.View>

        {/* ── 2. CONTINUE CAREER CARD ── */}
        {animCard(anim2,
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
              <Text style={c.lessonTitle} numberOfLines={2}>
                {lesson?.title ?? 'Control the Controllables'}
              </Text>
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

        {/* ── 3. COACH C QUOTE ── */}
        {animCard(anim3,
          <View style={s.quoteCard}>
            <Text style={s.quoteText}>Trust your work.{'\n'}Win the next pitch.</Text>
            <Text style={s.quoteAttrib}>— Coach C</Text>
          </View>
        )}

        {/* ── 5. START GAME PREP CTA (game day only) ── */}
        {isGameDay && (
          <View style={s.gameCtaWrap}>
            <Btn label="START GAME PREP" onPress={handleGameModePress} />
          </View>
        )}

      </ScrollView>

      <WeatherModal
        visible={showWeatherModal}
        onClose={() => setShowWeatherModal(false)}
        temp={weatherTemp}
        label={weatherLabel}
      />

    </View>
  );
}

// ─── HOME PILL STYLES ─────────────────────────────────────────────────────────

const hp = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '44%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.20,
    shadowRadius: 14,
    elevation: 5,
  },
  inner: {
    backgroundColor: 'rgba(8,12,10,0.88)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  innerActive: {
    borderColor: Colors.primary,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '18',
    borderColor: Colors.primary + '60',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
});

// ─── SCREEN STYLES ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingTop: 0, gap: Spacing.sm },

  // ── Hero area ──
  heroArea: {
    position: 'relative',
  },

  // ── Header ──
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
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

  // ── Mental Game Score ──
  mgsSection: { marginHorizontal: Spacing.lg },
  mgsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  mgsKicker: {
    color: Colors.primary,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2.2,
    marginBottom: 4,
  },
  mgsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mgsScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  mgsScoreNum: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 52,
  },
  mgsDeltaPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  mgsDeltaPos: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primaryBorder,
  },
  mgsDeltaNeg: {
    backgroundColor: Colors.danger + '12',
    borderColor: Colors.danger + '30',
  },
  mgsDeltaText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  mgsSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },

  // ── Coach C Quote ──
  quoteCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
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
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontStyle: 'italic',
    lineHeight: 22,
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
    padding: Spacing.md,
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
    marginBottom: Spacing.xs,
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
    fontSize: 22,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    lineHeight: 28,
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
    marginTop: Spacing.sm,
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
    marginTop: Spacing.xs,
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
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  ctaBtnText: {
    fontSize: 15,
    color: Colors.background,
    fontFamily: 'Inter_700Bold',
  },
});
