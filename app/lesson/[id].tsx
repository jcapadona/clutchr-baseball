import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { supabase } from '@/lib/supabase';
import { Colors, Radius, Spacing } from '@/constants/theme';

import StrikeZoneVisualizer from '@/components/StrikeZoneVisualizer';
import PitchSequenceChess from '@/components/PitchSequenceChess';
import FieldIQBoard from '@/components/FieldIQBoard';
import ThrowDecisionBoard from '@/components/ThrowDecisionBoard';
import LeverageLadder from '@/components/LeverageLadder';
import RoutineCardBuilder from '@/components/RoutineCardBuilder';
import PressureReplay from '@/components/PressureReplay';
import SnapshotRead from '@/components/SnapshotRead';
import JumpRead from '@/components/JumpRead';
import TimingTrack from '@/components/TimingTrack';
import ConfidenceSlider from '@/components/ConfidenceSlider';
import PitchCountBoard from '@/components/PitchCountBoard';

// ─── SELF-RATING CHECK-IN ─────────────────────────────────────────────────────

const RATING_QUESTIONS: Record<string, { key: string; question: string }[]> = {
  pitcher:   [{ key: 'composure', question: 'How steady were you under pressure?' }, { key: 'focus', question: 'How sharp was your focus on each pitch?' }, { key: 'reset_skill', question: 'How well did you reset between mistakes?' }],
  catcher:   [{ key: 'composure', question: 'How calm were you calling the game?' }, { key: 'confidence', question: 'How confident were your pitch calls?' }, { key: 'focus', question: 'How locked in were you to the situation?' }],
  infielder: [{ key: 'composure', question: 'How composed were you on tough plays?' }, { key: 'reset_skill', question: 'How fast did you move on from errors?' }, { key: 'focus', question: 'How sharp was your pre-pitch preparation?' }],
  outfielder:[{ key: 'composure', question: 'How steady were you on pressure reads?' }, { key: 'focus', question: 'How early were you picking up the ball?' }, { key: 'reset_skill', question: 'How well did you reset after misreads?' }],
  default:   [{ key: 'composure', question: 'How steady did you feel under pressure?' }, { key: 'confidence', question: 'How confident did you feel overall?' }, { key: 'focus', question: 'How focused were you throughout?' }],
};

function DotRating({ value, onChange, color = Colors.primary }: { value: number; onChange: (v: number) => void; color?: string }) {
  return (
    <View style={ratingStyles.dotsRow}>
      {[1,2,3,4,5].map((n) => (
        <Pressable key={n} onPress={() => { Haptics.selectionAsync(); onChange(n); }} hitSlop={8}
          style={[ratingStyles.dot, value >= n ? { backgroundColor: color, borderColor: color } : { backgroundColor: 'transparent', borderColor: Colors.border }]}>
          {value >= n && <View style={[ratingStyles.dotFill, { backgroundColor: color }]} />}
        </Pressable>
      ))}
      <Text style={[ratingStyles.dotLabel, value > 0 && { color }]}>
        {value===0?'—':value===1?'Low':value===2?'Okay':value===3?'Solid':value===4?'Strong':'Elite'}
      </Text>
    </View>
  );
}

function SelfRatingCheckIn({ role, lessonTitle, isBoss, onSubmit }: { role: string; lessonTitle: string; isBoss: boolean; onSubmit: (r: Record<string, number>) => void }) {
  const questions = RATING_QUESTIONS[role] ?? RATING_QUESTIONS.default;
  const [ratings, setRatings] = useState<Record<string, number>>(Object.fromEntries(questions.map((q) => [q.key, 0])));
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);
  const allRated = Object.values(ratings).every((v) => v > 0);
  return (
    <Animated.View style={[checkInStyles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[checkInStyles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={checkInStyles.headerRow}>
          <View style={checkInStyles.iconWrap}><Ionicons name={isBoss ? 'trophy' : 'flag'} size={18} color={isBoss ? Colors.warning : Colors.info} /></View>
          <View style={{ flex: 1 }}>
            <Text style={checkInStyles.eyebrow}>{isBoss ? 'BOSS COMPLETE' : 'CHECKPOINT CLEARED'}</Text>
            <Text style={checkInStyles.title} numberOfLines={1}>{lessonTitle}</Text>
          </View>
        </View>
        <View style={checkInStyles.divider} />
        <Text style={checkInStyles.prompt}>Rate yourself honestly. This updates your training focus.</Text>
        <View style={checkInStyles.questions}>
          {questions.map((q) => (
            <View key={q.key} style={checkInStyles.questionRow}>
              <Text style={checkInStyles.questionText}>{q.question}</Text>
              <DotRating value={ratings[q.key]??0} onChange={(v) => setRatings((p) => ({...p,[q.key]:v}))} color={isBoss ? Colors.warning : Colors.primary} />
            </View>
          ))}
        </View>
        <Pressable style={[checkInStyles.submitBtn, !allRated && checkInStyles.submitBtnDisabled, isBoss && allRated && checkInStyles.submitBtnBoss]}
          onPress={() => { if (!allRated) return; Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onSubmit(ratings); }} disabled={!allRated}>
          <Text style={[checkInStyles.submitBtnText, !allRated && { color: Colors.textTertiary }]}>{allRated ? 'See Results →' : 'Rate all three to continue'}</Text>
        </Pressable>
        <Text style={checkInStyles.hint}>Honest ratings help Clutchr surface the right next lesson for you.</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ─── UI VARIANT ROUTER ────────────────────────────────────────────────────────
// KEY FIX: firedRef prevents the same component calling onAdvance twice.
// This was the root cause of the blank screen (7/4 step counter) bug.

function VariantRenderer({ step, onAdvance }: { step: any; onAdvance: (passed?: boolean) => void }) {
  const firedRef = useRef(false);
  const handleComplete = useCallback((passed: boolean) => {
    if (firedRef.current) return;
    firedRef.current = true;
    setTimeout(() => onAdvance(passed), 1800);
  }, [onAdvance]);

  const props = { data: step.data, responses: step.responses, feedback: step.feedback, onComplete: handleComplete };
  switch (step.ui_variant) {
    case 'strike_zone_visualizer':   return <StrikeZoneVisualizer {...props} />;
    case 'pitch_sequence_chess':     return <PitchSequenceChess {...props} />;
    case 'field_iq_board':           return <FieldIQBoard {...props} />;
    case 'throw_decision_board':     return <ThrowDecisionBoard {...props} />;
    case 'leverage_ladder':          return <LeverageLadder {...props} />;
    case 'routine_card_builder':     return <RoutineCardBuilder {...props} />;
    case 'pressure_replay':          return <PressureReplay {...props} />;
    case 'snapshot_read':            return <SnapshotRead {...props} />;
    case 'jump_read':                return <JumpRead {...props} />;
    case 'timing_track':             return <TimingTrack {...props} />;
    case 'confidence_slider':        return <ConfidenceSlider {...props} />;
    case 'pitch_count_board':        return <PitchCountBoard {...props} />;
    default:                         return null;
  }
}

// ─── STANDARD STEP RENDERERS ──────────────────────────────────────────────────

function SparkStep({ step, onAdvance }: { step: any; onAdvance: () => void }) {
  return (
    <View style={stepStyles.container}>
      <View style={stepStyles.sparkAccent} />
      <Text style={stepStyles.sparkContent}>{step.content ?? step.text ?? step.body ?? ''}</Text>
      {step.cue && <View style={stepStyles.cueBox}><Text style={stepStyles.cueLabel}>CUE</Text><Text style={stepStyles.cueText}>{step.cue}</Text></View>}
      {step.action && <View style={stepStyles.actionBox}><Ionicons name="arrow-forward-circle" size={16} color={Colors.primary} /><Text style={stepStyles.actionText}>{step.action}</Text></View>}
      <Pressable style={stepStyles.advanceBtn} onPress={onAdvance}><Text style={stepStyles.advanceBtnText}>Got it →</Text></Pressable>
    </View>
  );
}

function ChoiceStep({ step, onAdvance }: { step: any; onAdvance: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const choices = step.choices ?? step.options ?? [];
  function handlePick(id: string, outcome?: string) {
    if (revealed) return;
    Haptics.selectionAsync(); setSelected(id); setRevealed(true);
    outcome === 'success' ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.choicePrompt}>{step.prompt ?? step.question ?? ''}</Text>
      <View style={stepStyles.choiceList}>
        {choices.map((c: any, i: number) => {
          const cid = c.id ?? String(i); const isSel = selected === cid; const isOk = c.outcome==='success'||c.quality==='correct';
          return (
            <Pressable key={cid} style={[stepStyles.choiceBtn, { borderColor: isSel?(isOk?Colors.primary:Colors.danger):Colors.border, backgroundColor: isSel?(isOk?Colors.primaryMuted:'rgba(255,59,48,0.08)'):Colors.surface }]}
              onPress={() => handlePick(cid, c.outcome)} disabled={revealed}>
              <Text style={[stepStyles.choiceText, isSel && { color: isOk?Colors.primary:Colors.danger }]}>{c.text??c.label??''}</Text>
              {revealed && isSel && <Ionicons name={isOk?'checkmark-circle':'close-circle'} size={18} color={isOk?Colors.primary:Colors.danger} style={{ marginTop: 6 }} />}
              {revealed && isSel && c.feedback && <Text style={[stepStyles.choiceFeedback, { color: isOk?Colors.primary:Colors.textSecondary }]}>{c.feedback}</Text>}
            </Pressable>
          );
        })}
      </View>
      {revealed && <Pressable style={stepStyles.advanceBtn} onPress={onAdvance}><Text style={stepStyles.advanceBtnText}>Next →</Text></Pressable>}
    </View>
  );
}

function ChecklistStep({ step, onAdvance }: { step: any; onAdvance: () => void }) {
  const items: string[] = step.instructions ?? step.items ?? step.steps ?? [];
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const allDone = checked.size >= items.length && items.length > 0;
  return (
    <View style={stepStyles.container}>
      {step.prompt && <Text style={stepStyles.choicePrompt}>{step.prompt}</Text>}
      <View style={stepStyles.checkList}>
        {items.map((item, i) => {
          const done = checked.has(i);
          return (
            <Pressable key={i} style={stepStyles.checkRow} onPress={() => { Haptics.selectionAsync(); setChecked((p) => { const n=new Set(p); n.has(i)?n.delete(i):n.add(i); return n; }); }}>
              <View style={[stepStyles.checkBox, done && stepStyles.checkBoxDone]}>{done && <Ionicons name="checkmark" size={12} color={Colors.background} />}</View>
              <Text style={[stepStyles.checkText, done && stepStyles.checkTextDone]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={[stepStyles.advanceBtn, !allDone && stepStyles.advanceBtnDisabled]} onPress={allDone ? onAdvance : undefined}>
        <Text style={stepStyles.advanceBtnText}>{allDone ? 'Done →' : `${checked.size}/${items.length} checked`}</Text>
      </Pressable>
    </View>
  );
}

function VisualizationStep({ step, onAdvance }: { step: any; onAdvance: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(pulseAnim, { toValue:1.06, duration:1400, useNativeDriver:true }), Animated.timing(pulseAnim, { toValue:1, duration:1400, useNativeDriver:true })])).start(); }, []);
  const body = step.content ?? step.text ?? step.visualization ?? step.body ?? '';
  const cue = step.cue ?? step.focal_cue ?? step.example_reframe ?? '';
  return (
    <View style={stepStyles.container}>
      <Animated.View style={[stepStyles.vizOrb, { transform: [{ scale: pulseAnim }] }]}><Ionicons name="eye" size={28} color={Colors.primary} /></Animated.View>
      <Text style={stepStyles.vizBody}>{body}</Text>
      {cue !== '' && <View style={stepStyles.cueBox}><Text style={stepStyles.cueLabel}>YOUR CUE</Text><Text style={stepStyles.cueText}>{cue}</Text></View>}
      <Pressable style={stepStyles.advanceBtn} onPress={onAdvance}><Text style={stepStyles.advanceBtnText}>Locked in →</Text></Pressable>
    </View>
  );
}

function TimerStep({ step, onAdvance }: { step: any; onAdvance: () => void }) {
  const duration = step.timer_sec ?? step.duration ?? 15;
  const [seconds, setSeconds] = useState(duration);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  const instruction = step.instructions ? (Array.isArray(step.instructions) ? step.instructions.join('\n') : step.instructions) : step.simulation_description ?? step.action ?? '';
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.choicePrompt}>{instruction}</Text>
      <View style={stepStyles.timerRing}><Text style={stepStyles.timerNum}>{seconds}</Text><Text style={stepStyles.timerLabel}>sec</Text></View>
      {!running && !done && <Pressable style={stepStyles.advanceBtn} onPress={() => { setRunning(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); intervalRef.current = setInterval(() => { setSeconds((s) => { if (s<=1) { clearInterval(intervalRef.current!); setDone(true); setRunning(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); return 0; } return s-1; }); }, 1000); }}><Text style={stepStyles.advanceBtnText}>Start →</Text></Pressable>}
      {running && <Text style={stepStyles.timerRunning}>Focus. Go.</Text>}
      {done && <Pressable style={stepStyles.advanceBtn} onPress={onAdvance}><Text style={stepStyles.advanceBtnText}>Done →</Text></Pressable>}
    </View>
  );
}

function ReflectionStep({ step, onAdvance }: { step: any; onAdvance: () => void }) {
  return (
    <View style={stepStyles.container}>
      <View style={stepStyles.reflectIcon}><Ionicons name="bulb" size={24} color={Colors.warning} /></View>
      <Text style={stepStyles.sparkContent}>{step.content ?? step.text ?? step.prompt ?? step.reframe_prompt ?? ''}</Text>
      {step.example_reframe && <View style={stepStyles.cueBox}><Text style={stepStyles.cueLabel}>EXAMPLE</Text><Text style={stepStyles.cueText}>{step.example_reframe}</Text></View>}
      <Pressable style={stepStyles.advanceBtn} onPress={onAdvance}><Text style={stepStyles.advanceBtnText}>Got it →</Text></Pressable>
    </View>
  );
}

function FeedbackStep({ step, onAdvance }: { step: any; onAdvance: () => void }) {
  return (
    <View style={stepStyles.container}>
      <View style={stepStyles.feedbackCard}><Ionicons name="checkmark-circle" size={32} color={Colors.primary} /><Text style={stepStyles.feedbackText}>{step.content ?? step.text ?? step.message ?? ''}</Text></View>
      <Pressable style={stepStyles.advanceBtn} onPress={onAdvance}><Text style={stepStyles.advanceBtnText}>Continue →</Text></Pressable>
    </View>
  );
}

function NoticeWonderStep({ step, onAdvance }: { step: any; onAdvance: () => void }) {
  type Phase = 'notice' | 'wonder' | 'reveal';
  const [phase, setPhase] = useState<Phase>('notice');
  const [noticePicks, setNoticePicks] = useState<string[]>([]);
  const [wonderPick, setWonderPick] = useState<string | null>(null);
  const phaseAnim = useRef(new Animated.Value(1)).current;
  const noticeItems: string[] = step.notice_items ?? [];
  const wonderOptions: { id: string; text: string }[] = step.wonder_options ?? [];
  function transition(next: Phase) {
    Animated.timing(phaseAnim, { toValue:0, duration:150, useNativeDriver:true }).start(() => { setPhase(next); Animated.timing(phaseAnim, { toValue:1, duration:250, useNativeDriver:true }).start(); });
    Haptics.selectionAsync();
  }
  const guessedRight = wonderPick === step.wonder_correct_id;
  return (
    <View style={nwStyles.container}>
      {phase === 'notice' && (
        <Animated.View style={[nwStyles.phaseWrap, { opacity: phaseAnim }]}>
          <View style={nwStyles.phaseBadge}><Text style={nwStyles.phaseBadgeText}>NOTICE</Text></View>
          <Text style={nwStyles.situationLabel}>THE SITUATION</Text>
          <View style={nwStyles.situationCard}><Text style={nwStyles.situationText}>{step.situation ?? step.content ?? ''}</Text></View>
          <Text style={nwStyles.instruct}>Tap everything you notice. No wrong answers.</Text>
          <View style={nwStyles.chipGrid}>
            {noticeItems.map((item, i) => { const picked = noticePicks.includes(item); return (
              <Pressable key={i} style={[nwStyles.chip, picked && nwStyles.chipPicked]} onPress={() => { Haptics.selectionAsync(); setNoticePicks((p) => p.includes(item) ? p.filter((x) => x!==item) : [...p, item]); }}>
                {picked && <Ionicons name="checkmark" size={11} color={Colors.primary} style={{ marginRight: 3 }} />}
                <Text style={[nwStyles.chipText, picked && nwStyles.chipTextPicked]}>{item}</Text>
              </Pressable>
            ); })}
          </View>
          <Pressable style={[nwStyles.nextBtn, noticePicks.length===0 && nwStyles.nextBtnDisabled]} onPress={noticePicks.length>0 ? () => transition('wonder') : undefined}>
            <Text style={nwStyles.nextBtnText}>{noticePicks.length===0 ? 'Tap what you notice' : `I noticed ${noticePicks.length} thing${noticePicks.length!==1?'s':''} →`}</Text>
          </Pressable>
        </Animated.View>
      )}
      {phase === 'wonder' && (
        <Animated.View style={[nwStyles.phaseWrap, { opacity: phaseAnim }]}>
          <View style={[nwStyles.phaseBadge, nwStyles.phaseBadgeWonder]}><Text style={[nwStyles.phaseBadgeText, { color: Colors.warning }]}>WONDER</Text></View>
          <Text style={nwStyles.wonderPrompt}>{step.wonder_prompt ?? 'What do you think happens next?'}</Text>
          <View style={nwStyles.wonderOptions}>
            {wonderOptions.map((opt) => { const picked = wonderPick===opt.id; return (
              <Pressable key={opt.id} style={[nwStyles.wonderOption, picked && nwStyles.wonderOptionPicked]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setWonderPick(opt.id); }}>
                <View style={[nwStyles.wonderRadio, picked && nwStyles.wonderRadioFilled]} />
                <Text style={[nwStyles.wonderOptionText, picked && nwStyles.wonderOptionTextPicked]}>{opt.text}</Text>
              </Pressable>
            ); })}
          </View>
          {wonderPick && <Pressable style={nwStyles.nextBtn} onPress={() => transition('reveal')}><Text style={nwStyles.nextBtnText}>Show me what happens →</Text></Pressable>}
        </Animated.View>
      )}
      {phase === 'reveal' && (
        <Animated.View style={[nwStyles.phaseWrap, { opacity: phaseAnim }]}>
          <View style={[nwStyles.phaseBadge, nwStyles.phaseBadgeReveal]}><Text style={[nwStyles.phaseBadgeText, { color: Colors.info }]}>REVEAL</Text></View>
          {wonderPick && (
            <View style={[nwStyles.guessFeedback, guessedRight ? nwStyles.guessFeedbackRight : nwStyles.guessFeedbackWrong]}>
              <Ionicons name={guessedRight?'checkmark-circle':'information-circle'} size={16} color={guessedRight?Colors.primary:Colors.warning} />
              <Text style={[nwStyles.guessFeedbackText, { color: guessedRight?Colors.primary:Colors.warning }]}>{guessedRight ? 'Your prediction was right.' : 'Here is what actually happens.'}</Text>
            </View>
          )}
          <View style={nwStyles.revealCard}><Text style={nwStyles.revealText}>{step.reveal ?? ''}</Text></View>
          {noticePicks.length > 0 && <View style={nwStyles.noticeRecap}><Text style={nwStyles.noticeRecapLabel}>YOU NOTICED</Text><View style={nwStyles.noticeRecapChips}>{noticePicks.map((item, i) => <View key={i} style={nwStyles.noticeRecapChip}><Text style={nwStyles.noticeRecapChipText}>{item}</Text></View>)}</View></View>}
          {(step.reveal_cue ?? step.cue ?? '') !== '' && <View style={nwStyles.cueBox}><Text style={nwStyles.cueLabel}>LOCK IN YOUR CUE</Text><Text style={nwStyles.cueText}>{step.reveal_cue ?? step.cue}</Text></View>}
          <Pressable style={[nwStyles.nextBtn, { backgroundColor: Colors.primary }]} onPress={onAdvance}><Text style={nwStyles.nextBtnText}>Locked in →</Text></Pressable>
        </Animated.View>
      )}
    </View>
  );
}

function StepRenderer({ step, onAdvance }: { step: any; onAdvance: (passed?: boolean) => void }) {
  if (step.ui_variant) return <View style={stepStyles.container}><VariantRenderer step={step} onAdvance={onAdvance} /></View>;
  const adv = () => onAdvance();
  switch (step.type ?? '') {
    case 'spark': case 'text': case 'action': return <SparkStep step={step} onAdvance={adv} />;
    case 'choice': case 'scenario': case 'scenario_pick': case 'decision': case 'freeze_frame': return <ChoiceStep step={step} onAdvance={adv} />;
    case 'checklist': case 'quick_reset': return <ChecklistStep step={step} onAdvance={adv} />;
    case 'cue': case 'visualization': case 'reframe_builder': case 'pressureRep': return <VisualizationStep step={step} onAdvance={adv} />;
    case 'timer': case 'pressure_rep': return <TimerStep step={step} onAdvance={adv} />;
    case 'reflection': return <ReflectionStep step={step} onAdvance={adv} />;
    case 'feedback': case 'reward': return <FeedbackStep step={step} onAdvance={adv} />;
    case 'notice_wonder': return <NoticeWonderStep step={step} onAdvance={adv} />;
    default: return <SparkStep step={step} onAdvance={adv} />;
  }
}

function CompletionOverlay({ lesson, passed, onClose }: { lesson: any; passed: boolean; onClose: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const xpBounce = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Haptics.notificationAsync(passed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue:1, tension:80, friction:8, useNativeDriver:true }),
      Animated.timing(fadeAnim, { toValue:1, duration:300, useNativeDriver:true }),
    ]).start(() => Animated.spring(xpBounce, { toValue:1, tension:100, friction:6, useNativeDriver:true }).start());
  }, []);
  const xp = passed ? (lesson?.xp_reward ?? 50) : Math.floor((lesson?.xp_reward ?? 50) * 0.5);
  return (
    <Animated.View style={[completionStyles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[completionStyles.card, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[completionStyles.xpBurst, { transform:[{ scale:xpBounce }] }, !passed && completionStyles.xpBurstPartial]}>
          <Ionicons name="flash" size={28} color={Colors.background} />
          <Text style={completionStyles.xpNum}>+{xp}</Text>
          <Text style={completionStyles.xpLabel}>XP</Text>
        </Animated.View>
        <Text style={completionStyles.title}>{passed ? 'Rep Complete.' : 'Keep Working.'}</Text>
        <Text style={completionStyles.feedback}>{passed ? 'Rep complete. Keep stacking.' : 'Good effort. Come back and run it again.'}</Text>
        {!passed && (
          <Pressable style={completionStyles.retryBtn} onPress={() => router.replace(`/lesson/${lesson?.id}`)}>
            <Ionicons name="refresh" size={16} color={Colors.primary} />
            <Text style={completionStyles.retryBtnText}>Run it again</Text>
          </Pressable>
        )}
        <Pressable style={completionStyles.nextBtn} onPress={onClose}>
          <Text style={completionStyles.nextBtnText}>{passed ? 'Back to Career →' : 'Continue anyway →'}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function LessonPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { athleteState, completeLesson, updateAthleteState } = useAthlete();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [sessionPassed, setSessionPassed] = useState(true);
  const [completionStage, setCompletionStage] = useState<'none'|'check_in'|'overlay'>('none');

  // ── CRITICAL FIX: prevent advanceStep from firing after lesson is done ─────
  const completionTriggered = useRef(false);

  const stepFade = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error: err } = await supabase.from('legacy_lessons_staging').select('*').eq('id', id).single();
        if (err || !data) {
          const { data: cc, error: err2 } = await supabase.from('content_cards').select('*').eq('id', id).single();
          if (err2 || !cc) throw new Error('Lesson not found');
          setLesson(cc);
        } else { setLesson(data); }
      } catch (e: any) { setError(e.message ?? 'Failed to load'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const steps: any[] = lesson?.steps ?? [];
  const totalSteps = steps.length;

  useEffect(() => {
    if (totalSteps === 0) return;
    Animated.spring(progressAnim, { toValue: (stepIndex + 1) / totalSteps, tension:60, friction:10, useNativeDriver:false }).start();
  }, [stepIndex, totalSteps]);

  const advanceStep = useCallback((passed?: boolean) => {
    // ── Never advance if completion already triggered (prevents blank screen) ─
    if (completionTriggered.current) return;
    if (passed === false) setSessionPassed(false);

    if (stepIndex >= totalSteps - 1) {
      completionTriggered.current = true; // lock it
      const xp = lesson?.xp_reward ?? 50;
      const finalPassed = passed !== false && sessionPassed;
      if (athleteState && lesson) completeLesson(lesson.id ?? id, finalPassed ? xp : Math.floor(xp * 0.5));
      if (lesson?.is_boss || lesson?.is_checkpoint) { setCompletionStage('check_in'); }
      else { setCompletionStage('overlay'); }
      return;
    }

    Animated.timing(stepFade, { toValue:0, duration:120, useNativeDriver:true }).start(() => {
      setStepIndex((s) => s + 1);
      Animated.timing(stepFade, { toValue:1, duration:200, useNativeDriver:true }).start();
    });
    Haptics.selectionAsync();
  }, [stepIndex, totalSteps, lesson, athleteState, completeLesson, id, sessionPassed]);

  async function handleRatingsSubmit(ratings: Record<string, number>) {
    if (!athleteState) { setCompletionStage('overlay'); return; }
    const current = athleteState.self_ratings;
    const merged: any = { ...current };
    Object.entries(ratings).forEach(([key, val]) => { const existing = (current as any)[key] ?? 3; merged[key] = Math.round((val * 0.6 + existing * 0.4) * 10) / 10; });
    await updateAthleteState({ self_ratings: merged });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompletionStage('overlay');
  }

  function handleExit() {
    if (completionStage !== 'none' || stepIndex === 0) { router.back(); return; }
    Alert.alert('Exit lesson?', "Progress won't be saved.", [{ text: 'Keep going', style:'cancel' }, { text:'Exit', style:'destructive', onPress: () => router.back() }]);
  }

  if (loading) return <View style={[styles.center, { paddingTop:insets.top }]}><Text style={styles.loadingText}>Loading rep...</Text></View>;
  if (error || !lesson) return <View style={[styles.center, { paddingTop:insets.top }]}><Text style={styles.errorText}>{error ?? 'Lesson not found'}</Text><Pressable style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backBtnText}>← Go back</Text></Pressable></View>;
  if (totalSteps === 0) return (
    <View style={[styles.container, { paddingTop:insets.top }]}>
      <View style={styles.header}><Pressable onPress={handleExit} hitSlop={12} style={styles.closeBtn}><Ionicons name="close" size={22} color={Colors.textSecondary} /></Pressable></View>
      <View style={styles.center}><Text style={styles.loadingText}>No steps in this lesson yet.</Text><Pressable style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backBtnText}>← Go back</Text></Pressable></View>
    </View>
  );

  // ── Safety clamp: never render undefined step ────────────────────────────────
  const safeIndex = Math.min(stepIndex, totalSteps - 1);
  const currentStep = steps[safeIndex] ?? null;

  const lessonFamily = lesson.lesson_family ?? lesson.pillar_id ?? 'Spark Card';
  const durationMin = Math.ceil((lesson.duration_sec ?? lesson.expected_time_sec ?? 90) / 60);
  const roleTag = (lesson.role_tags ?? [])[0] ?? '';
  const difficulty = lesson.difficulty_tier ?? lesson.difficulty ?? '';

  return (
    <View style={[styles.container, { paddingTop:insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={handleExit} hitSlop={12} style={styles.closeBtn}><Ionicons name="close" size={22} color={Colors.textSecondary} /></Pressable>
        <View style={styles.headerMeta}>
          {roleTag !== '' && <View style={styles.roleTag}><Text style={styles.roleTagText}>{roleTag.toUpperCase()}</Text></View>}
          {currentStep?.ui_variant && <View style={styles.interactiveBadge}><Ionicons name="game-controller" size={10} color={Colors.purple} /><Text style={styles.interactiveBadgeText}>INTERACTIVE</Text></View>}
          {lesson.is_boss && <View style={styles.bossBadge}><Ionicons name="trophy" size={10} color={Colors.warning} /><Text style={styles.bossBadgeText}>BOSS</Text></View>}
          {lesson.is_checkpoint && !lesson.is_boss && <View style={styles.checkpointBadge}><Ionicons name="flag" size={10} color={Colors.info} /><Text style={styles.checkpointBadgeText}>CHECKPOINT</Text></View>}
          {difficulty !== '' && <Text style={styles.difficultyText}>{difficulty}</Text>}
          <Text style={styles.durationText}>{durationMin} min</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }), backgroundColor: lesson.is_boss ? Colors.warning : lesson.is_checkpoint ? Colors.info : Colors.primary }]} />
      </View>

      {safeIndex === 0 && (
        <View style={styles.lessonHeader}>
          <Text style={styles.familyLabel}>{lessonFamily.toUpperCase()}</Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          {lesson.subtitle && <Text style={styles.lessonSubtitle}>{lesson.subtitle}</Text>}
        </View>
      )}

      <View style={styles.stepCounter}>
        <Text style={styles.stepCounterText}>{safeIndex + 1} / {totalSteps}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: stepFade }}>
          {currentStep && <StepRenderer step={currentStep} onAdvance={advanceStep} />}
        </Animated.View>
      </ScrollView>

      {completionStage === 'check_in' && <SelfRatingCheckIn role={athleteState?.primary_role ?? 'default'} lessonTitle={lesson.title} isBoss={!!lesson.is_boss} onSubmit={handleRatingsSubmit} />}
      {completionStage === 'overlay' && <CompletionOverlay lesson={lesson} passed={sessionPassed} onClose={() => router.back()} />}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:Colors.background },
  center: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:Colors.background, gap:Spacing.lg, paddingHorizontal:Spacing.xl },
  loadingText: { fontSize:16, fontFamily:'Inter_400Regular', color:Colors.textSecondary },
  errorText: { fontSize:15, fontFamily:'Inter_400Regular', color:Colors.danger, textAlign:'center' },
  backBtn: { paddingHorizontal:Spacing.lg, paddingVertical:Spacing.sm },
  backBtnText: { fontSize:15, fontFamily:'Inter_600SemiBold', color:Colors.primary },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.xl, paddingVertical:Spacing.md },
  closeBtn: { width:36, height:36, alignItems:'center', justifyContent:'center', backgroundColor:Colors.surface, borderRadius:Radius.sm, borderWidth:1, borderColor:Colors.border },
  headerMeta: { flexDirection:'row', alignItems:'center', gap:Spacing.sm },
  roleTag: { backgroundColor:Colors.primaryMuted, borderRadius:Radius.pill, paddingHorizontal:Spacing.sm, paddingVertical:3, borderWidth:1, borderColor:Colors.primaryBorder },
  roleTagText: { fontSize:10, fontFamily:'Inter_700Bold', color:Colors.primary, letterSpacing:0.8 },
  interactiveBadge: { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:Colors.purpleMuted, borderRadius:Radius.pill, paddingHorizontal:Spacing.sm, paddingVertical:3, borderWidth:1, borderColor:`${Colors.purple}40` },
  interactiveBadgeText: { fontSize:9, fontFamily:'Inter_700Bold', color:Colors.purple, letterSpacing:0.8 },
  bossBadge: { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:Colors.warningMuted, borderRadius:Radius.pill, paddingHorizontal:Spacing.sm, paddingVertical:3, borderWidth:1, borderColor:`${Colors.warning}50` },
  bossBadgeText: { fontSize:9, fontFamily:'Inter_700Bold', color:Colors.warning, letterSpacing:0.8 },
  checkpointBadge: { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:Colors.infoMuted, borderRadius:Radius.pill, paddingHorizontal:Spacing.sm, paddingVertical:3, borderWidth:1, borderColor:`${Colors.info}50` },
  checkpointBadgeText: { fontSize:9, fontFamily:'Inter_700Bold', color:Colors.info, letterSpacing:0.8 },
  difficultyText: { fontSize:11, fontFamily:'Inter_400Regular', color:Colors.textTertiary, textTransform:'capitalize' },
  durationText: { fontSize:11, fontFamily:'Inter_400Regular', color:Colors.textTertiary },
  progressTrack: { height:3, backgroundColor:Colors.border, marginHorizontal:Spacing.xl, borderRadius:2 },
  progressFill: { height:3, borderRadius:2 },
  lessonHeader: { paddingHorizontal:Spacing.xl, paddingTop:Spacing.lg, paddingBottom:Spacing.sm, gap:4 },
  familyLabel: { fontSize:10, fontFamily:'Inter_700Bold', color:Colors.primary, letterSpacing:1.2, marginBottom:2 },
  lessonTitle: { fontSize:24, fontFamily:'Inter_700Bold', color:Colors.textPrimary, lineHeight:30 },
  lessonSubtitle: { fontSize:14, fontFamily:'Inter_400Regular', color:Colors.textSecondary, lineHeight:20, marginTop:2 },
  stepCounter: { paddingHorizontal:Spacing.xl, paddingTop:Spacing.sm },
  stepCounterText: { fontSize:11, fontFamily:'Inter_600SemiBold', color:Colors.textTertiary, letterSpacing:0.5 },
  scroll: { flex:1 },
  scrollContent: { paddingHorizontal:Spacing.xl, paddingTop:Spacing.lg, paddingBottom:60 },
});

const stepStyles = StyleSheet.create({
  container: { gap:Spacing.lg },
  sparkAccent: { width:32, height:3, backgroundColor:Colors.primary, borderRadius:2, marginBottom:Spacing.sm },
  sparkContent: { fontSize:18, fontFamily:'Inter_500Medium', color:Colors.textPrimary, lineHeight:28 },
  cueBox: { backgroundColor:Colors.primaryMuted, borderRadius:Radius.md, padding:Spacing.lg, borderWidth:1, borderColor:Colors.primaryBorder, gap:4 },
  cueLabel: { fontSize:10, fontFamily:'Inter_700Bold', color:Colors.primary, letterSpacing:1 },
  cueText: { fontSize:15, fontFamily:'Inter_600SemiBold', color:Colors.textPrimary, lineHeight:22 },
  actionBox: { flexDirection:'row', alignItems:'flex-start', gap:Spacing.sm, backgroundColor:Colors.surface, borderRadius:Radius.md, padding:Spacing.lg, borderWidth:1, borderColor:Colors.border },
  actionText: { fontSize:14, fontFamily:'Inter_400Regular', color:Colors.textSecondary, flex:1, lineHeight:20 },
  choicePrompt: { fontSize:17, fontFamily:'Inter_600SemiBold', color:Colors.textPrimary, lineHeight:24 },
  choiceList: { gap:Spacing.sm },
  choiceBtn: { borderRadius:Radius.md, borderWidth:1.5, padding:Spacing.lg, gap:4, backgroundColor:Colors.surface, borderColor:Colors.border },
  choiceText: { fontSize:15, fontFamily:'Inter_500Medium', color:Colors.textPrimary, lineHeight:22 },
  choiceFeedback: { fontSize:13, fontFamily:'Inter_400Regular', lineHeight:18, marginTop:4 },
  checkList: { gap:Spacing.sm },
  checkRow: { flexDirection:'row', alignItems:'flex-start', gap:Spacing.md, backgroundColor:Colors.surface, borderRadius:Radius.md, padding:Spacing.lg, borderWidth:1, borderColor:Colors.border },
  checkBox: { width:22, height:22, borderRadius:6, borderWidth:1.5, borderColor:Colors.border, alignItems:'center', justifyContent:'center', marginTop:1 },
  checkBoxDone: { backgroundColor:Colors.primary, borderColor:Colors.primary },
  checkText: { fontSize:14, fontFamily:'Inter_400Regular', color:Colors.textPrimary, flex:1, lineHeight:20 },
  checkTextDone: { color:Colors.textTertiary, textDecorationLine:'line-through' },
  vizOrb: { width:80, height:80, borderRadius:40, backgroundColor:Colors.primaryMuted, borderWidth:2, borderColor:Colors.primaryBorder, alignItems:'center', justifyContent:'center', alignSelf:'center' },
  vizBody: { fontSize:17, fontFamily:'Inter_500Medium', color:Colors.textPrimary, lineHeight:26, textAlign:'center' },
  timerRing: { width:120, height:120, borderRadius:60, borderWidth:4, borderColor:Colors.border, alignItems:'center', justifyContent:'center', alignSelf:'center' },
  timerNum: { fontSize:36, fontFamily:'Inter_700Bold', color:Colors.textPrimary, lineHeight:40 },
  timerLabel: { fontSize:12, fontFamily:'Inter_400Regular', color:Colors.textTertiary },
  timerRunning: { fontSize:16, fontFamily:'Inter_600SemiBold', color:Colors.primary, textAlign:'center', letterSpacing:1 },
  reflectIcon: { width:52, height:52, borderRadius:26, backgroundColor:Colors.warningMuted, alignItems:'center', justifyContent:'center', alignSelf:'center' },
  feedbackCard: { alignItems:'center', gap:Spacing.md, padding:Spacing.xl, backgroundColor:Colors.primaryMuted, borderRadius:Radius.lg, borderWidth:1, borderColor:Colors.primaryBorder },
  feedbackText: { fontSize:16, fontFamily:'Inter_500Medium', color:Colors.textPrimary, textAlign:'center', lineHeight:24 },
  advanceBtn: { backgroundColor:Colors.primary, borderRadius:Radius.lg, paddingVertical:Spacing.lg, alignItems:'center', marginTop:Spacing.sm },
  advanceBtnDisabled: { backgroundColor:Colors.surfaceElevated },
  advanceBtnText: { fontSize:16, fontFamily:'Inter_700Bold', color:Colors.background, letterSpacing:0.3 },
});

const nwStyles = StyleSheet.create({
  container: { gap:Spacing.lg },
  phaseWrap: { gap:Spacing.lg },
  phaseBadge: { alignSelf:'flex-start', backgroundColor:Colors.primaryMuted, borderRadius:Radius.pill, paddingHorizontal:Spacing.md, paddingVertical:4, borderWidth:1, borderColor:Colors.primaryBorder },
  phaseBadgeWonder: { backgroundColor:Colors.warningMuted, borderColor:`${Colors.warning}40` },
  phaseBadgeReveal: { backgroundColor:Colors.infoMuted, borderColor:`${Colors.info}40` },
  phaseBadgeText: { fontSize:10, fontFamily:'Inter_700Bold', color:Colors.primary, letterSpacing:1.5 },
  situationLabel: { fontSize:10, fontFamily:'Inter_700Bold', color:Colors.textTertiary, letterSpacing:1 },
  situationCard: { backgroundColor:Colors.surface, borderRadius:Radius.lg, borderWidth:1.5, borderColor:Colors.border, borderLeftWidth:4, borderLeftColor:Colors.primary, padding:Spacing.lg },
  situationText: { fontSize:16, fontFamily:'Inter_500Medium', color:Colors.textPrimary, lineHeight:24 },
  instruct: { fontSize:13, fontFamily:'Inter_400Regular', color:Colors.textSecondary, lineHeight:19 },
  chipGrid: { flexDirection:'row', flexWrap:'wrap', gap:Spacing.sm },
  chip: { flexDirection:'row', alignItems:'center', paddingHorizontal:Spacing.md, paddingVertical:Spacing.sm, borderRadius:Radius.pill, borderWidth:1.5, borderColor:Colors.border, backgroundColor:Colors.surface },
  chipPicked: { borderColor:Colors.primary, backgroundColor:Colors.primaryMuted },
  chipText: { fontSize:13, fontFamily:'Inter_500Medium', color:Colors.textSecondary },
  chipTextPicked: { color:Colors.primary, fontFamily:'Inter_600SemiBold' },
  wonderPrompt: { fontSize:17, fontFamily:'Inter_600SemiBold', color:Colors.textPrimary, lineHeight:24 },
  wonderOptions: { gap:Spacing.sm },
  wonderOption: { flexDirection:'row', alignItems:'center', gap:Spacing.md, backgroundColor:Colors.surface, borderRadius:Radius.md, padding:Spacing.lg, borderWidth:1.5, borderColor:Colors.border },
  wonderOptionPicked: { borderColor:Colors.warning, backgroundColor:Colors.warningMuted },
  wonderRadio: { width:20, height:20, borderRadius:10, borderWidth:2, borderColor:Colors.border },
  wonderRadioFilled: { borderColor:Colors.warning, backgroundColor:Colors.warning },
  wonderOptionText: { fontSize:15, fontFamily:'Inter_400Regular', color:Colors.textPrimary, flex:1 },
  wonderOptionTextPicked: { fontFamily:'Inter_600SemiBold', color:Colors.textPrimary },
  guessFeedback: { flexDirection:'row', alignItems:'center', gap:Spacing.sm, padding:Spacing.md, borderRadius:Radius.md, borderWidth:1 },
  guessFeedbackRight: { backgroundColor:Colors.primaryMuted, borderColor:Colors.primaryBorder },
  guessFeedbackWrong: { backgroundColor:Colors.warningMuted, borderColor:`${Colors.warning}40` },
  guessFeedbackText: { fontSize:13, fontFamily:'Inter_600SemiBold', flex:1 },
  revealCard: { backgroundColor:Colors.surface, borderRadius:Radius.lg, borderWidth:1, borderColor:Colors.border, borderLeftWidth:4, borderLeftColor:Colors.info, padding:Spacing.lg },
  revealText: { fontSize:16, fontFamily:'Inter_500Medium', color:Colors.textPrimary, lineHeight:25 },
  noticeRecap: { gap:6 },
  noticeRecapLabel: { fontSize:9, fontFamily:'Inter_700Bold', color:Colors.textTertiary, letterSpacing:1.2 },
  noticeRecapChips: { flexDirection:'row', flexWrap:'wrap', gap:5 },
  noticeRecapChip: { backgroundColor:Colors.primaryMuted, borderRadius:Radius.pill, paddingHorizontal:Spacing.sm, paddingVertical:3, borderWidth:1, borderColor:Colors.primaryBorder },
  noticeRecapChipText: { fontSize:11, fontFamily:'Inter_600SemiBold', color:Colors.primary },
  cueBox: { backgroundColor:Colors.primaryMuted, borderRadius:Radius.md, padding:Spacing.lg, borderWidth:1, borderColor:Colors.primaryBorder, gap:4 },
  cueLabel: { fontSize:9, fontFamily:'Inter_700Bold', color:Colors.primary, letterSpacing:1 },
  cueText: { fontSize:15, fontFamily:'Inter_600SemiBold', color:Colors.textPrimary, lineHeight:22 },
  nextBtn: { backgroundColor:Colors.primary, borderRadius:Radius.lg, paddingVertical:Spacing.lg, alignItems:'center' },
  nextBtnDisabled: { backgroundColor:Colors.surfaceElevated },
  nextBtnText: { fontSize:16, fontFamily:'Inter_700Bold', color:Colors.background },
});

const completionStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.88)', alignItems:'center', justifyContent:'center', padding:Spacing.xl, zIndex:100 },
  card: { backgroundColor:Colors.surface, borderRadius:Radius.xl, borderWidth:1, borderColor:Colors.primaryBorder, padding:Spacing.xxxl, alignItems:'center', gap:Spacing.lg, width:'100%' },
  xpBurst: { width:88, height:88, borderRadius:44, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  xpBurstPartial: { backgroundColor:Colors.warning },
  xpNum: { fontSize:20, fontFamily:'Inter_700Bold', color:Colors.background, lineHeight:22 },
  xpLabel: { fontSize:11, fontFamily:'Inter_700Bold', color:Colors.background, letterSpacing:1, lineHeight:14 },
  title: { fontSize:26, fontFamily:'Inter_700Bold', color:Colors.textPrimary, textAlign:'center' },
  feedback: { fontSize:15, fontFamily:'Inter_400Regular', color:Colors.textSecondary, textAlign:'center', lineHeight:22 },
  retryBtn: { flexDirection:'row', alignItems:'center', gap:Spacing.sm, backgroundColor:Colors.primaryMuted, borderRadius:Radius.lg, paddingVertical:Spacing.md, paddingHorizontal:Spacing.xl, borderWidth:1, borderColor:Colors.primaryBorder },
  retryBtnText: { fontSize:14, fontFamily:'Inter_600SemiBold', color:Colors.primary },
  nextBtn: { backgroundColor:Colors.primary, borderRadius:Radius.lg, paddingVertical:Spacing.lg, paddingHorizontal:Spacing.xxl, marginTop:Spacing.sm, width:'100%', alignItems:'center' },
  nextBtnText: { fontSize:16, fontFamily:'Inter_700Bold', color:Colors.background },
});

const checkInStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.92)', alignItems:'center', justifyContent:'center', padding:Spacing.xl, zIndex:100 },
  card: { backgroundColor:Colors.surface, borderRadius:Radius.xl, borderWidth:1, borderColor:Colors.border, padding:Spacing.xl, width:'100%', gap:Spacing.lg },
  headerRow: { flexDirection:'row', alignItems:'center', gap:Spacing.md },
  iconWrap: { width:40, height:40, borderRadius:20, backgroundColor:Colors.warningMuted, alignItems:'center', justifyContent:'center', flexShrink:0 },
  eyebrow: { fontSize:9, fontFamily:'Inter_700Bold', color:Colors.textTertiary, letterSpacing:1.2 },
  title: { fontSize:16, fontFamily:'Inter_700Bold', color:Colors.textPrimary, marginTop:2 },
  divider: { height:1, backgroundColor:Colors.border },
  prompt: { fontSize:13, fontFamily:'Inter_400Regular', color:Colors.textSecondary, lineHeight:20, textAlign:'center' },
  questions: { gap:Spacing.lg },
  questionRow: { gap:Spacing.sm },
  questionText: { fontSize:14, fontFamily:'Inter_500Medium', color:Colors.textPrimary, lineHeight:20 },
  submitBtn: { backgroundColor:Colors.primary, borderRadius:Radius.lg, paddingVertical:Spacing.lg, alignItems:'center' },
  submitBtnDisabled: { backgroundColor:Colors.surfaceElevated },
  submitBtnBoss: { backgroundColor:Colors.warning },
  submitBtnText: { fontSize:15, fontFamily:'Inter_700Bold', color:Colors.background },
  hint: { fontSize:11, fontFamily:'Inter_400Regular', color:Colors.textTertiary, textAlign:'center', lineHeight:16 },
});

const ratingStyles = StyleSheet.create({
  dotsRow: { flexDirection:'row', alignItems:'center', gap:Spacing.sm },
  dot: { width:28, height:28, borderRadius:14, borderWidth:2, alignItems:'center', justifyContent:'center' },
  dotFill: { width:10, height:10, borderRadius:5 },
  dotLabel: { fontSize:12, fontFamily:'Inter_600SemiBold', color:Colors.textTertiary, marginLeft:4, minWidth:40 },
});
