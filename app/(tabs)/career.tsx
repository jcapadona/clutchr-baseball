import { Ionicons } from '@expo/vector-icons';
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
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── WORLD CONFIG ─────────────────────────────────────────────────────────────
// Each "world" is a phase. Lessons inside become nodes on a vertical map path.

const WORLDS = [
  {
    pillar: 'foundation',
    label: 'FOUNDATION',
    subtitle: 'Mental framework every athlete needs',
    icon: 'layers',
    color: Colors.primary,
    worldNum: 1,
    emoji: '🧠',
  },
  {
    pillar: 'built-different',
    label: 'BUILT DIFFERENT',
    subtitle: 'Strength, nutrition, sleep, arm care, durability',
    icon: 'barbell',
    color: '#E85D26',
    worldNum: 2,
    emoji: '💪',
  },
  {
    pillar: 'pitcher-path',
    label: 'PITCHER PATH',
    subtitle: 'Command, tempo, game IQ',
    icon: 'baseball',
    color: Colors.purple,
    worldNum: 3,
    emoji: '⚾',
  },
  {
    pillar: 'hitter-path',
    label: 'HITTER PATH',
    subtitle: 'Approach, zone discipline, at-bat process',
    icon: 'swap-horizontal',
    color: Colors.warning,
    worldNum: 4,
    emoji: '🏏',
  },
  {
    pillar: 'catcher-path',
    label: 'CATCHER PATH',
    subtitle: 'Leadership, game management, trust',
    icon: 'shield',
    color: Colors.info,
    worldNum: 5,
    emoji: '🛡️',
  },
  {
    pillar: 'infield-path',
    label: 'INFIELD PATH',
    subtitle: 'Fielding IQ, ready position, decisions',
    icon: 'location',
    color: Colors.danger,
    worldNum: 6,
    emoji: '🎯',
  },
  {
    pillar: 'outfield-path',
    label: 'OUTFIELD PATH',
    subtitle: 'First step reads, crow hop, tracking',
    icon: 'expand',
    color: Colors.primary,
    worldNum: 7,
    emoji: '🏃',
  },
  {
    pillar: 'baserunner-path',
    label: 'BASERUNNER PATH',
    subtitle: 'Leads, reads, green light, steal aggression',
    icon: 'flash',
    color: Colors.warning,
    worldNum: 8,
    emoji: '💨',
  },
  {
    pillar: 'pressure-resilience',
    label: 'PRESSURE & RESILIENCE',
    subtitle: 'Clutch moments, reset systems, slump repair',
    icon: 'flame',
    color: '#E85D26',
    worldNum: 9,
    emoji: '🔥',
  },
  {
    pillar: 'gamemode',
    label: 'GAME MODE',
    subtitle: 'Pregame, in-game, and postgame sessions',
    icon: 'trophy',
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

// ─── WORLD BANNER ─────────────────────────────────────────────────────────────
// The section header between lesson groups — like Duolingo's "Section X" banners

function WorldBanner({
  world,
  status,
  isMyRole,
  done,
  total,
  expanded,
  onToggle,
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
  const pct = total > 0 ? done / total : 0;

  return (
    <Pressable
      onPress={locked ? undefined : onToggle}
      disabled={locked}
      style={[
        bannerStyles.wrap,
        complete && bannerStyles.wrapComplete,
        locked && bannerStyles.wrapLocked,
        !locked && !complete && isMyRole && { borderColor: world.color + '60', borderWidth: 1.5 },
        !locked && !complete && !isMyRole && { borderColor: world.color + '30' },
      ]}
    >
      {/* Left color bar */}
      <View style={[bannerStyles.colorBar, { backgroundColor: locked ? Colors.border : world.color }]} />

      <View style={bannerStyles.inner}>
        {/* Top row: emoji + title + status */}
        <View style={bannerStyles.topRow}>
          <View style={[bannerStyles.iconCircle, {
            backgroundColor: locked ? Colors.border + '40' : world.color + '20',
            borderColor: locked ? Colors.border : world.color + '40',
          }]}>
            {locked
              ? <Ionicons name="lock-closed" size={16} color={Colors.textTertiary} />
              : complete
              ? <Ionicons name="checkmark" size={18} color={world.color} />
              : <Text style={bannerStyles.emoji}>{world.emoji}</Text>
            }
          </View>

          <View style={bannerStyles.titleBlock}>
            <View style={bannerStyles.titleRow}>
              <Text style={[bannerStyles.worldNum, { color: locked ? Colors.textTertiary : world.color }]}>
                WORLD {world.worldNum}
              </Text>
              {isMyRole && !locked && (
                <View style={[bannerStyles.badge, { backgroundColor: world.color, borderColor: world.color }]}>
                  <Text style={bannerStyles.badgeText}>YOUR PATH</Text>
                </View>
              )}
              {complete && (
                <View style={[bannerStyles.badge, { backgroundColor: Colors.primaryMuted, borderColor: Colors.primaryBorder }]}>
                  <Text style={[bannerStyles.badgeText, { color: Colors.primary }]}>COMPLETE</Text>
                </View>
              )}
            </View>
            <Text style={[bannerStyles.worldLabel, locked && { color: Colors.textTertiary }]}>
              {world.label}
            </Text>
            <Text style={[bannerStyles.worldSub, locked && { color: Colors.textTertiary }]}>
              {locked ? 'Complete previous world to unlock' : world.subtitle}
            </Text>
          </View>

          {!locked && (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Colors.textTertiary}
            />
          )}
        </View>

        {/* Progress bar */}
        {!locked && total > 0 && (
          <View style={bannerStyles.progressRow}>
            <View style={bannerStyles.progressTrack}>
              <View style={[bannerStyles.progressFill, { width: `${pct * 100}%`, backgroundColor: world.color }]} />
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

// ─── NODE (the Duolingo-style circle on the path) ────────────────────────────

function LessonNode({
  lesson, idx, isDone, isNext, isLocked, color, isLast,
}: {
  lesson: LegacyLesson;
  idx: number;
  isDone: boolean;
  isNext: boolean;
  isLocked: boolean;
  color: string;
  isLast: boolean;
}) {
  // Pulse animation for the NEXT node
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isNext) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    return () => pulseAnim.stopAnimation();
  }, [isNext]);

  // Alternating left/right offset for the winding path feel
  const isRight = idx % 3 === 0;
  const isMid = idx % 3 === 1;
  const offsetStyle = isRight
    ? { alignSelf: 'flex-end' as const, marginRight: 24 }
    : isMid
    ? { alignSelf: 'center' as const }
    : { alignSelf: 'flex-start' as const, marginLeft: 24 };

  const isBoss = lesson.is_boss;
  const isCheckpoint = lesson.is_checkpoint;

  // Node size: boss = bigger
  const nodeSize = isBoss ? 68 : 56;
  const circleColor = isDone ? color : isNext ? color + '22' : Colors.surface;
  const borderColor = isDone ? color : isNext ? color : isLocked ? Colors.border : Colors.border + '80';

  return (
    <View style={[nodeStyles.container, offsetStyle]}>
      {/* Connector line above (except first node) */}
      {idx > 0 && (
        <View style={[nodeStyles.connector, { backgroundColor: isDone ? color + '60' : Colors.border + '40' }]} />
      )}

      <Pressable
        onPress={isLocked ? undefined : () => router.push(`/lesson/${lesson.id}`)}
        disabled={isLocked}
      >
        <Animated.View
          style={[
            nodeStyles.nodeWrap,
            { width: nodeSize + 16, height: nodeSize + 16, borderRadius: (nodeSize + 16) / 2 },
            isNext && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {/* Outer glow ring for NEXT */}
          {isNext && (
            <View style={[
              nodeStyles.glowRing,
              {
                width: nodeSize + 16,
                height: nodeSize + 16,
                borderRadius: (nodeSize + 16) / 2,
                borderColor: color + '30',
              },
            ]} />
          )}

          {/* Main circle */}
          <View style={[
            nodeStyles.circle,
            {
              width: nodeSize,
              height: nodeSize,
              borderRadius: nodeSize / 2,
              backgroundColor: circleColor,
              borderColor: borderColor,
              borderWidth: isNext ? 2.5 : isDone ? 0 : 1.5,
            },
            isBoss && !isDone && { borderColor: Colors.warning, backgroundColor: Colors.warningMuted },
            isCheckpoint && !isDone && !isBoss && { borderColor: Colors.info, backgroundColor: Colors.infoMuted },
            isLocked && { opacity: 0.3 },
          ]}>
            {isDone ? (
              <Ionicons name="checkmark" size={isBoss ? 24 : 20} color="#fff" />
            ) : isBoss ? (
              <Ionicons name="trophy" size={22} color={Colors.warning} />
            ) : isCheckpoint ? (
              <Ionicons name="flag" size={18} color={Colors.info} />
            ) : isLocked ? (
              <Ionicons name="lock-closed" size={16} color={Colors.textTertiary} />
            ) : (
              <Text style={[nodeStyles.nodeNum, { color: isNext ? color : Colors.textTertiary }]}>
                {idx + 1}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* NEXT badge below the circle */}
        {isNext && (
          <View style={[nodeStyles.nextBadge, { backgroundColor: color }]}>
            <Text style={nodeStyles.nextBadgeText}>START</Text>
          </View>
        )}

        {/* BOSS badge */}
        {isBoss && !isDone && (
          <View style={[nodeStyles.nextBadge, { backgroundColor: Colors.warning }]}>
            <Text style={nodeStyles.nextBadgeText}>BOSS</Text>
          </View>
        )}
      </Pressable>

      {/* Lesson title below node */}
      <Text
        style={[
          nodeStyles.label,
          isDone && { color: Colors.textTertiary },
          isNext && { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
          isLocked && { color: Colors.textTertiary, opacity: 0.4 },
        ]}
        numberOfLines={2}
      >
        {lesson.title}
      </Text>

      {/* XP badge */}
      {!isLocked && (
        <View style={nodeStyles.xpBadge}>
          <Ionicons name="flash" size={9} color={Colors.warning} />
          <Text style={nodeStyles.xpText}>+{lesson.xp_reward}</Text>
        </View>
      )}
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

  // Auto-expand active worlds on load
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
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>CAREER PATH</Text>
          <Text style={styles.headerSub}>
            {athleteState?.first_name} · {totalDone} lessons complete
          </Text>
        </View>
        <View style={styles.xpBadge}>
          <Ionicons name="flash" size={13} color={Colors.warning} />
          <Text style={styles.xpText}>{athleteState?.total_xp ?? 0} XP</Text>
        </View>
      </View>

      {/* OVERALL PROGRESS */}
      <View style={styles.progressStrip}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${overallPct}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{overallPct}% overall</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {WORLDS.map((world, idx) => {
          const worldLessons = lessons.filter((l) => l.pillar_id === world.pillar);
          const worldDone = worldLessons.filter((l) => completed.includes(l.id)).length;
          const status = getWorldStatus(lessons, completed, idx);
          const isOpen = expanded.has(world.pillar);

          return (
            <View key={world.pillar}>
              {/* World banner */}
              <WorldBanner
                world={world}
                status={status}
                isMyRole={myPillar === world.pillar}
                done={worldDone}
                total={worldLessons.length}
                expanded={isOpen}
                onToggle={() => toggle(world.pillar)}
              />

              {/* Lesson nodes — Duolingo winding path */}
              {isOpen && status !== 'locked' && (
                <View style={styles.pathContainer}>
                  {worldLessons.length === 0 ? (
                    <View style={styles.emptyWorld}>
                      <Text style={styles.emptyText}>Lessons coming soon.</Text>
                    </View>
                  ) : (
                    <>
                      {worldLessons.map((lesson, i) => {
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
                            isLast={i === worldLessons.length - 1}
                          />
                        );
                      })}
                    </>
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

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 1 },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, marginTop: 2 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warningMuted, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.pill },
  xpText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.warning },

  progressStrip: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, gap: 5 },
  progressTrack: { height: 3, backgroundColor: Colors.border, borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  progressLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  scroll: { paddingTop: Spacing.sm },

  // Path container — full width so nodes can position themselves
  pathContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: 4,
  },

  worldDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.xl, marginVertical: Spacing.sm, opacity: 0.4 },

  emptyWorld: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
});

// ─── WORLD BANNER STYLES ──────────────────────────────────────────────────────

const bannerStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  wrapComplete: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryGlow },
  wrapLocked: { opacity: 0.5 },

  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },

  inner: { paddingLeft: 16, paddingRight: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },

  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  emoji: { fontSize: 20 },

  titleBlock: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },

  worldNum: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  worldLabel: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 0.5 },
  worldSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 16 },

  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.pill, borderWidth: 1 },
  badgeText: { fontSize: 8, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, color: '#fff' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressTrack: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', minWidth: 28, textAlign: 'right' },
});

// ─── NODE STYLES ──────────────────────────────────────────────────────────────

const nodeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 4,
    maxWidth: 120,
  },

  connector: {
    width: 2,
    height: 20,
    marginBottom: 2,
  },

  nodeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  glowRing: {
    position: 'absolute',
    borderWidth: 2,
  },

  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  nodeNum: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },

  nextBadge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  nextBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 1,
  },

  label: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 15,
    maxWidth: 100,
  },

  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 3,
  },
  xpText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.warning,
  },
});
