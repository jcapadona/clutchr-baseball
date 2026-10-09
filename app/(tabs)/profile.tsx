import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotifications, scheduleStreakReminder } from '@/lib/notifications';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { Assets } from '@/constants/assets';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { DisplayFont } from '@/constants/visualExtensions';
import { RolePill } from '@/components/ui';
import { ClutchrHeader } from '@/components/ClutchrHeader';
import { PulseRing, ScreenHeader, StatTile } from '@/components/ui/ClutchrUI';
import { EmblemBadge } from '@/components/EmblemBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { getRankProgress } from '@/lib/progressionRanks';
import {
  updateMentalGameScore,
  MentalGameScoreHistory,
  MentalGameScoreDay,
} from '@/lib/mentalGameScore';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const NEON = Colors.primary;
const TEXT = '#F2F5F3';

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
  pro: 'Advanced',
};

// ─── SCORE SPARKLINE ──────────────────────────────────────────────────────────

type ScoreRange = '7D' | '30D' | 'ALL';
const SCORE_RANGES: ScoreRange[] = ['7D', '30D', 'ALL'];

function ScoreSparkline({ days, positive, range }: { days: MentalGameScoreDay[]; positive: boolean; range: ScoreRange }) {
  const [cardWidth, setCardWidth] = useState(0);
  const color = positive ? NEON : Colors.danger;
  const H = 40;
  const PAD = 8;
  const shown = range === '7D' ? days.slice(-7) : range === '30D' ? days.slice(-30) : days;
  const last7 = shown;
  const hasData = last7.length >= 2;
  const recent = days.slice(-7);
  const avg7 = recent.length > 0 ? recent.reduce((sum, d) => sum + d.score, 0) / recent.length : null;

  function buildPaths(w: number) {
    const drawH = H - PAD * 2;
    if (!hasData) {
      const y = H / 2;
      return { line: `M 0,${y} L ${w},${y}`, fill: '', dotX: w, dotY: y, avgY: null as number | null };
    }
    const scores = last7.map(d => d.score);
    // Include the 7-day average in the scale so the reference line always fits.
    const domain = avg7 === null ? scores : [...scores, avg7];
    const minS = Math.min(...domain);
    const maxS = Math.max(...domain);
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
    const avgY = avg7 === null ? null : PAD + drawH - ((avg7 - minS) / span) * drawH;
    return { line: d, fill, dotX: last.x, dotY: last.y, avgY };
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
            <SvgLinearGradient id="mgs_pf_grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset={0} stopColor={TEXT} stopOpacity="0.08" />
              <Stop offset={1} stopColor={TEXT} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          {paths.avgY !== null && (
            <Line
              x1={0} y1={paths.avgY} x2={cardWidth} y2={paths.avgY}
              stroke={Colors.textTertiary} strokeWidth={1} strokeDasharray="2,4" strokeLinecap="round"
            />
          )}
          {paths.fill ? <Path d={paths.fill} fill="url(#mgs_pf_grad)" stroke="none" /> : null}
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

// ─── MENTAL GAME SCORE CARD ───────────────────────────────────────────────────

function MentalGameScoreCard({
  repsToday,
  cuesSaved,
  streakActive,
}: {
  repsToday: number;
  cuesSaved: number;
  streakActive: boolean;
}) {
  const [history, setHistory] = useState<MentalGameScoreHistory | null>(null);
  const [range, setRange] = useState<ScoreRange>('7D');

  useEffect(() => {
    updateMentalGameScore({
      repsCompletedToday: repsToday,
      cuesSavedToday: cuesSaved,
      streakActiveToday: streakActive,
    })
      .then(setHistory)
      .catch(() => {});
  }, [repsToday, cuesSaved, streakActive]);

  // DEV ONLY: seed 7 days of sample history so the sparkline curve is visible during development
  useEffect(() => {
    if (!__DEV__ || !history || history.days.length >= 3) return;
    const today = new Date();
    const seedScores = [58, 59, 60, 59, 61, 62, 63];
    setHistory(prev => {
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
  }, [history?.days.length]);

  const today = history?.days[history.days.length - 1];
  const score = today?.score ?? 60;
  const delta = today?.delta ?? 0;
  const isPositive = delta >= 0;

  return (
    <View style={mgsStyles.card}>
      <View style={mgsStyles.topRow}>
        <View style={mgsStyles.scoreBlock}>
          <Text style={mgsStyles.scoreNum}>{score}</Text>
          <View style={mgsStyles.scoreRight}>
            <Text style={mgsStyles.scoreLabel}>MENTAL GAME{'\n'}SCORE</Text>
            <View style={mgsStyles.deltaBadge}>
              <Text style={mgsStyles.deltaText}>
                {isPositive ? '+' : ''}{delta.toFixed(1)} today
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={mgsStyles.rangeRow}>
        {SCORE_RANGES.map((r) => (
          <Pressable key={r} onPress={() => setRange(r)} hitSlop={6}>
            <View style={[mgsStyles.rangeChip, range === r && mgsStyles.rangeChipActive]}>
              <Text style={[mgsStyles.rangeChipText, range === r && { color: TEXT }]}>{r}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <ScoreSparkline days={history?.days ?? []} positive={isPositive} range={range} />
      <Text style={mgsStyles.sub}>Computed from reps, cues, and streak</Text>
    </View>
  );
}

// ─── CURRENT CUE CARD ────────────────────────────────────────────────────────

function CurrentCueCard({ playbook }: { playbook: any }) {
  const built = !!playbook?.built_at;
  const cue: string | null = playbook?.focus || playbook?.pressure || null;
  const approachLine: string = playbook?.approach || 'Your 5 personal cues are set';

  return (
    <View style={cueStyles.card}>
      <Text style={cueStyles.label}>CURRENT CUE</Text>
      {built ? (
        <>
          {cue ? <Text style={cueStyles.cueText}>"{cue}"</Text> : null}
          <Text style={cueStyles.approachText}>{approachLine}</Text>
          <Pressable
            style={({ pressed }) => [cueStyles.link, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/playbook')}
          >
            <Ionicons name="book-outline" size={12} color={Colors.purple} />
            <Text style={cueStyles.linkText}>View Playbook</Text>
          </Pressable>
        </>
      ) : (
        <View style={cueStyles.emptyWrap}>
          <Ionicons name="clipboard-outline" size={20} color={Colors.textTertiary} />
          <Text style={cueStyles.emptyText}>No cue set yet</Text>
          <Pressable
            style={({ pressed }) => [cueStyles.buildBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/playbook')}
          >
            <Text style={cueStyles.buildBtnText}>Build Your Playbook</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, signOut } = useAthlete();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  if (!athleteState) return null;

  const xp             = athleteState.total_xp;
  const completedCount = athleteState.completed_lessons.length;
  const rankProgress   = getRankProgress(xp);
  const rank           = rankProgress.currentRank;
  // getRankProgress().percent is 0..1; PulseRing takes 0..100.
  const rankProgressPercent = rankProgress.percent * 100;
  const playbook       = (athleteState as any)?.playbook;
  const playbookBuilt  = !!playbook?.built_at;
  const repsToday      = (athleteState as any).lessons_today ?? 0;
  const cuesSaved      = playbookBuilt ? 1 : 0;
  const streakActive   = (athleteState.streak_count ?? 0) > 0;

  const [devTapCount, setDevTapCount] = useState(0);
  const [devTapReset, setDevTapReset] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [notifsOn, setNotifsOn] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('clutchr_notifs_setup').then(v => setNotifsOn(!!v));
  }, []);

  async function handleNotifToggle(val: boolean) {
    setNotifsOn(val);
    if (val) {
      await registerForPushNotifications();
      await scheduleStreakReminder(athleteState?.streak_count ?? 0);
      await AsyncStorage.setItem('clutchr_notifs_setup', 'true');
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem('clutchr_notifs_setup');
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  function handleDevTap() {
    if (!__DEV__) return;
    if (devTapReset) clearTimeout(devTapReset);
    const next = devTapCount + 1;
    if (next >= 7) {
      setDevTapCount(0);
      router.push('/dev-qa');
      return;
    }
    setDevTapCount(next);
    const timeout = setTimeout(() => setDevTapCount(0), 1800);
    setDevTapReset(timeout);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <Pressable onPress={handleDevTap}>
        <ScreenHeader
          logo={Assets.branding.mainWordmark}
          titleLead="PLAYER"
          titleRest="OS"
          xp={xp}
          streak={athleteState.streak_count ?? 0}
        />
      </Pressable>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── IDENTITY CARD ── */}
        <View style={styles.identityCard}>
          <View style={styles.identityLeft}>
            <PulseRing percent={rankProgressPercent} size={96} stroke={4} ringColor={TEXT} trackColor={Colors.border}>
              <Image
                source={require('../../assets/coach-cap/circular-avatar.png')}
                style={styles.avatarImage}
                resizeMode="contain"
              />
            </PulseRing>
            <View style={styles.identityInfo}>
              <Text style={styles.identityName}>{athleteState.first_name}</Text>
              <View style={styles.identityMeta}>
                <RolePill
                  label={ROLE_LABELS[athleteState.primary_role]?.toUpperCase() ?? 'PLAYER'}
                  style={{ borderWidth: 1, borderColor: Colors.borderStrong, borderRadius: 4, backgroundColor: 'transparent' }}
                  textStyle={{ color: Colors.textSecondary }}
                />
                <Text style={styles.identityLevel}>
                  {LEVEL_LABELS[athleteState.level_band] ?? athleteState.level_band}
                </Text>
              </View>
              <Text style={styles.seasonLine}>
                {athleteState.season_phase.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </Text>
            </View>
          </View>
          <View style={styles.rankBlock}>
            <EmblemBadge rank={rank} size="medium" />
            <Text style={[styles.rankText, { color: Colors.textSecondary }]}>{rank.name}</Text>
          </View>
        </View>

        {/* ── MENTAL GAME SCORE ── */}
        <MentalGameScoreCard
          repsToday={repsToday}
          cuesSaved={cuesSaved}
          streakActive={streakActive}
        />

        {/* ── XP BAR ── */}
        <View style={styles.xpCard}>
          <View style={styles.xpTopRow}>
            <View style={styles.xpLeft}>
              <View style={styles.xpIconBox}>
                <Ionicons name="flash" size={12} color={TEXT} />
              </View>
              <Text style={styles.xpNum}>{xp.toLocaleString()}</Text>
              <Text style={styles.xpUnit}>XP</Text>
            </View>
            <Text style={styles.xpPhaseLabel}>
              {rankProgress.nextMilestoneLabel}
            </Text>
          </View>
          <ProgressBar value={rankProgress.percent} color={Colors.textSecondary} height={5} />
          <Text style={styles.xpSub}>
            {rankProgress.nextRank
              ? `${rankProgress.xpIntoCurrentRank.toLocaleString()} / ${rankProgress.xpNeededForNextRank?.toLocaleString()} XP in ${rank.name}. Earned through completed work.`
              : 'Elite reached. Keep climbing; prestige can extend this later.'}
          </Text>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <StatTile value={completedCount} label="Reps" accent={Colors.textPrimary} />
          <StatTile value={`${athleteState.streak_count ?? 0}d`} label="Streak" accent={Colors.textPrimary} />
          <StatTile value={`${athleteState.streak_best ?? 0}d`} label="Best" accent={Colors.textPrimary} />
        </View>

        {/* ── CURRENT CUE ── */}
        <CurrentCueCard playbook={playbook} />

        {/* ── ACTIONS ── */}
        <View style={styles.actionsSection}>
          <Pressable style={styles.actionRow} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.actionLabel}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
          </Pressable>
          <View style={styles.actionDivider} />
          <View style={styles.actionRow}>
            <Ionicons name="notifications-outline" size={18} color={Colors.textSecondary} />
            <Text style={[styles.actionLabel, { flex: 1 }]}>Streak Reminders</Text>
            <Switch
              value={notifsOn}
              onValueChange={handleNotifToggle}
              trackColor={{ false: '#222', true: TEXT }}
              thumbColor={notifsOn ? '#050806' : '#555'}
            />
          </View>
          <View style={styles.actionDivider} />
          <Pressable style={styles.actionRow} onPress={() => router.push('/upgrade')}>
            <Ionicons name="flash-outline" size={18} color={Colors.warning} />
            <Text style={[styles.actionLabel, { color: Colors.warning }]}>Upgrade to Pro</Text>
            <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable style={styles.actionRow} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={[styles.actionLabel, { color: Colors.danger }]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
          </Pressable>
        </View>

      </Animated.ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },

  // Identity card
  identityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  identityLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md },
  avatarImage: { width: 76, height: 76, borderRadius: 38 },
  identityInfo: { flex: 1, gap: 4 },
  identityName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  identityMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  identityLevel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  seasonLine: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  rankBlock: { alignItems: 'center', gap: 4, minWidth: 58 },
  rankText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, textAlign: 'center' },

  // XP
  xpCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  xpTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  xpLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  xpIconBox: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  xpNum: { fontSize: 18, fontFamily: 'Inter_700Bold', color: TEXT },
  xpUnit: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },
  xpPhaseLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  xpSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  // Stats row
  statsRow: { flexDirection: 'row', gap: Spacing.sm },

  // Actions
  actionsSection: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, gap: Spacing.md,
  },
  actionDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  actionLabel: {
    fontSize: 15, fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary, flex: 1,
  },
  proBadge: {
    backgroundColor: Colors.warningMuted, borderRadius: Radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.warning + '40',
  },
  proBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.warning, letterSpacing: 0.8 },
});

// ─── MENTAL GAME SCORE STYLES ─────────────────────────────────────────────────

const mgsStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreNum: {
    fontSize: 88,
    fontFamily: DisplayFont.italic,
    color: Colors.textPrimary,
    lineHeight: 80,
    paddingTop: 3,
    paddingRight: 8,
  },
  scoreRight: { gap: 4, flexShrink: 1 },
  scoreLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#6E7873',
    letterSpacing: 1.2,
    lineHeight: 14,
  },
  deltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    alignSelf: 'flex-start',
  },
  deltaText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: TEXT,
  },
  rangeRow: { flexDirection: 'row', gap: Spacing.sm },
  rangeChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  rangeChipActive: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderStrong,
  },
  rangeChipText: {
    fontSize: 10, lineHeight: 14, fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1, color: Colors.textSecondary,
  },
  sub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});

// ─── CURRENT CUE STYLES ───────────────────────────────────────────────────────

const cueStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.purple + '30',
    gap: Spacing.sm,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.purple,
    letterSpacing: 1.5,
  },
  cueText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 22,
    fontStyle: 'italic' as const,
  },
  approachText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  linkText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.purple,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  buildBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.purple + '18',
    borderWidth: 1,
    borderColor: Colors.purple + '40',
  },
  buildBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.purple,
  },
});
