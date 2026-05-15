import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchContentCards, type ContentCard } from '@/lib/supabase';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ErrorState, SkeletonCard } from '@/components/SkeletonLoader';
import { ClutchrHeader } from '@/components/ClutchrHeader';

// ─── LOCKER GROUPS ──────────────────────────────────────────────────────────

type LockerGroup = 'dugout' | 'bullpen' | 'grind';

const LOCKER_GROUPS: Record<LockerGroup, {
  label: string;
  shortLabel: string;
  subtitle: string;
  emptyTitle: string;
  emptyText: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  dugout: {
    label: 'Dugout',
    shortLabel: 'Dugout',
    subtitle: 'Hitting, offense, baserunning, team IQ.',
    emptyTitle: 'No Dugout tools yet.',
    emptyText: 'Add hitting, baserunning, team IQ, or player-habit resources here.',
    icon: 'baseball-outline',
  },
  bullpen: {
    label: 'Bullpen',
    shortLabel: 'Bullpen',
    subtitle: 'Pitching, catching, throwing, arm care.',
    emptyTitle: 'No Bullpen tools yet.',
    emptyText: 'Add pitching, catching, throwing, or arm-care resources here.',
    icon: 'radio-outline',
  },
  grind: {
    label: 'The Grind',
    shortLabel: 'Grind',
    subtitle: 'Recovery, strength, standards, work ethic.',
    emptyTitle: 'No Grind tools yet.',
    emptyText: 'Add recovery, strength, readiness, or standards resources here.',
    icon: 'barbell-outline',
  },
};

const GROUP_ORDER: LockerGroup[] = ['dugout', 'bullpen', 'grind'];

const BULLPEN_TOKENS = [
  'pitcher', 'pitching', 'mound', 'bullpen', 'catcher', 'catching', 'battery',
  'throwing', 'arm care', 'arm_care', 'command', 'pitch calling', 'pitch_calling',
  'pre throw', 'pre-throw', 'post throw', 'post-throw', 'velocity', 'fastball',
  'slider', 'changeup', 'receiving', 'blocking',
];

const GRIND_TOKENS = [
  'strength', 'workout', 'workouts', 'recovery', 'readiness', 'mobility',
  'soreness', 'sleep', 'discipline', 'standards', 'work ethic', 'work_ethic',
  'return to throw', 'return_to_throw', 'nutrition', 'fuel', 'bodyweight',
  'leadership', 'habits', 'routine', 'routines', 'built different', 'dynamic warmup',
];

const DUGOUT_TOKENS = [
  'hitter', 'hitting', 'offense', 'offensive', 'baserunning', 'baserunner',
  'base running', 'team', 'dugout', 'baseball iq', 'baseball_iq', 'approach',
  'pitch recognition', 'pitch_recognition', 'swing', 'at bat', 'ab', 'plate',
  'lineup', 'quality ab', 'leadership', 'player habits',
];

const BULLPEN_PRIORITY_TOKENS = ['pitch', 'catch', 'throw', 'arm care', 'arm_care', 'mound', 'bullpen', 'battery'];
const GRIND_PRIORITY_TOKENS = ['strength', 'recovery', 'readiness', 'nutrition', 'fuel', 'workout', 'mobility', 'sleep', 'standards', 'bodyweight', 'warmup'];
const DUGOUT_PRIORITY_TOKENS = ['hit', 'offense', 'baserun', 'base running', 'baseball iq', 'swing', 'at bat', 'plate', 'lineup'];

function normalizeValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(normalizeValue).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(normalizeValue).join(' ');
  return String(value ?? '').toLowerCase().replace(/[_-]+/g, ' ');
}

function cardSearchText(card: ContentCard): string {
  const raw = card as ContentCard & Record<string, unknown>;
  return [
    raw.title,
    raw.summary,
    raw.body_markdown,
    raw.body,
    raw.description,
    raw.tags,
    raw.role_tags,
    raw.skill_tags,
    raw.season_tags,
    raw.content_category,
    raw.lesson_family,
    raw.card_type,
  ].map(normalizeValue).join(' ');
}

function tokenScore(text: string, tokens: string[]) {
  return tokens.reduce((score, token) => (text.includes(normalizeValue(token)) ? score + 1 : score), 0);
}

function hasPriorityToken(text: string, tokens: string[]) {
  return tokens.some((token) => text.includes(normalizeValue(token)));
}

export function inferLockerGroup(card: ContentCard): LockerGroup {
  const raw = card as ContentCard & { resource_group?: string | null };
  const explicit = normalizeValue(raw.resource_group).trim();
  if (['dugout', 'bullpen'].includes(explicit)) return explicit as LockerGroup;
  if (['grind', 'the grind', 'the_grind'].includes(explicit)) return 'grind';

  const text = cardSearchText(card);
  const scores: Record<LockerGroup, number> = {
    bullpen: tokenScore(text, BULLPEN_TOKENS),
    grind: tokenScore(text, GRIND_TOKENS),
    dugout: tokenScore(text, DUGOUT_TOKENS),
  };

  if (scores.bullpen > 0 && hasPriorityToken(text, BULLPEN_PRIORITY_TOKENS)) return 'bullpen';
  if (scores.grind > 0 && hasPriorityToken(text, GRIND_PRIORITY_TOKENS)) return 'grind';
  if (scores.dugout > 0 && hasPriorityToken(text, DUGOUT_PRIORITY_TOKENS)) return 'dugout';

  const topScore = Math.max(scores.bullpen, scores.grind, scores.dugout);
  if (topScore === 0) return 'dugout';
  if (scores.bullpen === topScore) return 'bullpen';
  if (scores.grind === topScore) return 'grind';
  return 'dugout';
}

// ─── ICON + COLOR per card type ───────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  article:  { icon: 'document-text', color: Colors.primary,  bg: Colors.primaryMuted },
  exercise: { icon: 'barbell',       color: Colors.warning,  bg: 'rgba(245,166,35,0.12)' },
  video:    { icon: 'play-circle',   color: Colors.info,     bg: 'rgba(10,132,255,0.12)' },
  audio:    { icon: 'headset',       color: Colors.purple,   bg: 'rgba(191,90,242,0.12)' },
  image:    { icon: 'image',         color: Colors.danger,   bg: 'rgba(255,59,48,0.10)' },
};

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function LockerScreen() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeGroup, setActiveGroup] = useState<LockerGroup>('dugout');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await fetchContentCards({ limit: 75 });
      setCards(data);
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const searchedCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return cards;
    return cards.filter((card) => cardSearchText(card).includes(query));
  }, [cards, search]);

  const cardsByGroup = useMemo(() => {
    return GROUP_ORDER.reduce((acc, group) => {
      acc[group] = searchedCards.filter((card) => inferLockerGroup(card) === group);
      return acc;
    }, {} as Record<LockerGroup, ContentCard[]>);
  }, [searchedCards]);

  const activeConfig = LOCKER_GROUPS[activeGroup];
  const filtered = cardsByGroup[activeGroup] ?? [];
  const featured = filtered.filter((c) => c.is_featured).slice(0, 3);
  const featuredIds = new Set(featured.map((c) => c.id));
  const rest = filtered.filter((c) => !featuredIds.has(c.id));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <Image
        source={require('../../assets/branding/simplified-wordmark.png')}
        style={styles.lockerHeaderWordmark}
        resizeMode="contain"
      />
      <ClutchrHeader
        variant="mainTab"
        kicker="RESOURCES"
        title="Locker"
        subtitle="Dugout tools. Bullpen cues. Grind support."
      />

      {/* ── SEARCH ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={15} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search tools, cues, clips..."
          placeholderTextColor={Colors.textTertiary}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={12}>
            <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* ── PRIMARY LOCKER TABS ── */}
      <View style={lockerTabStyles.container}>
        <View style={lockerTabStyles.content}>
          {GROUP_ORDER.map((group) => {
            const tab = LOCKER_GROUPS[group];
            const isActive = activeGroup === group;
            const count = cardsByGroup[group]?.length ?? 0;
            return (
              <Pressable
                key={group}
                style={[lockerTabStyles.tab, isActive && lockerTabStyles.tabActive]}
                onPress={() => setActiveGroup(group)}
              >
                <Text style={[lockerTabStyles.label, isActive && lockerTabStyles.labelActive]}>
                  {tab.label}
                </Text>
                {isActive ? (
                  <Text style={lockerTabStyles.count}>{count} tools</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── CONTENT ── */}
      {loadError ? (
        <ErrorState message="Could not load locker tools." onRetry={fetchData} />
      ) : loading ? (
        <View style={[styles.loader, { paddingHorizontal: 16, paddingTop: 12 }]}>
          {[0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introCard}>
            <LinearGradient
              colors={[Colors.primary + '22', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Image
              source={require('../../assets/branding/monochrome-c.png')}
              style={styles.introBrandMark}
              resizeMode="contain"
            />
            <View style={styles.introCopy}>
              <Text style={styles.introTitle}>{activeConfig.label}</Text>
              <Text style={styles.introSubtitle}>{activeConfig.subtitle}</Text>
            </View>
            <View style={styles.introCount}>
              <Text style={styles.introCountValue}>{filtered.length}</Text>
              <Text style={styles.introCountLabel}>TOOLS</Text>
            </View>
          </View>

          {featured.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionKicker}>READY REFERENCE</Text>
                <Text style={styles.sectionCount}>{featured.length}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredRow}
              >
                {featured.map((card) => (
                  <FeaturedCard key={card.id} card={card} onOpen={() => router.push(`/content/${card.id}`)} />
                ))}
              </ScrollView>
            </View>
          )}

          {rest.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionKicker}>{activeConfig.shortLabel.toUpperCase()} TOOLS</Text>
                <Text style={styles.sectionCount}>{rest.length}</Text>
              </View>
              <View style={styles.cardList}>
                {rest.map((card) => (
                  <ListCard key={card.id} card={card} onOpen={() => router.push(`/content/${card.id}`)} />
                ))}
              </View>
            </View>
          )}

          {filtered.length === 0 && !loading && (
            <View style={styles.empty}>
              <Image
                source={require('../../assets/branding/charcoal-c.png')}
                style={styles.emptyBrandMark}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>{activeConfig.emptyTitle}</Text>
              <Text style={styles.emptyText}>{activeConfig.emptyText}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── FEATURED CARD ────────────────────────────────────────────────────────────

function FeaturedCard({ card, onOpen }: { card: ContentCard; onOpen: () => void }) {
  const cfg = TYPE_CONFIG[card.card_type] ?? TYPE_CONFIG.article;
  return (
    <Pressable
      style={({ pressed }) => [featStyles.wrap, pressed && { opacity: 0.88 }]}
      onPress={onOpen}
    >
      {/* Gradient background using card's type color */}
      <LinearGradient
        colors={[cfg.color + '22', cfg.color + '08', Colors.surface]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={featStyles.inner}>
        {/* Type badge */}
        <View style={[featStyles.typeBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
          <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
          <Text style={[featStyles.typeText, { color: cfg.color }]}>{card.card_type.toUpperCase()}</Text>
        </View>
        <Text style={featStyles.title} numberOfLines={3}>{card.title}</Text>
        <View style={featStyles.footer}>
          <Ionicons name="time-outline" size={10} color={Colors.textTertiary} />
          <Text style={featStyles.duration}>
            {card.duration_minutes ? `${card.duration_minutes} min` : 'Quick read'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── LIST CARD ────────────────────────────────────────────────────────────────

function ListCard({ card, onOpen }: { card: ContentCard; onOpen: () => void }) {
  const cfg = TYPE_CONFIG[card.card_type] ?? TYPE_CONFIG.article;
  return (
    <Pressable
      style={({ pressed }) => [listStyles.wrap, pressed && { opacity: 0.82, transform: [{ scale: 0.99 }] }]}
      onPress={onOpen}
    >
      {/* Icon */}
      <View style={[listStyles.iconWrap, { backgroundColor: cfg.bg, borderColor: cfg.color + '30' }]}>
        <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
      </View>

      {/* Info */}
      <View style={listStyles.info}>
        <Text style={listStyles.title} numberOfLines={2}>{card.title}</Text>
        {card.summary && (
          <Text style={listStyles.summary} numberOfLines={1}>{card.summary}</Text>
        )}
        <View style={listStyles.metaRow}>
          <Text style={[listStyles.typePill, { color: cfg.color }]}>
            {card.card_type.toUpperCase()}
          </Text>
          {card.duration_minutes ? (
            <>
              <Text style={listStyles.metaDot}>·</Text>
              <Text style={listStyles.duration}>{card.duration_minutes} min</Text>
            </>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
    </Pressable>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  lockerHeaderWordmark: {
    width: 112,
    height: 24,
    marginLeft: Spacing.xl,
    marginBottom: -Spacing.sm,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
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
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  introBrandMark: {
    width: 44,
    height: 44,
    marginRight: Spacing.sm,
  },
  emptyBrandMark: {
    width: 54,
    height: 54,
    opacity: 0.7,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    padding: 0,
  },

  // Pills — KEY FIX: style is on the ScrollView itself (not contentContainer)
  // so it doesn't clip touch targets
  pillsScroll: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    flexGrow: 0,
  },
  pillsRow: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 38,
    minWidth: 76,
    paddingHorizontal: 14,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pillActive: {
    borderColor: Colors.primaryBorder,
  },
  pillActiveGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xl,
  },
  pillText: {
    // VISIBLE text — was #555 before, now proper secondary
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  pillTextActive: {
    color: Colors.primary,
  },

  // Content
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.xl,
  },

  section: { gap: Spacing.md },

  featuredRow: { gap: Spacing.sm },
  cardList: { gap: 8 },

  introCard: {
    minHeight: 112,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  introIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCopy: { flex: 1, gap: 4 },
  introTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  introSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  introCount: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(34,204,94,0.10)',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  introCountValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    lineHeight: 22,
  },
  introCountLabel: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 0.9,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionKicker: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.2,
  },
  sectionCount: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});

// ─── LOCKER TAB BAR STYLES ────────────────────────────────────────────────────

const lockerTabStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexGrow: 0,
  },
  content: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    gap: 2,
    paddingHorizontal: 6,
  },
  tabActive: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: Colors.primary,
  },
  count: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

// ─── FEATURED CARD STYLES ─────────────────────────────────────────────────────

const featStyles = StyleSheet.create({
  wrap: {
    width: 180,
    height: 160,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 18,
    flex: 1,
    marginVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  duration: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});

// ─── LIST CARD STYLES ─────────────────────────────────────────────────────────

const listStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  info: { flex: 1, gap: 3 },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  summary: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  typePill: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  metaDot: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  duration: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});
