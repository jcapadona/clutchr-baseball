import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { RolePill } from '@/components/ui';
import { ClutchrHeader } from '@/components/ClutchrHeader';
import { EmblemBadge } from '@/components/EmblemBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { getRankProgress } from '@/lib/progressionRanks';
import {
  updateMentalGameScore,
  MentalGameScoreHistory,
  MentalGameScoreDay,
} from '@/lib/mentalGameScore';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

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

// ─── SCORE SPARKLINE ──────────────────────────────────────────────────────────

function ScoreSparkline({ days, positive }: { days: MentalGameScoreDay[]; positive: boolean }) {
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
            <SvgLinearGradient id="mgs_pf_grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset={0} stopColor={color} stopOpacity="0.25" />
              <Stop offset={1} stopColor={color} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
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

  useEffect(() => {
    updateMentalGameScore({
      repsCompletedToday: repsToday,
      cuesSavedToday: cuesSaved,
      streakActiveToday: streakActive,
    })
      .then(setHistory)
      .catch(() => {});
  }, [repsToday, cuesSaved, streakActive]);

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
            <View style={[mgsStyles.deltaBadge, isPositive ? mgsStyles.deltaPos : mgsStyles.deltaNeg]}>
              <Text style={[mgsStyles.deltaText, { color: isPositive ? Colors.primary : Colors.danger }]}>
                {isPositive ? '+' : ''}{delta.toFixed(1)} today
              </Text>
            </View>
          </View>
        </View>
      </View>
      <ScoreSparkline days={history?.days ?? []} positive={isPositive} />
      <Text style={mgsStyles.sub}>Computed from reps, cues, and streak</Text>
    </View>
  );
}

// ─── CURRENT CUE CARD ────────────────────────────────────────────────────────

function CurrentCueCard({ playbook }: { playbook: any }) {
  const cue: string | null = playbook?.focus || playbook?.pressure || null;

  return (
    <View style={cueStyles.card}>
      <Text style={cueStyles.label}>CURRENT CUE</Text>
      {cue ? (
        <>
          <Text style={cueStyles.cueText}>"{cue}"</Text>
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

// ─── COACH'S EYE CARD ────────────────────────────────────────────────────────

function CoachsEyeCard({
  reps,
  xp,
  rankName,
  cue,
}: {
  reps: number;
  xp: number;
  rankName: string;
  cue: string | null;
}) {
  return (
    <View style={eyeStyles.card}>
      <Text style={eyeStyles.label}>COACH'S EYE</Text>
      <View style={eyeStyles.grid}>
        <View style={eyeStyles.cell}>
          <Text style={eyeStyles.cellValue}>{reps}</Text>
          <Text style={eyeStyles.cellLabel}>Total Reps</Text>
        </View>
        <View style={eyeStyles.divider} />
        <View style={eyeStyles.cell}>
          <Text style={eyeStyles.cellValue}>{xp.toLocaleString()}</Text>
          <Text style={eyeStyles.cellLabel}>XP Earned</Text>
        </View>
        <View style={eyeStyles.divider} />
        <View style={eyeStyles.cell}>
          <Text style={[eyeStyles.cellValue, { fontSize: 13 }]}>{rankName}</Text>
          <Text style={eyeStyles.cellLabel}>Rank</Text>
        </View>
      </View>
      {cue && (
        <View style={eyeStyles.cueRow}>
          <Ionicons name="chatbubble-outline" size={12} color={Colors.textTertiary} />
          <Text style={eyeStyles.cueText} numberOfLines={2}>{cue}</Text>
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
  const playbook       = (athleteState as any)?.playbook;
  const playbookBuilt  = !!playbook?.built_at;
  const repsToday      = (athleteState as any).lessons_today ?? 0;
  const cuesSaved      = playbookBuilt ? 1 : 0;
  const streakActive   = (athleteState.streak_count ?? 0) > 0;
  const currentCue: string | null = playbook?.focus || playbook?.pressure || null;

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
        <Image
          source={require('../../assets/branding/simplified-wordmark.png')}
          style={styles.profileHeaderWordmark}
          resizeMode="contain"
        />
        <ClutchrHeader
          variant="mainTab"
          kicker="PROFILE"
          title="Your Player OS"
          subtitle="Role, routines, progress."
          statusPill={rank.shortLabel}
        />
      </Pressable>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── IDENTITY CARD ── */}
        <View style={styles.identityCard}>
          <LinearGradient
            colors={['rgba(34,204,94,0.06)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={styles.identityLeft}>
            <View style={styles.avatarWrap}>
              <Image
                source={require('../../assets/coach-cap/circular-avatar.png')}
                style={styles.avatarImage}
                resizeMode="contain"
              />
              <View style={styles.avatarRing} />
            </View>
            <View style={styles.identityInfo}>
              <Text style={styles.identityName}>{athleteState.first_name}</Text>
              <View style={styles.identityMeta}>
                <RolePill label={ROLE_LABELS[athleteState.primary_role]?.toUpperCase() ?? 'PLAYER'} />
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
            <Text style={[styles.rankText, { color: rank.primaryColor }]}>{rank.name}</Text>
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
                <Ionicons name="flash" size={12} color={Colors.warning} />
              </View>
              <Text style={styles.xpNum}>{xp.toLocaleString()}</Text>
              <Text style={styles.xpUnit}>XP</Text>
            </View>
            <Text style={styles.xpPhaseLabel}>
              {rankProgress.nextMilestoneLabel}
            </Text>
          </View>
          <ProgressBar value={rankProgress.percent} color={rank.accentColor} height={5} />
          <Text style={styles.xpSub}>
            {rankProgress.nextRank
              ? `${rankProgress.xpIntoCurrentRank.toLocaleString()} / ${rankProgress.xpNeededForNextRank?.toLocaleString()} XP in ${rank.name}. Earned through completed work.`
              : 'Elite reached. Keep climbing; prestige can extend this later.'}
          </Text>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Reps',   value: completedCount,                        icon: 'barbell', color: Colors.primary },
            { label: 'Streak', value: `${athleteState.streak_count ?? 0}d`,  icon: 'flame',   color: Colors.warning },
            { label: 'Best',   value: `${athleteState.streak_best ?? 0}d`,   icon: 'trophy',  color: Colors.purple  },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={16} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── CURRENT CUE ── */}
        <CurrentCueCard playbook={playbook} />

        {/* ── COACH'S EYE ── */}
        <CoachsEyeCard
          reps={completedCount}
          xp={xp}
          rankName={rank.name}
          cue={currentCue}
        />

        {/* ── PLAYBOOK CTA ── */}
        <Pressable
          style={({ pressed }) => [styles.playbookRow, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/playbook')}
        >
          <View style={[styles.playbookIcon, { backgroundColor: Colors.purple + '18' }]}>
            <Ionicons name="book" size={16} color={Colors.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.playbookLabel}>
              {playbookBuilt ? 'MY PLAYBOOK' : 'BUILD YOUR PLAYBOOK'}
            </Text>
            <Text style={styles.playbookSub}>
              {playbookBuilt
                ? playbook?.approach ?? 'Your 5 personal cues are set'
                : 'No cues set yet — build your playbook'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.purple + '80'} />
        </Pressable>

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
              trackColor={{ false: '#222', true: '#22CC5E33' }}
              thumbColor={notifsOn ? '#22CC5E' : '#555'}
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
  profileHeaderWordmark: {
    width: 116,
    height: 30,
    marginLeft: Spacing.xl,
    marginBottom: -4,
  },

  // Identity card
  identityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.primaryBorder,
    overflow: 'hidden',
  },
  identityLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md },
  avatarWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  avatarRing: {
    position: 'absolute', inset: -3, borderRadius: 32,
    borderWidth: 2, borderColor: Colors.primary + '50',
  } as any,
  avatarImage: { width: 52, height: 52 },
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
    backgroundColor: Colors.warningMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  xpNum: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.warning },
  xpUnit: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },
  xpPhaseLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  xpSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  // Stats row
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  // Playbook CTA
  playbookRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.purple + '30',
  },
  playbookIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  playbookLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.purple, letterSpacing: 0.8, marginBottom: 2 },
  playbookSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },

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
  proBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.warning, letterSpacing: 0.8 },
});

// ─── MENTAL GAME SCORE STYLES ─────────────────────────────────────────────────

const mgsStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
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
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 52,
  },
  scoreRight: { gap: 4 },
  scoreLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 1.2,
    lineHeight: 14,
  },
  deltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  deltaPos: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primaryBorder,
  },
  deltaNeg: {
    backgroundColor: Colors.danger + '12',
    borderColor: Colors.danger + '30',
  },
  deltaText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
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

// ─── COACH'S EYE STYLES ───────────────────────────────────────────────────────

const eyeStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  cellValue: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  cellLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  cueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
  },
  cueText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 17,
    fontStyle: 'italic' as const,
  },
});
