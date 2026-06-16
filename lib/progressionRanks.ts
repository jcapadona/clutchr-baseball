export type ProgressionRankId = 'foundation' | 'built' | 'locked_in' | 'command' | 'elite';

export type ProgressionRank = {
  id: ProgressionRankId;
  name: string;
  shortLabel: string;
  unlockXP: number;
  description: string;
  nextAction: string;
  material: 'green_plate' | 'sharp_plate' | 'steel_plate' | 'gold_plate' | 'elite_crest';
  materialNotes: string;
  iconFallback: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  borderColor: string;
  mutedBorderColor: string;
};

export type RankProgress = {
  currentRank: ProgressionRank;
  nextRank: ProgressionRank | null;
  totalXP: number;
  currentUnlockXP: number;
  nextUnlockXP: number | null;
  xpIntoRank: number;
  xpForNextRank: number | null;
  xpRemaining: number;
  percent: number;
  progressToNextRank: number;
  xpIntoCurrentRank: number;
  xpNeededForNextRank: number | null;
  rankLabel: string;
  rankShortDescription: string;
  rankMaterial: ProgressionRank['material'];
  rankColors: {
    primary: string;
    accent: string;
    surface: string;
    border: string;
  };
  isMaxRank: boolean;
  nextMilestoneLabel: string;
};

export const PROGRESSION_RANKS: ProgressionRank[] = [
  {
    id: 'foundation',
    name: 'Foundation',
    shortLabel: 'BASE',
    unlockXP: 0,
    description: 'First proof of work. You are establishing the base standard.',
    nextAction: 'Keep stacking clean reps to build consistency.',
    material: 'green_plate',
    materialNotes: 'Charcoal home plate with a restrained green edge.',
    iconFallback: 'shield-outline',
    primaryColor: '#22CC5E',
    accentColor: '#22CC5E',
    surfaceColor: '#111714',
    borderColor: 'rgba(34,204,94,0.38)',
    mutedBorderColor: 'rgba(255,255,255,0.12)',
  },
  {
    id: 'built',
    name: 'Built',
    shortLabel: 'BUILT',
    unlockXP: 1000,
    description: 'Consistency is starting to show. Your routine has structure.',
    nextAction: 'Repeat the standard until the routine travels with you.',
    material: 'sharp_plate',
    materialNotes: 'Darker graphite plate with sharper green trim.',
    iconFallback: 'layers-outline',
    primaryColor: '#31E274',
    accentColor: '#22CC5E',
    surfaceColor: '#0D1711',
    borderColor: 'rgba(49,226,116,0.50)',
    mutedBorderColor: 'rgba(49,226,116,0.18)',
  },
  {
    id: 'locked_in',
    name: 'Locked In',
    shortLabel: 'LOCKED',
    unlockXP: 3000,
    description: 'The routine is repeatable. You are proving focus under reps.',
    nextAction: 'Clear higher-pressure reps and make the reset automatic.',
    material: 'steel_plate',
    materialNotes: 'Reinforced black and green plate with a focus mark.',
    iconFallback: 'eye-outline',
    primaryColor: '#39FF88',
    accentColor: '#16A84A',
    surfaceColor: '#07110A',
    borderColor: 'rgba(57,255,136,0.58)',
    mutedBorderColor: 'rgba(57,255,136,0.20)',
  },
  {
    id: 'command',
    name: 'Command',
    shortLabel: 'CMD',
    unlockXP: 7500,
    description: 'Higher standard. You can bring order to pressure moments.',
    nextAction: 'Keep clearing checkpoints and boss reps to hold command.',
    material: 'gold_plate',
    materialNotes: 'Gunmetal home plate with a restrained earned-gold accent.',
    iconFallback: 'compass-outline',
    primaryColor: '#D7DEE3',
    accentColor: '#F5A623',
    surfaceColor: '#15191A',
    borderColor: 'rgba(245,166,35,0.50)',
    mutedBorderColor: 'rgba(245,166,35,0.18)',
  },
  {
    id: 'elite',
    name: 'Elite',
    shortLabel: 'ELITE',
    unlockXP: 15000,
    description: 'Top MVP rank. The work has become a visible standard.',
    nextAction: 'Keep climbing through prestige-ready reps without a finish line.',
    material: 'elite_crest',
    materialNotes: 'Premium black, green, and gold crest-style plate.',
    iconFallback: 'diamond-outline',
    primaryColor: '#F5C451',
    accentColor: '#22CC5E',
    surfaceColor: '#171407',
    borderColor: 'rgba(245,196,81,0.62)',
    mutedBorderColor: 'rgba(245,196,81,0.22)',
  },
];

function normalizeXP(totalXP: number | null | undefined) {
  return Math.max(0, Math.floor(Number.isFinite(Number(totalXP)) ? Number(totalXP) : 0));
}

export function getCurrentRank(totalXP: number | null | undefined): ProgressionRank {
  const safeXP = normalizeXP(totalXP);
  return [...PROGRESSION_RANKS]
    .reverse()
    .find((rank) => safeXP >= rank.unlockXP) ?? PROGRESSION_RANKS[0];
}

export function getNextRank(totalXP: number | null | undefined): ProgressionRank | null {
  const currentRank = getCurrentRank(totalXP);
  const currentIndex = PROGRESSION_RANKS.findIndex((rank) => rank.id === currentRank.id);
  return PROGRESSION_RANKS[currentIndex + 1] ?? null;
}

export function getRankProgress(totalXP: number | null | undefined): RankProgress {
  const safeXP = normalizeXP(totalXP);
  const currentRank = getCurrentRank(safeXP);
  const nextRank = getNextRank(safeXP);
  const currentUnlockXP = currentRank.unlockXP;
  const nextUnlockXP = nextRank?.unlockXP ?? null;
  const xpNeededForNextRank = nextUnlockXP === null ? null : nextUnlockXP - currentUnlockXP;
  const xpIntoCurrentRank = safeXP - currentUnlockXP;
  const xpRemaining = nextUnlockXP === null ? 0 : Math.max(0, nextUnlockXP - safeXP);
  const progressToNextRank = xpNeededForNextRank === null
    ? 1
    : Math.max(0, Math.min(1, xpIntoCurrentRank / xpNeededForNextRank));

  return {
    currentRank,
    nextRank,
    totalXP: safeXP,
    currentUnlockXP,
    nextUnlockXP,
    xpIntoRank: xpIntoCurrentRank,
    xpForNextRank: xpNeededForNextRank,
    xpRemaining,
    percent: progressToNextRank,
    progressToNextRank,
    xpIntoCurrentRank,
    xpNeededForNextRank,
    rankLabel: currentRank.name,
    rankShortDescription: currentRank.description,
    rankMaterial: currentRank.material,
    rankColors: {
      primary: currentRank.primaryColor,
      accent: currentRank.accentColor,
      surface: currentRank.surfaceColor,
      border: currentRank.borderColor,
    },
    isMaxRank: nextRank === null,
    nextMilestoneLabel: nextRank ? `Next rank: ${nextRank.name}` : 'Prestige-ready: keep climbing',
  };
}

export function getRankProgressPercent(totalXP: number | null | undefined): number {
  return getRankProgress(totalXP).progressToNextRank;
}
