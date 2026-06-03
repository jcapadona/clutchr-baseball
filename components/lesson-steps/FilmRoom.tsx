import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type FilmRoomProvider = 'youtube' | 'external_video' | 'mlb' | 'ncaa' | 'hosted';

export type FilmRoomChoiceQuality = 'correct' | 'acceptable' | 'poor';

export interface FilmRoomChoice {
  id: string;
  label?: string;
  text?: string;        // backward-compat alias for label
  quality?: FilmRoomChoiceQuality;
  correct?: boolean;    // backward-compat boolean
}

export interface FilmRoomData {
  provider?: FilmRoomProvider;
  youtube_id?: string | null;
  canonical_url?: string;
  fallback_url?: string;
  backup_urls?: string[];
  start_sec?: number;
  end_sec?: number;
  reliability_rating?: 'A' | 'B' | 'C' | 'A/B';
  event?: string;
  year?: number;
  athletes?: string;
  setup?: string;
  question?: string;
  choices?: FilmRoomChoice[];
  coach_breakdown?: string;
  takeaway?: string;
  // backward-compat fields (old step format)
  prompt?: string;
  body?: string;
  title?: string;
  study_seconds?: number;
  scene_tags?: string[];
  coach_feedback?: { correct?: string; incorrect?: string };
}

interface FilmRoomResult {
  correct: boolean;
  choiceId: string | null;
}

interface Props {
  step: FilmRoomData & { [key: string]: any };
  onComplete: (result: FilmRoomResult) => void;
}

// ─── Quality derivation ───────────────────────────────────────────────────────

function deriveChoiceQuality(choice: FilmRoomChoice): FilmRoomChoiceQuality {
  if (choice.quality) return choice.quality;
  // backward-compat: boolean correct field
  if (choice.correct === true) return 'correct';
  if (choice.correct === false) return 'poor';
  return 'poor';
}

// ─── Malformed fallback ───────────────────────────────────────────────────────

function MalformedFilmRoomCard({ onSkip }: { onSkip: () => void }) {
  return (
    <View style={mStyles.card}>
      <View style={mStyles.iconRow}>
        <Ionicons name="videocam-off-outline" size={22} color={Colors.warning} />
        <Text style={mStyles.title}>This Film Room rep needs an update.</Text>
      </View>
      <Text style={mStyles.body}>
        This step is missing key data. Skip it and keep the session moving.
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

// ─── DIAMOND SCENE ────────────────────────────────────────────────────────────

function DiamondScene({ sceneTags }: { sceneTags: string[] }) {
  const hasRunner = (base: string) =>
    sceneTags.some(t => t.toLowerCase().includes(base));

  const runners = {
    first:  hasRunner('runner_1') || hasRunner('runners_1'),
    second: hasRunner('runner_2') || hasRunner('runners_12') || hasRunner('runners_23'),
    third:  hasRunner('runner_3') || hasRunner('runners_13') || hasRunner('runners_23'),
  };

  const home  = { x: 60, y: 108 };
  const first = { x: 108, y: 60 };
  const sec   = { x: 60, y: 12 };
  const third = { x: 12, y: 60 };

  const basePos = [
    { pos: home,  active: false },
    { pos: first, active: runners.first },
    { pos: sec,   active: runners.second },
    { pos: third, active: runners.third },
  ];

  return (
    <Svg width={120} height={120}>
      <Line x1={home.x} y1={home.y} x2={first.x} y2={first.y} stroke="#2A2A2A" strokeWidth={1.5} />
      <Line x1={first.x} y1={first.y} x2={sec.x} y2={sec.y} stroke="#2A2A2A" strokeWidth={1.5} />
      <Line x1={sec.x} y1={sec.y} x2={third.x} y2={third.y} stroke="#2A2A2A" strokeWidth={1.5} />
      <Line x1={third.x} y1={third.y} x2={home.x} y2={home.y} stroke="#2A2A2A" strokeWidth={1.5} />
      {basePos.map(({ pos, active }) => (
        <Circle
          key={`${pos.x}-${pos.y}`}
          cx={pos.x}
          cy={pos.y}
          r={9}
          fill={active ? Colors.primary : '#1C1C1C'}
          stroke={active ? Colors.primary : '#333'}
          strokeWidth={1.5}
        />
      ))}
    </Svg>
  );
}

// ─── VIDEO CARD ───────────────────────────────────────────────────────────────

function VideoCard({ step }: { step: FilmRoomData }) {
  const [openError, setOpenError] = useState(false);

  const videoUrl = step.youtube_id
    ? `https://www.youtube.com/watch?v=${step.youtube_id}${step.start_sec != null ? `&t=${step.start_sec}s` : ''}`
    : (step.canonical_url ?? step.fallback_url ?? null);

  async function handleOpenVideo() {
    if (!videoUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(videoUrl);
      if (canOpen) {
        await Linking.openURL(videoUrl);
        setOpenError(false);
      } else {
        setOpenError(true);
      }
    } catch {
      setOpenError(true);
    }
  }

  const sceneTags: string[] = step.scene_tags ?? [];
  const hasMeta = step.event || step.year || step.athletes;

  return (
    <View style={vStyles.card}>
      <View style={vStyles.header}>
        <Text style={vStyles.tag}>FILM ROOM</Text>
        {step.provider && (
          <Text style={vStyles.provider}>{step.provider.replace(/_/g, ' ').toUpperCase()}</Text>
        )}
      </View>

      {hasMeta && (
        <View style={vStyles.metaRow}>
          {step.athletes && <Text style={vStyles.meta}>{step.athletes}</Text>}
          {step.event && <Text style={vStyles.meta}>{step.event}</Text>}
          {step.year && <Text style={vStyles.meta}>{step.year}</Text>}
        </View>
      )}

      {/* Scene diagram */}
      {sceneTags.length > 0 && (
        <View style={vStyles.diamondWrap}>
          <DiamondScene sceneTags={sceneTags} />
          <View style={vStyles.tagRow}>
            {sceneTags.map(t => (
              <View key={t} style={vStyles.tag2}>
                <Text style={vStyles.tagText}>{t.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Timestamp hint for external links */}
      {step.start_sec != null && !step.youtube_id && (
        <Text style={vStyles.timestamp}>
          Start at {formatTime(step.start_sec)}{step.end_sec != null ? ` — ${formatTime(step.end_sec)}` : ''}
        </Text>
      )}

      {/* Open video button — always present */}
      {videoUrl ? (
        <Pressable
          style={({ pressed }) => [vStyles.openBtn, pressed && { opacity: 0.75 }]}
          onPress={handleOpenVideo}
        >
          <Ionicons name="play-circle-outline" size={17} color="#000" />
          <Text style={vStyles.openBtnText}>Open Video</Text>
        </Pressable>
      ) : (
        <View style={vStyles.noVideoCard}>
          <Ionicons name="videocam-off-outline" size={16} color={Colors.textTertiary} />
          <Text style={vStyles.noVideoText}>No video link available — read the setup and answer the question.</Text>
        </View>
      )}

      {openError && (
        <Text style={vStyles.errorText}>Couldn't open the video. Check your connection and try again.</Text>
      )}
    </View>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const vStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 2 },
  provider: { fontSize: 9, fontFamily: 'Inter_500Medium', color: Colors.textTertiary, letterSpacing: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  meta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  diamondWrap: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, justifyContent: 'center' },
  tag2: {
    backgroundColor: '#1A1A1A',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  tagText: { fontSize: 10, color: Colors.textTertiary, fontFamily: 'Inter_400Regular', textTransform: 'capitalize' },
  timestamp: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textAlign: 'center' },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  openBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#000' },
  noVideoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  noVideoText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, flex: 1, lineHeight: 17 },
  errorText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.danger, textAlign: 'center' },
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function FilmRoom({ step, onComplete }: Props) {
  const choices: FilmRoomChoice[] = step.choices ?? [];
  const question = step.question ?? step.prompt ?? null;
  const setup = step.setup ?? step.body ?? step.title ?? null;
  const coachBreakdown = step.coach_breakdown ?? step.coach_feedback?.correct ?? null;
  const coachIncorrect = step.coach_feedback?.incorrect ?? null;
  const takeaway = step.takeaway ?? null;

  // All hooks must run before any conditional return
  const [selected, setSelected] = useState<FilmRoomChoice | null>(null);
  // revealed = feedback shown; poor answers set resolved but skip onComplete
  const [revealed, setRevealed] = useState(false);
  const resultFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (revealed) {
      Animated.timing(resultFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [revealed]);

  // Guard after hooks
  if (!question || !choices.length) {
    return <MalformedFilmRoomCard onSkip={() => onComplete({ correct: false, choiceId: null })} />;
  }

  function handleChoice(choice: FilmRoomChoice) {
    if (selected || revealed) return;
    const q = deriveChoiceQuality(choice);
    Haptics.selectionAsync();
    if (q === 'correct') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (q === 'poor') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelected(choice);
    setRevealed(true);
    // Poor answers show feedback + retry, do NOT advance
    if (q !== 'poor') {
      onComplete({ correct: q === 'correct', choiceId: choice.id });
    }
  }

  function handleRetry() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resultFade.setValue(0);
    setSelected(null);
    setRevealed(false);
  }

  function handleContinue() {
    const q = selected ? deriveChoiceQuality(selected) : 'poor';
    onComplete({ correct: q === 'correct', choiceId: selected?.id ?? null });
  }

  const selectedQuality = selected ? deriveChoiceQuality(selected) : null;
  const qualityColor =
    selectedQuality === 'correct' ? Colors.primary
    : selectedQuality === 'acceptable' ? Colors.warning
    : Colors.danger;

  const feedbackText = selected
    ? selectedQuality === 'correct'
      ? (coachBreakdown ?? 'Right read. You saw it.')
      : selectedQuality === 'acceptable'
        ? (coachBreakdown ?? 'Solid read. There was a better answer, but this works.')
        : (coachIncorrect ?? 'Watch this one again. The tell is there.')
    : '';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* VIDEO CARD */}
      <VideoCard step={step} />

      {/* SETUP / CONTEXT */}
      {!!setup && <Text style={styles.setup}>{setup}</Text>}

      {/* QUESTION */}
      <Text style={styles.question}>{question}</Text>

      {/* CHOICES */}
      {!revealed && (
        <View style={styles.choicesWrap}>
          {choices.map(c => (
            <Pressable
              key={c.id}
              style={({ pressed }) => [styles.choiceBtn, pressed && styles.choiceBtnPressed]}
              onPress={() => handleChoice(c)}
            >
              <Text style={styles.choiceText}>{c.label ?? c.text ?? c.id}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* RESULT */}
      {revealed && selected && (
        <Animated.View style={[styles.resultWrap, { opacity: resultFade, borderColor: qualityColor }]}>
          <View style={styles.resultHeader}>
            <View style={[styles.resultBadge, { borderColor: qualityColor }]}>
              <Text style={[styles.resultBadgeText, { color: qualityColor }]}>
                {selectedQuality === 'correct' ? 'RIGHT READ' : selectedQuality === 'acceptable' ? 'CLOSE READ' : 'MISSED IT'}
              </Text>
            </View>
          </View>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
          {!!takeaway && selectedQuality !== 'poor' && (
            <View style={styles.takeawayCard}>
              <Text style={styles.takeawayLabel}>TAKEAWAY</Text>
              <Text style={styles.takeawayText}>{takeaway}</Text>
            </View>
          )}
          {selectedQuality === 'poor' ? (
            <Pressable style={styles.retryBtn} onPress={handleRetry}>
              <Ionicons name="refresh" size={13} color={Colors.primary} />
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.continueBtn} onPress={handleContinue}>
              <Text style={styles.continueBtnText}>Finish Rep →</Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </ScrollView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  setup: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  question: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  choicesWrap: { gap: Spacing.sm },
  choiceBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  choiceBtnPressed: { opacity: 0.75 },
  choiceText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 21,
  },
  resultWrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  resultHeader: { flexDirection: 'row' },
  resultBadge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  resultBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.3 },
  feedbackText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  takeawayCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  takeawayLabel: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1.5 },
  takeawayText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, lineHeight: 19 },
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
  retryBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  continueBtnText: { color: '#000', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
