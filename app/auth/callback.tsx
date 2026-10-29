import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { applySessionFromUrl, COPY } from '@/lib/emailAuth';

// Landing route for email links (confirm signup). Completes the session, then
// hands off to AuthGate, which applies the same age and consent checks as any
// other sign-in.
export default function AuthCallbackScreen() {
  const insets = useSafeAreaInsets();
  const url = Linking.useURL();
  const handled = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url || handled.current) return;
    handled.current = true;
    applySessionFromUrl(url).then((res) => {
      if (!res.ok) {
        setFailed(true);
        return;
      }
      router.replace((res.type === 'recovery' ? '/reset-password' : '/auth') as any);
    });
  }, [url]);

  // No URL ever arrived (opened by hand, or the link was consumed).
  useEffect(() => {
    const t = setTimeout(() => {
      if (!handled.current) setFailed(true);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.xl }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#0D1A12', '#0A0A0A', '#0A0A0A']} style={StyleSheet.absoluteFill} />
      <View style={styles.body}>
        {failed ? (
          <>
            <Text style={styles.title}>LINK PROBLEM.</Text>
            <Text style={styles.sub}>{COPY.expired}</Text>
          </>
        ) : (
          <ActivityIndicator color={Colors.textSecondary} />
        )}
      </View>
      {failed && (
        <Pressable
          onPress={() => router.replace('/auth')}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text style={styles.ctaText}>Back to sign in</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.xl },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 2 },
  sub: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  cta: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  ctaText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.background },
  pressed: { opacity: 0.85 },
});
