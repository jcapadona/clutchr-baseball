import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  valueLabel?: string;
};

export function ProgressRing({
  value,
  size = 72,
  strokeWidth = 5,
  color = Colors.primary,
  trackColor = 'rgba(255,255,255,0.07)',
  label,
  valueLabel,
}: Props) {
  const safe = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const RADIUS = (size - strokeWidth) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(safe, { damping: 18, stiffness: 90, mass: 0.9 });
  }, [safe]);

  const fillProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const glowProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const cx = size / 2;
  const cy = size / 2;
  const displayVal = valueLabel ?? `${Math.round(safe * 100)}`;

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Track */}
          <Circle
            cx={cx} cy={cy} r={RADIUS}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Glow layer — wider stroke, low opacity */}
          <AnimatedCircle
            cx={cx} cy={cy} r={RADIUS}
            stroke={color}
            strokeWidth={strokeWidth + 5}
            strokeOpacity={0.18}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            animatedProps={glowProps}
          />
          {/* Fill layer */}
          <AnimatedCircle
            cx={cx} cy={cy} r={RADIUS}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            animatedProps={fillProps}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, styles.center]}>
          <Text style={[styles.valueText, { fontSize: Math.round(size * 0.22) }]}>
            {displayVal}
          </Text>
        </View>
      </View>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 5 },
  center: { alignItems: 'center', justifyContent: 'center' },
  valueText: { fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  label: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },
});
