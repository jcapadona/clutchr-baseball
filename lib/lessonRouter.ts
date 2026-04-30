/**
 * lessonRouter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * The Continue Career routing engine for Clutchr Baseball.
 *
 * Given the full pool of lessons from Supabase and the athlete's current state,
 * this returns the single best next lesson — never a random pick, never just
 * "first uncompleted."
 *
 * ROUTING PRIORITY STACK (evaluated top → bottom, first match wins):
 *   1. Emergency override  — slump_reset / return_to_throw phases
 *   2. Foundation gate     — new athletes must build the base first
 *   3. Struggle injection  — active struggle pillar bumped to front
 *   4. Role path           — athlete's position-specific world
 *   5. Universal fallback  — pressure-resilience, built-different, etc.
 *   6. Any uncompleted     — catch-all so the user never hits a dead end
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { LegacyLesson } from '@/lib/supabase';
import type { AthleteState, PositionRole, SeasonPhase, Struggle } from '@/context/AthleteContext';

// ─── PILLAR MAPS ─────────────────────────────────────────────────────────────

/** Maps primary_role → its dedicated pillar_id */
const ROLE_TO_PILLAR: Record<PositionRole, string> = {
  pitcher:   'pitcher-path',
  catcher:   'catcher-path',
  infielder: 'infield-path',
  outfielder: 'outfield-path',
};

/**
 * Maps struggle values → the pillar that most directly addresses them.
 * Only struggles with a clear pillar home are listed; others fall through
 * to the role path naturally.
 */
const STRUGGLE_TO_PILLAR: Partial<Record<Struggle, string>> = {
  bouncing_back:     'pressure-resilience',
  confidence:        'pressure-resilience',
  pregame_nerves:    'pressure-resilience',
  throwing_strikes:  'pitcher-path',
  reading_hitters:   'pitcher-path',
  staying_locked_in: 'foundation',
  better_routine:    'foundation',
  plate_approach:    'hitter-path',
  fielding_cleanly:  'infield-path',
  throwing_safely:   'built-different',
};

/**
 * Season phases that bypass normal ordering and inject
 * a recovery/reset pillar immediately.
 */
const EMERGENCY_PHASE_TO_PILLAR: Partial<Record<SeasonPhase, string>> = {
  slump_reset:     'pressure-resilience',
  return_to_throw: 'built-different',
};

// ─── FOUNDATION GATE ─────────────────────────────────────────────────────────

/**
 * How many foundation lessons must be completed before we route the athlete
 * out of foundation and into their role/struggle path.
 *
 * Keeps brand-new users grounded in universal baseball mental skills before
 * they branch into position-specific content.
 */
const FOUNDATION_GATE_LESSONS = 3;

// ─── ROUTING RESULT ──────────────────────────────────────────────────────────

export interface RoutingResult {
  lesson: LegacyLesson;
  /** Human-readable reason — shown on the Hero card as the "why it matters" line */
  reason: string;
  /** Which pillar drove this pick — useful for debugging and analytics */
  pillar: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * From a pool of lessons, return the first uncompleted one in order_index order.
 * Returns null if all are completed.
 */
function firstUncompleted(
  pool: LegacyLesson[],
  completed: string[]
): LegacyLesson | null {
  const sorted = [...pool].sort((a, b) => a.order_index - b.order_index);
  return sorted.find((l) => !completed.includes(l.id)) ?? null;
}

/**
 * Filter a pool of lessons to those matching a specific pillar_id,
 * then return the first uncompleted one.
 */
function firstUncompletedInPillar(
  all: LegacyLesson[],
  pillar: string,
  completed: string[]
): LegacyLesson | null {
  const inPillar = all.filter((l) => l.pillar_id === pillar);
  return firstUncompleted(inPillar, completed);
}

/**
 * Count how many completed lessons belong to a given pillar.
 */
function completedInPillar(
  all: LegacyLesson[],
  pillar: string,
  completed: string[]
): number {
  return all.filter(
    (l) => l.pillar_id === pillar && completed.includes(l.id)
  ).length;
}

// ─── REASON COPY ─────────────────────────────────────────────────────────────
// These strings land on the Hero card's subtitle — keep them punchy & baseball-native.

const REASON_BY_PILLAR: Record<string, string> = {
  'foundation':          'Build the mental base every ballplayer needs.',
  'built-different':     'Arm care, sleep, and strength. Take care of your body.',
  'pitcher-path':        'Command, tempo, and mound IQ. Your game, your rules.',
  'hitter-path':         'Approach, zone discipline, and at-bat routine.',
  'catcher-path':        'Run the game. Lead your pitcher. Own the dish.',
  'infield-path':        'Ready position, soft hands, no-hesitation throws.',
  'outfield-path':       'First step wins the rep. Build it now.',
  'baserunner-path':     'Leads, reads, and green-light decisions.',
  'pressure-resilience': 'Clutch moments are built in practice. Time to rep it.',
  'gamemode':            'Pregame, in-game, and postgame — full session.',
};

function reasonForPillar(pillar: string): string {
  return REASON_BY_PILLAR[pillar] ?? 'Next lesson on your career path.';
}

// ─── MAIN ROUTER ─────────────────────────────────────────────────────────────

/**
 * pickNextLesson
 *
 * @param allLessons  Full pool fetched from Supabase (already active, sorted)
 * @param athlete     Current AthleteState from context
 * @returns           RoutingResult with the chosen lesson + metadata, or null
 *                    if there are genuinely no lessons left to complete.
 */
export function pickNextLesson(
  allLessons: LegacyLesson[],
  athlete: AthleteState
): RoutingResult | null {
  const completed = athlete.completed_lessons ?? [];

  // ── 1. EMERGENCY PHASE OVERRIDE ─────────────────────────────────────────
  // Slump or injury? Route straight to the healing pillar.
  const emergencyPillar = EMERGENCY_PHASE_TO_PILLAR[athlete.season_phase];
  if (emergencyPillar) {
    const lesson = firstUncompletedInPillar(allLessons, emergencyPillar, completed);
    if (lesson) {
      const reason =
        athlete.season_phase === 'slump_reset'
          ? 'Slumps end when you compete in the process. Reset starts here.'
          : 'Patience is the work. Arm care and smart progression only.';
      return { lesson, reason, pillar: emergencyPillar };
    }
    // If emergency pillar is fully completed, fall through to normal routing
  }

  // ── 2. FOUNDATION GATE ──────────────────────────────────────────────────
  // New athlete or not enough foundation? Send them there first.
  const foundationDone = completedInPillar(allLessons, 'foundation', completed);
  if (foundationDone < FOUNDATION_GATE_LESSONS) {
    const lesson = firstUncompletedInPillar(allLessons, 'foundation', completed);
    if (lesson) {
      return {
        lesson,
        reason: 'Build the mental base every ballplayer needs.',
        pillar: 'foundation',
      };
    }
  }

  // ── 3. STRUGGLE INJECTION ────────────────────────────────────────────────
  // If the athlete named a struggle that maps to a specific pillar,
  // inject one lesson from that pillar before returning to the role path.
  // We only inject one at a time (not the whole pillar) to keep variety.
  for (const struggle of athlete.biggest_struggle ?? []) {
    const targetPillar = STRUGGLE_TO_PILLAR[struggle];
    if (!targetPillar) continue;

    // Don't re-inject foundation if they've already passed the gate
    if (targetPillar === 'foundation' && foundationDone >= FOUNDATION_GATE_LESSONS) continue;

    // Check if we already did a lesson from this struggle's pillar recently
    // (simple check: if the last completed lesson was in this pillar, skip)
    const lastCompletedLesson =
      completed.length > 0
        ? allLessons.find((l) => l.id === completed[completed.length - 1])
        : null;

    if (lastCompletedLesson?.pillar_id === targetPillar) continue;

    const lesson = firstUncompletedInPillar(allLessons, targetPillar, completed);
    if (lesson) {
      const struggleReason: Partial<Record<Struggle, string>> = {
        bouncing_back:     'Short memory is a skill. Build your reset rep.',
        confidence:        'Confidence is built rep by rep. Start here.',
        pregame_nerves:    'Nerves mean you care. Learn to channel them.',
        throwing_strikes:  'Command starts in the mind. Attack the zone.',
        reading_hitters:   'Every swing is data. Learn to read it.',
        staying_locked_in: 'One pitch. This pitch. Lock in.',
        better_routine:    'The routine is your armor. Build it here.',
        plate_approach:    'Hunt your pitch. Know your zone before you step in.',
        fielding_cleanly:  'Soft hands start in the ready position.',
        throwing_safely:   'Take care of the arm today. Smart progression only.',
      };
      return {
        lesson,
        reason: struggleReason[struggle] ?? reasonForPillar(targetPillar),
        pillar: targetPillar,
      };
    }
  }

  // ── 4. ROLE PATH ────────────────────────────────────────────────────────
  // Athlete has their foundation. Route them into their position world.
  const rolePillar = ROLE_TO_PILLAR[athlete.primary_role];
  if (rolePillar) {
    const lesson = firstUncompletedInPillar(allLessons, rolePillar, completed);
    if (lesson) {
      return {
        lesson,
        reason: reasonForPillar(rolePillar),
        pillar: rolePillar,
      };
    }
  }

  // ── 5. UNIVERSAL FALLBACKS ───────────────────────────────────────────────
  // Role path is complete (or thin). Offer universal worlds in a logical order.
  const fallbackPillars = [
    'pressure-resilience',
    'built-different',
    'hitter-path',
    'baserunner-path',
    'gamemode',
  ];

  for (const pillar of fallbackPillars) {
    const lesson = firstUncompletedInPillar(allLessons, pillar, completed);
    if (lesson) {
      return {
        lesson,
        reason: reasonForPillar(pillar),
        pillar,
      };
    }
  }

  // ── 6. ABSOLUTE CATCH-ALL ────────────────────────────────────────────────
  // Something is in the DB. Never leave the user stranded.
  const any = firstUncompleted(allLessons, completed);
  if (any) {
    return {
      lesson: any,
      reason: 'Keep building your career.',
      pillar: any.pillar_id,
    };
  }

  // Truly nothing left — all lessons completed. Shouldn't happen in prod yet.
  return null;
}
