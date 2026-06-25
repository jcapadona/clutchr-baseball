import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { setupNotificationsOnce } from '@/lib/notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AthleteProvider, useAthlete } from '@/context/AthleteContext';
import { ToastProvider } from '@/components/Toast';
import { StatusBar } from 'expo-status-bar';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

SplashScreen.preventAutoHideAsync();

// ─── AUTH GATE ───────────────────────────────────────────────────────────────
// Redirects unauthenticated users to /auth
// Redirects users who haven't onboarded to /onboarding

function AuthGate() {
  const { session, isLoading, isOnboardingComplete } = useAthlete();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuthGroup) {
      router.replace('/auth');
    } else if (session && !isOnboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (session && isOnboardingComplete && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, isOnboardingComplete, segments]);

  return <Slot />;
}

// ─── ROOT LAYOUT ─────────────────────────────────────────────────────────────

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: 'test_ddZyQeWyVKzbcoURTIWPTSAUzjc' });
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    setupNotificationsOnce();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'career') router.push('/(tabs)/career');
      if (screen === 'gamemode') router.push('/(tabs)/gamemode');
    });

    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AthleteProvider>
          <StatusBar style="light" />
          <ToastProvider>
            <AuthGate />
          </ToastProvider>
        </AthleteProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}