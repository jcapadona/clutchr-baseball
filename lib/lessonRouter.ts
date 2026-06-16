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
  pitcher:    'pitcher-path',
  catcher:    'catcher-path',
  infielder:  'infield-path',
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

/**
 * Returns the number of completed lessons for a given pillar_id.
 */
function completedInPillarCount(
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
 * Priority-weighted selector driven by athlete state tags:
 *   1. Emergency override  — slump_reset / return_to_throw phases
 *   2. Foundation gate     — new athletes must build the base first
 *   3. Struggle injection  — active struggle pillar bumped to front
 *   4. Role path           — athlete's position-specific world
 *   5. Universal fallback  — pressure-resilience, built-different, etc.
 *   6. Any uncompleted     — catch-all so the user never hits a dead end
 *
 * @param allLessons  Full pool fetched from Supabase
 * @param athlete     Current AthleteState from context
 * @returns           RoutingResult with the chosen lesson + metadata, or null
 *                    if there are genuinely no lessons left to complete.
 */
export function pickNextLesson(
  allLessons: LegacyLesson[],
  athlete: AthleteState
): RoutingResult | null {
  const completed = athlete.completed_lessons ?? [];
  const struggles = athlete.biggest_struggle ?? [];
  const phase     = athlete.season_phase ?? '';
  const role      = athlete.primary_role ?? '';

  const incomplete = allLessons.filter(l => !completed.includes(l.id));
  if (incomplete.length === 0) {
    const last = allLessons[allLessons.length - 1];
    return last
      ? { lesson: last, reason: 'All caught up. Keep the reps going.', pillar: last.pillar_id }
      : null;
  }

  // ── LEVEL 1: EMERGENCY OVERRIDE ──────────────────────────────────────────
  if (phase === 'slump_reset') {
    const lesson = firstUncompletedInPillar(allLessons, 'pressure-resilience', completed);
    if (lesson) {
      return {
        lesson,
        reason: 'You are in a slump. This rep is built for right now.',
        pillar: 'pressure-resilience',
      };
    }
  }
  if (phase === 'return_to_throw') {
    const lesson = firstUncompletedInPillar(allLessons, 'built-different', completed);
    if (lesson) {
      return {
        lesson,
        reason: 'Arm care first. Come back smarter than you left.',
        pillar: 'built-different',
      };
    }
  }

  // ── LEVEL 2: FOUNDATION GATE ─────────────────────────────────────────────
  const foundationCompleted = completedInPillarCount(allLessons, 'foundation', completed);
  if (foundationCompleted < FOUNDATION_GATE_LESSONS) {
    const lesson = firstUncompletedInPillar(allLessons, 'foundation', completed);
    if (lesson) {
      return {
        lesson,
        reason: 'Every athlete starts here. Build the base first.',
        pillar: 'foundation',
      };
    }
  }

  // ── LEVEL 3: STRUGGLE INJECTION ──────────────────────────────────────────
  if (struggles.length > 0) {
    // First pass: look inside each struggle's mapped pillar for a skill_tags match.
    for (const s of struggles) {
      const mappedPillar = STRUGGLE_TO_PILLAR[s as Struggle];
      if (mappedPillar) {
        const inPillar = [...allLessons]
          .filter((l) => l.pillar_id === mappedPillar && !completed.includes(l.id))
          .sort((a, b) => a.order_index - b.order_index);
        const lesson = inPillar.find((l) =>
          l.skill_tags?.some((tag) =>
            struggles.some(
              (str) =>
                tag.toLowerCase().includes(str.toLowerCase()) ||
                str.toLowerCase().includes(tag.toLowerCase())
            )
          )
        ) ?? null;
        if (lesson) {
          return {
            lesson,
            reason: reasonForPillar(mappedPillar),
            pillar: mappedPillar,
          };
        }
      }
    }
    // Second pass: any pillar — fires when no mapped-pillar lesson matched.
    const anyMatch = [...allLessons]
      .filter((l) => !completed.includes(l.id))
      .sort((a, b) => a.order_index - b.order_index)
      .find((l) =>
        l.skill_tags?.some((tag) =>
          struggles.some(
            (s) =>
              tag.toLowerCase().includes(s.toLowerCase()) ||
              s.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    if (anyMatch) {
      return {
        lesson: anyMatch,
        reason: reasonForPillar(anyMatch.pillar_id),
        pillar: anyMatch.pillar_id,
      };
    }
  }

  // ── LEVEL 4: ROLE PATH ───────────────────────────────────────────────────
  if (role) {
    const rolesToMatch = athlete.is_two_way
      ? [athlete.primary_role, athlete.primary_role === 'pitcher' ? 'hitter' : 'pitcher']
      : athlete.primary_role === 'catcher'
      ? ['catcher', 'hitter']
      : [athlete.primary_role];
    const roleMatch = [...allLessons]
      .filter((l) => !completed.includes(l.id))
      .sort((a, b) => a.order_index - b.order_index)
      .find((l) => rolesToMatch.some(r => l.role_tags?.includes(r)));
    if (roleMatch) {
      return {
        lesson: roleMatch,
        reason: reasonForPillar(roleMatch.pillar_id),
        pillar: roleMatch.pillar_id,
      };
    }
  }

  // ── LEVEL 5: UNIVERSAL FALLBACK ──────────────────────────────────────────
  const prLesson = firstUncompletedInPillar(allLessons, 'pressure-resilience', completed);
  if (prLesson) {
    return {
      lesson: prLesson,
      reason: reasonForPillar('pressure-resilience'),
      pillar: 'pressure-resilience',
    };
  }
  const bdLesson = firstUncompletedInPillar(allLessons, 'built-different', completed);
  if (bdLesson) {
    return {
      lesson: bdLesson,
      reason: reasonForPillar('built-different'),
      pillar: 'built-different',
    };
  }

  // ── LEVEL 6: CATCH-ALL ───────────────────────────────────────────────────
  const catchAll = firstUncompleted(allLessons, completed);
  if (catchAll) {
    return {
      lesson: catchAll,
      reason: 'Keep building your career.',
      pillar: catchAll.pillar_id,
    };
  }

  return null;
}
