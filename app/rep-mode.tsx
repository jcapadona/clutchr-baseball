import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView, ScrollView, Pressable, View, Text, Animated, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAthlete } from '@/context/AthleteContext'
import PitchSequenceChess from '@/components/PitchSequenceChess'
import FieldIQBoard from '@/components/FieldIQBoard'
import { useRef, useState, useEffect } from 'react'

// ─── SCENARIO BANKS ──────────────────────────────────────────────────────────

const PITCH_SEQUENCE_SCENARIOS = [
  {
    data: {
      prompt: "Runner on 2nd. 1-1 count. Right-handed hitter is sitting fastball.",
      mode: 'choose_next_pitch',
      context: { count: '1-1', outs: 1, runners: ['2nd'], batter_side: 'right' },
      previous_pitches: [{ pitch: '4_seam', location: 'up', result: 'foul' }],
      pitch_options: ['4_seam', 'slider', 'changeup', 'curveball'],
      target_options: ['down_away', 'back_foot', 'waste_up', 'middle_down'],
    },
    responses: { best_combo: { pitch: 'slider', target: 'back_foot' }, acceptable_combos: [{ pitch: 'changeup', target: 'down_away' }] },
    feedback: { correct: "Back foot slider. He can't get to it.", acceptable: 'Changeup away works too. Good thought.', wrong: "Don't throw him another fastball. Change the look." }
  },
  {
    data: {
      prompt: "0-2 count. Left-handed hitter. Bases empty.",
      mode: 'choose_next_pitch',
      context: { count: '0-2', outs: 2, runners: [], batter_side: 'left' },
      previous_pitches: [{ pitch: '4_seam', location: 'up', result: 'strike' }, { pitch: 'slider', location: 'down_away', result: 'strike' }],
      pitch_options: ['4_seam', 'slider', 'changeup', 'curveball'],
      target_options: ['waste_up', 'down_away', 'back_foot', 'middle_down'],
    },
    responses: { best_combo: { pitch: 'curveball', target: 'waste_up' }, acceptable_combos: [{ pitch: 'changeup', target: 'down_away' }] },
    feedback: { correct: 'Waste it up. Make him chase out of the zone.', acceptable: 'Changeup low and away. Good put-away thought.', wrong: "Don't give him a strike to hit 0-2. Expand the zone." }
  },
  {
    data: {
      prompt: "Bases loaded. 3-2 count. Tie game. Right-handed hitter.",
      mode: 'choose_next_pitch',
      context: { count: '3-2', outs: 1, runners: ['1st', '2nd', '3rd'], batter_side: 'right' },
      previous_pitches: [{ pitch: '4_seam', location: 'middle', result: 'foul' }],
      pitch_options: ['4_seam', 'slider', 'changeup', 'sinker'],
      target_options: ['down_away', 'glove_side_knee', 'middle_down', 'back_foot'],
    },
    responses: { best_combo: { pitch: 'sinker', target: 'glove_side_knee' }, acceptable_combos: [{ pitch: '4_seam', target: 'down_away' }] },
    feedback: { correct: "Sinker glove-side knee. Ground ball. That's the pitch.", acceptable: 'Fastball away. Trust your stuff.', wrong: "Don't leave it in the middle with bases loaded." }
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
    data: { prompt: 'Ground ball to shortstop. Runner on 1st. 1 out. Where does the throw go?', mode: 'field', context: { outs: 1, runners: ['1st'] } },
    responses: { correct_target: '2b', acceptable_targets: ['1b'] },
    feedback: { correct: 'Turn two. You had time.', acceptable: 'Safe play. Got the out.', wrong: 'Double play opportunity. Go to second first.' }
  },
  {
    data: { prompt: 'Bunt down 3rd base line. Runner on 1st. No outs. 3rd baseman charges.', mode: 'field', context: { outs: 0, runners: ['1st'] } },
    responses: { correct_target: '1b', acceptable_targets: [] },
    feedback: { correct: 'Right call. Get the sure out at first.', acceptable: '', wrong: "Don't try to get cute. Take the out at first." }
  },
  {
    data: { prompt: 'Bases loaded. 1 out. Ground ball to 2nd baseman.', mode: 'field', context: { outs: 1, runners: ['1st', '2nd', '3rd'] } },
    responses: { correct_target: 'home', acceptable_targets: ['2b'] },
    feedback: { correct: 'Home first. Cut the run off.', acceptable: 'Double play works too if you have time.', wrong: 'Bases loaded — check the runner at home first.' }
  },
  {
    data: { prompt: 'Fly ball to right field. Runner on 3rd. Less than 2 outs. Shallow fly.', mode: 'field', context: { outs: 1, runners: ['3rd'] } },
    responses: { correct_target: 'home', acceptable_targets: ['2b'] },
    feedback: { correct: 'Throw home. Hold the runner or nail him.', acceptable: 'Play it safe if runner holds.', wrong: 'Runner tags — you need to be ready to throw home.' }
  },
  {
    data: { prompt: 'Line drive to center. Runners on 1st and 2nd. 0 outs.', mode: 'field', context: { outs: 0, runners: ['1st', '2nd'] } },
    responses: { correct_target: '3b', acceptable_targets: ['2b'] },
    feedback: { correct: 'Hit the cutoff to 3rd. Keep the lead runner.', acceptable: '2nd base if lead runner already scored.', wrong: 'You need to cut off the lead runner. Think ahead.' }
  },
  {
    data: { prompt: 'Wild pitch. Runner on 3rd. 2 outs. Catcher retrieves.', mode: 'field', context: { outs: 2, runners: ['3rd'] } },
    responses: { correct_target: '1b', acceptable_targets: ['home'] },
    feedback: { correct: 'Pitcher covers first. Get the batter.', acceptable: 'If runner breaks, go home.', wrong: "Pitcher covers 1st on wild pitch. That's the play." }
  },
  {
    data: { prompt: 'Swinging bunt. Runner on 2nd. 0 outs. First baseman charges hard.', mode: 'field', context: { outs: 0, runners: ['2nd'] } },
    responses: { correct_target: '1b', acceptable_targets: [] },
    feedback: { correct: 'Bare-handed to first. Sold it.', acceptable: '', wrong: 'You have to make that play. Charge and throw.' }
  },
  {
    data: { prompt: 'Double to left-center gap. Runner on 1st. Relay throw coming in.', mode: 'field', context: { outs: 1, runners: ['1st'] } },
    responses: { correct_target: '3b', acceptable_targets: ['home'] },
    feedback: { correct: 'Relay to 3rd. Hold him there.', acceptable: 'If he rounds 3rd hard, go home.', wrong: 'Cut it off and relay to the right base.' }
  },
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
    const bank = type === 'pitch-sequence' ? PITCH_SEQUENCE_SCENARIOS
      : type === 'field-iq' ? FIELD_IQ_SCENARIOS
      : PITCH_SEQUENCE_SCENARIOS
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
    'field-iq': 'FIELD IQ',
    'strike-zone': 'ZONE READ',
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
        {type === 'pitch-sequence' && (
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
