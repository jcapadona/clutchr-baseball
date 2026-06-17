import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import { fetchLessons, type LegacyLesson } from '@/lib/supabase';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ClutchrHeader } from '@/components/ClutchrHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { useMicrocopy } from '@/hooks/useMicrocopy';
import { ErrorState, SkeletonCard } from '@/components/SkeletonLoader';

// ─── DEV FLAGS ────────────────────────────────────────────────────────────────
// Set to false before App Store submission.
const DEV_UNLOCK_ALL = true;

// ─── WORLD CONFIG ─────────────────────────────────────────────────────────────

type World = {
  id: string;
  label: string;
  tagline: string;
  color: string;
  chapter: 'foundation' | 'your-craft' | 'edge' | 'the-grind' | 'signal';
  roles: string[];
  isStateTrigger: boolean;
  triggerState: string | null;
  isPremium: boolean;
  worldNumber: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

type WorldWithLockState = World & { lockState: 'active' | 'teaser' };

const WORLDS: World[] = [
  // ─── FOUNDATION ───────────────────────────────────────────────────────────
  {
    id: 'foundation',
    label: 'Foundation',
    tagline: 'The mental basics that hold up under pressure.',
    color: '#22CC5E',
    chapter: 'foundation',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 1,
    icon: 'shield-outline',
  },
  {
    id: 'readiness-routines',
    label: 'Routines & Rituals',
    tagline: 'Build the habits that lock you in.',
    color: '#30D158',
    chapter: 'foundation',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 2,
    icon: 'time-outline',
  },
  {
    id: 'game-day-focus',
    label: 'Game Day Focus',
    tagline: 'Lock in before first pitch.',
    color: '#FFD60A',
    chapter: 'foundation',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 3,
    icon: 'eye-outline',
  },
  {
    id: 'baseball-iq',
    label: 'Diamond IQ',
    tagline: 'See the game faster. Make better decisions.',
    color: '#BF5AF2',
    chapter: 'foundation',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 4,
    icon: 'bulb-outline',
  },
  {
    id: 'slump-recovery',
    label: 'Slump Recovery',
    tagline: 'Slumps end. Process wins.',
    color: '#FF6B6B',
    chapter: 'foundation',
    roles: [],
    isStateTrigger: true,
    triggerState: 'slump_reset',
    isPremium: false,
    worldNumber: 5,
    icon: 'refresh-outline',
  },
  {
    id: 'return-to-throw',
    label: 'Return to Throwing',
    tagline: 'Come back smarter than you left',
    color: '#0A84FF',
    chapter: 'foundation',
    roles: [],
    isStateTrigger: true,
    triggerState: 'return_to_throw',
    isPremium: false,
    worldNumber: 6,
    icon: 'medical-outline',
  },
  {
    id: 'baserunner-path',
    label: 'On the Bases',
    tagline: 'Turn speed into runs.',
    color: '#FF9F0A',
    chapter: 'foundation',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 18,
    icon: 'arrow-forward-outline',
  },

  // ─── YOUR CRAFT ───────────────────────────────────────────────────────────
  {
    id: 'pitcher-path',
    label: 'Mound Command',
    tagline: 'Command, tempo, and game IQ.',
    color: '#BF5AF2',
    chapter: 'your-craft',
    roles: ['pitcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 7,
    icon: 'radio-button-on-outline',
  },
  {
    id: 'pitching-mindset',
    label: 'Mound Mentality',
    tagline: 'Control emotions, tempo, the next pitch.',
    color: '#9B59B6',
    chapter: 'your-craft',
    roles: ['pitcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 8,
    icon: 'pulse-outline',
  },
  {
    id: 'pitching-strategy',
    label: 'Attack the Count',
    tagline: 'Attack hitters. Win counts.',
    color: '#8E44AD',
    chapter: 'your-craft',
    roles: ['pitcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 9,
    icon: 'map-outline',
  },
  {
    id: 'hitter-path',
    label: 'In the Box',
    tagline: 'Own your at-bats from the first pitch.',
    color: '#F5A623',
    chapter: 'your-craft',
    roles: ['hitter', 'infielder', 'outfielder', 'catcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 10,
    icon: 'diamond-outline',
  },
  {
    id: 'hitting-approach',
    label: 'Hunt Your Pitch',
    tagline: 'A smarter plan for every at-bat.',
    color: '#E67E22',
    chapter: 'your-craft',
    roles: ['hitter', 'infielder', 'outfielder', 'catcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 11,
    icon: 'stats-chart-outline',
  },
  {
    id: 'catcher-path',
    label: 'Behind the Dish',
    tagline: 'Master the position that touches every pitch.',
    color: '#0A84FF',
    chapter: 'your-craft',
    roles: ['catcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 12,
    icon: 'eye-outline',
  },
  {
    id: 'catcher-leadership',
    label: 'Run the Game',
    tagline: 'Lead the battery. Control the field.',
    color: '#2980B9',
    chapter: 'your-craft',
    roles: ['catcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 13,
    icon: 'megaphone-outline',
  },
  {
    id: 'infield-path',
    label: 'Infield Command',
    tagline: 'Smooth hands. Sure throws.',
    color: '#FF3B30',
    chapter: 'your-craft',
    roles: ['infielder'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 14,
    icon: 'triangle-outline',
  },
  {
    id: 'infield-play-iq',
    label: 'Infield IQ',
    tagline: 'Think faster. Move earlier.',
    color: '#E74C3C',
    chapter: 'your-craft',
    roles: ['infielder'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 15,
    icon: 'git-network-outline',
  },
  {
    id: 'outfield-path',
    label: 'Outfield Command',
    tagline: 'Track it. Catch it. Hit the cutoff.',
    color: '#34C759',
    chapter: 'your-craft',
    roles: ['outfielder'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 16,
    icon: 'partly-sunny-outline',
  },
  {
    id: 'outfield-reads',
    label: 'Reads & Routes',
    tagline: 'First-step jumps and clean routes.',
    color: '#27AE60',
    chapter: 'your-craft',
    roles: ['outfielder'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 17,
    icon: 'trending-up-outline',
  },

  // ─── COMPETE (chapter id: 'edge') ─────────────────────────────────────────
  {
    id: 'pressure-resilience',
    label: 'Pressure Proof',
    tagline: 'Perform when it matters most.',
    color: '#FF6B6B',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 20,
    icon: 'flag-outline',
  },
  {
    id: 'competitive-identity',
    label: 'Competitive Identity',
    tagline: "Standards don't move.",
    color: '#E74C3C',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 21,
    icon: 'ribbon-outline',
  },
  {
    id: 'pressure-proof',
    label: 'Pressure Proof',
    tagline: 'Advanced pressure. Elite composure.',
    color: '#C0392B',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 22,
    icon: 'nuclear-outline',
  },
  {
    id: 'leadership-dugout',
    label: 'Dugout Leader',
    tagline: 'Lead with energy, not a title.',
    color: '#9B59B6',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 23,
    icon: 'people-outline',
  },
  {
    id: 'bounce-back-player',
    label: 'Bounce Back',
    tagline: 'Respond before failure compounds.',
    color: '#E67E22',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 24,
    icon: 'reload-outline',
  },

  // ─── THE GRIND ────────────────────────────────────────────────────────────
  {
    id: 'built-different',
    label: 'Built Different',
    tagline: 'Strength, nutrition, sleep, arm care.',
    color: '#E85D26',
    chapter: 'the-grind',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 19,
    icon: 'flash-outline',
  },
  {
    id: 'arm-care-durability',
    label: 'Arm Care',
    tagline: 'Protect the arm that carries your career.',
    color: '#0A84FF',
    chapter: 'the-grind',
    roles: ['pitcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 25,
    icon: 'body-outline',
  },
  {
    id: 'strength-conditioning',
    label: 'Strength & Power',
    tagline: 'Build the engine.',
    color: '#FF9F0A',
    chapter: 'the-grind',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 26,
    icon: 'barbell-outline',
  },
  {
    id: 'recovery-readiness',
    label: 'Recovery & Readiness',
    tagline: 'Recover hard. Come back stronger.',
    color: '#34C759',
    chapter: 'the-grind',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 27,
    icon: 'moon-outline',
  },

  // ─── SIGNAL ───────────────────────────────────────────────────────────────
  {
    id: 'showcase-recruiting',
    label: 'Showcase Ready',
    tagline: 'Stand out when scouts are watching.',
    color: '#FFD60A',
    chapter: 'signal',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: true,
    worldNumber: 28,
    icon: 'star-outline',
  },
  {
    id: 'coach-dynamics',
    label: 'Coach Dynamics',
    tagline: 'Earn trust. Earn playing time.',
    color: '#378ADD',
    chapter: 'signal',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: true,
    worldNumber: 29,
    icon: 'chatbubbles-outline',
  },
  {
    id: 'what-the-pros-do',
    label: 'What Pros Do',
    tagline: 'The habits that separate the elite.',
    color: '#FFD60A',
    chapter: 'signal',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: true,
    worldNumber: 30,
    icon: 'trophy-outline',
  },

  // ─── YOUR CRAFT (continued) ───────────────────────────────────────────────
  {
    id: 'pickoff-runner-control',
    label: 'Pickoff & Runner Control',
    tagline: 'Keep runners honest. Win the mental war.',
    color: '#9B59B6',
    chapter: 'your-craft',
    roles: ['pitcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 31,
    icon: 'flag-outline',
  },
  {
    id: 'finishing-hitters',
    label: 'Finishing Hitters',
    tagline: 'Put them away when you have the edge.',
    color: '#C0392B',
    chapter: 'your-craft',
    roles: ['pitcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 32,
    icon: 'nuclear-outline',
  },
  {
    id: 'pitcher-velocity',
    label: 'Velocity & Velo IQ',
    tagline: 'Build speed. Know when to use it.',
    color: '#FF9F0A',
    chapter: 'your-craft',
    roles: ['pitcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 33,
    icon: 'flash-outline',
  },
  {
    id: 'hitter-specialty',
    label: 'Hitter Specialty',
    tagline: 'Develop the skill that defines your at-bat.',
    color: '#E67E22',
    chapter: 'your-craft',
    roles: ['hitter', 'infielder', 'outfielder', 'catcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 34,
    icon: 'diamond-outline',
  },
  {
    id: 'leadoff-mentality',
    label: 'Leadoff Mentality',
    tagline: 'See pitches. Set the tone. Get on base.',
    color: '#27AE60',
    chapter: 'your-craft',
    roles: ['hitter', 'infielder', 'outfielder', 'catcher', 'baserunner'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 35,
    icon: 'arrow-forward-outline',
  },
  {
    id: 'rbi-mode',
    label: 'RBI Mode',
    tagline: 'Runners on. Deliver.',
    color: '#E85D26',
    chapter: 'your-craft',
    roles: ['hitter', 'infielder', 'outfielder', 'catcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 36,
    icon: 'trending-up-outline',
  },
  {
    id: 'catcher-blocking',
    label: 'Blocking & Framing',
    tagline: 'Stop the run. Steal the strike.',
    color: '#2980B9',
    chapter: 'your-craft',
    roles: ['catcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 37,
    icon: 'shield-outline',
  },
  {
    id: 'two-way-player',
    label: 'Two-Way Player',
    tagline: 'Master the mound and the box.',
    color: '#8E44AD',
    chapter: 'your-craft',
    roles: ['pitcher', 'hitter'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 38,
    icon: 'pulse-outline',
  },

  // ─── COMPETE (edge) continued ─────────────────────────────────────────────
  {
    id: 'film-room-sessions',
    label: 'Film Room',
    tagline: 'Watch more. Know more. Compete better.',
    color: '#0A84FF',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 39,
    icon: 'eye-outline',
  },
  {
    id: 'mistake-audit',
    label: 'Mistake Audit',
    tagline: 'Analyze errors before they repeat.',
    color: '#FF3B30',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 40,
    icon: 'bulb-outline',
  },
  {
    id: 'pressure-ladder',
    label: 'Pressure Ladder',
    tagline: 'Climb each level of competitive pressure.',
    color: '#FF6B6B',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 41,
    icon: 'trending-up-outline',
  },
  {
    id: 'team-dynamics',
    label: 'Team Dynamics',
    tagline: 'Chemistry, trust, and shared standards.',
    color: '#9B59B6',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 42,
    icon: 'people-outline',
  },

  // ─── THE GRIND (continued) ────────────────────────────────────────────────
  {
    id: 'pregame-systems',
    label: 'Pregame Systems',
    tagline: 'Arrive ready. Execute a plan.',
    color: '#E85D26',
    chapter: 'the-grind',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 43,
    icon: 'time-outline',
  },
  {
    id: 'offseason-build',
    label: 'Offseason Build',
    tagline: 'The work that wins before spring.',
    color: '#FF9F0A',
    chapter: 'the-grind',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 44,
    icon: 'barbell-outline',
  },
  {
    id: 'sleep-fuel',
    label: 'Sleep & Fuel',
    tagline: 'Your body is the machine. Maintain it.',
    color: '#34C759',
    chapter: 'the-grind',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 45,
    icon: 'moon-outline',
  },
  {
    id: 'mental-recovery',
    label: 'Mental Recovery',
    tagline: 'Reset fast. Come back fresh.',
    color: '#30D158',
    chapter: 'the-grind',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 46,
    icon: 'refresh-outline',
  },

  // ─── SIGNAL (continued) ───────────────────────────────────────────────────
  {
    id: 'college-recruiting',
    label: 'College Recruiting',
    tagline: 'Get seen. Get offered. Get there.',
    color: '#FFD60A',
    chapter: 'signal',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: true,
    worldNumber: 47,
    icon: 'star-outline',
  },
  {
    id: 'baseball-identity',
    label: 'Baseball Identity',
    tagline: 'Know who you are as a player. Own it.',
    color: '#F5A623',
    chapter: 'signal',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: true,
    worldNumber: 48,
    icon: 'ribbon-outline',
  },
  {
    id: 'coach-trust',
    label: 'Coach Trust',
    tagline: 'Build the relationship that opens doors.',
    color: '#378ADD',
    chapter: 'signal',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: true,
    worldNumber: 49,
    icon: 'chatbubbles-outline',
  },
  {
    id: 'opponent-intel',
    label: 'Opponent Intel',
    tagline: 'Know the other team before they know you.',
    color: '#BF5AF2',
    chapter: 'signal',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: true,
    worldNumber: 50,
    icon: 'map-outline',
  },

  // ─── CAP TALKS WORLDS ─────────────────────────────────────────────────────
  {
    id: 'program-beats-panic',
    label: 'Program Beats Panic',
    tagline: 'Consistent execution beats panic-switching.',
    color: '#2D3A4A',
    chapter: 'foundation',
    roles: [],
    isStateTrigger: true,
    triggerState: 'slump_reset',
    isPremium: false,
    worldNumber: 51,
    icon: 'trending-up-outline',
  },
  {
    id: 'underdog-execution',
    label: 'Underdog Execution',
    tagline: 'Execute the plan. Beat the label.',
    color: '#3A3F47',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 52,
    icon: 'flame-outline',
  },
  {
    id: 'practice-efficiency',
    label: 'Practice Efficiency',
    tagline: 'Make every rep transfer.',
    color: '#1C1C1E',
    chapter: 'foundation',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 53,
    icon: 'clipboard-outline',
  },
  {
    id: 'pitch-tipping-lab',
    label: 'Pitch Tipping Lab',
    tagline: 'Read the tell. Hold the edge.',
    color: '#0D1B2A',
    chapter: 'signal',
    roles: ['pitcher', 'catcher', 'hitter'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: true,
    worldNumber: 54,
    icon: 'scan-outline',
  },
  {
    id: 'dugout-intel',
    label: 'Dugout Intel',
    tagline: 'The bench is a scouting station.',
    color: '#1A3A2A',
    chapter: 'your-craft',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 55,
    icon: 'search-outline',
  },
  {
    id: 'high-velo-prep',
    label: 'High-Velo Prep',
    tagline: 'Train your eyes before the fastball arrives.',
    color: '#3A0D0D',
    chapter: 'your-craft',
    roles: ['hitter', 'infielder', 'outfielder', 'catcher'],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 56,
    icon: 'speedometer-outline',
  },
  {
    id: 'arm-first',
    label: 'Arm First',
    tagline: 'Protect the arm. Protect the career.',
    color: '#0A0A0A',
    chapter: 'the-grind',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 57,
    icon: 'fitness-outline',
  },
  {
    id: 'emotional-range-control',
    label: 'Emotional Range Control',
    tagline: 'Control the range. Own the moment.',
    color: '#1A0A2A',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 58,
    icon: 'pulse-outline',
  },
  {
    id: 'team-chaos',
    label: 'Team Chaos',
    tagline: "Execute when it falls apart.",
    color: '#C84B00',
    chapter: 'edge',
    roles: [],
    isStateTrigger: false,
    triggerState: null,
    isPremium: false,
    worldNumber: 59,
    icon: 'alert-circle-outline',
  },
];

const CHAPTERS = [
  { id: 'foundation', label: 'FOUNDATION', icon: 'layers-outline' as const,  color: '#22CC5E' },
  { id: 'your-craft', label: 'YOUR CRAFT', icon: 'construct-outline' as const, color: '#BF5AF2' },
  { id: 'edge',       label: 'COMPETE',    icon: 'flash-outline' as const,    color: '#FF6B6B' },
  { id: 'the-grind',  label: 'THE GRIND',  icon: 'barbell-outline' as const,  color: '#FF9F0A' },
  { id: 'signal',     label: 'SIGNAL',     icon: 'star-outline' as const,     color: '#FFD60A' },
];

// ─── LOCK / VISIBILITY LOGIC ─────────────────────────────────────────────────
function getWorldsForChapter(
  chapterWorlds: World[],
  lessonPillarIds: string[],
  chapter: string,
  athleteRole: string,
  isTwoWay: boolean,
  seasonPhase: string | null,
  healthState: string | null,
): WorldWithLockState[] {
  const result: WorldWithLockState[] = [];

  for (const world of chapterWorlds) {
    if (chapter === 'your-craft' && world.roles.length > 0) {
      const roleMatches = isTwoWay
        ? world.roles.includes(athleteRole) || world.roles.includes('hitter')
        : athleteRole === 'catcher'
        ? world.roles.includes('catcher') || world.roles.includes('hitter')
        : world.roles.includes(athleteRole);
      if (!roleMatches) continue;
    }

    const hasLessons = lessonPillarIds.includes(world.id);

    if (world.isStateTrigger && !hasLessons) {
      const stateMatch = world.triggerState === seasonPhase || world.triggerState === healthState;
      if (!stateMatch) continue;
    }

    // DEV_UNLOCK_ALL removes the progression gate on individual lesson nodes
    // (see WorldMapSection), but worlds with zero lessons stay as teasers regardless.
    result.push({ ...world, lockState: hasLessons ? 'active' : 'teaser' });
  }

  return result;
}

function getWorldTotalXP(nodes: LegacyLesson[]): number {
  return nodes.reduce((sum, n) => sum + (n.xp_reward || 55), 0);
}

export async function triggerWorldClearCelebration(worldId: string, _color: string) {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await new Promise(r => setTimeout(r, 300));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await new Promise(r => setTimeout(r, 200));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  Alert.alert(
    '⚡ WORLD CLEARED',
    'You finished every lesson in this world.\n\nThat rep is built in. Keep stacking.',
    [{ text: "Let's go →", style: 'default' }]
  );
}

// ─── WORLD BANNER ─────────────────────────────────────────────────────────────

function WorldBanner({
  world,
  done,
  total,
  worldLessons,
  completed,
  expanded,
  onToggle,
}: {
  world: WorldWithLockState;
  done: number;
  total: number;
  worldLessons: LegacyLesson[];
  completed: string[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const { color, icon, label, tagline, isPremium, lockState } = world;
  const isCleared = lockState === 'active' && done > 0 && done >= total;
  const isExpanded = expanded && lockState === 'active';
  const totalXP = getWorldTotalXP(worldLessons);
  const celebrationKey = `world_cleared_${world.id}`;

  // Stage-based progress: each stage = 8 lessons
  const currentStage = Math.floor(done / 8) + 1;
  const lessonsIntoCurrentStage = done % 8;
  const stageTarget = total > 0 ? Math.min(8, total - (currentStage - 1) * 8) : 8;
  const stagePct = stageTarget > 0 ? Math.min(1, lessonsIntoCurrentStage / stageTarget) : 0;
  const stageLabel = `Stage ${currentStage} · ${lessonsIntoCurrentStage}/${stageTarget}`;

  // Resume indicator: first incomplete lesson in this world
  const nextLesson = lockState === 'active' && done > 0 && !isCleared
    ? worldLessons.find(l => !completed.includes(l.id)) ?? null
    : null;

  useEffect(() => {
    if (lockState !== 'active' || !isCleared) return;
    AsyncStorage.getItem(celebrationKey).then(already => {
      if (already) return;
      AsyncStorage.setItem(celebrationKey, 'true');
      triggerWorldClearCelebration(world.id, color);
    });
  }, [isCleared, lockState]);

  if (lockState === 'teaser') {
    return (
      <View style={[cardStyles.card, teaserStyles.card]}>
        <LinearGradient
          colors={['#1a1a1a', '#111111']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={cardStyles.header}>
          <View style={cardStyles.titleCol}>
            <View style={cardStyles.nameRow}>
              <Text style={[cardStyles.worldName, { color: 'rgba(255,255,255,0.35)' }]}>
                {label.toUpperCase()}
              </Text>
            </View>
            <Text style={[cardStyles.tagline, { color: 'rgba(255,255,255,0.35)' }]}>{tagline}</Text>
          </View>
          <View style={[cardStyles.rightCol, { gap: 6 }]}>
            <Ionicons
              name="lock-closed"
              size={24}
              color={isPremium ? 'rgba(255,214,10,0.35)' : 'rgba(255,255,255,0.25)'}
            />
            <View style={[teaserStyles.pill, isPremium && teaserStyles.pillPremium]}>
              <Text style={[teaserStyles.pillText, isPremium && teaserStyles.pillTextPremium]}>
                {isPremium ? 'SIGNAL' : 'COMING SOON'}
              </Text>
            </View>
          </View>
        </View>
        <View style={teaserStyles.hintRow}>
          <Text style={teaserStyles.hintText}>
            {isPremium
              ? 'Unlock with Clutchr Pro'
              : 'Complete previous worlds to unlock'}
          </Text>
        </View>
      </View>
    );
  }

  // ACTIVE
  return (
    <Pressable
      onPress={onToggle}
      style={[
        cardStyles.card,
        { borderTopColor: color },
        isExpanded && cardStyles.cardExpanded,
        isCleared && { shadowColor: color, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
      ]}
    >
      {isCleared && (
        <LinearGradient
          colors={[color + '25', '#0D0D12']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      )}

      <View style={cardStyles.header}>
        <View style={cardStyles.titleCol}>
          <View style={cardStyles.nameRow}>
            <Text style={[cardStyles.worldName, { color }]}>{label.toUpperCase()}</Text>
          </View>
          <Text style={cardStyles.tagline}>{tagline}</Text>
        </View>
        <View style={cardStyles.rightCol}>
          <Ionicons name={icon} size={20} color={color} />
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="rgba(255,255,255,0.35)"
          />
        </View>
      </View>

      {!isCleared && total > 0 && (
        <View style={cardStyles.progressRow}>
          <ProgressBar
            value={stagePct}
            color={color}
            trackColor="rgba(255,255,255,0.06)"
            height={3}
            style={{ flex: 1 }}
          />
          <Text style={[cardStyles.progressCount, { color }]}>{stageLabel}</Text>
        </View>
      )}

      {nextLesson && (
        <View style={cardStyles.nextRow}>
          <Ionicons name="play-circle-outline" size={11} color="rgba(255,255,255,0.45)" />
          <Text style={cardStyles.nextText} numberOfLines={1}>Next: {nextLesson.title}</Text>
        </View>
      )}

      {isCleared && (
        <View style={clearedStyles.badgeRow}>
          <View style={clearedStyles.badgeLeft}>
            <View style={[clearedStyles.checkCircle, { backgroundColor: color }]}>
              <Text style={clearedStyles.checkMark}>✓</Text>
            </View>
            <Text style={[clearedStyles.clearedLabel, { color }]}>WORLD CLEARED · EARNED</Text>
          </View>
          <View style={[clearedStyles.xpPill, { backgroundColor: color + '20', borderColor: color + '50' }]}>
            <Text style={[clearedStyles.xpPillText, { color }]}>{totalXP} XP</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ─── SIGNAL PREMIUM BANNER ────────────────────────────────────────────────────

function SignalBanner() {
  return (
    <View style={signalStyles.banner}>
      <Ionicons name="trophy-outline" size={20} color="#FFD60A" style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={signalStyles.label}>SIGNAL</Text>
        <Text style={signalStyles.description}>
          Elite habits. Pro-level content. Coming with Clutchr Pro.
        </Text>
      </View>
      <View style={signalStyles.proPill}>
        <Text style={signalStyles.proText}>PRO</Text>
      </View>
    </View>
  );
}

// ─── YOUR CRAFT HEADER ────────────────────────────────────────────────────────

function YourCraftHeader({ role, color }: { role: string; color: string }) {
  return (
    <View style={craftStyles.wrap}>
      <Text style={craftStyles.label}>Showing worlds for your role:</Text>
      <View style={[craftStyles.rolePill, { backgroundColor: color + '20', borderColor: color + '40' }]}>
        <Text style={[craftStyles.roleText, { color }]}>{role.toUpperCase()}</Text>
      </View>
    </View>
  );
}

// ─── WORLD MAP SECTION — LEFT-SPINE VERTICAL TIMELINE ─────────────────────────

function WorldMapSection({ world, lessons, completed }: {
  world: World;
  lessons: LegacyLesson[];
  completed: string[];
}) {
  const { color, label, tagline } = world;
  const microcopy = useMicrocopy();

  if (lessons.length === 0) {
    return (
      <View style={mapStyles.emptyWrap}>
        <Text style={mapStyles.emptyText}>{microcopy.useEmptyState('noLessonsInWorld')}</Text>
      </View>
    );
  }

  return (
    <View style={mapStyles.outerWrap}>
      <Pressable
        style={[mapStyles.guideBanner, { backgroundColor: color + '15', borderColor: color + '40' }]}
        onPress={() => Alert.alert(label, tagline)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[mapStyles.guideBannerTitle, { color }]}>{label.toUpperCase()}</Text>
          <Text style={mapStyles.guideBannerTagline}>{tagline}</Text>
        </View>
        <View style={[mapStyles.guidePill, { backgroundColor: color }]}>
          <Text style={mapStyles.guidePillText}>GUIDE</Text>
        </View>
      </Pressable>

      <View style={mapStyles.timelineContainer}>
        <View style={[mapStyles.spineLine, { backgroundColor: color }]} />

        {lessons.map((lesson, i) => {
          const isDone = completed.includes(lesson.id);
          const isNext = !isDone && lessons.slice(0, i).every((l) => completed.includes(l.id));
          const isLocked = !DEV_UNLOCK_ALL && i > 0 && !completed.includes(lessons[i - 1].id) && !isDone;
          const nodeType = (lesson as any).node_type as string | undefined;
          const isBoss = lesson.is_boss || nodeType === 'boss';
          const isCheckpoint = nodeType === 'checkpoint';

          return (
            <React.Fragment key={lesson.id}>
              {(isCheckpoint || isBoss) && (
                <View style={mapStyles.dividerWrap}>
                  <View style={[mapStyles.dividerLine, { backgroundColor: color }]} />
                  <Text style={[mapStyles.dividerLabel, { color }]}>
                    {isBoss ? 'BOSS BATTLE' : 'CHECKPOINT'}
                  </Text>
                </View>
              )}
              <TimelineNode
                lesson={lesson}
                idx={i}
                isDone={isDone}
                isNext={isNext}
                isLocked={isLocked}
                isBoss={isBoss}
                color={color}
              />
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

// ─── TIMELINE NODE ────────────────────────────────────────────────────────────

function TimelineNode({ lesson, idx, isDone, isNext, isLocked, isBoss, color }: {
  lesson: LegacyLesson; idx: number; isDone: boolean;
  isNext: boolean; isLocked: boolean; isBoss: boolean; color: string;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isNext) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isNext]);

  const nodeSize = isBoss ? 44 : 36;
  const lessonFamily =
    ((lesson as any).lesson_family as string | undefined) ??
    ((lesson as any).node_type as string | undefined) ??
    'LESSON';

  function handlePress() {
    if (isLocked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    router.push(`/lesson/${lesson.id}`);
  }

  const cardBorderColor = isNext ? color + '60' : '#1a1a1a';

  return (
    <Pressable style={tlStyles.row} onPress={handlePress}>
      <View style={tlStyles.nodeCol}>
        {isBoss && !isDone && (
          <Text style={[tlStyles.crownText, { color }]}>♛</Text>
        )}
        {isNext && (
          <View style={[tlStyles.voltMarker, { backgroundColor: color }]} />
        )}

        <Animated.View
          style={[
            tlStyles.nodeCircle,
            { width: nodeSize, height: nodeSize, borderRadius: nodeSize / 2 },
            isDone && { backgroundColor: color },
            !isDone && isNext && {
              backgroundColor: '#0D0D12',
              borderWidth: 2.5,
              borderColor: color,
              shadowColor: color,
              shadowOpacity: 0.9,
              shadowRadius: 10,
              elevation: 8,
            },
            !isDone && isLocked && {
              backgroundColor: '#111122',
              borderWidth: 1.5,
              borderColor: '#2a2a3a',
            },
            !isDone && !isNext && !isLocked && isBoss && {
              backgroundColor: '#0D0D12',
              borderWidth: 2.5,
              borderColor: color,
            },
            !isDone && !isNext && !isLocked && !isBoss && {
              backgroundColor: '#111122',
              borderWidth: 1.5,
              borderColor: '#2a2a3a',
            },
            isNext && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {isDone    ? <Text style={tlStyles.checkmark}>✓</Text>
          : isNext   ? <Text style={tlStyles.playIcon}>▶</Text>
          : isLocked ? <Text style={tlStyles.lockIcon}>🔒</Text>
          :            <Text style={tlStyles.nodeNumText}>{idx + 1}</Text>}
        </Animated.View>

        {isBoss && !isDone && (
          <Text style={[tlStyles.bossBattleLabel, { color }]}>BOSS REP</Text>
        )}
      </View>

      <View style={[tlStyles.card, { borderColor: cardBorderColor }]}>
        <View style={tlStyles.cardTopRow}>
          <View style={[
            tlStyles.familyPill,
            { backgroundColor: isLocked ? 'rgba(255,255,255,0.05)' : color + '20' },
          ]}>
            <Text style={[
              tlStyles.familyPillText,
              { color: isLocked ? 'rgba(255,255,255,0.25)' : color },
            ]}>
              {lessonFamily.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text
          style={[tlStyles.cardTitle, isLocked && tlStyles.cardTitleLocked]}
          numberOfLines={2}
        >
          {lesson.title}
        </Text>

        {isLocked && (
          <Text style={tlStyles.lockedHint}>Complete previous lesson to unlock</Text>
        )}

        {!isLocked && (
          <View style={tlStyles.cardBottomRow}>
            <Text style={tlStyles.xpText}>{lesson.xp_reward} XP · first clear</Text>
            <Text style={tlStyles.timeText}>~5 min</Text>
          </View>
        )}

        {isNext && (
          <View style={[tlStyles.activeStrip, { backgroundColor: color }]} />
        )}
      </View>
    </Pressable>
  );
}

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function CareerScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState } = useAthlete();
  const [lessons, setLessons] = useState<LegacyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeChapter, setActiveChapter] = useState('foundation');
  const [expandedWorldId, setExpandedWorldId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const results = await Promise.all(
        WORLDS.map(world => fetchLessons({ pillar: world.id }))
      );
      const data = results.flat();
      setLessons(data);
      if (__DEV__) {
        const pillarIds = [...new Set(data.map(l => l.pillar_id).filter(Boolean))];
        const withLessons = WORLDS.filter(w => pillarIds.includes(w.id));
        const teaser = WORLDS.filter(w => !pillarIds.includes(w.id));
        const orphans = pillarIds.filter(id => !WORLDS.some(w => w.id === id));
        console.log(
          `[Career] fetched=${data.length} worlds=${WORLDS.length}` +
          ` active=${withLessons.length} teaser=${teaser.length}` +
          ` orphanPillarIds=${orphans.length > 0 ? orphans.join(',') : 'none'}`,
        );
      }
    } catch (e) {
      console.error(e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const completed = athleteState?.completed_lessons ?? [];
  const athleteRole = athleteState?.primary_role ?? 'pitcher';
  const isTwoWay = athleteState?.is_two_way ?? false;
  const seasonPhase = (athleteState as any)?.season_phase ?? null;
  const healthState = (athleteState as any)?.health_state ?? null;

  const totalDone = completed.length;
  const totalAll  = lessons.length;
  const overallPct = totalAll > 0 ? Math.min(100, Math.round((totalDone / totalAll) * 100)) : 0;

  const lessonPillarIds = [...new Set(lessons.map(l => l.pillar_id).filter(Boolean))];

  const chapterWorlds = WORLDS.filter(w => w.chapter === activeChapter);
  const filteredWorlds = getWorldsForChapter(
    chapterWorlds, lessonPillarIds, activeChapter, athleteRole, isTwoWay, seasonPhase, healthState
  );

  const activeChapterConfig = CHAPTERS.find(c => c.id === activeChapter)!;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* HEADER */}
      <ClutchrHeader
        variant="mainTab"
        kicker="CAREER"
        title="Build Your Path"
        subtitle="One rep at a time."
        statusPill={`${totalDone} / ${totalAll}`}
        progress={overallPct / 100}
        rightAction={
          <View style={styles.xpPill}>
            <Ionicons name="flash" size={12} color={Colors.warning} />
            <Text style={styles.xpNum}>{athleteState?.total_xp ?? 0}</Text>
            <Text style={styles.xpLabel}>XP</Text>
          </View>
        }
      />

      {/* CHAPTER TAB BAR */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={chapterTabStyles.container}
        contentContainerStyle={chapterTabStyles.content}
      >
        {CHAPTERS.map((chapter) => {
          const active = activeChapter === chapter.id;
          const isSignal = chapter.id === 'signal';
          const labelColor = isSignal
            ? '#FFD60A'
            : active ? chapter.color : 'rgba(255,255,255,0.35)';
          return (
            <Pressable
              key={chapter.id}
              style={[
                chapterTabStyles.tab,
                active && { borderBottomWidth: 2, borderBottomColor: chapter.color },
              ]}
              onPress={() => {
                setActiveChapter(chapter.id);
                setExpandedWorldId(null);
              }}
            >
              <Ionicons name={chapter.icon} size={14} color={labelColor} />
              <Text style={[chapterTabStyles.label, { color: labelColor }]}>
                {isSignal && active ? '✦ ' : ''}{chapter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ACTIVE CHAPTER CONTENT */}
      {loadError ? (
        <ErrorState message="Could not load lessons." onRetry={fetchData} />
      ) : loading ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          pointerEvents="none"
        >
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {activeChapter === 'your-craft' && (
            <YourCraftHeader role={athleteRole} color={activeChapterConfig.color} />
          )}

          {activeChapter === 'signal' && <SignalBanner />}

          {filteredWorlds.map((world) => {
            const worldLessons = lessons
              .filter(l => l.pillar_id === world.id)
              .sort((a, b) => a.order_index - b.order_index);
            const worldDone = worldLessons.filter(l => completed.includes(l.id)).length;
            const isExpanded = expandedWorldId === world.id;

            return (
              <View key={world.id} style={styles.worldBlock}>
                <WorldBanner
                  world={world}
                  done={worldDone}
                  total={worldLessons.length}
                  worldLessons={worldLessons}
                  completed={completed}
                  expanded={isExpanded}
                  onToggle={() => {
                    if (world.lockState === 'teaser') {
                      Alert.alert('Keep stacking.', 'This world unlocks as you progress.');
                      return;
                    }
                    setExpandedWorldId(isExpanded ? null : world.id);
                  }}
                />
                {world.lockState === 'active' && isExpanded && (
                  <WorldMapSection
                    world={world}
                    lessons={worldLessons}
                    completed={completed}
                  />
                )}
              </View>
            );
          })}

          {filteredWorlds.length === 0 && (
            <View style={styles.emptyChapter}>
              <Text style={styles.emptyChapterText}>No worlds available for your role yet.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#080810' },
  scrollView:       { backgroundColor: '#080810' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  headerLeft:  { gap: 4 },
  title:       { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warningMuted, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: 'rgba(245,166,35,0.28)',
  },
  xpNum:   { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.warning },
  xpLabel: { fontSize: 9,  fontFamily: 'Inter_700Bold', color: Colors.textTertiary, letterSpacing: 1 },

  progressWrap:  { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, gap: 8 },
  progressTrack: { height: 3, backgroundColor: Colors.surfaceElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill:  {
    height: 3, backgroundColor: Colors.primary, borderRadius: 2,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
  },
  progressMeta:  { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary },
  progressPct:   { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  scroll:        { gap: 0, paddingTop: 8 },
  worldBlock:    { marginBottom: 12 },

  emptyChapter: { paddingTop: 40, alignItems: 'center' },
  emptyChapterText: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.3)', textAlign: 'center',
  },
});

// ─── CHAPTER TAB BAR STYLES ──────────────────────────────────────────────────

const chapterTabStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    flexGrow: 0,
  },
  content: {
    flexDirection: 'row',
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
});

// ─── CARD STYLES ─────────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0D0D12',
    borderWidth: 1,
    borderTopWidth: 3,
    borderTopColor: '#2a2a2a',
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  cardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
  },
  titleCol: { flex: 1, gap: 3 },
  nameRow:   { flexDirection: 'row', alignItems: 'center' },
  worldName: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  tagline:   {
    fontSize: 11, fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.4)', lineHeight: 16,
  },
  rightCol: { alignItems: 'flex-end', gap: 8, paddingLeft: 12, flexShrink: 0 },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  progressCount: { fontSize: 10, fontFamily: 'Inter_700Bold', minWidth: 80, textAlign: 'right' },
  nextRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  nextText: {
    fontSize: 10, fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.45)', flex: 1,
  },
});

// ─── TEASER STYLES ────────────────────────────────────────────────────────────

const teaserStyles = StyleSheet.create({
  card: {
    opacity: 0.45,
    borderTopColor: '#2a2a2a',
  },
  pill: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pillPremium: {
    borderColor: 'rgba(255,214,10,0.3)',
  },
  pillText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 0.5,
  },
  pillTextPremium: {
    color: 'rgba(255,214,10,0.5)',
  },
  hintRow: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  hintText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.2)',
    fontStyle: 'italic',
  },
});

// ─── SIGNAL STYLES ────────────────────────────────────────────────────────────

const signalStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1500',
    borderWidth: 1,
    borderColor: 'rgba(255,214,10,0.2)',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#FFD60A',
    letterSpacing: 2,
  },
  description: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  proPill: {
    backgroundColor: '#1A1500',
    borderWidth: 1,
    borderColor: '#FFD60A',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  proText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#FFD60A',
    letterSpacing: 1,
  },
});

// ─── YOUR CRAFT HEADER STYLES ─────────────────────────────────────────────────

const craftStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0D0D12',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 10,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },
  rolePill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
});

// ─── MAP STYLES ───────────────────────────────────────────────────────────────

const mapStyles = StyleSheet.create({
  outerWrap: {
    marginHorizontal: 16,
    backgroundColor: '#0A0A10',
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  guideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  guideBannerTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  guideBannerTagline: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  guidePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 12,
    flexShrink: 0,
  },
  guidePillText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
  timelineContainer: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  spineLine: {
    position: 'absolute',
    left: 35,
    top: 0,
    bottom: 0,
    width: 2,
    opacity: 0.5,
  },
  dividerWrap: {
    marginVertical: 8,
  },
  dividerLine: {
    height: 1,
    opacity: 0.2,
    marginLeft: 36,
    marginRight: 16,
  },
  dividerLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    marginLeft: 48,
    marginTop: 4,
    marginBottom: 4,
  },
  emptyWrap: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
  },
});

// ─── TIMELINE NODE STYLES ─────────────────────────────────────────────────────

const tlStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 16,
  },
  nodeCol: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark:     { fontSize: 16, color: '#fff', fontWeight: '700' },
  playIcon:      { fontSize: 14, color: '#fff', marginLeft: 2 },
  lockIcon:      { fontSize: 12 },
  nodeNumText:   { fontSize: 13, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.4)' },
  crownText:     { fontSize: 14, marginBottom: 2 },
  voltMarker: {
    width: 10,
    height: 10,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    marginBottom: 6,
  },
  bossBattleLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginTop: 3,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#111118',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  cardTopRow:      { flexDirection: 'row' },
  familyPill:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  familyPillText:  { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  cardTitle: {
    fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff', marginTop: 4, lineHeight: 18,
  },
  cardTitleLocked: { color: 'rgba(255,255,255,0.3)' },
  lockedHint: {
    fontSize: 10, fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', marginTop: 3,
  },
  cardBottomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6,
  },
  xpText:    { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#F5A623' },
  timeText:  { fontSize: 11, fontFamily: 'Inter_400Regular',  color: 'rgba(255,255,255,0.35)' },
  activeStrip: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
});

// ─── CLEARED WORLD STYLES ─────────────────────────────────────────────────────

const clearedStyles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  badgeLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkMark:   { fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 16 },
  clearedLabel:{ fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  xpPill:      { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  xpPillText:  { fontSize: 11, fontFamily: 'Inter_700Bold' },
});
