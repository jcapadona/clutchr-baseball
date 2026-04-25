import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ConfidenceSliderData {
  prompt: string;
  sub_prompt?: string;
  metric: 'confidence' | 'focus' | 'composure' | 'readiness' | 'energy';
  low_label?: string;   // label at the bottom of the scale
  high_label?: string;  // label at the top of the scale
  scale?: 10 | 5;       // defaults to 10
}

export interface ConfidenceSliderResponses {
  // Zones that get specific feedback messages
  // e.g. { low: [1,2,3], medium: [4,5,6], high: [7,8,9,10] }
  zones: {
    low?: number[];
    medium?: number[];
    high?: number[];
    peak?: number[];
  };
  // Which zone(s) count as "passing" (for XP purposes — this component always passes)
  healthy_range?: [number, number]; // inclusive, e.g. [6, 9]
}

export interface ConfidenceSliderFeedback {
  low?: string;     // shown when athlete scores in low zone
  medium?: string;  // medium zone
  high?: string;    // high zone
  peak?: string;    // peak zone (9-10)
  coaching_note?: string; // shown after zone feedback — universal follow-on
}

interface Props {
  data: ConfidenceSliderData;
  responses: ConfidenceSliderResponses;
  feedback: ConfidenceSliderFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── ZONE HELPERS ─────────────────────────────────────────────────────────────

type Zone = 'low' | 'medium' | 'high' | 'peak';

function getZone(value: number, responses: ConfidenceSliderResponses): Zone {
  if (responses.zones.peak?.includes(value)) return 'peak';
  if (responses.zones.high?.includes(value)) return 'high';
  if (responses.zones.medium?.includes(value)) return 'medium';
  return 'low';
}

function getZoneColor(zone: Zone): string {
  switch (zone) {
    case 'low':    return Colors.danger;
    case 'medium': return Colors.warning;
    case 'high':   return Colors.primary;
    case 'peak':   return Colors.primary;
  }
}

function getZoneLabel(zone: Zone, metric: string): string {
  const labels: Record<Zone, string[]> = {
    low:    ['Low', 'Not there yet', 'Working on it'],
    medium: ['Building', 'Getting there', 'In progress'],
    high:   ['Strong', 'Ready', 'Locked in'],
    peak:   ['Elite', 'Dialed', 'Peak state'],
  };
  return labels[zone][0];
}

// ─── METRIC CONFIG ────────────────────────────────────────────────────────────

const METRIC_META: Record<string, { icon: string; label: string }> = {
  confidence: { icon: '💪', label: 'CONFIDENCE' },
  focus:      { icon: '🎯', label: 'FOCUS' },
  composure:  { icon: '🧊', label: 'COMPOSURE' },
  readiness:  { icon: '⚡', label: 'READINESS' },
  energy:     { icon: '🔥', label: 'ENERGY' },
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function ConfidenceSlider({ data, responses, feedback, onComplete }: Props) {
  const scale = data.scale ?? 10;
  const [value, setValue] = useState<number>(Math.round(scale / 2));
  const [submitted, setSubmitted] = useState(false);
  const [zone, setZone] = useState<Zone | null>(null);
  const [trackHeight, setTrackHeight] = useState(0);

  const knobY = useRef(new Animated.Value(0)).current;
  const knobScale = useRef(new Animated.Value(1)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  // Convert pixel position to value
  function pixelToValue(py: number): number {
    if (trackHeight === 0) return Math.round(scale / 2);
    const clamped = Math.max(0, Math.min(py, trackHeight));
    // Top = max value, bottom = 1
    const ratio = 1 - clamped / trackHeight;
    return Math.max(1, Math.min(scale, Math.round(ratio * (scale - 1) + 1)));
  }

  function valueToPixel(v: number): number {
    if (trackHeight === 0) return 0;
    const ratio = (v - 1) / (scale - 1);
    return (1 - ratio) * trackHeight;
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(knobScale, { toValue: 1.25, tension: 200, friction: 10, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        // gestureState.moveY is absolute — we need relative to track
        const currentPx = valueToPixel(value);
        const newPx = currentPx + gestureState.dy;
        const newVal = pixelToValue(newPx);
        if (newVal !== value) {
          setValue(newVal);
          Haptics.selectionAsync();
          // Update knob position
          const finalPx = valueToPixel(newVal);
          knobY.setValue(finalPx - valueToPixel(Math.round(scale / 2)));
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(knobScale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();
      },
    })
  ).current;

  function handleTrackLayout(e: LayoutChangeEvent) {
    setTrackHeight(e.nativeEvent.layout.height);
    // Init knob position to center
    knobY.setValue(0);
  }

  function handleSubmit() {
    const detectedZone = getZone(value, responses);
    setZone(detectedZone);
    setSubmitted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(feedbackOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }

  const metric = METRIC_META[data.metric] ?? METRIC_META.confidence;
  const zoneColor = zone ? getZoneColor(zone) : Colors.primary;
  const knobPx = valueToPixel(value);

  return (
    <View style={styles.container}>
      {/* Metric badge */}
      <View style={[styles.metricBadge, { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryMuted }]}>
        <Text style={styles.metricIcon}>{metric.icon}</Text>
        <Text style={styles.metricLabel}>{metric.label}</Text>
      </View>

      {/* Prompt */}
      <Text style={styles.prompt}>{data.prompt}</Text>
      {data.sub_prompt && <Text style={styles.subPrompt}>{data.sub_prompt}</Text>}

      {/* Slider layout */}
      <View style={styles.sliderLayout}>

        {/* Labels column */}
        <View style={styles.labelsCol}>
          <Text style={styles.highLabel}>{data.high_label ?? (scale === 10 ? '10' : '5')}</Text>
          <Text style={styles.lowLabel}>{data.low_label ?? '1'}</Text>
        </View>

        {/* Track + knob */}
        <View style={styles.trackWrap} onLayout={handleTrackLayout}>
          {/* Track background */}
          <View style={styles.track}>
            {/* Fill from bottom to knob */}
            {trackHeight > 0 && (
              <View
                style={[
                  styles.trackFill,
                  {
                    height: trackHeight - knobPx,
                    bottom: 0,
                    backgroundColor: zoneColor,
                  },
                ]}
              />
            )}
          </View>

          {/* Tick marks */}
          {Array.from({ length: scale }).map((_, i) => {
            const tickVal = scale - i;
            const tickPx = trackHeight > 0 ? valueToPixel(tickVal) : 0;
            const isActive = tickVal <= value;
            return (
              <View
                key={tickVal}
                style={[
                  styles.tick,
                  { top: tickPx },
                  isActive && { backgroundColor: zoneColor + '80' },
                ]}
              />
            );
          })}

          {/* Knob */}
          {trackHeight > 0 && (
            <Animated.View
              style={[
                styles.knob,
                {
                  top: knobPx - 22,
                  borderColor: zoneColor,
                  backgroundColor: submitted ? zoneColor : Colors.surface,
                  transform: [{ scale: knobScale }],
                },
              ]}
              {...(submitted ? {} : panResponder.panHandlers)}
            >
              <Text style={[styles.knobValue, { color: submitted ? '#fff' : zoneColor }]}>
                {value}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Zone label column */}
        <View style={styles.zoneCol}>
          {submitted && zone ? (
            <View style={[styles.zoneBadge, { backgroundColor: zoneColor + '18', borderColor: zoneColor + '50' }]}>
              <Text style={[styles.zoneLabel, { color: zoneColor }]}>
                {getZoneLabel(zone, data.metric)}
              </Text>
            </View>
          ) : (
            <Text style={styles.dragHint}>drag</Text>
          )}
        </View>
      </View>

      {/* Scale legend */}
      <View style={styles.legend}>
        {Array.from({ length: scale }).map((_, i) => {
          const v = i + 1;
          return (
            <View key={v} style={[styles.legendDot, value >= v && { backgroundColor: zoneColor }]} />
          );
        })}
      </View>

      {/* Feedback block — shown after submit */}
      {submitted && zone && (
        <Animated.View
          style={[
            styles.feedbackCard,
            { borderColor: zoneColor + '40', backgroundColor: zoneColor + '10', opacity: feedbackOpacity },
          ]}
        >
          {/* Zone-specific feedback */}
          <Text style={[styles.feedbackZoneLabel, { color: zoneColor }]}>
            {zone.toUpperCase()} · {value}/{scale}
          </Text>
          <Text style={styles.feedbackText}>
            {zone === 'low' && feedback.low}
            {zone === 'medium' && feedback.medium}
            {zone === 'high' && feedback.high}
            {zone === 'peak' && (feedback.peak ?? feedback.high)}
          </Text>
          {feedback.coaching_note && (
            <View style={styles.coachingNote}>
              <Text style={styles.coachingNoteLabel}>COACH NOTE</Text>
              <Text style={styles.coachingNoteText}>{feedback.coaching_note}</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Action button */}
      {!submitted ? (
        <View style={styles.submitWrap}>
          <Text style={styles.submitHint}>Drag the handle to set your number</Text>
          <View
            style={[styles.submitBtn, { backgroundColor: Colors.primary }]}
            // Using View + Pressable pattern to avoid PanResponder conflict
          >
            <Text
              style={styles.submitBtnText}
              onPress={handleSubmit}
            >
              That is my {value} — submit →
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={[styles.submitBtn, { backgroundColor: zoneColor }]}
        >
          <Text
            style={styles.submitBtnText}
            onPress={() => onComplete(true)}
          >
            Got it →
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const TRACK_WIDTH = 12;
const KNOB_SIZE = 44;

const styles = StyleSheet.create({
  container: { gap: Spacing.lg, alignItems: 'stretch' },

  metricBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: 5,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  metricIcon: { fontSize: 14 },
  metricLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1 },

  prompt: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, lineHeight: 26 },
  subPrompt: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 20, marginTop: -Spacing.sm },

  sliderLayout: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 240,
    gap: Spacing.md,
  },

  labelsCol: {
    width: 32,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: KNOB_SIZE / 2,
  },
  highLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.textTertiary },
  lowLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.textTertiary },

  trackWrap: {
    width: TRACK_WIDTH + KNOB_SIZE,
    alignItems: 'center',
    position: 'relative',
  },
  track: {
    position: 'absolute',
    left: KNOB_SIZE / 2 - TRACK_WIDTH / 2,
    top: KNOB_SIZE / 2,
    bottom: KNOB_SIZE / 2,
    width: TRACK_WIDTH,
    borderRadius: TRACK_WIDTH / 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: TRACK_WIDTH / 2,
  },

  tick: {
    position: 'absolute',
    left: KNOB_SIZE / 2 - 18,
    width: 8,
    height: 1,
    backgroundColor: Colors.border,
  },

  knob: {
    position: 'absolute',
    left: 0,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  knobValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },

  zoneCol: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  zoneBadge: {
    borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  zoneLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  dragHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  legend: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legendDot: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },

  feedbackCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  feedbackZoneLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  feedbackText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, lineHeight: 23 },
  coachingNote: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  coachingNoteLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },
  coachingNoteText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 19 },

  submitWrap: { gap: Spacing.sm },
  submitHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textAlign: 'center' },
  submitBtn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  submitBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
});
