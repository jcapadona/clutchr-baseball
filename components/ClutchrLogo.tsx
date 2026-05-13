import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/theme';

export function ClutchrCMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Clutchr C mark">
      <Path
        d="M48 8H20L8 20v28l8 8h30l10-10V34H42v10H22V22h20v8h14V16L48 8Z"
        fill={Colors.textPrimary}
      />
      <Path d="M42 38H22v10h22l12-12v-2H42v4Z" fill={Colors.primary} />
    </Svg>
  );
}

export function ClutchrLogo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <ClutchrCMark size={28} />;
  }

  return (
    <View style={styles.row} accessibilityLabel="Clutchr wordmark">
      <Text style={styles.wordmark}>CLUTCH<Text style={styles.wordmarkAccent}>R</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
  },
  wordmark: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 3.2,
    lineHeight: 28,
  },
  wordmarkAccent: {
    color: Colors.primary,
  },
});
