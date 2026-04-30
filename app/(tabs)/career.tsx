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
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── WORLD CONFIG ─────────────────────────────────────────────────────────────

const WORLDS = [
  { pillar: 'foundation',         label: 'Foundation',          subtitle: 'Mental framework every athlete needs', color: Colors.primary,  worldNum: 1,  emoji: '🧠', darkBg: '#071409' },
  { pillar: 'built-different',    label: 'Built Different',     subtitle: 'Strength, nutrition, sleep, arm care', color: '#E85D26',       worldNum: 2,  emoji: '💪', darkBg: '#140A05' },
  { pillar: 'pitcher-path',       label: 'Pitcher Path',        subtitle: 'Command, tempo, game IQ',              color: Colors.purple,   worldNum: 3,  emoji: '⚾', darkBg: '#0F0714' },
  { pillar: 'hitter-path',        label: 'Hitter Path',         subtitle: 'Approach, zone discipline, at-bat',    color: Colors.warning,  worldNum: 4,  emoji: '🏏', darkBg: '#141008' },
  { pillar: 'catcher-path',       label: 'Catcher Path',        subtitle: 'Leadership, game management, trust',   color: Colors.info,     worldNum: 5,  emoji: '🛡️', darkBg: '#060C18' },
  { pillar: 'infield-path',       label: 'Infield Path',        subtitle: 'Fielding IQ, ready position, decisions', color: Colors.danger, worldNum: 6,  emoji: '🎯', darkBg: '#140606' },
  { pillar: 'outfield-path',      label: 'Outfield Path',       subtitle: 'First step reads, crow hop, tracking', color: Colors.primary,  worldNum: 7,  emoji: '🏃', darkBg: '#071409' },
  { pillar: 'baserunner-path',    label: 'Baserunner Path',     subtitle: 'Leads, reads, green light, aggression', color: Colors.warning, worldNum: 8,  emoji: '💨', darkBg: '#141008' },
  { pillar: 'pressure-resilience', label: 'Pressure & Resilience', subtitle: 'Clutch moments, reset, slump repair', color: '#E85D26',    worldNum: 9,  emoji: '🔥', darkBg: '#140A05' },
  { pillar: 'gamemode',           label: 'Game Mode',           subtitle: 'Pregame, in-game, postgame sessions',  color: Colors.warning,  worldNum: 10, emoji: '🏆', darkBg: '#141008' },
];

const ROLE_PILLAR: Record<string, string> = {
  pitcher: 'pitcher-path', catcher: 'catcher-path',
  infielder: 'infield-path', outfielder: 'outfield-path',
};

function getWorldStatus(lessons: LegacyLesson[], completed: string[], idx: number): 'locked' | 'active' | 'complete' {
  const pillar = WORLDS[idx].pillar;
  const mine = lessons.filter((l) => l.pillar_id === pillar);
  if (idx === 0) return mine.length > 0 && mine.every((l) => completed.includes(l.id)) ? 'complete' : 'active';
  const prev = lessons.filter((l) => l.pillar_id === WORLDS[idx - 1].pillar);
  if (!prev.some((l) => completed.includes(l.id))) return 'locked';
  return mine.length > 0 && mine.every((l) => completed.includes(l.id)) ? 'complete' : 'active';
}

// ─── WORLD BANNER ─────────────────────────────────────────────────────────────
// Redesigned to feel like a game level select

function WorldBanner({ world, status, isMyRole, done, total, expanded, onToggle }: {
  world: typeof WORLDS[0]; status: 'locked' | 'active' | 'complete';
  isMyRole: boolean; done: number; total: number;
  expanded: boolean; onToggle: () => void;
}) {
  const locked = status === 'locked';
  const complete = status === 'complete';
  const pct = total > 0 ? Math.min(1, done / total) : 0;

  return (
    <Pressable
      onPress={locked ? undefined : onToggle}
      disabled={locked}
      style={[bannerStyles.outer, locked && { opacity: 0.4 }]}
    >
      {/* Full card gradient background */}
      {!locked ? (
        <LinearGradient
          colors={[world.color + '18', world.color + '06', Colors.surface]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
      )}

      {/* Left color slab — thick and bold */}
      <View style={[bannerStyles.leftSlab, { backgroundColor: locked ? Colors.border : world.color }]} />

      <View style={bannerStyles.content}>
        {/* Top: world number + emoji + right side */}
        <View style={bannerStyles.topRow}>
          {/* Emoji in a circle */}
          <View style={[bannerStyles.emojiBox, {
            backgroundColor: locked ? Colors.surfaceElevated : world.color + '20',
            borderColor: locked ? Colors.border : world.color + '40',
          }]}>
            {locked
              ? <Ionicons name="lock-closed" size={18} color={Colors.textTertiary} />
              : complete
              ? <Text style={bannerStyles.emojiText}>✅</Text>
              : <Text style={bannerStyles.emojiText}>{world.emoji}</Text>
            }
          </View>

          {/* Title */}
          <View style={bannerStyles.titleCol}>
            <Text style={[bannerStyles.worldNum, { color: locked ? Colors.textTertiary : world.color }]}>
              WORLD {world.worldNum}
            </Text>
            <Text style={[bannerStyles.worldName, locked && { color: Colors.textTertiary }]}>
              {world.label}
            </Text>
            <Text style={[bannerStyles.worldSub, locked && { color: Colors.textTertiary + '60' }]}>
              {locked ? 'Complete previous world to unlock' : world.subtitle}
            </Text>
          </View>

          {/* Right badges + chevron */}
          <View style={bannerStyles.rightStack}>
            {isMyRole && !locked && (
              <View style={[bannerStyles.yourPathTag, { backgroundColor: world.color }]}>
                <Text style={bannerStyles.yourPathTagText}>YOUR PATH</Text>
              </View>
            )}
            {complete && (
              <View style={[bannerStyles.doneTag, { borderColor: world.color + '60' }]}>
                <Text style={[bannerStyles.doneTagText, { color: world.color }]}>DONE</Text>
              </View>
            )}
            {!locked && (
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={16} color={Colors.textTertiary}
              />
            )}
          </View>
        </View>

        {/* Progress */}
        {!locked && total > 0 && (
          <View style={bannerStyles.progressRow}>
            <View style={bannerStyles.progressTrack}>
              <View style={[bannerStyles.progressFill, { width: `${pct * 100}%`, backgroundColor: world.color }]} />
              {pct > 0 && pct < 1 && (
                <View style={[bannerStyles.progressTip, {
                  left: `${Math.min(97, pct * 100)}%` as any,
                  backgroundColor: world.color,
                  shadowColor: world.color,
                }]} />
              )}
            </View>
            <Text style={[bannerStyles.progressCount, { color: world.color }]}>{done}/{total}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── WORLD MAP SECTION ────────────────────────────────────────────────────────
// The open world — atmospheric background + center spine + zigzag nodes

function WorldMapSection({ world, lessons, completed }: {
  world: typeof WORLDS[0];
  lessons: LegacyLesson[];
  completed: string[];
}) {
  if (lessons.length === 0) {
    return (
      <View style={mapStyles.emptyWrap}>
        <Text style={mapStyles.emptyText}>Lessons coming soon.</Text>
      </View>
    );
  }

  return (
    <View style={mapStyles.outerWrap}>
      {/* Atmospheric tinted background for the whole world section */}
      <LinearGradient
        colors={[world.darkBg, Colors.background, Colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      {/* Center spine — the actual PATH running top to bottom */}
      <View style={mapStyles.spineWrap}>
        <View style={[mapStyles.spine, { backgroundColor: world.color + '20' }]} />
      </View>

      {/* Nodes */}
      <View style={mapStyles.nodesWrap}>
        {lessons.map((lesson, i) => {
          const isDone = completed.includes(lesson.id);
          const isNext = !isDone && lessons.slice(0, i).every((l) => completed.includes(l.id));
          const isLocked = i > 0 && !completed.includes(lessons[i - 1].id) && !isDone;
          return (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              idx={i}
              isDone={isDone}
              isNext={isNext}
              isLocked={isLocked}
              color={world.color}
              total={lessons.length}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── LESSON NODE ─────────────────────────────────────────────────────────────

function LessonNode({ lesson, idx, isDone, isNext, isLocked, color, total }: {
  lesson: LegacyLesson; idx: number; isDone: boolean;
  isNext: boolean; isLocked: boolean; color: string; total: number;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!isNext) return;
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.3, duration: 1100, useNativeDriver: true }),
    ])).start();
    return () => { pulseAnim.stopAnimation(); glowAnim.stopAnimation(); };
  }, [isNext]);

  // Simple left/center/right — wider swing so it reads on screen
  const pos = idx % 3;
  const NODE_SIZE = lesson.is_boss ? 76 : 62;

  const align = pos === 0 ? 'flex-end' : pos === 1 ? 'center' : 'flex-start';
  const marginRight = pos === 0 ? 20 : 0;
  const marginLeft = pos === 2 ? 20 : 0;

  return (
    <View style={[nodeStyles.rowWrap, { alignItems: align, marginRight, marginLeft }]}>
      {/* Connector line from previous node — centered above this node */}
      {idx > 0 && (
        <View style={[nodeStyles.connector, {
          backgroundColor: isDone ? color + '70' : Colors.border + '50',
        }]} />
      )}
      <Pressable
        onPress={isLocked ? undefined : () => router.push(`/lesson/${lesson.id}`)}
        disabled={isLocked}
        style={{ alignItems: 'center', opacity: isLocked ? 0.3 : 1 }}
      >
        {/* Outer glow ring for next node */}
        {isNext && (
          <Animated.View style={[
            nodeStyles.glowRing,
            {
              width: NODE_SIZE + 24,
              height: NODE_SIZE + 24,
              borderRadius: (NODE_SIZE + 24) / 2,
              borderColor: color + '35',
              opacity: glowAnim,
            },
          ]} />
        )}

        {/* Node circle */}
        <Animated.View style={[
          nodeStyles.circle,
          {
            width: NODE_SIZE,
            height: NODE_SIZE,
            borderRadius: NODE_SIZE / 2,
          },
          isNext && { transform: [{ scale: pulseAnim }] },
        ]}>
          {/* Circle fill */}
          {isDone ? (
            <View style={[nodeStyles.circleFill, {
              width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
              backgroundColor: color,
            }]}>
              <Ionicons name="checkmark" size={lesson.is_boss ? 28 : 22} color="#000" />
            </View>
          ) : isNext ? (
            <View style={[nodeStyles.circleFill, {
              width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
              backgroundColor: color + '18',
              borderWidth: 2.5, borderColor: color,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 14,
              elevation: 8,
            }]}>
              {lesson.is_boss
                ? <Ionicons name="trophy" size={24} color={color} />
                : lesson.is_checkpoint
                ? <Ionicons name="flag" size={20} color={color} />
                : <Text style={[nodeStyles.nodeNum, { color }]}>{idx + 1}</Text>
              }
            </View>
          ) : lesson.is_boss ? (
            <View style={[nodeStyles.circleFill, {
              width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
              backgroundColor: Colors.warningMuted,
              borderWidth: 1.5, borderColor: Colors.warning + '60',
              shadowColor: Colors.warning,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
            }]}>
              <Ionicons name="trophy" size={24} color={Colors.warning} />
            </View>
          ) : lesson.is_checkpoint ? (
            <View style={[nodeStyles.circleFill, {
              width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
              backgroundColor: Colors.infoMuted,
              borderWidth: 1.5, borderColor: Colors.info + '60',
            }]}>
              <Ionicons name="flag" size={20} color={Colors.info} />
            </View>
          ) : (
            <View style={[nodeStyles.circleFill, {
              width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
              backgroundColor: Colors.surfaceElevated,
              borderWidth: 1.5, borderColor: Colors.border,
            }]}>
              <Text style={[nodeStyles.nodeNum, { color: Colors.textTertiary }]}>{idx + 1}</Text>
            </View>
          )}
        </Animated.View>

        {/* START badge on next node */}
        {isNext && (
          <View style={[nodeStyles.badge, { backgroundColor: color, shadowColor: color }]}>
            <View style={nodeStyles.badgeDot} />
            <Text style={nodeStyles.badgeText}>START</Text>
          </View>
        )}

        {/* BOSS label */}
        {lesson.is_boss && !isDone && !isNext && (
          <View style={[nodeStyles.badge, { backgroundColor: Colors.warning, shadowColor: Colors.warning }]}>
            <Ionicons name="trophy" size={8} color="#000" />
            <Text style={nodeStyles.badgeText}>BOSS</Text>
          </View>
        )}

        {/* Title */}
        <Text style={[
          nodeStyles.label,
          isDone && { color: Colors.textTertiary },
          isNext && { color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
        ]} numberOfLines={2}>
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

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR JOURNEY</Text>
          <Text style={styles.title}>Career Path</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.xpPill}>
            <Ionicons name="flash" size={12} color={Colors.warning} />
            <Text style={styles.xpNum}>{athleteState?.total_xp ?? 0}</Text>
          </View>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>

      {/* OVERALL PROGRESS */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${overallPct}%` }]} />
        </View>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>{totalDone} of {totalAll} lessons</Text>
          <Text style={styles.progressPct}>{overallPct}%</Text>
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
            <View key={world.pillar} style={styles.worldBlock}>
              <WorldBanner
                world={world}
                status={status}
                isMyRole={myPillar === world.pillar}
                done={worldDone}
                total={worldLessons.length}
                expanded={isOpen}
                onToggle={() => toggle(world.pillar)}
              />

              {isOpen && status !== 'locked' && (
                <WorldMapSection
                  world={world}
                  lessons={worldLessons}
                  completed={completed}
                />
              )}
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

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  eyebrow: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 2, marginBottom: 3 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: -0.3 },
  headerRight: { alignItems: 'flex-end', paddingTop: 4, gap: 1 },
  xpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warningMuted, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: 'rgba(245,166,35,0.28)',
  },
  xpNum: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.warning },
  xpLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },

  progressWrap: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, gap: 6 },
  progressTrack: { height: 3, backgroundColor: Colors.surfaceElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill: {
    height: 3, backgroundColor: Colors.primary, borderRadius: 2,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
  },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  progressPct: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  scroll: { gap: 2 },
  worldBlock: {},
});

// ─── BANNER STYLES ────────────────────────────────────────────────────────────

const bannerStyles = StyleSheet.create({
  outer: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  leftSlab: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 5,
    borderTopLeftRadius: Radius.xl,
    borderBottomLeftRadius: Radius.xl,
  },
  content: {
    paddingLeft: 22, paddingRight: Spacing.md, paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  emojiBox: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  emojiText: { fontSize: 26 },
  titleCol: { flex: 1, gap: 2 },
  worldNum: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.8, marginBottom: 1 },
  worldName: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 0.1 },
  worldSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 16 },
  rightStack: { alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  yourPathTag: {
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  yourPathTagText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#000', letterSpacing: 0.8 },
  doneTag: {
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  doneTagText: { fontSize: 8, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressTrack: {
    flex: 1, height: 4, backgroundColor: Colors.surfaceElevated,
    borderRadius: 2, overflow: 'visible',
  },
  progressFill: { height: 4, borderRadius: 2 },
  progressTip: {
    position: 'absolute', top: -2, width: 8, height: 8, borderRadius: 4,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6,
  },
  progressCount: { fontSize: 10, fontFamily: 'Inter_700Bold', minWidth: 32, textAlign: 'right' },
});

// ─── MAP STYLES ───────────────────────────────────────────────────────────────

const mapStyles = StyleSheet.create({
  outerWrap: {
    marginTop: 0,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.border + '50',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  // The center vertical spine — REMOVED, using node connectors instead
  spineWrap: { display: 'none' },
  spine: { display: 'none' },
  nodesWrap: {
    gap: 8,
  },
  emptyWrap: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textTertiary,
  },
});

// ─── NODE STYLES ─────────────────────────────────────────────────────────────

const nodeStyles = StyleSheet.create({
  rowWrap: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  connector: {
    width: 2,
    height: 24,
    borderRadius: 1,
    marginBottom: 2,
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleFill: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nodeNum: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#000', opacity: 0.5,
  },
  badgeText: {
    fontSize: 9, fontFamily: 'Inter_700Bold', color: '#000', letterSpacing: 1.2,
  },
  label: {
    fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary,
    textAlign: 'center', marginTop: 6, lineHeight: 15, maxWidth: 110,
  },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  xpText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.warning },
});
