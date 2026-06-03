import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SnapshotCueQuality = 'correct' | 'acceptable' | 'poor';

export interface SnapshotCue {
  id: string;
  label: string;
  description?: string;
  quality?: SnapshotCueQuality;
  feedback?: string;
}

export interface SnapshotOverlayLabel {
  // New format: normalized x/y in [0, 1]
  id?: string;
  label?: string;
  x?: number;
  y?: number;
  // Old format: positional string
  text?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface SnapshotReadData {
  prompt?: string;
  situation?: string;
  cue_description?: string;
  image_uri?: string;
  overlay_labels?: SnapshotOverlayLabel[];
  diagram_mode?: 'pitcher_delivery' | 'hand_break' | 'release_point' | 'batter_stance' | 'field_map' | 'runner_read';
  cues?: SnapshotCue[];
  question?: string;
}

export interface SnapshotReadResponses {
  correct_id?: string;
  acceptable_ids?: string[];
}

export interface SnapshotReadFeedback {
  correct?: string;
  acceptable?: string;
  wrong?: string;
  poor?: string; // backward-compat alias for wrong
}

interface Props {
  data: SnapshotReadData;
  responses?: SnapshotReadResponses;
  feedback?: SnapshotReadFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── Quality derivation ───────────────────────────────────────────────────────

function deriveCueQuality(cue: SnapshotCue, responses: SnapshotReadResponses | undefined): SnapshotCueQuality {
  if (cue.quality) return cue.quality;
  if (responses?.correct_id && responses.correct_id === cue.id) return 'correct';
  if (responses?.acceptable_ids?.includes(cue.id)) return 'acceptable';
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(`[SnapshotRead] Cue "${cue.id}" has no quality and no matching response. Defaulting to poor.`);
  }
  return 'poor';
}

// ─── Malformed fallback ───────────────────────────────────────────────────────

function MalformedSnapshotCard({ onSkip }: { onSkip: () => void }) {
  return (
    <View style={mStyles.card}>
      <View style={mStyles.iconRow}>
        <Ionicons name="construct-outline" size={22} color={Colors.warning} />
        <Text style={mStyles.title}>This rep needs an update.</Text>
      </View>
      <Text style={mStyles.body}>
        This Snapshot Read is missing key data. Tap below to skip and keep the session going.
      </Text>
      <Pressable style={mStyles.btn} onPress={onSkip}>
        <Text style={mStyles.btnText}>Skip Step →</Text>
      </Pressable>
    </View>
  );
}

const mStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.warningBorder,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, flex: 1 },
  body: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 19 },
  btn: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.warningMuted,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  btnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.warning },
});

// ─── Diagram modes ────────────────────────────────────────────────────────────

function DiagramCard({ mode, cueDesc }: { mode?: string; cueDesc?: string }) {
  const config: Record<string, { icon: string; color: string; label: string }> = {
    pitcher_delivery: { icon: 'body', color: Colors.warning, label: 'PITCHER' },
    hand_break:       { icon: 'hand-left', color: Colors.info, label: 'HAND BREAK' },
    release_point:    { icon: 'radio-button-on', color: Colors.primary, label: 'RELEASE' },
    batter_stance:    { icon: 'person', color: '#BF5AF2', label: 'BATTER' },
    field_map:        { icon: 'map-outline', color: Colors.info, label: 'FIELD READ' },
    runner_read:      { icon: 'walk-outline', color: Colors.warning, label: 'RUNNER' },
  };
  const cfg = config[mode ?? ''] ?? { icon: 'eye-outline', color: Colors.textTertiary, label: 'READ' };

  return (
    <View style={dStyles.card}>
      <View style={dStyles.frame}>
        <View style={[dStyles.iconWrap, { borderColor: cfg.color, backgroundColor: `${cfg.color}15` }]}>
          <Ionicons name={cfg.icon as any} size={36} color={cfg.color} />
        </View>
        <View style={[dStyles.scanLine, { backgroundColor: `${cfg.color}30` }]} />
      </View>
      <View style={[dStyles.cueLabel, { borderColor: `${cfg.color}55`, backgroundColor: `${cfg.color}10` }]}>
        <View style={[dStyles.cueAccent, { backgroundColor: cfg.color }]} />
        <Text style={[dStyles.cueLabelText, { color: cfg.color }]}>{cfg.label} CUE</Text>
      </View>
      {!!cueDesc && <Text style={dStyles.cueDesc}>{cueDesc}</Text>}
    </View>
  );
}

const dStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    gap: 0,
  },
  frame: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    position: 'relative',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  cueLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cueAccent: { width: 4, height: 4, borderRadius: 2 },
  cueLabelText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.3 },
  cueDesc: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    lineHeight: 20,
    padding: Spacing.xl,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function SnapshotRead({ data, responses, feedback, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  // resolved = feedback shown; does NOT mean lesson advancing (poor answers set resolved but skip onComplete)
  const [resolved, setResolved] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const cues = data?.cues ?? [];
  const question = data?.question;

  // Pre-compute derived quality for every cue — must run before any early return
  const cueQualities = useMemo<Record<string, SnapshotCueQuality>>(() => {
    const map: Record<string, SnapshotCueQuality> = {};
    for (const cue of cues) {
      map[cue.id] = deriveCueQuality(cue, responses);
    }
    return map;
  }, [cues, responses]);

  // Guard: missing required content (after all hooks)
  if (!cues.length || !question) {
    return <MalformedSnapshotCard onSkip={() => onComplete(false)} />;
  }

  const selectedCue = cues.find((c) => c.id === selected);
  const quality = selected ? (cueQualities[selected] ?? null) : null;

  const qualityColor =
    quality === 'correct' ? Colors.primary
    : quality === 'acceptable' ? Colors.warning
    : quality === 'poor' ? Colors.danger
    : Colors.border;

  const globalFeedback =
    quality === 'correct' ? (feedback?.correct ?? '')
    : quality === 'acceptable' ? (feedback?.acceptable ?? '')
    : quality === 'poor' ? (feedback?.wrong ?? feedback?.poor ?? '')
    : '';

  function handleSelect(id: string) {
    if (resolved) return;
    Haptics.selectionAsync();
    setSelected(id);
    const q = cueQualities[id] ?? 'poor';
    if (q === 'correct') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (q === 'poor') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTimeout(() => {
      setResolved(true);
      // Poor answers show feedback and retry — do NOT advance the lesson
      if (q !== 'poor') {
        onComplete(q === 'correct');
      }
    }, 350);
  }

  function handleRetry() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setSelected(null);
      setResolved(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }

  return (
    <View style={styles.container}>
      {/* Optional prompt headline */}
      {!!data.prompt && <Text style={styles.prompt}>{data.prompt}</Text>}

      {/* Situation badge row */}
      <View style={styles.situationRow}>
        <View style={styles.situationBadge}>
          <Text style={styles.situationText}>SNAPSHOT</Text>
        </View>
        {!!data.situation && (
          <Text style={styles.situationDesc}>{data.situation}</Text>
        )}
      </View>

      {/* Visual — image or diagram */}
      {data.image_uri ? (
        <View style={styles.imageWrap}>
          <Image source={{ uri: data.image_uri }} style={styles.image} resizeMode="cover" />
          {(data.overlay_labels ?? []).map((label, i) => (
            <View key={label.id ?? i} style={[styles.overlayLabel, overlayLabelStyle(label)]}>
              <Text style={styles.overlayText}>{label.label ?? label.text ?? ''}</Text>
            </View>
          ))}
        </View>
      ) : (
        <DiagramCard mode={data.diagram_mode} cueDesc={data.cue_description} />
      )}

      {/* Question */}
      <Text style={styles.question}>{question}</Text>

      {/* Cue choices */}
      <Animated.View style={{ opacity: fadeAnim, gap: Spacing.sm }}>
        {cues.map((cue) => {
          const derivedQ = cueQualities[cue.id];
          const isSelected = selected === cue.id;
          const isAnswered = !!selected;
          const borderColor =
            isAnswered && isSelected
              ? derivedQ === 'correct' ? Colors.primary
                : derivedQ === 'acceptable' ? Colors.warning
                : Colors.danger
              : Colors.border;
          const bgColor =
            isAnswered && isSelected
              ? derivedQ === 'correct' ? Colors.primaryMuted
                : derivedQ === 'acceptable' ? 'rgba(245,166,35,0.10)'
                : 'rgba(255,59,48,0.08)'
              : Colors.surface;

          return (
            <Pressable
              key={cue.id}
              style={[styles.cueBtn, { borderColor, backgroundColor: bgColor }]}
              onPress={() => handleSelect(cue.id)}
              disabled={isAnswered}
            >
              <View style={[
                styles.cueDot,
                isAnswered && isSelected && { backgroundColor: borderColor },
              ]}>
                {isAnswered && isSelected && (
                  <Ionicons
                    name={derivedQ === 'correct' ? 'checkmark' : derivedQ === 'acceptable' ? 'remove' : 'close'}
                    size={11}
                    color="#fff"
                  />
                )}
              </View>
              <Text style={[styles.cueText, isSelected && { color: Colors.textPrimary }]}>
                {cue.label}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Feedback */}
      {resolved && selectedCue && (
        <View style={[styles.feedbackCard, { borderColor: qualityColor }]}>
          <View style={styles.fbHeader}>
            <View style={[styles.fbBadge, { borderColor: qualityColor }]}>
              <Text style={[styles.fbBadgeText, { color: qualityColor }]}>
                {quality === 'correct' ? 'CORRECT READ' : quality === 'acceptable' ? 'ACCEPTABLE' : 'MISSED IT'}
              </Text>
            </View>
          </View>
          {!!globalFeedback && <Text style={styles.fbGlobal}>{globalFeedback}</Text>}
          {!!selectedCue.feedback && <Text style={styles.fbDetail}>{selectedCue.feedback}</Text>}
          {quality === 'poor' && (
            <Pressable style={styles.retryBtn} onPress={handleRetry}>
              <Ionicons name="refresh" size={13} color={Colors.primary} />
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function overlayLabelStyle(label: SnapshotOverlayLabel): any {
  const base: any = { position: 'absolute' };
  // New spec format: x/y in [0, 1] range
  if (typeof label.x === 'number' && typeof label.y === 'number') {
    return { ...base, left: `${label.x * 100}%`, top: `${label.y * 100}%` };
  }
  // Old format: positional string
  const pos = label.position ?? 'center';
  if (pos === 'top-left')     return { ...base, top: 8, left: 8 };
  if (pos === 'top-right')    return { ...base, top: 8, right: 8 };
  if (pos === 'bottom-left')  return { ...base, bottom: 8, left: 8 };
  if (pos === 'bottom-right') return { ...base, bottom: 8, right: 8 };
  return { ...base, top: '45%', left: '35%' };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },

  prompt: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  situationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  situationBadge: {
    borderWidth: 1,
    borderColor: `${Colors.info}55`,
    backgroundColor: `${Colors.info}12`,
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  situationText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.info, letterSpacing: 1.3 },
  situationDesc: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, flex: 1 },

  imageWrap: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 180,
    backgroundColor: '#111',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  overlayLabel: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: Radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  overlayText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  question: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 21,
  },

  cueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  cueDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cueText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  feedbackCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  fbHeader: { flexDirection: 'row' },
  fbBadge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  fbBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.3 },
  fbGlobal: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, lineHeight: 21 },
  fbDetail: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 19 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginTop: Spacing.xs,
  },
  retryText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
});
