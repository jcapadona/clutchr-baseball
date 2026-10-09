import {
  BarlowCondensed_800ExtraBold,
  BarlowCondensed_800ExtraBold_Italic,
} from '@expo-google-fonts/barlow-condensed';
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
import { ProProvider } from '@/context/ProContext';
import { ToastProvider } from '@/components/Toast';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

SplashScreen.preventAutoHideAsync();

// ─── REVENUECAT — module-scope configure ─────────────────────────────────────
// Must run before any component effect fires. React fires child effects before
// parent effects, so a useEffect here would be too late — ProProvider's
// getCustomerInfo() and AthleteContext's logIn() would call into an
// unconfigured SDK. Module evaluation happens before rendering starts.
if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
Purchases.configure({
  apiKey: Constants.appOwnership === 'expo'
    ? (process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY ?? '')
    : (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? ''),
});

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
    BarlowCondensed_800ExtraBold,
    BarlowCondensed_800ExtraBold_Italic,
  });
  if (fontError) console.warn('Font loading error:', fontError);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    setupNotificationsOnce().catch((err) => console.warn('setupNotificationsOnce error:', err));

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
          <ProProvider>
            <StatusBar style="light" />
            <ToastProvider>
              <AuthGate />
            </ToastProvider>
          </ProProvider>
        </AthleteProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}