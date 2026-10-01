/**
 * CLUTCHR BASEBALL — UI KIT
 * Drop at: src/components/ui/ClutchrUI.tsx
 *
 * Requires: theme.ts, expo-linear-gradient, react-native-svg (for PulseRing)
 *   npx expo install expo-linear-gradient react-native-svg
 *
 * Import in any screen:
 *   import { ScreenHeader, Card, PhotoCard, SectionLabel, StatTile,
 *            ListRow, ProgressBar, PulseRing, Chip, PrimaryButton, WorldTile }
 *     from '@/components/ui/ClutchrUI';
 */

import React from 'react';
import {
  View, Text, Pressable, Image, StyleSheet, ViewStyle, TextStyle,
  ImageSourcePropType, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { color, type as T, space, radius, elevation, gradient, tint } from '../../theme/theme';

/* ══════════════════════════════════════════════════════════════
   SCREEN HEADER — replaces the 300px header block on every screen.
   Kills the breadcrumb + subtitle. Two-tone display title.
   ══════════════════════════════════════════════════════════════ */

export function ScreenHeader({
  titleLead, titleRest, xp, streak, right,
}: {
  titleLead: string;      // shown in WHITE  e.g. "BUILD"
  titleRest?: string;     // shown in GREEN  e.g. "YOUR PATH"
  xp?: number;
  streak?: number;
  right?: React.ReactNode;
}) {
  return (
    <View style={s.header}>
      <View style={s.headerBar}>
        <Text style={s.wordmark}>
          CLUTCH<Text style={{ color: color.greenBright }}>R</Text>
        </Text>
        <View style={s.headerRight}>
          {typeof xp === 'number' && (
            <View style={s.xpPill}>
              <Text style={s.xpNum}>{xp.toLocaleString()}</Text>
              <Text style={s.xpLabel}>XP</Text>
            </View>
          )}
          {typeof streak === 'number' && streak > 0 && (
            <View style={s.streakPill}>
              <Text style={s.streakNum}>🔥 {streak}</Text>
            </View>
          )}
          {right}
        </View>
      </View>

      {!!titleLead && (
        <Text style={[T.hero, { paddingHorizontal: space.screenX, marginTop: space.md }]}>
          {titleLead}
          {!!titleRest && <Text style={{ color: color.greenBright }}> {titleRest}</Text>}
        </Text>
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════
   CARD — the default surface. NOTE: no green border unless active.
   This single change is what fixes "loud".
   ══════════════════════════════════════════════════════════════ */

export function Card({
  children, active = false, style, onPress, padded = true,
}: {
  children: React.ReactNode;
  active?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
  padded?: boolean;
}) {
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={({ pressed }: any) => [
        s.card,
        active && s.cardActive,
        active ? elevation.glow : elevation.flat,
        padded && { padding: space.base },
        pressed && { opacity: 0.85, transform: [{ scale: 0.995 }] },
        style,
      ]}
    >
      <LinearGradient
        colors={active ? gradient.cardActive : gradient.card}
        style={StyleSheet.absoluteFill as any}
        pointerEvents="none"
      />
      {/* hairline top highlight — the cheap "glass" trick */}
      <View style={s.topHighlight} pointerEvents="none" />
      {children}
    </Wrap>
  );
}

/* ══════════════════════════════════════════════════════════════
   PHOTO CARD — THE 5-LAYER IMAGE TREATMENT.
   Fixes every illegible-text-over-photo problem in the app.
   Text renders in the left 55%; the subject lives on the right.
   ══════════════════════════════════════════════════════════════ */

export function PhotoCard({
  image, accent = color.greenBright, height = 180, children, onPress, active = false, style,
}: {
  image: ImageSourcePropType;   // MUST be a literal require() — Metro needs static paths
  accent?: string;
  height?: number;
  children: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  style?: ViewStyle;
}) {
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={({ pressed }: any) => [
        s.card, { height, overflow: 'hidden' },
        active && s.cardActive,
        active ? elevation.glow : elevation.flat,
        pressed && { opacity: 0.9 },
        style,
      ]}
    >
      {/* 1 — photo, anchored right */}
      <Image
        source={image}
        style={s.photo}
        resizeMode="cover"
      />
      {/* 2 — horizontal scrim (text side goes dark) */}
      <LinearGradient
        colors={gradient.photoScrimX as any}
        locations={gradient.photoScrimXLocations as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill as any}
        pointerEvents="none"
      />
      {/* 3 — bottom scrim */}
      <LinearGradient
        colors={gradient.photoScrimY as any}
        locations={gradient.photoScrimYLocations as any}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill as any}
        pointerEvents="none"
      />
      {/* 4 — category color grade */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: tint(accent, 0.16) }]}
        pointerEvents="none"
      />
      {/* 5 — content, constrained to the readable zone */}
      <View style={s.photoContent}>{children}</View>
    </Wrap>
  );
}

/* ══════════════════════════════════════════════════════════════
   WORLD TILE — Career grid. Replaces the vertical node rail.
   ══════════════════════════════════════════════════════════════ */

export function WorldTile({
  title, subtitle, percent, accent, image, locked = false, size = 'sm', onPress,
}: {
  title: string;
  subtitle?: string;
  percent: number;
  accent: string;
  image?: ImageSourcePropType;
  locked?: boolean;
  size?: 'sm' | 'lg';
  onPress?: () => void;
}) {
  const a = locked ? color.cat.locked : accent;
  const h = size === 'lg' ? 220 : 150;

  const body = (
    <>
      <View style={{ flex: 1 }} />
      <Text
        style={[
          size === 'lg' ? T.display1 : T.display2,
          { color: locked ? color.textDim : color.text },
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
      {!!subtitle && !locked && (
        <Text style={[T.bodySm, { marginTop: 2 }]} numberOfLines={1}>{subtitle}</Text>
      )}
      <View style={{ marginTop: space.sm }}>
        <ProgressBar percent={locked ? 0 : percent} color={a} />
        <Text style={[T.label, { marginTop: 5, color: a }]}>
          {locked ? 'LOCKED' : `${percent}% COMPLETE`}
        </Text>
      </View>
    </>
  );

  if (image && !locked) {
    return (
      <PhotoCard image={image} accent={a} height={h} onPress={onPress}>
        {body}
      </PhotoCard>
    );
  }
  return (
    <Card onPress={onPress} style={{ height: h, justifyContent: 'flex-end' }}>
      {/* colored corner wash stands in for missing art — never leave a card black */}
      <LinearGradient
        colors={[tint(a, 0.22), 'transparent']}
        start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill as any}
        pointerEvents="none"
      />
      {body}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   PULSE RING — THE SIGNATURE MOTIF.
   Reuse everywhere: world progress, readiness, rank, celebration.
   ══════════════════════════════════════════════════════════════ */

export function PulseRing({
  percent, size = 72, stroke = 6, ringColor = color.greenBright, children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  ringColor?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* outer echo ring — the signature detail */}
        <Circle
          cx={size / 2} cy={size / 2} r={r + stroke * 0.9}
          stroke={ringColor} strokeOpacity={0.13} strokeWidth={1} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color.surface4} strokeWidth={stroke} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={ringColor} strokeWidth={stroke} fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c - (clamped / 100) * c}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════
   SMALL PARTS
   ══════════════════════════════════════════════════════════════ */

export function SectionLabel({ children, right }: { children: string; right?: React.ReactNode }) {
  return (
    <View style={s.sectionRow}>
      <Text style={T.label}>{children}</Text>
      <View style={s.sectionRule} />
      {right}
    </View>
  );
}

export function ProgressBar({ percent, color: c = color.greenBright, height = 4 }:
  { percent: number; color?: string; height?: number }) {
  return (
    <View style={[s.track, { height, borderRadius: height }]}>
      <View style={{
        width: `${Math.max(0, Math.min(100, percent))}%`,
        height: '100%', backgroundColor: c, borderRadius: height,
      }} />
    </View>
  );
}

export function Chip({ label, tone = color.greenBright, filled = false }:
  { label: string; tone?: string; filled?: boolean }) {
  return (
    <View style={[
      s.chip,
      filled
        ? { backgroundColor: tint(tone, 0.18), borderColor: 'transparent' }
        : { borderColor: color.border },
    ]}>
      <Text style={[T.label, { color: filled ? tone : color.textMuted, letterSpacing: 1 }]}>
        {label}
      </Text>
    </View>
  );
}

export function StatTile({ value, label, accent = color.greenBright }:
  { value: string | number; label: string; accent?: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: space.base }}>
      <Text style={[T.statSm, { color: accent }]}>{value}</Text>
      <Text style={[T.label, { marginTop: 2 }]}>{label}</Text>
    </Card>
  );
}

/** Locker row — 96px instead of 180px, with type-coded icon color. */
export function ListRow({
  title, meta, typeKey = 'article', duration, onPress,
}: {
  title: string;
  meta?: string;
  typeKey?: keyof typeof color.type;
  duration?: string;
  onPress?: () => void;
}) {
  const c = color.type[typeKey];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
      <View style={[s.rowIcon, { backgroundColor: tint(c, 0.16), borderColor: tint(c, 0.3) }]}>
        <View style={[s.rowDot, { backgroundColor: c }]} />
      </View>
      <View style={{ flex: 1, marginLeft: space.md }}>
        <Text style={T.title} numberOfLines={1}>{title}</Text>
        {!!meta && <Text style={T.bodySm} numberOfLines={1}>{meta}</Text>}
        <View style={s.rowMeta}>
          <Text style={[T.label, { color: c }]}>{String(typeKey).toUpperCase()}</Text>
          {!!duration && <Text style={[T.label, { marginLeft: space.sm }]}>· {duration}</Text>}
        </View>
      </View>
      <Text style={{ color: color.textDim, fontSize: 20 }}>›</Text>
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, tone = 'green' }:
  { label: string; onPress?: () => void; tone?: 'green' | 'gold' }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
      <LinearGradient
        colors={(tone === 'gold' ? gradient.ctaGold : gradient.ctaGreen) as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.cta}
      >
        <Text style={[T.button, { color: color.textOnBrand }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Horizontal "Start here" carousel — the Spotify move for Locker/Home. */
export function Rail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: space.screenX, gap: space.md }}
    >
      {children}
    </ScrollView>
  );
}

/* ══════════════════════════════════════════════════════════════ */

const s = StyleSheet.create({
  header: { backgroundColor: color.bg, paddingBottom: space.base },
  headerBar: {
    height: space.headerH,
    paddingHorizontal: space.screenX,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  wordmark: {
    fontFamily: 'BarlowCondensed_800ExtraBold_Italic',
    fontSize: 26, letterSpacing: 1, color: color.text,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  xpPill: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.pill, backgroundColor: color.surface3,
    borderWidth: 1, borderColor: color.border,
  },
  xpNum: { fontFamily: 'BarlowCondensed_800ExtraBold', fontSize: 16, color: color.text },
  xpLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1, color: color.textDim },
  streakPill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, backgroundColor: color.goldDim,
  },
  streakNum: { fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: color.gold },

  card: {
    borderRadius: radius.card,
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,      // ← NOT green. This is the fix.
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: color.greenBright,
    borderWidth: 1.5,
  },
  topHighlight: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: color.hairline,
  },

  photo: {
    position: 'absolute', top: 0, bottom: 0, right: 0,
    width: '78%', height: '100%',
  },
  photoContent: { flex: 1, padding: space.base, width: '62%' },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.screenX,
    marginTop: space.xl, marginBottom: space.md,
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: color.hairlineSoft },

  track: { width: '100%', backgroundColor: color.surface4, overflow: 'hidden' },

  chip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.chip, borderWidth: 1,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: space.md, paddingHorizontal: space.screenX,
    borderBottomWidth: 1, borderBottomColor: color.hairlineSoft,
  },
  rowIcon: {
    width: 44, height: 44, borderRadius: radius.chip, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  rowDot: { width: 14, height: 14, borderRadius: 3 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },

  cta: {
    height: 54, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
  },
});
