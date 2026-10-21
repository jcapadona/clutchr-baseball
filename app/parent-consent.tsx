import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { supabase } from '@/lib/supabase';
import { POLICY_VERSION } from '@/lib/ageGate';
import { Colors, Radius, Spacing } from '@/constants/theme';

const COLLECTS = [
  'First name',
  'Position and level',
  'Progress and XP',
  'Saved cue words',
  'Sign-in email',
];
const DOES_NOT = ['No ads', 'No analytics', 'No location', 'No recordings'];

export default function ParentConsentScreen() {
  const insets = useSafeAreaInsets();
  const { session, ageGate, grantConsent, signOut } = useAthlete();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const onAgree = async () => {
    if (saving) return;
    const user = session?.user;
    if (!user?.email) {
      setFailed(true);
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      const { error } = await supabase.from('parental_consents').insert({
        parent_user_id: user.id,
        parent_email: user.email,
        child_first_name: null,
        child_birth_year: ageGate?.birth_year ?? null,
        policy_version: POLICY_VERSION,
      });
      // 23505: this account already has a consent row, which is the same outcome.
      if (error && error.code !== '23505') throw error;
      grantConsent();
    } catch (e) {
      console.warn('Consent save failed:', e);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.notice}>
          Please sign in with a parent or guardian account, not your child's.
        </Text>
        <Text style={styles.tag}>PARENT OR GUARDIAN</Text>
        <Text style={styles.title}>APPROVE CLUTCHR.</Text>
        <Text style={styles.sub}>
          Your child wants to train with Clutchr. Here is exactly what the app handles.
        </Text>

        <Text style={styles.label}>WHAT CLUTCHR COLLECTS</Text>
        <View style={styles.card}>
          {COLLECTS.map((t) => (
            <Text key={t} style={styles.item}>{t}</Text>
          ))}
        </View>

        <Text style={styles.label}>WHAT CLUTCHR DOES NOT COLLECT</Text>
        <View style={styles.card}>
          {DOES_NOT.map((t) => (
            <Text key={t} style={styles.item}>{t}</Text>
          ))}
        </View>

        <Text style={styles.body}>
          Reminder notifications run through Expo, and purchases run through RevenueCat.
        </Text>
        <Text style={styles.body}>
          A parent can ask us to delete everything at any time. The privacy policy explains how.
        </Text>

        <View style={styles.linkRow}>
          <Pressable onPress={() => Linking.openURL('https://clutchr.app/privacy')} hitSlop={8}>
            <Text style={styles.link}>Privacy Policy</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://clutchr.app/terms')} hitSlop={8}>
            <Text style={styles.link}>Terms</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.ctaArea, { paddingBottom: insets.bottom + Spacing.md }]}>
        {failed && (
          <Text style={styles.error}>
            We could not save your approval. Check your connection and try again.
          </Text>
        )}
        <Pressable onPress={onAgree} disabled={saving} style={[styles.cta, saving && { opacity: 0.6 }]}>
          {saving ? (
            <ActivityIndicator color={Colors.background} size="small" />
          ) : (
            <Text style={styles.ctaText}>
              {failed ? 'Try again' : 'I am the parent or guardian and I agree'}
            </Text>
          )}
        </Pressable>
        <Pressable onPress={signOut} hitSlop={8}>
          <Text style={styles.signOut}>Wrong account? Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.md },
  notice: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.warning, lineHeight: 18,
    backgroundColor: Colors.warningMuted, borderWidth: 1, borderColor: Colors.warningBorder,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  tag: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary, letterSpacing: 1, marginTop: Spacing.sm },
  title: { fontSize: 44, lineHeight: 46, fontFamily: 'BarlowCondensed_800ExtraBold', color: Colors.textPrimary, letterSpacing: 0.5 },
  sub: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 22 },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary, letterSpacing: 1, marginTop: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.sm,
  },
  item: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  body: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 21 },
  linkRow: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.xs },
  link: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  ctaArea: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.background },
  error: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.danger, textAlign: 'center' },
  cta: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md, alignItems: 'center' },
  ctaText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.background, textAlign: 'center' },
  signOut: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.xs },
});
