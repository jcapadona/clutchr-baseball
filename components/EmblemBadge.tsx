import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon, Polyline } from 'react-native-svg';
import { getCurrentRank, type ProgressionRank } from '@/lib/progressionRanks';

export type EmblemBadgeSize = 'small' | 'medium' | 'large';

type EmblemBadgeProps = {
  rank?: ProgressionRank;
  totalXP?: number | null;
  size?: EmblemBadgeSize;
  showLabel?: boolean;
};

const SIZE_MAP = {
  small: { box: 34, icon: 12, label: 8 },
  medium: { box: 52, icon: 17, label: 9 },
  large: { box: 72, icon: 23, label: 11 },
} as const;

export function EmblemBadge({ rank, totalXP, size = 'medium', showLabel = false }: EmblemBadgeProps) {
  const resolvedRank = rank ?? getCurrentRank(totalXP ?? 0);
  const dims = SIZE_MAP[size];
  const points = `${dims.box * 0.5},${dims.box * 0.06} ${dims.box * 0.88},${dims.box * 0.22} ${dims.box * 0.82},${dims.box * 0.72} ${dims.box * 0.5},${dims.box * 0.94} ${dims.box * 0.18},${dims.box * 0.72} ${dims.box * 0.12},${dims.box * 0.22}`;
  const notch = `${dims.box * 0.28},${dims.box * 0.7} ${dims.box * 0.5},${dims.box * 0.82} ${dims.box * 0.72},${dims.box * 0.7}`;

  return (
    <View style={styles.wrap} accessibilityLabel={`${resolvedRank.name} rank emblem`}>
      <View style={[styles.badgeShell, { width: dims.box, height: dims.box }]}>
        <Svg width={dims.box} height={dims.box} style={StyleSheet.absoluteFill}>
          <Polygon points={points} fill={resolvedRank.surfaceColor} stroke={resolvedRank.borderColor} strokeWidth={2} />
          <Polygon
            points={`${dims.box * 0.5},${dims.box * 0.14} ${dims.box * 0.78},${dims.box * 0.26} ${dims.box * 0.73},${dims.box * 0.66} ${dims.box * 0.5},${dims.box * 0.82} ${dims.box * 0.27},${dims.box * 0.66} ${dims.box * 0.22},${dims.box * 0.26}`}
            fill="rgba(255,255,255,0.025)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
          <Polyline points={notch} fill="none" stroke={resolvedRank.accentColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.00)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Ionicons name={resolvedRank.iconFallback as any} size={dims.icon} color={resolvedRank.primaryColor} />
      </View>
      {showLabel && <Text style={[styles.label, { color: resolvedRank.primaryColor, fontSize: dims.label }]}>{resolvedRank.shortLabel}</Text>}
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
    overflow: 'hidden',
  },
  label: {
    marginTop: 3,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
});
