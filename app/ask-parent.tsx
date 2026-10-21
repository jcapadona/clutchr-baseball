import { Stack, router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function AskParentScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + Spacing.lg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.body}>
        <Text style={styles.tag}>PARENT SETUP</Text>
        <Text style={styles.title}>ASK A PARENT.</Text>
        <Text style={styles.sub}>
          Clutchr needs a parent or guardian to set things up. Hand them this phone. They sign in
          and approve it, then your first rep is ready.
        </Text>
      </View>
      <Pressable onPress={() => router.replace('/auth')} style={styles.cta}>
        <Text style={styles.ctaText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.xl, justifyContent: 'space-between' },
  body: { gap: Spacing.md },
  tag: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary, letterSpacing: 1 },
  title: { fontSize: 52, lineHeight: 54, fontFamily: 'BarlowCondensed_800ExtraBold', color: Colors.textPrimary, letterSpacing: 0.5 },
  sub: { fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 24 },
  cta: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  ctaText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.background },
});
