-- ============================================================
-- CLUTCHR VISUAL LEARNING MVP — SNAPSHOT READ (SR)
-- TEST BATCH: first 5 of 25 snapshot_read lessons
-- pack_id: clutchr_visual_learning_mvp_v1
-- pillar spread: hitter-path, foundation, opponent-intel, pressure-resilience
-- sport_scope: baseball (matches all existing rows)
-- Steps use $$-quoting to safely handle apostrophes (CC's Take).
-- Run CLUTCHR_VISUAL_LEARNING_SR_FULL_BATCH.sql for lessons 6–25.
-- ============================================================

BEGIN;

-- Safe to re-run: clears only sr_ rows before re-inserting.
DELETE FROM public.legacy_lessons_staging
WHERE legacy_lesson_id LIKE 'sr_%';

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

-- ── 1. Release Window vs RHP Foot Strike ─────────────────────
(
  gen_random_uuid(),
  'sr_release_window_rhp_foot_strike',
  'hitter-path',
  'pitch-recognition',
  'Release Window vs RHP Foot Strike',
  'Win the first light cue.',
  'builder',
  105,
  25,
  1,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Release Window vs RHP Foot Strike",
      "content": "1st inning, 0-0, 0 outs, bases empty, tie game; hitter view."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What do you see first?",
        "situation": "1st inning, 0-0, 0 outs, bases empty, tie game; hitter view.",
        "cue_description": "Late release window. The ball first appears from behind the torso.",
        "image_uri": "snapshot-hitter-01",
        "diagram_mode": "release_point",
        "cues": [
          {"id": "first_light",      "label": "Ball first enters view",          "description": "Ball first enters view",          "quality": "correct"},
          {"id": "closed_shoulder",  "label": "Front shoulder stays closed",     "description": "Front shoulder stays closed",     "quality": "acceptable"},
          {"id": "glove_logo",       "label": "Glove logo",                      "description": "Glove logo",                      "quality": "poor"},
          {"id": "cleat_color",      "label": "Cleat color",                     "description": "Cleat color",                     "quality": "poor"}
        ],
        "question": "What matters first here?",
        "image_generation_prompt": "Create a realistic 4:5 baseball freeze frame, right-handed pitcher at foot strike, ball just beginning to appear from behind body, premium dark stadium lighting, no logos, no readable text, hitter-eye perspective."
      },
      "responses": {
        "correct_id": "first_light",
        "acceptable_ids": ["closed_shoulder"]
      },
      "feedback": {
        "correct":    "Timing starts at first light. Shoulder direction helps, but cosmetic details do not matter.",
        "acceptable": "Good read. Tighten it to the main cue: Late release window. The ball first appears from behind the torso.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Hitters steal time by finding the ball early. Win the first light cue."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['release_window','timing','pitch_recognition'],
  true
),

-- ── 2. Lefty Hide-and-Show Release ───────────────────────────
(
  gen_random_uuid(),
  'sr_lefty_hide_show_release',
  'hitter-path',
  'pitch-recognition',
  'Lefty Hide-and-Show Release',
  'Find when the ball clears the body.',
  'competitor',
  135,
  25,
  2,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Lefty Hide-and-Show Release",
      "content": "3rd inning, 1-1, 1 out, runner on second, tie game; hitter view vs LHP."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What makes this tough?",
        "situation": "3rd inning, 1-1, 1 out, runner on second, tie game; hitter view vs LHP.",
        "cue_description": "Late ball reveal vs LHP.",
        "image_uri": "snapshot-hitter-02",
        "diagram_mode": "release_point",
        "cues": [
          {"id": "late_lefty_slot", "label": "Ball appears later from lefty slot", "description": "Ball appears later from lefty slot", "quality": "correct"},
          {"id": "high_leg_lift",   "label": "Leg lift affects timing",            "description": "Leg lift affects timing",            "quality": "acceptable"},
          {"id": "loose_jersey",    "label": "Loose jersey",                       "description": "Loose jersey",                       "quality": "poor"},
          {"id": "dark_mound",      "label": "Dark mound",                         "description": "Dark mound",                         "quality": "poor"}
        ],
        "question": "What is toughest about this look?",
        "image_generation_prompt": "4:5 realistic left-handed pitcher freeze frame from hitter view, deceptive cross-body slot, ball hidden late, dark premium baseball art, no logos or faces emphasized."
      },
      "responses": {
        "correct_id": "late_lefty_slot",
        "acceptable_ids": ["high_leg_lift"]
      },
      "feedback": {
        "correct":    "The shortened visual window is the read. The leg lift affects rhythm, but surface details do not matter.",
        "acceptable": "Good read. Tighten it to the main cue: Late ball reveal vs LHP.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Lefties create discomfort by shortening your visual window. Find when the ball clears the body."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['lefty_release','timing'],
  true
),

-- ── 3. On-Deck Tempo Scan ─────────────────────────────────────
(
  gen_random_uuid(),
  'sr_on_deck_tempo_scan',
  'foundation',
  'pre_ab_routine',
  'On-Deck Tempo Scan',
  'On deck is scouting time.',
  'rookie',
  105,
  25,
  3,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "On-Deck Tempo Scan",
      "content": "Pre-inning, no count; on-deck perspective."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What should he be scanning?",
        "situation": "Pre-inning, no count; on-deck perspective.",
        "cue_description": "Tempo study before the at-bat.",
        "image_uri": "snapshot-hitter-03",
        "diagram_mode": "batter_stance",
        "cues": [
          {"id": "tempo_release", "label": "Tempo and release timing",  "description": "Tempo and release timing",  "quality": "correct"},
          {"id": "set_rhythm",    "label": "Set and leg-lift rhythm",   "description": "Set and leg-lift rhythm",   "quality": "acceptable"},
          {"id": "bat_waggle",    "label": "Bat waggle",                "description": "Bat waggle",                "quality": "poor"},
          {"id": "crowd_noise",   "label": "Crowd noise",               "description": "Crowd noise",               "quality": "poor"}
        ],
        "question": "What should the on-deck hitter be studying?",
        "image_generation_prompt": "Custom 4:5 premium baseball illustration, on-deck hitter tracking pitcher from circle, faint tempo arrows and release line, dark graphite palette with green cue accents."
      },
      "responses": {
        "correct_id": "tempo_release",
        "acceptable_ids": ["set_rhythm"]
      },
      "feedback": {
        "correct":    "On deck is live timing study. Swing feel matters, but pitcher rhythm is the job.",
        "acceptable": "Good read. Tighten it to the main cue: Tempo study before the at-bat.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "The at-bat starts before you step in. On deck is scouting time."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['on_deck','tempo','routine'],
  true
),

-- ── 4. On-Deck Catcher Target Scan ───────────────────────────
(
  gen_random_uuid(),
  'sr_on_deck_catcher_target_scan',
  'opponent-intel',
  'hitter_intel',
  'On-Deck Catcher Target Scan',
  'On-deck eyes should collect patterns.',
  'builder',
  105,
  25,
  4,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "On-Deck Catcher Target Scan",
      "content": "6th inning, pitcher cruising, bases empty; hitter on deck."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "What matters before his at-bat?",
        "situation": "6th inning, pitcher cruising, bases empty; hitter on deck.",
        "cue_description": "Target pattern from the catcher.",
        "image_uri": "snapshot-hitter-04",
        "diagram_mode": "batter_stance",
        "cues": [
          {"id": "target_pattern",   "label": "Watch if they keep living low-away", "description": "Watch if they keep living low-away", "quality": "correct"},
          {"id": "pitcher_repeats",  "label": "Track repeated location intent",     "description": "Track repeated location intent",     "quality": "acceptable"},
          {"id": "practice_full_swing", "label": "Practice full swing",             "description": "Practice full swing",             "quality": "poor"},
          {"id": "check_scoreboard", "label": "Check scoreboard",                   "description": "Check scoreboard",                   "quality": "poor"}
        ],
        "question": "What is the best read here?",
        "image_generation_prompt": "4:5 baseball illustration from on-deck circle, catcher target clearly low-away, pitcher preparing, subtle green focus guides, no logos."
      },
      "responses": {
        "correct_id": "target_pattern",
        "acceptable_ids": ["pitcher_repeats"]
      },
      "feedback": {
        "correct":    "Repeated target location can shape the next at-bat. Random attention does not.",
        "acceptable": "Good read. Tighten it to the main cue: Target pattern from the catcher.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Good hitters arrive with location clues already in hand. On-deck eyes should collect patterns."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team'],
  ARRAY['catcher_target','pattern_scan'],
  true
),

-- ── 5. Damage-Zone Middle-In Heater ──────────────────────────
(
  gen_random_uuid(),
  'sr_damage_zone_middle_in_heater',
  'hitter-path',
  'swing_take',
  'Damage-Zone Middle-In Heater',
  'Hunt one lane, not every pitch.',
  'builder',
  105,
  25,
  5,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Damage-Zone Middle-In Heater",
      "content": "2nd inning, 2-0, 0 outs, bases empty, tie game; hitter loaded."
    },
    {
      "type": "decision",
      "ui_variant": "snapshot_read",
      "data": {
        "prompt": "Is this your pitch?",
        "situation": "2nd inning, 2-0, 0 outs, bases empty, tie game; hitter loaded.",
        "cue_description": "Middle-in damage lane in a leverage count.",
        "image_uri": "snapshot-hitter-05",
        "diagram_mode": "batter_stance",
        "cues": [
          {"id": "unload_hunted_lane",  "label": "Unload on the hunted lane",         "description": "Unload on the hunted lane",         "quality": "correct"},
          {"id": "attack_middle_in",    "label": "Attack middle-in with conviction",   "description": "Attack middle-in with conviction",   "quality": "acceptable"},
          {"id": "protect_outer_edge",  "label": "Protect outer edge",                "description": "Protect outer edge",                "quality": "poor"},
          {"id": "take_automatically",  "label": "Take automatically",                "description": "Take automatically",                "quality": "poor"}
        ],
        "question": "What should this hitter be ready to do?",
        "image_generation_prompt": "Recreated non-identifying baseball freeze frame, hitter ready on 2-0 count, pitch entering middle-in power lane, faint strike-zone box, premium app art."
      },
      "responses": {
        "correct_id": "unload_hunted_lane",
        "acceptable_ids": ["attack_middle_in"]
      },
      "feedback": {
        "correct":    "This is the count and lane he wanted. Protect mode and auto-take ignore leverage.",
        "acceptable": "Good read. Tighten it to the main cue: Middle-in damage lane in a leverage count.",
        "wrong":      "That is noise. Recheck the baseball cue in the frame."
      }
    },
    {
      "type": "feedback",
      "title": "CC's Take",
      "content": "Damage comes from count plus lane, not swinging hard at everything. Hunt one lane, not every pitch."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['damage_zone','count_leverage'],
  true
);

COMMIT;
