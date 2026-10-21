import AsyncStorage from '@react-native-async-storage/async-storage';

// Device-level age answer. Lives outside the athlete state on purpose:
// signOut clears the athlete state, but this key must survive so an under-13
// answer cannot be undone by signing out and picking an older year.
const AGE_GATE_KEY = '@clutchr_age_gate_v1';

export const POLICY_VERSION = '2026-10-21';

export type AgeGroup = 'under13' | '13plus';

export interface AgeGate {
  birth_year: number;
  age_group: AgeGroup;
}

// Birth year alone cannot give an exact age, so the cutoff leans conservative:
// anyone who could still be 12 this year counts as under 13.
export function ageGroupFor(birthYear: number): AgeGroup {
  return birthYear >= new Date().getFullYear() - 13 ? 'under13' : '13plus';
}

export async function loadAgeGate(): Promise<AgeGate | null> {
  try {
    const raw = await AsyncStorage.getItem(AGE_GATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.birth_year === 'number' && (parsed.age_group === 'under13' || parsed.age_group === '13plus')) {
      return { birth_year: parsed.birth_year, age_group: parsed.age_group };
    }
  } catch {
    // fall through to null
  }
  return null;
}

// An under-13 answer is locked: later answers never replace it.
export async function saveAgeGate(birthYear: number): Promise<AgeGate> {
  const existing = await loadAgeGate();
  if (existing?.age_group === 'under13') return existing;
  const next: AgeGate = { birth_year: birthYear, age_group: ageGroupFor(birthYear) };
  await AsyncStorage.setItem(AGE_GATE_KEY, JSON.stringify(next));
  return next;
}

// Used when a consent row already exists for the signed-in account.
export async function lockUnder13(birthYear: number): Promise<AgeGate> {
  const next: AgeGate = { birth_year: birthYear, age_group: 'under13' };
  await AsyncStorage.setItem(AGE_GATE_KEY, JSON.stringify(next));
  return next;
}
