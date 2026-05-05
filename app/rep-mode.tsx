import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView, ScrollView, Pressable, View, Text, Animated, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAthlete } from '@/context/AthleteContext'
import PitchSequenceChess from '@/components/PitchSequenceChess'
import FieldIQBoard from '@/components/FieldIQBoard'
import StrikeZoneVisualizer from '@/components/StrikeZoneVisualizer'
import ThrowDecisionBoard from '@/components/ThrowDecisionBoard'
import LeverageLadder from '@/components/LeverageLadder'
import { useRef, useState, useEffect } from 'react'

// ─── SCENARIO BANKS ──────────────────────────────────────────────────────────

const PITCH_SEQUENCE_SCENARIOS = [
  {
    data: {
      prompt: "0-2 count. Hitter expanded on slider last AB. Goal: expand with purpose, don't miss middle.",
      mode: 'choose_next_pitch',
      context: { count: '0-2', outs: 1, runners: [], batter_side: 'right' },
      previous_pitches: [{ pitch: '4_seam', location: 'up', result: 'foul' }, { pitch: 'slider', location: 'down_away', result: 'swing_miss' }],
      pitch_options: ['slider', 'changeup', '4_seam', 'curveball'],
      target_options: ['back_foot', 'down_away', 'waste_up', 'middle'],
    },
    responses: { best_combo: { pitch: 'slider', target: 'back_foot' }, acceptable_combos: [{ pitch: 'changeup', target: 'down_away' }] },
    feedback: { correct: 'Back-foot breaker. Purposeful expansion gets chase without a hanger.', acceptable: 'Changeup away can still finish him.', wrong: "Don't waste 0-2 in the middle." }
  },
  {
    data: {
      prompt: "2-0 count. Hitter hunts fastball middle-in. Goal: get back in count without feeding damage zone.",
      mode: 'choose_next_pitch',
      context: { count: '2-0', outs: 2, runners: [], batter_side: 'left' },
      previous_pitches: [{ pitch: '4_seam', location: 'middle', result: 'ball' }, { pitch: 'slider', location: 'down', result: 'ball' }],
      pitch_options: ['2_seam', 'changeup', '4_seam', 'slider'],
      target_options: ['glove_side_knee', 'down_away', 'middle_down', 'middle_in'],
    },
    responses: { best_combo: { pitch: '2_seam', target: 'glove_side_knee' }, acceptable_combos: [{ pitch: 'changeup', target: 'down_away' }] },
    feedback: { correct: 'Competitive strike at the knee. Back in count, low damage.', acceptable: 'Good miss profile away from barrel.', wrong: '2-0 is not a cookie count. Stay out of his lane.' }
  },
  {
    data: {
      prompt: "Runner on 2nd, 2 outs. Hitter late on velocity and sitting off-speed. Goal: end inning with conviction.",
      mode: 'choose_next_pitch',
      context: { count: '1-2', outs: 2, runners: ['2nd'], batter_side: 'right' },
      previous_pitches: [{ pitch: 'changeup', location: 'down', result: 'foul' }],
      pitch_options: ['4_seam', 'slider', 'changeup', 'curveball'],
      target_options: ['up_away', 'down_away', 'back_foot', 'middle'],
    },
    responses: { best_combo: { pitch: '4_seam', target: 'up_away' }, acceptable_combos: [{ pitch: 'slider', target: 'down_away' }] },
    feedback: { correct: 'He is late on velo. Fastball up-away finishes the inning.', acceptable: 'Slider away also tunnels off speed.', wrong: 'Do not feed the middle with R2 in scoring position.' }
  },
  {
    data: {
      prompt: "1-0 count. Left-handed hitter who pulls everything.",
      mode: 'choose_next_pitch',
      context: { count: '1-0', outs: 0, runners: [], batter_side: 'left' },
      previous_pitches: [{ pitch: '4_seam', location: 'up_away', result: 'ball' }],
      pitch_options: ['4_seam', 'cutter', 'changeup', 'curveball'],
      target_options: ['back_foot', 'down_away', 'up_away', 'middle_down'],
    },
    responses: { best_combo: { pitch: 'cutter', target: 'back_foot' }, acceptable_combos: [{ pitch: 'changeup', target: 'down_away' }] },
    feedback: { correct: "Cutter back foot. Jams him. Can't pull that.", acceptable: 'Changeup away changes his timing.', wrong: "He's sitting on something he can pull. Go back foot." }
  },
  {
    data: {
      prompt: "First pitch of at-bat. Right-handed hitter, 0-0 count.",
      mode: 'choose_next_pitch',
      context: { count: '0-0', outs: 1, runners: ['1st'], batter_side: 'right' },
      previous_pitches: [],
      pitch_options: ['4_seam', 'slider', 'changeup', '2_seam'],
      target_options: ['down_away', 'glove_side_knee', 'up_away', 'middle'],
    },
    responses: { best_combo: { pitch: '4_seam', target: 'down_away' }, acceptable_combos: [{ pitch: '2_seam', target: 'glove_side_knee' }] },
    feedback: { correct: 'First pitch fastball away. Attack the zone early.', acceptable: '2-seam low gets you a ground ball. Smart.', wrong: "Don't start with a breaking ball 0-0. Get ahead." }
  },
  {
    data: {
      prompt: "2-0 count. Must throw a strike. Left-handed hitter.",
      mode: 'choose_next_pitch',
      context: { count: '2-0', outs: 2, runners: [], batter_side: 'left' },
      previous_pitches: [{ pitch: '4_seam', location: 'up', result: 'ball' }, { pitch: 'slider', location: 'down', result: 'ball' }],
      pitch_options: ['4_seam', 'slider', 'changeup', 'sinker'],
      target_options: ['down_away', 'middle', 'glove_side_knee', 'middle_down'],
    },
    responses: { best_combo: { pitch: '4_seam', target: 'down_away' }, acceptable_combos: [{ pitch: 'sinker', target: 'glove_side_knee' }] },
    feedback: { correct: 'Fastball away. Competitive strike. Back in the count.', acceptable: 'Sinker for a strike. Works.', wrong: "2-0 you need a strike. Don't miss again." }
  },
  {
    data: {
      prompt: "Runner stealing. 1-2 count. Right-handed hitter.",
      mode: 'choose_next_pitch',
      context: { count: '1-2', outs: 1, runners: ['1st'], batter_side: 'right' },
      previous_pitches: [{ pitch: 'slider', location: 'down_away', result: 'foul' }],
      pitch_options: ['4_seam', 'slider', 'changeup', 'curveball'],
      target_options: ['waste_up', 'back_foot', 'down_away', 'middle_down'],
    },
    responses: { best_combo: { pitch: '4_seam', target: 'waste_up' }, acceptable_combos: [{ pitch: 'slider', target: 'back_foot' }] },
    feedback: { correct: 'Fastball up and out. Quick to plate. Controls the runner.', acceptable: 'Slider back foot. Gets you a whiff.', wrong: "Runner's going. You need to get to the plate fast." }
  },
  {
    data: {
      prompt: "0-1 count. Right-handed hitter who chases sliders.",
      mode: 'choose_next_pitch',
      context: { count: '0-1', outs: 0, runners: ['2nd'], batter_side: 'right' },
      previous_pitches: [{ pitch: '4_seam', location: 'up', result: 'strike' }],
      pitch_options: ['4_seam', 'slider', 'changeup', 'curveball'],
      target_options: ['back_foot', 'down_away', 'waste_up', 'middle_down'],
    },
    responses: { best_combo: { pitch: 'slider', target: 'down_away' }, acceptable_combos: [{ pitch: 'curveball', target: 'middle_down' }] },
    feedback: { correct: "Slider away. He'll chase it. That's your out pitch.", acceptable: 'Curveball down. Makes him adjust.', wrong: 'He chases sliders. Use your best weapon.' }
  },
]

const FIELD_IQ_SCENARIOS = [
  {
    data: { prompt: 'Position: SS. 6th inning, 1 out, runner on 1st, tie game. Ground ball up middle. Decision target?', instruction: 'Read speed + feed for force/turn two.', mode: 'throw_priority', context: { position: 'SS', inning: '6th', outs: 1, runners: ['1st'], score_state: 'tie_game', ball_location: 'up middle' } },
    responses: { correct_target: '2B', acceptable_targets: ['1B'] },
    feedback: { correct: 'Force at 2B first, then turn if feed is clean.', acceptable: 'Take sure out at 1B if no turn chance.', wrong: 'Middle-infield force is priority here.' }
  },
  {
    data: { prompt: 'Position: 3B. 7th inning, runner on 3rd, 1 out. Slow roller/bunt toward line. Decision target?', instruction: 'Less than 2 outs: prevent run first when possible.', mode: 'throw_priority', context: { position: '3B', inning: '7th', outs: 1, runners: ['3rd'], score_state: 'down_1', ball_location: '3B line slow roller' } },
    responses: { correct_target: 'home', acceptable_targets: ['1B'] },
    feedback: { correct: 'Attack and go home if you can cut lead run.', acceptable: 'If no play at plate, take sure out at 1B.', wrong: 'Know game state: lead runner matters most.' }
  },
  {
    data: { prompt: 'Position: RF. 8th inning, runner on 1st, 1 out. Gap ball to right-center. Decision target?', instruction: 'Prevent extra base and stop big inning.', mode: 'throw_priority', context: { position: 'RF', inning: '8th', outs: 1, runners: ['1st'], score_state: 'up_1', ball_location: 'right-center gap' } },
    responses: { correct_target: 'cutoff_2B', acceptable_targets: ['3B'] },
    feedback: { correct: 'Hit cutoff clean to keep batter-runner to two and control lead runner.', acceptable: 'Direct to 3B can work with strong lane.', wrong: 'Wild hero throw can open big inning.' }
  },
]

const STRIKE_ZONE_SCENARIOS = [
  { data: { prompt: 'Count 1-1, runner on 2nd. Hunt lane.', mode: 'hunt_zone' }, responses: { correct_zones: ['down_away'], acceptable_zones: ['middle_away'] }, feedback: { correct: 'Damage lane identified.', wrong: 'Stay off middle-middle.' } },
  { data: { prompt: '2-0 take/attack decision.', mode: 'swing_take' }, responses: { correct_action: 'take', acceptable_actions: ['swing'] }, feedback: { correct: 'Win the count first.', acceptable: 'Only swing if perfect pitch.', wrong: 'No chase in advantage count.' } },
  { data: { prompt: '0-2 protect edge pitch.', mode: 'swing_take' }, responses: { correct_action: 'take', acceptable_actions: ['swing'] }, feedback: { correct: 'Good discipline.', acceptable: 'Battle swing can work.', wrong: 'Don’t expand for pitcher.' } },
]
const THROW_DECISION_SCENARIOS = [
  { data: { prompt: 'SS, 1 out, runner 1st, hard grounder. Where first?', inning: '6th', outs: 1, score_state: 'Tie', runners: '1st', ball_location: 'Up middle', role: 'Shortstop', targets: [{ id: '2B', label: 'Force at 2B', short_label: '2B', quality: 'correct', feedback: 'Start double play.' }, { id: '1B', label: 'Sure out at 1B', short_label: '1B', quality: 'acceptable', feedback: 'Take safe out if needed.' }, { id: 'home', label: 'Throw Home', short_label: 'H', quality: 'poor', feedback: 'No lead-runner threat.' }] }, responses: { correct_id: '2B', acceptable_ids: ['1B'] }, feedback: { correct: 'Middle force first.', acceptable: 'Sure out is acceptable.', poor: 'Wrong priority.' } },
]
const LEVERAGE_LADDER_SCENARIOS = [
  { data: { prompt: 'Rank priorities with R3, <2 outs.', situation: 'Bottom 7, tie game, infield in', instruction: 'Highest priority first.', items: [{ id: 'run_prevention', label: 'Cut run at plate' }, { id: 'clean_feed', label: 'Secure transfer' }, { id: 'speed_throw', label: 'Rush throw' }] }, responses: { correct_order: ['run_prevention', 'clean_feed', 'speed_throw'] }, feedback: { correct: 'Right leverage order.', acceptable: 'Mostly right order.', poor: 'Re-rank by run value.' } },
]

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const TOTAL_REPS = 5

export default function RepModeScreen() {
  const { type } = useLocalSearchParams<{ type: string }>()
  const router = useRouter()

  const [repIndex, setRepIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(false)
  const [done, setDone] = useState(false)
  const [scenarios, setScenarios] = useState<any[]>([])
  const feedbackAnim = useRef(new Animated.Value(0)).current
  const { athleteState, updateAthleteState } = useAthlete()

  useEffect(() => {
    const bank = (type === 'pitch-sequence' || type === 'pitch-iq') ? PITCH_SEQUENCE_SCENARIOS
      : type === 'field-iq' ? FIELD_IQ_SCENARIOS
      : type === 'strike-zone' ? STRIKE_ZONE_SCENARIOS
      : type === 'throw-decision' ? THROW_DECISION_SCENARIOS
      : type === 'leverage-ladder' ? LEVERAGE_LADDER_SCENARIOS
      : []
    const shuffled = [...bank].sort(() => Math.random() - 0.5)
    setScenarios(shuffled.slice(0, TOTAL_REPS))
  }, [type])

  function handleRepComplete(passed: boolean) {
    setLastCorrect(passed)
    if (passed) setScore(s => s + 1)
    setShowFeedback(true)

    Animated.sequence([
      Animated.timing(feedbackAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(feedbackAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowFeedback(false)
      if (repIndex + 1 >= TOTAL_REPS) {
        setDone(true)
        handleSessionComplete(passed ? score + 1 : score)
      } else {
        setRepIndex(i => i + 1)
      }
    })
  }

  async function handleSessionComplete(finalScore: number) {
    const xpEarned = finalScore * 10 + (finalScore === TOTAL_REPS ? 25 : 0)
    await updateAthleteState({ total_xp: (athleteState?.total_xp ?? 0) + xpEarned })
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const currentScenario = scenarios[repIndex]

  const repTypeLabel: Record<string, string> = {
    'pitch-sequence': 'PITCH IQ',
    'pitch-iq': 'PITCH IQ',
    'field-iq': 'FIELD IQ',
    'strike-zone': 'ZONE READ',
    'throw-decision': 'THROW DECISION',
    'leverage-ladder': 'LEVERAGE LADDER',
  }
  const label = repTypeLabel[type ?? ''] ?? 'DRILL'

  if (done) {
    const finalScore = score
    const xpEarned = finalScore * 10 + (finalScore === TOTAL_REPS ? 25 : 0)
    const voltLines = [
      "That's a rep. Stack it.",
      'Clean session. Keep building.',
      "Reps add up. You're building something.",
      "That's the standard. Do it again.",
    ]
    const voltLine = voltLines[Math.floor(Math.random() * voltLines.length)]

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#080810' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Image source={require('../assets/volt bust.png')} style={{ width: 80, height: 80, borderRadius: 10, marginBottom: 20 }} resizeMode="contain" />
          <Text style={{ color: '#22CC5E', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>VOLT</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginBottom: 32 }}>{voltLine}</Text>

          <View style={{ backgroundColor: '#0D0D12', borderRadius: 16, padding: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 24 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>SESSION COMPLETE</Text>
            <Text style={{ color: 'white', fontSize: 48, fontWeight: '900' }}>{finalScore}<Text style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }}>/{TOTAL_REPS}</Text></Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 16 }}>CORRECT</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1A1200', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#FFD60A44' }}>
              <Text style={{ fontSize: 16 }}>⚡</Text>
              <Text style={{ color: '#F5A623', fontSize: 20, fontWeight: '800' }}>+{xpEarned} XP</Text>
            </View>
            {finalScore === TOTAL_REPS && (
              <Text style={{ color: '#FFD60A', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 8 }}>PERFECT REP ✦</Text>
            )}
          </View>

          <Pressable
            onPress={() => { setRepIndex(0); setScore(0); setDone(false); setScenarios([...scenarios].sort(() => Math.random() - 0.5)) }}
            style={{ backgroundColor: '#111', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#333' }}
          >
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Run it again →</Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={{ backgroundColor: '#22CC5E', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center' }}
          >
            <Text style={{ color: '#000', fontSize: 15, fontWeight: '800' }}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  if (!currentScenario) return null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080810' }}>
      {/* HEADER */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
        </Pressable>
        <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', letterSpacing: 1 }}>{label} · REP {repIndex + 1} OF {TOTAL_REPS}</Text>
        <Text style={{ color: '#22CC5E', fontSize: 13, fontWeight: '700' }}>{score}/{repIndex}</Text>
      </View>

      {/* PROGRESS BAR */}
      <View style={{ height: 3, backgroundColor: '#1a1a1a' }}>
        <View style={{ height: 3, backgroundColor: '#22CC5E', width: `${(repIndex / TOTAL_REPS) * 100}%` }} />
      </View>

      {/* INTERACTIVE COMPONENT */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {(type === 'pitch-sequence' || type === 'pitch-iq') && (
          <PitchSequenceChess
            key={repIndex}
            data={currentScenario.data}
            responses={currentScenario.responses}
            feedback={currentScenario.feedback}
            onComplete={handleRepComplete}
          />
        )}
        {type === 'field-iq' && (
          <FieldIQBoard
            key={repIndex}
            data={currentScenario.data}
            responses={currentScenario.responses}
            feedback={currentScenario.feedback}
            onComplete={handleRepComplete}
          />
        )}
        {type === 'strike-zone' && (
          <StrikeZoneVisualizer {...currentScenario} onComplete={handleRepComplete} />
        )}
        {type === 'throw-decision' && (
          <ThrowDecisionBoard {...currentScenario} onComplete={handleRepComplete} />
        )}
        {type === 'leverage-ladder' && (
          <LeverageLadder {...currentScenario} onComplete={handleRepComplete} />
        )}
        {!['pitch-sequence','pitch-iq','field-iq','strike-zone','throw-decision','leverage-ladder'].includes(type ?? '') && (
          <View style={{ padding: 24, gap: 12 }}>
            <Text style={{ color: 'white' }}>Unknown drill type.</Text>
            <Pressable onPress={() => router.back()}><Text style={{ color: '#22CC5E' }}>Go back</Text></Pressable>
          </View>
        )}
      </ScrollView>

      {/* FEEDBACK FLASH OVERLAY */}
      {showFeedback && (
        <Animated.View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: lastCorrect ? 'rgba(34,204,94,0.15)' : 'rgba(255,59,48,0.15)',
          alignItems: 'center', justifyContent: 'center',
          opacity: feedbackAnim, pointerEvents: 'none',
        }}>
          <Text style={{ fontSize: 64 }}>{lastCorrect ? '✓' : '✗'}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  )
}
