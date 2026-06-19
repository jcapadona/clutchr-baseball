import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'warning' | 'info';

type ToastState = { message: string; variant: ToastVariant } | null;

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

// ─── VARIANT MAP ─────────────────────────────────────────────────────────────

const VARIANTS = {
  success: {
    icon: 'checkmark-circle' as const,
    color: Colors.primary,
    bg: Colors.primaryMuted,
    border: Colors.primaryBorder,
  },
  warning: {
    icon: 'warning' as const,
    color: Colors.warning,
    bg: Colors.warningMuted,
    border: Colors.warningBorder,
  },
  info: {
    icon: 'information-circle' as const,
    color: Colors.info,
    bg: Colors.infoMuted,
    border: Colors.infoBorder,
  },
} as const;

// Tab bar is explicitly 88px iOS / 64px Android (set in tabs _layout).
const TAB_BAR_H = Platform.OS === 'ios' ? 88 : 64;
const TOAST_BOTTOM = TAB_BAR_H + 12;

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const slideAnim = useRef(new Animated.Value(120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);

    setToast({ message, variant });
    slideAnim.setValue(120);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 18,
        stiffness: 220,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();

    dismissTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 120,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setToast(null));
    }, 2500);
  }, [slideAnim, opacityAnim]);

  const cfg = toast ? VARIANTS[toast.variant] : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && cfg && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              bottom: TOAST_BOTTOM,
              backgroundColor: cfg.bg,
              borderColor: cfg.border,
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
          <Text style={[styles.message, { color: cfg.color }]} numberOfLines={2}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
  },
});
