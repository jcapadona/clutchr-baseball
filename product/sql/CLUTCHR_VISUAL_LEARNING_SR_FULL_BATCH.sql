-- ============================================================
-- CLUTCHR VISUAL LEARNING MVP — SNAPSHOT READ (SR)
-- FULL BATCH: lessons 6–25 of 25 snapshot_read lessons
-- pack_id: clutchr_visual_learning_mvp_v1
-- Run after CLUTCHR_VISUAL_LEARNING_SR_TEST_BATCH.sql (lessons 1–5).
-- DELETE targets only the 20 IDs in this file; rows 1–5 are untouched.
-- ⚠️  sr_attack_mode_after_error uses pillar_id "team-chaos" which has
--     no matching world in career.tsx WORLDS array — it will not render
--     in Career until a "team-chaos" world entry is added.
-- ============================================================

BEGIN;

DELETE FROM public.legacy_lessons_staging
WHERE legacy_lesson_id IN (
  'sr_low_away_borderline_take',
  'sr_two_strike_body_language_foul',
  'sr_bad_call_reset_box',
  'sr_high_velo_ready_early_gather',
  'sr_two_strike_simple_move',
  'sr_spin_vs_heater_out_hand',
  'sr_2_0_hunt_lane_discipline',
  'sr_slide_step_timing_runner_on',
  'sr_second_ear_hitting',
  'sr_late_inning_box_presence',
  'sr_set_height_consistency_check',
  'sr_front_shoulder_flying_open',
  'sr_stride_direction_off_line',
  'sr_low_zone_command_target',
  'sr_runner_control_look_first',
  'sr_hold_pattern_from_set',
  'sr_post_walk_mound_body_language',
  'sr_attack_mode_after_error',
  'sr_slide_step_vs_normal_move',
  'sr_front_side_stability_release'
);

INSERT INTO public.legacy_lessons_staging (
  id,
  legacy_lesson_id,
  pillar_id,
  unit_id,
  title,
  subtitle,
  difficulty_tier,
  duration_sec,
  xp_reward,
  order_index,
  is_checkpoint,
  is_boss,
  steps,
  sport_scope,
  role_tags,
  skill_tags,
  is_active
) VALUES

-- ── 6. Low-Away Borderline Take ──────────────────────────────
(
  gen_random_uuid(),
  'sr_low_away_borderline_take',
  'hitter-path',
  'swing_take',
  'Low-Away Borderline Take',
  'Discipline protects damage.',
  'rookie',
  105,
  25,
  6,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Low-Away Borderline Take",
      "content": "5th inning, 1-0, 1 out, bases empty, one-run lead."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "Swing or take?",
        "situation": "5th inning, 1-0, 1 out, bases empty, one-run lead.",
        "cue_description": "Borderline low-away pitch below damage zone.",
        "image_uri": "snapshot-hitter-06",
        "diagram_mode": "batter_stance",
        "cues": [
          {"id": "take",               "label": "Take",                      "description": "Take",                      "quality": "correct"},
          {"id": "spoil_two_strikes",  "label": "Spoil only if two strikes", "description": "Spoil only if two strikes", "quality": "acceptable"},
          {"id": "sell_out_middle_in", "label": "Sell out middle-in",        "description": "Sell out middle-in",        "quality": "poor"},
          {"id": "guess_breaking_ball","label": "Guess breaking ball",       "description": "Guess breaking ball",       "quality": "poor"}
        ],
        "question": "What is the best swing decision?",
        "image_generation_prompt": "Clean 4:5 baseball strike-zone diagram, low-away border pitch, dark interface, one bright pitch trail, mobile-friendly clarity."
      },
      "responses": {
        "correct_id": "take",
        "acceptable_ids": ["spoil_two_strikes"]
      },
      "feedback": {
        "correct":    "This is not your money pitch. With two strikes, fight it. In a hitter count, protect damage.",
        "acceptable": "Good read. Tighten it to the main cue: Borderline low-away pitch below damage zone.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Good takes are part of good hitting. Discipline protects damage."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['zone_discipline','take'],
  true
),

-- ── 7. Two-Strike Body Language After a Foul Ball ────────────
(
  gen_random_uuid(),
  'sr_two_strike_body_language_foul',
  'pressure-resilience',
  'two_strike_compete',
  'Two-Strike Body Language After a Foul Ball',
  'Compete posture is visible.',
  'builder',
  105,
  25,
  7,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Two-Strike Body Language After a Foul Ball",
      "content": "8th inning, 1-2, 2 outs, runner on second, down one."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What body-language clue matters most?",
        "situation": "8th inning, 1-2, 2 outs, runner on second, down one.",
        "cue_description": "Compete posture after a tough foul ball.",
        "image_uri": "snapshot-hitter-07",
        "diagram_mode": "batter_stance",
        "cues": [
          {"id": "composed_reset",  "label": "Composed reset and eyes back to pitcher", "description": "Composed reset and eyes back to pitcher", "quality": "correct"},
          {"id": "breath_control",  "label": "Breath control before re-entry",          "description": "Breath control before re-entry",          "quality": "acceptable"},
          {"id": "dirty_uniform",   "label": "Dirty uniform",                           "description": "Dirty uniform",                           "quality": "poor"},
          {"id": "crowd_standing",  "label": "Crowd standing",                          "description": "Crowd standing",                          "quality": "poor"}
        ],
        "question": "What body-language clue matters most?",
        "image_generation_prompt": "4:5 realistic baseball close-up, two-strike hitter after foul ball, composed body language, late-inning pressure, no logos, premium dark style."
      },
      "responses": {
        "correct_id": "composed_reset",
        "acceptable_ids": ["breath_control"]
      },
      "feedback": {
        "correct":    "The reset behavior matters. Cosmetic details do not drive the rep.",
        "acceptable": "Good read. Tighten it to the main cue: Compete posture after a tough foul ball.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Two-strike hitters cannot leak defeat between pitches. Compete posture is visible."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['two_strike','body_language'],
  true
),

-- ── 8. Bad-Call Reset in the Box ─────────────────────────────
(
  gen_random_uuid(),
  'sr_bad_call_reset_box',
  'foundation',
  'reset_basics',
  'Bad-Call Reset in the Box',
  'Bad call, clean reset.',
  'rookie',
  105,
  25,
  8,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Bad-Call Reset in the Box",
      "content": "7th inning, 0-1 after a bad called strike, 1 out, bases empty."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What should he do next?",
        "situation": "7th inning, 0-1 after a bad called strike, 1 out, bases empty.",
        "cue_description": "Post-bad-call reset.",
        "image_uri": "snapshot-hitter-08",
        "diagram_mode": "batter_stance",
        "cues": [
          {"id": "reset_return_plan", "label": "Reset and return to the plan", "description": "Reset and return to the plan", "quality": "correct"},
          {"id": "step_out_regrip",   "label": "Step out, regrip, re-enter",   "description": "Step out, regrip, re-enter",   "quality": "acceptable"},
          {"id": "stare_umpire",      "label": "Stare down umpire",            "description": "Stare down umpire",            "quality": "poor"},
          {"id": "rush_back_angry",   "label": "Rush back angry",              "description": "Rush back angry",              "quality": "poor"}
        ],
        "question": "What is the winning move here?",
        "image_generation_prompt": "4:5 realistic freeze frame, hitter stepping out after bad strike call, calm reset routine, subtle breathing cue, premium baseball app look."
      },
      "responses": {
        "correct_id": "reset_return_plan",
        "acceptable_ids": ["step_out_regrip"]
      },
      "feedback": {
        "correct":    "Own the next pitch. Arguing or rushing gives the call more pitches.",
        "acceptable": "Good read. Tighten it to the main cue: Post-bad-call reset.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "The umpire took one pitch, not the whole at-bat. Bad call, clean reset."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['bad_call_reset','routine'],
  true
),

-- ── 9. High-Velo Ready Early Gather ──────────────────────────
(
  gen_random_uuid(),
  'sr_high_velo_ready_early_gather',
  'hitter-path',
  'high_velo',
  'High-Velo Ready Early Gather',
  'Be early to be on time.',
  'competitor',
  135,
  25,
  9,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "High-Velo Ready Early Gather",
      "content": "Pregame cage or live AB vs power arm."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "Why is he ready?",
        "situation": "Pregame cage or live AB vs power arm.",
        "cue_description": "Early gather before release.",
        "image_uri": "snapshot-hitter-09",
        "diagram_mode": "batter_stance",
        "cues": [
          {"id": "early_gather", "label": "Early gather before release", "description": "Early gather before release", "quality": "correct"},
          {"id": "quiet_head",   "label": "Quiet head through gather",   "description": "Quiet head through gather",   "quality": "acceptable"},
          {"id": "bigger_stride","label": "Bigger stride",               "description": "Bigger stride",               "quality": "poor"},
          {"id": "hands_drop",   "label": "Hands dropping",              "description": "Hands dropping",              "quality": "poor"}
        ],
        "question": "What helped the hitter here?",
        "image_generation_prompt": "4:5 premium baseball freeze frame vs high velocity, hitter load already gathered before release, realistic indoor or stadium cage feel, no logos."
      },
      "responses": {
        "correct_id": "early_gather",
        "acceptable_ids": ["quiet_head"]
      },
      "feedback": {
        "correct":    "Velo punishes late moves. Early gather gives the hitter a chance to be on time.",
        "acceptable": "Good read. Tighten it to the main cue: Early gather before release.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Game speed exposes lazy pre-pitch timing. Be early to be on time."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['high_velocity','early_timing'],
  true
),

-- ── 10. Two-Strike Simple Move ────────────────────────────────
(
  gen_random_uuid(),
  'sr_two_strike_simple_move',
  'hitter-path',
  'two_strike_compete',
  'Two-Strike Simple Move',
  'Simple wins with two strikes.',
  'builder',
  105,
  25,
  10,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Two-Strike Simple Move",
      "content": "9th inning, 2-2, runner on third, 1 out."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What changed?",
        "situation": "9th inning, 2-2, runner on third, 1 out.",
        "cue_description": "Simplified two-strike move.",
        "image_uri": "snapshot-hitter-10",
        "diagram_mode": "batter_stance",
        "cues": [
          {"id": "simplified_move",  "label": "He simplified the move",    "description": "He simplified the move",    "quality": "correct"},
          {"id": "short_direct_path","label": "Shorter, direct path",       "description": "Shorter, direct path",       "quality": "acceptable"},
          {"id": "homer_swing",      "label": "Trying to hit a homer",      "description": "Trying to hit a homer",      "quality": "poor"},
          {"id": "guess_curveball",  "label": "Guessing curveball",         "description": "Guessing curveball",         "quality": "poor"}
        ],
        "question": "What changed for two strikes?",
        "image_generation_prompt": "Custom 4:5 baseball illustration, two-strike hitter with simplified move, compact stride, direct path cues, premium dark sports-tech style."
      },
      "responses": {
        "correct_id": "simplified_move",
        "acceptable_ids": ["short_direct_path"]
      },
      "feedback": {
        "correct":    "Simplify without conceding. Guessing and overswinging give the pitcher leverage.",
        "acceptable": "Good read. Tighten it to the main cue: Simplified two-strike move.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Two-strike approach is not weaker; it is cleaner. Simple wins with two strikes."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['two_strike','simple_move'],
  true
),

-- ── 11. Spin vs Heater Out of Hand ───────────────────────────
(
  gen_random_uuid(),
  'sr_spin_vs_heater_out_hand',
  'baseball-iq',
  'pitch_recognition',
  'Spin vs Heater Out of Hand',
  'Identify shape before location.',
  'competitor',
  135,
  25,
  11,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Spin vs Heater Out of Hand",
      "content": "4th inning, 0-1, bases empty."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What matters out of hand?",
        "situation": "4th inning, 0-1, bases empty.",
        "cue_description": "Early pitch-shape clue.",
        "image_uri": "snapshot-hitter-11",
        "diagram_mode": "release_point",
        "cues": [
          {"id": "early_shape",          "label": "Fast early shape cue",       "description": "Fast early shape cue",       "quality": "correct"},
          {"id": "release_finger_angle", "label": "Release and finger angle",   "description": "Release and finger angle",   "quality": "acceptable"},
          {"id": "catcher_mask",         "label": "Catcher mask color",         "description": "Catcher mask color",         "quality": "poor"},
          {"id": "pitcher_belt",         "label": "Pitcher belt",               "description": "Pitcher belt",               "quality": "poor"}
        ],
        "question": "What should the hitter try to identify first?",
        "image_generation_prompt": "Recreated baseball close-up, ball just leaving hand, subtle seam/spin cue, hitter-eye perspective, premium training graphic."
      },
      "responses": {
        "correct_id": "early_shape",
        "acceptable_ids": ["release_finger_angle"]
      },
      "feedback": {
        "correct":    "Early shape buys decisions. Uniform details do not.",
        "acceptable": "Good read. Tighten it to the main cue: Early pitch-shape clue.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Seeing it early is a trained skill, not magic. Identify shape before location."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['spin','early_shape'],
  true
),

-- ── 12. 2-0 Hunt Lane Discipline ─────────────────────────────
(
  gen_random_uuid(),
  'sr_2_0_hunt_lane_discipline',
  'hitter-path',
  'count_plans',
  '2-0 Hunt Lane Discipline',
  'A good count earns a smaller zone.',
  'rookie',
  105,
  25,
  12,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "2-0 Hunt Lane Discipline",
      "content": "2-0 count, bases empty, middle innings."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "How should the zone change?",
        "situation": "2-0 count, bases empty, middle innings.",
        "cue_description": "2-0 hunt lane.",
        "image_uri": "snapshot-hitter-12",
        "diagram_mode": "batter_stance",
        "cues": [
          {"id": "shrink_hunted_lane", "label": "Shrink to the hunted lane",           "description": "Shrink to the hunted lane",           "quality": "correct"},
          {"id": "attack_best_zone",   "label": "Attack only best zone",               "description": "Attack only best zone",               "quality": "acceptable"},
          {"id": "expand_zone",        "label": "Expand because count favors hitter",  "description": "Expand because count favors hitter",  "quality": "poor"},
          {"id": "auto_take",          "label": "Take no matter what",                 "description": "Take no matter what",                 "quality": "poor"}
        ],
        "question": "What is the best approach?",
        "image_generation_prompt": "4:5 strike-zone training map, hitter 2-0 hunt lane highlighted, three decoy pitch paths, dark premium UI."
      },
      "responses": {
        "correct_id": "shrink_hunted_lane",
        "acceptable_ids": ["attack_best_zone"]
      },
      "feedback": {
        "correct":    "Leverage should narrow your yes-zone, not make you reckless.",
        "acceptable": "Good read. Tighten it to the main cue: 2-0 hunt lane.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Count leverage should make you selective, not reckless. A good count earns a smaller zone."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['count_leverage','hunt_lane'],
  true
),

-- ── 13. Slide-Step Timing with Runner On ─────────────────────
(
  gen_random_uuid(),
  'sr_slide_step_timing_runner_on',
  'baseball-iq',
  'tempo_read',
  'Slide-Step Timing with Runner On',
  'Tempo shift is a clue, not chaos.',
  'builder',
  105,
  25,
  13,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Slide-Step Timing with Runner On",
      "content": "6th inning, 1-1, runner on first, pitcher slide-steps."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What changed?",
        "situation": "6th inning, 1-1, runner on first, pitcher slide-steps.",
        "cue_description": "Quicker delivery tempo.",
        "image_uri": "snapshot-hitter-13",
        "diagram_mode": "pitcher_delivery",
        "cues": [
          {"id": "delivery_tempo_faster", "label": "Delivery tempo got faster",        "description": "Delivery tempo got faster",        "quality": "correct"},
          {"id": "quicker_to_plate",      "label": "Pitcher is quicker to the plate",  "description": "Pitcher is quicker to the plate",  "quality": "acceptable"},
          {"id": "auto_inside",           "label": "Pitch automatically inside",       "description": "Pitch automatically inside",       "quality": "poor"},
          {"id": "catcher_lazy",          "label": "Catcher is lazy",                  "description": "Catcher is lazy",                  "quality": "poor"}
        ],
        "question": "What changed most?",
        "image_generation_prompt": "4:5 realistic baseball freeze frame, pitcher slide step with runner on first, hitter staying balanced and ready, premium app lighting."
      },
      "responses": {
        "correct_id": "delivery_tempo_faster",
        "acceptable_ids": ["quicker_to_plate"]
      },
      "feedback": {
        "correct":    "The clock changed. Location is not guaranteed.",
        "acceptable": "Good read. Tighten it to the main cue: Quicker delivery tempo.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Runners change pitcher tempo; good hitters notice without panicking. Tempo shift is a clue, not chaos."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['slide_step','tempo'],
  true
),

-- ── 14. Second-Ear Hitting ────────────────────────────────────
(
  gen_random_uuid(),
  'sr_second_ear_hitting',
  'opponent-intel',
  'dugout_intel',
  'Second-Ear Hitting',
  'Own your plan, then use the clue.',
  'competitor',
  135,
  25,
  14,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Second-Ear Hitting",
      "content": "Midgame, dugout relaying a location clue."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "How should he use the dugout?",
        "situation": "Midgame, dugout relaying a location clue.",
        "cue_description": "Second-ear focus.",
        "image_uri": "snapshot-hitter-14",
        "diagram_mode": "batter_stance",
        "cues": [
          {"id": "own_plan_confirm_intel", "label": "Keep your plan and confirm clear intel", "description": "Keep your plan and confirm clear intel", "quality": "correct"},
          {"id": "use_only_verified",      "label": "Use only verified clues",                "description": "Use only verified clues",                "quality": "acceptable"},
          {"id": "only_listen_dugout",     "label": "Only listen to dugout",                  "description": "Only listen to dugout",                  "quality": "poor"},
          {"id": "guess_late_clue",        "label": "Guess because clue came late",           "description": "Guess because clue came late",           "quality": "poor"}
        ],
        "question": "What is the right balance?",
        "image_generation_prompt": "4:5 baseball illustration, hitter in box with dugout intel active, catcher target slightly inside, premium cinematic but clean, no logos."
      },
      "responses": {
        "correct_id": "own_plan_confirm_intel",
        "acceptable_ids": ["use_only_verified"]
      },
      "feedback": {
        "correct":    "The hitter owns the swing decision. Dugout help works only when the read is clear.",
        "acceptable": "Good read. Tighten it to the main cue: Second-ear focus.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Dugout help works only when the hitter is already grounded. Own your plan, then use the clue."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team'],
  ARRAY['dugout_intel','plan_ownership'],
  true
),

-- ── 15. Late-Inning Box Presence ──────────────────────────────
(
  gen_random_uuid(),
  'sr_late_inning_box_presence',
  'pressure-resilience',
  'clutch_body_language',
  'Late-Inning Box Presence',
  'Calm body helps on-time swing.',
  'performer',
  135,
  25,
  15,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Late-Inning Box Presence",
      "content": "9th inning, tie game, runner in scoring position."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What says he is ready?",
        "situation": "9th inning, tie game, runner in scoring position.",
        "cue_description": "Clutch composure in the box.",
        "image_uri": "snapshot-hitter-15",
        "diagram_mode": "batter_stance",
        "cues": [
          {"id": "loose_stillness",   "label": "Loose stillness with eyes quiet",       "description": "Loose stillness with eyes quiet",       "quality": "correct"},
          {"id": "controlled_breath", "label": "Controlled breath and steady posture",  "description": "Controlled breath and steady posture",  "quality": "acceptable"},
          {"id": "jaw_clenched",      "label": "Jaw clenched",                          "description": "Jaw clenched",                          "quality": "poor"},
          {"id": "death_grip",        "label": "Bat death-gripped",                     "description": "Bat death-gripped",                     "quality": "poor"}
        ],
        "question": "Which clue says he is ready?",
        "image_generation_prompt": "4:5 realistic late-inning baseball freeze frame, hitter in clutch moment with calm body language, premium dark stadium, no identifiers."
      },
      "responses": {
        "correct_id": "loose_stillness",
        "acceptable_ids": ["controlled_breath"]
      },
      "feedback": {
        "correct":    "Controlled calm is readiness. Tension leaks timing before the pitch.",
        "acceptable": "Good read. Tighten it to the main cue: Clutch composure in the box.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Tension makes the bat slower before the pitch ever starts. Calm body helps on-time swing."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['composure','late_inning'],
  true
),

-- ── 16. Set Height Consistency Check ─────────────────────────
(
  gen_random_uuid(),
  'sr_set_height_consistency_check',
  'pitcher-path',
  'self_scout',
  'Set Height Consistency Check',
  'Same look every pitch.',
  'builder',
  105,
  25,
  16,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Set Height Consistency Check",
      "content": "1st inning, 0-0, bases empty; pitcher from the stretch."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What could hitters notice?",
        "situation": "1st inning, 0-0, bases empty; pitcher from the stretch.",
        "cue_description": "Set-height tell.",
        "image_uri": "snapshot-pitcher-16",
        "diagram_mode": "pitcher_delivery",
        "cues": [
          {"id": "set_height_tell",      "label": "He may be tipping by set height",         "description": "He may be tipping by set height",         "quality": "correct"},
          {"id": "repeatability_issue",  "label": "Repeatability issue before delivery",      "description": "Repeatability issue before delivery",      "quality": "acceptable"},
          {"id": "dirty_rubber",         "label": "Rubber is dirty",                          "description": "Rubber is dirty",                          "quality": "poor"},
          {"id": "crooked_cap",          "label": "Cap is crooked",                           "description": "Cap is crooked",                           "quality": "poor"}
        ],
        "question": "What is the issue?",
        "image_generation_prompt": "4:5 baseball analysis graphic, same pitcher shown twice from stretch at slightly different set heights, dark premium coaching style."
      },
      "responses": {
        "correct_id": "set_height_tell",
        "acceptable_ids": ["repeatability_issue"]
      },
      "feedback": {
        "correct":    "If body position changes by pitch, good dugouts can notice.",
        "acceptable": "Good read. Tighten it to the main cue: Set-height tell.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "If your body changes by pitch, good dugouts notice. Same look every pitch."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['pitcher','catcher','team'],
  ARRAY['pitch_tipping','set_position'],
  true
),

-- ── 17. Front Shoulder Flying Open ───────────────────────────
(
  gen_random_uuid(),
  'sr_front_shoulder_flying_open',
  'pitcher-path',
  'mechanics_command',
  'Front Shoulder Flying Open',
  'Closed longer, directed longer.',
  'builder',
  105,
  25,
  17,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Front Shoulder Flying Open",
      "content": "Bullpen or game frame at foot strike."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What is causing the miss?",
        "situation": "Bullpen or game frame at foot strike.",
        "cue_description": "Front side leak.",
        "image_uri": "snapshot-pitcher-17",
        "diagram_mode": "pitcher_delivery",
        "cues": [
          {"id": "front_side_open",    "label": "Front side is opening early",      "description": "Front side is opening early",      "quality": "correct"},
          {"id": "shoulder_leak",      "label": "Shoulder is leaking off line",     "description": "Shoulder is leaking off line",     "quality": "acceptable"},
          {"id": "auto_velo_up",       "label": "Velocity is automatically up",     "description": "Velocity is automatically up",     "quality": "poor"},
          {"id": "catcher_wrong_pitch","label": "Catcher called wrong pitch",       "description": "Catcher called wrong pitch",       "quality": "poor"}
        ],
        "question": "What is most likely happening?",
        "image_generation_prompt": "4:5 baseball mechanics diagram, pitcher at foot strike with front shoulder opening early, target line and miss path shown, dark premium interface."
      },
      "responses": {
        "correct_id": "front_side_open",
        "acceptable_ids": ["shoulder_leak"]
      },
      "feedback": {
        "correct":    "Early leak usually drags location and shape. The other conclusions do not follow.",
        "acceptable": "Good read. Tighten it to the main cue: Front side leak.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Open early and you give the ball away before release. Closed longer, directed longer."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['pitcher','all'],
  ARRAY['front_side','command'],
  true
),

-- ── 18. Stride Direction Off Line ────────────────────────────
(
  gen_random_uuid(),
  'sr_stride_direction_off_line',
  'pitcher-path',
  'mechanics_command',
  'Stride Direction Off Line',
  'Direction drives repeatability.',
  'builder',
  105,
  25,
  18,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Stride Direction Off Line",
      "content": "2nd inning, 1-0, bases empty."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What matters here?",
        "situation": "2nd inning, 1-0, bases empty.",
        "cue_description": "Stride direction.",
        "image_uri": "snapshot-pitcher-18",
        "diagram_mode": "pitcher_delivery",
        "cues": [
          {"id": "stride_line_missed", "label": "Stride direction missed target line", "description": "Stride direction missed target line", "quality": "correct"},
          {"id": "line_to_target",     "label": "Line to target broke down",           "description": "Line to target broke down",           "quality": "acceptable"},
          {"id": "cleat_model",        "label": "Cleat model",                         "description": "Cleat model",                         "quality": "poor"},
          {"id": "mound_stain",        "label": "Mound slope stain",                   "description": "Mound slope stain",                   "quality": "poor"}
        ],
        "question": "What cue matters most?",
        "image_generation_prompt": "4:5 pitching mechanics diagram, stride line crossing body, target line toward plate, premium baseball coaching graphic."
      },
      "responses": {
        "correct_id": "stride_line_missed",
        "acceptable_ids": ["line_to_target"]
      },
      "feedback": {
        "correct":    "Line to target matters. Surface details do not.",
        "acceptable": "Good read. Tighten it to the main cue: Stride direction.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Bad line, bad finish, bad command. Direction drives repeatability."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['pitcher','all'],
  ARRAY['stride_direction','command'],
  true
),

-- ── 19. Low-Zone Command Target ───────────────────────────────
(
  gen_random_uuid(),
  'sr_low_zone_command_target',
  'pitcher-path',
  'command',
  'Low-Zone Command Target',
  'Live low when you choose low.',
  'rookie',
  105,
  25,
  19,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Low-Zone Command Target",
      "content": "5th inning, 0-2, runner on second, 2 outs."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What is the plan?",
        "situation": "5th inning, 0-2, runner on second, 2 outs.",
        "cue_description": "Low-zone intent.",
        "image_uri": "snapshot-pitcher-19",
        "diagram_mode": "pitcher_delivery",
        "cues": [
          {"id": "finish_low_lane",    "label": "Finish through the low lane", "description": "Finish through the low lane", "quality": "correct"},
          {"id": "commit_below_belt",  "label": "Commit below the belt",       "description": "Commit below the belt",       "quality": "acceptable"},
          {"id": "throw_harder",       "label": "Try to throw harder",         "description": "Try to throw harder",         "quality": "poor"},
          {"id": "nibble_above_zone",  "label": "Nibble above zone",           "description": "Nibble above zone",           "quality": "poor"}
        ],
        "question": "What is the best execution idea?",
        "image_generation_prompt": "Custom 4:5 baseball scene, catcher low target below knees, pitcher attacking the low lane, dark premium app art."
      },
      "responses": {
        "correct_id": "finish_low_lane",
        "acceptable_ids": ["commit_below_belt"]
      },
      "feedback": {
        "correct":    "Commit to the lane. Overthrowing usually lifts the ball.",
        "acceptable": "Good read. Tighten it to the main cue: Low-zone intent.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Better teams hate freeballs above the belt. Live low when you choose low."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['pitcher','catcher'],
  ARRAY['low_zone','execution'],
  true
),

-- ── 20. Runner-Control Look to First ─────────────────────────
(
  gen_random_uuid(),
  'sr_runner_control_look_first',
  'pitcher-path',
  'running_game',
  'Runner-Control Look to First',
  'Read rhythm, not costume.',
  'competitor',
  135,
  25,
  20,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Runner-Control Look to First",
      "content": "4th inning, 1-1, runner on first."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What should the runner notice?",
        "situation": "4th inning, 1-1, runner on first.",
        "cue_description": "Move rhythm.",
        "image_uri": "snapshot-pitcher-20",
        "diagram_mode": "pitcher_delivery",
        "cues": [
          {"id": "head_shoulder_rhythm", "label": "Head and shoulder rhythm before move", "description": "Head and shoulder rhythm before move", "quality": "correct"},
          {"id": "upper_body_rhythm",    "label": "Upper-body rhythm",                    "description": "Upper-body rhythm",                    "quality": "acceptable"},
          {"id": "sock_color",           "label": "Pitcher sock",                         "description": "Pitcher sock",                         "quality": "poor"},
          {"id": "dirt_color",           "label": "Dirt color",                           "description": "Dirt color",                           "quality": "poor"}
        ],
        "question": "What should the runner be reading?",
        "image_generation_prompt": "4:5 realistic pitcher from stretch with runner on first, subtle look and hold, premium baseball freeze frame, no logos."
      },
      "responses": {
        "correct_id": "head_shoulder_rhythm",
        "acceptable_ids": ["upper_body_rhythm"]
      },
      "feedback": {
        "correct":    "Movement clues start in the upper body. Costume details are dead.",
        "acceptable": "Good read. Tighten it to the main cue: Move rhythm.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Controlling the runner starts before the move, and stealing starts before the jump. Read rhythm, not costume."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['pitcher','baserunner','team'],
  ARRAY['runner_control','rhythm_read'],
  true
),

-- ── 21. Hold Pattern from the Set ────────────────────────────
(
  gen_random_uuid(),
  'sr_hold_pattern_from_set',
  'baseball-iq',
  'running_game',
  'Hold Pattern from the Set',
  'Predictable holds are stolen too.',
  'builder',
  105,
  25,
  21,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Hold Pattern from the Set",
      "content": "Late inning, runner on first, pitcher varying hold times."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "Why vary holds?",
        "situation": "Late inning, runner on first, pitcher varying hold times.",
        "cue_description": "Hold variance.",
        "image_uri": "snapshot-pitcher-21",
        "diagram_mode": "pitcher_delivery",
        "cues": [
          {"id": "disrupt_runner_timing",  "label": "Varied holds disrupt runner timing", "description": "Varied holds disrupt runner timing", "quality": "correct"},
          {"id": "break_rhythm",           "label": "Breaks the runner rhythm",           "description": "Breaks the runner rhythm",           "quality": "acceptable"},
          {"id": "faster_velocity",        "label": "Makes pitches faster",               "description": "Makes pitches faster",               "quality": "poor"},
          {"id": "catcher_throws_better",  "label": "Catcher throws better",              "description": "Catcher throws better",              "quality": "poor"}
        ],
        "question": "Why does this matter?",
        "image_generation_prompt": "4:5 baseball timing illustration, pitcher from set with varied hold counts, subtle timing markers, premium dark sports-tech style."
      },
      "responses": {
        "correct_id": "disrupt_runner_timing",
        "acceptable_ids": ["break_rhythm"]
      },
      "feedback": {
        "correct":    "Unpredictability attacks the running game. The runner wants rhythm.",
        "acceptable": "Good read. Tighten it to the main cue: Hold variance.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "The runner wants rhythm; the pitcher should break it. Predictable holds are stolen too."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['pitcher','baserunner','team'],
  ARRAY['hold_variance','steal_timing'],
  true
),

-- ── 22. Post-Walk Mound Body Language ────────────────────────
(
  gen_random_uuid(),
  'sr_post_walk_mound_body_language',
  'pressure-resilience',
  'mound_reset',
  'Post-Walk Mound Body Language',
  'Reset fast, attack next hitter.',
  'rookie',
  105,
  25,
  22,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Post-Walk Mound Body Language",
      "content": "7th inning, just issued leadoff walk."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What should he do now?",
        "situation": "7th inning, just issued leadoff walk.",
        "cue_description": "Post-walk reset.",
        "image_uri": "snapshot-pitcher-22",
        "diagram_mode": "pitcher_delivery",
        "cues": [
          {"id": "short_reset_attack", "label": "Short reset, then back on attack", "description": "Short reset, then back on attack", "quality": "correct"},
          {"id": "get_ball_breath",    "label": "Get ball, breathe, eyes to mitt",  "description": "Get ball, breathe, eyes to mitt",  "quality": "acceptable"},
          {"id": "pace_angry",         "label": "Pace around angry",                "description": "Pace around angry",                "quality": "poor"},
          {"id": "stare_umpire",       "label": "Stare at umpire",                  "description": "Stare at umpire",                  "quality": "poor"}
        ],
        "question": "What is the winning body-language response?",
        "image_generation_prompt": "4:5 realistic pitcher after walk, controlled body language and reset, no drama, premium late-game baseball image."
      },
      "responses": {
        "correct_id": "short_reset_attack",
        "acceptable_ids": ["get_ball_breath"]
      },
      "feedback": {
        "correct":    "Short reset protects the inning. Theater helps the offense.",
        "acceptable": "Good read. Tighten it to the main cue: Post-walk reset.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "The walk already happened; do not walk the next hitter emotionally too. Reset fast, attack next hitter."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['pitcher','all'],
  ARRAY['post_walk','body_language'],
  true
),

-- ── 23. Attack Mode After an Error ───────────────────────────
-- ⚠️  pillar_id "team-chaos" has no world entry in career.tsx.
(
  gen_random_uuid(),
  'sr_attack_mode_after_error',
  'team-chaos',
  'after_error',
  'Attack Mode After an Error',
  'Do not donate two mistakes.',
  'builder',
  105,
  25,
  23,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Attack Mode After an Error",
      "content": "6th inning, routine error behind pitcher, next hitter stepping in."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What matters after the error?",
        "situation": "6th inning, routine error behind pitcher, next hitter stepping in.",
        "cue_description": "Zone attack after chaos.",
        "image_uri": "snapshot-pitcher-23",
        "diagram_mode": "pitcher_delivery",
        "cues": [
          {"id": "attack_zone_make_earn", "label": "Attack the zone and make them earn it", "description": "Attack the zone and make them earn it", "quality": "correct"},
          {"id": "strike_one",            "label": "Get back to strike one",                "description": "Get back to strike one",                "quality": "acceptable"},
          {"id": "try_strikeout_only",    "label": "Try for strikeout only",               "description": "Try for strikeout only",               "quality": "poor"},
          {"id": "show_frustration",      "label": "Show frustration to wake team",         "description": "Show frustration to wake team",         "quality": "poor"}
        ],
        "question": "What matters now?",
        "image_generation_prompt": "4:5 baseball freeze frame after defensive error, pitcher staying composed on mound, catcher visible, premium dark stadium art."
      },
      "responses": {
        "correct_id": "attack_zone_make_earn",
        "acceptable_ids": ["strike_one"]
      },
      "feedback": {
        "correct":    "Errors should not create free passes. Hero mode often gets worse.",
        "acceptable": "Good read. Tighten it to the main cue: Zone attack after chaos.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Your defense needs your strike one more than your feelings. Do not donate two mistakes."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['pitcher','team'],
  ARRAY['error_response','zone_attack'],
  true
),

-- ── 24. Slide-Step vs Normal Move ────────────────────────────
(
  gen_random_uuid(),
  'sr_slide_step_vs_normal_move',
  'pitcher-path',
  'running_game',
  'Slide-Step vs Normal Move',
  'Faster to plate, same intent to target.',
  'competitor',
  135,
  25,
  24,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Slide-Step vs Normal Move",
      "content": "Runner on first, 1 out."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What changes here?",
        "situation": "Runner on first, 1 out.",
        "cue_description": "Slide-step tradeoff.",
        "image_uri": "snapshot-pitcher-24",
        "diagram_mode": "pitcher_delivery",
        "cues": [
          {"id": "quicker_plate_command_rhythm", "label": "Quicker plate time can change command rhythm", "description": "Quicker plate time can change command rhythm", "quality": "correct"},
          {"id": "tempo_command_balance",        "label": "Balance tempo and target",                    "description": "Balance tempo and target",                    "quality": "acceptable"},
          {"id": "faster_velocity",              "label": "Faster velocity",                             "description": "Faster velocity",                             "quality": "poor"},
          {"id": "guaranteed_weak_contact",      "label": "Guaranteed weak contact",                     "description": "Guaranteed weak contact",                     "quality": "poor"}
        ],
        "question": "What is the trade-off?",
        "image_generation_prompt": "4:5 coaching comparison graphic, same pitcher normal move vs slide step, clean baseball mechanics presentation."
      },
      "responses": {
        "correct_id": "quicker_plate_command_rhythm",
        "acceptable_ids": ["tempo_command_balance"]
      },
      "feedback": {
        "correct":    "Quicker move can challenge repeatability. The hitter still matters.",
        "acceptable": "Good read. Tighten it to the main cue: Slide-step tradeoff.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Control the running game without forgetting the hitter still matters. Faster to plate, same intent to target."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['pitcher','team'],
  ARRAY['slide_step','command_tradeoff'],
  true
),

-- ── 25. Front-Side Stability at Release ──────────────────────
(
  gen_random_uuid(),
  'sr_front_side_stability_release',
  'pitcher-path',
  'mechanics_command',
  'Front-Side Stability at Release',
  'Stable front side, stable release.',
  'competitor',
  135,
  25,
  25,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Front-Side Stability at Release",
      "content": "Bullpen side view at release."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What does this help?",
        "situation": "Bullpen side view at release.",
        "cue_description": "Front-side block.",
        "image_uri": "snapshot-pitcher-25",
        "diagram_mode": "pitcher_delivery",
        "cues": [
          {"id": "release_consistency", "label": "Release consistency", "description": "Release consistency", "quality": "correct"},
          {"id": "repeatable_finish",   "label": "Repeatable finish",   "description": "Repeatable finish",   "quality": "acceptable"},
          {"id": "cap_fit",             "label": "Cap fit",             "description": "Cap fit",             "quality": "poor"},
          {"id": "pickoff_move",        "label": "Pickoff move",        "description": "Pickoff move",        "quality": "poor"}
        ],
        "question": "What does the stable leg help preserve?",
        "image_generation_prompt": "4:5 pitching release diagram, stable front side compared to collapsing block, premium biomechanics coaching style."
      },
      "responses": {
        "correct_id": "release_consistency",
        "acceptable_ids": ["repeatable_finish"]
      },
      "feedback": {
        "correct":    "Stable front side helps repeatability. It does not solve unrelated details.",
        "acceptable": "Good read. Tighten it to the main cue: Front-side block.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Weak front side leaks energy and clue consistency. Stable front side, stable release."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['pitcher','all'],
  ARRAY['release_consistency','front_side'],
  true
);

COMMIT;
