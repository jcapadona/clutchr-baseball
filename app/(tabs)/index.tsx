import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAthlete } from '@/context/AthleteContext';
import { fetchLessons, fetchContentCards, type ContentCard } from '@/lib/supabase';
import { useProContext } from '@/context/ProContext';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import {
  CategoryColor, DisplayCard, DisplayFont, DisplayCardSm, DisplayStat, TopHighlight,
} from '@/constants/visualExtensions';
import { Assets } from '@/constants/assets';
import { pickNextLesson, type RoutingResult } from '@/lib/lessonRouter';
import { SkeletonBox, SkeletonCard } from '@/components/SkeletonLoader';
import { EmblemBadge } from '@/components/EmblemBadge';
import { getCurrentRank, getRankProgress } from '@/lib/progressionRanks';
import {
  ChamferPanel, CoachTake, Eyebrow, ProgressBar, PrimaryButton,
  ScreenHeader, Skeleton, StrokeIcon, type StrokeIconName,
} from '@/components/ui/ClutchrUI';
import { useToast } from '@/components/Toast';
import { updateMentalGameScore } from '@/lib/mentalGameScore';

const HOME_TEXT = '#F2F5F3';
const HOME_TEXT3 = '#6E7873';
const TILE_SURFACE = '#0D110F';

const MISSIONS_DATE_KEY = 'missions_date';
const MISSIONS_PROG_KEY = 'missions_progress';
const LAST_ACTIVE_KEY = 'last_active_date';

// Flip to true once the Baseball IQ runner ships; the tile then routes to /biq.
const BIQ_RUNNER_READY = false;
const BIQ_LESSONS_TO_UNLOCK = 3;

// true = visible. All hidden for v1; the code behind each flag is kept intact for v1.1.
const HOME_FLAGS = {
  upcomingGame: false,
  opponentIntel: false,
  weightRoom: false,
  readiness: false,
  bell: false,
  calendar: false,
};

interface MissionsProgress {
  lessonsCompleted: number;
  gameModeOpened: boolean;
}

// ─── LOCAL ICONS (24-grid, 2px stroke) ───────────────────────────────────────

const LOCAL_ICON_PATHS = {
  film: 'M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13ZM8 4v16M16 4v16M4 9h4M4 15h4M16 9h4M16 15h4',
  dumbbell: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
} as const;

type LocalIconName = keyof typeof LOCAL_ICON_PATHS;
type TileIconName = StrokeIconName | LocalIconName;

function isLocalIcon(name: TileIconName): name is LocalIconName {
  return name in LOCAL_ICON_PATHS;
}

function TileIcon({ name, size, color }: { name: TileIconName; size: number; color: string }) {
  if (!isLocalIcon(name)) return <StrokeIcon name={name} size={size} color={color} />;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={LOCAL_ICON_PATHS[name]}
        stroke={color} strokeWidth={2} fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── REVEAL (mount-only entrance) ────────────────────────────────────────────

function Reveal({ index, children }: { index: number; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let anim: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(reduce => {
        if (cancelled) return;
        if (reduce) { v.setValue(1); return; }
        anim = Animated.timing(v, {
          toValue: 1, duration: 260, delay: index * 60,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        });
        anim.start();
      })
      .catch(() => { if (!cancelled) v.setValue(1); });
    return () => { cancelled = true; anim?.stop(); };
  }, [v, index]);

  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

// ─── PULSING DOT ─────────────────────────────────────────────────────────────

function PulseDot() {
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 0.35, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(o, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [o]);
  return <Animated.View style={[st.dot, { opacity: o }]} />;
}

// ─── UPCOMING GAME COUNTDOWN ─────────────────────────────────────────────────

interface NextGame {
  startsAt: Date;
  opponent?: string | null;
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function describeGame(game: NextGame, now: Date): { value: string; sub: string } {
  const start = game.startsAt;
  const dayDiff = Math.round((startOfDay(start) - startOfDay(now)) / 86400000);
  const msAway = start.getTime() - now.getTime();

  let value: string;
  if (dayDiff <= 0) {
    if (msAway <= 0) value = 'GAME TIME';
    else {
      const mins = Math.floor(msAway / 60000);
      value = mins < 60 ? `IN ${Math.max(mins, 1)}M` : `IN ${Math.floor(mins / 60)}H ${mins % 60}M`;
    }
  } else if (dayDiff === 1) value = 'TOMORROW';
  else value = `IN ${dayDiff} DAYS`;

  const h = start.getHours();
  const m = String(start.getMinutes()).padStart(2, '0');
  const time = `${h % 12 === 0 ? 12 : h % 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
  const day = dayDiff === 0 ? 'TODAY' : WEEKDAYS[start.getDay()];
  const opp = game.opponent?.trim();
  return { value, sub: `${day} · ${time}${opp ? ` · VS ${opp.toUpperCase()}` : ''}` };
}

function useNow(enabled: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, [enabled]);
  return now;
}

// ─── HOME TILE ───────────────────────────────────────────────────────────────

interface TileSpec {
  key: string;
  label: string;
  accent: string;
  icon?: TileIconName;
  /** 'stat' = big accent number, 'text' = 2-line display text */
  kind: 'stat' | 'text';
  loading?: boolean;
  value?: string;
  /** Small, muted value used for empty states and fallbacks. */
  valueSmall?: { color: string };
  sub?: string;
  subColor?: string;
  /** Omit for an inert tile: no pressed state, no haptic, no toast. */
  onPress?: () => void;
  /** Gate from HOME_FLAGS. Omitted means visible. */
  visible?: boolean;
}

function HomeTile({ spec }: { spec: TileSpec }) {
  const { label, accent, icon, kind, loading, value, valueSmall, sub, subColor } = spec;

  const { onPress } = spec;
  const press = onPress
    ? () => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }
    : undefined;

  const a11y = [label, value, sub].filter(Boolean).join(', ');

  let valueNode: React.ReactNode;
  if (loading) {
    valueNode = <Skeleton height={28} width="55%" />;
  } else if (valueSmall) {
    valueNode = (
      <Text style={[DisplayCardSm, { fontSize: 15, color: valueSmall.color }]} numberOfLines={2}>{value}</Text>
    );
  } else if (kind === 'text') {
    valueNode = (
      <Text style={[DisplayCardSm, { fontSize: 16, color: Colors.textPrimary }]} numberOfLines={2}>{value}</Text>
    );
  } else {
    valueNode = (
      <Text
        style={[DisplayStat, { fontFamily: DisplayFont.italic, fontSize: 40, lineHeight: 42, color: accent }]}
        numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
      >
        {value}
      </Text>
    );
  }

  return (
    <ChamferPanel
      accent={accent}
      edge={Colors.border}
      fill={TILE_SURFACE}
      glow={false}
      cut={10}
      onPress={press}
      accessibilityLabel={a11y}
      style={{ flex: 1 }}
      contentStyle={{ minHeight: 116, padding: 14, justifyContent: 'space-between' }}
    >
      <View style={st.tileTop}>
        {!!icon && <TileIcon name={icon} size={18} color={accent} />}
        <Text
          style={[Typography.labelSmall, st.tileLabel]}
          numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}
        >
          {label}
        </Text>
      </View>
      <View style={{ gap: 2 }}>
        {valueNode}
        {!loading && !!sub && (
          <Text style={[Typography.labelSmall, { color: subColor ?? Colors.textSecondary }]} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>
    </ChamferPanel>
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
    borderColor: Colors.border,
    borderTopColor: TopHighlight,
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
  icon: { marginBottom: 12 },
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, isLoading, completedTodayCount, updateAthleteState } = useAthlete();

  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [missions, setMissions] = useState<MissionsProgress>({ lessonsCompleted: 0, gameModeOpened: false });
  const [lockerCards, setLockerCards] = useState<ContentCard[] | null>(null);
  const [lockerFailed, setLockerFailed] = useState(false);
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
  const [weatherLabel, setWeatherLabel] = useState<string | null>(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const { isPro, isProLoading } = useProContext();
  const { showToast } = useToast();

  // No schedule source exists in the app yet; the tile renders its empty state.
  const nextGame = null as NextGame | null;
  const now = useNow(HOME_FLAGS.upcomingGame && !!nextGame);

  // Weather — live location + Open-Meteo
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setWeatherLabel('Unavailable'); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
        const { latitude: lat, longitude: lon } = loc.coords;
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`
        );
        const data = await res.json();
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
      } catch {
        setWeatherLabel('Unavailable');
      }
    })();
  }, []);

  // Stamp last_active_date
  useEffect(() => {
    AsyncStorage.setItem(LAST_ACTIVE_KEY, new Date().toISOString().slice(0, 10)).catch(() => {});
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

  // Locker count — same existing query the Locker screen uses
  useEffect(() => {
    let cancelled = false;
    fetchContentCards()
      .then(data => { if (!cancelled) setLockerCards(data); })
      .catch(() => { if (!cancelled) setLockerFailed(true); });
    return () => { cancelled = true; };
  }, []);

  // TODO: delete this effect, lib/mentalGameScore.ts, and the clutchr_mental_game_score_v1 key when the Baseball IQ Profile card replaces the Mental Game Score on Profile.
  // Mental Game Score — recompute when rep count or streak changes
  useEffect(() => {
    if (!athleteState) return;
    const playbookBuilt = !!(athleteState as any)?.playbook?.built_at;
    updateMentalGameScore({
      repsCompletedToday: completedTodayCount,
      cuesSavedToday: playbookBuilt ? 1 : 0,
      streakActiveToday: (athleteState.streak_count ?? 0) > 0,
    }).catch(() => {});
  }, [completedTodayCount, athleteState?.streak_count]);

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

  const mission1Done = Math.min(completedTodayCount, 2) >= 2;
  const mission2Done = gmDoneToday;

  useEffect(() => {
    if (!athleteState || !mission1Done) return;
    const key = `mission1_awarded_${new Date().toDateString()}`;
    (async () => {
      const already = await AsyncStorage.getItem(key);
      if (already) return;
      await updateAthleteState({ total_xp: (athleteState.total_xp ?? 0) + 30 });
      await AsyncStorage.setItem(key, '1');
    })();
  }, [mission1Done]);

  useEffect(() => {
    if (!athleteState || !mission2Done) return;
    const key = `mission2_awarded_${new Date().toDateString()}`;
    (async () => {
      const already = await AsyncStorage.getItem(key);
      if (already) return;
      await updateAthleteState({ total_xp: (athleteState.total_xp ?? 0) + 15 });
      await AsyncStorage.setItem(key, '1');
    })();
  }, [mission2Done]);

  const totalXp = athleteState?.total_xp ?? 0;
  const currentRank = getCurrentRank(totalXp);
  const rankProgress = getRankProgress(totalXp);
  const streak = athleteState?.streak_count ?? 0;

  if (isLoading || !athleteState) {
    return (
      <View style={st.container}>
        <View style={{ paddingTop: insets.top }}>
          <ScreenHeader logo={Assets.branding.mainWordmark} />
        </View>
        <ScrollView
          contentContainerStyle={[st.skeletonScroll, { paddingBottom: insets.bottom + 100 }]}
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

  const lesson = routingResult?.lesson ?? null;
  const reason = routingResult?.reason ?? '';
  const edgeLine = reason && reason.length <= 82 ? reason : 'Build command and tempo before the game speeds up.';
  const heroLine = lesson?.subtitle || edgeLine;

  const lockerCount = lockerCards
    ? (isPro ? lockerCards : lockerCards.filter(c => !c.is_premium)).length
    : null;
  const lockerLoading = !lockerFailed && (lockerCards === null || isProLoading);

  function handleContinueCareer() {
    Haptics.selectionAsync().catch(() => {});
    if (!routingResult?.lesson) {
      router.push('/(tabs)/career');
      return;
    }
    const encodedReason = encodeURIComponent(routingResult.reason ?? '');
    router.push(`/lesson/${routingResult.lesson.id}?reason=${encodedReason}`);
  }

  async function handleGameModePress() {
    const next = { ...missions, gameModeOpened: true };
    setMissions(next);
    await AsyncStorage.setItem(MISSIONS_PROG_KEY, JSON.stringify(next));
    router.push('/(tabs)/gamemode');
  }

  // ── Tile specs — reorder the grid by moving an entry. Rows are consecutive pairs. ──
  const game = nextGame ? describeGame(nextGame, now) : null;
  const weatherReady = weatherLabel !== null;
  const weatherOk = weatherTemp !== null && weatherLabel !== null && weatherLabel !== 'Unavailable';

  const allTiles: TileSpec[] = [
    {
      visible: HOME_FLAGS.upcomingGame, key: 'game', label: 'Upcoming Game', icon: 'calendar', accent: CategoryColor.compete, kind: 'stat',
      ...(game
        ? { value: game.value, sub: game.sub }
        : { value: 'NO GAME SCHEDULED', valueSmall: { color: Colors.textTertiary }, sub: 'TAP TO ADD', subColor: CategoryColor.compete }),
      onPress: () => showToast('Game scheduling is not set up yet', 'info'),
    },
    {
      visible: HOME_FLAGS.opponentIntel, key: 'intel', label: 'Opponent Intel', icon: 'crosshair', accent: CategoryColor.signal, kind: 'text',
      value: 'NO INTEL YET', valueSmall: { color: Colors.textTertiary },
      sub: 'TAP TO BUILD', subColor: CategoryColor.signal,
      onPress: () => showToast('Opponent intel is not set up yet', 'info'),
    },
    {
      key: 'biq', label: 'Baseball IQ', icon: 'bolt', accent: CategoryColor.craft, kind: 'stat',
      value: String(BIQ_LESSONS_TO_UNLOCK), sub: 'LESSONS TO UNLOCK',
      onPress: () => router.push(BIQ_RUNNER_READY ? ('/biq' as any) : '/(tabs)/career'),
    },
    {
      visible: HOME_FLAGS.readiness, key: 'readiness', label: 'Readiness', accent: CategoryColor.recovery, kind: 'text',
      value: 'NO READINESS DATA', valueSmall: { color: Colors.textTertiary },
    },
    {
      key: 'film', label: 'Film Room', icon: 'film', accent: CategoryColor.compete, kind: 'text',
      value: 'Game Prep', valueSmall: { color: Colors.textSecondary },
      onPress: handleGameModePress,
    },
    {
      key: 'locker', label: 'Locker', icon: 'locker', accent: HOME_TEXT, kind: 'stat',
      loading: lockerLoading,
      ...(lockerCount !== null
        ? { value: String(lockerCount), sub: 'ITEMS' }
        : { kind: 'text' as const, value: 'Open Locker', valueSmall: { color: Colors.textSecondary } }),
      onPress: () => router.push('/(tabs)/locker'),
    },
    {
      visible: HOME_FLAGS.weightRoom, key: 'weight', label: 'Weight Room', icon: 'dumbbell', accent: Colors.orange, kind: 'text',
      value: 'Strength · Power', valueSmall: { color: Colors.textSecondary },
      onPress: () => showToast('Strength tools are not set up yet', 'info'),
    },
    {
      key: 'weather', label: 'Weather', icon: 'sun', accent: HOME_TEXT, kind: 'stat',
      loading: !weatherReady,
      value: weatherOk ? `${weatherTemp}°` : '—',
      sub: weatherOk ? weatherLabel!.toUpperCase() : undefined,
      onPress: () => setShowWeatherModal(true),
    },
  ];

  const tiles = allTiles.filter(t => t.visible !== false);
  const tileRows: TileSpec[][] = [];
  for (let i = 0; i < tiles.length; i += 2) tileRows.push(tiles.slice(i, i + 2));

  return (
    <View style={st.container}>

      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          logo={Assets.branding.mainWordmark}
          xp={totalXp}
          streak={streak}
          right={
            <>
              {HOME_FLAGS.bell && (
                <Pressable hitSlop={10} onPress={() => showToast('Coming soon — reminders', 'info')}>
                  <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
                </Pressable>
              )}
              {HOME_FLAGS.calendar && (
                <Pressable hitSlop={10} onPress={() => showToast('Coming soon — schedule', 'info')}>
                  <Ionicons name="calendar-outline" size={22} color={Colors.textSecondary} />
                </Pressable>
              )}
            </>
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <Reveal index={0}>
          <View style={st.inset}>
            <ChamferPanel
              cut={16}
              wash={0.2}
              scrim="left"
              image={require('../../assets/backgrounds/hero_night.png')}
              // zIndex lifts the content (and its button) above the panel's SVG outline overlay, which is
              // rendered after it and can swallow touches on iOS Fabric even with pointerEvents="none".
              contentStyle={{ minHeight: 244, padding: 16, justifyContent: 'space-between', zIndex: 1 }}
            >
              <View style={{ width: '62%', gap: 6 }}>
                <View style={st.kickerRow}>
                  <PulseDot />
                  <Eyebrow>{`NEXT REP · ${completedTodayCount}/3 TODAY`}</Eyebrow>
                </View>
                {loadingLesson ? (
                  <>
                    <Skeleton height={24} width="85%" />
                    <Skeleton height={14} width="60%" />
                  </>
                ) : (
                  <>
                    <Text style={[DisplayCard, { color: Colors.white }]} numberOfLines={2}>
                      {lesson?.title ?? 'Control the Controllables'}
                    </Text>
                    <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]} numberOfLines={2}>
                      {heroLine}
                    </Text>
                  </>
                )}
                <View style={st.rankRow}>
                  <EmblemBadge rank={currentRank} size="small" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[Typography.labelSmall, { color: Colors.textPrimary }]} numberOfLines={1}>
                      {currentRank.name}
                    </Text>
                    <Text style={[Typography.labelSmall, { color: Colors.textSecondary }]} numberOfLines={1}>
                      {rankProgress.nextRank ? `NEXT: ${rankProgress.nextRank.name.toUpperCase()}` : 'ELITE STANDARD HELD'}
                    </Text>
                    {!!rankProgress.nextRank && (
                      <ProgressBar percent={rankProgress.progressToNextRank * 100} height={3} color={Colors.textSecondary} />
                    )}
                  </View>
                </View>
              </View>
              <PrimaryButton label="Start Next Rep" arrow onPress={handleContinueCareer} />
            </ChamferPanel>
          </View>
        </Reveal>

        <View style={{ height: 20 }} />
        <Eyebrow style={st.inset}>COMMAND CENTER</Eyebrow>
        <View style={{ height: 12 }} />

        {/* ── TILE GRID ── */}
        <View style={{ gap: 12 }}>
          {tileRows.map((row, i) => (
            <Reveal key={row.map(t => t.key).join('-')} index={i + 1}>
              <View style={[st.inset, st.tileRow]}>
                {row.map(spec => <HomeTile key={spec.key} spec={spec} />)}
              </View>
            </Reveal>
          ))}
        </View>

        <View style={{ height: 16 }} />
        <Reveal index={tileRows.length + 1}>
          <CoachTake
            style={st.inset}
            text="Trust your work. Win the next pitch."
            avatar={require('../../assets/coach-cap/circular-avatar.png')}
          />
        </Reveal>
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

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  skeletonScroll: { gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  inset: { marginHorizontal: Spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: HOME_TEXT3 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  tileRow: { flexDirection: 'row', gap: 12 },
  tileTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tileLabel: { flex: 1, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.textSecondary },
});
