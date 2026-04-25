import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── DATABASE TYPES ──────────────────────────────────────────────────────────

export interface ContentCard {
  id: string;
  title: string;
  summary: string | null;
  body_markdown: string | null;
  card_type: 'article' | 'exercise' | 'image' | 'video' | 'audio';
  content_category: string;
  lesson_family: string;
  sport_scope: string;
  role_tags: string[];
  season_tags: string[];
  skill_tags: string[];
  difficulty_tier: string | null;
  duration_minutes: number | null;
  priority: number;
  is_featured: boolean;
  thumbnail_url: string | null;
  audio_url: string | null;
  youtube_url: string | null;
  visibility: string | null;
}

export interface LegacyLesson {
  id: string;
  legacy_lesson_id: string;
  pillar_id: string;
  unit_id: string;
  title: string;
  subtitle: string | null;
  difficulty_tier: string | null;
  duration_sec: number | null;
  xp_reward: number;
  order_index: number;
  is_checkpoint: boolean;
  is_boss: boolean;
  steps: any[];
  sport_scope: string;
  role_tags: string[];
  skill_tags: string[];
}

// ─── CONTENT QUERIES ─────────────────────────────────────────────────────────

export async function fetchContentCards(filters?: {
  category?: string;
  role?: string;
  limit?: number;
}) {
  let query = supabase
    .from('content_cards')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('content_category', filters.category);
  }
  if (filters?.role) {
    query = query.contains('role_tags', [filters.role]);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ContentCard[];
}

export async function fetchLessons(filters?: {
  pillar?: string;
  role?: string;
  limit?: number;
}) {
  let query = supabase
    .from('legacy_lessons_staging')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (filters?.pillar) {
    query = query.eq('pillar_id', filters.pillar);
  }
  if (filters?.role) {
    query = query.contains('role_tags', [filters.role]);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as LegacyLesson[];
}