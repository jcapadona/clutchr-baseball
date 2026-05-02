import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import { ClutchrLogo } from '@/components/ClutchrLogo';
import { VoltChip } from '@/components/VoltChip';
import { ErrorState, SkeletonCard } from '@/components/SkeletonLoader';

// ─── WORLD CONFIG ─────────────────────────────────────────────────────────────

const WORLDS = [
  { pillar: 'foundation',          label: 'Foundation',           subtitle: 'Mental framework every athlete needs',   color: Colors.primary,  worldNum: 1,  emoji: '🧠', darkBg: '#071409' },
  { pillar: 'built-different',     label: 'Built Different',      subtitle: 'Strength, nutrition, sleep, arm care',   color: '#E85D26',       worldNum: 2,  emoji: '💪', darkBg: '#140A05' },
  { pillar: 'pitcher-path',        label: 'Pitcher Path',         subtitle: 'Command, tempo, game IQ',                color: Colors.purple,   worldNum: 3,  emoji: '⚾', darkBg: '#0F0714' },
  { pillar: 'hitter-path',         label: 'Hitter Path',          subtitle: 'Approach, zone discipline, at-bat',      color: Colors.warning,  worldNum: 4,  emoji: '🏏', darkBg: '#141008' },
  { pillar: 'catcher-path',        label: 'Catcher Path',         subtitle: 'Leadership, game management, trust',     color: Colors.info,     worldNum: 5,  emoji: '🛡️', darkBg: '#060C18' },
  { pillar: 'infield-path',        label: 'Infield Path',         subtitle: 'Fielding IQ, ready position, decisions', color: Colors.danger,   worldNum: 6,  emoji: '🎯', darkBg: '#140606' },
  { pillar: 'outfield-path',       label: 'Outfield Path',        subtitle: 'First step reads, crow hop, tracking',   color: Colors.primary,  worldNum: 7,  emoji: '🏃', darkBg: '#071409' },
  { pillar: 'baserunner-path',     label: 'Baserunner Path',      subtitle: 'Leads, reads, green light, aggression',  color: Colors.warning,  worldNum: 8,  emoji: '💨', darkBg: '#141008' },
  { pillar: 'pressure-resilience', label: 'Pressure & Resilience',subtitle: 'Clutch moments, reset, slump repair',    color: '#E85D26',       worldNum: 9,  emoji: '🔥', darkBg: '#140A05' },
  { pillar: 'gamemode',            label: 'Game Mode',            subtitle: 'Pregame, in-game, postgame sessions',    color: Colors.warning,  worldNum: 10, emoji: '🏆', darkBg: '#141008' },
];

const ROLE_PILLAR: Record<string, string> = {
  pitcher: 'pitcher-path', catcher: 'catcher-path',
  infielder: 'infield-path', outfielder: 'outfield-path',
};

// ─── PER-WORLD DESIGN TOKENS ──────────────────────────────────────────────────

const WORLD_COLOR: Record<string, string> = {
  'foundation':          '#22CC5E',
  'built-different':     '#E85D26',
  'pitcher-path':        '#BF5AF2',
  'hitter-path':         '#F5A623',
  'catcher-path':        '#0A84FF',
  'infield-path':        '#FF3B30',
  'outfield-path':       '#34C759',
  'baserunner-path':     '#FF9F0A',
  'pressure-resilience': '#FF6B6B',
  'gamemode':            '#FFD60A',
};

const WORLD_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'foundation':          'shield-outline',
  'built-different':     'flash-outline',
  'pitcher-path':        'radio-button-on-outline',
  'hitter-path':         'diamond-outline',
  'catcher-path':        'disc-outline',
  'infield-path':        'triangle-outline',
  'outfield-path':       'water-outline',
  'baserunner-path':     'arrow-forward-circle-outline',
  'pressure-resilience': 'scan-outline',
  'gamemode':            'grid-outline',
};

const WORLD_DESCRIPTIONS: Record<string, string> = {
  'foundation':          'Builds the mental framework every competitor needs before stepping into the box or on the mound.',
  'built-different':     'Trains the physical foundation — strength, nutrition, sleep discipline, and arm longevity.',
  'pitcher-path':        'Develops command, tempo control, and in-game IQ for pitchers at every level.',
  'hitter-path':         'Sharpens plate approach, zone discipline, and at-bat execution under pressure.',
  'catcher-path':        'Trains leadership behind the dish, game management, and pitcher-catcher trust.',
  'infield-path':        'Builds fielding IQ, ready position habits, and split-second decision making.',
  'outfield-path':       'Develops first-step reads, crow-hop mechanics, and route efficiency on fly balls.',
  'baserunner-path':     'Instills lead discipline, read-and-react instincts, and green-light aggression.',
  'pressure-resilience': 'Prepares athletes for clutch moments, slump repair, and mental reset routines.',
  'gamemode':            'Structures your pregame, in-game, and postgame mental and physical routines.',
};

const WORLD_TABS: Array<{ pillar: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = [
  { pillar: 'foundation',          label: 'BASE',  icon: 'shield-outline'          },
  { pillar: 'built-different',     label: 'BUILT', icon: 'flash-outline'           },
  { pillar: 'pitcher-path',        label: 'PITCH', icon: 'radio-button-on-outline' },
  { pillar: 'hitter-path',         label: 'HIT',   icon: 'diamond-outline'         },
  { pillar: 'catcher-path',        label: 'CATCH', icon: 'eye-outline'             },
  { pillar: 'infield-path',        label: 'INF',   icon: 'triangle-outline'        },
  { pillar: 'outfield-path',       label: 'OUT',   icon: 'partly-sunny-outline'    },
  { pillar: 'baserunner-path',     label: 'RUN',   icon: 'arrow-forward-outline'   },
  { pillar: 'pressure-resilience', label: 'PRESS', icon: 'flag-outline'            },
  { pillar: 'gamemode',            label: 'GAME',  icon: 'game-controller-outline' },
];

// Fixed star positions for background atmosphere (x: 0-390, y: 0-2100)
const STARS = [
  { x: 24,  y: 80   }, { x: 180, y: 45   }, { x: 340, y: 110  },
  { x: 60,  y: 200  }, { x: 290, y: 185  }, { x: 150, y: 320  },
  { x: 370, y: 290  }, { x: 80,  y: 440  }, { x: 220, y: 410  },
  { x: 310, y: 500  }, { x: 45,  y: 580  }, { x: 170, y: 620  },
  { x: 360, y: 650  }, { x: 100, y: 750  }, { x: 260, y: 730  },
  { x: 380, y: 820  }, { x: 30,  y: 900  }, { x: 195, y: 880  },
  { x: 320, y: 950  }, { x: 75,  y: 1040 }, { x: 240, y: 1020 },
  { x: 355, y: 1100 }, { x: 55,  y: 1200 }, { x: 175, y: 1180 },
  { x: 305, y: 1260 }, { x: 20,  y: 1350 }, { x: 210, y: 1320 },
  { x: 375, y: 1400 }, { x: 90,  y: 1480 }, { x: 250, y: 1460 },
  { x: 340, y: 1550 }, { x: 40,  y: 1640 }, { x: 185, y: 1620 },
  { x: 320, y: 1700 }, { x: 70,  y: 1790 }, { x: 230, y: 1770 },
  { x: 360, y: 1860 }, { x: 110, y: 1940 }, { x: 270, y: 1920 },
  { x: 155, y: 2050 },
];

function getWorldStatus(lessons: LegacyLesson[], completed: string[], idx: number): 'locked' | 'active' | 'complete' {
  const pillar = WORLDS[idx].pillar;
  const mine = lessons.filter((l) => l.pillar_id === pillar);
  if (idx === 0) return mine.length > 0 && mine.every((l) => completed.includes(l.id)) ? 'complete' : 'active';
  const prev = lessons.filter((l) => l.pillar_id === WORLDS[idx - 1].pillar);
  if (prev.length > 0 && !prev.some((l) => completed.includes(l.id))) return 'locked';
  return mine.length > 0 && mine.every((l) => completed.includes(l.id)) ? 'complete' : 'active';
}

function getWorldTotalXP(nodes: LegacyLesson[]): number {
  return nodes.reduce((sum, n) => sum + (n.xp_reward || 55), 0);
}

export async function triggerWorldClearCelebration(worldId: string, _color: string) {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await new Promise(r => setTimeout(r, 300));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await new Promise(r => setTimeout(r, 200));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  Alert.alert(
    '⚡ WORLD CLEARED',
    'You finished every lesson in this world.\n\nThat rep is built in. Keep stacking.',
    [{ text: "Let's go →", style: 'default' }]
  );
}

// ─── WORLD BANNER ─────────────────────────────────────────────────────────────

function WorldBanner({ world, status, isMyRole, done, total, worldLessons, expanded, onToggle, nextWorldLabel, onNextWorldPress }: {
  world: typeof WORLDS[0]; status: 'locked' | 'active' | 'complete';
  isMyRole: boolean; done: number; total: number;
  worldLessons: LegacyLesson[];
  expanded: boolean; onToggle: () => void;
  nextWorldLabel: string | null;
  onNextWorldPress?: () => void;
}) {
  const locked = status === 'locked';
  const color = WORLD_COLOR[world.pillar] ?? world.color;
  const icon = WORLD_ICON[world.pillar] ?? 'star-outline';
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  const isCleared = done > 0 && done >= total;
  const isExpanded = expanded && !locked;
  const totalXP = getWorldTotalXP(worldLessons);
  const celebrationKey = `world_cleared_${world.pillar}`;

  useEffect(() => {
    if (!isCleared) return;
    AsyncStorage.getItem(celebrationKey).then(already => {
      if (already) return;
      AsyncStorage.setItem(celebrationKey, 'true');
      triggerWorldClearCelebration(world.pillar, color);
    });
  }, [isCleared]);

  return (
    <Pressable
      onPress={locked ? undefined : onToggle}
      disabled={locked}
      style={[
        cardStyles.card,
        { borderTopColor: color },
        isExpanded && cardStyles.cardExpanded,
        locked && { opacity: 0.35 },
        isCleared && { shadowColor: color, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
      ]}
    >
      {/* Cleared world tint */}
      {isCleared && (
        <LinearGradient
          colors={[color + '25', '#0D0D12']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      )}

      <View style={cardStyles.header}>
        <View style={cardStyles.titleCol}>
          <Text style={cardStyles.worldNum}>WORLD {world.worldNum}</Text>
          <View style={cardStyles.nameRow}>
            {locked && (
              <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.35)" style={{ marginRight: 5 }} />
            )}
            <Text style={[cardStyles.worldName, { color }]}>
              {world.label.toUpperCase()}
            </Text>
          </View>
          <Text style={cardStyles.tagline}>{world.subtitle}</Text>
        </View>

        <View style={cardStyles.rightCol}>
          <Ionicons name={icon} size={20} color={color} />
          {!locked && (
            <>
              {isMyRole && !isCleared && (
                <View style={[cardStyles.yourPathBadge, { backgroundColor: color }]}>
                  <Text style={cardStyles.yourPathText}>YOUR PATH</Text>
                </View>
              )}
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="rgba(255,255,255,0.35)"
              />
            </>
          )}
        </View>
      </View>

      {/* Progress bar — active non-cleared worlds only */}
      {!locked && !isCleared && total > 0 && (
        <View style={cardStyles.progressRow}>
          <View style={cardStyles.progressTrack}>
            <View style={[cardStyles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={[cardStyles.progressCount, { color }]}>{done}/{total}</Text>
        </View>
      )}

      {/* Cleared badge row */}
      {isCleared && (
        <View style={clearedStyles.badgeRow}>
          <View style={clearedStyles.badgeLeft}>
            <View style={[clearedStyles.checkCircle, { backgroundColor: color }]}>
              <Text style={clearedStyles.checkMark}>✓</Text>
            </View>
            <Text style={[clearedStyles.clearedLabel, { color }]}>WORLD CLEARED</Text>
          </View>
          <View style={[clearedStyles.xpPill, { backgroundColor: color + '20', borderColor: color + '50' }]}>
            <Text style={[clearedStyles.xpPillText, { color }]}>⚡ {totalXP} XP</Text>
          </View>
        </View>
      )}

      {/* Next world hint */}
      {isCleared && nextWorldLabel && (
        <Pressable style={clearedStyles.nextHintRow} onPress={onNextWorldPress}>
          <Text style={clearedStyles.nextHintText}>Next: {nextWorldLabel} →</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

// ─── WORLD MAP SECTION — LEFT-SPINE VERTICAL TIMELINE ────────────────────────

function WorldMapSection({ world, lessons, completed }: {
  world: typeof WORLDS[0];
  lessons: LegacyLesson[];
  completed: string[];
}) {
  const color = WORLD_COLOR[world.pillar] ?? world.color;
  const description = WORLD_DESCRIPTIONS[world.pillar] ?? 'Train your skills and unlock your potential.';

  if (lessons.length === 0) {
    return (
      <View style={mapStyles.emptyWrap}>
        <Text style={mapStyles.emptyText}>Lessons coming soon.</Text>
      </View>
    );
  }

  return (
    <View style={mapStyles.outerWrap}>
      {/* World Guide Banner */}
      <Pressable
        style={[mapStyles.guideBanner, { backgroundColor: color + '15', borderColor: color + '40' }]}
        onPress={() => Alert.alert(world.label, description)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[mapStyles.guideBannerTitle, { color }]}>{world.label.toUpperCase()}</Text>
          <Text style={mapStyles.guideBannerTagline}>{world.subtitle}</Text>
        </View>
        <View style={[mapStyles.guidePill, { backgroundColor: color }]}>
          <Text style={mapStyles.guidePillText}>GUIDE</Text>
        </View>
      </Pressable>

      {/* Timeline container — spine is absolute inside here */}
      <View style={mapStyles.timelineContainer}>
        <View style={[mapStyles.spineLine, { backgroundColor: color }]} />

        {lessons.map((lesson, i) => {
          const isDone = completed.includes(lesson.id);
          const isNext = !isDone && lessons.slice(0, i).every((l) => completed.includes(l.id));
          const isLocked = i > 0 && !completed.includes(lessons[i - 1].id) && !isDone;
          const nodeType = (lesson as any).node_type as string | undefined;
          const isBoss = lesson.is_boss || nodeType === 'boss';
          const isCheckpoint = nodeType === 'checkpoint';

          return (
            <React.Fragment key={lesson.id}>
              {(isCheckpoint || isBoss) && (
                <View style={mapStyles.dividerWrap}>
                  <View style={[mapStyles.dividerLine, { backgroundColor: color }]} />
                  <Text style={[mapStyles.dividerLabel, { color }]}>
                    {isBoss ? 'BOSS BATTLE' : 'CHECKPOINT'}
                  </Text>
                </View>
              )}
              <TimelineNode
                lesson={lesson}
                idx={i}
                isDone={isDone}
                isNext={isNext}
                isLocked={isLocked}
                isBoss={isBoss}
                color={color}
              />
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

// ─── TIMELINE NODE ────────────────────────────────────────────────────────────

function TimelineNode({ lesson, idx, isDone, isNext, isLocked, isBoss, color }: {
  lesson: LegacyLesson; idx: number; isDone: boolean;
  isNext: boolean; isLocked: boolean; isBoss: boolean; color: string;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isNext) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isNext]);

  const nodeSize = isBoss ? 44 : 36;
  const lessonFamily =
    ((lesson as any).lesson_family as string | undefined) ??
    ((lesson as any).node_type as string | undefined) ??
    'LESSON';

  function handlePress() {
    if (isLocked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    router.push(`/lesson/${lesson.id}`);
  }

  const cardBorderColor = isNext ? color + '60' : '#1a1a1a';

  return (
    <Pressable style={tlStyles.row} onPress={handlePress}>
      {/* LEFT — 72px column, node centered on spine at x=36 */}
      <View style={tlStyles.nodeCol}>
        {isBoss && !isDone && (
          <Text style={[tlStyles.crownText, { color }]}>♛</Text>
        )}
        {isNext && (
          <View style={[tlStyles.voltMarker, { backgroundColor: color }]} />
        )}

        <Animated.View
          style={[
            tlStyles.nodeCircle,
            { width: nodeSize, height: nodeSize, borderRadius: nodeSize / 2 },
            isDone && { backgroundColor: color },
            !isDone && isNext && {
              backgroundColor: '#0D0D12',
              borderWidth: 2.5,
              borderColor: color,
              shadowColor: color,
              shadowOpacity: 0.9,
              shadowRadius: 10,
              elevation: 8,
            },
            !isDone && isLocked && {
              backgroundColor: '#111122',
              borderWidth: 1.5,
              borderColor: '#2a2a3a',
            },
            !isDone && !isNext && !isLocked && isBoss && {
              backgroundColor: '#0D0D12',
              borderWidth: 2.5,
              borderColor: color,
            },
            !isDone && !isNext && !isLocked && !isBoss && {
              backgroundColor: '#111122',
              borderWidth: 1.5,
              borderColor: '#2a2a3a',
            },
            isNext && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {isDone   ? <Text style={tlStyles.checkmark}>✓</Text>
          : isNext  ? <Text style={tlStyles.playIcon}>▶</Text>
          : isLocked? <Text style={tlStyles.lockIcon}>🔒</Text>
          :           <Text style={tlStyles.nodeNumText}>{idx + 1}</Text>}
        </Animated.View>

        {isBoss && !isDone && (
          <Text style={[tlStyles.bossBattleLabel, { color }]}>BOSS BATTLE</Text>
        )}
      </View>

      {/* RIGHT — lesson card */}
      <View style={[tlStyles.card, { borderColor: cardBorderColor }]}>
        {/* Family tag */}
        <View style={tlStyles.cardTopRow}>
          <View style={[
            tlStyles.familyPill,
            { backgroundColor: isLocked ? 'rgba(255,255,255,0.05)' : color + '20' },
          ]}>
            <Text style={[
              tlStyles.familyPillText,
              { color: isLocked ? 'rgba(255,255,255,0.25)' : color },
            ]}>
              {lessonFamily.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text
          style={[tlStyles.cardTitle, isLocked && tlStyles.cardTitleLocked]}
          numberOfLines={2}
        >
          {lesson.title}
        </Text>

        {isLocked && (
          <Text style={tlStyles.lockedHint}>Complete previous lesson to unlock</Text>
        )}

        {!isLocked && (
          <View style={tlStyles.cardBottomRow}>
            <Text style={tlStyles.xpText}>⚡ {lesson.xp_reward} XP</Text>
            <Text style={tlStyles.timeText}>~5 min</Text>
          </View>
        )}

        {/* Active bottom accent strip */}
        {isNext && (
          <View style={[tlStyles.activeStrip, { backgroundColor: color }]} />
        )}
      </View>
    </Pressable>
  );
}

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function CareerScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState } = useAthlete();
  const [lessons, setLessons] = useState<LegacyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeWorldIndex, setActiveWorldIndex] = useState(0);
  const autoSelectedRef = useRef(false);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await fetchLessons({ limit: 200 });
      setLessons(data);
    } catch (e) {
      console.error(e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const completed = athleteState?.completed_lessons ?? [];
  const myPillar = ROLE_PILLAR[athleteState?.primary_role ?? ''] ?? '';

  useEffect(() => {
    if (autoSelectedRef.current || !myPillar) return;
    const idx = WORLDS.findIndex(w => w.pillar === myPillar);
    if (idx >= 0) {
      setActiveWorldIndex(idx);
      autoSelectedRef.current = true;
    }
  }, [myPillar]);

  const totalDone = completed.length;
  const totalAll  = lessons.length;
  const overallPct = totalAll > 0 ? Math.min(100, Math.round((totalDone / totalAll) * 100)) : 0;

  const activeWorld = WORLDS[activeWorldIndex];
  const activeWorldLessons = lessons
    .filter((l) => l.pillar_id === activeWorld.pillar)
    .sort((a, b) => a.order_index - b.order_index);
  const activeWorldDone = activeWorldLessons.filter((l) => completed.includes(l.id)).length;
  const activeWorldStatus = getWorldStatus(lessons, completed, activeWorldIndex);
  const nextWorldEntry = activeWorldIndex + 1 < WORLDS.length ? WORLDS[activeWorldIndex + 1] : null;
  const nextWorldStatus = nextWorldEntry ? getWorldStatus(lessons, completed, activeWorldIndex + 1) : null;
  const activeNextWorldLabel = nextWorldEntry && nextWorldStatus !== 'complete' ? nextWorldEntry.label : null;


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ClutchrLogo />
          <Text style={styles.title}>Career Path</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.xpPill}>
            <Ionicons name="flash" size={12} color={Colors.warning} />
            <Text style={styles.xpNum}>{athleteState?.total_xp ?? 0}</Text>
            <Text style={styles.xpLabel}>XP</Text>
          </View>
          <VoltChip />
        </View>
      </View>

      {/* OVERALL PROGRESS */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${overallPct}%` as any }]} />
        </View>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>{totalDone} of {totalAll} lessons</Text>
          <Text style={styles.progressPct}>{overallPct}%</Text>
        </View>
      </View>

      {/* ── WORLD TAB BAR ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={worldTabStyles.container}
        contentContainerStyle={worldTabStyles.content}
      >
        {WORLD_TABS.map((tab, idx) => {
          const active = activeWorldIndex === idx;
          const color = WORLD_COLOR[tab.pillar] ?? '#22CC5E';
          return (
            <Pressable
              key={tab.pillar}
              style={[worldTabStyles.tab, active && { borderBottomWidth: 2, borderBottomColor: color }]}
              onPress={() => setActiveWorldIndex(idx)}
            >
              <Ionicons name={tab.icon} size={13} color={active ? color : 'rgba(255,255,255,0.35)'} />
              <Text style={[worldTabStyles.label, { color: active ? color : 'rgba(255,255,255,0.35)' }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── ACTIVE WORLD CONTENT ── */}
      {loadError ? (
        <ErrorState message="Could not load lessons." onRetry={fetchData} />
      ) : loading ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          pointerEvents="none"
        >
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </ScrollView>
      ) : (
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.worldBlock}>
          <WorldBanner
            world={activeWorld}
            status={activeWorldStatus}
            isMyRole={myPillar === activeWorld.pillar}
            done={activeWorldDone}
            total={activeWorldLessons.length}
            worldLessons={activeWorldLessons}
            expanded={true}
            onToggle={() => {}}
            nextWorldLabel={activeNextWorldLabel}
            onNextWorldPress={nextWorldEntry ? () => setActiveWorldIndex(activeWorldIndex + 1) : undefined}
          />
          {activeWorldStatus !== 'locked' && (
            <WorldMapSection
              world={activeWorld}
              lessons={activeWorldLessons}
              completed={completed}
            />
          )}
        </View>
      </ScrollView>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#080810' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080810' },
  scrollView:  { backgroundColor: '#080810' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  headerLeft:  { gap: 4 },
  title:       { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warningMuted, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: 'rgba(245,166,35,0.28)',
  },
  xpNum:   { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.warning },
  xpLabel: { fontSize: 9,  fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },

  progressWrap:  { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, gap: 8 },
  progressTrack: { height: 3, backgroundColor: Colors.surfaceElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill:  {
    height: 3, backgroundColor: Colors.primary, borderRadius: 2,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
  },
  progressMeta:  { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  progressPct:   { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  scroll:     { gap: 0, paddingTop: 8 },
  worldBlock: { marginBottom: 12 },
});

// ─── CARD STYLES (collapsed world banner — unchanged) ────────────────────────

const cardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0D0D12',
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  cardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
  },
  titleCol: { flex: 1, gap: 3 },
  worldNum: {
    fontSize: 9, fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.28)', letterSpacing: 1.8,
  },
  nameRow:   { flexDirection: 'row', alignItems: 'center' },
  worldName: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  tagline:   {
    fontSize: 11, fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.4)', lineHeight: 16,
  },
  rightCol: { alignItems: 'flex-end', gap: 8, paddingLeft: 12, flexShrink: 0 },
  yourPathBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.pill },
  yourPathText:  { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#000', letterSpacing: 0.8 },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  progressTrack: {
    flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill:  { height: 3, borderRadius: 2 },
  progressCount: { fontSize: 10, fontFamily: 'Inter_700Bold', minWidth: 32, textAlign: 'right' },
});

// ─── MAP STYLES ───────────────────────────────────────────────────────────────

const mapStyles = StyleSheet.create({
  outerWrap: {
    marginHorizontal: 16,
    backgroundColor: '#0A0A10',
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  guideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  guideBannerTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  guideBannerTagline: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  guidePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 12,
    flexShrink: 0,
  },
  guidePillText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
  timelineContainer: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  spineLine: {
    position: 'absolute',
    left: 35,
    top: 0,
    bottom: 0,
    width: 2,
    opacity: 0.5,
  },
  dividerWrap: {
    marginVertical: 8,
  },
  dividerLine: {
    height: 1,
    opacity: 0.2,
    marginLeft: 36,
    marginRight: 16,
  },
  dividerLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    marginLeft: 48,
    marginTop: 4,
    marginBottom: 4,
  },
  emptyWrap: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});

// ─── TIMELINE NODE STYLES ─────────────────────────────────────────────────────

const tlStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 16,
  },
  nodeCol: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  playIcon: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 2,
  },
  lockIcon: {
    fontSize: 12,
  },
  nodeNumText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.4)',
  },
  crownText: {
    fontSize: 14,
    marginBottom: 2,
  },
  voltMarker: {
    width: 10,
    height: 10,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    marginBottom: 6,
  },
  bossBattleLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginTop: 3,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#111118',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
  },
  familyPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  familyPillText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginTop: 4,
    lineHeight: 18,
  },
  cardTitleLocked: {
    color: 'rgba(255,255,255,0.3)',
  },
  lockedHint: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.2)',
    fontStyle: 'italic',
    marginTop: 3,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xpText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#F5A623',
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.35)',
  },
  activeStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
});

// ─── CLEARED WORLD STYLES ────────────────────────────────────────────────────

const clearedStyles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  badgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 16,
  },
  clearedLabel: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  xpPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  xpPillText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  nextHintRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  nextHintText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.35)',
  },
});

// ─── STAR STYLES ─────────────────────────────────────────────────────────────

const starStyles = StyleSheet.create({
  star: {
    position: 'absolute',
    width: 2, height: 2, borderRadius: 1,
  },
});

// ─── WORLD TAB BAR STYLES ────────────────────────────────────────────────────

const worldTabStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    flexGrow: 0,
  },
  content: {
    flexDirection: 'row',
  },
  tab: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
});
