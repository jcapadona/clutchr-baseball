import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import { useAthlete } from '@/context/AthleteContext';
import type { CapVoice, MicrocopyPool, CueMicrocopyPool } from '@/constants/microcopy';
import {
  HOME_GREETING,
  STEP_CORRECT,
  STEP_INCORRECT,
  LESSON_COMPLETE,
  WORLD_COMPLETE,
  BOSS_COMPLETE,
  STREAK_EXTENDED,
  STREAK_MILESTONES,
  STREAK_AT_RISK,
  TOASTS,
  EMPTY_STATES,
  BADGE_EARNED,
  LEVEL_UP,
} from '@/constants/microcopy';

const HISTORY_KEY = 'microcopy_history';

function getFirstPlaybookCue(playbook?: Record<string, string>): string | null {
  if (!playbook) return null;
  // TODO: surface primaryCue as a dedicated field in AthleteState (onboarding prompt)
  const keys: Array<keyof typeof playbook> = ['focus', 'pressure', 'approach', 'reset', 'confidence'];
  for (const key of keys) {
    const val = playbook[key];
    if (val && typeof val === 'string' && val.trim().length > 0) return val.trim();
  }
  return null;
}

export function useMicrocopy() {
  const { athleteState } = useAthlete();

  // TODO: wire capVoice from onboarding voice-selection step into AthleteState
  const capVoice: CapVoice = (athleteState as any)?.capVoice ?? 'mentor';

  // Derived from first non-empty playbook cue
  const primaryCue: string | null = getFirstPlaybookCue(athleteState?.playbook as any);

  // Seen history lives in a ref so pick() is synchronous and side-effect-safe
  const seenRef = useRef<Record<string, string[]>>({});
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (raw) {
        try { seenRef.current = JSON.parse(raw); } catch { /* ignore */ }
      }
    });
  }, []);

  function pickLine(lines: string[], poolKey: string): string {
    const seen = seenRef.current[poolKey] ?? [];
    const available = lines.filter((l) => !seen.includes(l));
    const candidates = available.length > 0 ? available : lines;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    // Track last 3 shown
    seenRef.current = { ...seenRef.current, [poolKey]: [...seen.slice(-2), pick] };
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(seenRef.current)).catch(() => {});
    return pick;
  }

  function pickPool(pool: MicrocopyPool, poolKey: string): string {
    return pickLine(pool[capVoice], poolKey);
  }

  // Strip trailing punctuation + capitalize so cues like "Breathe." become "Breathe"
  // before being spliced into mid-sentence templates.
  function sanitizeCueText(raw: string): string {
    const clean = raw.trim().replace(/[.!?,;:]+$/, '').trim();
    if (!clean) return '';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  function pickCuePool(pool: CueMicrocopyPool, poolKey: string): string {
    const cue = primaryCue ? sanitizeCueText(primaryCue) : null;
    if (cue) {
      const line = pickLine(pool.withCue[capVoice], `${poolKey}_with_cue`);
      return line.replace('{CUE}', cue);
    }
    return pickLine(pool.noCue[capVoice], `${poolKey}_no_cue`);
  }

  function useStepFeedback(correct: boolean): string {
    return pickPool(correct ? STEP_CORRECT : STEP_INCORRECT, correct ? 'step_correct' : 'step_wrong');
  }

  function useLessonComplete(): string {
    return pickCuePool(LESSON_COMPLETE, 'lesson_complete');
  }

  function useWorldComplete(): string {
    return pickCuePool(WORLD_COMPLETE, 'world_complete');
  }

  function useBossComplete(): string {
    return pickCuePool(BOSS_COMPLETE, 'boss_complete');
  }

  function useStreak(days: number): string {
    const milestone = STREAK_MILESTONES[days];
    if (milestone) return pickPool(milestone, `streak_milestone_${days}`);
    return pickPool(STREAK_EXTENDED, 'streak_extended');
  }

  function useHomeGreeting(ctx: { isGameDay: boolean; isReturn: boolean }): string {
    if (ctx.isReturn) return pickPool(HOME_GREETING.returnAfterAbsence, 'home_return');
    if (ctx.isGameDay) return pickPool(HOME_GREETING.gameDay, 'home_gameday');
    const hour = new Date().getHours();
    if (hour < 12) return pickPool(HOME_GREETING.morning, 'home_morning');
    if (hour < 17) return pickPool(HOME_GREETING.afternoon, 'home_afternoon');
    return pickPool(HOME_GREETING.evening, 'home_evening');
  }

  function useToast(category: 'cueSaved' | 'routineSaved' | 'postgameSaved' | 'settingsSaved'): string {
    const pool = TOASTS[category] as MicrocopyPool;
    return pickLine(pool[capVoice], `toast_${category}`);
  }

  function useEmptyState(category: 'noSavedCues' | 'noPostgameHistory' | 'worldLocked' | 'noLessonsInWorld'): string {
    return pickPool(EMPTY_STATES[category], `empty_${category}`);
  }

  function useBadgeEarned(): string {
    return pickPool(BADGE_EARNED, 'badge_earned');
  }

  function useLevelUp(): string {
    return pickPool(LEVEL_UP, 'level_up');
  }

  function useStreakAtRisk(): string {
    return pickPool(STREAK_AT_RISK, 'streak_at_risk');
  }

  return {
    capVoice,
    primaryCue,
    useStepFeedback,
    useLessonComplete,
    useWorldComplete,
    useBossComplete,
    useStreak,
    useHomeGreeting,
    useToast,
    useEmptyState,
    useBadgeEarned,
    useLevelUp,
    useStreakAtRisk,
  };
}
