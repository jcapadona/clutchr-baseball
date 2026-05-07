export type ProgressionRankId = 'foundation' | 'built' | 'locked_in' | 'command' | 'elite';

export type ProgressionRank = {
  id: ProgressionRankId;
  name: string;
  shortLabel: string;
  unlockXP: number;
  materialNotes: string;
  iconFallback: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  borderColor: string;
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
};

export const PROGRESSION_RANKS: ProgressionRank[] = [
  {
    id: 'foundation',
    name: 'Foundation',
    shortLabel: 'BASE',
    unlockXP: 0,
    materialNotes: 'Charcoal plate with a restrained green edge.',
    iconFallback: 'shield-outline',
    primaryColor: '#22CC5E',
    accentColor: '#22CC5E',
    surfaceColor: '#121614',
    borderColor: 'rgba(34,204,94,0.34)',
  },
  {
    id: 'built',
    name: 'Built',
    shortLabel: 'BUILT',
    unlockXP: 1000,
    materialNotes: 'Darker graphite plate with stronger green trim.',
    iconFallback: 'layers-outline',
    primaryColor: '#31E274',
    accentColor: '#22CC5E',
    surfaceColor: '#0D1711',
    borderColor: 'rgba(49,226,116,0.48)',
  },
  {
    id: 'locked_in',
    name: 'Locked In',
    shortLabel: 'LOCKED',
    unlockXP: 3000,
    materialNotes: 'Black and green reinforced badge.',
    iconFallback: 'eye-outline',
    primaryColor: '#39FF88',
    accentColor: '#16A84A',
    surfaceColor: '#07110A',
    borderColor: 'rgba(57,255,136,0.55)',
  },
  {
    id: 'command',
    name: 'Command',
    shortLabel: 'CMD',
    unlockXP: 7500,
    materialNotes: 'Gunmetal badge with a restrained gold accent.',
    iconFallback: 'compass-outline',
    primaryColor: '#D7DEE3',
    accentColor: '#F5A623',
    surfaceColor: '#15191A',
    borderColor: 'rgba(245,166,35,0.48)',
  },
  {
    id: 'elite',
    name: 'Elite',
    shortLabel: 'ELITE',
    unlockXP: 15000,
    materialNotes: 'Premium gold, green, and black crest-style badge.',
    iconFallback: 'diamond-outline',
    primaryColor: '#F5C451',
    accentColor: '#22CC5E',
    surfaceColor: '#171407',
    borderColor: 'rgba(245,196,81,0.58)',
  },
];

function normalizeXP(totalXP: number | null | undefined) {
  return Math.max(0, Number.isFinite(Number(totalXP)) ? Number(totalXP) : 0);
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
  const xpForNextRank = nextUnlockXP === null ? null : nextUnlockXP - currentUnlockXP;
  const xpIntoRank = safeXP - currentUnlockXP;
  const xpRemaining = nextUnlockXP === null ? 0 : Math.max(0, nextUnlockXP - safeXP);
  const percent = xpForNextRank === null ? 1 : Math.max(0, Math.min(1, xpIntoRank / xpForNextRank));

  return {
    currentRank,
    nextRank,
    totalXP: safeXP,
    currentUnlockXP,
    nextUnlockXP,
    xpIntoRank,
    xpForNextRank,
    xpRemaining,
    percent,
  };
}

export function getRankProgressPercent(totalXP: number | null | undefined): number {
  return getRankProgress(totalXP).percent;
}
