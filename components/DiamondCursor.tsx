import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Zone {
  id: string;
  label: string;
  x_range: [number, number];
  y_range: [number, number];
}

interface DiamondCursorData {
  prompt?: string;
  scenario?: string;
  mode?: string;
  cursor_label?: string;
  zones?: Zone[];
  correct_zone?: string;
  acceptable_zones?: string[];
  show_zones?: boolean;
}

interface DiamondCursorResponses {
  correct_zone?: string;
  acceptable_zones?: string[];
  wrong_zones?: string[];
}

interface DiamondCursorFeedback {
  correct?: string;
  acceptable?: string;
  wrong?: string;
}

interface Props {
  data: DiamondCursorData;
  responses: DiamondCursorResponses;
  feedback: DiamondCursorFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── FIELD GEOMETRY ──────────────────────────────────────────────────────────

const FIELD_SIZE = 280;
const CURSOR_HALF = 20;          // half-size of cursor hitbox view

// Pixel positions on the 280×280 canvas (home at bottom center)
const F = {
  home:  { x: 140, y: 246 },
  base1: { x: 238, y: 140 },
  base2: { x: 140, y: 34  },
  base3: { x: 42,  y: 140 },
  mound: { x: 140, y: 146 },
};
const FOUL_Y           = 95;
const OUTFIELD_RADIUS  = 206;
const INFIELD_RADIUS   = 72;
const BASE_HALF        = 9;
const MOUND_RADIUS     = 6;

// Rotated-square (diamond) polygon points centered at (cx, cy) with half-size h
function diamondPoly(cx: number, cy: number, h: number): string {
  return `${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}`;
}

// ─── FIELD SVG ────────────────────────────────────────────────────────────────

interface FieldSvgProps {
  zones: Zone[];
  showZonesEarly: boolean;
  submitted: boolean;
  hitZoneId: string | null;
  correctZoneId: string;
  acceptableZoneIds: string[];
}

function FieldSvg({
  zones,
  showZonesEarly,
  submitted,
  hitZoneId,
  correctZoneId,
  acceptableZoneIds,
}: FieldSvgProps) {
  const renderZones = showZonesEarly || submitted;

  const LINE  = 'rgba(255,255,255,0.16)';
  const DIRT  = 'rgba(180,130,80,0.14)';
  const BASE  = 'rgba(255,255,255,0.82)';

  function zoneColor(id: string): string {
    if (id === correctZoneId) return Colors.primary;
    if (acceptableZoneIds.includes(id)) return Colors.warning;
    return Colors.danger;
  }

  return (
    <Svg width={FIELD_SIZE} height={FIELD_SIZE}>
      {/* Outfield arc */}
      <Path
        d={`M 0 ${FOUL_Y} A ${OUTFIELD_RADIUS} ${OUTFIELD_RADIUS} 0 0 0 ${FIELD_SIZE} ${FOUL_Y}`}
        stroke={LINE}
        strokeWidth={1.5}
        fill="none"
      />

      {/* Foul lines */}
      <Line x1={F.home.x} y1={F.home.y} x2={FIELD_SIZE} y2={FOUL_Y} stroke={LINE} strokeWidth={1} />
      <Line x1={F.home.x} y1={F.home.y} x2={0}          y2={FOUL_Y} stroke={LINE} strokeWidth={1} />

      {/* Infield dirt */}
      <Circle cx={F.mound.x} cy={F.mound.y} r={INFIELD_RADIUS} fill={DIRT} />

      {/* Base paths */}
      <Line x1={F.home.x}  y1={F.home.y}  x2={F.base1.x} y2={F.base1.y} stroke={LINE} strokeWidth={1} />
      <Line x1={F.base1.x} y1={F.base1.y} x2={F.base2.x} y2={F.base2.y} stroke={LINE} strokeWidth={1} />
      <Line x1={F.base2.x} y1={F.base2.y} x2={F.base3.x} y2={F.base3.y} stroke={LINE} strokeWidth={1} />
      <Line x1={F.base3.x} y1={F.base3.y} x2={F.home.x}  y2={F.home.y}  stroke={LINE} strokeWidth={1} />

      {/* Pitcher's mound */}
      <Circle cx={F.mound.x} cy={F.mound.y} r={MOUND_RADIUS} fill="rgba(180,130,80,0.45)" stroke={LINE} strokeWidth={1} />

      {/* Bases */}
      <Polygon points={diamondPoly(F.base1.x, F.base1.y, BASE_HALF)} fill={BASE} />
      <Polygon points={diamondPoly(F.base2.x, F.base2.y, BASE_HALF)} fill={BASE} />
      <Polygon points={diamondPoly(F.base3.x, F.base3.y, BASE_HALF)} fill={BASE} />

      {/* Home plate — primary green */}
      <Polygon points={diamondPoly(F.home.x, F.home.y, BASE_HALF + 2)} fill={Colors.primary} opacity={0.85} />

      {/* Zones */}
      {renderZones && zones.map(zone => {
        const zx = zone.x_range[0] * FIELD_SIZE;
        const zy = zone.y_range[0] * FIELD_SIZE;
        const zw = (zone.x_range[1] - zone.x_range[0]) * FIELD_SIZE;
        const zh = (zone.y_range[1] - zone.y_range[0]) * FIELD_SIZE;
        const lx = (zone.x_range[0] + zone.x_range[1]) / 2 * FIELD_SIZE;
        const ly = (zone.y_range[0] + zone.y_range[1]) / 2 * FIELD_SIZE;
        const color   = submitted ? zoneColor(zone.id) : 'rgba(255,255,255,0.5)';
        const isHit   = zone.id === hitZoneId;
        const fillHex = submitted && isHit ? color : 'none';
        const opacity = submitted ? (isHit ? 1 : 0.42) : 0.45;

        return (
          <G key={zone.id}>
            {submitted ? (
              <Rect
                x={zx} y={zy} width={zw} height={zh}
                fill={fillHex}
                fillOpacity={isHit ? 0.12 : 0}
                stroke={color}
                strokeWidth={1.5}
                opacity={opacity}
              />
            ) : (
              <Rect
                x={zx} y={zy} width={zw} height={zh}
                fill="none"
                stroke={color}
                strokeWidth={1}
                strokeDasharray="4,3"
                opacity={opacity}
              />
            )}
            {submitted && (
              <SvgText
                x={lx}
                y={ly + 4}
                textAnchor="middle"
                fontSize={8}
                fontWeight="bold"
                fill={color}
                opacity={0.75}
              >
                {zone.label.toUpperCase()}
              </SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function DiamondCursor({
  data,
  responses,
  feedback,
  onComplete,
}: Props) {
  const zones: Zone[] = Array.isArray(data.zones) && data.zones.length > 0 ? data.zones : [];
  const correctZoneId  = data.correct_zone ?? responses.correct_zone ?? zones[0]?.id ?? '';
  const acceptableZoneIds: string[] = data.acceptable_zones ?? responses.acceptable_zones ?? [];
  const cursorLabel    = (data.cursor_label ?? 'YOU').toUpperCase();
  const showZonesEarly = data.show_zones ?? false;

  if (__DEV__ && zones.length > 0 && !data.correct_zone && !responses.correct_zone) {
    console.warn('[DiamondCursor] No correct_zone defined; defaulting to first zone', { zoneId: zones[0]?.id });
  }

  // ── State ─────────────────────────────────────────────────────────────────
  const [submitted, setSubmitted]   = useState(false);
  const [hitZoneId, setHitZoneId]   = useState<string | null>(null);
  const [result, setResult]         = useState<'correct' | 'acceptable' | 'wrong' | null>(null);

  const submittedRef = useRef(false);

  // Cursor position as Animated.ValueXY (direct setValue avoids re-renders during drag)
  const cursorAnim = useRef(new Animated.ValueXY({
    x: FIELD_SIZE / 2 - CURSOR_HALF,
    y: FIELD_SIZE / 2 - CURSOR_HALF,
  })).current;

  // Pixel position ref for release evaluation — kept in sync with cursorAnim
  const cursorPxRef = useRef({ x: FIELD_SIZE / 2, y: FIELD_SIZE / 2 });

  // Touch start pixel coords (for dx/dy offset calculation)
  const touchStart = useRef({ x: FIELD_SIZE / 2, y: FIELD_SIZE / 2 });

  // ── Release handler (ref pattern — stale-closure-safe) ────────────────────
  const handleReleaseRef = useRef<(nx: number, ny: number) => void>(() => {});

  useEffect(() => {
    handleReleaseRef.current = (nx: number, ny: number) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitted(true);

      // Zone evaluation: exact match first, then nearest center fallback
      let matched = zones.find(z =>
        nx >= z.x_range[0] && nx <= z.x_range[1] &&
        ny >= z.y_range[0] && ny <= z.y_range[1]
      );

      if (!matched && zones.length > 0) {
        let minDist = Infinity;
        for (const z of zones) {
          const cx = (z.x_range[0] + z.x_range[1]) / 2;
          const cy = (z.y_range[0] + z.y_range[1]) / 2;
          const d  = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2);
          if (d < minDist) { minDist = d; matched = z; }
        }
      }

      const zoneId  = matched?.id ?? '';
      setHitZoneId(zoneId);

      let outcome: 'correct' | 'acceptable' | 'wrong';
      if (zoneId === correctZoneId) {
        outcome = 'correct';
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (acceptableZoneIds.includes(zoneId)) {
        outcome = 'acceptable';
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        outcome = 'wrong';
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setResult(outcome);
    };
  });

  // ── PanResponder ──────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !submittedRef.current,
      onMoveShouldSetPanResponder:  () => !submittedRef.current,

      onPanResponderGrant: (evt) => {
        if (submittedRef.current) return;
        const lx = evt.nativeEvent.locationX;
        const ly = evt.nativeEvent.locationY;
        touchStart.current = { x: lx, y: ly };
        cursorPxRef.current = { x: lx, y: ly };
        cursorAnim.setValue({ x: lx - CURSOR_HALF, y: ly - CURSOR_HALF });
      },

      onPanResponderMove: (_, g) => {
        if (submittedRef.current) return;
        const px = Math.max(0, Math.min(FIELD_SIZE, touchStart.current.x + g.dx));
        const py = Math.max(0, Math.min(FIELD_SIZE, touchStart.current.y + g.dy));
        cursorPxRef.current = { x: px, y: py };
        cursorAnim.setValue({ x: px - CURSOR_HALF, y: py - CURSOR_HALF });
      },

      onPanResponderRelease: (_, g) => {
        if (submittedRef.current) return;
        const px = Math.max(0, Math.min(FIELD_SIZE, touchStart.current.x + g.dx));
        const py = Math.max(0, Math.min(FIELD_SIZE, touchStart.current.y + g.dy));
        cursorPxRef.current = { x: px, y: py };
        cursorAnim.setValue({ x: px - CURSOR_HALF, y: py - CURSOR_HALF });
        const nx = px / FIELD_SIZE;
        const ny = py / FIELD_SIZE;
        handleReleaseRef.current(nx, ny);
      },
    })
  ).current;

  // ── Retry (wrong only — resets before onComplete is fired) ────────────────
  function handleRetry() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    submittedRef.current = false;
    setSubmitted(false);
    setHitZoneId(null);
    setResult(null);
    cursorAnim.setValue({ x: FIELD_SIZE / 2 - CURSOR_HALF, y: FIELD_SIZE / 2 - CURSOR_HALF });
    cursorPxRef.current = { x: FIELD_SIZE / 2, y: FIELD_SIZE / 2 };
  }

  // ── Derived styling ───────────────────────────────────────────────────────
  const resultColor =
    result === 'correct'    ? Colors.primary  :
    result === 'acceptable' ? Colors.warning  :
    result === 'wrong'      ? Colors.danger   :
    Colors.primary;

  const feedbackText =
    result === 'correct'    ? (feedback.correct    ?? 'Correct placement.') :
    result === 'acceptable' ? (feedback.acceptable ?? feedback.correct ?? 'Acceptable.') :
    result === 'wrong'      ? (feedback.wrong      ?? 'Wrong placement. Check your alignment.') :
    '';

  const resultLabel =
    result === 'correct'    ? 'CORRECT'    :
    result === 'acceptable' ? 'ACCEPTABLE' :
    result === 'wrong'      ? 'WRONG LANE' :
    '';

  // ── Fallback: no zones ────────────────────────────────────────────────────
  if (zones.length === 0) {
    if (__DEV__) console.warn('[DiamondCursor] No zones defined — rendering fallback');
    return (
      <View style={styles.fallback}>
        <Ionicons name="alert-circle" size={18} color={Colors.warning} />
        <View style={{ flex: 1 }}>
          <Text style={styles.fallbackTitle}>This field rep needs an update.</Text>
          <Text style={styles.fallbackBody}>Zone data is missing. Keep moving.</Text>
        </View>
        <Pressable style={styles.continueBtn} onPress={() => onComplete(false)}>
          <Text style={styles.continueBtnText}>Continue →</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TAG */}
      <Text style={styles.tag}>DIAMOND CURSOR</Text>

      {/* SITUATION */}
      {data.scenario ? (
        <View style={styles.scenarioCard}>
          <Text style={styles.scenarioLabel}>SITUATION</Text>
          <Text style={styles.scenarioText}>{data.scenario}</Text>
        </View>
      ) : null}

      {/* PROMPT */}
      <Text style={styles.prompt}>{data.prompt ?? 'Place the cursor on the field.'}</Text>

      {/* FIELD */}
      <View style={styles.fieldOuter}>
        <View
          style={styles.fieldContainer}
          {...panResponder.panHandlers}
        >
          {/* SVG field + zones */}
          <FieldSvg
            zones={zones}
            showZonesEarly={showZonesEarly}
            submitted={submitted}
            hitZoneId={hitZoneId}
            correctZoneId={correctZoneId}
            acceptableZoneIds={acceptableZoneIds}
          />

          {/* Cursor overlay (Animated.ValueXY → no re-render per frame) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cursorWrap,
              { transform: cursorAnim.getTranslateTransform() },
            ]}
          >
            <View style={[styles.cursorGlow, { borderColor: resultColor }]} />
            <View style={[styles.cursorPin, { borderColor: resultColor }]}>
              <Text style={[styles.cursorLabel, { color: resultColor }]}>
                {cursorLabel}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Drag hint */}
        {!submitted && (
          <Text style={styles.dragHint}>Drag to place · Release to evaluate</Text>
        )}
      </View>

      {/* FEEDBACK */}
      {result && (
        <View style={[
          styles.feedbackCard,
          result === 'correct'    && styles.feedbackCorrect,
          result === 'acceptable' && styles.feedbackAcceptable,
          result === 'wrong'      && styles.feedbackWrong,
        ]}>
          <View style={styles.feedbackHeader}>
            <Ionicons
              name={
                result === 'correct'    ? 'checkmark-circle' :
                result === 'acceptable' ? 'alert-circle'     :
                'close-circle'
              }
              size={16}
              color={resultColor}
            />
            <Text style={[styles.feedbackLabel, { color: resultColor }]}>
              {resultLabel}
            </Text>
          </View>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </View>
      )}

      {/* ACTIONS */}
      {result && (
        <View style={styles.actionRow}>
          {result === 'wrong' && (
            <Pressable style={styles.retryBtn} onPress={handleRetry}>
              <Ionicons name="refresh" size={13} color={Colors.primary} />
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.continueBtn, { flex: 1 }]}
            onPress={() => onComplete(result !== 'wrong')}
          >
            <Text style={styles.continueBtnText}>
              {result === 'wrong' ? 'Continue Anyway →' : 'Continue →'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const CURSOR_SIZE = CURSOR_HALF * 2;

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  tag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
  },

  // Scenario
  scenarioCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  scenarioLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.warning,
    letterSpacing: 2,
  },
  scenarioText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // Prompt
  prompt: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  // Field
  fieldOuter: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fieldContainer: {
    width: FIELD_SIZE,
    height: FIELD_SIZE,
    backgroundColor: '#0B1410',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  dragHint: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 0.5,
  },

  // Cursor overlay
  cursorWrap: {
    position: 'absolute',
    width: CURSOR_SIZE,
    height: CURSOR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursorGlow: {
    position: 'absolute',
    width: CURSOR_SIZE + 12,
    height: CURSOR_SIZE + 12,
    borderRadius: (CURSOR_SIZE + 12) / 2,
    borderWidth: 1,
    borderColor: Colors.primary,
    opacity: 0.2,
  },
  cursorPin: {
    width: CURSOR_SIZE,
    height: CURSOR_SIZE,
    borderRadius: CURSOR_SIZE / 2,
    backgroundColor: '#0B1410',
    borderWidth: 2.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursorLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 0.5,
  },

  // Feedback
  feedbackCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  feedbackCorrect: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryMuted,
  },
  feedbackAcceptable: {
    borderColor: 'rgba(245,166,35,0.35)',
    backgroundColor: 'rgba(245,166,35,0.08)',
  },
  feedbackWrong: {
    borderColor: 'rgba(255,59,48,0.35)',
    backgroundColor: 'rgba(255,59,48,0.08)',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  feedbackLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  feedbackText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    lineHeight: 20,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  retryText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },

  // Fallback
  fallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  fallbackTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  fallbackBody: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
});
