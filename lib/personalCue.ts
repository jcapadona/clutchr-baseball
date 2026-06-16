import type { AthleteState, PositionRole } from '@/context/AthleteContext';

type CueContext = 'reset' | 'approach' | 'pressure' | 'confidence' | 'focus';

const ROLE_FALLBACK: Record<PositionRole, Record<CueContext, string>> = {
  pitcher: {
    reset: 'Step off, exhale, attack the next pitch.',
    approach: 'Win pitch one, own the tempo.',
    pressure: 'Slow heart, fast intent.',
    confidence: 'Trust your stuff and compete.',
    focus: 'Eyes on glove, one target.',
  },
  catcher: {
    reset: 'Clear it. Give the sign with conviction.',
    approach: 'Lead the game one pitch at a time.',
    pressure: 'Settle the battery. Control pace.',
    confidence: 'Your voice sets the field.',
    focus: 'See hitter, score, and count early.',
  },
  infielder: {
    reset: 'Glove tap, ready hop, next ball.',
    approach: 'Be early with your feet and eyes.',
    pressure: 'Slow down the moment, finish clean.',
    confidence: 'Routine plays win innings.',
    focus: 'Pitch-to-pitch ready position.',
  },
  outfielder: {
    reset: 'Deep breath. Read first step.',
    approach: 'Pre-pitch plan, clean first move.',
    pressure: 'Keep the ball in front, hit cutoff.',
    confidence: 'Trust your reads and routes.',
    focus: 'See bat path and contact angle.',
  },
};

export function getBestCue(state: AthleteState | null, context: CueContext): string {
  if (!state) return 'Compete one rep at a time.';
  const pb = state.playbook;
  const custom = pb?.[context]?.trim();
  if (custom) return custom;
  return ROLE_FALLBACK[state.primary_role][context];
}
