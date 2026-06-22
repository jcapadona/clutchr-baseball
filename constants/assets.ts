/**
 * Clutchr Asset Registry
 *
 * Single source of truth for all static image assets.
 * Reference images by name — never use inline require() paths in screens.
 *
 * Usage:
 *   import { Assets } from '@/constants/assets';
 *   <Image source={Assets.badges.elite} />
 *   <Image source={Assets.coachCap.celebration} />
 *
 * ─── DROP ZONES ────────────────────────────────────────────────────────────────
 *   badges/          Achievement badges awarded to athletes
 *   branding/        Wordmarks, C-marks, UI chrome, XP/streak/arrow assets
 *   backgrounds/     Full-screen lesson and screen backgrounds
 *   coachCap/        Coach Cap character poses and avatars
 *   icons/           General UI icons (tab bar, locker, plan, etc.)
 *   overlays/        Glow effects, decision boards, zone overlays
 *   stepIcons/       Per-lesson-step type icons (freeze frame, boss, etc.)
 *                    → Add new step icons here, then register below
 *   worldIcons/      Per-Career-world map icons (one per world ID)
 *                    → Filename convention: <world-id>.png  e.g. foundation.png
 *                    → Add new world icons here, then register below
 * ───────────────────────────────────────────────────────────────────────────────
 */

// ─── BACKGROUNDS ──────────────────────────────────────────────────────────────
const backgrounds = {
  bossBattleEntrance:  require('../assets/backgrounds/boss-battle-entrance.png'),
  lessonBackground:    require('../assets/backgrounds/lesson-background-screen.png'),
  lessonCompletion:    require('../assets/backgrounds/lesson-completion-background.png'),
  pressureRep:         require('../assets/backgrounds/pressure-rep-background.png'),
  quickReset:          require('../assets/backgrounds/quick-reset-screen.png'),
  scenarioPick:        require('../assets/backgrounds/scenario-pick-screen.png'),
  careerTowerArena:    require('../assets/backgrounds/career-tower-arena.png'),
};

// ─── BADGES ───────────────────────────────────────────────────────────────────
const badges = {
  built:       require('../assets/badges/built-badge.png'),
  command:     require('../assets/badges/command-badge.png'),
  elite:       require('../assets/badges/elite-badge.png'),
  foundation:  require('../assets/badges/foundation-badge.png'),
  lockedIn:    require('../assets/badges/locked-in-badge.png'),
};

// ─── BRANDING ─────────────────────────────────────────────────────────────────
const branding = {
  cMark:               require('../assets/branding/c-mark.png'),
  ctaArrow:            require('../assets/branding/call-to-action-arrow.png'),
  charcoalC:           require('../assets/branding/charcoal-c.png'),
  headerC:             require('../assets/branding/clutchr-header-c.png'),
  gamemodeLightning:   require('../assets/branding/gamemode-lightning.png'),
  greenArrowHomeplate: require('../assets/branding/green-arrow-homeplate.png'),
  lockerIcon:          require('../assets/branding/locker-icon.png'),
  mainWordmark:        require('../assets/branding/main-wordmark.png'),
  minimalHomeplate:    require('../assets/branding/minimal-homeplate.png'),
  monochromeC:         require('../assets/branding/monochrome-c.png'),
  profile:             require('../assets/branding/profile.png'),
  simplifiedWordmark:  require('../assets/branding/simplified-wordmark.png'),
  startRepPulseRing:   require('../assets/branding/start-rep-pulse-ring.png'),
  streakFlame:         require('../assets/branding/streak-flame.png'),
  xpIcon:              require('../assets/branding/xp-icon.png'),
};

// ─── COACH CAP ────────────────────────────────────────────────────────────────
const coachCap = {
  calmStanding:    require('../assets/coach-cap/calm-standing-portrait.png'),
  circularAvatar:  require('../assets/coach-cap/circular-avatar.png'),
  calm:            require('../assets/coach-cap/coach-cap-calm.png'),
  celebration:     require('../assets/coach-cap/coach-cap-celebration.png'),
  clipboard:       require('../assets/coach-cap/coach-cap-clipboard.png'),
  halfBodyPointing: require('../assets/coach-cap/half-body-pointing.png'),
};

// ─── ICONS (general UI) ───────────────────────────────────────────────────────
const icons = {
  clipboard:   require('../assets/icons/clipboard-icon.png'),
  ccsTake:     require('../assets/icons/coach-cap-ccs-take.png'),
  todaysPlan:  require('../assets/icons/todays-plan-icon.png'),
};

// ─── OVERLAYS ─────────────────────────────────────────────────────────────────
const overlays = {
  completionGlow:       require('../assets/overlays/completion-glow.png'),
  diamondDecisionBoard: require('../assets/overlays/diamond-decision-board.png'),
  greenAccentGlow:      require('../assets/overlays/green-accent-glow.png'),
  strikeZone:           require('../assets/overlays/strike-zone.png'),
};

// ─── STEP ICONS ───────────────────────────────────────────────────────────────
// Lesson-step type icons. Drop new files in assets/stepIcons/ and add a key here.
// Convention: one icon per lesson family — camelCase key = lesson_family value.
const stepIcons = {
  // Seeded from assets/icons/ (legacy location — do not move the files)
  bossChallenge:   require('../assets/icons/boss-challenge-icon.png'),
  freezeFrame:     require('../assets/icons/freeze-frame-icon.png'),
  pressureRep:     require('../assets/icons/pressure-rep.png'),
  routineBuilder:  require('../assets/icons/routine-builder.png'),
  scenarioPick:    require('../assets/icons/scenario-pick.png'),
  // Add new step icons below as: assets/stepIcons/<name>.png
  // sparkCard:    require('../assets/stepIcons/spark-card.png'),
  // reframeBuilder: require('../assets/stepIcons/reframe-builder.png'),
  // mistakeAudit: require('../assets/stepIcons/mistake-audit.png'),
  // quickReset:   require('../assets/stepIcons/quick-reset.png'),
};

// ─── WORLD ICONS ──────────────────────────────────────────────────────────────
// One icon per Career world. Drop files in assets/worldIcons/ and add a key here.
// Convention: key = world id in camelCase,  filename = world-id.png
// e.g. assets/worldIcons/foundation.png → worldIcons.foundation
const worldIcons = {
  // Add world icons below as they are produced:
  // foundation:           require('../assets/worldIcons/foundation.png'),
  // readinessRoutines:    require('../assets/worldIcons/readiness-routines.png'),
  // gameDayFocus:         require('../assets/worldIcons/game-day-focus.png'),
  // baseballIq:           require('../assets/worldIcons/baseball-iq.png'),
  // slumpRecovery:        require('../assets/worldIcons/slump-recovery.png'),
  // returnToThrow:        require('../assets/worldIcons/return-to-throw.png'),
  // pitcherPath:          require('../assets/worldIcons/pitcher-path.png'),
  // pitchingMindset:      require('../assets/worldIcons/pitching-mindset.png'),
  // pitchingStrategy:     require('../assets/worldIcons/pitching-strategy.png'),
  // hitterPath:           require('../assets/worldIcons/hitter-path.png'),
  // hittingApproach:      require('../assets/worldIcons/hitting-approach.png'),
  // catcherPath:          require('../assets/worldIcons/catcher-path.png'),
  // catcherLeadership:    require('../assets/worldIcons/catcher-leadership.png'),
  // infieldPath:          require('../assets/worldIcons/infield-path.png'),
  // infieldPlayIq:        require('../assets/worldIcons/infield-play-iq.png'),
  // outfieldPath:         require('../assets/worldIcons/outfield-path.png'),
  // outfieldReads:        require('../assets/worldIcons/outfield-reads.png'),
  // baserunnerPath:       require('../assets/worldIcons/baserunner-path.png'),
  // builtDifferent:       require('../assets/worldIcons/built-different.png'),
  // pressureResilience:   require('../assets/worldIcons/pressure-resilience.png'),
  // competitiveIdentity:  require('../assets/worldIcons/competitive-identity.png'),
  // pressureProof:        require('../assets/worldIcons/pressure-proof.png'),
  // leadershipDugout:     require('../assets/worldIcons/leadership-dugout.png'),
  // bounceBackPlayer:     require('../assets/worldIcons/bounce-back-player.png'),
  // armCareDurability:    require('../assets/worldIcons/arm-care-durability.png'),
  // strengthConditioning: require('../assets/worldIcons/strength-conditioning.png'),
  // recoveryReadiness:    require('../assets/worldIcons/recovery-readiness.png'),
  // showcaseRecruiting:   require('../assets/worldIcons/showcase-recruiting.png'),
  // coachDynamics:        require('../assets/worldIcons/coach-dynamics.png'),
  // whatTheProsdo:        require('../assets/worldIcons/what-the-pros-do.png'),
  // programBeatsPanic:    require('../assets/worldIcons/program-beats-panic.png'),
  // underdogExecution:    require('../assets/worldIcons/underdog-execution.png'),
  // practiceEfficiency:   require('../assets/worldIcons/practice-efficiency.png'),
  // pitchTippingLab:      require('../assets/worldIcons/pitch-tipping-lab.png'),
  // dugoutIntel:          require('../assets/worldIcons/dugout-intel.png'),
  // highVeloPrep:         require('../assets/worldIcons/high-velo-prep.png'),
  // armFirst:             require('../assets/worldIcons/arm-first.png'),
  // emotionalRangeControl:require('../assets/worldIcons/emotional-range-control.png'),
  // teamChaos:            require('../assets/worldIcons/team-chaos.png'),
} as const;

// ─── APP CHROME ───────────────────────────────────────────────────────────────
// Root-level Expo assets (icon, splash, favicon). Rarely referenced in-app.
const appChrome = {
  icon:          require('../assets/icon.png'),
  adaptiveIcon:  require('../assets/adaptive-icon.png'),
  splashIcon:    require('../assets/splash-icon.png'),
  favicon:       require('../assets/favicon.png'),
};

// ─── NAMED EXPORT ─────────────────────────────────────────────────────────────
export const Assets = {
  backgrounds,
  badges,
  branding,
  coachCap,
  icons,
  overlays,
  stepIcons,
  worldIcons,
  appChrome,
} as const;

// Individual category exports for tree-shaking in tight modules
export { backgrounds, badges, branding, coachCap, icons, overlays, stepIcons, worldIcons, appChrome };
