import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import type { SeasonPhase } from '@/context/AthleteContext';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { ClutchrHeader } from '@/components/ClutchrHeader';
import { getBestCue } from '@/lib/personalCue';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Bucket = 'pregame' | 'ingame' | 'between' | 'postgame';
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
  // State tags — used for smart surfacing
  state_tags?: Array<'slump' | 'return_to_throw' | 'preseason' | 'offseason' | 'nerves' | 'error' | 'postgame_tough'>;
}

// ─── ALL TOOLS ────────────────────────────────────────────────────────────────

const GAME_TOOLS: GameTool[] = [

  // ── PRE-GAME ─────────────────────────────────────────────────────────────
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
    roles: ['infielder', 'outfielder', 'catcher'],
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
    state_tags: ['nerves', 'preseason'],
    steps: [
      { cue: 'FEEL IT', instruction: 'Notice where it lives. Chest tight? Stomach? Hands? Identify it. You cannot manage what you have not noticed.' },
      { cue: 'RENAME IT', instruction: 'That feeling is not fear. That is your body preparing to compete. Heart rate up, focus narrowing — that is called ready.' },
      { cue: 'BREATHE INTO IT', instruction: 'Breathe into the tightness. One slow breath directly into that spot.', timer: 8 },
      { cue: 'CHANNEL IT', instruction: 'Every great player you respect has felt exactly this. They used it. Say it: "I am not nervous. I am ready."' },
      { cue: 'GO COMPETE', instruction: 'Step onto the field with that energy. Not despite it. Because of it.' },
    ],
    printCue: 'FEEL IT · RENAME IT · BREATHE · GO',
  },
  {
    id: 'slump_pregame',
    name: 'Slump Pregame Reset',
    tagline: 'One process. One at-bat. One pitch.',
    icon: 'refresh',
    color: Colors.warning,
    bucket: 'pregame',
    roles: 'all',
    mode: 'interactive',
    duration: '2 min',
    whenToUse: 'When you are in a slump and struggling to get mentally ready.',
    state_tags: ['slump'],
    steps: [
      { cue: 'SHRINK IT', instruction: 'Stop thinking about the slump. Your only job today is one quality at-bat. Not the stats. Not the streak. One at-bat.' },
      { cue: 'ONE PROCESS GOAL', instruction: 'Name your process goal for today: "See the ball early." "Stay back." "Attack first pitch." One. That is it.' },
      { cue: 'BREATHE', instruction: 'Four counts in. Four counts out. Reset the nervous system.', timer: 16 },
      { cue: 'REMEMBER WHO YOU ARE', instruction: 'You have done this before. You have had good at-bats. Name one. That player shows up today.' },
      { cue: 'COMPETE', instruction: 'Slumps end when you stop chasing them and start competing. Do that today.' },
    ],
    printCue: 'SHRINK IT · ONE GOAL · BREATHE · COMPETE',
  },

  // ── IN-GAME ───────────────────────────────────────────────────────────────
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
    roles: ['infielder', 'outfielder', 'catcher'],
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
    roles: ['infielder', 'outfielder', 'catcher'],
    mode: 'print_card',
    duration: '15 sec',
    whenToUse: 'Immediately after striking out. The walk back is your reset window.',
    state_tags: ['slump'],
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
    state_tags: ['error'],
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
    roles: ['infielder', 'outfielder', 'catcher'],
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

  // ── BETWEEN INNINGS ───────────────────────────────────────────────────────
  {
    id: 'between_inning_pitcher',
    name: 'Inning Transition',
    tagline: 'Close the inning. Open the next one clean.',
    icon: 'refresh-circle',
    color: Colors.primary,
    bucket: 'between',
    roles: ['pitcher'],
    mode: 'print_card',
    duration: '60 sec',
    whenToUse: 'Walking off the mound between innings. Before you sit down.',
    steps: [
      { cue: 'CLOSE IT', instruction: 'That inning is done. Good or bad — it is closed. Walk off with your chin up.' },
      { cue: 'ONE WIN', instruction: 'Name one pitch or play that worked. Lock it in. That goes with you next inning.' },
      { cue: 'ONE FIX', instruction: 'Name one thing to adjust. One. Not three. Not your whole mechanics. One thing.' },
      { cue: 'RESET BREATH', instruction: 'One slow exhale on the bench. Clear the slate.' },
      { cue: 'NEXT INNING PLAN', instruction: 'First hitter next inning: what is your plan? First pitch. Attack it.' },
    ],
    printCue: 'CLOSE IT · ONE WIN · ONE FIX · NEXT PLAN',
  },
  {
    id: 'between_inning_defense',
    name: 'Dugout Reset',
    tagline: 'Come in locked. Go out ready.',
    icon: 'people',
    color: Colors.info,
    bucket: 'between',
    roles: ['infielder', 'outfielder', 'catcher'],
    mode: 'print_card',
    duration: '60 sec',
    whenToUse: 'Between every defensive inning. In the dugout before going back out.',
    steps: [
      { cue: 'SHAKE IT OFF', instruction: 'Transition from offense to defense. Physically shake your hands. Clear mode.' },
      { cue: 'SITUATION CHECK', instruction: 'Who is up? What is the score? What are the outs? Know the situation before the first pitch.' },
      { cue: 'YOUR ASSIGNMENT', instruction: 'Name your first priority. Cutoff position. Bunt coverage. First step read on a line drive.' },
      { cue: 'BODY LANGUAGE', instruction: 'Chin up. Eyes forward. Walk to your position like you own it.' },
      { cue: 'READY HOP', instruction: 'Set your ready position before every pitch. Every single one.' },
    ],
    printCue: 'SHAKE OFF · SITUATION · ASSIGNMENT · READY',
  },
  {
    id: 'between_long_inning',
    name: 'Long Inning Focus Reset',
    tagline: 'Long inning in the dugout? Re-lock before you go back out.',
    icon: 'hourglass',
    color: Colors.warning,
    bucket: 'between',
    roles: 'all',
    mode: 'print_card',
    duration: '30 sec',
    whenToUse: 'After a long at-bat inning when focus can drift.',
    steps: [
      { cue: 'NOTICE THE DRIFT', instruction: 'Long inning. Mind wandered. That is normal. Notice it without judgment.' },
      { cue: 'ONE BREATH', instruction: 'Single exhale. Restart the focus clock.' },
      { cue: 'NEXT PITCH ONLY', instruction: 'Your only job when you walk back out: be ready for pitch one.' },
      { cue: 'EYES UP', instruction: 'Look at the field. See the grass. Get your eyes out of your head.' },
    ],
    printCue: 'NOTICE · BREATHE · NEXT PITCH · EYES UP',
  },
  {
    id: 'between_slump_reset',
    name: 'Mid-Game Slump Shrink',
    tagline: 'One at-bat is not the whole season.',
    icon: 'trending-up',
    color: Colors.primary,
    bucket: 'between',
    roles: 'all',
    mode: 'print_card',
    duration: '45 sec',
    whenToUse: 'Between innings when the slump is weighing on you mid-game.',
    state_tags: ['slump'],
    steps: [
      { cue: 'SHRINK THE PROBLEM', instruction: 'You are not in a slump in this at-bat. This at-bat has not happened yet.' },
      { cue: 'ONE PROCESS GOAL', instruction: '"See the ball early." "Stay back." "Take a pitch." Pick one. That is your whole job.' },
      { cue: 'EXHALE HARD', instruction: 'Exhale everything. Big release breath.' },
      { cue: 'NEXT AT-BAT', instruction: 'Clean slate. Same player. Better information.' },
    ],
    printCue: 'SHRINK IT · ONE GOAL · EXHALE · CLEAN SLATE',
  },
  {
    id: 'between_battery_sync',
    name: 'Battery Sync',
    tagline: 'Stay on the same page between innings.',
    icon: 'sync',
    color: Colors.purple,
    bucket: 'between',
    roles: ['pitcher', 'catcher'],
    mode: 'print_card',
    duration: '30 sec',
    whenToUse: 'Quick communication check between pitcher and catcher each inning.',
    steps: [
      { cue: "WHAT'S WORKING", instruction: 'Catcher: name the one pitch that has been most effective this inning.' },
      { cue: "WHAT'S NOT", instruction: 'Name one pitch to stay away from or adjust. One only.' },
      { cue: 'NEXT 3 HITTERS', instruction: 'Quick mental scan: who is up? What did they struggle with last time?' },
      { cue: 'ONE WORD', instruction: 'Set the tone for next inning together. "Attack." "Slow." "Trust." Say it together.' },
    ],
    printCue: "WHAT'S WORKING · ADJUST · NEXT 3 · ONE WORD",
  },

  // ── POST-GAME ─────────────────────────────────────────────────────────────
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
    state_tags: ['slump', 'postgame_tough'],
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
    state_tags: ['return_to_throw'],
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
    roles: ['infielder', 'outfielder', 'catcher'],
    mode: 'interactive',
    duration: '3 min',
    whenToUse: 'After every game. Your non-negotiable recovery routine.',
    state_tags: ['return_to_throw'],
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

// ─── BUCKET META ─────────────────────────────────────────────────────────────

const BUCKET_META: Record<Bucket, {
  icon: string; color: string; label: string;
  headline: string; subtext: string; phoneOk: boolean;
}> = {
  pregame: {
    icon: 'sunny', color: Colors.primary,
    label: 'PRE',
    headline: 'Phone OK before first pitch.',
    subtext: 'Run these in the dugout or locker room before warmups.',
    phoneOk: true,
  },
  ingame: {
    icon: 'baseball', color: Colors.warning,
    label: 'LIVE',
    headline: 'No phone on the field.',
    subtext: 'Generate your print card. Screenshot and fold to index card size. Keep in your bat bag.',
    phoneOk: false,
  },
  between: {
    icon: 'hourglass', color: Colors.info,
    label: 'BTW',
    headline: 'Between innings — 60 seconds.',
    subtext: 'Print card or quick glance. Close the inning. Open the next one clean.',
    phoneOk: false,
  },
  postgame: {
    icon: 'moon', color: Colors.purple,
    label: 'POST',
    headline: 'Phone OK after the final out.',
    subtext: 'Process the game, recover the body, reset for tomorrow.',
    phoneOk: true,
  },
};

// ─── STATE-AWARE SURFACING ────────────────────────────────────────────────────
// Returns { banner, tools } — banner explains why these are surfaced,
// tools is an ordered list of suggested tools for this athlete's state.

interface SurfacedSet {
  banner: { icon: string; color: string; headline: string; sub: string } | null;
  tools: GameTool[];
}

function getSuggestedTools(
  role: RoleKey,
  phase: SeasonPhase,
  struggles: string[]
): SurfacedSet {
  const all = GAME_TOOLS;

  // Helper: tools matching a state_tag, filtered by role
  function byTag(tag: GameTool['state_tags'][number]) {
    return all.filter((t) => {
      if (!t.state_tags?.includes(tag)) return false;
      if (t.roles === 'all') return true;
      return (t.roles as RoleKey[]).includes(role);
    });
  }

  // Helper: role-appropriate tools for a bucket
  function byBucket(bucket: Bucket, limit = 2) {
    return all
      .filter((t) => {
        if (t.bucket !== bucket) return false;
        if (t.roles === 'all') return true;
        return (t.roles as RoleKey[]).includes(role);
      })
      .slice(0, limit);
  }

  if (phase === 'slump_reset') {
    const slumpTools = byTag('slump');
    return {
      banner: {
        icon: 'trending-up',
        color: Colors.warning,
        headline: 'Slump mode — tools selected for your situation.',
        sub: 'Process-focused. One goal. Short memory.',
      },
      tools: slumpTools.length > 0 ? slumpTools.slice(0, 3) : byBucket('pregame', 2),
    };
  }

  if (phase === 'return_to_throw') {
    const recoveryTools = byTag('return_to_throw');
    return {
      banner: {
        icon: 'fitness',
        color: Colors.info,
        headline: 'Return-to-throw mode — recovery first.',
        sub: 'Patience is the work. Arm care tools prioritized.',
      },
      tools: recoveryTools.length > 0 ? recoveryTools.slice(0, 3) : byBucket('postgame', 2),
    };
  }

  if (phase === 'preseason') {
    return {
      banner: {
        icon: 'sunny',
        color: Colors.primary,
        headline: 'Preseason — build the habits now.',
        sub: 'Routine and prep tools to install before the season starts.',
      },
      tools: [...byBucket('pregame', 2), ...byBucket('postgame', 1)],
    };
  }

  if (struggles.includes('bouncing_back') || struggles.includes('confidence') || struggles.includes('pregame_nerves')) {
    const nervesTools = byTag('nerves');
    const slumpTools = byTag('slump');
    const merged = [...nervesTools, ...slumpTools].slice(0, 3);
    return {
      banner: {
        icon: 'pulse',
        color: Colors.warning,
        headline: 'Based on your focus area.',
        sub: 'Reset tools matched to your biggest struggle.',
      },
      tools: merged.length > 0 ? merged : byBucket('pregame', 2),
    };
  }

  // Default in-season: smart defaults by role
  const defaults: GameTool[] = [];
  if (role === 'pitcher') {
    const pb = all.find((t) => t.id === 'pre_bullpen');
    const bp = all.find((t) => t.id === 'ingame_pitch_reset');
    const tr = all.find((t) => t.id === 'between_inning_pitcher');
    if (pb) defaults.push(pb);
    if (bp) defaults.push(bp);
    if (tr) defaults.push(tr);
  } else if (role === 'catcher') {
    const pp = all.find((t) => t.id === 'pregame_prime');
    const cv = all.find((t) => t.id === 'ingame_catcher_visit');
    const bs = all.find((t) => t.id === 'between_battery_sync');
    if (pp) defaults.push(pp);
    if (cv) defaults.push(cv);
    if (bs) defaults.push(bs);
  } else {
    const pp = all.find((t) => t.id === 'pregame_prime');
    const ab = all.find((t) => t.id === 'ingame_pre_ab');
    const dd = all.find((t) => t.id === 'between_inning_defense');
    if (pp) defaults.push(pp);
    if (ab) defaults.push(ab);
    if (dd) defaults.push(dd);
  }

  return {
    banner: null, // no special state — just show defaults quietly
    tools: defaults.filter(Boolean),
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getTools(bucket: Bucket, role: RoleKey): GameTool[] {
  return GAME_TOOLS.filter((t) => {
    if (t.bucket !== bucket) return false;
    if (t.roles === 'all') return true;
    return (t.roles as RoleKey[]).includes(role);
  });
}

// ─── PRINT CARD SCREEN ────────────────────────────────────────────────────────

function PrintCardScreen({ tool, onBack }: { tool: GameTool; onBack: () => void }) {
  async function handleShare() {
    const steps = tool.steps
      .map((s, i) => `${i + 1}. ${s.cue}  —  ${s.instruction}`)
      .join('\n');
    const text = [
      '[ CLUTCHR BASEBALL — GAME CARD ]',
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
          No phone on the field. Screenshot or print this card and keep it in your bat bag.
        </Text>
      </View>

      <View style={pStyles.card}>
        <View style={[pStyles.cardHeader, { borderLeftColor: tool.color, borderLeftWidth: 4 }]}>
          <View style={[pStyles.cardIconWrap, { backgroundColor: tool.color + '18' }]}>
            <Ionicons name={tool.icon as any} size={18} color={tool.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pStyles.cardEyebrow}>CLUTCHR BASEBALL · {tool.bucket.toUpperCase()}</Text>
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
        Fold to index card size (3×5) · Keep in back pocket or bat bag · No phone needed
      </Text>
    </View>
  );
}

// ─── INTERACTIVE RUNNER ───────────────────────────────────────────────────────

function ToolRunner({ tool, onFinish }: { tool: GameTool; onFinish: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const { athleteState, updateAthleteState } = useAthlete();
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

  async function handleToolComplete() {
    if (tool.mode === 'print_card') return;
    const GM_KEY = 'gm_completed_today';
    const DATE_KEY = 'gm_completed_date';
    const today = new Date().toDateString();
    const lastDate = await AsyncStorage.getItem(DATE_KEY);
    const completedToday: string[] = lastDate === today
      ? JSON.parse(await AsyncStorage.getItem(GM_KEY) ?? '[]')
      : [];
    if (completedToday.includes(tool.id)) return;
    await updateAthleteState({ total_xp: (athleteState?.total_xp ?? 0) + 25 });
    completedToday.push(tool.id);
    await AsyncStorage.setItem(GM_KEY, JSON.stringify(completedToday));
    await AsyncStorage.setItem(DATE_KEY, today);
  }

  function advance() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    Haptics.selectionAsync();
    if (stepIdx >= tool.steps.length - 1) {
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleToolComplete();
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

function ToolCard({ tool, onPress, compact = false }: {
  tool: GameTool; onPress: () => void; compact?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        cStyles.card,
        tool.mode === 'print_card' && cStyles.printCard,
        compact && cStyles.compactCard,
        pressed && { opacity: 0.82, transform: [{ scale: 0.99 }] },
      ]}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
    >
      <View style={[cStyles.icon, { backgroundColor: tool.color + '18' }, compact && cStyles.compactIcon]}>
        <Ionicons name={tool.icon as any} size={compact ? 18 : 22} color={tool.color} />
      </View>
      <View style={cStyles.info}>
        <View style={cStyles.titleRow}>
          <Text style={[cStyles.name, compact && cStyles.compactName]}>{tool.name}</Text>
          {tool.mode === 'print_card' ? (
            <View style={cStyles.printBadge}>
              <Ionicons name="print" size={9} color={Colors.warning} />
              <Text style={[cStyles.badgeText, { color: Colors.warning }]}>PRINT</Text>
            </View>
          ) : (
            <View style={cStyles.phoneBadge}>
              <Ionicons name="phone-portrait" size={9} color={Colors.primary} />
              <Text style={[cStyles.badgeText, { color: Colors.primary }]}>PHONE</Text>
            </View>
          )}
        </View>
        {!compact && <Text style={cStyles.tagline} numberOfLines={1}>{tool.tagline}</Text>}
        <Text style={[cStyles.duration, { color: tool.color }]}>{tool.duration}</Text>
      </View>
      <Ionicons
        name={tool.mode === 'print_card' ? 'print-outline' : 'play-circle'}
        size={compact ? 20 : 24}
        color={tool.color}
      />
    </Pressable>
  );
}

// ─── SUGGESTED SECTION ───────────────────────────────────────────────────────

const struggleTriggerMap: Record<string, string[]> = {
  pregame_nerves:    ['pregame', 'nerves', 'lock-in', 'breathing'],
  confidence:        ['confidence', 'identity', 'reset', 'self-talk'],
  bouncing_back:     ['reset', 'bounce', 'short-memory', 'next-play'],
  staying_locked_in: ['focus', 'lock-in', 'between-inning', 'present'],
  throwing_strikes:  ['command', 'zone', 'tempo', 'attack'],
  plate_approach:    ['approach', 'zone', 'two-strike', 'plan'],
  reading_hitters:   ['sequencing', 'read', 'tendencies', 'plan'],
};

function SuggestedSection({ role, phase, struggles, onOpen }: {
  role: RoleKey;
  phase: SeasonPhase;
  struggles: string[];
  onOpen: (tool: GameTool) => void;
}) {
  const { banner, tools } = getSuggestedTools(role, phase, struggles);
  if (tools.length === 0) return null;

  const priorityKeywords = struggles.flatMap(s => struggleTriggerMap[s] ?? []);
  const sortedTools = [...tools].sort((a, b) => {
    const aMatch = priorityKeywords.some(k =>
      a.name?.toLowerCase().includes(k) || a.state_tags?.includes(k as any)
    );
    const bMatch = priorityKeywords.some(k =>
      b.name?.toLowerCase().includes(k) || b.state_tags?.includes(k as any)
    );
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  return (
    <View style={sugStyles.wrap}>
      {/* Section header */}
      <View style={sugStyles.header}>
        <View style={sugStyles.headerLeft}>
          <Ionicons name="flash" size={11} color={Colors.primary} />
          <Text style={sugStyles.headerLabel}>SUGGESTED FOR YOU</Text>
        </View>
        <Text style={sugStyles.headerSub}>{phase.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
      </View>

      {/* State banner — only shows when there's a special condition */}
      {banner && (
        <View style={[sugStyles.banner, { borderColor: banner.color + '40', backgroundColor: banner.color + '0A' }]}>
          <LinearGradient
            colors={[banner.color + '10', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <Ionicons name={banner.icon as any} size={14} color={banner.color} />
          <View style={{ flex: 1 }}>
            <Text style={[sugStyles.bannerHead, { color: banner.color }]}>{banner.headline}</Text>
            <Text style={sugStyles.bannerSub}>{banner.sub}</Text>
          </View>
        </View>
      )}

      {/* Tools */}
      {sortedTools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} onPress={() => onOpen(tool)} compact />
      ))}
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function GameModeScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, isLoading } = useAthlete();
  const [bucket, setBucket] = useState<Bucket>('pregame');
  const [intel, setIntel] = useState<any>({ opponent:'', roleToday:'', watchFor:'', firstRepPlan:'', pressureCue:'' });
  const [debrief, setDebrief] = useState<any>({ win:'', miss:'', confidence:'3', rhythm:'3', routine:'3', tomorrowRep:'', carryCue:'' });
  const pressureCue = getBestCue(athleteState, 'pressure');
  const [activeTool, setActiveTool] = useState<GameTool | null>(null);
  const [view, setView] = useState<'runner' | 'print' | null>(null);

  const role = (athleteState?.primary_role ?? 'infielder') as RoleKey;
  const phase = (athleteState?.season_phase ?? 'in_season') as SeasonPhase;
  const struggles = athleteState?.biggest_struggle ?? [];
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

  // ── Active tool view ──
  if (activeTool && view) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ClutchrHeader
          variant="flow"
          kicker={activeTool.bucket.toUpperCase()}
          title={activeTool.name}
          leftAction={
            <Pressable onPress={closeTool} hitSlop={12} style={s.backBtn}>
              <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
            </Pressable>
          }
          rightAction={activeTool.mode === 'print_card' ? (
            <View style={s.printTag}>
              <Ionicons name="print" size={10} color={Colors.warning} />
              <Text style={s.printTagText}>PRINT CARD</Text>
            </View>
          ) : (
            <Text style={s.toolDuration}>{activeTool.duration}</Text>
          )}
        />
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

  // ── List view ──
  return (
    <View style={[s.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <ClutchrHeader
        variant="mainTab"
        kicker="GAME MODE"
        title="Get Game Ready"
        subtitle="Prep. Reset. Recover."
        statusPill={role.charAt(0).toUpperCase() + role.slice(1)}
      />

      {/* Bucket tabs — now 4 tabs */}
      <View style={s.bucketRow}>
        {(Object.keys(BUCKET_META) as Bucket[]).map((b) => {
          const m = BUCKET_META[b];
          const active = bucket === b;
          return (
            <Pressable
              key={b}
              style={[
                s.bucketTab,
                active && { borderBottomWidth: 2, borderBottomColor: '#22CC5E' },
              ]}
              onPress={() => { setBucket(b); closeTool(); Haptics.selectionAsync(); }}
            >
              <Ionicons name={m.icon as any} size={12} color={active ? '#22CC5E' : 'rgba(255,255,255,0.4)'} />
              <Text style={[s.bucketLabel, active ? { color: '#22CC5E' } : { color: 'rgba(255,255,255,0.4)' }]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Drill mode entry points */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>DRILL MODE</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Pressable
              onPress={() => router.push('/rep-mode?type=pitch-iq')}
              style={{ flex: 1, backgroundColor: '#12101A', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BF5AF244' }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>🎯</Text>
              <Text style={{ color: '#BF5AF2', fontSize: 12, fontWeight: '700' }}>PITCH IQ</Text>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>5 rep decisions</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/rep-mode?type=field-iq')}
              style={{ flex: 1, backgroundColor: '#12101A', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FF3B3044' }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>⚾</Text>
              <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '700' }}>FIELD IQ</Text>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>5 fielding reads</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/rep-mode?type=strike-zone')} style={{ width: '48%', backgroundColor: '#12101A', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#22CC5E44' }}><Text style={{ fontSize: 18, marginBottom: 4 }}>🧠</Text><Text style={{ color: '#22CC5E', fontSize: 12, fontWeight: '700' }}>ZONE READ</Text><Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Strike zone decisions</Text></Pressable>
            <Pressable onPress={() => router.push('/rep-mode?type=throw-decision')} style={{ width: '48%', backgroundColor: '#12101A', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#4BA3E344' }}><Text style={{ fontSize: 18, marginBottom: 4 }}>🎯</Text><Text style={{ color: '#4BA3E3', fontSize: 12, fontWeight: '700' }}>THROW DECISION</Text><Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Fast throw choices</Text></Pressable>
            <Pressable onPress={() => router.push('/rep-mode?type=leverage-ladder')} style={{ width: '48%', backgroundColor: '#12101A', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F5A62344' }}><Text style={{ fontSize: 18, marginBottom: 4 }}>📈</Text><Text style={{ color: '#F5A623', fontSize: 12, fontWeight: '700' }}>LEVERAGE LADDER</Text><Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Prioritize the moment</Text></Pressable>
          </View>
        </View>

        <View style={[s.banner, { borderColor: '#22CC5E55', backgroundColor: '#0F1612' }]}>
          <Text style={[s.bannerHead, { color: '#22CC5E' }]}>PERSONAL PRESSURE CUE</Text>
          <Text style={[s.bannerSub, { color: 'rgba(255,255,255,0.88)' }]}>{pressureCue || 'Compete.'}</Text>
        </View>

        {bucket === 'pregame' && (
          <View style={{ backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md }}>
            <Text style={s.title}>TODAY'S PLAN</Text>
            <Text style={[s.bannerSub, { color: 'rgba(255,255,255,0.72)' }]}>Opponent Intel Builder coming soon.</Text>
          </View>
        )}


        {/* Suggested section — only on pregame tab, state-aware */}
        {bucket === 'pregame' && (
          <SuggestedSection
            role={role}
            phase={phase}
            struggles={struggles}
            onOpen={openTool}
          />
        )}

        {/* Divider when suggested section is shown */}
        {bucket === 'pregame' && (
          <View style={s.sectionDivider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerLabel}>ALL {meta.label} TOOLS</Text>
            <View style={s.dividerLine} />
          </View>
        )}

        {/* Full tool list for bucket */}
        {isLoading ? (
          [0, 1, 2, 3].map(i => <SkeletonCard key={i} />)
        ) : tools.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="baseball-outline" size={40} color={Colors.textTertiary} />
            <Text style={s.emptyTitle}>No tools for {role}s here yet.</Text>
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
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl, gap: 4 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: 1 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  bucketRow: {
    flexDirection: 'row', backgroundColor: '#0D0D0D',
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
    marginBottom: Spacing.md,
  },
  bucketTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10,
  },
  bucketLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.6 },
  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1,
  },
  bannerHead: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  bannerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 16, marginTop: 2 },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  sectionDivider: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm, marginBottom: 2,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1.2 },
  empty: { paddingVertical: 60, alignItems: 'center', gap: Spacing.md },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textAlign: 'center' },
  emptySub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  toolHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  toolIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolHeaderName: { flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  printTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.warningMuted, borderRadius: Radius.pill,
    paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: Colors.warning + '40',
  },
  printTagText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.warning, letterSpacing: 0.5 },
  toolDuration: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  toolScroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
});

const cStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  compactCard: { padding: Spacing.sm, gap: Spacing.sm },
  printCard: { borderStyle: 'dashed', borderColor: Colors.warning + '50', backgroundColor: Colors.warningMuted + '25' },
  icon: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  compactIcon: { width: 36, height: 36 },
  info: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, flex: 1 },
  compactName: { fontSize: 13 },
  printBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.warningMuted, borderRadius: Radius.pill,
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.warning + '40',
  },
  phoneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primaryMuted, borderRadius: Radius.pill,
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.primaryBorder,
  },
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
});

const pStyles = StyleSheet.create({
  container: { gap: Spacing.lg },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.warningMuted, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.warning + '40',
  },
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

const sugStyles = StyleSheet.create({
  wrap: { gap: Spacing.sm, marginBottom: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 1.2 },
  headerSub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, overflow: 'hidden',
  },
  bannerHead: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  bannerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 16, marginTop: 2 },
});
