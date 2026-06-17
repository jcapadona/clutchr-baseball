import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

type Props = {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({
  value,
  color = Colors.primary,
  trackColor = Colors.border,
  height = 3,
  style,
}: Props) {
  const safe = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const r = height / 2;

  const [trackW, setTrackW] = useState(0);
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trackW === 0) return;
    Animated.spring(fillAnim, {
      toValue: safe * trackW,
      damping: 22,
      stiffness: 120,
      mass: 0.8,
      useNativeDriver: false,
    }).start();
  }, [safe, trackW]);

  return (
    <View
      style={[{ height, backgroundColor: trackColor, borderRadius: r, overflow: 'visible' }, style]}
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={{
          height,
          borderRadius: r,
          backgroundColor: color,
          width: fillAnim,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.65,
          shadowRadius: height * 2.5,
          elevation: 4,
        }}
      />
    </View>
  );
}
