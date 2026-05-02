import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

// ─── SHIMMER ─────────────────────────────────────────────────────────────────

function useShimmer() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.85, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim;
}

// ─── SKELETON BOX ────────────────────────────────────────────────────────────

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: object;
}

export function SkeletonBox({ width = '100%', height = 16, radius = 6, style }: SkeletonBoxProps) {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius: radius, backgroundColor: '#1E1E2A' },
        { opacity },
        style,
      ]}
    />
  );
}

// ─── SKELETON CARD ───────────────────────────────────────────────────────────

interface SkeletonCardProps {
  style?: object;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[skStyles.card, style]}>
      <View style={skStyles.iconSlot} />
      <View style={skStyles.lines}>
        <SkeletonBox width="65%" height={14} radius={5} />
        <SkeletonBox width="42%" height={11} radius={4} style={{ marginTop: 8 }} />
      </View>
      <SkeletonBox width={38} height={24} radius={12} />
    </View>
  );
}

// ─── ERROR STATE ─────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Could not load content.', onRetry }: ErrorStateProps) {
  return (
    <View style={skStyles.errorWrap}>
      <Ionicons name="alert-circle-outline" size={32} color="rgba(255,255,255,0.2)" />
      <Text style={skStyles.errorText}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={skStyles.retryBtn} hitSlop={12}>
          <Ionicons name="refresh" size={14} color="#22CC5E" />
          <Text style={skStyles.retryText}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const skStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D16',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  iconSlot: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E1E2A',
  },
  lines: {
    flex: 1,
    gap: 0,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
  },
  errorText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22CC5E',
  },
  retryText: {
    color: '#22CC5E',
    fontSize: 13,
    fontWeight: '600',
  },
});
