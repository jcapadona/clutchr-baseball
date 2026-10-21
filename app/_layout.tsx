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
// Signed out: age screen first, then /auth. An under-13 answer is locked on the
// device and routes through /ask-parent.
// Signed in: under-13 accounts must save a parent consent before onboarding.
// Everyone else is redirected to /onboarding or the tabs as before.

function AuthGate() {
  const { session, isLoading, isOnboardingComplete, ageGate, ageGateLoaded, consent } = useAthlete();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !ageGateLoaded) return;

    const seg = segments[0] as string | undefined;
    const inAuthGroup = seg === 'auth';
    const inOnboarding = seg === 'onboarding';

    if (!session) {
      if (!ageGate) {
        if (seg !== 'age') router.replace('/age' as any);
      } else if (ageGate.age_group === 'under13') {
        if (seg !== 'ask-parent' && !inAuthGroup) router.replace('/ask-parent' as any);
      } else if (seg !== 'age' && !inAuthGroup) {
        router.replace('/auth');
      }
      return;
    }

    if (consent === 'unknown') return;
    if (consent === 'needs_age') {
      if (seg !== 'age') router.replace('/age' as any);
      return;
    }
    if (consent === 'required') {
      if (seg !== 'parent-consent') router.replace('/parent-consent' as any);
      return;
    }

    const inPreAuth = inAuthGroup || seg === 'age' || seg === 'ask-parent' || seg === 'parent-consent';
    if (!isOnboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (isOnboardingComplete && (inPreAuth || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, isOnboardingComplete, segments, ageGate, ageGateLoaded, consent]);

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