import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

// ─── WORLD CONFIG ─────────────────────────────────────────────────────────────

const WORLDS = [
  {
    pillar: 'foundation',
    label: 'FOUNDATION',
    subtitle: 'Mental framework every athlete needs',
    color: Colors.primary,
    worldNum: 1,
    emoji: '🧠',
  },
  {
    pillar: 'built-different',
    label: 'BUILT DIFFERENT',
    subtitle: 'Strength, nutrition, sleep, arm care',
    color: '#E85D26',
    worldNum: 2,
    emoji: '💪',
  },
  {
    pillar: 'pitcher-path',
    label: 'PITCHER PATH',
    subtitle: 'Command, tempo, game IQ',
    color: Colors.purple,
    worldNum: 3,
    emoji: '⚾',
  },
  {
    pillar: 'hitter-path',
    label: 'HITTER PATH',
    subtitle: 'Approach, zone discipline, at-bat process',
    color: Colors.warning,
    worldNum: 4,
    emoji: '🏏',
  },
  {
    pillar: 'catcher-path',
    label: 'CATCHER PATH',
    subtitle: 'Leadership, game management, trust',
    color: Colors.info,
    worldNum: 5,
    emoji: '🛡️',
  },
  {
    pillar: 'infield-path',
    label: 'INFIELD PATH',
    subtitle: 'Fielding IQ, ready position, decisions',
    color: Colors.danger,
    worldNum: 6,
    emoji: '🎯',
  },
  {
    pillar: 'outfield-path',
    label: 'OUTFIELD PATH',
    subtitle: 'First step reads, crow hop, tracking',
    color: Colors.primary,
    worldNum: 7,
    emoji: '🏃',
  },
  {
    pillar: 'baserunner-path',
    label: 'BASERUNNER PATH',
    subtitle: 'Leads, reads, green light, steal aggression',
    color: Colors.warning,
    worldNum: 8,
    emoji: '💨',
  },
  {
    pillar: 'pressure-resilience',
    label: 'PRESSURE & RESILIENCE',
    subtitle: 'Clutch moments, reset systems, slump repair',
    color: '#E85D26',
    worldNum: 9,
    emoji: '🔥',
  },
  {
    pillar: 'gamemode',
    label: 'GAME MODE',
    subtitle: 'Pregame, in-game, and postgame sessions',
    color: Colors.warning,
    worldNum: 10,
    emoji: '🏆',
  },
];

const ROLE_PILLAR: Record<string, string> = {
  pitcher: 'pitcher-path',
  catcher: 'catcher-path',
  infielder: 'infield-path',
  outfielder: 'outfield-path',
};

// ─── WORLD STATUS ─────────────────────────────────────────────────────────────

function getWorldStatus(
  lessons: LegacyLesson[],
  completed: string[],
  idx: number
): 'locked' | 'active' | 'complete' {
  const pillar = WORLDS[idx].pillar;
  const mine = lessons.filter((l) => l.pillar_id === pillar);
  if (idx === 0) return mine.length > 0 && mine.every((l) => completed.includes(l.id)) ? 'complete' : 'active';
  const prev = lessons.filter((l) => l.pillar_id === WORLDS[idx - 1].pillar);
  if (!prev.some((l) => completed.includes(l.id))) return 'locked';
  return mine.length > 0 && mine.every((l) => completed.includes(l.id)) ? 'complete' : 'active';
}

// ─── WORLD BANNER — redesigned with more punch ────────────────────────────────

function WorldBanner({
  world, status, isMyRole, done, total, expanded, onToggle,
}: {
  world: typeof WORLDS[0];
  status: 'locked' | 'active' | 'complete';
  isMyRole: boolean;
  done: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const locked = status === 'locked';
  const complete = status === 'complete';
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  const color = locked ? Colors.textTertiary : world.color;

  return (
    <Pressable
      onPress={locked ? undefined : onToggle}
      disabled={locked}
      style={[
        bannerStyles.wrap,
        complete && { borderColor: world.color + '40', backgroundColor: Colors.surfaceGlow },
        locked && bannerStyles.wrapLocked,
        !locked && !complete && { borderColor: world.color + '25' },
      ]}
    >
      {/* Gradient background — subtle tint from world color */}
      {!locked && (
        <LinearGradient
          colors={[world.color + '0C', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
        />
      )}

      {/* Bold left color bar */}
      <View style={[bannerStyles.colorBar, {
        backgroundColor: locked ? Colors.border : world.color,
        opacity: locked ? 0.3 : complete ? 1 : 0.7,
      }]} />

      <View style={bannerStyles.inner}>
        {/* Top section: world number + emoji + title */}
        <View style={bannerStyles.topRow}>

          {/* Emoji circle */}
          <View style={[bannerStyles.emojiCircle, {
            backgroundColor: locked ? Colors.surfaceElevated : world.color + '18',
            borderColor: locked ? Colors.border : world.color + '35',
          }]}>
            {locked
              ? <Ionicons name="lock-closed" size={16} color={Colors.textTertiary} />
              : complete
              ? <Ionicons name="checkmark-circle" size={22} color={world.color} />
              : <Text style={bannerStyles.emoji}>{world.emoji}</Text>
            }
          </View>

          {/* Title block */}
          <View style={bannerStyles.titleBlock}>
            {/* World number — bold colored label */}
            <Text style={[bannerStyles.worldNum, { color: locked ? Colors.textTertiary : world.color }]}>
              WORLD {world.worldNum}
            </Text>
            <Text style={[bannerStyles.worldLabel, locked && { color: Colors.textTertiary }]}>
              {world.label}
            </Text>
            <Text style={[bannerStyles.worldSub, locked && { color: Colors.textTertiary + '80' }]}>
              {locked ? 'Complete previous world to unlock' : world.subtitle}
            </Text>
          </View>

          {/* Right side: badges + chevron */}
          <View style={bannerStyles.rightCol}>
            {isMyRole && !locked && (
              <View style={[bannerStyles.yourPathBadge, { backgroundColor: world.color, borderColor: world.color }]}>
                <Text style={bannerStyles.yourPathText}>YOUR PATH</Text>
              </View>
            )}
            {complete && (
              <View style={[bannerStyles.completeBadge, { borderColor: world.color + '50', backgroundColor: world.color + '15' }]}>
                <Text style={[bannerStyles.completeBadgeText, { color: world.color }]}>DONE</Text>
              </View>
            )}
            {!locked && (
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.textTertiary}
              />
            )}
          </View>
        </View>

        {/* Progress row */}
        {!locked && total > 0 && (
          <View style={bannerStyles.progressRow}>
            <View style={bannerStyles.progressTrack}>
              <View style={[
                bannerStyles.progressFill,
                { width: `${pct * 100}%`, backgroundColor: world.color },
              ]} />
              {/* Glowing tip */}
              {pct > 0 && pct < 1 && (
                <View style={[
                  bannerStyles.progressTip,
                  {
                    left: `${Math.min(98, pct * 100)}%` as any,
                    backgroundColor: world.color,
                    shadowColor: world.color,
                  },
                ]} />
              )}
            </View>
            <Text style={[bannerStyles.progressLabel, { color: world.color }]}>
              {done}/{total}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── LESSON NODE ─────────────────────────────────────────────────────────────
// Bigger nodes, real path line, glow system on active/next

function LessonNode({
  lesson, idx, isDone, isNext, isLocked, color, totalInPath,
}: {
  lesson: LegacyLesson;
  idx: number;
  isDone: boolean;
  isNext: boolean;
  isLocked: boolean;
  color: string;
  totalInPath: number;
}) {
  // Pulse animation for NEXT node
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!isNext) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.10, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    return () => { pulseAnim.stopAnimation(); glowAnim.stopAnimation(); };
  }, [isNext]);

  // Zigzag: right → center → left cycling
  const pos = idx % 3;
  const offsetStyle = pos === 0
    ? { alignSelf: 'flex-end' as const, marginRight: 32 }
    : pos === 1
    ? { alignSelf: 'center' as const }
    : { alignSelf: 'flex-start' as const, marginLeft: 32 };

  const isBoss = lesson.is_boss;
  const isCheckpoint = lesson.is_checkpoint && !isBoss;

  // Node sizes — bigger than before
  const NODE_SIZE = isBoss ? 80 : 66;
  const WRAP_SIZE = NODE_SIZE + 24;

  // Colors per state
  const circleBg = isDone
    ? color
    : isNext
    ? Colors.surfaceGlow
    : isBoss && !isDone
    ? Colors.surfaceWarm
    : Colors.surface;

  const circleBorder = isDone
    ? color
    : isNext
    ? color
    : isBoss
    ? Colors.warning
    : isCheckpoint
    ? Colors.info
    : Colors.border;

  const isLast = idx === totalInPath - 1;

  return (
    <View style={[nodeStyles.container, offsetStyle]}>

      {/* PATH LINE — runs from this node up to the previous one */}
      {idx > 0 && (
        <View style={nodeStyles.pathLineWrap}>
          {/* Track */}
          <View style={[nodeStyles.pathTrack, {
            backgroundColor: isDone ? color + '40' : Colors.border + '30',
          }]} />
          {/* Fill — shows progress */}
          {isDone && (
            <View style={[nodeStyles.pathFill, { backgroundColor: color + '60' }]} />
          )}
        </View>
      )}

      {/* NODE */}
      <Pressable
        onPress={isLocked ? undefined : () => router.push(`/lesson/${lesson.id}`)}
        disabled={isLocked}
        style={{ alignItems: 'center' }}
      >
        {/* Outer glow ring — only for NEXT node */}
        {isNext && (
          <Animated.View style={[
            nodeStyles.glowRingOuter,
            {
              width: WRAP_SIZE + 16,
              height: WRAP_SIZE + 16,
              borderRadius: (WRAP_SIZE + 16) / 2,
              borderColor: color + '30',
              opacity: glowAnim,
            },
          ]} />
        )}

        {/* Inner pulse wrapper */}
        <Animated.View style={[
          nodeStyles.nodeWrap,
          {
            width: WRAP_SIZE,
            height: WRAP_SIZE,
            borderRadius: WRAP_SIZE / 2,
          },
          isNext && { transform: [{ scale: pulseAnim }] },
        ]}>

          {/* The circle */}
          <View style={[
            nodeStyles.circle,
            {
              width: NODE_SIZE,
              height: NODE_SIZE,
              borderRadius: NODE_SIZE / 2,
              backgroundColor: circleBg,
              borderColor: circleBorder,
              borderWidth: isNext ? 2.5 : isDone ? 0 : 1.5,
            },
            isNext && {
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.55,
              shadowRadius: 16,
              elevation: 10,
            },
            isBoss && !isDone && {
              borderColor: Colors.warning,
              shadowColor: Colors.warning,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 6,
            },
            isCheckpoint && !isDone && {
              borderColor: Colors.info,
              shadowColor: Colors.info,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.28,
              shadowRadius: 10,
              elevation: 4,
            },
            isLocked && { opacity: 0.25 },
          ]}>

            {/* Gradient fill for done nodes */}
            {isDone && (
              <LinearGradient
                colors={[color, color + 'CC']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}

            {/* Icon / number */}
            {isDone ? (
              <Ionicons name="checkmark" size={isBoss ? 28 : 24} color="#000" />
            ) : isBoss ? (
              <Ionicons name="trophy" size={26} color={Colors.warning} />
            ) : isCheckpoint ? (
              <Ionicons name="flag" size={22} color={Colors.info} />
            ) : isLocked ? (
              <Ionicons name="lock-closed" size={18} color={Colors.textTertiary} />
            ) : (
              <Text style={[nodeStyles.nodeNum, {
                color: isNext ? color : Colors.textTertiary,
                fontSize: isBoss ? 22 : 18,
              }]}>
                {idx + 1}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* START badge — below the next node */}
        {isNext && (
          <View style={[nodeStyles.startBadge, { backgroundColor: color, shadowColor: color }]}>
            <View style={nodeStyles.startDot} />
            <Text style={nodeStyles.startBadgeText}>START</Text>
          </View>
        )}

        {/* BOSS badge */}
        {isBoss && !isDone && !isNext && (
          <View style={[nodeStyles.startBadge, { backgroundColor: Colors.warning, shadowColor: Colors.warning }]}>
            <Ionicons name="trophy" size={9} color="#000" />
            <Text style={nodeStyles.startBadgeText}>BOSS</Text>
          </View>
        )}

        {/* Lesson title */}
        <Text
          style={[
            nodeStyles.label,
            isDone && { color: Colors.textTertiary },
            isNext && { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
            isLocked && { color: Colors.textTertiary, opacity: 0.3 },
          ]}
          numberOfLines={2}
        >
          {lesson.title}
        </Text>

        {/* XP */}
        {!isLocked && (
          <View style={nodeStyles.xpRow}>
            <Ionicons name="flash" size={9} color={Colors.warning} />
            <Text style={nodeStyles.xpText}>+{lesson.xp_reward}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function CareerScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState } = useAthlete();
  const [lessons, setLessons] = useState<LegacyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['foundation']));

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchLessons({ limit: 200 });
        setLessons(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const completed = athleteState?.completed_lessons ?? [];
  const myPillar = ROLE_PILLAR[athleteState?.primary_role ?? ''] ?? '';

  useEffect(() => {
    if (!lessons.length) return;
    const next = new Set<string>(['foundation']);
    WORLDS.forEach((w, i) => {
      if (getWorldStatus(lessons, completed, i) === 'active') next.add(w.pillar);
    });
    setExpanded(next);
  }, [lessons.length]);

  function toggle(pillar: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(pillar) ? n.delete(pillar) : n.add(pillar);
      return n;
    });
  }

  const totalDone = completed.length;
  const totalAll = lessons.length;
  const overallPct = totalAll > 0 ? Math.min(100, Math.round((totalDone / totalAll) * 100)) : 0;

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR JOURNEY</Text>
          <Text style={styles.title}>Career Path</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.xpBadge}>
            <Ionicons name="flash" size={12} color={Colors.warning} />
            <Text style={styles.xpNum}>{athleteState?.total_xp ?? 0}</Text>
          </View>
          <Text style={styles.xpSuffix}>XP</Text>
        </View>
      </View>

      {/* ── OVERALL PROGRESS ── */}
      <View style={styles.overallProgress}>
        <View style={styles.overallTrack}>
          <View style={[styles.overallFill, { width: `${overallPct}%` }]} />
        </View>
        <View style={styles.overallMeta}>
          <Text style={styles.overallLabel}>{totalDone} of {totalAll} lessons</Text>
          <Text style={styles.overallPct}>{overallPct}%</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {WORLDS.map((world, idx) => {
          const worldLessons = lessons
            .filter((l) => l.pillar_id === world.pillar)
            .sort((a, b) => a.order_index - b.order_index);
          const worldDone = worldLessons.filter((l) => completed.includes(l.id)).length;
          const status = getWorldStatus(lessons, completed, idx);
          const isOpen = expanded.has(world.pillar);

          return (
            <View key={world.pillar} style={styles.worldWrap}>

              {/* ── WORLD BANNER ── */}
              <WorldBanner
                world={world}
                status={status}
                isMyRole={myPillar === world.pillar}
                done={worldDone}
                total={worldLessons.length}
                expanded={isOpen}
                onToggle={() => toggle(world.pillar)}
              />

              {/* ── LESSON NODE PATH ── */}
              {isOpen && status !== 'locked' && (
                <View style={styles.pathWrap}>
                  {worldLessons.length === 0 ? (
                    <View style={styles.emptyWorld}>
                      <Text style={styles.emptyText}>Lessons coming soon.</Text>
                    </View>
                  ) : (
                    worldLessons.map((lesson, i) => {
                      const isDone = completed.includes(lesson.id);
                      const isNext = !isDone && worldLessons.slice(0, i).every((l) => completed.includes(l.id));
                      const isLocked = i > 0 && !completed.includes(worldLessons[i - 1].id) && !isDone;
                      return (
                        <LessonNode
                          key={lesson.id}
                          lesson={lesson}
                          idx={i}
                          isDone={isDone}
                          isNext={isNext}
                          isLocked={isLocked}
                          color={world.color}
                          totalInPath={worldLessons.length}
                        />
                      );
                    })
                  )}
                </View>
              )}

              {/* World divider */}
              <View style={styles.worldDivider} />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 3,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerRight: { alignItems: 'flex-end', paddingTop: 4, gap: 1 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  xpNum: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.warning },
  xpSuffix: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },

  // Overall progress
  overallProgress: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: 6,
  },
  overallTrack: {
    height: 3,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  overallFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  overallMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  overallPct: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  scroll: { paddingTop: 4 },

  worldWrap: { marginBottom: 4 },

  // Path container
  pathWrap: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: 0, // nodes manage their own spacing via path lines
  },

  worldDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    opacity: 0.35,
  },

  emptyWorld: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
});

// ─── WORLD BANNER STYLES ─────────────────────────────────────────────────────

const bannerStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    // Subtle card shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  wrapLocked: { opacity: 0.45 },

  colorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: Radius.xl,
    borderBottomLeftRadius: Radius.xl,
  },

  inner: {
    paddingLeft: 20,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  emojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  emoji: { fontSize: 24 },

  titleBlock: { flex: 1, gap: 2 },

  worldNum: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.8,
    marginBottom: 1,
  },
  worldLabel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  worldSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  rightCol: {
    alignItems: 'flex-end',
    gap: 5,
    flexShrink: 0,
  },
  yourPathBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  yourPathText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    color: '#000',
    letterSpacing: 0.8,
  },
  completeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  completeBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'visible',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressTip: {
    position: 'absolute',
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    minWidth: 32,
    textAlign: 'right',
  },
});

// ─── NODE STYLES ─────────────────────────────────────────────────────────────

const nodeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    maxWidth: 140,
    paddingVertical: 4,
  },

  // Path line system — sits above each node (except first)
  pathLineWrap: {
    width: 3,
    height: 28,
    marginBottom: 4,
    position: 'relative',
    alignItems: 'center',
  },
  pathTrack: {
    position: 'absolute',
    width: 3,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  pathFill: {
    position: 'absolute',
    width: 3,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },

  // Outer pulse ring — only visible on next node
  glowRingOuter: {
    position: 'absolute',
    borderWidth: 2,
    zIndex: -1,
  },

  nodeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  nodeNum: {
    fontFamily: 'Inter_700Bold',
  },

  // START badge
  startBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  startDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#000',
    opacity: 0.6,
  },
  startBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#000',
    letterSpacing: 1.2,
  },

  label: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 16,
    maxWidth: 110,
  },

  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  xpText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.warning,
  },
});
