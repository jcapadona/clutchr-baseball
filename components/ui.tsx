import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
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

export function PrimaryActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={() => { H.tap(); onPress(); }} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
      <LinearGradient colors={[Colors.primary, '#1BCB5A']} style={StyleSheet.absoluteFill} />
      <Text style={styles.ctaText}>{label}</Text>
    </Pressable>
  );
}

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
  cta: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#000' },
});
