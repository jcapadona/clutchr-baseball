import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Two left-pointing chevrons + wordmark.
// Left chevron is smaller and 60% opacity; right is full size and fully opaque.
// Total visual height: 28px.

export function ClutchrLogo() {
  return (
    <View style={styles.row}>
      <Svg width={20} height={28} viewBox="0 0 20 28">
        {/* Left chevron — smaller, 60% opacity */}
        <Path
          d="M 9,8 L 2,14 L 9,20"
          stroke="#22CC5E"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.6}
        />
        {/* Right chevron — full size */}
        <Path
          d="M 18,5 L 10,14 L 18,23"
          stroke="#22CC5E"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
      <Text style={styles.wordmark}>CLUTCHR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    gap: 5,
  },
  wordmark: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    lineHeight: 28,
  },
});
