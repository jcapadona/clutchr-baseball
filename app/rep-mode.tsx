import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView, ScrollView, Pressable, View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useMemo, useState } from 'react'
import PitchSequenceChess from '@/components/PitchSequenceChess'
import FieldIQBoard from '@/components/FieldIQBoard'
import StrikeZoneVisualizer from '@/components/StrikeZoneVisualizer'
import ThrowDecisionBoard from '@/components/ThrowDecisionBoard'
import LeverageLadder from '@/components/LeverageLadder'
import { Colors } from '@/constants/theme'

type DrillType = 'pitch-iq' | 'field-iq' | 'strike-zone' | 'throw-decision' | 'leverage-ladder'

const PITCH_IQ = [
  { data: { prompt: 'Count 0-2. Hitter chased slider last AB. Situation: 6th inning, tie game, runner on 2nd, 2 outs.', mode: 'choose_next_pitch', context: { count: '0-2', outs: 2, runners: ['2nd'], batter_side: 'right' }, previous_pitches: [{ pitch: 'slider', location: 'down_away', result: 'swing_miss' }], pitch_options: ['slider', 'changeup', '4_seam', 'curveball'], target_options: ['back_foot', 'down_away', 'waste_up', 'middle'] }, responses: { best_combo: { pitch: 'slider', target: 'back_foot' }, acceptable_combos: [{ pitch: 'changeup', target: 'down_away' }] }, feedback: { correct: 'Great sequence: expand with purpose off his chase tendency.', acceptable: 'Still keeps ball off barrel and out of damage lane.', wrong: '0-2 cannot leak to middle in this spot.' } },
  { data: { prompt: 'Count 2-0. Hitter hunts fastball middle-in. Situation: bases empty, 1 out.', mode: 'choose_next_pitch', context: { count: '2-0', outs: 1, runners: [], batter_side: 'left' }, previous_pitches: [{ pitch: '4_seam', location: 'middle', result: 'ball' }], pitch_options: ['2_seam', 'changeup', '4_seam', 'slider'], target_options: ['glove_side_knee', 'down_away', 'middle_down', 'middle_in'] }, responses: { best_combo: { pitch: '2_seam', target: 'glove_side_knee' }, acceptable_combos: [{ pitch: 'changeup', target: 'down_away' }] }, feedback: { correct: 'Competitive strike without feeding his damage zone.', acceptable: 'Good count-management with low risk location.', wrong: 'Avoid middle-in in 2-0 to this hitter profile.' } },
  { data: { prompt: 'Count 1-2. Hitter late on velocity. Situation: runner on 2nd, 2 outs, up 1 in 8th.', mode: 'choose_next_pitch', context: { count: '1-2', outs: 2, runners: ['2nd'], batter_side: 'right' }, previous_pitches: [{ pitch: 'changeup', location: 'down', result: 'foul' }], pitch_options: ['4_seam', 'slider', 'changeup', 'curveball'], target_options: ['up_away', 'down_away', 'back_foot', 'middle'] }, responses: { best_combo: { pitch: '4_seam', target: 'up_away' }, acceptable_combos: [{ pitch: 'slider', target: 'down_away' }] }, feedback: { correct: 'You used his timing weakness to finish the inning.', acceptable: 'Good tunnel away from barrel contact.', wrong: 'Middle misses bring RBI risk with R2.' } },
  { data: { prompt: 'Count 3-1. Hitter takes borderline early. Situation: leadoff hitter, 4th inning.', mode: 'choose_next_pitch', context: { count: '3-1', outs: 0, runners: [], batter_side: 'left' }, previous_pitches: [{ pitch: 'changeup', location: 'down', result: 'ball' }], pitch_options: ['4_seam', '2_seam', 'slider', 'changeup'], target_options: ['middle_away', 'glove_side_knee', 'middle', 'down_away'] }, responses: { best_combo: { pitch: '4_seam', target: 'middle_away' }, acceptable_combos: [{ pitch: '2_seam', target: 'glove_side_knee' }] }, feedback: { correct: 'Smart get-me-over strike with low damage profile.', acceptable: 'Still attacks zone edge and avoids free pass.', wrong: '3-1 non-competitive misses create momentum.' } },
  { data: { prompt: 'Count 0-0. Aggressive first-pitch swinger. Situation: runner on 1st, 1 out.', mode: 'choose_next_pitch', context: { count: '0-0', outs: 1, runners: ['1st'], batter_side: 'right' }, previous_pitches: [], pitch_options: ['slider', '4_seam', 'changeup', '2_seam'], target_options: ['down_away', 'up_away', 'middle', 'glove_side_knee'] }, responses: { best_combo: { pitch: '2_seam', target: 'glove_side_knee' }, acceptable_combos: [{ pitch: 'slider', target: 'down_away' }] }, feedback: { correct: 'Early-count weak contact profile, strong ground-ball chance.', acceptable: 'Disrupts timing with a chase look.', wrong: 'Center-cut first pitch plays into aggression.' } },
]

const FIELD_IQ = [
  { data: { prompt: 'Position SS · Inning 6 · 1 out · Runner 1st · Tie game · Hard grounder up middle. Best play?', mode: 'throw_priority', context: { position: 'SS', inning: '6th', outs: 1, runners: ['1st'], score_state: 'tie_game', ball_location: 'up middle hard one-hop' } }, responses: { correct_target: '2B', acceptable_targets: ['1B'] }, feedback: { correct: 'Force at second first; turn two if transfer is clean.', acceptable: 'Sure out at first if speed/angle blocks DP.', wrong: 'Middle infield priority is force progression.' } },
  { data: { prompt: 'Position 3B · Inning 7 · 1 out · Runner 3rd · Down 1 · Slow roller/bunt line. Best decision?', mode: 'throw_priority', context: { position: '3B', inning: '7th', outs: 1, runners: ['3rd'], score_state: 'down_1', ball_location: '3B line slow roller' } }, responses: { correct_target: 'home', acceptable_targets: ['1B'] }, feedback: { correct: 'Cut lead run if play is there; game-state first.', acceptable: 'If no play at plate, bank sure out.', wrong: 'Defaulting to first can concede key run.' } },
  { data: { prompt: 'Position RF · Inning 8 · 1 out · Runner 1st · Up 1 · Gap ball right-center. Throw priority?', mode: 'throw_priority', context: { position: 'RF', inning: '8th', outs: 1, runners: ['1st'], score_state: 'up_1', ball_location: 'right-center gap' } }, responses: { correct_target: 'cutoff_2B', acceptable_targets: ['3B'] }, feedback: { correct: 'Hit cutoff to stop extra base and keep inning small.', acceptable: 'Direct 3B works only with clean lane/arm.', wrong: 'Hero throw risks big inning on miss.' } },
  { data: { prompt: 'Position 2B · Inning 5 · 0 outs · Runners 1st/2nd · Tie game · Grounder to right side. First target?', mode: 'throw_priority', context: { position: '2B', inning: '5th', outs: 0, runners: ['1st', '2nd'], score_state: 'tie_game', ball_location: 'right side two-hopper' } }, responses: { correct_target: '3B', acceptable_targets: ['2B'] }, feedback: { correct: 'Lead runner at 3B prevents big inning progression.', acceptable: 'Force at 2B acceptable if lead is unplayable.', wrong: 'Auto-1B can surrender leverage base.' } },
  { data: { prompt: 'Position CF · Inning 9 · 1 out · Runner 2nd · Tie game · Single to shallow center. Decision?', mode: 'throw_priority', context: { position: 'CF', inning: '9th', outs: 1, runners: ['2nd'], score_state: 'tie_game', ball_location: 'shallow center single' } }, responses: { correct_target: 'home', acceptable_targets: ['cutoff_home'] }, feedback: { correct: 'Prevent walk-off run; attack plate with urgency.', acceptable: 'Cutoff-home if direct lane is poor.', wrong: 'Conceding home ends the game.' } },
]

const ZONE_READ = [
  { data: { prompt: 'Count 2-0 · Pitch: fastball · Location: middle-up · Situation: runner 2nd, 1 out · Goal: hunt damage zone.', mode: 'swing_take', context: { umpire_note: 'Top rail is being called a strike.' } }, responses: { correct_action: 'swing', acceptable_actions: [] }, feedback: { correct: 'Damage count + damage location. Attack it.', acceptable: 'N/A', wrong: 'This is your best hitter’s count window.' } },
  { data: { prompt: 'Count 0-2 · Pitch: slider · Location: off away edge · Situation: bases empty · Goal: survive and extend AB.', mode: 'swing_take' }, responses: { correct_action: 'take', acceptable_actions: ['swing'] }, feedback: { correct: 'Great take. Pitcher is trying to expand.', acceptable: 'Protect swing is okay if you can spoil it.', wrong: 'Chasing gives away the AB.' } },
  { data: { prompt: 'Count 1-1 · Pitch: changeup · Location: down-middle · Situation: runner 3rd, <2 outs · Goal: productive contact.', mode: 'swing_take' }, responses: { correct_action: 'swing', acceptable_actions: [] }, feedback: { correct: 'You got a hittable pitch to drive run creation.', acceptable: 'N/A', wrong: 'Take here can waste scoring chance.' } },
  { data: { prompt: 'Count 3-1 · Pitch: cutter · Location: black away edge · Situation: tie game, 8th inning · Goal: avoid weak rollover.', mode: 'swing_take' }, responses: { correct_action: 'take', acceptable_actions: ['swing'] }, feedback: { correct: 'Borderline edge pitch in advantage count: disciplined take.', acceptable: 'Only swing if you own that lane.', wrong: 'Expanding can flip count leverage.' } },
  { data: { prompt: 'Count 1-0 · Pitch: curveball · Location: hangs middle-down · Situation: runner 1st, no outs · Goal: hard contact gap-to-gap.', mode: 'swing_take' }, responses: { correct_action: 'swing', acceptable_actions: [] }, feedback: { correct: 'Hanging breaker in advantage count is attack pitch.', acceptable: 'N/A', wrong: 'Passed up a mistake pitch.' } },
]

const THROW_DECISION = Array.from({ length: 5 }, (_, i) => ({ ...FIELD_IQ[i], data: { ...FIELD_IQ[i].data, prompt: FIELD_IQ[i].data.prompt.replace('Best play?', 'Best throw decision?') } }))

const LEVERAGE = [
  { data: { prompt: 'Score tie · 8th · 1 out · runners 2nd/3rd · Role: pitcher. Rank top priority.', situation: 'High leverage tie game', instruction: 'Put #1 as highest priority.', items: [{ id: 'prevent_run', label: 'Prevent run at all costs' }, { id: 'execute_pitch', label: 'Execute pitch to edge target' }, { id: 'chase_k', label: 'Chase strikeout only' }] }, responses: { correct_order: ['execute_pitch', 'prevent_run', 'chase_k'] }, feedback: { correct: 'Execution first creates best run prevention odds.', acceptable: 'Close: keep process before hero outcome.', poor: 'Leverage moments require process-first priority.' } },
  { data: { prompt: 'Up 1 · 9th · 0 outs · runner 1st · Role: SS. Rank priority.', situation: 'Potential tying run on base', instruction: 'Choose the cleanest first priority.', items: [{ id: 'secure_ball', label: 'Secure ball and footwork first' }, { id: 'rush_throw', label: 'Rush throw for double play' }, { id: 'tag_runner', label: 'Tag lead runner blindly' }] }, responses: { correct_order: ['secure_ball', 'rush_throw', 'tag_runner'] }, feedback: { correct: 'Clean possession before speed prevents big errors.', acceptable: 'Mostly right: avoid panic actions.', poor: 'Rushing before control is low-percentage baseball.' } },
  { data: { prompt: 'Down 1 · 7th · 1 out · runner 3rd · Role: hitter. Priority?', situation: 'Need productive contact', instruction: 'Rank approach priorities.', items: [{ id: 'ball_in_play', label: 'Put ball in play hard' }, { id: 'walk_only', label: 'Hunt walk only' }, { id: 'pull_hr', label: 'Sell out for HR' }] }, responses: { correct_order: ['ball_in_play', 'walk_only', 'pull_hr'] }, feedback: { correct: 'Run-production contact is top leverage objective.', acceptable: 'Walk has value, but contact remains priority.', poor: 'All-or-nothing lowers team run probability.' } },
  { data: { prompt: 'Tie game · 6th · 2 outs · bases loaded · Role: catcher. Priority?', situation: 'One pitch changes inning', instruction: 'Rank what matters most.', items: [{ id: 'best_pitch_call', label: 'Call best conviction pitch' }, { id: 'trick_pickoff', label: 'Try surprise pickoff' }, { id: 'frame_only', label: 'Frame over execution' }] }, responses: { correct_order: ['best_pitch_call', 'frame_only', 'trick_pickoff'] }, feedback: { correct: 'Best called pitch with conviction drives outcome.', acceptable: 'Framing helps, but only after right call.', poor: 'Trick-first is low percentage here.' } },
  { data: { prompt: 'Up 2 · 8th · 1 out · runner 2nd · Role: RF. Priority?', situation: 'Prevent extra base and big inning', instruction: 'Rank defensive leverage priorities.', items: [{ id: 'hit_cutoff', label: 'Hit cutoff chest-high' }, { id: 'hero_home', label: 'Hero throw home from deep' }, { id: 'airmail_3b', label: 'Airmail throw to 3B' }] }, responses: { correct_order: ['hit_cutoff', 'hero_home', 'airmail_3b'] }, feedback: { correct: 'Controlled relay keeps inning contained.', acceptable: 'Direct throw only with perfect lane.', poor: 'Low-control throws create extra-base chaos.' } },
]

const BANKS: Record<DrillType, any[]> = { 'pitch-iq': PITCH_IQ, 'field-iq': FIELD_IQ, 'strike-zone': ZONE_READ, 'throw-decision': THROW_DECISION, 'leverage-ladder': LEVERAGE }

export default function RepModeScreen() {
  const { type } = useLocalSearchParams<{ type: DrillType | string }>()
  const router = useRouter()
  const drill = (type as DrillType)
  const scenarios = useMemo(() => BANKS[drill] ?? [], [drill])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => { setIdx(0); setScore(0); setDone(false) }, [drill])

  if (!scenarios.length) {
    return <SafeAreaView style={styles.wrap}><View style={styles.center}><Text style={styles.title}>Unknown drill.</Text><Pressable onPress={() => router.back()}><Text style={styles.link}>Back</Text></Pressable></View></SafeAreaView>
  }

  function onComplete(passed: boolean) {
    if (passed) setScore(s => s + 1)
    if (idx >= 4) setDone(true)
    else setIdx(i => i + 1)
  }

  if (done) {
    return <SafeAreaView style={styles.wrap}><View style={styles.center}><Text style={styles.title}>Session Complete</Text><Text style={styles.sub}>Reps completed: 5/5</Text><Text style={styles.sub}>Score: {score}/5 · {score >= 4 ? 'Locked in.' : 'Good work. Keep stacking reps.'}</Text><Pressable style={styles.btn} onPress={() => router.replace('/(tabs)/gamemode')}><Text style={styles.btnText}>Back to Game Mode</Text></Pressable></View></SafeAreaView>
  }

  const scenario = scenarios[idx]

  return (
    <SafeAreaView style={styles.wrap}>
      <View style={styles.head}><Pressable onPress={() => router.back()}><Ionicons name='close' size={22} color='white' /></Pressable><Text style={styles.hText}>{drill.toUpperCase()} · REP {idx + 1}/5</Text><Text style={styles.hText}>{score}</Text></View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {(drill === 'pitch-iq') && <PitchSequenceChess {...scenario} onComplete={onComplete} />}
        {(drill === 'field-iq') && <FieldIQBoard {...scenario} onComplete={onComplete} />}
        {(drill === 'strike-zone') && <StrikeZoneVisualizer {...scenario} onComplete={onComplete} />}
        {(drill === 'throw-decision') && <ThrowDecisionBoard {...scenario} onComplete={onComplete} />}
        {(drill === 'leverage-ladder') && <LeverageLadder {...scenario} onComplete={onComplete} />}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#080810' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 8 },
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  sub: { color: Colors.textSecondary, fontSize: 14 },
  link: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  btn: { marginTop: 18, backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#000', fontWeight: '800' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  hText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700' },
})
