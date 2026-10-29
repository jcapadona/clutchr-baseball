import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { supabase } from '@/lib/supabase';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { applySessionFromUrl, COPY, MIN_PASSWORD, parseAuthUrl } from '@/lib/emailAuth';

type Phase = 'loading' | 'ready' | 'expired';

// Set a new password after a recovery link. The link signs the user in, so the
// screen checks for a session (from the link or from /auth/callback) first.
export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAthlete();
  const url = Linking.useURL();
  const started = useRef(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || started.current) return;
    const p = parseAuthUrl(url);
    if (!p.accessToken && !p.code && !p.hasError) return;
    started.current = true;
    applySessionFromUrl(url).then((res) => setPhase(res.ok ? 'ready' : 'expired'));
  }, [url]);

  // No link in the URL: fall back to an existing session (came from /auth/callback).
  useEffect(() => {
    const t = setTimeout(async () => {
      if (started.current) return;
      started.current = true;
      const { data } = await supabase.auth.getSession();
      setPhase(data.session ? 'ready' : 'expired');
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const backToSignIn = async () => {
    await signOut();
    router.replace('/auth');
  };

  const onSave = async () => {
    if (busy) return;
    setError(null);
    if (password.length < MIN_PASSWORD) return setError(COPY.shortPassword);
    if (password !== confirm) return setError(COPY.mismatch);
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.code === 'weak_password' ? COPY.shortPassword : COPY.generic);
        return;
      }
      router.replace('/auth');
    } catch {
      setError(COPY.offline);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.xl }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#0D1A12', '#0A0A0A', '#0A0A0A']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {phase === 'loading' && (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.textSecondary} />
            </View>
          )}

          {phase === 'expired' && (
            <View style={styles.block}>
              <Text style={styles.title}>LINK PROBLEM.</Text>
              <Text style={styles.sub}>{COPY.expired}</Text>
            </View>
          )}

          {phase === 'ready' && (
            <View style={styles.block}>
              <Text style={styles.title}>SET A NEW PASSWORD.</Text>
              <Text style={styles.sub}>At least 8 characters.</Text>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="New password"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  editable={!busy}
                />
                <Pressable
                  onPress={() => setShow((s) => !s)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.eye, pressed && styles.pressed]}
                  accessibilityLabel={show ? 'Hide password' : 'Show password'}
                >
                  <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                </Pressable>
              </View>
              <TextInput
                style={[styles.input, styles.inputSolo]}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Confirm password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={!show}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="new-password"
                editable={!busy}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                onPress={onSave}
                disabled={busy}
                style={({ pressed }) => [styles.cta, busy && { opacity: 0.6 }, pressed && styles.pressed]}
              >
                {busy ? (
                  <ActivityIndicator color={Colors.background} size="small" />
                ) : (
                  <Text style={styles.ctaText}>Save password</Text>
                )}
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={backToSignIn}
            disabled={busy}
            hitSlop={8}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Text style={styles.linkText}>Back to sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  center: { alignItems: 'center' },
  block: { gap: Spacing.md },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 2 },
  sub: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 22 },
  inputRow: { justifyContent: 'center' },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
  inputSolo: {},
  eye: { position: 'absolute', right: Spacing.lg },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.danger },
  cta: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  ctaText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.background },
  link: { alignItems: 'center', paddingVertical: Spacing.sm },
  linkText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textDecorationLine: 'underline' },
  pressed: { opacity: 0.7 },
});
