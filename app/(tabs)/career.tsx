import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAthlete } from '@/context/AthleteContext';
import { fetchLessons, type LegacyLesson } from '@/lib/supabase';
import { Assets } from '@/constants/assets';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { CategoryColor } from '@/constants/visualExtensions';
import { Btn } from '@/components/ui';
import { ScreenHeader, WorldTile, WorldTileSkeleton } from '@/components/ui/ClutchrUI';
import { useMicrocopy } from '@/hooks/useMicrocopy';
import { useProContext } from '@/context/ProContext';
import { ErrorState } from '@/components/SkeletonLoader';

// ─── DEV FLAGS ────────────────────────────────────────────────────────────────
// Set to false before App Store submission.
const DEV_UNLOCK_ALL = false;

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
    color: Colors.primary,
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
    color: Colors.primary,
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
    color: Colors.primary,
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
  { id: 'foundation', label: 'FOUNDATION', icon: 'layers-outline' as const,  color: Colors.primary },
  { id: 'your-craft', label: 'CRAFT', icon: 'construct-outline' as const, color: '#BF5AF2' },
  { id: 'edge',       label: 'COMPETE',    icon: 'flash-outline' as const,    color: '#FF6B6B' },
  { id: 'the-grind',  label: 'GRIND',  icon: 'barbell-outline' as const,  color: '#FF9F0A' },
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
  isPro: boolean,
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

    // Premium worlds are teaser for free users regardless of lesson availability.
    // DEV_UNLOCK_ALL removes the progression gate on individual lesson nodes
    // (see WorldMapSection), but worlds with zero lessons stay as teasers regardless.
    if (world.isPremium && !isPro) {
      result.push({ ...world, lockState: 'teaser' });
      continue;
    }

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
    'WORLD CLEARED',
    'You finished every lesson in this world.\n\nThat rep is built in. Keep stacking.',
    [{ text: "Let's go →", style: 'default' }]
  );
}

// ─── WORLD GRID ───────────────────────────────────────────────────────────────

const CHAPTER_ACCENT: Record<string, string> = {
  foundation:  CategoryColor.foundation,
  'your-craft': CategoryColor.craft,
  edge:        CategoryColor.compete,
  'the-grind': CategoryColor.grind,
  signal:      CategoryColor.signal,
};

function chunk<T>(items: T[], n: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += n) rows.push(items.slice(i, i + n));
  return rows;
}

function WorldGrid({ worlds, featuredId, accent, lessons, completed, isPro, onTap }: {
  worlds: WorldWithLockState[];
  featuredId: string | null;
  accent: string;
  lessons: LegacyLesson[];
  completed: string[];
  isPro: boolean;
  onTap: (world: WorldWithLockState) => void;
}) {
  const featured = worlds.find(w => w.id === featuredId) ?? worlds[0];
  if (!featured) return null;
  const rest = worlds.filter(w => w.id !== featured.id);
  const mid = rest.slice(0, 3);
  const small = chunk(rest.slice(3), 4);

  const renderTile = (world: WorldWithLockState, size: 'sm' | 'md' | 'lg') => {
    const wl = lessons.filter(l => l.pillar_id === world.id).sort((a, b) => a.order_index - b.order_index);
    const done = wl.filter(l => completed.includes(l.id)).length;
    const state = world.lockState === 'active' ? 'active' : world.isPremium && !isPro ? 'pro' : 'locked';
    const next = wl.find(l => !completed.includes(l.id));
    return (
      <WorldTile
        key={world.id}
        title={world.label}
        size={size}
        state={state}
        percent={wl.length > 0 ? (done / wl.length) * 100 : 0}
        done={done}
        total={wl.length}
        description={world.tagline}
        nextRep={next?.title}
        cta="View reps"
        topBar={world.id === 'slump-recovery' ? CategoryColor.recovery : undefined}
        onPress={() => onTap(world)}
      />
    );
  };

  return (
    <View style={gridStyles.wrap}>
      <View style={gridStyles.row}>{renderTile(featured, 'lg')}</View>
      {mid.length > 0 && <View style={gridStyles.row}>{mid.map(w => renderTile(w, 'md'))}</View>}
      {small.map((row, i) => (
        <View key={i} style={gridStyles.row}>{row.map(w => renderTile(w, 'sm'))}</View>
      ))}
    </View>
  );
}

function WorldGridSkeleton() {
  return (
    <View style={gridStyles.wrap}>
      <View style={gridStyles.row}><WorldTileSkeleton size="lg" /></View>
      <View style={gridStyles.row}>{[0, 1, 2].map(i => <WorldTileSkeleton key={i} size="md" />)}</View>
      <View style={gridStyles.row}>{[0, 1, 2, 3].map(i => <WorldTileSkeleton key={i} size="sm" />)}</View>
    </View>
  );
}

const gridStyles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.lg, gap: 10 },
  row:  { flexDirection: 'row', gap: 10 },
});

// ─── CURRENT MISSION CARD ─────────────────────────────────────────────────────

function CurrentMissionCard({
  nextLesson,
  insets,
  onHeight,
}: {
  nextLesson: { lesson: LegacyLesson; world: World };
  insets: { bottom: number };
  onHeight: (h: number) => void;
}) {
  return (
    <View
      style={[missionStyles.wrap, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}
      onLayout={(e) => onHeight(e.nativeEvent.layout.height)}
    >
      <View style={missionStyles.topRow}>
        <View style={missionStyles.kickerWrap}>
          <View style={missionStyles.dot} />
          <Text style={missionStyles.kicker}>CURRENT MISSION</Text>
        </View>
        <Text style={missionStyles.duration}>10 min</Text>
      </View>
      <Text style={missionStyles.title} numberOfLines={1}>
        {nextLesson.lesson.title}
      </Text>
      {nextLesson.lesson.subtitle ? (
        <Text style={missionStyles.tagline} numberOfLines={1}>
          {nextLesson.lesson.subtitle}
        </Text>
      ) : null}
      <Btn
        label="Start Session →"
        onPress={() => router.push(`/lesson/${nextLesson.lesson.id}`)}
      />
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, []);

  if (lessons.length === 0) {
    return (
      <Animated.View style={[mapStyles.emptyWrap, { opacity: fadeAnim }]}>
        <Text style={mapStyles.emptyText}>{microcopy.useEmptyState('noLessonsInWorld')}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[mapStyles.outerWrap, { opacity: fadeAnim }]}>
      {/* World header */}
      <View style={[mapStyles.worldHeader, { borderLeftColor: Colors.border }]}>
        <Text style={[mapStyles.worldHeaderLabel, { color: Colors.textSecondary }]}>{label.toUpperCase()}</Text>
        <Text style={mapStyles.worldHeaderTagline}>{tagline}</Text>
      </View>

      <View style={mapStyles.timelineContainer}>
        <View style={[mapStyles.spineLine, { backgroundColor: Colors.border }]} />

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
                  <View style={[mapStyles.dividerLine, { backgroundColor: Colors.border }]} />
                  <Text style={[mapStyles.dividerLabel, { color: Colors.textTertiary }]}>
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
                color={color === Colors.primary ? Colors.textSecondary : color}
              />
            </React.Fragment>
          );
        })}
      </View>
    </Animated.View>
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
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.00, duration: 1200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isNext]);

  const nodeSize = isBoss ? 44 : 38;
  const lessonFamily =
    ((lesson as any).lesson_family as string | undefined) ??
    ((lesson as any).node_type as string | undefined) ??
    'LESSON';

  function handlePress() {
    if (isLocked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Not yet.', 'Complete the previous lesson to unlock this one.');
      return;
    }
    router.push(`/lesson/${lesson.id}`);
  }

  return (
    <Pressable style={tlStyles.row} onPress={handlePress}>
      {/* ── Node dot ── */}
      <View style={tlStyles.nodeCol}>
        <Animated.View
          style={[
            tlStyles.nodeCircle,
            { width: nodeSize, height: nodeSize, borderRadius: nodeSize / 2 },
            isDone && { backgroundColor: Colors.textDisabled, borderWidth: 0 },
            !isDone && isNext && {
              backgroundColor: '#0D0D12',
              borderWidth: 2.5,
              borderColor: color,
              shadowColor: color,
              shadowOpacity: 0.8,
              shadowRadius: 10,
              elevation: 8,
            },
            !isDone && isLocked && {
              backgroundColor: '#0E0E14',
              borderWidth: 1,
              borderColor: '#1e1e2a',
            },
            !isDone && !isNext && !isLocked && isBoss && {
              backgroundColor: '#0D0D12',
              borderWidth: 2,
              borderColor: color + '80',
            },
            !isDone && !isNext && !isLocked && !isBoss && {
              backgroundColor: '#0E0E14',
              borderWidth: 1.5,
              borderColor: '#1e1e2a',
            },
            isNext && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {isDone    ? <Ionicons name="checkmark" size={isBoss ? 20 : 17} color="#fff" />
          : isNext   ? <Ionicons name="play" size={14} color="#fff" style={{ marginLeft: 2 }} />
          : isLocked ? <Ionicons name="lock-closed" size={13} color="rgba(255,255,255,0.2)" />
          :            <Text style={tlStyles.nodeNumText}>{idx + 1}</Text>}
        </Animated.View>
      </View>

      {/* ── Card ── */}
      <View style={[
        tlStyles.card,
        !isDone && !isNext && !isLocked && { borderColor: '#1e1e28' },
        isNext && {
          borderColor: color + '45',
          borderLeftWidth: 3,
          borderLeftColor: color,
          backgroundColor: color + '0C',
        },
        isDone && { borderColor: '#181820', backgroundColor: '#0C0C10' },
        isLocked && { borderColor: '#131318' },
      ]}>
        {/* Family pill + done badge */}
        <View style={tlStyles.cardTopRow}>
          <View style={[
            tlStyles.familyPill,
            { backgroundColor: isLocked || isDone ? 'rgba(255,255,255,0.04)' : color + '22' },
          ]}>
            <Text style={[
              tlStyles.familyPillText,
              { color: isLocked || isDone ? 'rgba(255,255,255,0.2)' : color },
            ]}>
              {lessonFamily.toUpperCase()}{isBoss ? ' · FINAL' : ''}
            </Text>
          </View>
          {isDone && (
            <View style={tlStyles.doneBadge}>
              <Text style={tlStyles.doneBadgeText}>DONE</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text
          style={[
            tlStyles.cardTitle,
            isDone && tlStyles.cardTitleDone,
            isLocked && tlStyles.cardTitleLocked,
          ]}
          numberOfLines={2}
        >
          {lesson.title}
        </Text>

        {/* Footer row */}
        {isLocked ? (
          <Text style={tlStyles.lockedHint}>Complete previous lesson to unlock</Text>
        ) : isDone ? (
          <Text style={[tlStyles.xpEarnedText, { color: Colors.textTertiary }]}>{lesson.xp_reward} XP earned</Text>
        ) : (
          <View style={tlStyles.cardBottomRow}>
            <Text style={tlStyles.xpText}>{lesson.xp_reward} XP · first clear</Text>
            <Text style={tlStyles.timeText}>~5 min</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── SCREEN ──────────────────────────────────────────────────────────────────

// Persists active chapter across navigation (lesson completion, exits) so the
// user always returns to the chapter they were in rather than resetting to Foundation.
let _savedChapter = 'foundation';

export default function CareerScreen() {
  const insets = useSafeAreaInsets();
  const { athleteState } = useAthlete();
  const [lessons, setLessons] = useState<LegacyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { isPro, isProLoading: proLoading } = useProContext();
  const [activeChapter, _setActiveChapter] = useState(_savedChapter);
  const setActiveChapter = (ch: string) => { _savedChapter = ch; _setActiveChapter(ch); };
  const [expandedWorldId, setExpandedWorldId] = useState<string | null>(null);
  const [measuredDockH, setMeasuredDockH] = useState(0);

  const xpRef = useRef<number | null>(null);
  const [xpShown, setXpShown] = useState(athleteState?.total_xp ?? 0);
  const xpCountRef = useRef(new Animated.Value(0));
  const boltScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const newXP = athleteState?.total_xp ?? 0;
    if (xpRef.current === null) {
      xpRef.current = newXP;
      setXpShown(newXP);
      return;
    }
    if (newXP === xpRef.current) return;
    const start = xpRef.current;
    xpRef.current = newXP;
    xpCountRef.current.setValue(start);
    const lid = xpCountRef.current.addListener(({ value }) => setXpShown(Math.round(value)));
    Animated.timing(xpCountRef.current, { toValue: newXP, duration: 1000, useNativeDriver: false }).start(() => {
      xpCountRef.current.removeListener(lid);
      setXpShown(newXP);
    });
    Animated.sequence([
      Animated.timing(boltScaleAnim, { toValue: 1.8, duration: 100, useNativeDriver: true }),
      Animated.spring(boltScaleAnim, { toValue: 1, damping: 8, stiffness: 160, useNativeDriver: true }),
    ]).start();
  }, [athleteState?.total_xp]);

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

  // Measured dock height; the estimate only covers the first frame.
  const dockHeight = measuredDockH || 130 + Math.max(insets.bottom, 16) + 4;
  const totalDone = completed.length;
  const totalAll  = lessons.length;

  const lessonPillarIds = [...new Set(lessons.map(l => l.pillar_id).filter(Boolean))];

  const chapterWorlds = WORLDS.filter(w => w.chapter === activeChapter);
  const filteredWorlds = getWorldsForChapter(
    chapterWorlds, lessonPillarIds, activeChapter, athleteRole, isTwoWay, seasonPhase, healthState, isPro
  );

  // Worlds with zero published lessons are hidden at render time only. No array is
  // re-indexed.
  const visibleWorlds = filteredWorlds.filter(w => lessonPillarIds.includes(w.id));

  const activeChapterConfig = CHAPTERS.find(c => c.id === activeChapter) ?? CHAPTERS[0];

  // First active world with incomplete lessons (drives the subheader "WORLD N" display)
  const currentWorld = useMemo(() => {
    const inProgress = filteredWorlds.find(w => {
      if (w.lockState !== 'active') return false;
      const wl = lessons.filter(l => l.pillar_id === w.id);
      return wl.length === 0 || wl.filter(l => completed.includes(l.id)).length < wl.length;
    });
    return inProgress ?? filteredWorlds.find(w => w.lockState === 'active') ?? null;
  }, [filteredWorlds, lessons, completed]);

  const currentWorldLessons = currentWorld
    ? lessons.filter(l => l.pillar_id === currentWorld.id)
    : [];
  const currentWorldDone  = currentWorldLessons.filter(l => completed.includes(l.id)).length;
  const currentWorldTotal = currentWorldLessons.length;

  // Next lesson across ALL worlds (for Current Mission card)
  const nextLesson = useMemo(() => {
    if (!lessons.length) return null;
    const sorted = [...WORLDS]
      .filter(w => lessonPillarIds.includes(w.id) && (isPro || !w.isPremium))
      .sort((a, b) => a.worldNumber - b.worldNumber);
    for (const world of sorted) {
      const wl = lessons
        .filter(l => l.pillar_id === world.id)
        .sort((a, b) => a.order_index - b.order_index);
      const next = wl.find(l => !completed.includes(l.id));
      if (next) return { lesson: next, world };
    }
    return null;
  }, [lessons, completed, lessonPillarIds, isPro]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <ScreenHeader
        logo={Assets.branding.mainWordmark}
        titleLead="BUILD"
        titleRest="YOUR PATH"
        xp={xpShown}
        streak={athleteState?.streak_count ?? 0}
      />

      {/* ── CHAPTER TABS ── */}
      <View style={styles.tabRow}>
        {CHAPTERS.map((chapter) => {
          const active = activeChapter === chapter.id;
          const labelColor = active ? Colors.textPrimary : Colors.textTertiary;
          return (
            <Pressable
              key={chapter.id}
              style={[
                styles.tab,
                active && { borderBottomWidth: 2, borderBottomColor: Colors.textPrimary },
              ]}
              onPress={() => {
                setActiveChapter(chapter.id);
                setExpandedWorldId(null);
              }}
            >
              <Text style={[styles.tabLabel, { color: labelColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{chapter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── CONTENT ── */}
      {loadError ? (
        <ErrorState message="Could not load lessons." onRetry={fetchData} />
      ) : loading || proLoading ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          pointerEvents="none"
        >
          <WorldGridSkeleton />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: dockHeight + 24 }]}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {/* ── WORLD SUBHEADER ── */}
          <View style={styles.subheaderRow}>
            <Text style={styles.subheaderTitle}>
              {activeChapterConfig.label}
              {currentWorld ? ` • WORLD ${currentWorld.worldNumber}` : ''}
            </Text>
            <View style={styles.subheaderRight}>
              <Text style={styles.subheaderTitle}>{totalDone} / {totalAll} REPS</Text>
              {currentWorldTotal > 0 && (
                <View style={[styles.chapterCountPill, { borderColor: Colors.border }]}>
                  <Text style={[styles.chapterCountText, { color: Colors.textTertiary }]}>
                    {currentWorldDone} / {currentWorldTotal}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── ROLE PILL ── */}
          <View style={styles.rolePillRow}>
            <View style={[
              styles.rolePill,
              {
                borderColor: Colors.border,
                backgroundColor: Colors.surface,
              },
            ]}>
              <Text style={[styles.rolePillText, { color: Colors.textTertiary }]}>
                {athleteRole.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* ── WORLD GRID ── */}
          {visibleWorlds.length === 0 ? (
            <View style={styles.emptyChapter}>
              <Text style={styles.emptyChapterText}>No worlds available for your role yet.</Text>
            </View>
          ) : (
            <WorldGrid
              worlds={visibleWorlds}
              featuredId={currentWorld?.id ?? null}
              accent={CHAPTER_ACCENT[activeChapter] ?? CategoryColor.foundation}
              lessons={lessons}
              completed={completed}
              isPro={isPro}
              onTap={(world) => {
                if (world.lockState === 'teaser') {
                  if (world.isPremium && !isPro) {
                    router.push('/upgrade?source=career');
                  } else {
                    Alert.alert('Keep stacking.', 'This world unlocks as you progress.');
                  }
                  return;
                }
                setExpandedWorldId(expandedWorldId === world.id ? null : world.id);
              }}
            />
          )}

          {/* ── EXPANDED WORLD LESSONS (below tower) ── */}
          {visibleWorlds.map((world) => {
            if (world.lockState !== 'active' || expandedWorldId !== world.id) return null;
            const worldLessons = lessons
              .filter(l => l.pillar_id === world.id)
              .sort((a, b) => a.order_index - b.order_index);
            return (
              <WorldMapSection
                key={world.id}
                world={world}
                lessons={worldLessons}
                completed={completed}
              />
            );
          })}

        </ScrollView>
      )}

      {/* ── CURRENT MISSION (pinned) ── */}
      {!loading && !loadError && nextLesson && (
        <>
          <LinearGradient
            colors={['rgba(5,8,6,0)', '#050806']}
            pointerEvents="none"
            style={styles.dockFade}
          />
          <CurrentMissionCard nextLesson={nextLesson} insets={insets} onHeight={setMeasuredDockH} />
        </>
      )}


    </View>
  );
}

// ─── LAYOUT CONSTANTS ─────────────────────────────────────────────────────────

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1, backgroundColor: Colors.background },
  scroll:     { paddingTop: Spacing.lg },
  dockFade:   { height: 32, marginTop: -32 },

  // Chapter tabs
  tabRow: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexGrow: 0,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: Spacing.sm + 2,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },

  // World subheader
  subheaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  subheaderTitle: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 2,
  },
  subheaderRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chapterCountPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chapterCountText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },

  // Role pill
  rolePillRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },

  // Empty state
  emptyChapter: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyChapterText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});

// ─── CURRENT MISSION STYLES ───────────────────────────────────────────────────

const missionStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: 10,
    gap: 4,
    ...Shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textTertiary,
  },
  kicker: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 2.2,
  },
  duration: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textTertiary,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 16,
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
  worldHeader: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    paddingLeft: 10,
    borderLeftWidth: 3,
  },
  worldHeaderLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  worldHeaderTagline: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 16,
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
    fontSize: 10,
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
    marginBottom: 10,
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
  nodeNumText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.35)' },
  card: {
    flex: 1,
    backgroundColor: '#111118',
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  familyPill:     { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  familyPillText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  doneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  doneBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginTop: 4,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  cardTitleDone:   { color: 'rgba(255,255,255,0.45)' },
  cardTitleLocked: { color: 'rgba(255,255,255,0.25)' },
  lockedHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.18)',
    fontStyle: 'italic',
    marginTop: 5,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xpText:      { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#F5A623' },
  timeText:    { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.3)' },
  xpEarnedText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 6 },
});
