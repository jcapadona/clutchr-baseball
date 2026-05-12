import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon, Polyline } from 'react-native-svg';
import { getCurrentRank, type ProgressionRank } from '@/lib/progressionRanks';

export type EmblemBadgeSize = 'small' | 'medium' | 'large';

type EmblemBadgeProps = {
  rank?: ProgressionRank;
  totalXP?: number | null;
  size?: EmblemBadgeSize;
  showLabel?: boolean;
  locked?: boolean;
};

const SIZE_MAP = {
  small: { box: 32, icon: 11, label: 8, stroke: 1.5 },
  medium: { box: 50, icon: 16, label: 9, stroke: 1.75 },
  large: { box: 72, icon: 22, label: 11, stroke: 2 },
} as const;

export function EmblemBadge({ rank, totalXP, size = 'medium', showLabel = false, locked = false }: EmblemBadgeProps) {
  const resolvedRank = rank ?? getCurrentRank(totalXP ?? 0);
  const dims = SIZE_MAP[size];
  const points = `${dims.box * 0.5},${dims.box * 0.06} ${dims.box * 0.88},${dims.box * 0.22} ${dims.box * 0.82},${dims.box * 0.72} ${dims.box * 0.5},${dims.box * 0.94} ${dims.box * 0.18},${dims.box * 0.72} ${dims.box * 0.12},${dims.box * 0.22}`;
  const notch = `${dims.box * 0.28},${dims.box * 0.69} ${dims.box * 0.5},${dims.box * 0.81} ${dims.box * 0.72},${dims.box * 0.69}`;
  const edgeColor = locked ? resolvedRank.mutedBorderColor : resolvedRank.borderColor;
  const accentColor = locked ? 'rgba(255,255,255,0.24)' : resolvedRank.accentColor;
  const primaryColor = locked ? 'rgba(255,255,255,0.38)' : resolvedRank.primaryColor;

  return (
    <View style={[styles.wrap, locked && styles.locked]} accessibilityLabel={`${resolvedRank.name} rank emblem`}>
      <View style={[styles.badgeShell, { width: dims.box, height: dims.box }]}>
        <Svg width={dims.box} height={dims.box} style={StyleSheet.absoluteFill}>
          <Polygon points={points} fill={locked ? '#101210' : resolvedRank.surfaceColor} stroke={edgeColor} strokeWidth={dims.stroke} />
          <Polygon
            points={`${dims.box * 0.5},${dims.box * 0.14} ${dims.box * 0.78},${dims.box * 0.26} ${dims.box * 0.73},${dims.box * 0.66} ${dims.box * 0.5},${dims.box * 0.82} ${dims.box * 0.27},${dims.box * 0.66} ${dims.box * 0.22},${dims.box * 0.26}`}
            fill="rgba(255,255,255,0.025)"
            stroke={locked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.10)'}
            strokeWidth={1}
          />
          <Line x1={dims.box * 0.32} y1={dims.box * 0.31} x2={dims.box * 0.68} y2={dims.box * 0.31} stroke={edgeColor} strokeWidth={dims.stroke} strokeLinecap="round" />
          <Polyline points={notch} fill="none" stroke={accentColor} strokeWidth={dims.stroke + 0.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <LinearGradient
          colors={locked ? ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.00)'] : ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.00)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Ionicons name={(locked ? 'lock-closed-outline' : resolvedRank.iconFallback) as any} size={dims.icon} color={primaryColor} />
      </View>
      {showLabel && <Text style={[styles.label, { color: primaryColor, fontSize: dims.label }]}>{locked ? 'LOCKED' : resolvedRank.shortLabel}</Text>}
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
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
  },
  locked: {
    opacity: 0.58,
  },
  label: {
    marginTop: 3,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
});
