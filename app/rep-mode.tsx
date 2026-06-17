import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { SafeAreaView, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { Colors } from '@/constants/theme'
import { Btn } from '@/components/ui'

type DrillType = 'pitch-iq' | 'field-iq' | 'strike-zone' | 'throw-decision' | 'leverage-ladder'
type Rep = { title: string; context: string; choices: string[]; correct: number; feedback: string }

const BANKS: Record<DrillType, Rep[]> = {
  'pitch-iq': [
    { title: '0-2 put-away', context: 'Hitter chased slider earlier. Runner on 2nd, 2 outs.', choices: ['Slider off back foot', 'Fastball middle', 'Curve in zone'], correct: 0, feedback: 'Expand with intent. Avoid middle mistakes.' },
    { title: '2-0 damage control', context: 'Hitter hunts heater middle-in. Bases empty.', choices: ['2-seam to knee', 'Fastball middle-in', 'Hanging slider'], correct: 0, feedback: 'Competitive strike with low damage risk.' },
    { title: '1-2 finish inning', context: 'Runner on 2nd, 2 outs. Hitter late on velo.', choices: ['Fastball up-away', 'Changeup middle', 'Curve middle'], correct: 0, feedback: 'Use timing weakness to finish clean.' },
    { title: '3-1 count management', context: 'Leadoff hitter taking close pitches.', choices: ['Get-me-over edge strike', 'Waste ball up', 'Nip middle'], correct: 0, feedback: 'Regain count leverage without feeding barrels.' },
    { title: '0-0 aggression', context: 'First-pitch swinger with runner on 1st.', choices: ['2-seam at knee', 'Center-cut fastball', 'Float breaker middle'], correct: 0, feedback: 'Early weak contact profile beats hero pitch.' },
  ],
  'field-iq': [
    { title: 'SS force priority', context: '6th inning, 1 out, runner on 1st, hard one-hop up middle.', choices: ['Force at 2nd first', 'Throw home', 'Only to 1st'], correct: 0, feedback: 'Middle force first, then turn two if clean.' },
    { title: '3B lead-run', context: '7th inning, down 1, runner on 3rd, 1 out, slow roller.', choices: ['Attack plate if play is there', 'Auto throw to 1st', 'Hold ball'], correct: 0, feedback: 'Game state favors cutting lead run.' },
    { title: 'RF gap ball', context: '8th inning, up 1, runner on 1st, ball in right-center.', choices: ['Hit cutoff to stop extra base', 'Hero throw home', 'Airmail 3rd'], correct: 0, feedback: 'Control throw prevents big inning.' },
    { title: '2B lead runner', context: '5th inning tie, 0 outs, runners 1st/2nd, grounder right side.', choices: ['Check lead at 3rd', 'Auto 1st', 'Fake then no throw'], correct: 0, feedback: 'Prioritize inning leverage, not autopilot out.' },
    { title: 'CF shallow single', context: '9th inning tie, runner on 2nd, 1 out, shallow center hit.', choices: ['Attack plate lane', 'Casual to cutoff', 'Eat the ball'], correct: 0, feedback: 'Preventing run is top priority.' },
  ],
  'strike-zone': [
    { title: '2-0 hunt', context: 'Fastball middle-up. Runner on 2nd, 1 out.', choices: ['Swing', 'Take', 'Bail out'], correct: 0, feedback: 'Advantage count plus damage location = attack.' },
    { title: '0-2 edge', context: 'Slider off away edge. Bases empty.', choices: ['Take', 'Big swing', 'Step out'], correct: 0, feedback: 'Discipline wins versus expand pitch.' },
    { title: '1-1 runner 3rd', context: 'Changeup down-middle, less than 2 outs.', choices: ['Swing for productive contact', 'Take only', 'Auto bunt'], correct: 0, feedback: 'Hittable pitch for run creation.' },
    { title: '3-1 borderline', context: 'Cutter on black away in tie game late.', choices: ['Take', 'Chase it', 'Guess pull'], correct: 0, feedback: 'Keep advantage count discipline.' },
    { title: '1-0 hanger', context: 'Curve hangs middle-down, runner on 1st.', choices: ['Swing', 'Take', 'Call timeout'], correct: 0, feedback: 'Mistake pitch in hitter count should be attacked.' },
  ],
  'throw-decision': [
    { title: 'Throw Decision #1', context: 'SS, 1 out, runner 1st, hard grounder.', choices: ['2nd base force', '1st base only', 'Home'], correct: 0, feedback: 'Force progression first.' },
    { title: 'Throw Decision #2', context: '3B, runner 3rd, 1 out, slow roller.', choices: ['Home if playable', '1st no matter what', 'No throw'], correct: 0, feedback: 'Lead-run prevention priority.' },
    { title: 'Throw Decision #3', context: 'RF gap ball, runner 1st, up 1.', choices: ['Cutoff throw', 'Home hero throw', 'High-risk 3rd'], correct: 0, feedback: 'Keep inning small with control.' },
    { title: 'Throw Decision #4', context: 'Catcher block, runner breaks from 3rd.', choices: ['Quick read then home/1st', 'Panic throw', 'Freeze'], correct: 0, feedback: 'Fast, controlled decision beats panic.' },
    { title: 'Throw Decision #5', context: '2B chopper with runners 1st/2nd.', choices: ['Lead runner check', 'Auto 1st', 'Pocket it'], correct: 0, feedback: 'Leverage base awareness matters.' },
  ],
  'leverage-ladder': [
    { title: 'Leverage 1', context: 'Tie 8th, 1 out, runners 2nd/3rd, pitcher role.', choices: ['Execute target pitch first', 'Chase strikeout only', 'Rush mechanics'], correct: 0, feedback: 'Process-first execution drives outcomes.' },
    { title: 'Leverage 2', context: 'Up 1 in 9th, runner 1st, SS role.', choices: ['Secure ball/feet first', 'Rush throw', 'Blind tag play'], correct: 0, feedback: 'Control before speed.' },
    { title: 'Leverage 3', context: 'Down 1, 7th, runner 3rd, hitter role.', choices: ['Productive contact priority', 'HR-only swing', 'Passive take'], correct: 0, feedback: 'Run production beats hero-ball.' },
    { title: 'Leverage 4', context: 'Tie 6th, 2 outs, bases loaded, catcher role.', choices: ['Best conviction pitch call', 'Trick play first', 'Frame only'], correct: 0, feedback: 'Right call + conviction is top value.' },
    { title: 'Leverage 5', context: 'Up 2, 8th, runner 2nd, RF role.', choices: ['Hit cutoff chest-high', 'Hero throw home', 'Airmail 3B'], correct: 0, feedback: 'Contain inning with controllable throw.' },
  ],
}

export default function RepModeScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>()
  const router = useRouter()
  const drillType = (type ?? 'pitch-iq') as DrillType
  const reps = useMemo(() => BANKS[drillType] ?? [], [drillType])

  const [currentRepIndex, setCurrentRepIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const rep = reps[currentRepIndex]

  function nextRep() {
    if (currentRepIndex >= 4) {
      setIsComplete(true)
      return
    }
    setCurrentRepIndex((i) => i + 1)
    setSelectedChoice(null)
  }

  if (!reps.length || !rep) {
    return (
      <SafeAreaView style={s.wrap}>
        <View style={s.center}><Text style={s.title}>Rep Mode unavailable</Text><Text style={s.sub}>This drill type is missing.</Text><Btn label="Back to Game Mode" onPress={() => router.replace('/(tabs)/gamemode')} /></View>
      </SafeAreaView>
    )
  }

  if (isComplete) {
    return (
      <SafeAreaView style={s.wrap}>
        <View style={s.center}>
          <Text style={s.title}>Drill complete</Text>
          <Text style={s.sub}>5 reps finished</Text>
          <Text style={s.sub}>Takeaway: stack clean decisions, one rep at a time.</Text>
          <Btn label="Back to Game Mode" onPress={() => router.replace('/(tabs)/gamemode')} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.header}>
        <Pressable onPress={() => router.replace('/(tabs)/gamemode')}><Text style={s.back}>Back</Text></Pressable>
        <Text style={s.headerText}>Rep {currentRepIndex + 1} of 5</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.kicker}>{drillType.toUpperCase()}</Text>
        <Text style={s.repTitle}>{rep.title}</Text>
        <Text style={s.context}>{rep.context}</Text>

        {rep.choices.map((c, i) => (
          <Pressable key={i} onPress={() => setSelectedChoice(i)} style={[s.choice, selectedChoice === i && s.choiceSelected]}>
            <Text style={s.choiceText}>{c}</Text>
          </Pressable>
        ))}

        {selectedChoice !== null && (
          <View style={s.feedback}><Text style={s.feedbackText}>{selectedChoice === rep.correct ? 'Good rep. ' : ''}{rep.feedback}</Text></View>
        )}

        <Btn label={currentRepIndex === 4 ? 'Finish Drill' : 'Next Rep'} onPress={nextRep} />
        <Btn label="Back to Game Mode" onPress={() => router.replace('/(tabs)/gamemode')} variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#080810' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  back: { color: Colors.textSecondary, fontWeight: '700' },
  headerText: { color: Colors.textPrimary, fontWeight: '700' },
  content: { padding: 16, gap: 10 },
  kicker: { color: Colors.primary, fontWeight: '700', letterSpacing: 1 },
  repTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  context: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  choice: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, backgroundColor: Colors.surface },
  choiceSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  choiceText: { color: Colors.textPrimary },
  feedback: { borderRadius: 10, borderWidth: 1, borderColor: Colors.warning + '66', backgroundColor: Colors.warning + '12', padding: 12 },
  feedbackText: { color: Colors.textSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 8 },
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  sub: { color: Colors.textSecondary, textAlign: 'center' },
})
