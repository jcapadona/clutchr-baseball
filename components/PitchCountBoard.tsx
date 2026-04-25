import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type PitchResult =
  | 'strike_looking'
  | 'strike_swinging'
  | 'foul'
  | 'ball'
  | 'in_play_out'
  | 'in_play_hit'
  | 'hit_by_pitch';

export interface PitchEntry {
  result: PitchResult;
  count_before: { balls: number; strikes: number };
  pitch_type?: string; // optional — for pitcher perspective
}

export interface PitchCountBoardData {
  prompt: string;
  sub_prompt?: string;
  perspective: 'pitcher' | 'hitter';
  max_pitches?: number;   // how many pitches to track (default 3, max 7)
  show_pitch_type?: boolean; // whether to ask pitch type after each result
  context?: {
    outs?: number;
    runners?: string;
    inning?: string;
    score?: string;
  };
}

export interface PitchCountBoardResponses {
  // Evaluate the sequence the athlete built
  // At least one of these should be set
  first_pitch_strike?: boolean;      // pitcher: should pitch 1 be a strike?
  ahead_in_count?: boolean;          // pitcher: sequence should get pitcher ahead
  quality_count?: boolean;           // pitcher: 2 of 3 pitches should be strikes
  competitive_ab?: boolean;          // hitter: should see 4+ pitches
  two_strike_battle?: boolean;       // hitter: should stay alive after 0-2
  ideal_sequence?: PitchResult[];    // exact ideal sequence for comparison
}

export interface PitchCountBoardFeedback {
  excellent: string;  // ideal sequence / perfect execution
  good: string;       // mostly right
  poor: string;       // missed the target
  coaching?: string;  // always-shown coaching note after feedback
}

interface Props {
  data: PitchCountBoardData;
  responses: PitchCountBoardResponses;
  feedback: PitchCountBoardFeedback;
  onComplete: (passed: boolean) => void;
}

// ─── PITCH RESULT CONFIG ─────────────────────────────────────────────────────

interface PitchResultConfig {
  label: string;
  short: string;
  color: string;
  strikes: number;  // how many strikes this adds
  balls: number;    // how many balls this adds
  terminal: boolean; // ends the at-bat
}

const RESULT_CONFIG: Record<PitchResult, PitchResultConfig> = {
  strike_looking:  { label: 'Strike Looking', short: 'K',  color: Colors.primary, strikes: 1, balls: 0, terminal: false },
  strike_swinging: { label: 'Strike Swinging',short: 'Ks', color: Colors.primary, strikes: 1, balls: 0, terminal: false },
  foul:            { label: 'Foul Ball',       short: 'F',  color: Colors.warning, strikes: 1, balls: 0, terminal: false },
  ball:            { label: 'Ball',            short: 'B',  color: Colors.textTertiary, strikes: 0, balls: 1, terminal: false },
  in_play_out:     { label: 'In Play — Out',   short: 'IP', color: Colors.danger,  strikes: 0, balls: 0, terminal: true  },
  in_play_hit:     { label: 'In Play — Hit',   short: 'H',  color: Colors.info,    strikes: 0, balls: 0, terminal: true  },
  hit_by_pitch:    { label: 'Hit by Pitch',    short: 'HBP',color: Colors.danger,  strikes: 0, balls: 0, terminal: true  },
};

const PITCH_TYPE_OPTIONS = ['Fastball', 'Changeup', 'Slider', 'Curveball', 'Cutter', '2-Seam'];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function updateCount(
  balls: number,
  strikes: number,
  result: PitchResult
): { balls: number; strikes: number; over: boolean } {
  const cfg = RESULT_CONFIG[result];
  if (cfg.terminal) return { balls, strikes, over: true };

  let newStrikes = strikes + cfg.strikes;
  let newBalls = balls + cfg.balls;

  // Foul ball with 2 strikes stays at 2 strikes
  if (result === 'foul' && strikes >= 2) newStrikes = 2;

  const over = newStrikes >= 3 || newBalls >= 4;
  return {
    balls: Math.min(newBalls, 4),
    strikes: Math.min(newStrikes, 3),
    over,
  };
}

function evaluateSequence(
  pitches: PitchEntry[],
  responses: PitchCountBoardResponses,
  perspective: 'pitcher' | 'hitter'
): 'excellent' | 'good' | 'poor' {
  if (pitches.length === 0) return 'poor';
  let score = 0;
  let checks = 0;

  if (perspective === 'pitcher') {
    // First pitch strike check
    if (responses.first_pitch_strike !== undefined) {
      checks++;
      const p1 = pitches[0];
      const isStrike = p1.result === 'strike_looking' || p1.result === 'strike_swinging' || p1.result === 'foul' || p1.result === 'in_play_out';
      if (isStrike === responses.first_pitch_strike) score++;
    }
    // Quality count: at least 2 out of 3 pitches strikes
    if (responses.quality_count && pitches.length >= 2) {
      checks++;
      const strikes = pitches.filter(p =>
        ['strike_looking', 'strike_swinging', 'foul', 'in_play_out'].includes(p.result)
      ).length;
      if (strikes >= Math.ceil(pitches.length * 0.66)) score++;
    }
    // Ahead in count
    if (responses.ahead_in_count) {
      checks++;
      const last = pitches[pitches.length - 1];
      const isAhead = last.count_before.strikes > last.count_before.balls;
      if (isAhead) score++;
    }
  } else {
    // Hitter checks
    if (responses.competitive_ab) {
      checks++;
      if (pitches.length >= 4) score++;
    }
    if (responses.two_strike_battle) {
      checks++;
      const sawTwoStrikes = pitches.some(p => p.count_before.strikes === 2);
      const survived = sawTwoStrikes && pitches.length > pitches.findIndex(p => p.count_before.strikes === 2) + 1;
      if (survived) score++;
    }
    // Ideal sequence match
    if (responses.ideal_sequence && responses.ideal_sequence.length > 0) {
      checks++;
      const matchCount = pitches.filter((p, i) =>
        responses.ideal_sequence![i] === p.result
      ).length;
      if (matchCount >= Math.ceil((responses.ideal_sequence.length) * 0.7)) score++;
    }
  }

  if (checks === 0) return 'good';
  const pct = score / checks;
  if (pct >= 0.85) return 'excellent';
  if (pct >= 0.5) return 'good';
  return 'poor';
}

// ─── PITCH DOT ────────────────────────────────────────────────────────────────

function PitchDot({
  entry,
  index,
  animate,
}: {
  entry: PitchEntry | null;
  index: number;
  animate: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(animate ? 0.5 : 1)).current;

  React.useEffect(() => {
    if (animate) {
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();
    }
  }, [animate]);

  if (!entry) {
    return (
      <View style={dotStyles.empty}>
        <Text style={dotStyles.emptyNum}>{index + 1}</Text>
      </View>
    );
  }

  const cfg = RESULT_CONFIG[entry.result];
  return (
    <Animated.View style={[dotStyles.filled, { backgroundColor: cfg.color + '18', borderColor: cfg.color }, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={[dotStyles.shortLabel, { color: cfg.color }]}>{cfg.short}</Text>
      <Text style={dotStyles.countLabel}>
        {entry.count_before.balls}-{entry.count_before.strikes}
      </Text>
    </Animated.View>
  );
}

// ─── COUNT DISPLAY ────────────────────────────────────────────────────────────

function CountDisplay({ balls, strikes }: { balls: number; strikes: number }) {
  return (
    <View style={countStyles.wrap}>
      <View style={countStyles.side}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[countStyles.orb, i < balls && countStyles.orbBall]} />
        ))}
        <Text style={countStyles.label}>BALLS</Text>
      </View>
      <View style={countStyles.divider} />
      <View style={countStyles.middle}>
        <Text style={countStyles.count}>{balls}-{strikes}</Text>
      </View>
      <View style={countStyles.divider} />
      <View style={countStyles.side}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[countStyles.orb, i < strikes && countStyles.orbStrike]} />
        ))}
        <Text style={countStyles.label}>STRIKES</Text>
      </View>
    </View>
  );
}

// ─── RESULT BUTTON ────────────────────────────────────────────────────────────

function ResultButton({
  result,
  onPress,
  disabled,
}: {
  result: PitchResult;
  onPress: () => void;
  disabled: boolean;
}) {
  const cfg = RESULT_CONFIG[result];
  return (
    <Pressable
      style={({ pressed }) => [
        rbStyles.btn,
        { borderColor: cfg.color + '50' },
        pressed && !disabled && { backgroundColor: cfg.color + '18', transform: [{ scale: 0.97 }] },
        disabled && rbStyles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[rbStyles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[rbStyles.label, disabled && { color: Colors.textTertiary }]}>{cfg.label}</Text>
    </Pressable>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function PitchCountBoard({ data, responses, feedback, onComplete }: Props) {
  const maxPitches = Math.min(data.max_pitches ?? 3, 7);
  const [pitches, setPitches] = useState<PitchEntry[]>([]);
  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [atBatOver, setAtBatOver] = useState(false);
  const [showPitchType, setShowPitchType] = useState(false);
  const [pendingResult, setPendingResult] = useState<PitchResult | null>(null);
  const [evaluation, setEvaluation] = useState<'excellent' | 'good' | 'poor' | null>(null);
  const [lastAdded, setLastAdded] = useState(false);
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const done = atBatOver || pitches.length >= maxPitches;

  function handleResultTap(result: PitchResult) {
    if (done) return;
    Haptics.selectionAsync();

    if (data.show_pitch_type && data.perspective === 'pitcher') {
      setPendingResult(result);
      setShowPitchType(true);
      return;
    }

    addPitch(result, undefined);
  }

  function addPitch(result: PitchResult, pitchType: string | undefined) {
    const entry: PitchEntry = {
      result,
      count_before: { balls, strikes },
      pitch_type: pitchType,
    };

    const { balls: newBalls, strikes: newStrikes, over } = updateCount(balls, strikes, result);

    setPitches((prev) => [...prev, entry]);
    setBalls(newBalls);
    setStrikes(newStrikes);
    setLastAdded(true);
    setTimeout(() => setLastAdded(false), 400);

    if (over || pitches.length + 1 >= maxPitches) {
      const updatedPitches = [...pitches, entry];
      const result_eval = evaluateSequence(updatedPitches, responses, data.perspective);
      setEvaluation(result_eval);
      setAtBatOver(over);
      Animated.timing(feedbackAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      Haptics.notificationAsync(
        result_eval === 'excellent'
          ? Haptics.NotificationFeedbackType.Success
          : result_eval === 'good'
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Error
      );
    }

    setShowPitchType(false);
    setPendingResult(null);
  }

  function handleReset() {
    setPitches([]);
    setBalls(0);
    setStrikes(0);
    setAtBatOver(false);
    setEvaluation(null);
    feedbackAnim.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  const evalColor = evaluation === 'excellent'
    ? Colors.primary
    : evaluation === 'good'
    ? Colors.warning
    : Colors.danger;

  const evalTitle = evaluation === 'excellent'
    ? 'Elite sequence.'
    : evaluation === 'good'
    ? 'Good at-bat.'
    : 'Work to do.';

  // Pitch type selector overlay
  if (showPitchType && pendingResult) {
    return (
      <View style={styles.container}>
        <Text style={styles.prompt}>What pitch did you throw?</Text>
        <View style={styles.pitchTypeGrid}>
          {PITCH_TYPE_OPTIONS.map((pt) => (
            <Pressable
              key={pt}
              style={({ pressed }) => [
                styles.pitchTypeBtn,
                pressed && { backgroundColor: Colors.primaryMuted, borderColor: Colors.primaryBorder },
              ]}
              onPress={() => addPitch(pendingResult, pt)}
            >
              <Text style={styles.pitchTypeBtnText}>{pt}</Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.pitchTypeBtn, { borderColor: Colors.border }]}
            onPress={() => addPitch(pendingResult, undefined)}
          >
            <Text style={[styles.pitchTypeBtnText, { color: Colors.textTertiary }]}>Skip</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Context banner */}
      {data.context && Object.values(data.context).some(Boolean) && (
        <View style={styles.contextBanner}>
          {data.context.outs !== undefined && (
            <Text style={styles.contextItem}>{data.context.outs} OUT{data.context.outs !== 1 ? 'S' : ''}</Text>
          )}
          {data.context.runners && (
            <Text style={styles.contextItem}>{data.context.runners}</Text>
          )}
          {data.context.inning && (
            <Text style={styles.contextItem}>{data.context.inning}</Text>
          )}
          {data.context.score && (
            <Text style={styles.contextItem}>{data.context.score}</Text>
          )}
        </View>
      )}

      {/* Perspective badge */}
      <View style={styles.perspectiveBadge}>
        <Text style={styles.perspectiveText}>
          {data.perspective === 'pitcher' ? '⚾ PITCHER VIEW' : '🏏 HITTER VIEW'}
        </Text>
      </View>

      {/* Prompt */}
      <Text style={styles.prompt}>{data.prompt}</Text>
      {data.sub_prompt && <Text style={styles.subPrompt}>{data.sub_prompt}</Text>}

      {/* Live count display */}
      <CountDisplay balls={balls} strikes={strikes} />

      {/* Pitch sequence dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: maxPitches }).map((_, i) => (
          <PitchDot
            key={i}
            entry={pitches[i] ?? null}
            index={i}
            animate={i === pitches.length - 1 && lastAdded}
          />
        ))}
      </View>

      <Text style={styles.dotsLabel}>
        {done
          ? atBatOver
            ? `At-bat ended on pitch ${pitches.length}`
            : `${maxPitches}-pitch sequence complete`
          : `Pitch ${pitches.length + 1} of ${maxPitches} — tap the result`}
      </Text>

      {/* Result buttons — hidden when done */}
      {!done && (
        <View style={styles.resultsGrid}>
          {(Object.keys(RESULT_CONFIG) as PitchResult[])
            .filter((r) => {
              // Filter by perspective — hide irrelevant results
              if (data.perspective === 'pitcher') return true; // pitcher logs all
              return true; // hitter also logs all
            })
            .map((result) => (
              <ResultButton
                key={result}
                result={result}
                onPress={() => handleResultTap(result)}
                disabled={done}
              />
            ))}
        </View>
      )}

      {/* Evaluation feedback */}
      {evaluation && (
        <Animated.View
          style={[
            styles.evalCard,
            { borderColor: evalColor + '50', backgroundColor: evalColor + '10', opacity: feedbackAnim },
          ]}
        >
          <Text style={[styles.evalTitle, { color: evalColor }]}>{evalTitle}</Text>
          <Text style={styles.evalText}>
            {evaluation === 'excellent' && feedback.excellent}
            {evaluation === 'good' && feedback.good}
            {evaluation === 'poor' && feedback.poor}
          </Text>

          {/* Sequence recap */}
          <View style={styles.recapRow}>
            {pitches.map((p, i) => {
              const cfg = RESULT_CONFIG[p.result];
              return (
                <View key={i} style={[styles.recapPitch, { borderColor: cfg.color + '50', backgroundColor: cfg.color + '12' }]}>
                  <Text style={[styles.recapCount, { color: cfg.color }]}>
                    {p.count_before.balls}-{p.count_before.strikes}
                  </Text>
                  <Text style={[styles.recapResult, { color: cfg.color }]}>{cfg.short}</Text>
                  {p.pitch_type && (
                    <Text style={styles.recapPitchType}>{p.pitch_type.slice(0, 2).toUpperCase()}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {feedback.coaching && (
            <View style={styles.coachingNote}>
              <Text style={styles.coachingLabel}>COACHING NOTE</Text>
              <Text style={styles.coachingText}>{feedback.coaching}</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Action buttons */}
      {evaluation ? (
        <View style={styles.actionRow}>
          <Pressable style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>↺ Try Again</Text>
          </Pressable>
          <Pressable
            style={[styles.continueBtn, { backgroundColor: evalColor }]}
            onPress={() => onComplete(evaluation !== 'poor')}
          >
            <Text style={styles.continueBtnText}>Continue →</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },

  contextBanner: {
    flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap',
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  contextItem: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary, letterSpacing: 0.5 },

  perspectiveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryMuted, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primaryBorder,
  },
  perspectiveText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.8 },

  prompt: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, lineHeight: 24 },
  subPrompt: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 19 },

  dotsRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', flexWrap: 'wrap' },
  dotsLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textAlign: 'center' },

  resultsGrid: { gap: Spacing.sm },

  evalCard: {
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.lg, gap: Spacing.md,
  },
  evalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  evalText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, lineHeight: 23 },

  recapRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  recapPitch: {
    borderRadius: Radius.sm, borderWidth: 1,
    padding: Spacing.sm, alignItems: 'center', gap: 2, minWidth: 44,
  },
  recapCount: { fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  recapResult: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  recapPitchType: { fontSize: 8, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },

  coachingNote: {
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, gap: 4,
  },
  coachingLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },
  coachingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 19 },

  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  resetBtn: {
    flex: 1, borderRadius: Radius.lg, paddingVertical: Spacing.lg,
    alignItems: 'center', backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  resetBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  continueBtn: { flex: 2, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center' },
  continueBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },

  pitchTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  pitchTypeBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primaryBorder,
    backgroundColor: Colors.surface,
  },
  pitchTypeBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
});

const dotStyles = StyleSheet.create({
  empty: {
    width: 52, height: 52, borderRadius: Radius.md,
    backgroundColor: Colors.surface, borderWidth: 1.5,
    borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyNum: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  filled: {
    width: 52, height: 52, borderRadius: Radius.md,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  shortLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  countLabel: { fontSize: 9, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
});

const countStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.md,
  },
  side: { flex: 1, alignItems: 'center', gap: 6 },
  middle: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 40, backgroundColor: Colors.border },
  orb: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.border,
  },
  orbBall: { backgroundColor: Colors.primary },
  orbStrike: { backgroundColor: Colors.danger },
  label: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },
  count: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
});

const rbStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, flex: 1 },
  disabled: { opacity: 0.35 },
});
