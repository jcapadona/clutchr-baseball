import React, { useEffect } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
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
  const pct = useSharedValue(0);
  const trackWidthSV = useSharedValue(0);

  useEffect(() => {
    pct.value = withSpring(safe, { damping: 22, stiffness: 120, mass: 0.8 });
  }, [safe]);

  const fillStyle = useAnimatedStyle(() => ({
    width: pct.value * trackWidthSV.value,
  }));

  const r = height / 2;

  return (
    <View
      style={[{ height, backgroundColor: trackColor, borderRadius: r, overflow: 'visible' }, style]}
      onLayout={(e) => { trackWidthSV.value = e.nativeEvent.layout.width; }}
    >
      <Animated.View
        style={[
          {
            height,
            borderRadius: r,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.65,
            shadowRadius: height * 2.5,
            elevation: 4,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}
