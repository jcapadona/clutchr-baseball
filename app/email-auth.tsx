import { Ionicons } from '@expo/vector-icons';
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
import {
  COPY,
  EMAIL_REDIRECT,
  isValidEmail,
  MIN_PASSWORD,
  RESET_REDIRECT,
  signInErrorMessage,
  signUpErrorMessage,
} from '@/lib/emailAuth';

type Mode = 'signin' | 'create' | 'forgot' | 'confirm_sent' | 'reset_sent';

const RESEND_SECONDS = 60;

// Email and password sign-in. Reached from /auth after the age screen. A session
// from any path here flows through AuthGate exactly like Google and Apple.
export default function EmailAuthScreen() {
  const insets = useSafeAreaInsets();
  const { ageGate, ageGateLoaded } = useAthlete();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const parentPath = ageGate?.age_group === 'under13';

  // The age screen always comes first. Never reachable without an answer.
  useEffect(() => {
    if (ageGateLoaded && !ageGate) router.replace('/age' as any);
  }, [ageGateLoaded, ageGate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!ageGateLoaded || !ageGate) return <View style={styles.container} />;

  function go(next: Mode) {
    setMode(next);
    setError(null);
    setUnconfirmed(false);
    setPassword('');
    setConfirm('');
  }

  // One request at a time. The ref blocks double taps before state updates.
  async function run(fn: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await fn();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const trimmed = email.trim();

  const onSignIn = () => {
    setError(null);
    setUnconfirmed(false);
    if (!isValidEmail(trimmed)) return setError(COPY.invalidEmail);
    if (password.length < MIN_PASSWORD) return setError(COPY.shortPassword);
    return run(async () => {
      const { error: err } = await supabase.auth.signInWithPassword({ email: trimmed, password });
      if (err) {
        const m = signInErrorMessage(err);
        setError(m.message);
        setUnconfirmed(m.unconfirmed);
      }
    });
  };

  const onCreate = () => {
    setError(null);
    if (!isValidEmail(trimmed)) return setError(COPY.invalidEmail);
    if (password.length < MIN_PASSWORD) return setError(COPY.shortPassword);
    if (password !== confirm) return setError(COPY.mismatch);
    return run(async () => {
      const { data, error: err } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: { emailRedirectTo: EMAIL_REDIRECT },
      });
      if (err) {
        setError(signUpErrorMessage(err));
        return;
      }
      // A session means Confirm email is off: AuthGate continues from here.
      if (data.session) return;
      // No session: confirmation is required. An existing address returns a
      // user with no identities and no error, and gets the same screen.
      setPassword('');
      setConfirm('');
      setMode('confirm_sent');
      setCooldown(RESEND_SECONDS);
    });
  };

  const onResendConfirm = () => {
    if (cooldown > 0) return;
    setError(null);
    return run(async () => {
      const { error: err } = await supabase.auth.resend({
        type: 'signup',
        email: trimmed,
        options: { emailRedirectTo: EMAIL_REDIRECT },
      });
      if (err) {
        const m = signUpErrorMessage(err);
        setError(m === COPY.createFailed ? COPY.generic : m);
        return;
      }
      setCooldown(RESEND_SECONDS);
    });
  };

  const onForgot = () => {
    if (cooldown > 0) return;
    setError(null);
    if (!isValidEmail(trimmed)) return setError(COPY.invalidEmail);
    return run(async () => {
      const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: RESET_REDIRECT,
      });
      // Same confirmation whether or not the address has an account. Only a
      // missing connection is shown, since nothing was sent.
      if (err && signInErrorMessage(err).message === COPY.offline) {
        setError(COPY.offline);
        return;
      }
      setMode('reset_sent');
      setCooldown(RESEND_SECONDS);
    });
  };

  const onResendUnconfirmed = () => {
    setMode('confirm_sent');
    setCooldown(0);
    return onResendConfirm();
  };

  const title =
    mode === 'create' ? 'CREATE YOUR ACCOUNT.'
    : mode === 'forgot' ? 'RESET YOUR PASSWORD.'
    : mode === 'confirm_sent' ? 'CHECK YOUR EMAIL.'
    : mode === 'reset_sent' ? 'CHECK YOUR EMAIL.'
    : parentPath ? 'PARENT SIGN IN.'
    : 'WELCOME BACK.';

  const sent = mode === 'confirm_sent' || mode === 'reset_sent';
  const emailField = (
    <TextInput
      style={styles.input}
      value={email}
      onChangeText={setEmail}
      placeholder="Email"
      placeholderTextColor={Colors.textTertiary}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="username"
      autoComplete="email"
      editable={!busy}
    />
  );

  const passwordField = (isNew: boolean, value: string, set: (v: string) => void, placeholder: string, withToggle: boolean) => (
    <View style={styles.inputRow}>
      <TextInput
        style={[styles.input, withToggle && { paddingRight: 48 }]}
        value={value}
        onChangeText={set}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={isNew ? 'newPassword' : 'password'}
        autoComplete={isNew ? 'new-password' : 'current-password'}
        editable={!busy}
      />
      {withToggle && (
        <Pressable
          onPress={() => setShow((s) => !s)}
          hitSlop={8}
          style={({ pressed }) => [styles.eye, pressed && styles.pressed]}
          accessibilityLabel={show ? 'Hide password' : 'Show password'}
        >
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );

  const submitLabel = mode === 'create' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in';
  const onSubmit = mode === 'create' ? onCreate : mode === 'forgot' ? onForgot : onSignIn;
  const submitDisabled = busy || (mode === 'forgot' && cooldown > 0);

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
          <Pressable
            onPress={() => router.replace('/auth')}
            hitSlop={8}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.block}>
            <Text style={styles.title}>{title}</Text>

            {sent ? (
              <>
                <Text style={styles.sub}>
                  {mode === 'confirm_sent'
                    ? `We sent a link to ${trimmed}. Open it on this phone to finish.`
                    : 'If that email has an account, a reset link is on its way.'}
                </Text>
                {error && <Text style={styles.errorText}>{error}</Text>}
                <Pressable
                  onPress={mode === 'confirm_sent' ? onResendConfirm : onForgot}
                  disabled={busy || cooldown > 0}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    (busy || cooldown > 0) && { opacity: 0.5 },
                    pressed && styles.pressed,
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator color={Colors.textPrimary} size="small" />
                  ) : (
                    <Text style={styles.secondaryText}>
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                {parentPath && mode !== 'forgot' && (
                  <Text style={styles.sub}>Use a parent or guardian email, not your child's.</Text>
                )}
                {mode === 'forgot' && (
                  <Text style={styles.sub}>Enter your email and we will send you a link.</Text>
                )}

                {emailField}
                {mode !== 'forgot' && passwordField(mode === 'create', password, setPassword, 'Password', true)}
                {mode === 'create' && passwordField(true, confirm, setConfirm, 'Confirm password', false)}
                {mode === 'create' && <Text style={styles.hint}>At least 8 characters.</Text>}

                {error && <Text style={styles.errorText}>{error}</Text>}
                {unconfirmed && (
                  <Pressable
                    onPress={onResendUnconfirmed}
                    disabled={busy}
                    hitSlop={8}
                    style={({ pressed }) => [styles.link, pressed && styles.pressed]}
                  >
                    <Text style={styles.linkText}>Send the link again</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={onSubmit}
                  disabled={submitDisabled}
                  style={({ pressed }) => [styles.cta, submitDisabled && { opacity: 0.6 }, pressed && styles.pressed]}
                >
                  {busy ? (
                    <ActivityIndicator color={Colors.background} size="small" />
                  ) : (
                    <Text style={styles.ctaText}>
                      {mode === 'forgot' && cooldown > 0 ? `Resend in ${cooldown}s` : submitLabel}
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.links}>
            {mode === 'signin' && (
              <>
                <Pressable onPress={() => go('forgot')} hitSlop={8} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                  <Text style={styles.linkText}>Forgot password?</Text>
                </Pressable>
                <Pressable onPress={() => go('create')} hitSlop={8} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                  <Text style={styles.linkText}>New here? Create an account</Text>
                </Pressable>
              </>
            )}
            {mode === 'create' && (
              <Pressable onPress={() => go('signin')} hitSlop={8} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                <Text style={styles.linkText}>Have an account? Sign in</Text>
              </Pressable>
            )}
            {(mode === 'forgot' || sent) && (
              <Pressable onPress={() => go('signin')} hitSlop={8} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                <Text style={styles.linkText}>Back to sign in</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.xl },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  backText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  block: { gap: Spacing.md },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 2 },
  sub: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 22 },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
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
  eye: { position: 'absolute', right: Spacing.lg },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.danger },
  cta: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  ctaText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.background },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  secondaryText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  links: { gap: Spacing.sm, alignItems: 'center' },
  link: { paddingVertical: Spacing.sm, alignItems: 'center' },
  linkText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textDecorationLine: 'underline' },
  pressed: { opacity: 0.7 },
});
