import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAthlete } from "@/context/AthleteContext";
import { Colors, Radius, Spacing } from "@/constants/theme";
import type { SeasonPhase } from "@/context/AthleteContext";
import { SkeletonCard } from "@/components/SkeletonLoader";
import { ClutchrHeader } from "@/components/ClutchrHeader";
import { getBestCue } from "@/lib/personalCue";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Bucket =
  | "pregame"
  | "pre"
  | "ingame"
  | "live"
  | "between"
  | "btw"
  | "between_game"
  | "between_innings"
  | "mid_game"
  | "postgame"
  | "post";
type TimingBucket = "pre" | "live" | "post";
type IntentKey =
  | "get_ready"
  | "reset"
  | "refocus"
  | "recover"
  | "debrief"
  | "all";
type RoleKey = "pitcher" | "catcher" | "infielder" | "outfielder";
type RapidRepOutcome = "primary" | "acceptable" | "caution";

type RapidRepOption = {
  label: string;
  outcome: RapidRepOutcome;
  feedback: string;
  reason: string;
};

type RapidRep = {
  id: string;
  title: string;
  situation: string;
  prompt: string;
  tag: string;
  options: RapidRepOption[];
};

type RapidRepDrill = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  takeaway: string;
  reps: RapidRep[];
};

type DebriefSummary = {
  win: string;
  miss: string;
  feel: string;
  cue: string;
  nextRep: string;
  savedAt: string;
};

interface GameTool {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  bucket: Bucket;
  roles: RoleKey[] | "all";
  mode: "interactive" | "print_card";
  duration: string;
  steps: { cue: string; instruction: string; timer?: number }[];
  printCue: string;
  whenToUse: string;
  // State tags — used for smart surfacing
  state_tags?: Array<
    | "slump"
    | "return_to_throw"
    | "preseason"
    | "offseason"
    | "nerves"
    | "error"
    | "postgame_tough"
  >;
}

// ─── ALL TOOLS ────────────────────────────────────────────────────────────────

const DEBRIEF_STORAGE_KEY = "gm_last_postgame_debrief";

const ROLE_CUES: Record<string, string[]> = {
  pitcher: ["Attack the zone.", "One pitch.", "No freebies.", "Breathe. Target. Attack."],
  catcher: ["Calm the pitcher.", "Stick first.", "Run the moment.", "One pitch."],
  infielder: ["Plan before contact.", "Ball first.", "Clock then throw.", "Next play."],
  outfielder: ["Ready every pitch.", "Depth first.", "Read through it.", "Want the next ball."],
  hitter: ["See it early.", "Hunt your lane.", "Yes-Yes-No.", "Win the next pitch."],
  baserunner: ["Read it.", "Full commit.", "First move.", "Go on green."],
};

const DEBRIEF_WIN_OPTIONS = [
  "Kept my routine",
  "Responded after a mistake",
  "Competed pitch to pitch",
  "Communicated well",
  "Owned my body language",
];

const DEBRIEF_MISS_OPTIONS = [
  "Lost focus",
  "Rushed tempo",
  "Missed plan",
  "Bad body language",
  "Poor reset",
  "Poor communication",
  "Chased result",
  "Did not recover after mistake",
  "Arm/body felt off",
  "Other",
];

const CARRY_CUE_OPTIONS = [
  "One pitch.",
  "Breathe. Target. Attack.",
  "Win the next pitch.",
  "Ball first.",
  "Ready every pitch.",
  "Flush it. Next play.",
];

const RAPID_REP_DRILLS: RapidRepDrill[] = [
  {
    id: "pitch-iq",
    label: "PITCH IQ",
    title: "Pitch IQ",
    subtitle: "5 quick pitch-call decisions",
    color: "#BF5AF2",
    icon: "analytics",
    takeaway: "Best pitch calls start with count, hitter timing, and the cleanest way to win the next pitch.",
    reps: [
      {
        id: "pitch-0-2-late",
        title: "0-2 leverage",
        situation: "Count 0-2. Hitter has been late on the fastball.",
        prompt: "Make the call.",
        tag: "pitch IQ",
        options: [
          { label: "Waste fastball up", outcome: "primary", feedback: "Good read. That keeps the hitter under pressure without giving in.", reason: "With two strikes and late timing, you can expand up before showing something easier to lift." },
          { label: "Slider below zone", outcome: "acceptable", feedback: "That can work, but there’s a cleaner baseball decision here.", reason: "Below-zone spin is useful, but only if the hitter has shown chase or the pitcher can bury it." },
          { label: "Changeup middle", outcome: "caution", feedback: "Not the move. The game is giving you a better read.", reason: "Middle soft in an 0-2 count gives the hitter a mistake instead of forcing chase or speed pressure." },
        ],
      },
      {
        id: "pitch-bunt-coverage",
        title: "Bunt threat",
        situation: "Runner on first, one out. Hitter squares early and shows bunt.",
        prompt: "What matters first?",
        tag: "pitch IQ",
        options: [
          { label: "Coverage and communication", outcome: "primary", feedback: "Good read. That keeps the inning under control.", reason: "Everyone needs the same bunt plan before the pitch: who charges, who covers, and where the lead out lives." },
          { label: "Check runner lead", outcome: "acceptable", feedback: "That can work, but there’s a cleaner baseball decision here.", reason: "The lead matters, but coverage must be locked before the ball is bunted." },
          { label: "Field the bunt and get one", outcome: "caution", feedback: "Not the move. The game is giving you a better read.", reason: "That is a reaction after contact, not the pre-pitch decision the defense needs." },
        ],
      },
      {
        id: "pitch-3-1-best-strike",
        title: "3-1 plan",
        situation: "Count 3-1. Pitcher has lost feel for the breaking ball.",
        prompt: "What is the plan?",
        tag: "pitch IQ",
        options: [
          { label: "Challenge with best strike", outcome: "primary", feedback: "Good read. Trust the pitch that can actually land.", reason: "Behind in the count, the plan starts with the highest-probability strike, not the fanciest pitch." },
          { label: "Aim corner only", outcome: "acceptable", feedback: "That can work, but there’s a cleaner baseball decision here.", reason: "Edges are fine if command is there, but 3-1 demands a strike plan first." },
          { label: "Trick pitch", outcome: "caution", feedback: "Not the move. The game is giving you a better read.", reason: "A low-feel trick pitch often creates a free base and gives the offense the inning." },
        ],
      },
      {
        id: "pitch-first-pitch-aggressive",
        title: "Ambush hitter",
        situation: "First pitch. Middle-order hitter has jumped early-count fastballs all day.",
        prompt: "Read the game.",
        tag: "pitch IQ",
        options: [
          { label: "Start with controlled offspeed", outcome: "primary", feedback: "Good read. You changed the first look without losing the zone.", reason: "If the hitter is hunting heater early, a controlled strike-speed change can steal leverage." },
          { label: "Fastball middle to get ahead", outcome: "caution", feedback: "Not the move. The game is giving you a better read.", reason: "That feeds the exact attack the hitter has already shown." },
          { label: "Bounce breaking ball", outcome: "acceptable", feedback: "That can work, but there’s a cleaner baseball decision here.", reason: "A chase pitch can set a tone, but a noncompetitive ball gives away count leverage." },
        ],
      },
      {
        id: "pitch-runner-third-less-than-two",
        title: "Runner at third",
        situation: "Runner on third, one out. Infield is in. Hitter expands away.",
        prompt: "Lock the decision.",
        tag: "pitch IQ",
        options: [
          { label: "Expand away with intent", outcome: "primary", feedback: "Good read. Make the hitter beat the situation, not your mistake.", reason: "With contact pressure on, the call should avoid the big middle miss and lean into the hitter’s chase pattern." },
          { label: "Force fastball in the middle", outcome: "caution", feedback: "Not the move. The game is giving you a better read.", reason: "Middle contact lets the offense cash in the runner with less work." },
          { label: "Pickoff only", outcome: "acceptable", feedback: "That can work, but there’s a cleaner baseball decision here.", reason: "A look can control the runner, but the pitch plan still has to win the hitter." },
        ],
      },
    ],
  },
  {
    id: "field-iq",
    label: "FIELD IQ",
    title: "Field IQ",
    subtitle: "5 quick defensive reads",
    color: "#22CC5E",
    icon: "baseball",
    takeaway: "Clean defenders decide before the ball arrives: runner, out, clock, throw lane.",
    reps: [
      {
        id: "field-r2-grounder-short",
        title: "Ground ball to short",
        situation: "Runner on second, one out. Routine ground ball to short.",
        prompt: "Where is the first look?",
        tag: "field IQ",
        options: [
          { label: "Freeze runner / secure out", outcome: "primary", feedback: "Good read. That keeps the inning under control.", reason: "The first job is holding the runner with eyes and body, then taking the sure out if the runner stays." },
          { label: "Throw behind runner", outcome: "acceptable", feedback: "That can work, but there’s a cleaner baseball decision here.", reason: "Behind-runner throws need a clear break or pre-pitch coverage; routine contact usually starts with secure control." },
          { label: "Force home", outcome: "caution", feedback: "Not the move. The game is giving you a better read.", reason: "There is no force at home, and a late throw can turn one out into no outs." },
        ],
      },
      {
        id: "field-first-third-slow-roller",
        title: "First and third",
        situation: "First and third, one out. Slow roller to third.",
        prompt: "What matters?",
        tag: "field IQ",
        options: [
          { label: "Know speed, secure out", outcome: "primary", feedback: "Good read. The throw matches the runner and the clock.", reason: "Lead-run plays depend on runner speed, ball pace, and whether the out is truly there." },
          { label: "Blind throw home", outcome: "caution", feedback: "Not the move. The game is giving you a better read.", reason: "Blind home throws create big innings when the plate out is not clearly available." },
          { label: "Hold the ball", outcome: "acceptable", feedback: "That can work, but there’s a cleaner baseball decision here.", reason: "Eating it can prevent a bad throw, but the defense still wants an out when the clock allows it." },
        ],
      },
      {
        id: "field-of-single-runner-second",
        title: "Outfield single",
        situation: "Base hit to the outfield with a runner on second.",
        prompt: "Where is the throw?",
        tag: "field IQ",
        options: [
          { label: "Hit cutoff / keep double play", outcome: "primary", feedback: "Good read. Keep the next out in order.", reason: "A clean cutoff can prevent the extra base and preserve a double-play chance if the run scores." },
          { label: "Air mail home", outcome: "caution", feedback: "Not the move. The game is giving you a better read.", reason: "A no-chance air mail often gifts the trail runner second base." },
          { label: "Throw to second", outcome: "acceptable", feedback: "That can work, but there’s a cleaner baseball decision here.", reason: "Second base matters only if the trail runner is taking it and the cutoff lane is handled." },
        ],
      },
      {
        id: "field-pop-up-communication",
        title: "Infield pop",
        situation: "Windy day. Pop up between short, third, and left field.",
        prompt: "Make the call.",
        tag: "field IQ",
        options: [
          { label: "Loud priority call early", outcome: "primary", feedback: "Good read. One clear voice wins the ball.", reason: "The defender with priority must call early so the group avoids a collision or last-second reach." },
          { label: "Everyone chase until last second", outcome: "caution", feedback: "Not the move. The game is giving you a better read.", reason: "Late indecision turns catchable outs into chaos." },
          { label: "Let the outfielder decide silently", outcome: "acceptable", feedback: "That can work, but there’s a cleaner baseball decision here.", reason: "Outfield priority can matter, but silence is the danger in a shared-space ball." },
        ],
      },
      {
        id: "field-two-outs-slow-runner",
        title: "Two-out clock",
        situation: "Two outs. Slow runner at the plate. Backhand ball deep in the hole.",
        prompt: "Lock the decision.",
        tag: "field IQ",
        options: [
          { label: "Set feet, make firm throw", outcome: "primary", feedback: "Good read. The clock gives you room to finish the play.", reason: "With a slower runner, clean feet and a firm line beat a rushed miss." },
          { label: "Panic throw off one foot", outcome: "caution", feedback: "Not the move. The game is giving you a better read.", reason: "Rushing when the clock is on your side creates the error." },
          { label: "Eat it immediately", outcome: "acceptable", feedback: "That can work, but there’s a cleaner baseball decision here.", reason: "Eating it protects against a wild throw, but two outs rewards the sure throw when time is there." },
        ],
      },
    ],
  },
];

const RAPID_REP_ROADMAP_CARDS = [
  { label: "RUNNER READS", sub: "Jump and dirt-ball reads", color: "#4BA3E3", icon: "navigate" },
  { label: "SWING/TAKE", sub: "Strike zone decisions", color: "#22CC5E", icon: "scan" },
  { label: "PRESSURE REPLAY", sub: "Reset under game heat", color: "#F5A623", icon: "trending-up" },
];

function getNextRepForMiss(miss: string): string {
  const key = miss.toLowerCase();
  if (key.includes("focus")) return "Between-Pitch Reset";
  if (key.includes("tempo")) return "Pregame 90-Second Switch-On";
  if (key.includes("plan")) return "First Rep Plan";
  if (key.includes("body language")) return "After-Error Reset";
  if (key.includes("reset") || key.includes("mistake")) return "Between-Pitch Reset";
  if (key.includes("communication")) return "Role Cue Lock-In";
  if (key.includes("result")) return "Postgame 60-Second Debrief";
  if (key.includes("arm") || key.includes("body")) return "Recovery Check";
  return "Role Cue Lock-In";
}

const GAME_TOOLS: GameTool[] = [
  // ── PRE-GAME ─────────────────────────────────────────────────────────────
  {
    id: "pregame_prime",
    name: "Pregame Prime",
    tagline: "Lock in before first pitch.",
    icon: "sunny",
    color: Colors.primary,
    bucket: "pregame",
    roles: "all",
    mode: "interactive",
    duration: "3 min",
    whenToUse: "Before warmups. In the dugout or locker room before the game.",
    steps: [
      {
        cue: "CLEAR THE NOISE",
        instruction:
          "Three slow breaths. Whatever happened today stays here. The game starts fresh.",
        timer: 18,
      },
      {
        cue: "SET YOUR INTENTION",
        instruction:
          'One word for today. "Attack." "Trust it." "Compete." Say it twice. That is your anchor.',
      },
      {
        cue: "SEE YOUR FIRST REP",
        instruction:
          "Visualize your first rep going exactly right. First pitch a strike. First at-bat, you drive it. First ground ball, routine play clean throw. See it before it happens.",
      },
      {
        cue: "WHAT YOU CONTROL",
        instruction:
          "Three things you fully control today: your effort, your routine, and your response to failure. The scoreboard is not on the list.",
      },
      {
        cue: "STEP ON READY",
        instruction:
          "Walk onto that field like you have been here before. Because you have done the work. Own it.",
      },
    ],
    printCue: "BREATHE · INTENTION · SEE IT · COMPETE",
  },
  {
    id: "pregame_switch_on",
    name: "Pregame 90-Second Switch-On",
    tagline: "Get your body, cue, and first job lined up.",
    icon: "flash",
    color: Colors.primary,
    bucket: "pregame",
    roles: "all",
    mode: "interactive",
    duration: "90 sec",
    whenToUse: "Use first before warmups or first pitch. Do not enter the game cold mentally.",
    steps: [
      {
        cue: "BREATH",
        instruction: "Three slow breaths. Drop the day. Step into baseball time.",
        timer: 18,
      },
      {
        cue: "BODY CHECK",
        instruction: "Jaw loose. Shoulders down. Feet under you. Ready body before ready mind.",
      },
      {
        cue: "ROLE CUE",
        instruction: "Pick the cue you are carrying today. One cue only. Say it twice.",
      },
      {
        cue: "ONE CONTROLLABLE",
        instruction: "Name one thing you fully control today: routine, effort, tempo, body language, or response.",
      },
      {
        cue: "START READY",
        instruction: "First job loaded. Cue loaded. Walk in ready for pitch one.",
      },
    ],
    printCue: "BREATH · BODY · ROLE CUE · FIRST JOB",
  },
  {
    id: "role_cue_lockin",
    name: "Role Cue Lock-In",
    tagline: "Choose one job-specific cue for today.",
    icon: "pricetag",
    color: Colors.warning,
    bucket: "pregame",
    roles: "all",
    mode: "interactive",
    duration: "60 sec",
    whenToUse: "Before lineups, warmups, or your first role rep.",
    steps: [
      {
        cue: "SET YOUR PLAN",
        instruction: "Pitcher: Attack the zone. Hitter: See it early. Catcher: Calm the pitcher. Infielder: Ball first. Outfielder: Ready every pitch. Baserunner: Full commit.",
      },
      {
        cue: "CARRY THIS",
        instruction: "Pick one cue that fits your role today. One is enough. Do not carry five thoughts into pitch one.",
      },
      {
        cue: "RESET LINE",
        instruction: "If the game speeds up, come back to the cue. Breathe. Say it. Play the next pitch.",
      },
    ],
    printCue: "ONE ROLE · ONE CUE · NEXT PITCH",
  },
  {
    id: "first_rep_plan",
    name: "First Rep Plan",
    tagline: "Know your first job before it finds you.",
    icon: "map",
    color: Colors.info,
    bucket: "pregame",
    roles: "all",
    mode: "interactive",
    duration: "90 sec",
    whenToUse: "Before your first mound inning, at-bat, defensive inning, or baserunning chance.",
    steps: [
      {
        cue: "TODAY'S ROLE",
        instruction: "Name your role for the first inning: pitcher, hitter, catcher, defender, runner, teammate.",
      },
      {
        cue: "FIRST JOB",
        instruction: "Name the first job that matters. Strike one. See it early. Ball first. Communicate. Read it.",
      },
      {
        cue: "RISK TO AVOID",
        instruction: "Name the trap: rushing, chasing, drifting, bad body language, or trying to win the whole game early.",
      },
      {
        cue: "CUE TO CARRY",
        instruction: "Carry one line into the first rep. Short enough to say under your breath.",
      },
    ],
    printCue: "ROLE · FIRST JOB · AVOID · CARRY",
  },
  {
    id: "pregame_confidence_check",
    name: "Pregame Confidence Check",
    tagline: "Quick read on focus, composure, and compete level.",
    icon: "speedometer",
    color: Colors.purple,
    bucket: "pregame",
    roles: "all",
    mode: "interactive",
    duration: "45 sec",
    whenToUse: "When you need a fast readiness check before first pitch.",
    steps: [
      {
        cue: "FOCUS",
        instruction: "Rate it in your head: low, ready, or sharp. If low, breathe and narrow to one job.",
      },
      {
        cue: "COMPOSURE",
        instruction: "Can you handle the first mistake without donating the next play? Decide that now.",
      },
      {
        cue: "COMPETE LEVEL",
        instruction: "You do not need perfect confidence. You need a playable plan and a first job.",
      },
    ],
    printCue: "FOCUS · COMPOSURE · COMPETE",
  },
  {
    id: "pregame_carry_card",
    name: "Pregame Carry Card",
    tagline: "Screenshot-ready cue card for the dugout.",
    icon: "albums",
    color: Colors.warning,
    bucket: "pregame",
    roles: "all",
    mode: "print_card",
    duration: "30 sec",
    whenToUse: "Screenshot or print before the game. No phone on the field.",
    steps: [
      { cue: "TODAY'S CUE", instruction: "Write or say the one cue you are carrying today." },
      { cue: "FIRST JOB", instruction: "Name the first job that matters before pitch one." },
      { cue: "RESET LINE", instruction: "Pick the line you return to after a miss: Flush it. Next pitch." },
    ],
    printCue: "TODAY'S CUE · FIRST JOB · FLUSH IT",
  },
  {
    id: "first_ab_lockin",
    name: "First AB Lock-In",
    tagline: "The at-bat starts before you step in the box.",
    icon: "eye",
    color: Colors.info,
    bucket: "pregame",
    roles: ["infielder", "outfielder", "catcher"],
    mode: "interactive",
    duration: "2 min",
    whenToUse: "Before first pitch. On-deck or in the dugout.",
    steps: [
      {
        cue: "FIND HIS RELEASE",
        instruction:
          "You saw him warm up. Where does the ball come out? Lock your eyes on that window. Every pitch starts there.",
      },
      {
        cue: "READ HIS TEMPO",
        instruction:
          "Watch his windup tempo. Match your breathing to it. You are already timing him before you step in.",
      },
      {
        cue: "SET YOUR ZONE",
        instruction:
          "Where do you want the pitch? Name your damage zone right now. Middle-in. Down-and-away. That is what you are hunting.",
      },
      {
        cue: "ONE WORD",
        instruction:
          'Set your at-bat cue. "See it early." "Short and quick." "Hunt middle." That word comes with you to the plate.',
      },
    ],
    printCue: "FIND RELEASE · YOUR ZONE · ONE WORD",
  },
  {
    id: "pre_bullpen",
    name: "Pre-Bullpen Lock-In",
    tagline: "Mental rep before the physical reps.",
    icon: "baseball",
    color: Colors.purple,
    bucket: "pregame",
    roles: ["pitcher"],
    mode: "interactive",
    duration: "2 min",
    whenToUse: "Before your bullpen warmup. Non-negotiable.",
    steps: [
      {
        cue: "CENTER",
        instruction:
          "Three breaths. Clear everything except what you are about to do.",
        timer: 18,
      },
      {
        cue: "GRIP LIST",
        instruction:
          "Run your pitches in your head: fastball grip, off-speed grip, breaking ball grip. Feel each one.",
      },
      {
        cue: "FIVE TARGETS",
        instruction:
          "Visualize your first five throw targets. Down away. Back foot. Up at the letters. Middle. See the glove.",
      },
      {
        cue: "TEMPO CUE",
        instruction:
          'Set your tempo cue for today. "Fast and loose." "Attack early." "Trust the stuff." Say it twice.',
      },
      {
        cue: "CLAP AND GO",
        instruction:
          "One clap of the glove. Walk to the mound like you own it. You are ready.",
      },
    ],
    printCue: "BREATHE · GRIPS · TARGETS · TEMPO · GO",
  },
  {
    id: "nerves_to_attack",
    name: "Nerves to Attack",
    tagline: "Rename the feeling. Change the game.",
    icon: "pulse",
    color: Colors.warning,
    bucket: "pregame",
    roles: "all",
    mode: "interactive",
    duration: "2 min",
    whenToUse: "When you feel pregame anxiety or tightness.",
    state_tags: ["nerves", "preseason"],
    steps: [
      {
        cue: "FEEL IT",
        instruction:
          "Notice where it lives. Chest tight? Stomach? Hands? Identify it. You cannot manage what you have not noticed.",
      },
      {
        cue: "RENAME IT",
        instruction:
          "That feeling is not fear. That is your body preparing to compete. Heart rate up, focus narrowing — that is called ready.",
      },
      {
        cue: "BREATHE INTO IT",
        instruction:
          "Breathe into the tightness. One slow breath directly into that spot.",
        timer: 8,
      },
      {
        cue: "CHANNEL IT",
        instruction:
          'Every great player you respect has felt exactly this. They used it. Say it: "I am not nervous. I am ready."',
      },
      {
        cue: "GO COMPETE",
        instruction:
          "Step onto the field with that energy. Not despite it. Because of it.",
      },
    ],
    printCue: "FEEL IT · RENAME IT · BREATHE · GO",
  },
  {
    id: "slump_pregame",
    name: "Slump Pregame Reset",
    tagline: "One process. One at-bat. One pitch.",
    icon: "refresh",
    color: Colors.warning,
    bucket: "pregame",
    roles: "all",
    mode: "interactive",
    duration: "2 min",
    whenToUse: "When you are in a slump and struggling to get mentally ready.",
    state_tags: ["slump"],
    steps: [
      {
        cue: "SHRINK IT",
        instruction:
          "Stop thinking about the slump. Your only job today is one quality at-bat. Not the stats. Not the streak. One at-bat.",
      },
      {
        cue: "ONE PROCESS GOAL",
        instruction:
          'Name your process goal for today: "See the ball early." "Stay back." "Attack first pitch." One. That is it.',
      },
      {
        cue: "BREATHE",
        instruction:
          "Four counts in. Four counts out. Reset the nervous system.",
        timer: 16,
      },
      {
        cue: "REMEMBER WHO YOU ARE",
        instruction:
          "You have done this before. You have had good at-bats. Name one. That player shows up today.",
      },
      {
        cue: "COMPETE",
        instruction:
          "Slumps end when you stop chasing them and start competing. Do that today.",
      },
    ],
    printCue: "SHRINK IT · ONE GOAL · BREATHE · COMPETE",
  },
  {
    id: "pregame_underdog_plan",
    name: "90-Second Underdog Plan",
    tagline: "No freebies. Make them earn every run.",
    icon: "trending-up",
    color: Colors.warning,
    bucket: "pregame",
    roles: "all",
    mode: "interactive",
    duration: "90 sec",
    whenToUse: "When you are the underdog, short on rest, or facing a tough opponent.",
    steps: [
      {
        cue: "RESET THE STORY",
        instruction: "The scoreboard has not started yet. Nobody on that field has beaten you today. Come in with zero baggage.",
      },
      {
        cue: "ONE CONTROLLABLE",
        instruction: "Name one thing you fully control for the first inning: effort, tempo, body language, or first rep execution.",
      },
      {
        cue: "ATTACK MENTALITY",
        instruction: "No freebies. Attack the zone. Every pitch you throw or see is a competitive rep. Make them earn it.",
      },
      {
        cue: "GO",
        instruction: "Step on the field with that plan. You do not need to be the favorite. You need to compete.",
      },
    ],
    printCue: "RESET · ONE CONTROLLABLE · NO FREEBIES · ATTACK THE ZONE",
  },
  {
    id: "pregame_high_velo",
    name: "High Velo Ready",
    tagline: "See the release early. Load early. Hunt your lane.",
    icon: "speedometer",
    color: Colors.danger,
    bucket: "pregame",
    roles: ["infielder", "outfielder", "catcher"],
    mode: "interactive",
    duration: "90 sec",
    whenToUse: "Before facing a pitcher with above-average velocity.",
    steps: [
      {
        cue: "FIND THE RELEASE",
        instruction: "Locate his release point during warmups. That window is everything. Your eyes go there on pitch one.",
      },
      {
        cue: "LOAD EARLY",
        instruction: "Move your hands and weight transfer earlier than normal. You do not have time to react late against high heat.",
      },
      {
        cue: "HUNT YOUR LANE",
        instruction: "Pick your zone. Middle-in or middle-away. Do not cover the whole plate. Shrink the decision.",
      },
      {
        cue: "YES-YES-NO",
        instruction: 'Stay on fast: assume heat, adjust to off-speed. "Yes. Yes. No." — not "No, No, Yes."',
      },
    ],
    printCue: "FIND RELEASE · LOAD EARLY · HUNT YOUR LANE",
  },
  {
    id: "pregame_dugout_intel",
    name: "Dugout Intel Setup",
    tagline: "Assign eyes before pitch one.",
    icon: "eye",
    color: Colors.info,
    bucket: "pregame",
    roles: "all",
    mode: "interactive",
    duration: "2 min",
    whenToUse: "Before the first pitch. Assign roles in the dugout so your team gathers info all game.",
    steps: [
      {
        cue: "PITCHER WATCHER",
        instruction: "Assign one player to track the pitcher: release point, off-speed grip, timing tells, and first-pitch habits.",
      },
      {
        cue: "CATCHER WATCHER",
        instruction: "Assign one player to watch the catcher's setup: where does he set up with runners on, and what does he call first-pitch?",
      },
      {
        cue: "COACH WATCHER",
        instruction: "Assign one player to read the third-base coach signs earlier in the count so runners are prepared.",
      },
      {
        cue: "VERIFY BEFORE YOU USE IT",
        instruction: "No one acts on one data point. See it twice, confirm it, then pass it on.",
      },
    ],
    printCue: "PITCHER · CATCHER · COACH · VERIFY FIRST",
  },
  {
    id: "pregame_mound_lockin",
    name: "Mound Lock-In",
    tagline: "Command starts before first pitch.",
    icon: "radio-button-on",
    color: Colors.purple,
    bucket: "pregame",
    roles: ["pitcher"],
    mode: "interactive",
    duration: "90 sec",
    whenToUse: "Before taking the mound for your first inning.",
    steps: [
      {
        cue: "FEEL THE RUBBER",
        instruction: "Toe on the rubber. Take a breath. This is your space. You control what happens in this circle.",
      },
      {
        cue: "TEMPO CUE",
        instruction: 'Set your tempo before pitch one. "Same tempo every pitch." Slow is under control. Rushed is not.',
      },
      {
        cue: "ATTACK THE ZONE",
        instruction: "One job for the first pitch: attack the zone. Not the perfect pitch — a competitive strike.",
      },
      {
        cue: "CUE LOADED",
        instruction: '"Attack the zone. Same tempo every pitch." Repeat it once. Walk off ready.',
      },
    ],
    printCue: "RUBBER · TEMPO · ATTACK THE ZONE · GO",
  },

  // ── IN-GAME ───────────────────────────────────────────────────────────────
  {
    id: "ingame_pitch_reset",
    name: "Between-Pitch Reset",
    tagline: "Step back. Breathe. Pick it. Go.",
    icon: "refresh-circle",
    color: Colors.purple,
    bucket: "ingame",
    roles: ["pitcher"],
    mode: "print_card",
    duration: "15 sec",
    whenToUse:
      "Between every pitch. After walks, errors, or when you feel tempo slipping.",
    steps: [
      {
        cue: "STEP BACK",
        instruction:
          "Step behind the rubber. Physical separation from the last pitch.",
      },
      {
        cue: "ONE BREATH",
        instruction: "Exhale first. Then slow inhale. Nervous system reset.",
      },
      {
        cue: "GRIP CHECK",
        instruction: "Find your seams. Reference point locked.",
      },
      {
        cue: "TEMPO CUE",
        instruction: '"Work fast. Attack zone." Say it quietly.',
      },
      {
        cue: "NOD. GO.",
        instruction: "Get your sign. Commit. Deliver with conviction.",
      },
    ],
    printCue: "STEP BACK · BREATHE · GRIP · NOD · GO",
  },
  {
    id: "ingame_pre_ab",
    name: "Pre-AB Routine",
    tagline: "Same process every at-bat. Every time.",
    icon: "time",
    color: Colors.warning,
    bucket: "ingame",
    roles: ["infielder", "outfielder", "catcher"],
    mode: "print_card",
    duration: "30 sec",
    whenToUse: "In the on-deck circle before every at-bat.",
    steps: [
      {
        cue: "WATCH HIM",
        instruction: "Track his release point from the on-deck circle.",
      },
      {
        cue: "TIME IT",
        instruction: "Two to three swings timed to his arm speed.",
      },
      {
        cue: "SET YOUR ZONE",
        instruction: "Name your damage zone. Know it before you step in.",
      },
      {
        cue: "CUE WORD",
        instruction: 'Say your approach cue: "See it early." "Hunt middle."',
      },
      {
        cue: "STEP IN",
        instruction: "Walk in like you belong. Because you do.",
      },
    ],
    printCue: "WATCH · TIME IT · ZONE · CUE · STEP IN",
  },
  {
    id: "ingame_post_strikeout",
    name: "Post-Strikeout Flush",
    tagline: "Short memory. Same player. Next time.",
    icon: "refresh",
    color: Colors.warning,
    bucket: "ingame",
    roles: ["infielder", "outfielder", "catcher"],
    mode: "print_card",
    duration: "15 sec",
    whenToUse:
      "Immediately after striking out. The walk back is your reset window.",
    state_tags: ["slump"],
    steps: [
      {
        cue: "EXHALE",
        instruction: "Controlled breath leaving the box. Start the flush here.",
      },
      {
        cue: "CHIN LEVEL",
        instruction: "Not up, not down. Elite body language.",
      },
      { cue: "PUT IT AWAY", instruction: "Bat away cleanly. Not with anger." },
      {
        cue: "WATCH HIM",
        instruction: "Sit where you can see the pitcher. Study him.",
      },
      {
        cue: "NEXT TIME",
        instruction: "Clean slate. You already know what to do differently.",
      },
    ],
    printCue: "EXHALE · CHIN UP · WATCH · NEXT TIME",
  },
  {
    id: "ingame_error_reset",
    name: "After-Error Reset",
    tagline: "Glove pop. Next play. Same player.",
    icon: "shield",
    color: Colors.danger,
    bucket: "ingame",
    roles: ["infielder", "outfielder"],
    mode: "print_card",
    duration: "15 sec",
    whenToUse: "Immediately after an error or misplay.",
    state_tags: ["error"],
    steps: [
      {
        cue: "GLOVE POP",
        instruction: "One sharp clap. Your physical flush signal.",
      },
      {
        cue: "SELF-TALK",
        instruction: '"Flush it. Next play." Say it quietly.',
      },
      {
        cue: "GET MOVING",
        instruction: "Walk, shuffle, jog — break the mental freeze.",
      },
      {
        cue: "NOD UP",
        instruction: 'Quick nod to your pitcher: "I got the next one."',
      },
      {
        cue: "READY POSITION",
        instruction: "Back in position. Next pitch is pitch one.",
      },
    ],
    printCue: "GLOVE POP · NEXT PLAY · READY",
  },
  {
    id: "ingame_two_strike",
    name: "2-Strike Survival",
    tagline: "Two strikes is not out. Fight.",
    icon: "alert-circle",
    color: Colors.danger,
    bucket: "ingame",
    roles: ["infielder", "outfielder", "catcher"],
    mode: "print_card",
    duration: "10 sec",
    whenToUse: "Before stepping back in at two strikes.",
    steps: [
      {
        cue: "CHOKE UP",
        instruction: "One inch on the handle. Quicker hands.",
      },
      {
        cue: "OPEN UP",
        instruction: "Slightly open stance. See more of the plate.",
      },
      {
        cue: "GO DEEPER",
        instruction: "Let the ball travel. Trust your hands.",
      },
      {
        cue: "EXPAND ZONE",
        instruction: "Anything near the plate gets a short swing.",
      },
      {
        cue: "COMPETE",
        instruction: "One job: make contact. Extend the at-bat.",
      },
    ],
    printCue: "CHOKE UP · GO DEEP · EXPAND · COMPETE",
  },
  {
    id: "ingame_catcher_visit",
    name: "Catcher Mound Visit",
    tagline: "Slow walk. One cue. Walk back confident.",
    icon: "megaphone",
    color: Colors.info,
    bucket: "ingame",
    roles: ["catcher"],
    mode: "print_card",
    duration: "30 sec",
    whenToUse: "When your pitcher is struggling. Before a mound visit.",
    steps: [
      {
        cue: "SLOW WALK",
        instruction: "Your pace sets the energy. Walk slowly to the mound.",
      },
      {
        cue: "EYE CONTACT",
        instruction:
          'Make eye contact when you arrive. Just present. "I am here."',
      },
      {
        cue: "ONE CUE",
        instruction: '"Trust the fastball." "Attack the zone." Pick one only.',
      },
      {
        cue: "THE PLAN",
        instruction: "Remind him of what is working. Short. Direct. Confident.",
      },
      {
        cue: "WALK BACK",
        instruction: "Leave with confidence. He is watching you go.",
      },
    ],
    printCue: "SLOW WALK · ONE CUE · I GOT YOU",
  },
  {
    id: "ingame_no_freebies",
    name: "No Freebies Mound Reset",
    tagline: "Eyes to the mitt. One job. Next pitch.",
    icon: "refresh-circle",
    color: Colors.danger,
    bucket: "ingame",
    roles: ["pitcher"],
    mode: "print_card",
    duration: "15 sec",
    whenToUse: "After a walk, a missed location, or when tempo is slipping.",
    steps: [
      {
        cue: "STEP OFF",
        instruction: "Step back off the rubber. Physical reset, not just mental.",
      },
      {
        cue: "EYES TO THE MITT",
        instruction: "Lock eyes on the glove. That is the only target.",
      },
      {
        cue: "ONE JOB",
        instruction: "Attack the zone. Not the corners. Not perfect. Competitive strike.",
      },
      {
        cue: "NEXT PITCH",
        instruction: "Step back on. Set. Go. No freebies.",
      },
    ],
    printCue: "STEP OFF · EYES · ONE JOB · NEXT PITCH",
  },
  {
    id: "ingame_second_ear",
    name: "Second Ear Lock-In",
    tagline: "Own the plan. Open the second ear.",
    icon: "headset",
    color: Colors.info,
    bucket: "ingame",
    roles: ["infielder", "outfielder", "catcher"],
    mode: "print_card",
    duration: "15 sec",
    whenToUse: "After receiving an adjustment from a coach mid-at-bat or between pitches.",
    steps: [
      {
        cue: "RECEIVE IT",
        instruction: "Eye contact. Nod. Make the coach confident you heard it.",
      },
      {
        cue: "OWN THE PLAN",
        instruction: "Make the cue yours. Say it your way. It is not the coach's at-bat — it is yours.",
      },
      {
        cue: "OPEN THE SECOND EAR",
        instruction: "Stay coachable without losing your read. Hold both: your instinct and the adjustment.",
      },
      {
        cue: "STEP IN READY",
        instruction: "One plan. One cue. Walk back in and compete.",
      },
    ],
    printCue: "RECEIVE · OWN THE PLAN · OPEN THE SECOND EAR",
  },
  {
    id: "ingame_big_chest",
    name: "Big Chest Next Play",
    tagline: "Body language is your reset button.",
    icon: "body",
    color: Colors.primary,
    bucket: "ingame",
    roles: "all",
    mode: "print_card",
    duration: "10 sec",
    whenToUse: "After a mistake, a tough pitch, or any moment when your body starts to shrink.",
    steps: [
      {
        cue: "BIG CHEST",
        instruction: "Shoulders back. Chin level. Chest up. Your body leads your brain out of a bad moment.",
      },
      {
        cue: "BREATHE",
        instruction: "One exhale. Clear the mistake from your posture.",
      },
      {
        cue: "NEXT PLAY",
        instruction: "That play is done. The next one is the only one on the field right now.",
      },
    ],
    printCue: "BIG CHEST · BREATHE · NEXT PLAY",
  },

  // ── BETWEEN INNINGS ───────────────────────────────────────────────────────
  {
    id: "between_inning_pitcher",
    name: "Inning Transition",
    tagline: "Close the inning. Open the next one clean.",
    icon: "refresh-circle",
    color: Colors.primary,
    bucket: "between",
    roles: ["pitcher"],
    mode: "print_card",
    duration: "60 sec",
    whenToUse: "Walking off the mound between innings. Before you sit down.",
    steps: [
      {
        cue: "CLOSE IT",
        instruction:
          "That inning is done. Good or bad — it is closed. Walk off with your chin up.",
      },
      {
        cue: "ONE WIN",
        instruction:
          "Name one pitch or play that worked. Lock it in. That goes with you next inning.",
      },
      {
        cue: "ONE FIX",
        instruction:
          "Name one thing to adjust. One. Not three. Not your whole mechanics. One thing.",
      },
      {
        cue: "RESET BREATH",
        instruction: "One slow exhale on the bench. Clear the slate.",
      },
      {
        cue: "NEXT INNING PLAN",
        instruction:
          "First hitter next inning: what is your plan? First pitch. Attack it.",
      },
    ],
    printCue: "CLOSE IT · ONE WIN · ONE FIX · NEXT PLAN",
  },
  {
    id: "between_inning_defense",
    name: "Dugout Reset",
    tagline: "Come in locked. Go out ready.",
    icon: "people",
    color: Colors.info,
    bucket: "between",
    roles: ["infielder", "outfielder", "catcher"],
    mode: "print_card",
    duration: "60 sec",
    whenToUse:
      "Between every defensive inning. In the dugout before going back out.",
    steps: [
      {
        cue: "SHAKE IT OFF",
        instruction:
          "Transition from offense to defense. Physically shake your hands. Clear mode.",
      },
      {
        cue: "SITUATION CHECK",
        instruction:
          "Who is up? What is the score? What are the outs? Know the situation before the first pitch.",
      },
      {
        cue: "YOUR ASSIGNMENT",
        instruction:
          "Name your first priority. Cutoff position. Bunt coverage. First step read on a line drive.",
      },
      {
        cue: "BODY LANGUAGE",
        instruction:
          "Chin up. Eyes forward. Walk to your position like you own it.",
      },
      {
        cue: "READY HOP",
        instruction:
          "Set your ready position before every pitch. Every single one.",
      },
    ],
    printCue: "SHAKE OFF · SITUATION · ASSIGNMENT · READY",
  },
  {
    id: "between_long_inning",
    name: "Long Inning Focus Reset",
    tagline: "Long inning in the dugout? Re-lock before you go back out.",
    icon: "hourglass",
    color: Colors.warning,
    bucket: "between",
    roles: "all",
    mode: "print_card",
    duration: "30 sec",
    whenToUse: "After a long at-bat inning when focus can drift.",
    steps: [
      {
        cue: "NOTICE THE DRIFT",
        instruction:
          "Long inning. Mind wandered. That is normal. Notice it without judgment.",
      },
      {
        cue: "ONE BREATH",
        instruction: "Single exhale. Restart the focus clock.",
      },
      {
        cue: "NEXT PITCH ONLY",
        instruction:
          "Your only job when you walk back out: be ready for pitch one.",
      },
      {
        cue: "EYES UP",
        instruction:
          "Look at the field. See the grass. Get your eyes out of your head.",
      },
    ],
    printCue: "NOTICE · BREATHE · NEXT PITCH · EYES UP",
  },
  {
    id: "between_slump_reset",
    name: "Mid-Game Slump Shrink",
    tagline: "One at-bat is not the whole season.",
    icon: "trending-up",
    color: Colors.primary,
    bucket: "between",
    roles: "all",
    mode: "print_card",
    duration: "45 sec",
    whenToUse: "Between innings when the slump is weighing on you mid-game.",
    state_tags: ["slump"],
    steps: [
      {
        cue: "SHRINK THE PROBLEM",
        instruction:
          "You are not in a slump in this at-bat. This at-bat has not happened yet.",
      },
      {
        cue: "ONE PROCESS GOAL",
        instruction:
          '"See the ball early." "Stay back." "Take a pitch." Pick one. That is your whole job.',
      },
      {
        cue: "EXHALE HARD",
        instruction: "Exhale everything. Big release breath.",
      },
      {
        cue: "NEXT AT-BAT",
        instruction: "Clean slate. Same player. Better information.",
      },
    ],
    printCue: "SHRINK IT · ONE GOAL · EXHALE · CLEAN SLATE",
  },
  {
    id: "between_battery_sync",
    name: "Battery Sync",
    tagline: "Stay on the same page between innings.",
    icon: "sync",
    color: Colors.purple,
    bucket: "between",
    roles: ["pitcher", "catcher"],
    mode: "print_card",
    duration: "30 sec",
    whenToUse:
      "Quick communication check between pitcher and catcher each inning.",
    steps: [
      {
        cue: "WHAT'S WORKING",
        instruction:
          "Catcher: name the one pitch that has been most effective this inning.",
      },
      {
        cue: "WHAT'S NOT",
        instruction: "Name one pitch to stay away from or adjust. One only.",
      },
      {
        cue: "NEXT 3 HITTERS",
        instruction:
          "Quick mental scan: who is up? What did they struggle with last time?",
      },
      {
        cue: "ONE WORD",
        instruction:
          'Set the tone for next inning together. "Attack." "Slow." "Trust." Say it together.',
      },
    ],
    printCue: "WHAT'S WORKING · ADJUST · NEXT 3 · ONE WORD",
  },
  {
    id: "between_intel_update",
    name: "Between-Inning Intel Update",
    tagline: "Update the read. Do not run on old info.",
    icon: "sync",
    color: Colors.info,
    bucket: "between",
    roles: "all",
    mode: "print_card",
    duration: "30 sec",
    whenToUse: "Between every inning. Quickly update what the dugout has gathered.",
    steps: [
      {
        cue: "WHAT DID WE SEE",
        instruction: "Quick check: what did the pitcher watcher, catcher watcher, or coach watcher pick up last inning?",
      },
      {
        cue: "VERIFY IT",
        instruction: "One data point is a guess. Two data points is a pattern. Verify before you use it.",
      },
      {
        cue: "PASS IT ON",
        instruction: "Tell the next batter one thing. Concise. Actionable. Not five things — one.",
      },
    ],
    printCue: "WHAT DID WE SEE · VERIFY · PASS IT ON",
  },

  // ── POST-GAME ─────────────────────────────────────────────────────────────
  {
    id: "postgame_debrief",
    name: "Postgame 60-Second Debrief",
    tagline: "One win. One fix. One cue.",
    icon: "clipboard",
    color: Colors.primary,
    bucket: "postgame",
    roles: "all",
    mode: "interactive",
    duration: "60 sec",
    whenToUse: "After the final out. Take the lesson before you leave the field.",
    steps: [
      {
        cue: "ONE WIN",
        instruction: "Name one controllable win. Routine, effort, response, communication, or body language.",
      },
      {
        cue: "ONE FIX",
        instruction: "Name the biggest miss as data. Do not drag the whole game home.",
      },
      {
        cue: "CARRY FORWARD",
        instruction: "Pick one cue for tomorrow. Short. Baseball-native. Usable under pressure.",
      },
      {
        cue: "NEXT USEFUL REP",
        instruction: "Load the next rep from the miss. One action, not a giant rebuild.",
      },
    ],
    printCue: "ONE WIN · ONE FIX · ONE CUE · NEXT REP",
  },
  {
    id: "postgame_miss_next_rep",
    name: "Biggest Miss → Next Rep",
    tagline: "Turn one miss into the next useful action.",
    icon: "git-branch",
    color: Colors.purple,
    bucket: "postgame",
    roles: "all",
    mode: "interactive",
    duration: "60 sec",
    whenToUse: "When one miss is still loud after the game.",
    steps: [
      { cue: "ONE FIX", instruction: "Pick the miss category: focus, tempo, plan, body language, reset, communication, result chase, recovery, or body felt off." },
      { cue: "NEXT USEFUL REP", instruction: "Match it to one action: reset, role cue, first rep plan, pregame switch-on, or recovery check." },
      { cue: "LOAD IT", instruction: "Do that rep next. Do not turn one miss into five fixes." },
    ],
    printCue: "MISS · MATCH · NEXT REP",
  },
  {
    id: "carry_forward_cue_builder",
    name: "Carry-Forward Cue Builder",
    tagline: "Build the cue you take into tomorrow.",
    icon: "arrow-forward-circle",
    color: Colors.warning,
    bucket: "postgame",
    roles: "all",
    mode: "interactive",
    duration: "60 sec",
    whenToUse: "After the debrief, before tomorrow's work starts in your head.",
    steps: [
      { cue: "CARRY FORWARD", instruction: "Choose a short cue: One pitch. Ball first. See it early. Breathe. Target. Attack." },
      { cue: "TOMORROW'S FIRST REP", instruction: "Decide where that cue shows up first: catch play, bullpen, first at-bat, defense, or baserunning." },
      { cue: "DO NOT DONATE", instruction: "Do not donate tomorrow to today. Carry the lesson, not the whole game." },
    ],
    printCue: "CUE · FIRST REP · TOMORROW",
  },
  {
    id: "recovery_check",
    name: "Recovery Check",
    tagline: "Know if tonight is recovery, not more grind.",
    icon: "medkit",
    color: Colors.info,
    bucket: "postgame",
    roles: "all",
    mode: "interactive",
    duration: "90 sec",
    whenToUse: "After a game, practice, or heavy throwing day.",
    steps: [
      { cue: "BODY FELT", instruction: "Name it: good, heavy, tight, sore, or off. Be honest. Baseball tomorrow needs information." },
      { cue: "SORENESS CHECK", instruction: "If pain is sharp or unusual, tell a coach, parent, or trainer." },
      { cue: "COOLDOWN", instruction: "Walk, breathe, hydrate, eat, and sleep. Recovery is part of the rep." },
      { cue: "RECOVERY CUE", instruction: "Tonight's cue: shut it down clean. Tomorrow gets the next rep." },
    ],
    printCue: "BODY · SORENESS · COOLDOWN · SLEEP",
  },
  {
    id: "postgame_carry_card",
    name: "Postgame Carry Card",
    tagline: "Screenshot-ready summary for tomorrow.",
    icon: "albums",
    color: Colors.warning,
    bucket: "postgame",
    roles: "all",
    mode: "print_card",
    duration: "30 sec",
    whenToUse: "After the debrief. Screenshot it before you close the day.",
    steps: [
      { cue: "CONTROLLABLE WIN", instruction: "Keep one thing you controlled well." },
      { cue: "BIGGEST MISS", instruction: "Name one fix. One only." },
      { cue: "CARRY-FORWARD CUE", instruction: "Carry this into tomorrow." },
      { cue: "TOMORROW'S FIRST REP", instruction: "Load the next useful rep." },
    ],
    printCue: "ONE WIN · ONE FIX · CARRY · NEXT REP",
  },
  {
    id: "postgame_tough_night",
    name: "Tough Night Reset",
    tagline: "Reframe the rough stretch. Keep your standard.",
    icon: "moon",
    color: Colors.purple,
    bucket: "postgame",
    roles: "all",
    mode: "interactive",
    duration: "4 min",
    whenToUse: "After a rough game or a night that is hard to shake.",
    state_tags: ["slump", "postgame_tough"],
    steps: [
      {
        cue: "SAY IT",
        instruction:
          'Rough night. It happened. Say it without trying to fix it yet: "That was rough."',
      },
      {
        cue: "SAME PLAYER",
        instruction:
          "One bad game does not change who you are. Name three things you know about yourself as a player that did not change tonight.",
      },
      {
        cue: "REFRAME",
        instruction:
          'Rewrite the story. Not "I was terrible" — but "I competed, the results did not go my way, and I know what I want to do differently."',
      },
      {
        cue: "YOUR STANDARD",
        instruction:
          'What is your standard as a player? Say it: "I am a player who..." That standard does not change based on one scoreboard.',
      },
      {
        cue: "CLOSE IT OUT",
        instruction:
          "The game is closed. Same player tomorrow. Better information. Same standard. Sleep on it.",
      },
    ],
    printCue: "SAY IT · SAME PLAYER · REFRAME · CLOSE IT",
  },
  {
    id: "postgame_arm_recovery",
    name: "Arm Recovery",
    tagline: "The arm that lasts is the arm that recovers.",
    icon: "fitness",
    color: Colors.info,
    bucket: "postgame",
    roles: ["pitcher"],
    mode: "interactive",
    duration: "6 min",
    whenToUse: "After every throwing session. Non-negotiable.",
    state_tags: ["return_to_throw"],
    steps: [
      {
        cue: "ARM CIRCLES",
        instruction:
          "10 forward, 10 backward. Both arms. Start small, get bigger.",
        timer: 30,
      },
      {
        cue: "SLEEPER STRETCH",
        instruction:
          "Lie on your throwing side. Push forearm toward the ground gently. 30 seconds each side.",
        timer: 60,
      },
      {
        cue: "CROSS-BODY",
        instruction:
          "Pull throwing arm across your chest. Feel the posterior shoulder. Hold 30 seconds.",
        timer: 30,
      },
      {
        cue: "FOAM ROLL",
        instruction:
          "Roll your lat and posterior shoulder. 60 seconds per side. The lat is attached to your arm — take care of it.",
        timer: 120,
      },
      {
        cue: "HYDRATE",
        instruction:
          "16-20oz of water within the next hour. Recovery happens at the cellular level. Feed it.",
      },
    ],
    printCue: "CIRCLES · SLEEPER · CROSS-BODY · ROLL · HYDRATE",
  },
  {
    id: "postgame_position_recovery",
    name: "Post-Game Recovery",
    tagline: "Take care of your body tonight.",
    icon: "medkit",
    color: Colors.info,
    bucket: "postgame",
    roles: ["infielder", "outfielder", "catcher"],
    mode: "interactive",
    duration: "3 min",
    whenToUse: "After every game. Your non-negotiable recovery routine.",
    state_tags: ["return_to_throw"],
    steps: [
      {
        cue: "FLUSH IT OUT",
        instruction:
          "Light jog or walk for 2-3 minutes. Get the blood moving. Most underrated recovery tool.",
        timer: 60,
      },
      {
        cue: "HIP FLEXORS",
        instruction:
          "Kneeling hip flexor stretch. 30 seconds each side. Baseball destroys hip flexors.",
        timer: 60,
      },
      {
        cue: "HAMSTRINGS",
        instruction:
          "Standing hamstring stretch. 30 seconds each side. If you dove or slid today — give extra time here.",
        timer: 60,
      },
      {
        cue: "HYDRATE AND EAT",
        instruction:
          "Water and protein within 30 minutes of the final out. Your muscles are open to recovery right now.",
      },
      {
        cue: "SLEEP PLAN",
        instruction:
          "You need 8 hours. Name what time you need to be asleep tonight.",
      },
    ],
    printCue: "FLUSH · STRETCH · HYDRATE · SLEEP",
  },
  {
    id: "postgame_win_fix_carry",
    name: "Win / Fix / Carry",
    tagline: "Leave the field with three things locked.",
    icon: "checkmark-circle",
    color: Colors.primary,
    bucket: "postgame",
    roles: "all",
    mode: "interactive",
    duration: "60 sec",
    whenToUse: "Right after the final out. Three quick answers before you leave the field.",
    steps: [
      {
        cue: "ONE WIN",
        instruction: "Name one controllable win from today. Routine, effort, response, body language, or communication. One.",
      },
      {
        cue: "ONE FIX",
        instruction: "Name the one thing to adjust. Not three things. One fix as data, not self-punishment.",
      },
      {
        cue: "ONE CUE",
        instruction: "Pick the line you carry into the next rep. Short. Baseball-native. Usable under pressure.",
      },
    ],
    printCue: "ONE WIN · ONE FIX · ONE CUE",
  },
  {
    id: "postgame_buzzsaw",
    name: "Buzzsaw Debrief",
    tagline: "When you lose big, make it useful.",
    icon: "analytics",
    color: Colors.danger,
    bucket: "postgame",
    roles: "all",
    mode: "interactive",
    duration: "2 min",
    whenToUse: "After a lopsided loss. Turn the result into information instead of damage.",
    steps: [
      {
        cue: "SAY THE SCORE",
        instruction: "Name the score out loud. Own it. Then move past it — the debrief is not about the score.",
      },
      {
        cue: "WHAT THEY DID WELL",
        instruction: "Name one thing the other team executed that hurt you most. Study it without making it personal.",
      },
      {
        cue: "WHAT YOU CONTROLLED",
        instruction: "Name one thing you competed well despite the score. Effort, body language, one good rep.",
      },
      {
        cue: "LEARN FROM THE TEAM THAT BEAT YOU",
        instruction: "What can you steal from what they did? Better teams teach you things. Take the lesson.",
      },
    ],
    printCue: "OWN IT · WHAT THEY DID · LEARN FROM IT",
  },
  {
    id: "postgame_next_game_reset",
    name: "Next Game Reset",
    tagline: "Close it. Start fresh.",
    icon: "arrow-forward-circle",
    color: Colors.primary,
    bucket: "postgame",
    roles: "all",
    mode: "interactive",
    duration: "60 sec",
    whenToUse: "After the debrief. Close today before tomorrow's game starts in your head.",
    steps: [
      {
        cue: "CLOSE IT",
        instruction: "This game is done. Good or bad, it is a closed file. Name one word to describe how you competed today.",
      },
      {
        cue: "LESSON LOCKED",
        instruction: "One fix loaded. One carry-forward cue ready. That is all you are taking with you.",
      },
      {
        cue: "START FRESH",
        instruction: "Tomorrow's game starts at zero. Not up, not down. Same player. Same standard. Better information.",
      },
    ],
    printCue: "CLOSE IT · LESSON LOCKED · START FRESH",
  },
];

// ─── BUCKET META ─────────────────────────────────────────────────────────────

const TIMING_TABS: TimingBucket[] = ["pre", "live", "post"];

const BUCKET_META: Record<
  TimingBucket,
  {
    icon: string;
    color: string;
    label: string;
    headline: string;
    subtext: string;
    phoneOk: boolean;
  }
> = {
  pre: {
    icon: "sunny",
    color: Colors.primary,
    label: "PRE",
    headline: "Before first pitch.",
    subtext: "Use these before warmups or in the dugout.",
    phoneOk: true,
  },
  live: {
    icon: "baseball",
    color: Colors.primary,
    label: "LIVE",
    headline: "Game is live.",
    subtext: "Quick resets only. Keep it short.",
    phoneOk: false,
  },
  post: {
    icon: "moon",
    color: Colors.purple,
    label: "POST",
    headline: "After the last out.",
    subtext: "Log it, recover, and carry one cue forward.",
    phoneOk: true,
  },
};

const DEFAULT_INTENT_BY_BUCKET: Record<TimingBucket, IntentKey> = {
  pre: "get_ready",
  live: "reset",
  post: "debrief",
};

const INTENT_CHIPS_BY_BUCKET: Record<
  TimingBucket,
  Array<{ key: IntentKey; label: string }>
> = {
  pre: [
    { key: "get_ready", label: "Get Ready" },
    { key: "refocus", label: "Refocus" },
  ],
  live: [
    { key: "reset", label: "Reset" },
    { key: "refocus", label: "Refocus" },
  ],
  post: [
    { key: "debrief", label: "Debrief" },
    { key: "recover", label: "Recover" },
  ],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function normalizeGameModeBucket(bucket: Bucket | string): TimingBucket {
  if (bucket === "pregame" || bucket === "pre") return "pre";
  if (bucket === "postgame" || bucket === "post") return "post";
  return "live";
}

function toolMatchesRole(tool: GameTool, role: RoleKey): boolean {
  if (tool.roles === "all") return true;
  return (tool.roles as RoleKey[]).includes(role);
}

function getToolIntent(tool: GameTool): IntentKey {
  if (tool.id.includes("recovery") || tool.id.includes("arm_recovery"))
    return "recover";
  if (
    tool.id.includes("postgame_debrief") ||
    tool.id.includes("tough_night") ||
    tool.id.includes("miss_next_rep") ||
    tool.id.includes("carry_forward") ||
    tool.id.includes("postgame_carry_card") ||
    tool.id.includes("win_fix_carry") ||
    tool.id.includes("buzzsaw") ||
    tool.id.includes("next_game_reset")
  )
    return "debrief";
  if (
    tool.id.includes("pregame_prime") ||
    tool.id.includes("pregame_switch_on") ||
    tool.id.includes("first_rep_plan") ||
    tool.id.includes("pregame_confidence") ||
    tool.id.includes("pregame_carry_card") ||
    tool.id.includes("first_ab") ||
    tool.id.includes("pre_bullpen") ||
    tool.id.includes("underdog_plan") ||
    tool.id.includes("high_velo") ||
    tool.id.includes("dugout_intel") ||
    tool.id.includes("mound_lockin")
  )
    return "get_ready";
  if (
    tool.id.includes("role_cue") ||
    tool.id.includes("nerves") ||
    tool.id.includes("pre_ab") ||
    tool.id.includes("two_strike") ||
    tool.id.includes("catcher_visit") ||
    tool.id.includes("battery_sync")
  )
    return "refocus";
  return "reset";
}

function getTools(
  bucket: TimingBucket,
  role: RoleKey,
  intent: IntentKey | null = null,
): GameTool[] {
  return GAME_TOOLS.filter((t) => {
    if (normalizeGameModeBucket(t.bucket) !== bucket) return false;
    if (!toolMatchesRole(t, role)) return false;
    if (intent && intent !== "all" && getToolIntent(t) !== intent) return false;
    return true;
  });
}

function getNextRepTools(
  bucket: TimingBucket,
  intent: IntentKey,
  role: RoleKey,
): GameTool[] {
  const rolePriority: Partial<
    Record<TimingBucket, Partial<Record<IntentKey, string[]>>>
  > = {
    pre: {
      get_ready:
        role === "pitcher"
          ? ["pregame_switch_on", "first_rep_plan", "pre_bullpen"]
          : ["pregame_switch_on", "first_rep_plan", "pregame_carry_card"],
      refocus: ["role_cue_lockin", "pregame_confidence_check", "nerves_to_attack", "slump_pregame"],
    },
    live: {
      reset:
        role === "pitcher"
          ? ["ingame_pitch_reset", "between_inning_pitcher"]
          : [
              "between_inning_defense",
              "ingame_error_reset",
              "ingame_post_strikeout",
            ],
      refocus:
        role === "catcher"
          ? ["ingame_catcher_visit", "between_battery_sync"]
          : ["between_slump_reset", "ingame_two_strike", "ingame_pre_ab"],
    },
    post: {
      debrief: ["postgame_debrief", "postgame_miss_next_rep", "carry_forward_cue_builder"],
      recover:
        role === "pitcher"
          ? ["recovery_check", "postgame_arm_recovery"]
          : ["recovery_check", "postgame_position_recovery"],
    },
  };
  const candidates = getTools(bucket, role, intent);
  const priority = rolePriority[bucket]?.[intent] ?? [];
  return [...candidates]
    .sort((a, b) => {
      const ai = priority.indexOf(a.id);
      const bi = priority.indexOf(b.id);
      if (ai !== -1 || bi !== -1)
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.duration.localeCompare(b.duration);
    })
    .slice(0, 2);
}

function getEmptySubtitle(bucket: TimingBucket): string {
  if (bucket === "pre") return "Pregame stack is still being built.";
  if (bucket === "live") return "No live tools match this filter yet.";
  return "Postgame tools will show here after the final out.";
}

function formatSeasonPhase(phase: SeasonPhase): string {
  return phase.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function DrillModeSection({ onStartDrill }: { onStartDrill: (drill: RapidRepDrill) => void }) {
  return (
    <View style={s.drillSection}>
      <View style={s.drillHeroCard}>
        <Image
          source={require('../../assets/coach-cap/half-body-pointing.png')}
          style={s.drillCoachImage}
          resizeMode="contain"
        />
        <Text style={s.dividerLabel}>TRAIN IQ</Text>
        <Text style={s.drillHeroTitle}>5 quick baseball decisions</Text>
        <Text style={s.drillHeroSub}>Read the game. Make the call. Get immediate coaching feedback.</Text>
      </View>

      <View style={s.drillGrid}>
        {RAPID_REP_DRILLS.map((drill) => (
          <Pressable
            key={drill.id}
            onPress={() => onStartDrill(drill)}
            style={({ pressed }) => [
              s.drillCard,
              s.drillCardPlayable,
              { borderColor: drill.color + "66", backgroundColor: drill.color + "12" },
              pressed && { opacity: 0.82, transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={s.drillCardTopRow}>
              <Ionicons name={drill.icon as any} size={17} color={drill.color} />
              <Text style={[s.drillLiveTag, { color: drill.color }]}>PLAY</Text>
            </View>
            <Text style={[s.drillTitle, { color: drill.color }]}>{drill.label}</Text>
            <Text style={s.drillCardSub}>{drill.subtitle}</Text>
          </Pressable>
        ))}

        {RAPID_REP_ROADMAP_CARDS.map((drill) => (
          <View
            key={drill.label}
            style={[s.drillCard, { borderColor: drill.color + "30" }]}
          >
            <View style={s.drillCardTopRow}>
              <Ionicons name={drill.icon as any} size={17} color={drill.color} />
              <Text style={s.drillSoonTag}>NEXT</Text>
            </View>
            <Text style={[s.drillTitle, { color: drill.color }]}>{drill.label}</Text>
            <Text style={s.drillCardSub}>{drill.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RapidRepDrillRunner({
  drill,
  onBack,
}: {
  drill: RapidRepDrill;
  onBack: () => void;
}) {
  const [repIdx, setRepIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<RapidRepOption | null>(null);
  const [results, setResults] = useState<RapidRepOutcome[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const currentRep = drill.reps[repIdx];
  const isFinalRep = repIdx >= drill.reps.length - 1;
  const isComplete = showSummary;
  const primaryReads = results.filter((result) => result === "primary").length;
  const acceptableReads = results.filter((result) => result === "acceptable").length;
  const readScore = primaryReads + acceptableReads * 0.5;
  const readQuality = readScore >= 4.5 ? "Elite reads" : readScore >= 3.5 ? "Game-ready" : readScore >= 2.5 ? "Developing feel" : "Needs cleaner pre-pitch plan";

  function lockDecision(option: RapidRepOption) {
    if (selectedOption) return;
    setSelectedOption(option);
    setResults((prev) => [...prev, option.outcome]);
    if (option.outcome === "primary") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function nextRep() {
    if (!selectedOption) return;
    if (isFinalRep) {
      setShowSummary(true);
      return;
    }
    setRepIdx((idx) => idx + 1);
    setSelectedOption(null);
    Haptics.selectionAsync();
  }

  function runItBack() {
    setRepIdx(0);
    setSelectedOption(null);
    setResults([]);
    setShowSummary(false);
    Haptics.selectionAsync();
  }

  if (isComplete) {
    return (
      <View style={rrStyles.container}>
        <View style={[rrStyles.summaryShell, { borderColor: drill.color + "66" }]}>
          <Text style={[rrStyles.kicker, { color: drill.color }]}>RAPID REP COMPLETE</Text>
          <Text style={rrStyles.summaryTitle}>{readQuality}</Text>
          <Text style={rrStyles.scoreText}>{primaryReads}/{drill.reps.length} clean reads</Text>
          <View style={rrStyles.scoreRail}>
            <View style={[rrStyles.scoreFill, { width: `${(readScore / drill.reps.length) * 100}%`, backgroundColor: drill.color }]} />
          </View>
          <Text style={rrStyles.summaryCopy}>{drill.takeaway}</Text>
          <Text style={rrStyles.safeguardCopy}>Game Mode drill only. No lesson XP awarded.</Text>
        </View>

        <Pressable style={[rrStyles.primaryBtn, { backgroundColor: drill.color }]} onPress={runItBack}>
          <Text style={rrStyles.primaryBtnText}>Run it back</Text>
        </Pressable>
        <Pressable style={rrStyles.secondaryBtn} onPress={onBack}>
          <Text style={rrStyles.secondaryBtnText}>Back to Game Mode</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={rrStyles.container}>
      <View style={rrStyles.progressRow}>
        <Text style={rrStyles.repCounter}>Rep {repIdx + 1} of {drill.reps.length}</Text>
        <Text style={[rrStyles.tag, { color: drill.color }]}>{currentRep.tag.toUpperCase()}</Text>
      </View>
      <View style={rrStyles.progressTrack}>
        <View style={[rrStyles.progressFill, { width: `${((repIdx + (selectedOption ? 1 : 0)) / drill.reps.length) * 100}%`, backgroundColor: drill.color }]} />
      </View>

      <View style={rrStyles.scenarioCard}>
        <Text style={[rrStyles.kicker, { color: drill.color }]}>READ THE GAME</Text>
        <Text style={rrStyles.repTitle}>{currentRep.title}</Text>
        <Text style={rrStyles.situation}>{currentRep.situation}</Text>
        <Text style={rrStyles.prompt}>{currentRep.prompt}</Text>
      </View>

      <View style={rrStyles.optionStack}>
        {currentRep.options.map((option) => {
          const picked = selectedOption?.label === option.label;
          const reveal = Boolean(selectedOption);
          const outcomeColor = option.outcome === "primary" ? Colors.primary : option.outcome === "acceptable" ? Colors.warning : Colors.danger;
          return (
            <Pressable
              key={option.label}
              disabled={reveal}
              onPress={() => lockDecision(option)}
              style={[
                rrStyles.optionBtn,
                picked && { borderColor: outcomeColor, backgroundColor: outcomeColor + "12" },
                reveal && !picked && rrStyles.optionMuted,
              ]}
            >
              <Text style={[rrStyles.optionText, picked && { color: outcomeColor }]}>{option.label}</Text>
              {picked && <Ionicons name={option.outcome === "caution" ? "alert-circle" : "checkmark-circle"} size={18} color={outcomeColor} />}
            </Pressable>
          );
        })}
      </View>

      {selectedOption && (
        <View style={[rrStyles.feedbackCard, { borderColor: (selectedOption.outcome === "primary" ? Colors.primary : selectedOption.outcome === "acceptable" ? Colors.warning : Colors.danger) + "66" }]}>
          <Text style={rrStyles.feedbackText}>{selectedOption.feedback}</Text>
          <Text style={rrStyles.reasonText}>{selectedOption.reason}</Text>
        </View>
      )}

      <Pressable
        style={[rrStyles.primaryBtn, { backgroundColor: selectedOption ? drill.color : Colors.surface }]}
        disabled={!selectedOption}
        onPress={nextRep}
      >
        <Text style={[rrStyles.primaryBtnText, !selectedOption && { color: Colors.textTertiary }]}>
          {isFinalRep && selectedOption ? "Show summary" : "Next rep"}
        </Text>
      </Pressable>
      <Pressable style={rrStyles.secondaryBtn} onPress={onBack}>
        <Text style={rrStyles.secondaryBtnText}>Back to Game Mode</Text>
      </Pressable>
    </View>
  );
}

// ─── PRINT CARD SCREEN ────────────────────────────────────────────────────────

function PrintCardScreen({
  tool,
  onBack,
}: {
  tool: GameTool;
  onBack: () => void;
}) {
  async function handleShare() {
    const steps = tool.steps
      .map((s, i) => `${i + 1}. ${s.cue}  —  ${s.instruction}`)
      .join("\n");
    const text = [
      "[ CLUTCHR BASEBALL — GAME CARD ]",
      tool.name.toUpperCase(),
      "",
      `WHEN: ${tool.whenToUse}`,
      `TIME: ${tool.duration}`,
      "",
      steps,
      "",
      "─────────────────",
      `CUE:  ${tool.printCue}`,
      "─────────────────",
      "clutchr.app",
    ].join("\n");
    try {
      await Share.share({ message: text, title: tool.name });
    } catch {}
  }

  return (
    <View style={pStyles.container}>
      <Pressable style={pStyles.backRow} onPress={onBack}>
        <Ionicons name="arrow-back" size={15} color={Colors.primary} />
        <Text style={pStyles.backText}>Back to Game Mode</Text>
      </Pressable>

      <View style={pStyles.warningBanner}>
        <Ionicons
          name="phone-portrait-outline"
          size={15}
          color={Colors.warning}
        />
        <Text style={pStyles.warningText}>
          No phone on the field. Screenshot or print this card and keep it in
          your bat bag.
        </Text>
      </View>

      <View style={pStyles.card}>
        <View
          style={[
            pStyles.cardHeader,
            { borderLeftColor: tool.color, borderLeftWidth: 4 },
          ]}
        >
          <View
            style={[
              pStyles.cardIconWrap,
              { backgroundColor: tool.color + "18" },
            ]}
          >
            <Ionicons name={tool.icon as any} size={18} color={tool.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pStyles.cardEyebrow}>
              CLUTCHR BASEBALL ·{" "}
              {BUCKET_META[normalizeGameModeBucket(tool.bucket)].label}
            </Text>
            <Text style={pStyles.cardTitle}>{tool.name}</Text>
            <Text style={pStyles.cardMeta}>
              {tool.duration} · {tool.whenToUse}
            </Text>
          </View>
        </View>

        <View style={pStyles.divider} />

        <View style={pStyles.stepsList}>
          {tool.steps.map((step, i) => (
            <View key={i} style={pStyles.stepRow}>
              <View
                style={[
                  pStyles.stepDot,
                  {
                    borderColor: tool.color + "60",
                    backgroundColor: tool.color + "12",
                  },
                ]}
              >
                <Text style={[pStyles.stepDotNum, { color: tool.color }]}>
                  {i + 1}
                </Text>
              </View>
              <View style={pStyles.stepText}>
                <Text style={[pStyles.stepCue, { color: tool.color }]}>
                  {step.cue}
                </Text>
                <Text style={pStyles.stepInstr}>{step.instruction}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={pStyles.divider} />

        <View style={[pStyles.cueBar, { backgroundColor: tool.color + "12" }]}>
          <Text style={pStyles.cueBarLabel}>YOUR CUE SEQUENCE</Text>
          <Text style={[pStyles.cueBarText, { color: tool.color }]}>
            {tool.printCue}
          </Text>
        </View>
      </View>

      <Pressable
        style={[pStyles.shareBtn, { backgroundColor: tool.color }]}
        onPress={handleShare}
      >
        <Ionicons name="share-outline" size={16} color="#fff" />
        <Text style={pStyles.shareBtnText}>Share / Screenshot / Print</Text>
      </Pressable>

      <Text style={pStyles.hint}>
        Fold to index card size (3×5) · Keep in back pocket or bat bag · No
        phone needed
      </Text>
    </View>
  );
}

// ─── INTERACTIVE RUNNER ───────────────────────────────────────────────────────

function ToolRunner({
  tool,
  onFinish,
}: {
  tool: GameTool;
  onFinish: () => void;
}) {
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
    if (tool.mode === "print_card") return;
    const GM_KEY = "gm_completed_today";
    const DATE_KEY = "gm_completed_date";
    const today = new Date().toDateString();
    const lastDate = await AsyncStorage.getItem(DATE_KEY);
    const completedToday: string[] =
      lastDate === today
        ? JSON.parse((await AsyncStorage.getItem(GM_KEY)) ?? "[]")
        : [];
    // Anti-farming: Game Mode tools grant a small daily training bonus once per day.
    // Core lesson first-clears should remain the main source of XP.
    if (completedToday.length >= 1 || completedToday.includes(tool.id)) return;
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
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setStepIdx((s) => s + 1);
      setTimerRunning(false);
      setTimerDone(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
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
        <Pressable
          style={[rStyles.btn, { backgroundColor: tool.color }]}
          onPress={onFinish}
        >
          <Text style={rStyles.btnText}>Close →</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View style={[rStyles.container, { opacity: fadeAnim }]}>
      <Text style={rStyles.counter}>
        {stepIdx + 1} / {tool.steps.length}
      </Text>

      <View
        style={[
          rStyles.cuePill,
          {
            borderColor: tool.color + "50",
            backgroundColor: tool.color + "12",
          },
        ]}
      >
        <Text style={[rStyles.cueWord, { color: tool.color }]}>
          {currentStep.cue}
        </Text>
      </View>

      <Text style={rStyles.instruction}>{currentStep.instruction}</Text>

      {currentStep?.timer && timerSec !== null && (
        <View style={rStyles.timerWrap}>
          <View
            style={[
              rStyles.timerRing,
              { borderColor: timerRunning ? tool.color : Colors.border },
            ]}
          >
            <Text
              style={[rStyles.timerNum, timerRunning && { color: tool.color }]}
            >
              {timerSec}
            </Text>
            <Text style={rStyles.timerLabel}>sec</Text>
          </View>
          {timerRunning && (
            <Text style={[rStyles.timerStatus, { color: tool.color }]}>
              Hold it.
            </Text>
          )}
          {timerDone && (
            <Text style={[rStyles.timerStatus, { color: tool.color }]}>
              Time.
            </Text>
          )}
        </View>
      )}

      {currentStep?.timer ? (
        !timerRunning && !timerDone ? (
          <Pressable
            style={[rStyles.btn, { backgroundColor: tool.color }]}
            onPress={startTimer}
          >
            <Text style={rStyles.btnText}>Go →</Text>
          </Pressable>
        ) : timerDone ? (
          <Pressable
            style={[rStyles.btn, { backgroundColor: tool.color }]}
            onPress={advance}
          >
            <Text style={rStyles.btnText}>
              {stepIdx >= tool.steps.length - 1 ? "Finish" : "Next →"}
            </Text>
          </Pressable>
        ) : null
      ) : (
        <Pressable
          style={[rStyles.btn, { backgroundColor: tool.color }]}
          onPress={advance}
        >
          <Text style={rStyles.btnText}>
            {stepIdx >= tool.steps.length - 1 ? "Finish" : "Got it →"}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}


function PostgameDebriefRunner({
  tool,
  onFinish,
  onDebriefComplete,
}: {
  tool: GameTool;
  onFinish: () => void;
  onDebriefComplete?: (summary: DebriefSummary) => void;
}) {
  const [win, setWin] = useState(DEBRIEF_WIN_OPTIONS[0]);
  const [miss, setMiss] = useState(DEBRIEF_MISS_OPTIONS[0]);
  const [feel, setFeel] = useState("Ready to reset");
  const [cue, setCue] = useState(CARRY_CUE_OPTIONS[0]);
  const [customCue, setCustomCue] = useState("");
  const [saved, setSaved] = useState<DebriefSummary | null>(null);
  const nextRep = getNextRepForMiss(miss);
  const carryCue = customCue.trim() || cue;

  async function saveDebrief() {
    const summary: DebriefSummary = {
      win,
      miss,
      feel,
      cue: carryCue,
      nextRep,
      savedAt: new Date().toISOString(),
    };
    setSaved(summary);
    onDebriefComplete?.(summary);
    await AsyncStorage.setItem(DEBRIEF_STORAGE_KEY, JSON.stringify(summary));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  if (saved) {
    return (
      <View style={rStyles.container}>
        <View style={[rStyles.cuePill, { borderColor: tool.color + "50", backgroundColor: tool.color + "12" }]}>
          <Text style={[rStyles.cueWord, { color: tool.color }]}>CARRY FORWARD</Text>
        </View>
        <View style={rStyles.summaryCard}>
          <Text style={rStyles.summaryKicker}>POSTGAME CARRY CARD</Text>
          <Text style={rStyles.summaryTitle}>One win. One fix. One cue.</Text>
          <Text style={rStyles.summaryLine}>ONE WIN: {saved.win}</Text>
          <Text style={rStyles.summaryLine}>ONE FIX: {saved.miss}</Text>
          <Text style={rStyles.summaryLine}>CARRY THIS: {saved.cue}</Text>
          <Text style={[rStyles.summaryLine, { color: Colors.primary }]}>NEXT USEFUL REP: {saved.nextRep}</Text>
        </View>
        <Text style={rStyles.doneSub}>Do not donate tomorrow to today. Take the lesson.</Text>
        <Pressable style={[rStyles.btn, { backgroundColor: tool.color }]} onPress={onFinish}>
          <Text style={rStyles.btnText}>Back to Game Mode →</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={rStyles.debriefWrap} showsVerticalScrollIndicator={false}>
      <Text style={rStyles.counter}>60-second debrief</Text>
      <View style={[rStyles.cuePill, { borderColor: tool.color + "50", backgroundColor: tool.color + "12" }]}>
        <Text style={[rStyles.cueWord, { color: tool.color }]}>ONE WIN · ONE FIX · ONE CUE</Text>
      </View>
      <Text style={rStyles.instruction}>Do not drag the whole game home. Take the lesson and load the next rep.</Text>

      <Text style={rStyles.promptLabel}>ONE WIN</Text>
      <View style={rStyles.chipWrap}>
        {DEBRIEF_WIN_OPTIONS.map((option) => (
          <Pressable key={option} style={[rStyles.choiceChip, win === option && rStyles.choiceChipActive]} onPress={() => setWin(option)}>
            <Text style={[rStyles.choiceText, win === option && rStyles.choiceTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={rStyles.promptLabel}>ONE FIX</Text>
      <View style={rStyles.chipWrap}>
        {DEBRIEF_MISS_OPTIONS.map((option) => (
          <Pressable key={option} style={[rStyles.choiceChip, miss === option && rStyles.choiceChipActive]} onPress={() => setMiss(option)}>
            <Text style={[rStyles.choiceText, miss === option && rStyles.choiceTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={rStyles.promptLabel}>FEEL CHECK</Text>
      <View style={rStyles.chipWrap}>
        {["Ready to reset", "Still hot", "Body feels off"].map((option) => (
          <Pressable key={option} style={[rStyles.choiceChip, feel === option && rStyles.choiceChipActive]} onPress={() => setFeel(option)}>
            <Text style={[rStyles.choiceText, feel === option && rStyles.choiceTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={rStyles.promptLabel}>CARRY FORWARD</Text>
      <View style={rStyles.chipWrap}>
        {CARRY_CUE_OPTIONS.map((option) => (
          <Pressable key={option} style={[rStyles.choiceChip, cue === option && !customCue.trim() && rStyles.choiceChipActive]} onPress={() => { setCue(option); setCustomCue(""); }}>
            <Text style={[rStyles.choiceText, cue === option && !customCue.trim() && rStyles.choiceTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={customCue}
        onChangeText={setCustomCue}
        placeholder="Or type a short cue"
        placeholderTextColor="rgba(255,255,255,0.35)"
        maxLength={32}
        style={rStyles.cueInput}
      />

      <View style={rStyles.nextRepBox}>
        <Text style={rStyles.summaryKicker}>NEXT USEFUL REP</Text>
        <Text style={[rStyles.summaryTitle, { color: Colors.primary }]}>{nextRep}</Text>
        <Text style={rStyles.summaryLine}>Loaded from: {miss}</Text>
      </View>

      <Pressable style={[rStyles.btn, { backgroundColor: tool.color }]} onPress={saveDebrief}>
        <Text style={rStyles.btnText}>Save Carry Card →</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── TOOL CARD ────────────────────────────────────────────────────────────────

function ToolCard({
  tool,
  onPress,
  compact = false,
}: {
  tool: GameTool;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        cStyles.card,
        tool.mode === "print_card" && cStyles.printCard,
        compact && cStyles.compactCard,
        pressed && { opacity: 0.82, transform: [{ scale: 0.99 }] },
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <View
        style={[
          cStyles.icon,
          { backgroundColor: tool.color + "18" },
          compact && cStyles.compactIcon,
        ]}
      >
        <Ionicons
          name={tool.icon as any}
          size={compact ? 18 : 22}
          color={tool.color}
        />
      </View>
      <View style={cStyles.info}>
        <View style={cStyles.titleRow}>
          <Text style={[cStyles.name, compact && cStyles.compactName]}>
            {tool.name}
          </Text>
          {tool.mode === "print_card" ? (
            <View style={cStyles.printBadge}>
              <Ionicons name="print" size={9} color={Colors.warning} />
              <Text style={[cStyles.badgeText, { color: Colors.warning }]}>
                PRINT
              </Text>
            </View>
          ) : (
            <View style={cStyles.phoneBadge}>
              <Ionicons name="phone-portrait" size={9} color={Colors.primary} />
              <Text style={[cStyles.badgeText, { color: Colors.primary }]}>
                PHONE
              </Text>
            </View>
          )}
        </View>
        {!compact && (
          <Text style={cStyles.tagline} numberOfLines={1}>
            {tool.tagline}
          </Text>
        )}
        <Text style={[cStyles.duration, { color: tool.color }]}>
          {tool.duration}
        </Text>
      </View>
      <Ionicons
        name={tool.mode === "print_card" ? "print-outline" : "play-circle"}
        size={compact ? 20 : 24}
        color={tool.color}
      />
    </Pressable>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function GameModeScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState, isLoading } = useAthlete();
  const [bucket, setBucket] = useState<TimingBucket>("pre");
  const [selectedIntent, setSelectedIntent] = useState<IntentKey>(
    DEFAULT_INTENT_BY_BUCKET.pre,
  );
  const pressureCue = getBestCue(athleteState, "pressure");
  const [activeTool, setActiveTool] = useState<GameTool | null>(null);
  const [view, setView] = useState<"runner" | "print" | null>(null);
  const [lastDebrief, setLastDebrief] = useState<DebriefSummary | null>(null);
  const [activeDrill, setActiveDrill] = useState<RapidRepDrill | null>(null);

  const role = (athleteState?.primary_role ?? "infielder") as RoleKey;
  const phase = (athleteState?.season_phase ?? "in_season") as SeasonPhase;
  const firstName = athleteState?.first_name ?? "Athlete";
  const meta = BUCKET_META[bucket];
  const intentChips = INTENT_CHIPS_BY_BUCKET[bucket];
  const nextRepTools = getNextRepTools(bucket, selectedIntent, role);
  const nextRepIds = new Set(nextRepTools.map((tool) => tool.id));
  const moreTools = getTools(bucket, role, selectedIntent).filter(
    (tool) => !nextRepIds.has(tool.id),
  );
  const hasFilteredTools = nextRepTools.length > 0 || moreTools.length > 0;

  useEffect(() => {
    AsyncStorage.getItem(DEBRIEF_STORAGE_KEY)
      .then((value) => {
        if (value) setLastDebrief(JSON.parse(value));
      })
      .catch(() => {});
  }, []);

  function saveDebriefSummary(summary: DebriefSummary) {
    setLastDebrief(summary);
  }

  function openTool(tool: GameTool) {
    setActiveTool(tool);
    setView(tool.mode === "print_card" ? "print" : "runner");
  }

  function closeTool() {
    setActiveTool(null);
    setView(null);
  }

  function openDrill(drill: RapidRepDrill) {
    setActiveDrill(drill);
    Haptics.selectionAsync();
  }

  function closeDrill() {
    setActiveDrill(null);
  }

  function selectBucket(nextBucket: TimingBucket) {
    setBucket(nextBucket);
    setSelectedIntent(DEFAULT_INTENT_BY_BUCKET[nextBucket]);
    closeTool();
    closeDrill();
    Haptics.selectionAsync();
  }

  if (activeDrill) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ClutchrHeader
          variant="flow"
          kicker="TRAIN IQ"
          title={activeDrill.title}
          leftAction={
            <Pressable onPress={closeDrill} hitSlop={12} style={s.backBtn}>
              <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
            </Pressable>
          }
          rightAction={<Text style={s.toolDuration}>5 reps</Text>}
        />
        <ScrollView
          contentContainerStyle={[s.toolScroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <RapidRepDrillRunner drill={activeDrill} onBack={closeDrill} />
        </ScrollView>
      </View>
    );
  }

  // ── Active tool view ──
  if (activeTool && view) {
    const activeMeta = BUCKET_META[normalizeGameModeBucket(activeTool.bucket)];
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ClutchrHeader
          variant="flow"
          kicker={activeMeta.label}
          title={activeTool.name}
          leftAction={
            <Pressable onPress={closeTool} hitSlop={12} style={s.backBtn}>
              <Ionicons
                name="arrow-back"
                size={18}
                color={Colors.textSecondary}
              />
            </Pressable>
          }
          rightAction={
            activeTool.mode === "print_card" ? (
              <View style={s.printTag}>
                <Ionicons name="print" size={10} color={Colors.warning} />
                <Text style={s.printTagText}>PRINT CARD</Text>
              </View>
            ) : (
              <Text style={s.toolDuration}>{activeTool.duration}</Text>
            )
          }
        />
        <ScrollView
          contentContainerStyle={[
            s.toolScroll,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {view === "print" ? (
            <PrintCardScreen tool={activeTool} onBack={closeTool} />
          ) : activeTool.id === "postgame_debrief" ? (
            <PostgameDebriefRunner
              tool={activeTool}
              onFinish={closeTool}
              onDebriefComplete={saveDebriefSummary}
            />
          ) : (
            <ToolRunner tool={activeTool} onFinish={closeTool} />
          )}
        </ScrollView>
      </View>
    );
  }

  // ── List view ──
  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Image
        source={require('../../assets/branding/main-wordmark.png')}
        style={s.gameHeaderWordmark}
        resizeMode="contain"
      />
      <ClutchrHeader
        variant="mainTab"
        kicker="GAME MODE"
        title="GAME MODE"
        subtitle="Game-day tools for the next rep."
        statusPill={`${firstName} • ${role.charAt(0).toUpperCase() + role.slice(1)} • ${formatSeasonPhase(phase)}`}
      />

      <View style={s.bucketRow}>
        {TIMING_TABS.map((b) => {
          const m = BUCKET_META[b];
          const active = bucket === b;
          return (
            <Pressable
              key={b}
              style={[
                s.bucketTab,
                active && {
                  borderBottomWidth: 2,
                  borderBottomColor: Colors.primary,
                },
              ]}
              onPress={() => selectBucket(b)}
            >
              <Ionicons
                name={m.icon as any}
                size={12}
                color={active ? Colors.primary : "rgba(255,255,255,0.4)"}
              />
              <Text
                style={[
                  s.bucketLabel,
                  active
                    ? { color: Colors.primary }
                    : { color: "rgba(255,255,255,0.4)" },
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            s.banner,
            {
              borderColor: meta.color + "30",
              backgroundColor: meta.color + "08",
            },
          ]}
        >
          <Image
            source={require('../../assets/branding/charcoal-c.png')}
            style={s.bannerBrandMark}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.bannerHead, { color: meta.color }]}>
              {meta.headline}
            </Text>
            <Text style={s.bannerSub}>{meta.subtext}</Text>
          </View>
        </View>

        <View style={s.intentPanel}>
          <Text style={s.intentQuestion}>What do you need right now?</Text>
          <View style={s.intentRow}>
            {intentChips.map((intent) => {
              const active = selectedIntent === intent.key;
              return (
                <Pressable
                  key={intent.key}
                  onPress={() => {
                    setSelectedIntent(intent.key);
                    Haptics.selectionAsync();
                  }}
                  style={[s.intentChip, active && s.intentChipActive]}
                >
                  <Text
                    style={[s.intentChipText, active && s.intentChipTextActive]}
                  >
                    {intent.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {bucket === "pre" && (
          <View style={s.commandCard}>
            <Text style={s.commandKicker}>BEFORE FIRST PITCH</Text>
            <Text style={s.commandTitle}>Use first: Pregame 90-Second Switch-On</Text>
            <Text style={s.commandSub}>Then lock one role cue, one first job, and one reset line.</Text>
            <View style={s.miniCueRow}>
              {(ROLE_CUES[role] ?? ROLE_CUES.infielder).slice(0, 3).map((cue) => (
                <Text key={cue} style={s.miniCueChip}>{cue}</Text>
              ))}
            </View>
          </View>
        )}

        {bucket === "post" && lastDebrief && (
          <View style={s.carryCard}>
            <View style={s.carryHeaderRow}>
              <Text style={s.commandKicker}>CARRY THIS INTO TOMORROW</Text>
              <Text style={s.screenshotTag}>SCREENSHOT READY</Text>
            </View>
            <Text style={s.commandTitle}>{lastDebrief.cue}</Text>
            <Text style={s.commandSub}>One win: {lastDebrief.win}</Text>
            <Text style={s.commandSub}>One fix: {lastDebrief.miss}</Text>
            <Text style={[s.commandSub, { color: Colors.primary }]}>Next useful rep: {lastDebrief.nextRep}</Text>
          </View>
        )}

        <View style={s.bannerSlim}>
          <Text style={[s.bannerHead, { color: Colors.primary }]}>
            PERSONAL PRESSURE CUE
          </Text>
          <Text style={[s.bannerSub, { color: "rgba(255,255,255,0.88)" }]}>
            {pressureCue || "Compete."}
          </Text>
        </View>

        <View style={s.sectionDivider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerLabel}>YOUR NEXT REP</Text>
          <View style={s.dividerLine} />
        </View>

        {isLoading
          ? [0, 1].map((i) => <SkeletonCard key={i} />)
          : nextRepTools.length > 0
            ? nextRepTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onPress={() => openTool(tool)}
                  compact={nextRepTools.length > 1}
                />
              ))
            : null}

        <View style={s.sectionDivider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerLabel}>MORE TOOLS</Text>
          <View style={s.dividerLine} />
        </View>

        {isLoading ? (
          [0, 1, 2].map((i) => <SkeletonCard key={i} />)
        ) : !hasFilteredTools ? (
          <View style={s.empty}>
            <Ionicons
              name="baseball-outline"
              size={40}
              color={Colors.textTertiary}
            />
            <Text style={s.emptyTitle}>No tools here yet.</Text>
            <Text style={s.emptySub}>{getEmptySubtitle(bucket)}</Text>
            <Pressable
              style={s.emptyBtn}
              onPress={() => setSelectedIntent("all")}
            >
              <Text style={s.emptyBtnText}>Show All Tools</Text>
            </Pressable>
          </View>
        ) : moreTools.length > 0 ? (
          moreTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onPress={() => openTool(tool)}
            />
          ))
        ) : (
          <Text style={s.moreComplete}>
            Next rep is the best fit. Keep it short.
          </Text>
        )}

        <DrillModeSection onStartDrill={openDrill} />
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  gameHeaderWordmark: {
    width: 136,
    height: 34,
    marginLeft: Spacing.xl,
    marginBottom: -4,
  },
  bucketRow: {
    flexDirection: "row",
    backgroundColor: "#0D0D0D",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    marginBottom: Spacing.md,
  },
  bucketTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
  },
  bucketLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.6,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  bannerBrandMark: {
    width: 24,
    height: 24,
    marginTop: -1,
  },
  bannerHead: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  bannerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: Colors.textTertiary,
    letterSpacing: 1.2,
  },
  empty: { paddingVertical: 60, alignItems: "center", gap: Spacing.md },
  emptyTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  emptyBtnText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: 0.7,
  },
  bannerSlim: {
    borderColor: "#22CC5E55",
    backgroundColor: "#0F1612",
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  commandCard: {
    backgroundColor: "#101510",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "35",
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  carryCard: {
    backgroundColor: "#171304",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.warning + "45",
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  carryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  commandKicker: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: 1.1,
  },
  screenshotTag: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: Colors.warning,
    letterSpacing: 0.8,
  },
  commandTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  commandSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  miniCueRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginTop: Spacing.xs },
  miniCueChip: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primaryBorder,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  intentPanel: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  intentQuestion: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  intentRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  intentChip: {
    minHeight: 36,
    justifyContent: "center",
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  intentChipActive: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryMuted,
  },
  intentChipText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  intentChipTextActive: { color: Colors.primary },
  moreComplete: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textAlign: "center",
    paddingVertical: Spacing.sm,
  },
  drillSection: { gap: Spacing.md, marginTop: Spacing.lg },
  drillCoachImage: {
    position: 'absolute',
    right: 8,
    bottom: -2,
    width: 96,
    height: 116,
    opacity: 0.9,
  },
  drillHeroCard: {
    backgroundColor: Colors.surfaceGlow,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.md,
    gap: 5,
  },
  drillHeroTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  drillHeroSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  drillGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  drillCard: {
    width: "48%",
    minHeight: 98,
    backgroundColor: "#12101A",
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    gap: 6,
  },
  drillCardPlayable: {
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  drillCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  drillLiveTag: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.7,
  },
  drillSoonTag: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: Colors.textTertiary,
    letterSpacing: 0.7,
  },
  drillTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.7,
  },
  drillCardSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.42)",
    lineHeight: 14,
  },
  toolHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  toolHeaderName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  printTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.warningMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  printTagText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  toolDuration: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  toolScroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
});

const rrStyles = StyleSheet.create({
  container: { gap: Spacing.md },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  repCounter: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  tag: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceHigh,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.pill,
  },
  scenarioCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  kicker: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  repTitle: {
    fontSize: 27,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  situation: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  prompt: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  optionStack: { gap: Spacing.sm },
  optionBtn: {
    minHeight: 62,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  optionMuted: { opacity: 0.42 },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  feedbackCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  feedbackText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  reasonText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  primaryBtn: {
    minHeight: 58,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.black,
  },
  secondaryBtn: {
    minHeight: 54,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  summaryShell: {
    backgroundColor: Colors.surfaceGlow,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  scoreText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  scoreRail: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceHigh,
    overflow: "hidden",
  },
  scoreFill: { height: "100%", borderRadius: Radius.pill },
  summaryCopy: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
    lineHeight: 23,
  },
  safeguardCopy: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    lineHeight: 16,
  },
});

const cStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactCard: { padding: Spacing.sm, gap: Spacing.sm },
  printCard: {
    borderStyle: "dashed",
    borderColor: Colors.warning + "50",
    backgroundColor: Colors.warningMuted + "25",
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  compactIcon: { width: 36, height: 36 },
  info: { flex: 1, gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    flex: 1,
  },
  compactName: { fontSize: 13 },
  printBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.warningMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  phoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  badgeText: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  tagline: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  duration: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
});

const rStyles = StyleSheet.create({
  container: {
    gap: Spacing.xl,
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  counter: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    letterSpacing: 1,
    alignSelf: "flex-start",
  },
  cuePill: {
    borderRadius: Radius.xl,
    borderWidth: 2,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    width: "100%",
  },
  cueWord: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    textAlign: "center",
  },
  instruction: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
    lineHeight: 26,
    textAlign: "center",
  },
  timerWrap: { alignItems: "center", gap: Spacing.sm },
  timerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  timerNum: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  timerLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  timerStatus: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  btn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    width: "100%",
  },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  doneWrap: {
    gap: Spacing.lg,
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  doneSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  debriefWrap: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  promptLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.textTertiary,
    letterSpacing: 1.1,
    marginTop: Spacing.sm,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  choiceChip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  choiceChipActive: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryMuted,
  },
  choiceText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  choiceTextActive: { color: Colors.primary },
  cueInput: {
    minHeight: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: Spacing.md,
  },
  nextRepBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    backgroundColor: Colors.primaryMuted,
    padding: Spacing.md,
    gap: 4,
  },
  summaryCard: {
    width: "100%",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.warning + "45",
    backgroundColor: "#171304",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryKicker: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.warning,
    letterSpacing: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  summaryLine: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});

const pStyles = StyleSheet.create({
  container: { gap: Spacing.lg },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.warningMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardEyebrow: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  divider: { height: 1, backgroundColor: Colors.border },
  stepsList: { padding: Spacing.lg, gap: Spacing.md },
  stepRow: { flexDirection: "row", gap: Spacing.sm, alignItems: "flex-start" },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepDotNum: { fontSize: 11, fontFamily: "Inter_700Bold" },
  stepText: { flex: 1, gap: 2 },
  stepCue: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  stepInstr: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  cueBar: { padding: Spacing.lg, gap: 4 },
  cueBarLabel: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  cueBarText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
  },
  shareBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});
