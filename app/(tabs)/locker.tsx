import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { fetchContentCards, type ContentCard } from '@/lib/supabase';
import { Colors, Radius, Spacing } from '@/constants/theme';

const CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'pregame', label: 'PREGAME' },
  { id: 'ingame', label: 'IN-GAME' },
  { id: 'recovery', label: 'RECOVERY' },
  { id: 'growth', label: 'MINDSET' },
  { id: 'leadership', label: 'LEADERSHIP' },
];

export default function LockerScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState } = useAthlete();
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchContentCards({
          category: category === 'all' ? undefined : category,
          limit: 30,
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
      <View style={styles.header}>
        <Text style={styles.title}>THE LOCKER</Text>
        <Text style={styles.subtitle}>Your cue bank, film room, audio, and tools.</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search tools, audio, articles..."
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catsRow}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.catTab, category === cat.id && styles.catTabActive]}
            onPress={() => setCategory(cat.id)}
          >
          <Text
              style={[styles.catLabel, category === cat.id && styles.catLabelActive]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Featured row */}
          {featured.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>FOR YOU</Text>
                <Text style={styles.sectionCount}>{featured.length}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
                {featured.map((card) => (
                  <FeaturedCard key={card.id} card={card} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Rest of cards */}
          {rest.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>ALL CONTENT</Text>
                <Text style={styles.sectionCount}>{rest.length}</Text>
              </View>
              {rest.map((card) => (
                <ListCard key={card.id} card={card} />
              ))}
            </View>
          )}

          {filtered.length === 0 && !loading && (
            <View style={styles.empty}>
              <Ionicons name="library-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No content found.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function FeaturedCard({ card }: { card: ContentCard }) {
  return (
    <Pressable style={styles.featuredCard}>
      {card.thumbnail_url ? (
        <Image source={{ uri: card.thumbnail_url }} style={styles.featuredImg} />
      ) : (
        <View style={[styles.featuredImg, styles.featuredImgFallback]}>
          <Ionicons name="document-text" size={24} color={Colors.textTertiary} />
        </View>
      )}
      <View style={styles.featuredOverlay}>
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>
            {card.card_type.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.featuredTitle} numberOfLines={2}>{card.title}</Text>
        <Text style={styles.featuredDuration}>
          {card.duration_minutes ? `${card.duration_minutes} min` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

function ListCard({ card }: { card: ContentCard }) {
  const iconMap: Record<string, string> = {
    article: 'document-text',
    exercise: 'fitness',
    video: 'play-circle',
    audio: 'headset',
    image: 'image',
  };
  return (
    <Pressable style={styles.listCard}>
      <View style={styles.listIconWrap}>
        <Ionicons
          name={(iconMap[card.card_type] ?? 'document-text') as any}
          size={18}
          color={Colors.primary}
        />
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listTitle} numberOfLines={2}>{card.title}</Text>
        {card.summary && (
          <Text style={styles.listSummary} numberOfLines={1}>{card.summary}</Text>
        )}
        <Text style={styles.listMeta}>
          {card.card_type.toUpperCase()}
          {card.duration_minutes ? ` · ${card.duration_minutes} min` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
  catsRow: {
    paddingHorizontal: Spacing.xl,
    paddingRight: Spacing.xl,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    flexGrow: 0,
  },
  catTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    flexShrink: 0,
  },
  catTabActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  catLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 0.6,
    flexShrink: 0,
  },
  catLabelActive: { color: Colors.primary },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  section: { gap: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    flex: 1,
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  featuredRow: { gap: Spacing.sm, paddingRight: Spacing.xl },
  featuredCard: {
    width: 200,
    height: 140,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuredImg: { width: '100%', height: '100%' },
  featuredImgFallback: {
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  featuredBadge: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  featuredBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  featuredDuration: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: { flex: 1, gap: 3 },
  listTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  listSummary: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  listMeta: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});
