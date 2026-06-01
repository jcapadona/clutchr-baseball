import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type SwipeDirection = 'left' | 'right';

interface HotReadCard {
  id: string;
  prompt: string;
  answer: SwipeDirection;
  left_label?: string;
  right_label?: string;
  feedback?: string;
}

interface HotReadStep {
  title?: string;
  prompt?: string;
  left_label?: string;
  right_label?: string;
  cards?: HotReadCard[];
  [key: string]: any;
}

interface Props {
  step: HotReadStep;
  onComplete: () => void;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 120;
const LEFT_LABEL  = 'No';
const RIGHT_LABEL = 'Yes';

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function HotRead({ step, onComplete }: Props) {
  const cards: HotReadCard[] = step.cards ?? [];
  const globalLeft  = step.left_label  ?? LEFT_LABEL;
  const globalRight = step.right_label ?? RIGHT_LABEL;

  const [cardIndex, setCardIndex] = useState(0);
  const [results, setResults] = useState<{ correct: boolean }[]>([]);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [showScore, setShowScore] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  // Stale-closure-safe handler ref
  const handleSwipeRef = useRef<(dir: SwipeDirection) => void>(() => {});

  const currentCard = cards[cardIndex];

  // Update handler ref every render so PanResponder always calls latest version
  useEffect(() => {
    handleSwipeRef.current = (dir: SwipeDirection) => {
      if (!currentCard) return;
      const correct = dir === currentCard.answer;

      if (correct) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setResults(prev => [...prev, { correct }]);

      const flyTo = dir === 'right' ? 400 : -400;

      // Fly card off screen
      Animated.timing(translateX, {
        toValue: flyTo,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        // Show feedback briefly
        if (currentCard.feedback) {
          setFeedbackText(currentCard.feedback);
          Animated.sequence([
            Animated.timing(feedbackOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(1200),
            Animated.timing(feedbackOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(() => {
            setFeedbackText(null);
            advanceCard();
          });
        } else {
          advanceCard();
        }
      });
    };
  });

  function advanceCard() {
    translateX.setValue(0);
    cardOpacity.setValue(0);
    setCardIndex(prev => {
      const next = prev + 1;
      if (next >= cards.length) {
        setShowScore(true);
      }
      return next;
    });
    Animated.timing(cardOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          handleSwipeRef.current('right');
        } else if (g.dx < -SWIPE_THRESHOLD) {
          handleSwipeRef.current('left');
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            tension: 120,
            friction: 14,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Derived tilt from translate
  const rotate = translateX.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  const leftLabelOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const rightLabelOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (showScore) {
    const correct = results.filter(r => r.correct).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <View style={styles.scoreScreen}>
        <Text style={styles.scoreTag}>HOT READ</Text>
        <Text style={styles.scoreNum}>{pct}%</Text>
        <Text style={styles.scoreLabel}>
          {correct}/{total} correct reads
        </Text>
        <Text style={styles.scoreSub}>
          {pct >= 80
            ? 'Clean reads. You have the IQ for this.'
            : pct >= 50
            ? 'Good effort. Keep sharpening your reads.'
            : 'Study these situations — the reads will come.'}
        </Text>
        <View
          style={[styles.scoreBtn, { backgroundColor: Colors.primary }]}
          // Not a Pressable since onComplete fires the advance in the lesson player
          // Use a direct onPress via wrapping Pressable
        />
        {/* Trigger onComplete immediately — score is the terminal state */}
        {/* Use a real button so user taps to continue */}
        <View style={styles.scoreBtnReal}>
          <Text
            style={styles.scoreBtnText}
            onPress={onComplete}
          >
            Continue →
          </Text>
        </View>
      </View>
    );
  }

  if (!currentCard || cardIndex >= cards.length) return null;

  const leftLabel  = currentCard.left_label  ?? globalLeft;
  const rightLabel = currentCard.right_label ?? globalRight;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.tag}>HOT READ</Text>
        <Text style={styles.progressText}>{cardIndex + 1} / {cards.length}</Text>
      </View>

      {/* DIRECTION LABELS */}
      <View style={styles.labelRow}>
        <Animated.Text style={[styles.dirLabel, styles.dirLabelLeft, { opacity: leftLabelOpacity }]}>
          ← {leftLabel}
        </Animated.Text>
        <Animated.Text style={[styles.dirLabel, styles.dirLabelRight, { opacity: rightLabelOpacity }]}>
          {rightLabel} →
        </Animated.Text>
      </View>

      {/* CARD */}
      <Animated.View
        style={[
          styles.card,
          {
            opacity: cardOpacity,
            transform: [{ translateX }, { rotate }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.cardPrompt}>{currentCard.prompt}</Text>
        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>← Swipe to decide →</Text>
        </View>
      </Animated.View>

      {/* FEEDBACK */}
      {feedbackText && (
        <Animated.View style={[styles.feedbackBubble, { opacity: feedbackOpacity }]}>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.4)',
  },
  labelRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dirLabel: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  dirLabelLeft: {
    color: '#FF4444',
  },
  dirLabelRight: {
    color: Colors.primary,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    alignItems: 'center',
    gap: Spacing.lg,
    minHeight: 180,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cardPrompt: {
    fontSize: 19,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 27,
  },
  swipeHint: {
    marginTop: Spacing.sm,
  },
  swipeHintText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.5,
  },
  feedbackBubble: {
    backgroundColor: '#1A1A1A',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    maxWidth: '90%',
  },
  feedbackText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
  scoreScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  scoreTag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    letterSpacing: 2,
  },
  scoreNum: {
    fontSize: 72,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 80,
  },
  scoreLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.6)',
  },
  scoreSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scoreBtn: {
    display: 'none',
  },
  scoreBtnReal: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.sm,
  },
  scoreBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
});
