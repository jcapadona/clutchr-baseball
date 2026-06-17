import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { H } from '@/utils/haptics';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const btnScale = useRef(new Animated.Value(1)).current;
  const btnOpacity = useRef(new Animated.Value(1)).current;

  function pressIn() {
    if (loading) return;
    H.tap();
    Animated.parallel([
      Animated.spring(btnScale, { toValue: 0.97, tension: 300, friction: 20, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 0.88, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function pressOut() {
    Animated.parallel([
      Animated.spring(btnScale, { toValue: 1, tension: 280, friction: 18, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }

const handleGoogleSignIn = async () => {
  try {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'clutchrbaseball://auth/callback',
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'clutchrbaseball://auth/callback'
      );

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        
        // Try hash params first (implicit flow)
        const hashParams = new URLSearchParams(url.hash.replace('#', ''));
        const accessToken = hashParams.get('access_token') ?? url.searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') ?? url.searchParams.get('refresh_token');

        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (sessionError) throw sessionError;
        } else {
          // Try exchanging code for session
          const code = url.searchParams.get('code');
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
          }
        }
      }
    }
  } catch (err: any) {
    setError('Sign in failed. Try again.');
    console.error('Auth error:', err);
  } finally {
    setLoading(false);
  }
};

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <LinearGradient
        colors={['#0D1A12', '#0A0A0A', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo */}
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <Text style={styles.logoChevron}>{'<<'}</Text>
          </View>
          <Text style={styles.brandName}>CLUTCHR</Text>
          <Text style={styles.sport}>BASEBALL</Text>
        </View>

        <View style={styles.taglineArea}>
          <Text style={styles.tagline1}>TRAIN THE MIND.</Text>
          <Text style={styles.tagline2}>WIN THE MOMENT.</Text>
        </View>

        {/* Feature pills */}
        <View style={styles.pillsRow}>
          {['ROLE-AWARE', 'GAME-READY', 'BASEBALL-NATIVE'].map((label) => (
            <View key={label} style={styles.pill}>
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomArea}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          onPress={handleGoogleSignIn}
          onPressIn={pressIn}
          onPressOut={pressOut}
          disabled={loading}
          style={loading ? { opacity: 0.6 } : undefined}
        >
          <Animated.View style={[
            styles.googleBtn,
            Shadow.green,
            { transform: [{ scale: btnScale }], opacity: btnOpacity },
          ]}>
            {loading ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color={Colors.background} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </Animated.View>
        </Pressable>

        <Text style={styles.legal}>
          By continuing, you agree to train harder.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  logoArea: {
    alignItems: 'center',
    gap: 6,
  },
  logoMark: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  logoChevron: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: Colors.background,
    letterSpacing: -3,
  },
  brandName: {
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 6,
  },
  sport: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    letterSpacing: 8,
    marginTop: 2,
  },
  taglineArea: {
    alignItems: 'center',
    gap: 4,
  },
  tagline1: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  tagline2: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
  },
  bottomArea: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.danger,
    textAlign: 'center',
  },
  googleBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.background,
  },
  legal: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});