import React, { useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Animated, ActivityIndicator, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { H } from '@/utils/haptics';

type ScreenContainerProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
};

export function ScreenContainer({ children, scroll, contentContainerStyle, style, showsVerticalScrollIndicator = false }: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  if (scroll) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, style]}>
        <ScrollView
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          contentContainerStyle={[{ paddingBottom: insets.bottom + 100 }, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return <View style={[styles.screen, { paddingTop: insets.top }, style]}>{children}</View>;
}

export function SectionHeader({ title, count, rightLabel, dotColor = Colors.primary, style }: { title: string; count?: number; rightLabel?: string; dotColor?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={[styles.sectionDot, { backgroundColor: dotColor }]} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightLabel ? <Text style={styles.sectionMeta}>{rightLabel}</Text> : null}
      {typeof count === 'number' ? <Text style={styles.sectionMeta}>{count}</Text> : null}
    </View>
  );
}

export function PremiumCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function RolePill({ label, style, textStyle }: { label: string; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle> }) {
  return (
    <View style={[styles.rolePill, style]}>
      <Text style={[styles.rolePillText, textStyle]}>{label}</Text>
    </View>
  );
}

type BtnProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Btn({ label, onPress, variant = 'primary', disabled = false, loading = false, icon, style, textStyle }: BtnProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressOpacity = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === 'primary';

  function pressIn() {
    if (disabled || loading) return;
    H.tap();
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, tension: 300, friction: 20, useNativeDriver: true }),
      Animated.timing(pressOpacity, { toValue: 0.88, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function pressOut() {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 280, friction: 18, useNativeDriver: true }),
      Animated.timing(pressOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={(disabled || loading) ? { opacity: 0.5 } : undefined}
    >
      <Animated.View style={[
        btnStyles.base,
        isPrimary ? [btnStyles.primary, Shadow.green] : btnStyles.secondary,
        { transform: [{ scale }], opacity: pressOpacity },
        style,
      ]}>
        {isPrimary && (
          <View style={[StyleSheet.absoluteFill, { borderRadius: Radius.pill, overflow: 'hidden' }]}>
            <LinearGradient colors={[Colors.primary, '#1BCB5A']} style={StyleSheet.absoluteFill} />
          </View>
        )}
        {loading ? (
          <ActivityIndicator color={isPrimary ? '#000' : Colors.primary} size="small" />
        ) : (
          <>
            <Text style={[btnStyles.text, isPrimary ? btnStyles.textPrimary : btnStyles.textSecondary, textStyle]}>
              {label}
            </Text>
            {icon && <Ionicons name={icon} size={18} color={isPrimary ? '#000' : Colors.textPrimary} />}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function PrimaryActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Btn label={label} onPress={onPress} variant="primary" />;
}

const btnStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
  },
  primary: { backgroundColor: Colors.primary },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  textPrimary: { color: '#000' },
  textSecondary: { color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, flex: 1, letterSpacing: 1 },
  sectionMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rolePill: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  rolePillText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.8 },
});
