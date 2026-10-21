// ─── SUPABASE TABLE (run once in Supabase SQL editor) ────────────────────────
// CREATE TABLE athlete_profiles (
//   id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
//   state jsonb NOT NULL DEFAULT '{}',
//   updated_at timestamptz DEFAULT now()
// );
// ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users can read own profile" ON athlete_profiles FOR SELECT USING (auth.uid() = id);
// CREATE POLICY "Users can upsert own profile" ON athlete_profiles FOR ALL USING (auth.uid() = id);
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { scheduleStreakReminder, setupNotificationsOnce } from '@/lib/notifications';
import { loadAgeGate, lockUnder13, saveAgeGate, type AgeGate, type AgeGroup } from '@/lib/ageGate';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import Purchases from 'react-native-purchases';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type PositionRole = 'pitcher' | 'catcher' | 'infielder' | 'outfielder';
export type LevelBand = 'youth' | 'high_school' | 'college' | 'pro';
export type SeasonPhase =
  | 'preseason'
  | 'in_season'
  | 'slump_reset'
  | 'offseason_build'
  | 'return_to_throw';
export type Struggle =
  | 'bouncing_back'
  | 'confidence'
  | 'pregame_nerves'
  | 'throwing_safely'
  | 'throwing_strikes'
  | 'fielding_cleanly'
  | 'better_routine'
  | 'staying_locked_in'
  | 'reading_hitters'
  | 'plate_approach';

export interface SelfRatings {
  confidence: number;
  focus: number;
  composure: number;
  recovery_discipline: number;
  reset_skill: number;
}

export interface AthleteState {
  first_name: string;
  primary_role: PositionRole;
  is_two_way: boolean;
  level_band: LevelBand;
  season_phase: SeasonPhase;
  biggest_struggle: Struggle[];
  self_ratings: SelfRatings;
  routine_consistency: number;
  birth_year?: number;
  age_group?: AgeGroup;
  total_xp: number;
  completed_lessons: string[];
  saved_routines: string[];
  // ── PLAYBOOK ─────────────────────────────────────────────────────────────
  playbook?: {
    reset: string;
    approach: string;
    pressure: string;
    confidence: string;
    focus: string;
    built_at: string;
  };
  current_phase: number;
  // ── STREAK FIELDS ────────────────────────────────────────────────────────
  streak_count: number;          // current consecutive days
  streak_best: number;           // all-time best streak
  last_lesson_date: string;      // ISO date string 'YYYY-MM-DD' of last completed lesson
  lessons_today: number;         // how many lessons completed today
  // ────────────────────────────────────────────────────────────────────────
  last_session_date?: string;  // toDateString() format, for cross-device streak sync
  capVoice?: 'direct' | 'mentor' | 'firedUp';
  created_at: string;
  updated_at: string;
}

// unknown      still working it out (loading, or the consent lookup is in flight)
// needs_age    signed in but the age question was never answered on this device
// not_required 13 or older, or an existing user from before the age screen
// required     under 13 and no parent consent saved yet
// granted      under 13 with a parent consent row saved
export type ConsentStatus = 'unknown' | 'needs_age' | 'not_required' | 'required' | 'granted';

interface ConsentRow {
  uid: string;
  found: boolean;
  error: boolean;
}

interface AthleteContextType {
  session: Session | null;
  ageGate: AgeGate | null;
  ageGateLoaded: boolean;
  ageGroup: AgeGroup | null;
  consent: ConsentStatus;
  answerAge: (birthYear: number) => Promise<AgeGate>;
  grantConsent: () => void;
  clearAgeGate: () => void;
  athleteState: AthleteState | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  saveAthleteState: (state: AthleteState) => Promise<void>;
  updateAthleteState: (updates: Partial<AthleteState>) => Promise<void>;
  completeLesson: (lessonId: string, xp: number) => Promise<void>;
  signOut: () => Promise<void>;
  // Streak helpers exposed to UI
  streakStatus: 'none' | 'active' | 'at_risk' | 'done_today';
  completedTodayCount: number;
}

// ─── STORAGE KEY ─────────────────────────────────────────────────────────────

const ATHLETE_KEY = '@clutchr_athlete_v2';

// ─── STREAK HELPERS ───────────────────────────────────────────────────────────

function toDateStr(iso: string): string {
  // Returns 'YYYY-MM-DD' in local time
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr(): string {
  return toDateStr(new Date().toISOString());
}

function daysBetween(a: string, b: string): number {
  // a and b are 'YYYY-MM-DD'
  const msPerDay = 86400000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

function computeStreak(prev: AthleteState): {
  streak_count: number;
  streak_best: number;
  last_lesson_date: string;
  lessons_today: number;
} {
  const today = todayStr();
  const last = prev.last_lesson_date ?? '';

  if (last === today) {
    // Already completed a lesson today — just increment lessons_today
    return {
      streak_count: prev.streak_count,
      streak_best: prev.streak_best,
      last_lesson_date: today,
      lessons_today: (prev.lessons_today ?? 0) + 1,
    };
  }

  const gap = last ? daysBetween(last, today) : 1;

  let newStreak: number;
  if (gap === 1) {
    // Consecutive day — extend streak
    newStreak = (prev.streak_count ?? 0) + 1;
  } else if (gap === 2) {
    // Missed one day — grace window: streak pauses but does not reset
    // Comeback challenge: restore half (rounded down)
    newStreak = Math.max(1, Math.floor((prev.streak_count ?? 0) / 2));
  } else {
    // Missed 2+ days — full reset
    newStreak = 1;
  }

  return {
    streak_count: newStreak,
    streak_best: Math.max(newStreak, prev.streak_best ?? 0),
    last_lesson_date: today,
    lessons_today: 1,
  };
}

// ─── DEFAULT STATE ───────────────────────────────────────────────────────────

export function buildDefaultState(name: string): AthleteState {
  const now = new Date().toISOString();
  return {
    first_name: name,
    primary_role: 'infielder',
    is_two_way: false,
    level_band: 'high_school',
    season_phase: 'in_season',
    biggest_struggle: [],
    self_ratings: {
      confidence: 3,
      focus: 3,
      composure: 3,
      recovery_discipline: 3,
      reset_skill: 3,
    },
    routine_consistency: 3,
    total_xp: 0,
    completed_lessons: [],
    saved_routines: [],
    current_phase: 0,
    streak_count: 0,
    streak_best: 0,
    last_lesson_date: '',
    lessons_today: 0,
    last_session_date: '',
    capVoice: 'mentor',
    created_at: now,
    updated_at: now,
  };
}

// ─── SUPABASE SYNC ───────────────────────────────────────────────────────────

async function syncToSupabase(state: AthleteState, userId: string) {
  try {
    await supabase
      .from('athlete_profiles')
      .upsert({ id: userId, state, updated_at: new Date().toISOString() });
  } catch (e) {
    console.warn('Supabase sync failed silently:', e);
  }
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

const AthleteContext = createContext<AthleteContextType | null>(null);

export function AthleteProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [athleteState, setAthleteState] = useState<AthleteState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Ref so callbacks with [] deps can always access the latest session without re-creating
  const sessionRef = useRef<Session | null>(null);
  // Set to true before an intentional signOut() call so onAuthStateChange
  // can distinguish user-initiated sign-out from involuntary token expiry.
  const intentionalSignOut = useRef(false);
  const [ageGate, setAgeGate] = useState<AgeGate | null>(null);
  const [ageGateLoaded, setAgeGateLoaded] = useState(false);
  const [consentRow, setConsentRow] = useState<ConsentRow | null>(null);
  // Read by the sync callbacks, which are created once. True only when the
  // account may write to Supabase (13 or older, or a parent has consented).
  const consentOkRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      sessionRef.current = session;
    }).catch((err) => console.warn('getSession error:', err));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' && !intentionalSignOut.current) {
          Alert.alert('Session expired', 'Please sign in again.');
        }
        intentionalSignOut.current = false;
        setSession(session);
        sessionRef.current = session;

        // Purchases.logIn is gated on consent, see the effect below.
        if (!session?.user?.id && event === 'SIGNED_OUT') {
          Purchases.logOut().catch(() => {});
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ATHLETE_KEY);
        let local: AthleteState | null = null;
        if (raw) {
          const parsed = JSON.parse(raw);
          // Backfill streak fields for existing users who don't have them
          if (parsed.streak_count === undefined) {
            parsed.streak_count = 0;
            parsed.streak_best = 0;
            parsed.last_lesson_date = '';
            parsed.lessons_today = 0;
          }
          local = parsed;
          setAthleteState(parsed);
        }

        // Merge with Supabase if logged in
        const userId = sessionRef.current?.user?.id;
        if (userId) {
          try {
            const { data } = await supabase
              .from('athlete_profiles')
              .select('state, updated_at')
              .eq('id', userId)
              .single();

            if (data?.state) {
              const remote = data.state as AthleteState;
              const remoteTs = new Date(data.updated_at ?? 0).getTime();
              const localTs  = new Date(local?.updated_at ?? 0).getTime();
              if (remoteTs > localTs) {
                // Remote is newer — use it and persist locally
                setAthleteState(remote);
                await AsyncStorage.setItem(ATHLETE_KEY, JSON.stringify(remote));
              }
            } else if (local) {
              // No remote record yet — push local state up
              if (consentOkRef.current) syncToSupabase(local, userId);
            }
          } catch {
            // Supabase unavailable — continue with local state
          }
        }
      } catch (err) {
        console.error('Failed to load athlete state:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const saveAthleteState = useCallback(async (state: AthleteState) => {
    const updated = { ...state, updated_at: new Date().toISOString() };
    setAthleteState(updated);
    await AsyncStorage.setItem(ATHLETE_KEY, JSON.stringify(updated));
    if (sessionRef.current?.user?.id && consentOkRef.current) syncToSupabase(updated, sessionRef.current.user.id);
  }, []);

  const updateAthleteState = useCallback(
    async (updates: Partial<AthleteState>) => {
      setAthleteState((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        AsyncStorage.setItem(ATHLETE_KEY, JSON.stringify(updated)).catch(console.error);
        if (sessionRef.current?.user?.id && consentOkRef.current) syncToSupabase(updated, sessionRef.current.user.id);
        return updated;
      });
    },
    []
  );

  const completeLesson = useCallback(async (lessonId: string, xp: number) => {
    setAthleteState((prev) => {
      if (!prev) return prev;
      if (prev.completed_lessons.includes(lessonId)) return prev;

      const newCompleted = [...prev.completed_lessons, lessonId];
      const newPhase = Math.min(7, Math.floor(newCompleted.length / 5));

      // ── Compute streak ──────────────────────────────────────────────────
      const streakData = computeStreak(prev);

      const updated: AthleteState = {
        ...prev,
        total_xp: prev.total_xp + xp,
        completed_lessons: newCompleted,
        current_phase: newPhase,
        ...streakData,
        last_session_date: new Date().toDateString(),
        updated_at: new Date().toISOString(),
      };

      AsyncStorage.setItem(ATHLETE_KEY, JSON.stringify(updated)).catch(console.error);
      if (sessionRef.current?.user?.id && consentOkRef.current) syncToSupabase(updated, sessionRef.current.user.id);
      scheduleStreakReminder(streakData.streak_count).catch(() => {});
      return updated;
    });
  }, []);

  const answerAge = useCallback(async (birthYear: number) => {
    const gate = await saveAgeGate(birthYear);
    setAgeGate(gate);
    return gate;
  }, []);

  // Dev reset only: forgets the in-memory answer. The caller removes the stored key.
  const clearAgeGate = useCallback(() => setAgeGate(null), []);

  const grantConsent = useCallback(() => {
    const uid = sessionRef.current?.user?.id;
    if (uid) setConsentRow({ uid, found: true, error: false });
  }, []);

  const signOut = useCallback(async () => {
    intentionalSignOut.current = true;
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(ATHLETE_KEY);
    setAthleteState(null);
    setSession(null);
  }, []);

  const isOnboardingComplete = Boolean(
    athleteState?.first_name &&
    athleteState?.primary_role
  );

  // ── Age gate and parental consent ────────────────────────────────────────
  useEffect(() => {
    loadAgeGate().then((gate) => {
      setAgeGate(gate);
      setAgeGateLoaded(true);
    });
  }, []);

  const uid = session?.user?.id ?? null;

  // A consent row means this account belongs to an under-13 child with a
  // parent on file, even on a fresh install with no local age answer.
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('parental_consents')
          .select('child_birth_year')
          .eq('parent_user_id', uid)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          setConsentRow({ uid, found: false, error: true });
          return;
        }
        if (data) {
          const existing = await loadAgeGate();
          if (existing?.age_group !== 'under13') {
            setAgeGate(await lockUnder13(data.child_birth_year ?? new Date().getFullYear()));
          }
        }
        if (!cancelled) setConsentRow({ uid, found: !!data, error: false });
      } catch {
        if (!cancelled) setConsentRow({ uid, found: false, error: true });
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  const rowResult = consentRow && consentRow.uid === uid ? consentRow : null;
  const ageGroup: AgeGroup | null = rowResult?.found
    ? 'under13'
    : athleteState?.age_group ?? ageGate?.age_group ?? null;

  const consent: ConsentStatus = (() => {
    if (!uid || isLoading || !ageGateLoaded || !rowResult) return 'unknown';
    if (rowResult.found) return 'granted';
    if (ageGroup === 'under13') {
      // Lookup failed offline: an under-13 user who already finished onboarding
      // did so after consent, so keep them in.
      return rowResult.error && isOnboardingComplete ? 'granted' : 'required';
    }
    if (ageGroup === '13plus') return 'not_required';
    return isOnboardingComplete ? 'not_required' : 'needs_age';
  })();

  const consentOk = consent === 'not_required' || consent === 'granted';
  consentOkRef.current = consentOk;

  useEffect(() => {
    if (!uid || !consentOk) return;
    Purchases.logIn(uid).catch(() => {});
    setupNotificationsOnce().catch((err) => console.warn('setupNotificationsOnce error:', err));
  }, [uid, consentOk]);

  // ── Derived streak status for UI ─────────────────────────────────────────
  const streakStatus: AthleteContextType['streakStatus'] = (() => {
    if (!athleteState) return 'none';
    const today = todayStr();
    const last = athleteState.last_lesson_date ?? '';
    if (last === today) return 'done_today';
    if (!last || athleteState.streak_count === 0) return 'none';
    const gap = daysBetween(last, today);
    if (gap === 1) return 'active';
    if (gap === 2) return 'at_risk'; // grace window — one more day before full reset
    return 'none';
  })();

  const completedTodayCount = (() => {
    if (!athleteState) return 0;
    const today = todayStr();
    if (athleteState.last_lesson_date === today) return athleteState.lessons_today ?? 0;
    return 0;
  })();

  return (
    <AthleteContext.Provider
      value={{
        session,
        ageGate,
        ageGateLoaded,
        ageGroup,
        consent,
        answerAge,
        grantConsent,
        clearAgeGate,
        athleteState,
        isLoading,
        isOnboardingComplete,
        saveAthleteState,
        updateAthleteState,
        completeLesson,
        signOut,
        streakStatus,
        completedTodayCount,
      }}
    >
      {children}
    </AthleteContext.Provider>
  );
}

export function useAthlete() {
  const ctx = useContext(AthleteContext);
  if (!ctx) throw new Error('useAthlete must be inside AthleteProvider');
  return ctx;
}
