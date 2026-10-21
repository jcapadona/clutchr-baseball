import { Stack, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { H } from '@/utils/haptics';

const YEAR_SPAN = 90;

export default function AgeScreen() {
  const insets = useSafeAreaInsets();
  const { session, answerAge } = useAthlete();
  const [year, setYear] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: YEAR_SPAN + 1 }, (_, i) => now - i);
  }, []);

  const onContinue = async () => {
    if (year === null || busy) return;
    setBusy(true);
    try {
      const gate = await answerAge(year);
      // Signed in: AuthGate takes it from here once the answer lands.
      if (!session) router.replace((gate.age_group === 'under13' ? '/ask-parent' : '/auth') as any);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.lg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.tag}>BEFORE WE START</Text>
      <Text style={styles.title}>HOW OLD ARE YOU?</Text>
      <Text style={styles.sub}>Pick your birth year. We use it to set up Clutchr the right way.</Text>

      <View style={styles.listWrap}>
        <FlatList
          data={years}
          keyExtractor={(y) => String(y)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = item === year;
            return (
              <Pressable
                style={[styles.row, active && styles.rowActive]}
                onPress={() => { H.tap(); setYear(item); }}
              >
                <Text style={[styles.rowText, active && styles.rowTextActive]}>{item}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      <Pressable
        onPress={onContinue}
        disabled={year === null || busy}
        style={[styles.cta, (year === null || busy) && { opacity: 0.5 }]}
      >
        <Text style={styles.ctaText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.xl, gap: Spacing.md },
  tag: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary, letterSpacing: 1 },
  title: { fontSize: 44, lineHeight: 46, fontFamily: 'BarlowCondensed_800ExtraBold', color: Colors.textPrimary, letterSpacing: 0.5 },
  sub: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 22 },
  listWrap: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginVertical: Spacing.sm,
  },
  row: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  rowActive: { backgroundColor: Colors.primaryMuted },
  rowText: { fontSize: 18, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  rowTextActive: { color: Colors.primary, fontFamily: 'Inter_700Bold' },
  cta: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  ctaText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.background },
});
