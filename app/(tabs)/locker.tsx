import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { SectionHeader } from '@/components/ui';

// ─── RESOURCE GROUPS ──────────────────────────────────────────────────────────

type ResourceGroup = 'dugout' | 'bullpen' | 'grind';

const RESOURCE_TABS: Array<{ id: ResourceGroup; label: string; empty: string }> = [
  {
    id: 'dugout',
    label: 'Dugout',
    empty: 'No Dugout cards yet. Add hitting, baserunning, team, or Baseball IQ resources here.',
  },
  {
    id: 'bullpen',
    label: 'Bullpen',
    empty: 'No Bullpen cards yet. Add pitching, catching, throwing, or arm-care resources here.',
  },
  {
    id: 'grind',
    label: 'The Grind',
    empty: 'No Grind cards yet. Add strength, recovery, readiness, or standards resources here.',
  },
];

const RESOURCE_GROUP_ALIASES: Record<ResourceGroup, string[]> = {
  bullpen: [
    'pitcher', 'pitching', 'catcher', 'catching', 'battery', 'throwing', 'arm_care', 'arm care',
    'command', 'mound', 'bullpen',
  ],
  grind: [
    'strength', 'workout', 'recovery', 'readiness', 'mobility', 'discipline', 'standards',
    'work_ethic', 'work ethic', 'return_to_throw', 'return to throw', 'soreness', 'sleep',
  ],
  dugout: [
    'hitter', 'hitting', 'offense', 'baserunning', 'baserunner', 'team', 'leadership',
    'baseball_iq', 'baseball iq', 'approach', 'pitch_recognition', 'pitch recognition',
  ],
};

function normalizeResourceToken(value?: string | null) {
  return (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function resourceGroupFromField(value?: string | null): ResourceGroup | null {
  const normalized = normalizeResourceToken(value);
  if (['dugout', 'hitting', 'offense'].includes(normalized)) return 'dugout';
  if (['bullpen', 'pitching', 'battery'].includes(normalized)) return 'bullpen';
  if (['the_grind', 'grind', 'training', 'strength', 'recovery'].includes(normalized)) return 'grind';
  return null;
}

function cardTags(card: ContentCard) {
  return [
    ...((card.role_tags ?? []) as string[]),
    ...((card.skill_tags ?? []) as string[]),
    ...((card.season_tags ?? []) as string[]),
    card.content_category,
    card.lesson_family,
  ].filter(Boolean);
}

function inferResourceGroup(card: ContentCard): ResourceGroup {
  const explicitGroup = resourceGroupFromField(card.resource_group);
  if (explicitGroup) return explicitGroup;

  const normalizedTags = cardTags(card).map(normalizeResourceToken);
  const hasAny = (aliases: string[]) =>
    aliases.some((alias) => {
      const normalizedAlias = normalizeResourceToken(alias);
      return normalizedTags.some(
        (tag) => tag === normalizedAlias || tag.includes(`_${normalizedAlias}_`) ||
          tag.startsWith(`${normalizedAlias}_`) || tag.endsWith(`_${normalizedAlias}`)
      );
    });

  if (hasAny(RESOURCE_GROUP_ALIASES.bullpen)) return 'bullpen';
  if (hasAny(RESOURCE_GROUP_ALIASES.grind)) return 'grind';
  if (hasAny(RESOURCE_GROUP_ALIASES.dugout)) return 'dugout';

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

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ResourceGroup>('dugout');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchContentCards({ limit: 50 });
        setCards(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeTabConfig = RESOURCE_TABS.find((tab) => tab.id === activeTab) ?? RESOURCE_TABS[0];
  const groupedCards = cards.filter((card) => inferResourceGroup(card) === activeTab);
  const filtered = search
    ? groupedCards.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          (c.summary ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : groupedCards;

  const featured = filtered.filter((c) => c.is_featured).slice(0, 3);
  const rest = filtered.filter((c) => !c.is_featured);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>REFERENCE LAYER</Text>
          <Text style={styles.title}>Resources</Text>
          <Text style={styles.subtitle}>Cues, plans, and reference work for your next rep.</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="library" size={20} color={Colors.primary} />
        </View>
      </View>

      {/* ── SEARCH ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={15} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search articles, tools, audio..."
          placeholderTextColor={Colors.textTertiary}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={12}>
            <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* ── RESOURCE TABS ── */}
      <View style={styles.tabRail}>
        {RESOURCE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, isActive && styles.tabActive]}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </View>

      {/* ── CONTENT ── */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Featured strip */}
          {featured.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title={`${activeTabConfig.label.toUpperCase()} PICKS`} count={featured.length} />
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

          {/* All cards list */}
          {rest.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="REFERENCE CARDS" count={rest.length} />
              <View style={styles.cardList}>
                {rest.map((card, i) => (
                  <ListCard key={card.id} card={card} index={i} onOpen={() => router.push(`/content/${card.id}`)} />
                ))}
              </View>
            </View>
          )}

          {filtered.length === 0 && !loading && (
            <View style={styles.empty}>
              <Ionicons name="library-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Nothing here yet.</Text>
              <Text style={styles.emptyText}>{search ? 'No resources match that search.' : activeTabConfig.empty}</Text>
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

function ListCard({ card, index, onOpen }: { card: ContentCard; index: number; onOpen: () => void }) {
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

  subtitle: {
    maxWidth: 280,
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // Resource tabs
  tabRail: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    padding: 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: Colors.primaryMuted,
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
    letterSpacing: 0.4,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabIndicator: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 5,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.primary,
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
