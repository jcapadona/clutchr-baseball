// components/ui/ClutchrUI.tsx
/**
 * CLUTCHR BASEBALL — UI KIT (v5 — broadcast HUD language, all three tabs)
 * Drop at: components/ui/ClutchrUI.tsx
 *
 * v5 (Career + Game Mode pass):
 *   + HudTabs      — shared tab strip (Career chapters, Game Mode PRE / LIVE / POST)
 *   ~ ChamferPanel — `activeColor` so a phase-colored screen can own its one strong outline
 *   ~ CornerPlay   — `color`
 *   ~ ScreenHeader — `logo` (your wordmark image) and `right` slot are both honored
 *
 * v4 adds the FIFA-14 / broadcast-HUD primitives every screen shares:
 *   + ChamferPanel — cut-corner panel: optional tinted photo, category hairline border,
 *                    corner ticks, pressed state. THE building block. No rounded cards on
 *                    redesigned screens; rounded Card/PhotoCard stay for untouched screens.
 *   + SkewPill     — parallelogram stat pill (header XP / streak)
 *   + HudRule      — letter-spaced section title flanked by tick rules ("COMMAND CENTER")
 *   + CornerPlay   — the green triangle play-corner for the one primary action
 *   ~ ScreenHeader — pills are SkewPills
 *   ~ CoachTake    — sits in a ChamferPanel
 *
 * v3 changes (everything else is byte-for-byte v2):
 *   + StrokeIcon   — 2px round-cap SVG icon set (no emoji, no icon-font dependency)
 *   + Skeleton     — opacity pulse 0.4 → 0.75, no shimmer
 *   + CoachTake    — compact "CC'S TAKE" line (Home + Rep Complete share it)
 *   ~ ScreenHeader — XP pill is gold, streak pill uses a stroke flame (emoji removed)
 *   ~ Card / PhotoCard — black drop shadow removed (depth = top hairline + surface step)
 *   ~ PhotoCard    — new optional props: fullBleed, accentWash, minHeight, footer
 *   ~ PrimaryButton — new optional props: arrow, height; stronger pressed state
 *   ! Fixed: ButtonTokensHeight was read before it was declared (now ButtonTokens.minHeight)
 *
 * Requires: constants/theme.ts (already exists), constants/visualExtensions.ts (new),
 *           expo-linear-gradient, react-native-svg (already installed)
 *
 * Import in any screen:
 *   import { ScreenHeader, Card, PhotoCard, SectionLabel, StatTile,
 *            ListRow, ProgressBar, PulseRing, Chip, PrimaryButton, WorldTile }
 *     from '@/components/ui/ClutchrUI';
 *   (adjust the relative path if your project doesn't use the @ alias)
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, Image, StyleSheet, ViewStyle, StyleProp,
  ImageSourcePropType, ScrollView, Animated, Easing, LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius, Shadow, ButtonTokens } from '../../constants/theme';
import {
  DisplayFont, DisplayHero, DisplayCard, DisplayCardSm, DisplayStat,
  CategoryColor, TypeColor, Gradient, tint, TopHighlight,
} from '../../constants/visualExtensions';

/* ══════════════════════════════════════════════════════════════
   STROKE ICON — 2px, round caps, 24-unit grid. One path string per
   icon so nothing depends on an icon font loading.
   ══════════════════════════════════════════════════════════════ */

const ICON_PATHS = {
  flame: 'M12 3c.6 3.2 4.5 5.4 4.5 10a4.5 4.5 0 0 1-9 0c0-1.7.7-3 1.7-4.1.3 1.5 1 2.4 1.9 2.8C10.6 9 10.9 5.6 12 3Z',
  bolt: 'M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  chevronRight: 'M9 6l6 6-6 6',
  career: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  locker: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 20.5A2.5 2.5 0 0 0 6.5 21H20M9 8h6',
  playbook: 'M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1Z',
  calendar: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12ZM4 10h16M8 3v4M16 3v4',
  calendarPlus: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12ZM4 10h16M8 3v4M16 3v4M12 12.5v5M9.5 15h5',
  clipboardCheck: 'M9 4h6v3H9V4ZM9 5.5H6.5A1.5 1.5 0 0 0 5 7v12.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5H15M9 14l2 2 4-4.5',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v4.5h-4.5',
  cap: 'M4 14a8 8 0 0 1 16 0H4ZM12 6V4.5M4 14h17.5l1 2.5H12',
  crosshair: 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM12 2v5M12 17v5M2 12h5M17 12h5',
  play: 'M8 5.5v13l10.5-6.5L8 5.5Z',
  pin: 'M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15.4 12 21 12 21ZM12 8.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  chevronsRight: 'M6 6l6 6-6 6M13 6l6 6-6 6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6.5 11h11A1.5 1.5 0 0 1 19 12.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-7A1.5 1.5 0 0 1 6.5 11Z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4',
  close: 'M6 6l12 12M18 6 6 18',
  target: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  phone: 'M8.5 3h7A1.5 1.5 0 0 1 17 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19.5v-15A1.5 1.5 0 0 1 8.5 3ZM11 18h2',
  print: 'M7 9V4h10v5M7 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A1.5 1.5 0 0 1 5.5 9h13a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H17M7 14h10v6H7v-6Z',
} as const;

export type StrokeIconName = keyof typeof ICON_PATHS;

export function StrokeIcon({ name, size = 20, color = Colors.textPrimary, strokeWidth = 2 }:
  { name: StrokeIconName; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={ICON_PATHS[name]}
        stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   SKELETON — opacity pulse 0.4 → 0.75. No shimmer. Size it to the
   footprint of whatever it stands in for.
   ══════════════════════════════════════════════════════════════ */

export function Skeleton({ width = '100%', height = 14, radius = Radius.sm, style }: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const o = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 0.75, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(o, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [o]);
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: Colors.surfaceHigh, opacity: o }, style]}
    />
  );
}

/* ══════════════════════════════════════════════════════════════
   CHAMFER PANEL — the cut-corner broadcast panel.

   How the cut works (no masking libraries, nothing that can fail to
   load): the panel is an ordinary clipped View; two triangles in the
   SCREEN background color sit on the top-left and bottom-right
   corners; an SVG polygon draws the hairline outline on top. So the
   screen behind a ChamferPanel must be a flat Colors.background.

   Color rule: `accent` is the panel's CATEGORY and tints the photo,
   the hairline, and the corner ticks. `active` is reserved for the
   one primary action on the screen and is the only place the border
   turns full-strength green.
   ══════════════════════════════════════════════════════════════ */

export function ChamferPanel({
  children, accent = Colors.textTertiary, active = false, activeColor = Colors.primary, cut = 12,
  image, wash = 0.34, scrim = 'left', fill = Colors.surface,
  onPress, accessibilityLabel, style, contentStyle,
}: {
  children?: React.ReactNode;
  /** Category color. Pass a CategoryColor / Colors value. */
  accent?: string;
  /** The screen's single primary action. Full-strength outline. */
  active?: boolean;
  /** Outline color when `active`. Green everywhere except Game Mode, where the phase color owns it. */
  activeColor?: string;
  /** Corner cut size in px. */
  cut?: number;
  /** Optional photo. MUST be a literal require() at the call site. Panel is complete without it. */
  image?: ImageSourcePropType;
  /** Strength of the accent wash over the photo (0–1). Photos are shipped desaturated so this sets the hue. */
  wash?: number;
  /** Which side the text sits on — that side gets darkened. */
  scrim?: 'left' | 'bottom' | 'none';
  fill?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) > 0.5 || Math.abs(height - size.h) > 0.5) setSize({ w: width, h: height });
  };

  const tone = active ? activeColor : accent;

  const body = (pressed: boolean) => {
    const { w, h } = size;
    const i = active ? 0.75 : 0.5;                       // half the stroke, keeps the line crisp
    const outline = `${cut},${i} ${w - i},${i} ${w - i},${h - cut} ${w - cut},${h - i} ${i},${h - i} ${i},${cut}`;
    const t = 10;                                        // corner tick length
    return (
      <>
        {!!image && <Image source={image} style={s.chamferPhoto} resizeMode="cover" />}
        {/* accent wash: over a photo it sets the hue; with no photo it is the corner glow */}
        {image
          ? <View style={[StyleSheet.absoluteFill, { backgroundColor: tint(tone, wash) }]} pointerEvents="none" />
          : (
            <LinearGradient
              colors={[tint(tone, 0.22), tint(tone, 0)] as any}
              start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 0.8 }}
              style={StyleSheet.absoluteFill as any} pointerEvents="none"
            />
          )}
        {!!image && scrim !== 'none' && (
          <LinearGradient
            colors={['rgba(10,10,10,0.94)', 'rgba(10,10,10,0.62)', 'rgba(10,10,10,0.10)'] as any}
            locations={[0, 0.5, 1] as any}
            start={scrim === 'left' ? { x: 0, y: 0 } : { x: 0, y: 1 }}
            end={scrim === 'left' ? { x: 1, y: 0 } : { x: 0, y: 0 }}
            style={StyleSheet.absoluteFill as any} pointerEvents="none"
          />
        )}
        {pressed && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(245,245,245,0.07)' }]} pointerEvents="none" />}

        <View style={[{ padding: 14 }, contentStyle]}>{children}</View>

        {/* corner cuts: screen-colored triangles */}
        <View pointerEvents="none" style={[s.cutTL, { borderTopWidth: cut, borderRightWidth: cut }]} />
        <View pointerEvents="none" style={[s.cutBR, { borderBottomWidth: cut, borderLeftWidth: cut }]} />

        {w > 0 && (
          <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Polygon
              points={outline} fill="none"
              stroke={tone} strokeWidth={active ? 1.5 : 1}
              strokeOpacity={active ? 0.95 : pressed ? 0.85 : 0.42}
            />
            {/* HUD ticks on the two square corners */}
            <Path
              d={`M${w - t - 3},3.5 H${w - 3.5} V${t + 3} M3.5,${h - t - 3} V${h - 3.5} H${t + 3}`}
              fill="none" stroke={tone} strokeWidth={1.5} strokeOpacity={0.9} strokeLinecap="square"
            />
          </Svg>
        )}
      </>
    );
  };

  if (!onPress) {
    return <View onLayout={onLayout} style={[s.chamfer, { backgroundColor: fill }, style]}>{body(false)}</View>;
  }
  return (
    <Pressable
      onPress={onPress} onLayout={onLayout}
      accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [s.chamfer, { backgroundColor: fill }, pressed && { transform: [{ scale: 0.988 }] }, style]}
    >
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

/** The green triangle play-corner. Drop it as the last child of the `active` ChamferPanel. */
export function CornerPlay({ size = 64, color = Colors.primary }: { size?: number; color?: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', right: 0, bottom: 0, width: size, height: size }}>
      <View style={{
        position: 'absolute', right: 0, bottom: 0, width: 0, height: 0,
        borderBottomWidth: size, borderBottomColor: color,
        borderLeftWidth: size, borderLeftColor: 'transparent',
      }} />
      <View style={{ position: 'absolute', right: size * 0.12, bottom: size * 0.1 }}>
        <Svg width={size * 0.32} height={size * 0.32} viewBox="0 0 24 24">
          <Path d={ICON_PATHS.play} fill={Colors.background} stroke={Colors.background} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      </View>
    </View>
  );
}

/** Parallelogram stat pill. Children are counter-skewed so text stays upright. */
export function SkewPill({ children, tone = 'neutral' }:
  { children: React.ReactNode; tone?: 'neutral' | 'gold' }) {
  return (
    <View style={[s.skew, tone === 'gold' && { borderColor: Colors.warningBorder, backgroundColor: Colors.warningMuted }]}>
      <View style={s.skewInner}>{children}</View>
    </View>
  );
}

/** Letter-spaced title flanked by tick rules — "— COMMAND CENTER —". */
export function HudRule({ children, tone = Colors.primary }: { children: string; tone?: string }) {
  return (
    <View style={s.hudRow} accessibilityRole="header">
      <View style={s.hudTick} /><View style={s.hudLine} />
      <Text style={[s.hudText, { color: tone }]}>{children}</Text>
      <View style={s.hudLine} /><View style={s.hudTick} />
    </View>
  );
}

/**
 * Shared tab strip. Every tab is always visible (no horizontal scroll): widths come
 * from the labels, the row is space-between. The active tab is text + underline in
 * its own color, nothing else.
 */
export function HudTabs<K extends string>({ tabs, active, onChange, size = 'md' }: {
  tabs: ReadonlyArray<{ key: K; label: string; color?: string }>;
  active: K;
  onChange: (key: K) => void;
  size?: 'md' | 'lg';
}) {
  return (
    <View style={s.tabsRow} accessibilityRole="tablist">
      {tabs.map(t => {
        const on = t.key === active;
        const c = t.color ?? Colors.primary;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            accessibilityRole="tab" accessibilityState={{ selected: on }}
            hitSlop={{ top: 6, bottom: 6 }}
            style={({ pressed }) => [
              s.tab, size === 'lg' && { flex: 1, alignItems: 'center' },
              on && { borderBottomColor: c },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={[s.tabText, size === 'lg' && { fontSize: 18, letterSpacing: 2 }, { color: on ? c : Colors.textTertiary }]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCREEN HEADER — replaces the ~300px header block on every screen.
   Kills the breadcrumb + subtitle. Two-tone display title.
   ══════════════════════════════════════════════════════════════ */

export function ScreenHeader({
  titleLead, titleRest, xp, streak, right, logo,
}: {
  /** Your wordmark image. Literal require() / Assets entry. Falls back to the text wordmark. */
  logo?: ImageSourcePropType;
  titleLead?: string;      // shown in WHITE  e.g. "BUILD"
  titleRest?: string;      // shown in GREEN  e.g. "YOUR PATH"
  xp?: number;
  streak?: number;
  right?: React.ReactNode;
}) {
  return (
    <View style={s.header}>
      <View style={s.headerBar}>
        {logo
          ? <Image source={logo} style={s.logo} resizeMode="contain" accessibilityLabel="Clutchr" />
          : (
            <Text style={s.wordmark}>
              CLUTCH<Text style={{ color: Colors.primary }}>R</Text>
            </Text>
          )}
        <View style={s.headerRight}>
          {typeof xp === 'number' && (
            <SkewPill tone="gold">
              <Text style={s.xpLabel}>XP</Text>
              <Text style={s.xpNum}>{xp.toLocaleString()}</Text>
            </SkewPill>
          )}
          {typeof streak === 'number' && (
            <SkewPill>
              <StrokeIcon name="flame" size={14} color={Colors.warning} />
              <Text style={s.streakNum}>{streak}</Text>
            </SkewPill>
          )}
          {right}
        </View>
      </View>

      {!!titleLead && (
        <Text style={[DisplayHero, { paddingHorizontal: Spacing.lg, marginTop: Spacing.md }]}>
          {titleLead}
          {!!titleRest && <Text style={{ color: Colors.primary }}> {titleRest}</Text>}
        </Text>
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════
   CARD — default surface. Uses Colors.border (neutral), NOT
   Colors.primaryBorder, unless active=true. This is the fix
   for accent inflation — your theme.ts already has both tokens,
   this component just reaches for the right one by default.
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
        active && Shadow.greenFocus,
        padded && { padding: Spacing.lg },
        pressed && { opacity: 0.85, transform: [{ scale: 0.995 }] },
        style,
      ]}
    >
      <LinearGradient
        colors={active ? Gradient.cardActive : Gradient.card}
        style={StyleSheet.absoluteFill as any}
        pointerEvents="none"
      />
      <View style={s.topHighlight} pointerEvents="none" />
      {children}
    </Wrap>
  );
}

/* ══════════════════════════════════════════════════════════════
   PHOTO CARD — 5-layer image treatment. Fixes illegible text
   over photos. Text renders left ~62%; subject lives right.
   ══════════════════════════════════════════════════════════════ */

export function PhotoCard({
  image, accent = Colors.primary, height = 180, minHeight, children, footer,
  onPress, active = false, fullBleed = false, accentWash = true, style,
}: {
  image: ImageSourcePropType;   // MUST be a literal require() — Metro needs static paths
  accent?: string;
  height?: number;
  /** If set, the card grows with its content instead of clipping at `height`. */
  minHeight?: number;
  children: React.ReactNode;
  /** Rendered full-width under the 62% text column (e.g. the hero's primary button). */
  footer?: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  /** Photo covers the whole card instead of the right 78%. */
  fullBleed?: boolean;
  /** Set false to skip the accent tint so the scrim stays same-hue. */
  accentWash?: boolean;
  style?: ViewStyle;
}) {
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={({ pressed }: any) => [
        s.card, minHeight ? { minHeight } : { height }, { overflow: 'hidden' },
        active && s.cardActive,
        active && Shadow.greenFocus,
        pressed && { opacity: 0.9 },
        style,
      ]}
    >
      <Image source={image} style={fullBleed ? s.photoFull : s.photo} resizeMode="cover" />
      <LinearGradient
        colors={Gradient.photoScrimX as any}
        locations={Gradient.photoScrimXLocations as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill as any}
        pointerEvents="none"
      />
      <LinearGradient
        colors={Gradient.photoScrimY as any}
        locations={Gradient.photoScrimYLocations as any}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill as any}
        pointerEvents="none"
      />
      {accentWash && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: tint(accent, 0.16) }]}
          pointerEvents="none"
        />
      )}
      <View style={s.topHighlight} pointerEvents="none" />
      <View style={[s.photoContent, !!footer && { paddingBottom: Spacing.md }]}>{children}</View>
      {!!footer && <View style={s.photoFooter}>{footer}</View>}
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
  const a = locked ? CategoryColor.locked : accent;
  const h = size === 'lg' ? 220 : 150;

  const body = (
    <>
      <View style={{ flex: 1 }} />
      <Text
        style={[
          size === 'lg' ? DisplayCard : DisplayCardSm,
          { color: locked ? Colors.textTertiary : Colors.textPrimary },
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
      {!!subtitle && !locked && (
        <Text style={[Typography.bodySmall, { marginTop: 2 }]} numberOfLines={1}>{subtitle}</Text>
      )}
      <View style={{ marginTop: Spacing.sm }}>
        <ProgressBar percent={locked ? 0 : percent} color={a} />
        <Text style={[Typography.labelSmall, { marginTop: 5, color: a }]}>
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
   PULSE RING — signature motif. Reuse everywhere: world progress,
   readiness, rank, celebration burst.
   ══════════════════════════════════════════════════════════════ */

export function PulseRing({
  percent, size = 72, stroke = 6, ringColor = Colors.primary, children,
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
        <Circle
          cx={size / 2} cy={size / 2} r={r + stroke * 0.9}
          stroke={ringColor} strokeOpacity={0.13} strokeWidth={1} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={Colors.surfaceHigh} strokeWidth={stroke} fill="none"
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
      <Text style={Typography.sectionLabel}>{children}</Text>
      <View style={s.sectionRule} />
      {right}
    </View>
  );
}

export function ProgressBar({ percent, color = Colors.primary, height = 4 }:
  { percent: number; color?: string; height?: number }) {
  return (
    <View style={[s.track, { height, borderRadius: height }]}>
      <View style={{
        width: `${Math.max(0, Math.min(100, percent))}%`,
        height: '100%', backgroundColor: color, borderRadius: height,
      }} />
    </View>
  );
}

export function Chip({ label, tone = Colors.primary, filled = false }:
  { label: string; tone?: string; filled?: boolean }) {
  return (
    <View style={[
      s.chip,
      filled
        ? { backgroundColor: tint(tone, 0.18), borderColor: 'transparent' }
        : { borderColor: Colors.border },
    ]}>
      <Text style={[Typography.labelSmall, { color: filled ? tone : Colors.textSecondary, letterSpacing: 1 }]}>
        {label}
      </Text>
    </View>
  );
}

export function StatTile({ value, label, accent = Colors.primary }:
  { value: string | number; label: string; accent?: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.lg }}>
      <Text style={[DisplayStat, { fontSize: 24, color: accent }]}>{value}</Text>
      <Text style={[Typography.labelSmall, { marginTop: 2 }]}>{label}</Text>
    </Card>
  );
}

/** Locker row — ~96px, type-coded icon color instead of repeated identical icons. */
export function ListRow({
  title, meta, typeKey = 'article', duration, onPress,
}: {
  title: string;
  meta?: string;
  typeKey?: keyof typeof TypeColor;
  duration?: string;
  onPress?: () => void;
}) {
  const c = TypeColor[typeKey];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
      <View style={[s.rowIcon, { backgroundColor: tint(c, 0.16), borderColor: tint(c, 0.3) }]}>
        <View style={[s.rowDot, { backgroundColor: c }]} />
      </View>
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Text style={Typography.h3} numberOfLines={1}>{title}</Text>
        {!!meta && <Text style={Typography.bodySmall} numberOfLines={1}>{meta}</Text>}
        <View style={s.rowMeta}>
          <Text style={[Typography.labelSmall, { color: c }]}>{String(typeKey).toUpperCase()}</Text>
          {!!duration && <Text style={[Typography.labelSmall, { marginLeft: Spacing.sm }]}>· {duration}</Text>}
        </View>
      </View>
      <Text style={{ color: Colors.textTertiary, fontSize: 20 }}>›</Text>
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, tone = 'green', arrow = false, height }:
  { label: string; onPress?: () => void; tone?: 'green' | 'gold'; arrow?: boolean; height?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [pressed && { opacity: 0.82, transform: [{ scale: 0.985 }] }]}
    >
      <LinearGradient
        colors={(tone === 'gold' ? Gradient.ctaGold : Gradient.ctaGreen) as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.cta, !!height && { height }]}
      >
        <Text style={[Typography.button, { color: Colors.background, fontFamily: DisplayFont.bold, fontSize: 17, letterSpacing: 0.6, textTransform: 'uppercase' }]}>
          {label}
        </Text>
        {arrow && <StrokeIcon name="arrowRight" size={18} color={Colors.background} strokeWidth={2.5} />}
      </LinearGradient>
    </Pressable>
  );
}

/* ══════════════════════════════════════════════════════════════
   COACH TAKE — one compact Coach Cap line. Same component on Home
   and on Rep Complete so the voice (and the look) never drifts.
   Neutral border on purpose: green belongs to the screen's one
   primary action, not to the coach.
   ══════════════════════════════════════════════════════════════ */

export function CoachTake({ text, avatar, loading = false, style }: {
  text?: string;
  /** Coach Cap shield. MUST be a literal require() at the call site. Falls back to a stroke cap icon. */
  avatar?: ImageSourcePropType;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  if (!loading && !text) return null;
  return (
    <ChamferPanel style={style} contentStyle={s.take}>
      <View style={s.takeAvatar}>
        {avatar
          ? <Image source={avatar} style={{ width: 30, height: 30 }} resizeMode="contain" />
          : <StrokeIcon name="cap" size={22} color={Colors.primary} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.takeLabel}>CC'S TAKE</Text>
        {loading
          ? (
            <View style={{ gap: 6, marginTop: 6 }}>
              <Skeleton height={12} width="92%" />
              <Skeleton height={12} width="64%" />
            </View>
          )
          : <Text style={s.takeText} numberOfLines={3}>{text}</Text>}
      </View>
    </ChamferPanel>
  );
}

/** Horizontal "Start here" carousel — Spotify move for Locker/Home. */
export function Rail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md }}
    >
      {children}
    </ScrollView>
  );
}

/* ══════════════════════════════════════════════════════════════ */

const s = StyleSheet.create({
  header: { backgroundColor: Colors.background, paddingBottom: Spacing.lg },
  headerBar: {
    height: 56,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  wordmark: {
    fontFamily: DisplayFont.italic,
    fontSize: 26, letterSpacing: 1, color: Colors.textPrimary,
  },
  logo: { width: 128, height: 30 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: 4 },

  tabsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderStrong,
  },
  tab: { paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabText: { fontFamily: DisplayFont.italic, fontSize: 15, lineHeight: 18, letterSpacing: 0.8 },
  xpNum: { fontFamily: DisplayFont.bold, fontSize: 17, lineHeight: 20, color: Colors.textPrimary },
  xpLabel: { fontFamily: DisplayFont.bold, fontSize: 12, lineHeight: 20, letterSpacing: 1, color: Colors.warning },
  streakNum: { fontFamily: DisplayFont.bold, fontSize: 17, lineHeight: 20, color: Colors.textPrimary },

  chamfer: { overflow: 'hidden' },
  chamferPhoto: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cutTL: {
    position: 'absolute', top: 0, left: 0, width: 0, height: 0,
    borderTopColor: Colors.background, borderRightColor: 'transparent',
  },
  cutBR: {
    position: 'absolute', bottom: 0, right: 0, width: 0, height: 0,
    borderBottomColor: Colors.background, borderLeftColor: 'transparent',
  },

  skew: {
    height: 32, paddingHorizontal: 14, justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.borderStrong,
    transform: [{ skewX: '-18deg' }],
  },
  skewInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    transform: [{ skewX: '18deg' }],
  },

  hudRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  hudLine: { flex: 1, height: 1, backgroundColor: Colors.borderStrong },
  hudTick: { width: 14, height: 3, backgroundColor: Colors.borderStrong },
  hudText: {
    fontFamily: DisplayFont.italic, fontSize: 15, lineHeight: 18, letterSpacing: 5,
    paddingHorizontal: Spacing.sm,
  },

  card: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,      // ← neutral by default. This is the fix.
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: Colors.primaryBorder,
    borderWidth: 1.5,
  },
  topHighlight: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: TopHighlight,
  },

  photo: {
    position: 'absolute', top: 0, bottom: 0, right: 0,
    width: '78%', height: '100%',
  },
  photoFull: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  photoContent: { flex: 1, padding: Spacing.lg, width: '62%' },
  photoFooter: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl, marginBottom: Spacing.md,
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: Colors.borderSubtle },

  track: { width: '100%', backgroundColor: Colors.surfaceHigh, overflow: 'hidden' },

  chip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.sm, borderWidth: 1,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  rowIcon: {
    width: 44, height: 44, borderRadius: Radius.sm, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  rowDot: { width: 14, height: 14, borderRadius: 3 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },

  cta: {
    height: ButtonTokens.minHeight, borderRadius: Radius.pill,
    flexDirection: 'row', gap: Spacing.sm,
    alignItems: 'center', justifyContent: 'center',
  },

  take: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', padding: Spacing.lg },
  takeAvatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: Colors.primaryBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  takeLabel: {
    fontFamily: DisplayFont.italic, fontSize: 18, lineHeight: 20,
    letterSpacing: 0.6, color: Colors.primary,
  },
  takeText: { ...Typography.body, fontSize: 14, lineHeight: 20, marginTop: 4 },
});
