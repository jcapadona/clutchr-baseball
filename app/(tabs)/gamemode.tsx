import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Bucket = 'pregame' | 'ingame' | 'postgame';
type RoleKey = 'pitcher' | 'catcher' | 'infielder' | 'outfielder';

interface GameTool {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  bucket: Bucket;
  roles: RoleKey[] | 'all';
  mode: 'interactive' | 'print_card';
  duration: string;
  steps: { cue: string; instruction: string; timer?: number }[];
  printCue: string;
  whenToUse: string;
}

// ─── ALL TOOLS ────────────────────────────────────────────────────────────────

const GAME_TOOLS: GameTool[] = [

  // ── PRE-GAME — phone OK ───────────────────────────────────────────────────
  {
    id: 'pregame_prime',
    name: 'Pregame Prime',
    tagline: 'Lock in before first pitch.',
    icon: 'sunny',
    color: Colors.primary,
    bucket: 'pregame',
    roles: 'all',
    mode: 'interactive',
    duration: '3 min',
    whenToUse: 'Before warmups. In the dugout or locker room before the game.',
    steps: [
      { cue: 'CLEAR THE NOISE', instruction: 'Three slow breaths. Whatever happened today stays here. The game starts fresh.', timer: 18 },
      { cue: 'SET YOUR INTENTION', instruction: 'One word for today. "Attack." "Trust it." "Compete." Say it twice. That is your anchor.' },
      { cue: 'SEE YOUR FIRST REP', instruction: 'Visualize your first rep going exactly right. First pitch a strike. First at-bat, you drive it. First ground ball, routine play clean throw. See it before it happens.' },
      { cue: 'WHAT YOU CONTROL', instruction: 'Three things you fully control today: your effort, your routine, and your response to failure. The scoreboard is not on the list.' },
      { cue: 'STEP ON READY', instruction: 'Walk onto that field like you have been here before. Because you have done the work. Own it.' },
    ],
    printCue: 'BREATHE · INTENTION · SEE IT · COMPETE',
  },
  {
    id: 'first_ab_lockin',
    name: 'First AB Lock-In',
    tagline: 'The at-bat starts before you step in the box.',
    icon: 'eye',
    color: Colors.info,
    bucket: 'pregame',
    roles: ['hitter'],
    mode: 'interactive',
    duration: '2 min',
    whenToUse: 'Before first pitch. On-deck or in the dugout.',
    steps: [
      { cue: 'FIND HIS RELEASE', instruction: 'You saw him warm up. Where does the ball come out? Lock your eyes on that window. Every pitch starts there.' },
      { cue: 'READ HIS TEMPO', instruction: 'Watch his windup tempo. Match your breathing to it. You are already timing him before you step in.' },
      { cue: 'SET YOUR ZONE', instruction: 'Where do you want the pitch? Name your damage zone right now. Middle-in. Down-and-away. That is what you are hunting.' },
      { cue: 'ONE WORD', instruction: 'Set your at-bat cue. "See it early." "Short and quick." "Hunt middle." That word comes with you to the plate.' },
    ],
    printCue: 'FIND RELEASE · YOUR ZONE · ONE WORD',
  },
  {
    id: 'pre_bullpen',
    name: 'Pre-Bullpen Lock-In',
    tagline: 'Mental rep before the physical reps.',
    icon: 'baseball',
    color: Colors.purple,
    bucket: 'pregame',
    roles: ['pitcher'],
    mode: 'interactive',
    duration: '2 min',
    whenToUse: 'Before your bullpen warmup. Non-negotiable.',
    steps: [
      { cue: 'CENTER', instruction: 'Three breaths. Clear everything except what you are about to do.', timer: 18 },
      { cue: 'GRIP LIST', instruction: 'Run your pitches in your head: fastball grip, off-speed grip, breaking ball grip. Feel each one.' },
      { cue: 'FIVE TARGETS', instruction: 'Visualize your first five throw targets. Down away. Back foot. Up at the letters. Middle. See the glove.' },
      { cue: 'TEMPO CUE', instruction: 'Set your tempo cue for today. "Fast and loose." "Attack early." "Trust the stuff." Say it twice.' },
      { cue: 'CLAP AND GO', instruction: 'One clap of the glove. Walk to the mound like you own it. You are ready.' },
    ],
    printCue: 'BREATHE · GRIPS · TARGETS · TEMPO · GO',
  },
  {
    id: 'nerves_to_attack',
    name: 'Nerves to Attack',
    tagline: 'Rename the feeling. Change the game.',
    icon: 'pulse',
    color: Colors.warning,
    bucket: 'pregame',
    roles: 'all',
    mode: 'interactive',
    duration: '2 min',
    whenToUse: 'When you feel pregame anxiety or tightness.',
    steps: [
      { cue: 'FEEL IT', instruction: 'Notice where it lives. Chest tight? Stomach? Hands? Identify it. You cannot manage what you have not noticed.' },
      { cue: 'RENAME IT', instruction: 'That feeling is not fear. That is your body preparing to compete. Heart rate up, focus narrowing — that is called ready.' },
      { cue: 'BREATHE INTO IT', instruction: 'Breathe into the tightness. One slow breath directly into that spot.', timer: 8 },
      { cue: 'CHANNEL IT', instruction: 'Every great player you respect has felt exactly this. They used it. Say it: "I am not nervous. I am ready."' },
      { cue: 'GO COMPETE', instruction: 'Step onto the field with that energy. Not despite it. Because of it.' },
    ],
    printCue: 'FEEL IT · RENAME IT · BREATHE · GO',
  },

  // ── IN-GAME — print cards only, no phone on field ────────────────────────
  {
    id: 'ingame_pitch_reset',
    name: 'Between-Pitch Reset',
    tagline: 'Step back. Breathe. Pick it. Go.',
    icon: 'refresh-circle',
    color: Colors.purple,
    bucket: 'ingame',
    roles: ['pitcher'],
    mode: 'print_card',
    duration: '15 sec',
    whenToUse: 'Between every pitch. After walks, errors, or when you feel tempo slipping.',
    steps: [
      { cue: 'STEP BACK', instruction: 'Step behind the rubber. Physical separation from the last pitch.' },
      { cue: 'ONE BREATH', instruction: 'Exhale first. Then slow inhale. Nervous system reset.' },
      { cue: 'GRIP CHECK', instruction: 'Find your seams. Reference point locked.' },
      { cue: 'TEMPO CUE', instruction: '"Work fast. Attack zone." Say it quietly.' },
      { cue: 'NOD. GO.', instruction: 'Get your sign. Commit. Deliver with conviction.' },
    ],
    printCue: 'STEP BACK · BREATHE · GRIP · NOD · GO',
  },
  {
    id: 'ingame_pre_ab',
    name: 'Pre-AB Routine',
    tagline: 'Same process every at-bat. Every time.',
    icon: 'time',
    color: Colors.warning,
    bucket: 'ingame',
    roles: ['hitter'],
    mode: 'print_card',
    duration: '30 sec',
    whenToUse: 'In the on-deck circle before every at-bat.',
    steps: [
      { cue: 'WATCH HIM', instruction: 'Track his release point from the on-deck circle.' },
      { cue: 'TIME IT', instruction: 'Two to three swings timed to his arm speed.' },
      { cue: 'SET YOUR ZONE', instruction: 'Name your damage zone. Know it before you step in.' },
      { cue: 'CUE WORD', instruction: 'Say your approach cue: "See it early." "Hunt middle."' },
      { cue: 'STEP IN', instruction: 'Walk in like you belong. Because you do.' },
    ],
    printCue: 'WATCH · TIME IT · ZONE · CUE · STEP IN',
  },
  {
    id: 'ingame_post_strikeout',
    name: 'Post-Strikeout Flush',
    tagline: 'Short memory. Same player. Next time.',
    icon: 'refresh',
    color: Colors.warning,
    bucket: 'ingame',
    roles: ['hitter'],
    mode: 'print_card',
    duration: '15 sec',
    whenToUse: 'Immediately after striking out. The walk back is your reset window.',
    steps: [
      { cue: 'EXHALE', instruction: 'Controlled breath leaving the box. Start the flush here.' },
      { cue: 'CHIN LEVEL', instruction: 'Not up, not down. Elite body language.' },
      { cue: 'PUT IT AWAY', instruction: 'Bat away cleanly. Not with anger.' },
      { cue: 'WATCH HIM', instruction: 'Sit where you can see the pitcher. Study him.' },
      { cue: 'NEXT TIME', instruction: 'Clean slate. You already know what to do differently.' },
    ],
    printCue: 'EXHALE · CHIN UP · WATCH · NEXT TIME',
  },
  {
    id: 'ingame_error_reset',
    name: 'After-Error Reset',
    tagline: 'Glove pop. Next play. Same player.',
    icon: 'shield',
    color: Colors.danger,
    bucket: 'ingame',
    roles: ['infielder', 'outfielder'],
    mode: 'print_card',
    duration: '15 sec',
    whenToUse: 'Immediately after an error or misplay.',
    steps: [
      { cue: 'GLOVE POP', instruction: 'One sharp clap. Your physical flush signal.' },
      { cue: 'SELF-TALK', instruction: '"Flush it. Next play." Say it quietly.' },
      { cue: 'GET MOVING', instruction: 'Walk, shuffle, jog — break the mental freeze.' },
      { cue: 'NOD UP', instruction: 'Quick nod to your pitcher: "I got the next one."' },
      { cue: 'READY POSITION', instruction: 'Back in position. Next pitch is pitch one.' },
    ],
    printCue: 'GLOVE POP · NEXT PLAY · READY',
  },
  {
    id: 'ingame_two_strike',
    name: '2-Strike Survival',
    tagline: 'Two strikes is not out. Fight.',
    icon: 'alert-circle',
    color: Colors.danger,
    bucket: 'ingame',
    roles: ['hitter'],
    mode: 'print_card',
    duration: '10 sec',
    whenToUse: 'Before stepping back in at two strikes.',
    steps: [
      { cue: 'CHOKE UP', instruction: 'One inch on the handle. Quicker hands.' },
      { cue: 'OPEN UP', instruction: 'Slightly open stance. See more of the plate.' },
      { cue: 'GO DEEPER', instruction: 'Let the ball travel. Trust your hands.' },
      { cue: 'EXPAND ZONE', instruction: 'Anything near the plate gets a short swing.' },
      { cue: 'COMPETE', instruction: 'One job: make contact. Extend the at-bat.' },
    ],
    printCue: 'CHOKE UP · GO DEEP · EXPAND · COMPETE',
  },
  {
    id: 'ingame_catcher_visit',
    name: 'Catcher Mound Visit',
    tagline: 'Slow walk. One cue. Walk back confident.',
    icon: 'megaphone',
    color: Colors.info,
    bucket: 'ingame',
    roles: ['catcher'],
    mode: 'print_card',
    duration: '30 sec',
    whenToUse: 'When your pitcher is struggling. Before a mound visit.',
    steps: [
      { cue: 'SLOW WALK', instruction: 'Your pace sets the energy. Walk slowly to the mound.' },
      { cue: 'EYE CONTACT', instruction: 'Make eye contact when you arrive. Just present. "I am here."' },
      { cue: 'ONE CUE', instruction: '"Trust the fastball." "Attack the zone." Pick one only.' },
      { cue: 'THE PLAN', instruction: 'Remind him of what is working. Short. Direct. Confident.' },
      { cue: 'WALK BACK', instruction: 'Leave with confidence. He is watching you go.' },
    ],
    printCue: 'SLOW WALK · ONE CUE · I GOT YOU',
  },

  // ── POST-GAME — phone OK ──────────────────────────────────────────────────
  {
    id: 'postgame_debrief',
    name: 'Postgame Debrief',
    tagline: 'Process the game. Keep the lesson. Lose the result.',
    icon: 'clipboard',
    color: Colors.primary,
    bucket: 'postgame',
    roles: 'all',
    mode: 'interactive',
    duration: '5 min',
    whenToUse: 'After the final out. Before you leave the field.',
    steps: [
      { cue: 'ONE WIN', instruction: 'Name one thing you did well today. One play, pitch, or decision. Lock it in. That goes with you.' },
      { cue: 'ONE LESSON', instruction: 'Name one thing you would do differently — as a target, not criticism. "Next time I will..." That is data.' },
      { cue: 'RELEASE THE RESULT', instruction: 'The scoreboard does not follow you home. Say it: "I competed. The rest is baseball." The result stays on this field.' },
      { cue: 'RECOVERY PLAN', instruction: 'Name your recovery tonight: hydration, food, sleep. Your body needs a plan. Give it one.' },
      { cue: 'CLEAN SLATE', instruction: 'Tomorrow you show up as the same player with better information. That is how careers are built.' },
    ],
    printCue: 'ONE WIN · ONE LESSON · RELEASE IT · CLEAN SLATE',
  },
  {
    id: 'postgame_tough_night',
    name: 'Tough Night Reset',
    tagline: 'Reframe the rough stretch. Keep your standard.',
    icon: 'moon',
    color: Colors.purple,
    bucket: 'postgame',
    roles: 'all',
    mode: 'interactive',
    duration: '4 min',
    whenToUse: 'After a rough game or a night that is hard to shake.',
    steps: [
      { cue: 'SAY IT', instruction: 'Rough night. It happened. Say it without trying to fix it yet: "That was rough."' },
      { cue: 'SAME PLAYER', instruction: 'One bad game does not change who you are. Name three things you know about yourself as a player that did not change tonight.' },
      { cue: 'REFRAME', instruction: 'Rewrite the story. Not "I was terrible" — but "I competed, the results did not go my way, and I know what I want to do differently."' },
      { cue: 'YOUR STANDARD', instruction: 'What is your standard as a player? Say it: "I am a player who..." That standard does not change based on one scoreboard.' },
      { cue: 'CLOSE IT OUT', instruction: 'The game is closed. Same player tomorrow. Better information. Same standard. Sleep on it.' },
    ],
    printCue: 'SAY IT · SAME PLAYER · REFRAME · CLOSE IT',
  },
  {
    id: 'postgame_arm_recovery',
    name: 'Arm Recovery',
    tagline: 'The arm that lasts is the arm that recovers.',
    icon: 'fitness',
    color: Colors.info,
    bucket: 'postgame',
    roles: ['pitcher'],
    mode: 'interactive',
    duration: '6 min',
    whenToUse: 'After every throwing session. Non-negotiable.',
    steps: [
      { cue: 'ARM CIRCLES', instruction: '10 forward, 10 backward. Both arms. Start small, get bigger.', timer: 30 },
      { cue: 'SLEEPER STRETCH', instruction: 'Lie on your throwing side. Push forearm toward the ground gently. 30 seconds each side.', timer: 60 },
      { cue: 'CROSS-BODY', instruction: 'Pull throwing arm across your chest. Feel the posterior shoulder. Hold 30 seconds.', timer: 30 },
      { cue: 'FOAM ROLL', instruction: 'Roll your lat and posterior shoulder. 60 seconds per side. The lat is attached to your arm — take care of it.', timer: 120 },
      { cue: 'HYDRATE', instruction: '16-20oz of water within the next hour. Recovery happens at the cellular level. Feed it.' },
    ],
    printCue: 'CIRCLES · SLEEPER · CROSS-BODY · ROLL · HYDRATE',
  },
  {
    id: 'postgame_position_recovery',
    name: 'Post-Game Recovery',
    tagline: 'Take care of your body tonight.',
    icon: 'medkit',
    color: Colors.info,
    bucket: 'postgame',
    roles: ['hitter', 'catcher', 'infielder', 'outfielder'],
    mode: 'interactive',
    duration: '3 min',
    whenToUse: 'After every game. Your non-negotiable recovery routine.',
    steps: [
      { cue: 'FLUSH IT OUT', instruction: 'Light jog or walk for 2-3 minutes. Get the blood moving. Most underrated recovery tool.', timer: 60 },
      { cue: 'HIP FLEXORS', instruction: 'Kneeling hip flexor stretch. 30 seconds each side. Baseball destroys hip flexors.', timer: 60 },
      { cue: 'HAMSTRINGS', instruction: 'Standing hamstring stretch. 30 seconds each side. If you dove or slid today — give extra time here.', timer: 60 },
      { cue: 'HYDRATE AND EAT', instruction: 'Water and protein within 30 minutes of the final out. Your muscles are open to recovery right now.' },
      { cue: 'SLEEP PLAN', instruction: 'You need 8 hours. Name what time you need to be asleep tonight.' },
    ],
    printCue: 'FLUSH · STRETCH · HYDRATE · SLEEP',
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getTools(bucket: Bucket, role: RoleKey): GameTool[] {
  return GAME_TOOLS.filter((t) => {
    if (t.bucket !== bucket) return false;
    if (t.roles === 'all') return true;
    return (t.roles as RoleKey[]).includes(role);
  });
}

// ─── BUCKET META ─────────────────────────────────────────────────────────────

const BUCKET_META: Record<Bucket, {
  icon: string; color: string; label: string;
  headline: string; subtext: string; phoneOk: boolean;
}> = {
  pregame: {
    icon: 'sunny', color: Colors.primary,
    label: 'PRE-GAME',
    headline: 'Phone OK before first pitch.',
    subtext: 'Run these in the dugout or locker room before warmups.',
    phoneOk: true,
  },
  ingame: {
    icon: 'baseball', color: Colors.warning,
    label: 'IN-GAME',
    headline: 'No phone on the field.',
    subtext: 'Generate your print card. Screenshot it. Fold to index card size. Keep in your back pocket or bat bag.',
    phoneOk: false,
  },
  postgame: {
    icon: 'moon', color: Colors.purple,
    label: 'POST-GAME',
    headline: 'Phone OK after the final out.',
    subtext: 'Process the game, recover the body, reset for tomorrow.',
    phoneOk: true,
  },
};

// ─── PRINT CARD SCREEN ────────────────────────────────────────────────────────

function PrintCardScreen({ tool, onBack }: { tool: GameTool; onBack: () => void }) {
  async function handleShare() {
    const steps = tool.steps
      .map((s, i) => `${i + 1}. ${s.cue}  —  ${s.instruction}`)
      .join('\n');
    const text = [
      '[ CLUTCHR BASEBALL — IN-GAME CARD ]',
      tool.name.toUpperCase(),
      '',
      `WHEN: ${tool.whenToUse}`,
      `TIME: ${tool.duration}`,
      '',
      steps,
      '',
      '─────────────────',
      `CUE:  ${tool.printCue}`,
      '─────────────────',
      'clutchr.app',
    ].join('\n');
    try { await Share.share({ message: text, title: tool.name }); } catch {}
  }

  return (
    <View style={pStyles.container}>
      <Pressable style={pStyles.backRow} onPress={onBack}>
        <Ionicons name="arrow-back" size={15} color={Colors.primary} />
        <Text style={pStyles.backText}>Back to Game Mode</Text>
      </Pressable>

      <View style={pStyles.warningBanner}>
        <Ionicons name="phone-portrait-outline" size={15} color={Colors.warning} />
        <Text style={pStyles.warningText}>
          In-game tool — coaches do not allow phones on the field. Screenshot or print this card and keep it in your bat bag.
        </Text>
      </View>

      {/* Card */}
      <View style={pStyles.card}>
        <View style={[pStyles.cardHeader, { borderLeftColor: tool.color, borderLeftWidth: 4 }]}>
          <View style={[pStyles.cardIconWrap, { backgroundColor: tool.color + '18' }]}>
            <Ionicons name={tool.icon as any} size={18} color={tool.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pStyles.cardEyebrow}>CLUTCHR BASEBALL · IN-GAME</Text>
            <Text style={pStyles.cardTitle}>{tool.name}</Text>
            <Text style={pStyles.cardMeta}>{tool.duration} · {tool.whenToUse}</Text>
          </View>
        </View>

        <View style={pStyles.divider} />

        <View style={pStyles.stepsList}>
          {tool.steps.map((step, i) => (
            <View key={i} style={pStyles.stepRow}>
              <View style={[pStyles.stepDot, { borderColor: tool.color + '60', backgroundColor: tool.color + '12' }]}>
                <Text style={[pStyles.stepDotNum, { color: tool.color }]}>{i + 1}</Text>
              </View>
              <View style={pStyles.stepText}>
                <Text style={[pStyles.stepCue, { color: tool.color }]}>{step.cue}</Text>
                <Text style={pStyles.stepInstr}>{step.instruction}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={pStyles.divider} />

        <View style={[pStyles.cueBar, { backgroundColor: tool.color + '12' }]}>
          <Text style={pStyles.cueBarLabel}>YOUR CUE SEQUENCE</Text>
          <Text style={[pStyles.cueBarText, { color: tool.color }]}>{tool.printCue}</Text>
        </View>
      </View>

      <Pressable style={[pStyles.shareBtn, { backgroundColor: tool.color }]} onPress={handleShare}>
        <Ionicons name="share-outline" size={16} color="#fff" />
        <Text style={pStyles.shareBtnText}>Share / Screenshot / Print</Text>
      </Pressable>

      <Text style={pStyles.hint}>
        Fold to index card size (3×5) · Keep in back pocket or bat bag · No phone needed in the game
      </Text>
    </View>
  );
}

// ─── INTERACTIVE RUNNER ───────────────────────────────────────────────────────

function ToolRunner({ tool, onFinish }: { tool: GameTool; onFinish: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [timerSec, setTimerSec] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStep = tool.steps[stepIdx];

  useEffect(() => {
    if (currentStep?.timer) {
      setTimerSec(currentStep.timer);
      setTimerRunning(false);
      setTimerDone(false);
    } else {
      setTimerSec(null);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [stepIdx]);

  function startTimer() {
    if (!currentStep.timer) return;
    setTimerRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    intervalRef.current = setInterval(() => {
      setTimerSec((prev) => {
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  if (done) {
    return (
      <View style={rStyles.doneWrap}>
        <View style={[rStyles.doneIcon, { backgroundColor: tool.color }]}>
          <Ionicons name="checkmark" size={30} color="#fff" />
        </View>
        <Text style={rStyles.doneTitle}>Done.</Text>
        <Text style={rStyles.doneSub}>Rep complete. Back to work.</Text>
        <Pressable style={[rStyles.btn, { backgroundColor: tool.color }]} onPress={onFinish}>
          <Text style={rStyles.btnText}>Close →</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View style={[rStyles.container, { opacity: fadeAnim }]}>
      <Text style={rStyles.counter}>{stepIdx + 1} / {tool.steps.length}</Text>

      <View style={[rStyles.cuePill, { borderColor: tool.color + '50', backgroundColor: tool.color + '12' }]}>
        <Text style={[rStyles.cueWord, { color: tool.color }]}>{currentStep.cue}</Text>
      </View>

      <Text style={rStyles.instruction}>{currentStep.instruction}</Text>

      {currentStep?.timer && timerSec !== null && (
        <View style={rStyles.timerWrap}>
          <View style={[rStyles.timerRing, { borderColor: timerRunning ? tool.color : Colors.border }]}>
            <Text style={[rStyles.timerNum, timerRunning && { color: tool.color }]}>{timerSec}</Text>
            <Text style={rStyles.timerLabel}>sec</Text>
          </View>
          {timerRunning && <Text style={[rStyles.timerStatus, { color: tool.color }]}>Hold it.</Text>}
          {timerDone && <Text style={[rStyles.timerStatus, { color: tool.color }]}>Time.</Text>}
        </View>
      )}

      {currentStep?.timer ? (
        !timerRunning && !timerDone ? (
          <Pressable style={[rStyles.btn, { backgroundColor: tool.color }]} onPress={startTimer}>
            <Text style={rStyles.btnText}>Go →</Text>
          </Pressable>
        ) : timerDone ? (
          <Pressable style={[rStyles.btn, { backgroundColor: tool.color }]} onPress={advance}>
            <Text style={rStyles.btnText}>{stepIdx >= tool.steps.length - 1 ? 'Finish' : 'Next →'}</Text>
          </Pressable>
        ) : null
      ) : (
        <Pressable style={[rStyles.btn, { backgroundColor: tool.color }]} onPress={advance}>
          <Text style={rStyles.btnText}>{stepIdx >= tool.steps.length - 1 ? 'Finish' : 'Got it →'}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ─── TOOL CARD ────────────────────────────────────────────────────────────────

function ToolCard({ tool, onPress }: { tool: GameTool; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        cStyles.card,
        tool.mode === 'print_card' && cStyles.printCard,
        pressed && { opacity: 0.82, transform: [{ scale: 0.99 }] },
      ]}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
    >
      <View style={[cStyles.icon, { backgroundColor: tool.color + '18' }]}>
        <Ionicons name={tool.icon as any} size={22} color={tool.color} />
      </View>
      <View style={cStyles.info}>
        <View style={cStyles.titleRow}>
          <Text style={cStyles.name}>{tool.name}</Text>
          {tool.mode === 'print_card' ? (
            <View style={cStyles.printBadge}>
              <Ionicons name="print" size={9} color={Colors.warning} />
              <Text style={[cStyles.badgeText, { color: Colors.warning }]}>PRINT CARD</Text>
            </View>
          ) : (
            <View style={cStyles.phoneBadge}>
              <Ionicons name="phone-portrait" size={9} color={Colors.primary} />
              <Text style={[cStyles.badgeText, { color: Colors.primary }]}>PHONE</Text>
            </View>
          )}
        </View>
        <Text style={cStyles.tagline} numberOfLines={1}>{tool.tagline}</Text>
        <Text style={[cStyles.duration, { color: tool.color }]}>{tool.duration}</Text>
      </View>
      <Ionicons
        name={tool.mode === 'print_card' ? 'print-outline' : 'play-circle'}
        size={24}
        color={tool.color}
      />
    </Pressable>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function GameModeScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState } = useAthlete();
  const [bucket, setBucket] = useState<Bucket>('pregame');
  const [activeTool, setActiveTool] = useState<GameTool | null>(null);
  const [view, setView] = useState<'runner' | 'print' | null>(null);

  const role = (athleteState?.primary_role ?? 'infielder') as RoleKey;
  const tools = getTools(bucket, role);
  const meta = BUCKET_META[bucket];

  function openTool(tool: GameTool) {
    setActiveTool(tool);
    setView(tool.mode === 'print_card' ? 'print' : 'runner');
  }

  function closeTool() {
    setActiveTool(null);
    setView(null);
  }

  // Active tool view
  if (activeTool && view) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.toolHeader}>
          <Pressable onPress={closeTool} hitSlop={12} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
          </Pressable>
          <View style={[s.toolIcon, { backgroundColor: activeTool.color + '18' }]}>
            <Ionicons name={activeTool.icon as any} size={14} color={activeTool.color} />
          </View>
          <Text style={s.toolHeaderName}>{activeTool.name}</Text>
          {activeTool.mode === 'print_card' ? (
            <View style={s.printTag}>
              <Ionicons name="print" size={10} color={Colors.warning} />
              <Text style={s.printTagText}>PRINT CARD</Text>
            </View>
          ) : (
            <Text style={s.toolDuration}>{activeTool.duration}</Text>
          )}
        </View>
        <ScrollView
          contentContainerStyle={[s.toolScroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {view === 'print'
            ? <PrintCardScreen tool={activeTool} onBack={closeTool} />
            : <ToolRunner tool={activeTool} onFinish={closeTool} />
          }
        </ScrollView>
      </View>
    );
  }

  // List view
  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>GAME MODE</Text>
        <Text style={s.subtitle}>
          {athleteState?.first_name ? `${athleteState.first_name} · ` : ''}
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Text>
      </View>

      {/* Bucket tabs */}
      <View style={s.bucketRow}>
        {(Object.keys(BUCKET_META) as Bucket[]).map((b) => {
          const m = BUCKET_META[b];
          const active = bucket === b;
          return (
            <Pressable
              key={b}
              style={[
                s.bucketTab,
                active && { borderColor: m.color + '60', backgroundColor: m.color + '12' },
              ]}
              onPress={() => { setBucket(b); closeTool(); }}
            >
              <Ionicons name={m.icon as any} size={13} color={active ? m.color : Colors.textTertiary} />
              <Text style={[s.bucketLabel, active && { color: m.color }]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Context banner */}
      <View style={[
        s.banner,
        meta.phoneOk
          ? { borderColor: meta.color + '30', backgroundColor: meta.color + '08' }
          : { borderColor: Colors.warning + '40', backgroundColor: Colors.warning + '08' },
      ]}>
        <Ionicons
          name={meta.phoneOk ? 'phone-portrait' : 'phone-portrait-outline'}
          size={14}
          color={meta.phoneOk ? meta.color : Colors.warning}
        />
        <View style={{ flex: 1 }}>
          <Text style={[s.bannerHead, { color: meta.phoneOk ? meta.color : Colors.warning }]}>
            {meta.headline}
          </Text>
          <Text style={s.bannerSub}>{meta.subtext}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {tools.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="baseball-outline" size={40} color={Colors.textTertiary} />
            <Text style={s.emptyTitle}>No tools for {role}s in this section yet.</Text>
            <Text style={s.emptySub}>More coming soon.</Text>
          </View>
        ) : (
          tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onPress={() => openTool(tool)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: 3 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 1 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  bucketRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.sm },
  bucketTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  bucketLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 0.8 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginHorizontal: Spacing.xl, marginBottom: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1 },
  bannerHead: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  bannerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 16, marginTop: 2 },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  empty: { paddingVertical: 60, alignItems: 'center', gap: Spacing.md },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textAlign: 'center' },
  emptySub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  toolHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  toolIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolHeaderName: { flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  printTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.warningMuted, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: Colors.warning + '40' },
  printTagText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.warning, letterSpacing: 0.5 },
  toolDuration: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  toolScroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
});

const cStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  printCard: { borderStyle: 'dashed', borderColor: Colors.warning + '50', backgroundColor: Colors.warningMuted + '25' },
  icon: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, flex: 1 },
  printBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.warningMuted, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.warning + '40' },
  phoneBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.primaryMuted, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.primaryBorder },
  badgeText: { fontSize: 8, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  tagline: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  duration: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
});

const rStyles = StyleSheet.create({
  container: { gap: Spacing.xl, alignItems: 'center', paddingVertical: Spacing.lg },
  counter: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textTertiary, letterSpacing: 1, alignSelf: 'flex-start' },
  cuePill: { borderRadius: Radius.xl, borderWidth: 2, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, alignItems: 'center', width: '100%' },
  cueWord: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: 2, textAlign: 'center' },
  instruction: { fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, lineHeight: 26, textAlign: 'center' },
  timerWrap: { alignItems: 'center', gap: Spacing.sm },
  timerRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  timerNum: { fontSize: 30, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  timerLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  timerStatus: { fontSize: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  btn: { borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center', width: '100%' },
  btnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  doneWrap: { gap: Spacing.lg, alignItems: 'center', paddingVertical: Spacing.xxl },
  doneIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  doneSub: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  doneBtn: { borderRadius: Radius.lg, paddingVertical: Spacing.lg, width: '100%', alignItems: 'center' },
  doneBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
});

const pStyles = StyleSheet.create({
  container: { gap: Spacing.lg },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.warningMuted, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.warning + '40' },
  warningText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 17 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.lg },
  cardIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardEyebrow: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1.5 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 2 },
  cardMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 3, lineHeight: 16 },
  divider: { height: 1, backgroundColor: Colors.border },
  stepsList: { padding: Spacing.lg, gap: Spacing.md },
  stepRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepDotNum: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  stepText: { flex: 1, gap: 2 },
  stepCue: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  stepInstr: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textPrimary, lineHeight: 18 },
  cueBar: { padding: Spacing.lg, gap: 4 },
  cueBarLabel: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1.5 },
  cueBarText: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.lg, paddingVertical: Spacing.lg },
  shareBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
});
