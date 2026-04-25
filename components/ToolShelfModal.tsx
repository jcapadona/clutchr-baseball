import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── TOOL DEFINITIONS ────────────────────────────────────────────────────────

type ToolCategory = 'universal' | 'pitcher' | 'hitter' | 'catcher' | 'infielder' | 'outfielder';
type ToolMode = 'interactive' | 'print_card';
type DurationKey = '30s' | '60s' | '2min';

interface ToolStep {
  cue: string;        // short action word shown on card
  instruction: string; // full instruction shown in interactive mode
  duration?: number;  // seconds for timed steps
}

interface QuickTool {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  categories: ToolCategory[];
  mode: ToolMode;
  duration: DurationKey;
  whenToUse: string;
  steps: ToolStep[];
  printTitle: string;   // short title for printed card
  printCue: string;     // single cue word for the card
}

const TOOLS: QuickTool[] = [
  // ── UNIVERSAL ────────────────────────────────────────────────────────────
  {
    id: 'reset_16',
    name: '16-Second Reset',
    tagline: 'Emergency reset. Any situation. Any role.',
    icon: 'refresh-circle',
    color: Colors.primary,
    categories: ['universal'],
    mode: 'interactive',
    duration: '30s',
    whenToUse: 'After a mistake, between batters, or when you feel your focus slipping.',
    steps: [
      { cue: 'STEP OFF', instruction: 'Step away from your position or step out of the box. Physical separation from the mistake.' },
      { cue: 'EXHALE', instruction: 'Fully exhale — empty your lungs completely. This is your flush signal.', duration: 4 },
      { cue: 'BREATHE IN', instruction: 'Slow inhale for 4 counts. Fill from the belly up.', duration: 4 },
      { cue: 'BREATHE OUT', instruction: 'Slow exhale for 6 counts. Release everything.', duration: 6 },
      { cue: 'CUE WORD', instruction: 'Say your reset cue quietly. "Next." "Attack." "Lock in." Whatever is yours.' },
      { cue: 'GO', instruction: 'Return to your position. Chin up. Ready position. Next pitch.' },
    ],
    printTitle: '16-Second Reset',
    printCue: 'EXHALE · BREATHE · RESET',
  },
  {
    id: 'confidence_reset',
    name: 'Confidence Reset',
    tagline: 'Rebuild from the inside out.',
    icon: 'shield-checkmark',
    color: Colors.primary,
    categories: ['universal'],
    mode: 'interactive',
    duration: '60s',
    whenToUse: 'When you feel your confidence slipping, after a rough at-bat or inning, during a slump.',
    steps: [
      { cue: 'ONE WIN', instruction: 'Recall one thing you did well this week. One play. One pitch. One at-bat. See it clearly.' },
      { cue: 'YOUR CUE', instruction: 'Say your confidence cue out loud or in your head. "I belong here." "I work too hard not to compete." Make it yours.' },
      { cue: 'POSTURE', instruction: 'Physically reset your body: chin up, shoulders back, chest out. Elite body language fires elite brain signals.' },
      { cue: 'BREATHE', instruction: 'One deep breath. Fill the chest. This is what competing looks like.', duration: 6 },
      { cue: 'STEP IN', instruction: 'Walk back into your position or into the box like you own it. Because you have earned the right to be here.' },
    ],
    printTitle: 'Confidence Reset',
    printCue: 'ONE WIN · YOUR CUE · STEP IN',
  },

  // ── PITCHER TOOLS ─────────────────────────────────────────────────────────
  {
    id: 'between_pitch_reset',
    name: 'Between-Pitch Reset',
    tagline: 'Step off. Breathe. Pick your pitch. Attack.',
    icon: 'baseball',
    color: Colors.purple,
    categories: ['pitcher'],
    mode: 'print_card',
    duration: '30s',
    whenToUse: 'Between every pitch — especially after a walk, hit, or error. Use before stepping back on the rubber.',
    steps: [
      { cue: 'STEP BACK', instruction: 'Step behind the rubber. Create physical separation from the last pitch.' },
      { cue: 'ONE BREATH', instruction: 'Take one full breath. Exhale first, then inhale slowly. This resets your nervous system.' },
      { cue: 'GRIP CHECK', instruction: 'Feel your grip. Find your reference point on the seams. This is your anchor.' },
      { cue: 'TEMPO CUE', instruction: '"Work fast. Attack zone." or "Slow down. Trust it." Know your tempo cue for today.' },
      { cue: 'PICK IT', instruction: 'Get your sign. Commit to the pitch and the location. No doubt when you step on the rubber.' },
      { cue: 'NOD. GO.', instruction: 'Nod to your catcher. Step on the rubber. Deliver with conviction.' },
    ],
    printTitle: 'Between-Pitch Reset',
    printCue: 'STEP BACK · BREATHE · PICK IT · GO',
  },
  {
    id: 'pre_bullpen',
    name: 'Pre-Bullpen Lock-In',
    tagline: 'Set your intention before every bullpen.',
    icon: 'eye',
    color: Colors.purple,
    categories: ['pitcher'],
    mode: 'interactive',
    duration: '2min',
    whenToUse: 'Before your bullpen session or pregame warmup. This is your mental rep before the physical reps.',
    steps: [
      { cue: 'CENTER', instruction: 'Three slow breaths. In through the nose, out through the mouth. Clear the noise.', duration: 18 },
      { cue: 'GRIP LIST', instruction: 'Run your pitch grips in your head: fastball, off-speed, breaking ball. Feel each one.' },
      { cue: 'FIVE TARGETS', instruction: 'Visualize your first 5 throw targets. Down and away. Back foot. Up. Middle. Repeat. See them clearly.' },
      { cue: 'TEMPO CUE', instruction: 'Set your tempo cue for today. "Fast and loose." "Attack early." "Trust the stuff." Say it twice.' },
      { cue: 'LOCK IN', instruction: 'Clap your glove once. Walk to the mound with intention. You are ready. Now go prove it.' },
    ],
    printTitle: 'Pre-Bullpen Lock-In',
    printCue: 'BREATHE · GRIPS · TARGETS · GO',
  },
  {
    id: 'post_throw_recovery',
    name: 'Post-Throw Recovery',
    tagline: 'The arm that lasts is the arm that recovers.',
    icon: 'fitness',
    color: Colors.purple,
    categories: ['pitcher'],
    mode: 'interactive',
    duration: '2min',
    whenToUse: 'After every throwing session — bullpen, game, long toss. Non-negotiable.',
    steps: [
      { cue: 'ARM CIRCLES', instruction: '10 forward, 10 backward. Both arms. Start small and get bigger.', duration: 30 },
      { cue: 'SLEEPER STRETCH', instruction: 'Sleeper stretch: lie on your throwing side, push your forearm toward the ground gently. 30 seconds each side.', duration: 60 },
      { cue: 'CROSS-BODY', instruction: 'Cross-body stretch: pull your throwing arm across your chest. Hold 30 seconds. Feel the posterior shoulder.', duration: 30 },
      { cue: 'FOAM ROLL', instruction: 'Roll your lat and posterior shoulder 60 seconds per side. The lat is attached to the arm. Take care of it.' },
      { cue: 'HYDRATE', instruction: '16-20oz of water before the next hour. Recovery happens at the cellular level. Feed it.' },
    ],
    printTitle: 'Post-Throw Recovery',
    printCue: 'CIRCLES · SLEEPER · CROSS-BODY · HYDRATE',
  },

  // ── HITTER TOOLS ──────────────────────────────────────────────────────────
  {
    id: 'pre_ab_reset',
    name: 'Pre-AB Routine',
    tagline: 'The at-bat starts before you step in the box.',
    icon: 'time',
    color: Colors.warning,
    categories: ['hitter'],
    mode: 'print_card',
    duration: '60s',
    whenToUse: 'In the on-deck circle before every at-bat. This is your prep window.',
    steps: [
      { cue: 'WATCH HIM', instruction: 'Watch the pitcher from the on-deck circle. Track his release point. Read his tempo.' },
      { cue: 'TIME IT', instruction: 'Take 2-3 swings timed to his arm speed. Get your timing locked before you step in.' },
      { cue: 'ONE PITCH', instruction: 'Identify one pitch he is throwing for strikes today. That is your first-pitch plan.' },
      { cue: 'YOUR ZONE', instruction: 'Set your damage zone. Where do you want the pitch? Know it before you step in.' },
      { cue: 'CUE WORD', instruction: 'Say your approach cue. "See it early." "Hunt middle-in." "Short and quick." Lock in.' },
      { cue: 'STEP IN', instruction: 'Walk into the box like you belong there. Because you do. You have done your homework.' },
    ],
    printTitle: 'Pre-AB Routine',
    printCue: 'WATCH · TIME IT · YOUR ZONE · STEP IN',
  },
  {
    id: 'post_strikeout',
    name: 'Post-Strikeout Reset',
    tagline: 'Short memory. Same player. Next at-bat.',
    icon: 'refresh',
    color: Colors.warning,
    categories: ['hitter'],
    mode: 'print_card',
    duration: '30s',
    whenToUse: 'Immediately after striking out. The walk back to the dugout is your reset window.',
    steps: [
      { cue: 'BREATHE OUT', instruction: 'Controlled exhale before you leave the box. Start the flush here.' },
      { cue: 'CHIN LEVEL', instruction: 'Keep your chin level. Not up, not down. Elite body language sends the right signal to your brain.' },
      { cue: 'PUT IT AWAY', instruction: 'Put the bat away with intention, not anger. One clean motion. You are not frustrated — you are ready.' },
      { cue: 'WATCH HIM', instruction: 'Sit where you can see the pitcher. Watch his next two batters. Find his pattern.' },
      { cue: 'NEXT TIME', instruction: 'When your turn comes, you already know what you are doing differently. Clean slate.' },
    ],
    printTitle: 'Post-Strikeout Reset',
    printCue: 'EXHALE · CHIN UP · WATCH · NEXT TIME',
  },

  // ── CATCHER TOOLS ─────────────────────────────────────────────────────────
  {
    id: 'catcher_calm',
    name: 'Catcher Calm-the-Moment',
    tagline: 'Your calm is contagious. Choose it.',
    icon: 'shield',
    color: Colors.info,
    categories: ['catcher'],
    mode: 'print_card',
    duration: '60s',
    whenToUse: 'When your pitcher is losing it. Walk to the mound with a plan, not a lecture.',
    steps: [
      { cue: 'SLOW WALK', instruction: 'Walk slowly to the mound. Your pace sets the energy. Do not rush.' },
      { cue: 'EYE CONTACT', instruction: 'Make eye contact when you arrive. Not aggressive. Just present. "I am here."' },
      { cue: 'ONE CUE', instruction: 'Give one cue, not three. "Trust your fastball." "Attack the zone." "I got you." Pick one.' },
      { cue: 'YOUR PLAN', instruction: 'Remind him of the game plan. "We are going fastball in, curveball away. That is our game." Short. Direct.' },
      { cue: 'WALK BACK', instruction: 'Walk back with confidence. He is watching you leave. Your energy is the last thing he sees.' },
    ],
    printTitle: 'Catcher: Calm the Moment',
    printCue: 'SLOW WALK · ONE CUE · I GOT YOU',
  },

  // ── INFIELD/OUTFIELD TOOLS ────────────────────────────────────────────────
  {
    id: 'after_error_reset',
    name: 'After-Error Reset',
    tagline: 'Glove pop. Next play. Same player.',
    icon: 'refresh',
    color: Colors.danger,
    categories: ['infielder', 'outfielder'],
    mode: 'print_card',
    duration: '30s',
    whenToUse: 'Immediately after committing an error or misplay. Between plays.',
    steps: [
      { cue: 'GLOVE POP', instruction: 'One sharp clap of your glove into your throwing hand. This is your physical flush signal.' },
      { cue: 'SELF-TALK', instruction: '"Flush it." "Next play." "Same player." Say it quietly. Mean it.' },
      { cue: 'GET MOVING', instruction: 'Walk, shuffle, jog — any movement breaks the mental freeze. Do not stand still and replay the error.' },
      { cue: 'EYE CONTACT', instruction: 'Make eye contact with your pitcher or a teammate. One quick nod that says: "I got the next one."' },
      { cue: 'READY POSITION', instruction: 'Get back into your ready position before the next pitch. Treat the next ball as pitch one of the game.' },
    ],
    printTitle: 'After-Error Reset',
    printCue: 'GLOVE POP · NEXT PLAY · READY',
  },
  {
    id: 'two_strike_survival',
    name: '2-Strike Survival',
    tagline: 'Two strikes is not out. Compete.',
    icon: 'alert',
    color: Colors.warning,
    categories: ['hitter'],
    mode: 'print_card',
    duration: '30s',
    whenToUse: 'As you step back in after going to two strikes. Quick mental reset.',
    steps: [
      { cue: 'CHOKE UP', instruction: 'Choke up one inch on the handle. Shorter bat = quicker hands = more coverage.' },
      { cue: 'OPEN UP', instruction: 'Slightly open your stance. See more of the plate. Make it easier to cover away.' },
      { cue: 'GO DEEPER', instruction: 'Let the ball travel deeper. Trust your hands. Do not lunge.' },
      { cue: 'EXPAND', instruction: 'Expand your zone to the edges. Anything near the plate gets a short swing.' },
      { cue: 'MAKE CONTACT', instruction: 'One thought: make contact. Hard contact is a bonus. Your only job is to compete.' },
    ],
    printTitle: '2-Strike Survival Mode',
    printCue: 'CHOKE UP · GO DEEP · MAKE CONTACT',
  },
  {
    id: 'body_language_reset',
    name: 'Body Language Reset',
    tagline: 'Posture is the first pitch of the next play.',
    icon: 'body',
    color: Colors.primary,
    categories: ['universal'],
    mode: 'interactive',
    duration: '30s',
    whenToUse: 'When you catch yourself showing negative body language — head down, shoulders slumped, slow feet.',
    steps: [
      { cue: 'NOTICE IT', instruction: 'You caught yourself. That awareness is the skill. Now fix it deliberately.' },
      { cue: 'CHIN UP', instruction: 'Lift your chin to level. Not up, not down. This one move changes how you feel and how you look.' },
      { cue: 'SHOULDERS BACK', instruction: 'Roll your shoulders back and down. Big chest. Open posture. Elite body language.' },
      { cue: 'LOOSE HANDS', instruction: 'Shake your hands out. Tension lives in the hands. Release it.' },
      { cue: 'FEET MOVING', instruction: 'Get your feet moving — even a shuffle. Movement breaks the mental slump signal.' },
    ],
    printTitle: 'Body Language Reset',
    printCue: 'CHIN UP · SHOULDERS BACK · FEET MOVING',
  },
];

// ─── ROLE SURFACING ───────────────────────────────────────────────────────────
// Returns tools in priority order for the athlete's role

function getSurfacedTools(role: string, seasonPhase: string): QuickTool[] {
  const roleKey = role as ToolCategory;

  // Suggested = role-specific first, then universal
  const roleTools = TOOLS.filter((t) => t.categories.includes(roleKey));
  const universalTools = TOOLS.filter((t) => t.categories.includes('universal'));

  // Season phase adjustments
  let suggested = [...roleTools, ...universalTools];
  if (seasonPhase === 'return_to_throw') {
    suggested = [
      TOOLS.find((t) => t.id === 'post_throw_recovery')!,
      ...suggested.filter((t) => t.id !== 'post_throw_recovery'),
    ].filter(Boolean);
  }
  if (seasonPhase === 'slump_reset') {
    suggested = [
      TOOLS.find((t) => t.id === 'confidence_reset')!,
      ...suggested.filter((t) => t.id !== 'confidence_reset'),
    ].filter(Boolean);
  }

  return suggested.filter(Boolean);
}

// ─── PRINT CARD VIEW ─────────────────────────────────────────────────────────

function PrintCardView({
  tool,
  onClose,
}: {
  tool: QuickTool;
  onClose: () => void;
}) {
  async function handleShare() {
    const steps = tool.steps.map((s, i) => `${i + 1}. ${s.cue}: ${s.instruction}`).join('\n');
    const text = `CLUTCHR BASEBALL\n${tool.printTitle.toUpperCase()}\n\n${tool.whenToUse}\n\n${steps}\n\n────────────\nCUE: ${tool.printCue}\n\nclutchr.app`;
    try {
      await Share.share({ message: text, title: tool.printTitle });
    } catch (e) {}
  }

  return (
    <View style={printStyles.container}>
      {/* Card preview */}
      <View style={printStyles.card}>
        <View style={printStyles.cardHeader}>
          <Text style={printStyles.cardHeaderLabel}>CLUTCHR BASEBALL</Text>
          <Text style={printStyles.cardTitle}>{tool.printTitle.toUpperCase()}</Text>
          <Text style={printStyles.cardWhen}>{tool.whenToUse}</Text>
        </View>
        <View style={printStyles.cardDivider} />
        <View style={printStyles.stepsList}>
          {tool.steps.map((step, i) => (
            <View key={i} style={printStyles.stepRow}>
              <View style={printStyles.stepNum}>
                <Text style={printStyles.stepNumText}>{i + 1}</Text>
              </View>
              <View style={printStyles.stepContent}>
                <Text style={printStyles.stepCue}>{step.cue}</Text>
                <Text style={printStyles.stepInstruction}>{step.instruction}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={printStyles.cardDivider} />
        <View style={printStyles.cueStrip}>
          <Text style={printStyles.cueStripLabel}>YOUR CUE SEQUENCE</Text>
          <Text style={printStyles.cueStripText}>{tool.printCue}</Text>
        </View>
      </View>

      {/* Share/save buttons */}
      <Pressable style={printStyles.shareBtn} onPress={handleShare}>
        <Ionicons name="share-outline" size={18} color={Colors.background} />
        <Text style={printStyles.shareBtnText}>Share / Print Card</Text>
      </Pressable>
      <Text style={printStyles.printHint}>
        Screenshot or print this card. Fold it to notecard size. Keep it in your bat bag.
      </Text>
      <Pressable style={printStyles.backBtn} onPress={onClose}>
        <Text style={printStyles.backBtnText}>← Back to tools</Text>
      </Pressable>
    </View>
  );
}

// ─── INTERACTIVE TOOL RUNNER ─────────────────────────────────────────────────

function ToolRunner({
  tool,
  onFinish,
}: {
  tool: QuickTool;
  onFinish: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = tool.steps[stepIdx];
  const hasTimer = !!currentStep?.duration;

  useEffect(() => {
    if (hasTimer && currentStep.duration) {
      setTimerSeconds(currentStep.duration);
      setTimerRunning(false);
      setTimerDone(false);
    } else {
      setTimerSeconds(null);
    }
  }, [stepIdx]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function startTimer() {
    if (!currentStep.duration) return;
    setTimerRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    intervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current!);
          setTimerRunning(false);
          setTimerDone(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function advance() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    Haptics.selectionAsync();
    if (stepIdx >= tool.steps.length - 1) {
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setStepIdx((s) => s + 1);
      setTimerRunning(false);
      setTimerDone(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }

  if (done) {
    return (
      <View style={runnerStyles.doneContainer}>
        <View style={runnerStyles.doneIcon}>
          <Ionicons name="checkmark" size={32} color={Colors.background} />
        </View>
        <Text style={runnerStyles.doneTitle}>Done.</Text>
        <Text style={runnerStyles.doneSub}>Rep complete. Back to work.</Text>
        <Pressable style={runnerStyles.doneBtn} onPress={onFinish}>
          <Text style={runnerStyles.doneBtnText}>Close →</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View style={[runnerStyles.container, { opacity: fadeAnim }]}>
      {/* Step counter */}
      <Text style={runnerStyles.counter}>
        {stepIdx + 1} / {tool.steps.length}
      </Text>

      {/* Big cue word */}
      <View style={[runnerStyles.cuePill, { borderColor: tool.color + '50', backgroundColor: tool.color + '12' }]}>
        <Text style={[runnerStyles.cueWord, { color: tool.color }]}>{currentStep.cue}</Text>
      </View>

      {/* Instruction */}
      <Text style={runnerStyles.instruction}>{currentStep.instruction}</Text>

      {/* Timer */}
      {hasTimer && timerSeconds !== null && (
        <View style={runnerStyles.timerWrap}>
          <View style={runnerStyles.timerRing}>
            <Text style={runnerStyles.timerNum}>{timerSeconds}</Text>
            <Text style={runnerStyles.timerLabel}>sec</Text>
          </View>
          {!timerRunning && !timerDone && (
            <Text style={runnerStyles.timerHint}>Tap "Go" to start the timer</Text>
          )}
          {timerRunning && <Text style={runnerStyles.timerRunning}>Hold it.</Text>}
          {timerDone && <Text style={runnerStyles.timerComplete}>Time.</Text>}
        </View>
      )}

      {/* Advance button */}
      {hasTimer ? (
        !timerRunning && !timerDone ? (
          <Pressable style={[runnerStyles.advanceBtn, { backgroundColor: tool.color }]} onPress={startTimer}>
            <Text style={runnerStyles.advanceBtnText}>Go →</Text>
          </Pressable>
        ) : timerDone ? (
          <Pressable style={[runnerStyles.advanceBtn, { backgroundColor: tool.color }]} onPress={advance}>
            <Text style={runnerStyles.advanceBtnText}>
              {stepIdx >= tool.steps.length - 1 ? 'Finish' : 'Next →'}
            </Text>
          </Pressable>
        ) : null
      ) : (
        <Pressable style={[runnerStyles.advanceBtn, { backgroundColor: tool.color }]} onPress={advance}>
          <Text style={runnerStyles.advanceBtnText}>
            {stepIdx >= tool.steps.length - 1 ? 'Finish' : 'Got it →'}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ─── TOOL CARD ────────────────────────────────────────────────────────────────

function ToolCard({
  tool,
  onLaunch,
}: {
  tool: QuickTool;
  onLaunch: (tool: QuickTool) => void;
}) {
  const durationLabels: Record<DurationKey, string> = { '30s': '30 sec', '60s': '1 min', '2min': '2 min' };

  return (
    <Pressable
      style={({ pressed }) => [
        cardStyles.card,
        pressed && { opacity: 0.82, transform: [{ scale: 0.99 }] },
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        onLaunch(tool);
      }}
    >
      <View style={[cardStyles.iconWrap, { backgroundColor: tool.color + '18' }]}>
        <Ionicons name={tool.icon as any} size={22} color={tool.color} />
      </View>
      <View style={cardStyles.info}>
        <View style={cardStyles.titleRow}>
          <Text style={cardStyles.name}>{tool.name}</Text>
          {tool.mode === 'print_card' && (
            <View style={cardStyles.printBadge}>
              <Ionicons name="print" size={9} color={Colors.textTertiary} />
              <Text style={cardStyles.printBadgeText}>PRINT</Text>
            </View>
          )}
        </View>
        <Text style={cardStyles.tagline} numberOfLines={1}>{tool.tagline}</Text>
        <Text style={[cardStyles.duration, { color: tool.color }]}>{durationLabels[tool.duration]}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
    </Pressable>
  );
}

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ToolShelfModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { athleteState } = useAthlete();
  const [activeTool, setActiveTool] = useState<QuickTool | null>(null);
  const [toolView, setToolView] = useState<'runner' | 'print' | null>(null);
  const [activeCategory, setActiveCategory] = useState<'suggested' | 'all'>('suggested');

  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function handleClose() {
    setActiveTool(null);
    setToolView(null);
    onClose();
  }

  function handleLaunch(tool: QuickTool) {
    setActiveTool(tool);
    setToolView(tool.mode === 'print_card' ? 'print' : 'runner');
  }

  function handleBackToList() {
    setActiveTool(null);
    setToolView(null);
  }

  const role = athleteState?.primary_role ?? 'universal';
  const phase = athleteState?.season_phase ?? 'in_season';
  const suggested = getSurfacedTools(role, phase);
  const displayedTools = activeCategory === 'suggested' ? suggested.slice(0, 6) : TOOLS;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[modalStyles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          modalStyles.drawer,
          { paddingBottom: insets.bottom + Spacing.lg },
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={modalStyles.handle} />

        {activeTool && toolView ? (
          // ── Active tool view ────────────────────────────────────────────
          <>
            {/* Tool header */}
            <View style={modalStyles.toolHeader}>
              <Pressable onPress={handleBackToList} hitSlop={12} style={modalStyles.backBtn}>
                <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
              </Pressable>
              <View style={[modalStyles.toolIconWrap, { backgroundColor: activeTool.color + '18' }]}>
                <Ionicons name={activeTool.icon as any} size={16} color={activeTool.color} />
              </View>
              <Text style={modalStyles.toolHeaderName}>{activeTool.name}</Text>
              <Pressable onPress={handleClose} hitSlop={12} style={modalStyles.closeBtn}>
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={modalStyles.toolScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {toolView === 'print' ? (
                <PrintCardView tool={activeTool} onClose={handleBackToList} />
              ) : (
                <ToolRunner tool={activeTool} onFinish={handleClose} />
              )}
            </ScrollView>
          </>
        ) : (
          // ── Tool list ───────────────────────────────────────────────────
          <>
            <View style={modalStyles.header}>
              <View>
                <Text style={modalStyles.title}>TOOL SHELF</Text>
                <Text style={modalStyles.subtitle}>Quick reps. Any time. Any situation.</Text>
              </View>
              <Pressable onPress={handleClose} hitSlop={12} style={modalStyles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Category tabs */}
            <View style={modalStyles.catRow}>
              <Pressable
                style={[modalStyles.catTab, activeCategory === 'suggested' && modalStyles.catTabActive]}
                onPress={() => setActiveCategory('suggested')}
              >
                <Text style={[modalStyles.catLabel, activeCategory === 'suggested' && modalStyles.catLabelActive]}>
                  SUGGESTED FOR YOU
                </Text>
              </Pressable>
              <Pressable
                style={[modalStyles.catTab, activeCategory === 'all' && modalStyles.catTabActive]}
                onPress={() => setActiveCategory('all')}
              >
                <Text style={[modalStyles.catLabel, activeCategory === 'all' && modalStyles.catLabelActive]}>
                  ALL TOOLS
                </Text>
              </Pressable>
            </View>

            {/* Print card notice */}
            <View style={modalStyles.printNotice}>
              <Ionicons name="print-outline" size={13} color={Colors.textTertiary} />
              <Text style={modalStyles.printNoticeText}>
                PRINT tools generate a notecard — screenshot and keep in your bat bag for in-game use.
              </Text>
            </View>

            <ScrollView
              contentContainerStyle={modalStyles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {displayedTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onLaunch={handleLaunch} />
              ))}
            </ScrollView>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  drawer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: Colors.border,
    maxHeight: '88%',
    minHeight: '55%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 1 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  catRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.sm },
  catTab: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catTabActive: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryMuted },
  catLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 0.8 },
  catLabelActive: { color: Colors.primary },
  printNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  printNoticeText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, flex: 1, lineHeight: 15 },
  listContent: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.xl },

  toolHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  toolIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolHeaderName: { flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  toolScrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  iconWrap: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, flex: 1 },
  printBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.surface, borderRadius: Radius.pill,
    paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  printBadgeText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 0.5 },
  tagline: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  duration: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
});

const runnerStyles = StyleSheet.create({
  container: { gap: Spacing.xl, alignItems: 'center' },
  counter: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary, letterSpacing: 1, alignSelf: 'flex-start' },
  cuePill: {
    borderRadius: Radius.lg, borderWidth: 1.5,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cueWord: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: 2 },
  instruction: { fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, lineHeight: 26, textAlign: 'center' },
  timerWrap: { alignItems: 'center', gap: Spacing.sm },
  timerRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  timerNum: { fontSize: 32, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  timerLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  timerHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  timerRunning: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary, letterSpacing: 1 },
  timerComplete: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1 },
  advanceBtn: { borderRadius: Radius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, alignItems: 'center', width: '100%' },
  advanceBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.background },
  doneContainer: { gap: Spacing.lg, alignItems: 'center', paddingVertical: Spacing.xl },
  doneIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  doneSub: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, width: '100%', alignItems: 'center' },
  doneBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.background },
});

const printStyles = StyleSheet.create({
  container: { gap: Spacing.lg },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  cardHeader: { padding: Spacing.lg, gap: 4 },
  cardHeaderLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1.5 },
  cardTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  cardWhen: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 17, marginTop: 4 },
  cardDivider: { height: 1, backgroundColor: Colors.border },
  stepsList: { padding: Spacing.lg, gap: Spacing.md },
  stepRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  stepNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primaryMuted, borderWidth: 1, borderColor: Colors.primaryBorder,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  stepNumText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.primary },
  stepContent: { flex: 1, gap: 2 },
  stepCue: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.8 },
  stepInstruction: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textPrimary, lineHeight: 18 },
  cueStrip: { padding: Spacing.lg, gap: 4, backgroundColor: Colors.primaryMuted },
  cueStripLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1.2 },
  cueStripText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 1 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: Radius.lg, paddingVertical: Spacing.lg,
  },
  shareBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.background },
  printHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  backBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  backBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
});
