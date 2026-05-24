import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { getCurrentRank, type ProgressionRank } from '@/lib/progressionRanks';

export type EmblemBadgeSize = 'small' | 'medium' | 'large';

type EmblemBadgeProps = {
  rank?: ProgressionRank;
  totalXP?: number | null;
  size?: EmblemBadgeSize;
  showLabel?: boolean;
  locked?: boolean;
};

const BADGE_IMAGES: Record<string, any> = {
  foundation: require('../assets/badges/foundation-badge.png'),
  built: require('../assets/badges/built-badge.png'),
  locked_in: require('../assets/badges/locked-in-badge.png'),
  command: require('../assets/badges/command-badge.png'),
  elite: require('../assets/badges/elite-badge.png'),
};

const SIZE_MAP = {
  small: { box: 32, label: 8 },
  medium: { box: 56, label: 9 },
  large: { box: 88, label: 11 },
} as const;

export function EmblemBadge({ rank, totalXP, size = 'medium', showLabel = false, locked = false }: EmblemBadgeProps) {
  const resolvedRank = rank ?? getCurrentRank(totalXP ?? 0);
  const dims = SIZE_MAP[size];
  const source = BADGE_IMAGES[resolvedRank.id];

  return (
    <View style={styles.wrap} accessibilityLabel={`${resolvedRank.name} rank emblem`}>
      <View style={[styles.badgeShell, { width: dims.box, height: dims.box }, locked && styles.locked]}>
        {source ? (
          <Image
            source={source}
            style={{ width: dims.box, height: dims.box, backgroundColor: 'transparent' }}
            resizeMode="contain"
          />
        ) : (
          <Svg width={dims.box} height={dims.box}>
            <Polygon
              points={`${dims.box * 0.5},${dims.box * 0.06} ${dims.box * 0.88},${dims.box * 0.22} ${dims.box * 0.82},${dims.box * 0.72} ${dims.box * 0.5},${dims.box * 0.94} ${dims.box * 0.18},${dims.box * 0.72} ${dims.box * 0.12},${dims.box * 0.22}`}
              fill="#111714"
              stroke="rgba(255,255,255,0.20)"
              strokeWidth={1.5}
            />
          </Svg>
        )}
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: resolvedRank.primaryColor, fontSize: dims.label }]}>
          {locked ? 'LOCKED' : resolvedRank.shortLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeShell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
  },
  locked: {
    opacity: 0.35,
  },
  label: {
    marginTop: 3,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
});
