/**
 * requiresPro.ts
 * The one free-versus-Pro rule for Career lessons and Locker content.
 *
 * Career: the first 5 lessons (by order_index) of the foundation and
 * readiness-routines worlds are free, 10 in total. Every other lesson is Pro.
 * The ids are listed by hand because order_index is global and has ties in
 * foundation, so a "first N" rule computed at runtime would be ambiguous.
 *
 * Locker: a card is Pro when content_cards.is_premium is true.
 *
 * Guests and signed-in free players get the same set; nothing here reads the
 * session.
 */
import { useProContext } from '@/context/ProContext';

export const FREE_LESSON_IDS: ReadonlySet<string> = new Set([
  // foundation: order_index 0, 1, 2, 3, 3
  'onboarding-first-rep',
  'ct_program_beats_panic',
  'ct_steady_after_wins',
  'ct_confidence_is_prepared',
  '0fc7af41-1dbf-4b89-8cc5-8db932186f88', // sr_on_deck_tempo_scan
  // readiness-routines: order_index 280 to 284
  'ritual_circuit_u1_l1',
  'ritual_circuit_u1_l2',
  'ritual_circuit_u1_l3',
  'ritual_circuit_u1_l4',
  'ritual_circuit_u1_l5',
]);

export const PAYWALL_SOURCE = {
  lessonLocked: 'lesson_locked',
  lessonGate: 'lesson_gate',
  locker: 'locker',
} as const;

export function upgradeRoute(source: string): string {
  return `/upgrade?source=${source}`;
}

export function isFreeLesson(lessonId: string | null | undefined): boolean {
  return !!lessonId && FREE_LESSON_IDS.has(lessonId);
}

export function isFreeCard(card: { is_premium?: boolean | null }): boolean {
  return !card.is_premium;
}

/**
 * While Pro status is still loading, canOpen* answers true so paying users
 * never see a lock flash. Route guards must check `isProLoading` themselves
 * before they act on a "no".
 */
export function useProAccess() {
  const { isPro, isProLoading } = useProContext();
  return {
    isPro,
    isProLoading,
    canOpenLesson: (lessonId: string | null | undefined) =>
      isPro || isProLoading || isFreeLesson(lessonId),
    canOpenCard: (card: { is_premium?: boolean | null }) =>
      isPro || isProLoading || isFreeCard(card),
  };
}
