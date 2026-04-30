import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',        label: 'All',        icon: 'apps' },
  { id: 'pregame',    label: 'Pregame',    icon: 'time' },
  { id: 'ingame',     label: 'In-Game',    icon: 'baseball' },
  { id: 'recovery',   label: 'Recovery',   icon: 'heart' },
  { id: 'growth',     label: 'Mindset',    icon: 'bulb' },
  { id: 'leadership', label: 'Leadership', icon: 'people' },
];

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
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchContentCards({
          category: category === 'all' ? undefined : category,
          limit: 50,
        });
        setCards(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [category]);

  const filtered = search
    ? cards.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          (c.summary ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : cards;

  const featured = filtered.filter((c) => c.is_featured).slice(0, 3);
  const rest = filtered.filter((c) => !c.is_featured);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR RESOURCES</Text>
          <Text style={styles.title}>The Locker</Text>
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

      {/* ── FILTER PILLS ──
          KEY FIX: Do NOT use overflow:hidden on the parent.
          Use paddingVertical on the ScrollView itself so touch targets are full height.
          Pills have explicit height + minWidth so they never collapse.
      ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={styles.pillsScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              style={[styles.pill, isActive && styles.pillActive]}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              {isActive && (
                <LinearGradient
                  colors={[Colors.primary + '28', Colors.primary + '10']}
                  style={styles.pillActiveGlow}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <Ionicons
                name={cat.icon as any}
                size={13}
                color={isActive ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
              <SectionHeader title="FOR YOU" count={featured.length} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredRow}
              >
                {featured.map((card) => (
                  <FeaturedCard key={card.id} card={card} onOpen={() => setSelectedCard(card)} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* All cards list */}
          {rest.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="ALL CONTENT" count={rest.length} />
              <View style={styles.cardList}>
                {rest.map((card, i) => (
                  <ListCard key={card.id} card={card} index={i} onOpen={() => setSelectedCard(card)} />
                ))}
              </View>
            </View>
          )}

          {filtered.length === 0 && !loading && (
            <View style={styles.empty}>
              <Ionicons name="library-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Nothing here yet.</Text>
              <Text style={styles.emptyText}>Try a different filter or check back soon.</Text>
            </View>
          )}
        </ScrollView>
      )}
      {/* ── CONTENT READER MODAL ── */}
      {selectedCard && (
        <ContentReaderModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
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

// ─── CONTENT READER MODAL ────────────────────────────────────────────────────
// Shows body_markdown as plain text in a full-screen modal.
// No lesson player — this is reference content, not a lesson.

function ContentReaderModal({ card, onClose }: { card: ContentCard; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const cfg = TYPE_CONFIG[card.card_type] ?? TYPE_CONFIG.article;

  // Simple markdown → readable text: strip ## headers to bold-ish, keep bullets
  const bodyText = card.body_markdown ?? card.summary ?? 'No content available.';

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[readerStyles.container, { paddingTop: insets.top }]}>

        {/* Header */}
        <View style={readerStyles.header}>
          <Pressable onPress={onClose} style={readerStyles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </Pressable>
          <View style={[readerStyles.typeBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
            <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
            <Text style={[readerStyles.typeText, { color: cfg.color }]}>
              {card.card_type.toUpperCase()}
            </Text>
          </View>
          {card.duration_minutes && (
            <Text style={readerStyles.duration}>{card.duration_minutes} min</Text>
          )}
        </View>

        <ScrollView
          contentContainerStyle={[readerStyles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={readerStyles.title}>{card.title}</Text>

          {/* Summary */}
          {card.summary && (
            <Text style={readerStyles.summary}>{card.summary}</Text>
          )}

          {/* Divider */}
          <View style={readerStyles.divider} />

          {/* Body — render markdown as formatted text blocks */}
          {bodyText.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <View key={i} style={{ height: 8 }} />;

            // ## heading
            if (trimmed.startsWith('## ')) {
              return (
                <Text key={i} style={readerStyles.heading2}>
                  {trimmed.replace('## ', '')}
                </Text>
              );
            }
            // ### heading
            if (trimmed.startsWith('### ')) {
              return (
                <Text key={i} style={readerStyles.heading3}>
                  {trimmed.replace('### ', '')}
                </Text>
              );
            }
            // **bold** line (standalone)
            if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
              return (
                <Text key={i} style={readerStyles.boldLine}>
                  {trimmed.replace(/\*\*/g, '')}
                </Text>
              );
            }
            // - bullet
            if (trimmed.startsWith('- ')) {
              return (
                <View key={i} style={readerStyles.bulletRow}>
                  <View style={[readerStyles.bulletDot, { backgroundColor: cfg.color }]} />
                  <Text style={readerStyles.bulletText}>{trimmed.replace('- ', '')}</Text>
                </View>
              );
            }
            // numbered list
            if (/^\d+\./.test(trimmed)) {
              const num = trimmed.match(/^(\d+)\./)?.[1] ?? '';
              const text = trimmed.replace(/^\d+\.\s*/, '');
              return (
                <View key={i} style={readerStyles.bulletRow}>
                  <Text style={[readerStyles.numText, { color: cfg.color }]}>{num}.</Text>
                  <Text style={readerStyles.bulletText}>{text}</Text>
                </View>
              );
            }
            // horizontal rule
            if (trimmed === '---') {
              return <View key={i} style={readerStyles.hr} />;
            }
            // plain body text
            return (
              <Text key={i} style={readerStyles.bodyText}>{trimmed}</Text>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const readerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 34, height: 34,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  typeText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  duration: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, marginLeft: 'auto' as any },

  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: 4 },

  title: {
    fontSize: 24, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, lineHeight: 30,
    letterSpacing: -0.3, marginBottom: Spacing.sm,
  },
  summary: {
    fontSize: 15, fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary, lineHeight: 23,
    marginBottom: Spacing.sm,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },

  heading2: {
    fontSize: 18, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, lineHeight: 24,
    marginTop: Spacing.lg, marginBottom: 4,
  },
  heading3: {
    fontSize: 15, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, lineHeight: 22,
    marginTop: Spacing.md, marginBottom: 4,
  },
  boldLine: {
    fontSize: 14, fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary, lineHeight: 22,
    marginTop: 6,
  },
  bulletRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, marginVertical: 3,
  },
  bulletDot: {
    width: 6, height: 6, borderRadius: 3,
    marginTop: 7, flexShrink: 0,
  },
  numText: {
    fontSize: 13, fontFamily: 'Inter_700Bold',
    minWidth: 20, marginTop: 1,
  },
  bulletText: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary, lineHeight: 22, flex: 1,
  },
  hr: {
    height: 1, backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  bodyText: {
    fontSize: 15, fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary, lineHeight: 24,
    marginVertical: 2,
  },
});

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
