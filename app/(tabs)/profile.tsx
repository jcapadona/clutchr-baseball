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
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getBestCue } from '@/lib/personalCue';
import { RolePill } from '@/components/ui';
import { ClutchrHeader } from '@/components/ClutchrHeader';
import { EmblemBadge } from '@/components/EmblemBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { ProgressRing } from '@/components/ProgressRing';
import { getRankProgress } from '@/lib/progressionRanks';
import { useMicrocopy } from '@/hooks/useMicrocopy';

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

// Phase Map — 8 phases, each with a name and the skill that unlocks it
const PHASES = [
  { name: 'Calibration',    skill: 'Self-Awareness',  icon: 'compass',       xpNeeded: 0    },
  { name: 'Foundation',     skill: 'Mental Base',      icon: 'layers',        xpNeeded: 200  },
  { name: 'Role Execution', skill: 'Position IQ',      icon: 'baseball',      icon2: 'body', xpNeeded: 500  },
  { name: 'Approach',       skill: 'Process Focus',    icon: 'eye',           xpNeeded: 1000 },
  { name: 'Pressure',       skill: 'Clutch Moments',   icon: 'pulse',         xpNeeded: 2000 },
  { name: 'Resilience',     skill: 'Bounce Back',      icon: 'refresh',       xpNeeded: 3500 },
  { name: 'Mastery',        skill: 'Consistent Elite', icon: 'trophy',        xpNeeded: 5000 },
  { name: 'Elite',          skill: 'Championship DNA', icon: 'star',          xpNeeded: 7500 },
];

// Strength chips — unlock based on completed_lessons count thresholds
// These feel earned, not arbitrary — tied to real lesson milestones
const STRENGTH_CHIPS = [
  { id: 'mental_base',    label: 'Mental Base',      icon: 'layers',      unlockAt: 3,  color: Colors.primary  },
  { id: 'routine',        label: 'Routine Builder',  icon: 'repeat',      unlockAt: 6,  color: Colors.info     },
  { id: 'reset_skill',    label: 'Reset Skill',      icon: 'refresh',     unlockAt: 8,  color: Colors.purple   },
  { id: 'tempo',          label: 'Tempo Control',    icon: 'timer',       unlockAt: 10, color: Colors.warning  },
  { id: 'composure',      label: 'Composure',        icon: 'shield',      unlockAt: 12, color: Colors.primary  },
  { id: 'process_focus',  label: 'Process Focus',    icon: 'eye',         unlockAt: 15, color: Colors.info     },
  { id: 'short_memory',   label: 'Short Memory',     icon: 'close-circle',unlockAt: 18, color: Colors.warning  },
  { id: 'pressure_rep',   label: 'Pressure Rep',     icon: 'pulse',       unlockAt: 22, color: Colors.danger   },
  { id: 'clutch',         label: 'Clutch Moments',   icon: 'flash',       unlockAt: 27, color: Colors.warning  },
  { id: 'elite_mindset',  label: 'Elite Mindset',    icon: 'star',        unlockAt: 35, color: Colors.purple   },
];

// ─── RADAR CHART ─────────────────────────────────────────────────────────────

const RADAR_STATS = ['Confidence', 'Focus', 'Composure', 'Consistency', 'Mechanics', 'Mental Edge'];
const RADAR_SIZE = 220;
const CENTER = RADAR_SIZE / 2;
const RADIUS = 80;

function RadarChart({ ratings }: { ratings: Record<string, number> }) {
  const values = [
    ratings?.confidence ?? 3,
    ratings?.focus ?? 3,
    ratings?.composure ?? 3,
    ratings?.consistency ?? 3,
    ratings?.mechanics ?? 3,
    ratings?.mental_edge ?? 3,
  ];

  const angleStep = (Math.PI * 2) / 6;

  function getPoint(index: number, value: number, maxValue = 5) {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / maxValue) * RADIUS;
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
  }

  function getLabelPoint(index: number) {
    const angle = angleStep * index - Math.PI / 2;
    const r = RADIUS + 20;
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
  }

  const dataPoints = values.map((v, i) => getPoint(i, v));
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
        {gridLevels.map(level => {
          const gridPoints = RADAR_STATS.map((_, i) => getPoint(i, level));
          const gridPolygon = gridPoints.map(p => `${p.x},${p.y}`).join(' ');
          return (
            <Polygon key={level} points={gridPolygon} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          );
        })}
        {RADAR_STATS.map((_, i) => {
          const outer = getPoint(i, 5);
          return <Line key={i} x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
        })}
        <Polygon points={polygonPoints} fill="rgba(34,204,94,0.15)" stroke="#22CC5E" strokeWidth="2" />
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill="#22CC5E" />
        ))}
        {RADAR_STATS.map((label, i) => {
          const lp = getLabelPoint(i);
          return (
            <SvgText key={i} x={lp.x} y={lp.y} textAnchor="middle" alignmentBaseline="middle" fontSize="9" fontWeight="600" fill="rgba(255,255,255,0.55)">
              {label.toUpperCase()}
            </SvgText>
          );
        })}
      </Svg>
      <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 4 }}>
        Based on your self-ratings
      </Text>
    </View>
  );
}

// ─── PHASE MAP COMPONENT ─────────────────────────────────────────────────────

function PhaseMap({ currentPhase, xp }: { currentPhase: number; xp: number }) {
  return (
    <View style={pmStyles.wrap}>
      <View style={pmStyles.header}>
        <Text style={pmStyles.title}>CAREER PATH</Text>
        <Text style={pmStyles.sub}>Phase {currentPhase + 1} of {PHASES.length}</Text>
      </View>

      <View style={pmStyles.track}>
        {PHASES.map((phase, idx) => {
          const isCompleted = idx < currentPhase;
          const isCurrent   = idx === currentPhase;
          const isLocked    = idx > currentPhase;

          return (
            <View key={idx} style={pmStyles.phaseRow}>
              {/* Connector line above (skip first) */}
              {idx > 0 && (
                <View style={[
                  pmStyles.connector,
                  (isCompleted || isCurrent) && pmStyles.connectorActive,
                ]} />
              )}

              {/* Node */}
              <View style={[
                pmStyles.node,
                isCompleted && pmStyles.nodeCompleted,
                isCurrent   && pmStyles.nodeCurrent,
                isLocked    && pmStyles.nodeLocked,
              ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color="#000" />
                ) : isCurrent ? (
                  <Ionicons name={phase.icon as any} size={12} color="#000" />
                ) : (
                  <Ionicons name="lock-closed" size={10} color={Colors.textTertiary} />
                )}
              </View>

              {/* Label */}
              <View style={pmStyles.phaseInfo}>
                <Text style={[
                  pmStyles.phaseName,
                  isCompleted && pmStyles.phaseNameDone,
                  isCurrent   && pmStyles.phaseNameCurrent,
                  isLocked    && pmStyles.phaseNameLocked,
                ]}>
                  {phase.name}
                  {isCurrent && <Text style={pmStyles.currentTag}> ← YOU</Text>}
                </Text>
                <Text style={[pmStyles.phaseSkill, isLocked && { opacity: 0.35 }]}>
                  {phase.skill}
                </Text>
              </View>

              {/* XP badge on current */}
              {isCurrent && idx < PHASES.length - 1 && (
                <View style={pmStyles.xpBadge}>
                  <Text style={pmStyles.xpBadgeText}>
                    {(PHASES[idx + 1].xpNeeded - xp).toLocaleString()} XP
                  </Text>
                  <Text style={pmStyles.xpBadgeSub}>to next</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── STRENGTHS COMPONENT ─────────────────────────────────────────────────────

function StrengthsSection({ completedCount }: { completedCount: number }) {
  const unlocked = STRENGTH_CHIPS.filter(c => completedCount >= c.unlockAt);
  const nextLock = STRENGTH_CHIPS.find(c => completedCount < c.unlockAt);
  const needed   = nextLock ? nextLock.unlockAt - completedCount : 0;

  return (
    <View style={strStyles.wrap}>
      <View style={strStyles.header}>
        <Text style={strStyles.title}>STRENGTHS DEVELOPING</Text>
        {nextLock && (
          <Text style={strStyles.sub}>{needed} lesson{needed !== 1 ? 's' : ''} to unlock next</Text>
        )}
      </View>

      {unlocked.length === 0 ? (
        <View style={strStyles.emptyWrap}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} />
          <Text style={strStyles.emptyText}>
            Complete {nextLock?.unlockAt ?? 3} lessons to unlock your first strength
          </Text>
        </View>
      ) : (
        <View style={strStyles.chips}>
          {unlocked.map((chip) => (
            <View key={chip.id} style={[strStyles.chip, { borderColor: chip.color + '40', backgroundColor: chip.color + '10' }]}>
              <Ionicons name={chip.icon as any} size={11} color={chip.color} />
              <Text style={[strStyles.chipText, { color: chip.color }]}>{chip.label}</Text>
            </View>
          ))}
          {/* Next locked chip — shown as a teaser */}
          {nextLock && (
            <View style={strStyles.chipLocked}>
              <Ionicons name="lock-closed" size={10} color={Colors.textTertiary} />
              <Text style={strStyles.chipLockedText}>{nextLock.label}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, signOut } = useAthlete();
  const microcopy = useMicrocopy();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  if (!athleteState) return null;

  const xp           = athleteState.total_xp;
  const phase        = athleteState.current_phase;
  const completedCount = athleteState.completed_lessons.length;
  const rankProgress = getRankProgress(xp);
  const rank = rankProgress.currentRank;
  const playbookBuilt = !!(athleteState as any)?.playbook?.built_at;
  const ratings       = athleteState.self_ratings;
  const focusCue = getBestCue(athleteState, 'focus');
  const pressureCue = getBestCue(athleteState, 'pressure');
  const confidenceCue = getBestCue(athleteState, 'confidence');
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
          {/* Left: avatar + info */}
          <View style={styles.identityLeft}>
            <View style={styles.avatarWrap}>
              <Image
                source={require('../../assets/coach-cap/circular-avatar.png')}
                style={styles.avatarImage}
                resizeMode="contain"
              />
              {/* Rank ring glow */}
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
                {athleteState.season_phase.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Text>
            </View>
          </View>

          {/* Right: rank emblem */}
          <View style={styles.rankBlock}>
            <EmblemBadge rank={rank} size="medium" />
            <Text style={[styles.rankText, { color: rank.primaryColor }]}>{rank.name}</Text>
          </View>
        </View>
        <Text style={styles.rankProof}>{rank.description}</Text>

        <View style={styles.coachCallout}>
          <Image
            source={require('../../assets/coach-cap/calm-standing-portrait.png')}
            style={styles.coachPortrait}
            resizeMode="contain"
          />
          <View style={styles.coachCopy}>
            <Text style={styles.coachLabel}>COACH CAP</Text>
            <Text style={styles.coachText}>Player OS stays simple: know your role, stack reps, carry one cue into the next moment.</Text>
          </View>
        </View>

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
            { label: 'Lessons',  value: completedCount,                         icon: 'book',     color: Colors.primary },
            { label: 'Streak',   value: `${athleteState.streak_count ?? 0}d`,   icon: 'flame',    color: Colors.warning },
            { label: 'Best',     value: `${athleteState.streak_best ?? 0}d`,    icon: 'trophy',   color: Colors.purple  },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={16} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── STRENGTHS DEVELOPING ── */}
        <StrengthsSection completedCount={completedCount} />


        <View style={styles.card}>
          <Text style={styles.cardTitle}>COACH'S EYE · SNAPSHOT</Text>
          <Text style={styles.cardBody}>Earned work: {completedCount} completed reps · {xp.toLocaleString()} XP · {rank.name} rank.</Text>
          <Text style={styles.cardBody}>Strengths: {athleteState.self_ratings.focus >= 4 ? 'Focus under reps' : 'Process commitment'}, {athleteState.streak_count >= 3 ? 'Consistency streak' : 'Daily return mindset'}, {athleteState.routine_consistency >= 4 ? 'Routine discipline' : 'Coachable adjustments'}</Text>
          <Text style={styles.cardBody}>Growth: {athleteState.self_ratings.confidence <= 3 ? 'Pre-pitch confidence' : 'Pressure execution'}, {athleteState.routine_consistency <= 3 ? 'Pregame routine quality' : 'Late-game composure'}</Text>
          <Text style={styles.cardBody}>Focus cue: {focusCue} · Pressure cue: {pressureCue}</Text>
          <Text style={styles.cardBody}>Recommended next rep: {athleteState.primary_role === 'pitcher' ? 'Pitch IQ' : 'Field IQ'} · Cue: {confidenceCue}</Text>
        </View>

        {/* ── PHASE / CAREER MAP ── */}
        <PhaseMap currentPhase={phase} xp={xp} />

        {/* ── MENTAL EDGE RATINGS ── */}
        <View style={{ backgroundColor: '#0D0D12', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' }}>
          <Text style={{ color: '#22CC5E', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>MENTAL EDGE</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 16 }}>Your performance profile</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
            {([
              { key: 'confidence',          label: 'CONF'    },
              { key: 'focus',               label: 'FOCUS'   },
              { key: 'composure',           label: 'COMP'    },
              { key: 'recovery_discipline', label: 'RECOVER' },
            ] as const).map(({ key, label }) => (
              <ProgressRing
                key={key}
                value={(athleteState.self_ratings[key as keyof typeof athleteState.self_ratings] as number ?? 3) / 5}
                label={label}
                size={64}
                strokeWidth={4}
              />
            ))}
          </View>
          <RadarChart ratings={athleteState?.self_ratings ?? {}} />
        </View>

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
                ? (athleteState as any)?.playbook?.approach ?? 'Your 5 personal cues are set'
                : microcopy.useEmptyState('noSavedCues')}
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  clutchrLogo: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1 },
  headerTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary, letterSpacing: 1 },
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
  avatarLetter: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.primary },
  avatarImage: {
    width: 52,
    height: 52,
  },
  identityInfo: { flex: 1, gap: 4 },
  identityName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  identityMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  identityLevel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  seasonLine: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  rankBlock: { alignItems: 'center', gap: 4, minWidth: 58 },
  rankText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, textAlign: 'center' },
  rankProof: { marginTop: Spacing.md, fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, lineHeight: 18 },
  coachCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.sm,
    padding: 14,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  coachPortrait: {
    width: 52,
    height: 64,
    marginVertical: -8,
  },
  coachBadge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.surfaceGlow,
  },
  coachCap: {
    position: 'absolute',
    top: 8,
    width: 22,
    height: 7,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: Colors.primary,
  },
  coachBadgeText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    marginTop: 7,
  },
  coachCopy: { flex: 1, gap: 3 },
  coachLabel: {
    color: Colors.primary,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  coachText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    lineHeight: 17,
  },

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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: 8,
  },
  cardTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1.2 },
  cardBody: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },

  // Mental Edge
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textSecondary, letterSpacing: 1.2 },
  sectionSub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  ratingsCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ratingLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, width: 86 },
  ratingBar: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  ratingFill: { height: 4, borderRadius: 2 },
  ratingNum: { fontSize: 13, fontFamily: 'Inter_700Bold', width: 16, textAlign: 'right' },

  // Playbook
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

// ─── PHASE MAP STYLES ─────────────────────────────────────────────────────────

const pmStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textSecondary, letterSpacing: 1.2 },
  sub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  track: { gap: 0 },
  phaseRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: 6, position: 'relative',
  },
  connector: {
    position: 'absolute', left: 11, top: -6,
    width: 2, height: 12, backgroundColor: Colors.border,
  },
  connectorActive: { backgroundColor: Colors.primary + '60' },
  node: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.border, borderWidth: 1, borderColor: Colors.border,
    flexShrink: 0,
  },
  nodeCompleted: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  nodeCurrent: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 6,
  },
  nodeLocked: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.border },
  phaseInfo: { flex: 1, gap: 1 },
  phaseName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  phaseNameDone: { color: Colors.primary, opacity: 0.7 },
  phaseNameCurrent: { color: Colors.textPrimary },
  phaseNameLocked: { color: Colors.textTertiary },
  currentTag: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1 },
  phaseSkill: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  xpBadge: { alignItems: 'flex-end', gap: 1 },
  xpBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.warning },
  xpBadgeSub: { fontSize: 9, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
});

// ─── STRENGTHS STYLES ─────────────────────────────────────────────────────────

const strStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textSecondary, letterSpacing: 1.2 },
  sub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: Radius.pill, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  chipText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  chipLocked: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: Radius.pill, borderWidth: 1,
    borderColor: Colors.border, borderStyle: 'dashed',
    paddingHorizontal: 10, paddingVertical: 6,
    opacity: 0.5,
  },
  chipLockedText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  emptyWrap: { alignItems: 'center', gap: 6, paddingVertical: Spacing.sm },
  emptyText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textAlign: 'center' },
});
