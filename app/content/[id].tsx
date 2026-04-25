import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, type ContentCard } from '@/lib/supabase';
import { Colors, Radius, Spacing } from '@/constants/theme';
import MarkdownRenderer from '@/components/MarkdownRenderer';

// ─── TYPE CONFIG ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  article:  { icon: 'document-text', color: Colors.info,    label: 'ARTICLE'  },
  exercise: { icon: 'fitness',       color: Colors.primary, label: 'EXERCISE' },
  video:    { icon: 'play-circle',   color: Colors.warning, label: 'VIDEO'    },
  audio:    { icon: 'headset',       color: Colors.purple,  label: 'AUDIO'    },
  image:    { icon: 'image',         color: Colors.danger,  label: 'IMAGE'    },
};

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function ContentCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [card, setCard] = useState<ContentCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('content_cards')
          .select('*')
          .eq('id', id)
          .single();
        if (err || !data) throw new Error('Content not found');
        setCard(data as ContentCard);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (error || !card) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error ?? 'Not found'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Go back</Text>
        </Pressable>
      </View>
    );
  }

  const typeConfig = TYPE_CONFIG[card.card_type] ?? TYPE_CONFIG.article;
  const hasExternalLink = card.youtube_url || card.audio_url;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
        </Pressable>
        <View style={[
          styles.typeBadge,
          { backgroundColor: typeConfig.color + '18', borderColor: typeConfig.color + '40' },
        ]}>
          <Ionicons name={typeConfig.icon as any} size={11} color={typeConfig.color} />
          <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{card.title}</Text>
          {card.summary && <Text style={styles.summary}>{card.summary}</Text>}
          <View style={styles.metaRow}>
            {(card.role_tags ?? []).slice(0, 2).map((tag) => (
              <View key={tag} style={styles.metaTag}>
                <Text style={styles.metaTagText}>{tag.toUpperCase()}</Text>
              </View>
            ))}
            {card.duration_minutes != null && (
              <Text style={styles.metaDetail}>{card.duration_minutes} min</Text>
            )}
            {card.difficulty_tier && (
              <Text style={styles.metaDetail}>{card.difficulty_tier}</Text>
            )}
          </View>
        </View>

        {/* External link */}
        {hasExternalLink && (
          <Pressable
            style={styles.externalBtn}
            onPress={() => {
              const url = card.youtube_url ?? card.audio_url;
              if (url) Linking.openURL(url);
            }}
          >
            <Ionicons
              name={card.youtube_url ? 'logo-youtube' : 'headset'}
              size={18}
              color="#fff"
            />
            <Text style={styles.externalBtnText}>
              {card.youtube_url ? 'Watch on YouTube' : 'Listen'}
            </Text>
          </Pressable>
        )}

        {/* Body — rendered as markdown */}
        {card.body_markdown ? (
          <View style={styles.bodyCard}>
            <MarkdownRenderer content={card.body_markdown} />
          </View>
        ) : !hasExternalLink ? (
          <View style={styles.emptyBody}>
            <Ionicons name={typeConfig.icon as any} size={36} color={Colors.textTertiary} />
            <Text style={styles.emptyBodyText}>Content coming soon.</Text>
          </View>
        ) : null}

        {/* Skill tags */}
        {(card.skill_tags ?? []).length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsLabel}>SKILLS</Text>
            <View style={styles.tagsList}>
              {card.skill_tags.map((tag) => (
                <View key={tag} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  errorText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.danger, textAlign: 'center' },
  backBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  backBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.pill, borderWidth: 1 },
  typeBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },

  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, gap: Spacing.lg },

  titleBlock: { gap: Spacing.sm },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, lineHeight: 28 },
  summary: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap', marginTop: 2 },
  metaTag: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: Colors.primaryBorder },
  metaTagText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.5 },
  metaDetail: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  externalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.lg },
  externalBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

  bodyCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl },

  emptyBody: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxxl },
  emptyBodyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  tagsSection: { gap: Spacing.sm },
  tagsLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillTag: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  skillTagText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
});
