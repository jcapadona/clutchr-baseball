// TODO: Move Mental Game Score calculation server-side once launch analytics model is finalized.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MENTAL_GAME_SCORE_KEY = 'clutchr_mental_game_score_v1';

const BASELINE_SCORE = 60;
const MAX_GAIN = 4.0;
const MAX_LOSS = -2.0;

export type MentalGameScoreDay = {
  date: string;
  score: number;
  delta: number;
  reps_completed: number;
  cues_saved: number;
  streak_active: boolean;
};

export type MentalGameScoreHistory = {
  version: 1;
  created_at: string;
  updated_at: string;
  baseline_score: number;
  days: MentalGameScoreDay[];
};

type UpdateParams = {
  repsCompletedToday: number;
  cuesSavedToday: number;
  streakActiveToday: boolean;
};

export async function updateMentalGameScore(params: UpdateParams): Promise<MentalGameScoreHistory> {
  const { repsCompletedToday, cuesSavedToday, streakActiveToday } = params;
  const today = new Date().toISOString().slice(0, 10);

  const raw = await AsyncStorage.getItem(MENTAL_GAME_SCORE_KEY);
  let history: MentalGameScoreHistory = raw
    ? (JSON.parse(raw) as MentalGameScoreHistory)
    : {
        version: 1,
        created_at: today,
        updated_at: today,
        baseline_score: BASELINE_SCORE,
        days: [],
      };

  // Idempotent: strip today's entry, always recompute from yesterday's score
  const previousDays = history.days.filter(d => d.date !== today);
  const yesterday = previousDays.length > 0 ? previousDays[previousDays.length - 1] : null;
  const baseScore = yesterday ? yesterday.score : BASELINE_SCORE;

  let delta: number;
  if (repsCompletedToday === 0) {
    delta = -1.2;
  } else {
    delta = 2.0 + 0.5 * Math.min(repsCompletedToday - 1, 3);
    if (cuesSavedToday > 0) delta += 0.8;
    if (streakActiveToday) delta += 0.5;
  }
  delta = Math.max(MAX_LOSS, Math.min(MAX_GAIN, delta));

  const score = Math.max(0, Math.min(100, Math.round(baseScore + delta)));

  const todayEntry: MentalGameScoreDay = {
    date: today,
    score,
    delta,
    reps_completed: repsCompletedToday,
    cues_saved: cuesSavedToday,
    streak_active: streakActiveToday,
  };

  const updated: MentalGameScoreHistory = {
    ...history,
    updated_at: today,
    days: [...previousDays, todayEntry],
  };

  await AsyncStorage.setItem(MENTAL_GAME_SCORE_KEY, JSON.stringify(updated));
  return updated;
}
