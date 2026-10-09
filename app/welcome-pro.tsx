/**
 * app/welcome-pro.tsx
 * Shown after a successful Pro purchase. Reachable from Dev QA for testing,
 * since the dev client cannot complete purchases.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H } from '@/utils/haptics';
import { Spacing } from '@/constants/theme';
import { DisplayFont } from '@/constants/visualExtensions';
import { PrimaryButton } from '@/components/ui/ClutchrUI';

const BG = '#050806';
const CARD = '#111612';
const WHITE = '#F7FFF9';
const GRAY = '#A8B3AA';
const GOLD = '#F5C542';

const UNLOCKS: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; desc: string }[] = [
  { icon: 'diamond',  title: 'Full Career Path', desc: 'Every world, role-specific, always adapting' },
  { icon: 'baseball', title: 'Full Game Mode',   desc: 'Every pregame routine and in-game reset' },
  { icon: 'book',     title: 'Full Playbook',    desc: 'All 5 personal cue slots' },
  { icon: 'albums',   title: 'Full Locker',      desc: 'The entire resource library' },
];

export default function WelcomeProScreen() {
  const insets = useSafeAreaInsets();
  const pop = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const items = useRef(UNLOCKS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    H.success();
    Animated.spring(pop, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    Animated.stagger(
      150,
      items.map((v) => Animated.timing(v, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true })),
    ).start();
    return () => loop.stop();
  }, []);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(245,197,66,0.14)', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: 360 }]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.burstWrap, { transform: [{ scale: pop }], opacity: pop }]}>
          <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          <View style={styles.burst}>
            <Ionicons name="flash" size={48} color={BG} />
          </View>
        </Animated.View>

        <Text style={styles.title}>
          YOU'RE <Text style={{ color: GOLD }}>PRO.</Text>
        </Text>
        <Text style={styles.sub}>Your full career path just unlocked. Here's what's yours now.</Text>

        <View style={styles.list}>
          {UNLOCKS.map((u, i) => (
            <Animated.View
              key={u.title}
              style={[
                styles.item,
                {
                  opacity: items[i],
                  transform: [{ translateX: items[i].interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
                },
              ]}
            >
              <View style={styles.itemIcon}>
                <Ionicons name={u.icon} size={16} color={GOLD} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{u.title}</Text>
                <Text style={styles.itemDesc}>{u.desc}</Text>
              </View>
              <Ionicons name="checkmark" size={18} color={GOLD} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <PrimaryButton label="Start Your Next Rep" arrow onPress={() => router.replace('/(tabs)')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 20, paddingTop: Spacing.xxl, alignItems: 'center' },

  burstWrap: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  burst: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    borderWidth: 2, borderColor: GOLD,
  },

  title: {
    fontFamily: DisplayFont.italic, fontSize: 44, lineHeight: 52, paddingTop: 4,
    color: WHITE, textAlign: 'center', letterSpacing: 0.5,
  },
  sub: {
    fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20,
    color: GRAY, textAlign: 'center', maxWidth: 280, marginTop: Spacing.sm,
  },

  list: { width: '100%', gap: Spacing.md, marginTop: Spacing.xxl },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,197,66,0.25)',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 56,
  },
  itemIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(245,197,66,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  itemText: { flex: 1, gap: 2 },
  itemTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20, color: WHITE },
  itemDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: GRAY },

  footer: { paddingHorizontal: 20, paddingTop: Spacing.lg },
});
