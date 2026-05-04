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
 * Priority-weighted selector driven by athlete state tags:
 *   1. skill_tags match a named struggle
 *   2. season_tags match the current phase  (inert until LegacyLesson gains season_tags)
 *   3. role_tags match the athlete's primary role
 *   4. Next incomplete in order — catch-all so the user never hits a dead end
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

  // ── 1. STRUGGLE MATCH — skill_tags overlap with a named struggle ─────────
  const struggleMatch = incomplete.find(l =>
    l.skill_tags?.some(tag =>
      struggles.some(s => tag.toLowerCase().includes(s.toLowerCase()))
    )
  );
  if (struggleMatch) {
    return {
      lesson: struggleMatch,
      reason: reasonForPillar(struggleMatch.pillar_id),
      pillar: struggleMatch.pillar_id,
    };
  }

  // ── 2. PHASE MATCH — season_tags match current phase ────────────────────
  // LegacyLesson currently lacks season_tags; this fires once that field is populated.
  const phaseMatch = incomplete.find(l =>
    (l as any).season_tags?.includes(phase)
  );
  if (phaseMatch) {
    return {
      lesson: phaseMatch,
      reason: reasonForPillar(phaseMatch.pillar_id),
      pillar: phaseMatch.pillar_id,
    };
  }

  // ── 3. ROLE MATCH — role_tags match athlete's primary role ───────────────
  const roleMatch = incomplete.find(l => l.role_tags?.includes(role));
  if (roleMatch) {
    return {
      lesson: roleMatch,
      reason: reasonForPillar(roleMatch.pillar_id),
      pillar: roleMatch.pillar_id,
    };
  }

  // ── 4. FALLBACK — next incomplete in order ───────────────────────────────
  return {
    lesson: incomplete[0],
    reason: 'Keep building your career.',
    pillar: incomplete[0].pillar_id,
  };
}
