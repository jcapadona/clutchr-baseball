-- ============================================================
-- CLUTCHR VISUAL LEARNING MVP — FILM ROOM (FR)
-- FULL BATCH: all 25 film_room lessons
-- pack_id: clutchr_visual_learning_mvp_v1
-- Safe to re-run: clears all fr_ rows before re-inserting.
-- xp_reward: 30 (all rows). Feedback step title: "Takeaway".
-- ⚠️  fr_rays_2020_ws_game4, fr_lsu_final_out_2023, and
--     fr_harper_2022_nlcs use pillar_id "team-chaos" which has
--     no matching world in career.tsx — those lessons will not
--     appear in Career until a "team-chaos" world is added.
-- ============================================================

BEGIN;

DELETE FROM public.legacy_lessons_staging
WHERE legacy_lesson_id LIKE 'fr_%';

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

-- ── 1. Pain Does Not Change the Plan ─────────────────────────
(
  gen_random_uuid(),
  'fr_gibson_1988_ws',
  'pressure-resilience',
  'postseason_pressure',
  'Film Room: Pain Does Not Change the Plan',
  'Big moments still want your normal move.',
  'competitor',
  129,
  30,
  1,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Pain Does Not Change the Plan",
      "content": "World Series Game 1 - Dodgers vs Athletics (1988). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/must-c-gibson-s-1988-ws-homer-c1864676883",
        "fallback_url": "https://www.mlb.com/video/must-c-gibson-s-1988-ws-homer-c1864676883",
        "backup_urls": ["https://www.mlb.com/video/must-c-gibson-s-1988-ws-homer-c1864676883"],
        "start_sec": 0,
        "end_sec": 69,
        "reliability_rating": "A",
        "event": "World Series Game 1 - Dodgers vs Athletics",
        "year": 1988,
        "athletes": "Kirk Gibson",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "Why does this at-bat still look mechanically quiet under max pressure?",
        "choices": [
          {"id": "best_read", "label": "He hunted a pitch he could handle and did not let pain or crowd volume speed him up.", "quality": "correct"},
          {"id": "wrong_1",   "label": "He sold out because the moment was huge.",                                            "quality": "poor"},
          {"id": "wrong_2",   "label": "Big moments need a harder swing.",                                                    "quality": "poor"}
        ],
        "coach_breakdown": "Pressure did not create the swing. It exposed a prepared swing.",
        "takeaway": "Big moments still want your normal move."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Pressure did not create the swing. It exposed a prepared swing.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Big moments still want your normal move."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['pressure','selective_aggression','body_language'],
  true
),

-- ── 2. One Swing Ends It ──────────────────────────────────────
(
  gen_random_uuid(),
  'fr_joe_carter_1993_ws',
  'pressure-resilience',
  'postseason_pressure',
  'Film Room: One Swing Ends It',
  'The cleanest swing often wins the loudest moment.',
  'competitor',
  140,
  30,
  2,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: One Swing Ends It",
      "content": "World Series Game 6 - Blue Jays vs Phillies (1993). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/must-c-classic-touch-em-all-joe-c1865124483",
        "fallback_url": "https://www.mlb.com/video/must-c-classic-touch-em-all-joe-c1865124483",
        "backup_urls": ["https://www.mlb.com/video/must-c-classic-touch-em-all-joe-c1865124483"],
        "start_sec": 0,
        "end_sec": 80,
        "reliability_rating": "A",
        "event": "World Series Game 6 - Blue Jays vs Phillies",
        "year": 1993,
        "athletes": "Joe Carter",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What separates a closer swing from a hero swing here?",
        "choices": [
          {"id": "best_read", "label": "Controlled damage intent on a pitch he could drive.", "quality": "correct"},
          {"id": "wrong_1",   "label": "He guessed.",                                         "quality": "poor"},
          {"id": "wrong_2",   "label": "He blacked out and just swung.",                      "quality": "poor"}
        ],
        "coach_breakdown": "Season-ending moments reward hitters who can keep the barrel in the zone when the crowd wants chaos.",
        "takeaway": "The cleanest swing often wins the loudest moment."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Season-ending moments reward hitters who can keep the barrel in the zone when the crowd wants chaos.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "The cleanest swing often wins the loudest moment."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['damage_intent','finish'],
  true
),

-- ── 3. Reset in Inning 11 ─────────────────────────────────────
(
  gen_random_uuid(),
  'fr_puckett_1991_ws',
  'pressure-resilience',
  'late_inning',
  'Film Room: Reset in Inning 11',
  'Late inning pressure punishes players who stop resetting.',
  'competitor',
  360,
  30,
  3,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Reset in Inning 11",
      "content": "World Series Game 6 - Twins vs Braves (1991). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/twins/video/puckett-s-game-6-walk-off-homer",
        "fallback_url": "https://www.mlb.com/twins/video/puckett-s-game-6-walk-off-homer",
        "backup_urls": ["https://www.mlb.com/twins/video/puckett-s-game-6-walk-off-homer"],
        "start_sec": 0,
        "end_sec": 306,
        "reliability_rating": "A",
        "event": "World Series Game 6 - Twins vs Braves",
        "year": 1991,
        "athletes": "Kirby Puckett",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What is the pressure lesson in an 11th-inning swing?",
        "choices": [
          {"id": "best_read", "label": "Routines have to travel across game length.",  "quality": "correct"},
          {"id": "wrong_1",   "label": "Late innings require a different swing.",       "quality": "poor"},
          {"id": "wrong_2",   "label": "Fatigue makes mechanics irrelevant.",           "quality": "poor"}
        ],
        "coach_breakdown": "If your pre-pitch process dies late, your swing usually dies next.",
        "takeaway": "Late inning pressure punishes players who stop resetting."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "If your pre-pitch process dies late, your swing usually dies next.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Late inning pressure punishes players who stop resetting."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['late_inning','routine'],
  true
),

-- ── 4. Quiet Before the Dogpile ──────────────────────────────
(
  gen_random_uuid(),
  'fr_jeter_mr_november',
  'pressure-resilience',
  'postseason_pressure',
  'Film Room: Quiet Before the Dogpile',
  'If the setup looks normal, the result can be special.',
  'competitor',
  126,
  30,
  4,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Quiet Before the Dogpile",
      "content": "World Series Game 4 - Yankees vs Diamondbacks (2001). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/yankees/video/must-c-jeter-as-mr-november-c1865136583",
        "fallback_url": "https://www.mlb.com/yankees/video/must-c-jeter-as-mr-november-c1865136583",
        "backup_urls": ["https://www.mlb.com/yankees/video/must-c-jeter-as-mr-november-c1865136583"],
        "start_sec": 0,
        "end_sec": 66,
        "reliability_rating": "A",
        "event": "World Series Game 4 - Yankees vs Diamondbacks",
        "year": 2001,
        "athletes": "Derek Jeter",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What part of Jeter body language tells you he is still in process, not story mode?",
        "choices": [
          {"id": "best_read", "label": "The at-bat still looks repeatable.", "quality": "correct"},
          {"id": "wrong_1",   "label": "Clutch means emotionally amped.",    "quality": "poor"},
          {"id": "wrong_2",   "label": "The moment made him bigger.",         "quality": "poor"}
        ],
        "coach_breakdown": "Elite pressure hitters look boring until the ball leaves.",
        "takeaway": "If the setup looks normal, the result can be special."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Elite pressure hitters look boring until the ball leaves.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "If the setup looks normal, the result can be special."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['poise','body_language'],
  true
),

-- ── 5. The Swing Was Smaller Than the Moment ─────────────────
(
  gen_random_uuid(),
  'fr_gonzalez_2001_ws_game7',
  'pressure-resilience',
  'situational_hitting',
  'Film Room: The Swing Was Smaller Than the Moment',
  'Clutch is often contact with purpose.',
  'competitor',
  162,
  30,
  5,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: The Swing Was Smaller Than the Moment",
      "content": "World Series Game 7 - Diamondbacks vs Yankees (2001). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/dbacks/video/relive-game-7-of-2001-ws",
        "fallback_url": "https://www.mlb.com/dbacks/video/relive-game-7-of-2001-ws",
        "backup_urls": ["https://www.mlb.com/dbacks/video/relive-game-7-of-2001-ws"],
        "start_sec": 230,
        "end_sec": 332,
        "reliability_rating": "A",
        "event": "World Series Game 7 - Diamondbacks vs Yankees",
        "year": 2001,
        "athletes": "Luis Gonzalez",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "Why is this a great pressure at-bat even though it is not a monster swing?",
        "choices": [
          {"id": "best_read", "label": "Situation awareness beat ego.",                    "quality": "correct"},
          {"id": "wrong_1",   "label": "You need lift there.",                             "quality": "poor"},
          {"id": "wrong_2",   "label": "Small result means small pressure skill.",         "quality": "poor"}
        ],
        "coach_breakdown": "Sometimes the killer move is simply refusing to miss the ball.",
        "takeaway": "Clutch is often contact with purpose."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Sometimes the killer move is simply refusing to miss the ball.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Clutch is often contact with purpose."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['contact_with_purpose','situation_awareness'],
  true
),

-- ── 6. Be the Same Guy Again ──────────────────────────────────
(
  gen_random_uuid(),
  'fr_freese_2011_ws_game6',
  'pressure-resilience',
  'resilience_chain',
  'Film Room: Be the Same Guy Again',
  'You have to re-earn the next clutch at-bat.',
  'competitor',
  260,
  30,
  6,
  false,
  true,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Be the Same Guy Again",
      "content": "World Series Game 6 - Cardinals vs Rangers (2011). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/freese-s-walk-off-homer-c19955637",
        "fallback_url": "https://www.mlb.com/video/freese-s-walk-off-homer-c19955637",
        "backup_urls": ["https://www.mlb.com/video/freese-s-walk-off-homer-c19955637"],
        "start_sec": 0,
        "end_sec": 200,
        "reliability_rating": "A",
        "event": "World Series Game 6 - Cardinals vs Rangers",
        "year": 2011,
        "athletes": "David Freese",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What mental skill matters most when you become the same guy twice in one game?",
        "choices": [
          {"id": "best_read", "label": "Emotional reset after the first miracle.", "quality": "correct"},
          {"id": "wrong_1",   "label": "Momentum makes the next at-bat easy.",    "quality": "poor"},
          {"id": "wrong_2",   "label": "Adrenaline carries the rest.",             "quality": "poor"}
        ],
        "coach_breakdown": "The hard part is becoming new pitch-to-pitch again after chaos.",
        "takeaway": "You have to re-earn the next clutch at-bat."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "The hard part is becoming new pitch-to-pitch again after chaos.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "You have to re-earn the next clutch at-bat."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['reset','pressure_chain'],
  true
),

-- ── 7. Stay Alive Long Enough ─────────────────────────────────
(
  gen_random_uuid(),
  'fr_rajai_davis_2016_ws',
  'pressure-resilience',
  'stay_alive',
  'Film Room: Stay Alive Long Enough',
  'Your role label cannot shrink your swing decision.',
  'competitor',
  180,
  30,
  7,
  false,
  true,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Stay Alive Long Enough",
      "content": "World Series Game 7 - Cubs vs Cleveland (2016). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/news/rajai-davis-ties-game-7-with-a-home-run-c207953376",
        "fallback_url": "https://www.mlb.com/news/rajai-davis-ties-game-7-with-a-home-run-c207953376",
        "backup_urls": ["https://www.mlb.com/news/rajai-davis-ties-game-7-with-a-home-run-c207953376"],
        "start_sec": 0,
        "end_sec": 120,
        "reliability_rating": "A/B",
        "event": "World Series Game 7 - Cubs vs Cleveland",
        "year": 2016,
        "athletes": "Rajai Davis vs Aroldis Chapman",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "Why is this more than just a surprising homer?",
        "choices": [
          {"id": "best_read", "label": "He kept the at-bat alive long enough for one real mistake to matter.", "quality": "correct"},
          {"id": "wrong_1",   "label": "He ran into one.",                                                     "quality": "poor"},
          {"id": "wrong_2",   "label": "Speed guys cannot do damage there.",                                   "quality": "poor"}
        ],
        "coach_breakdown": "The pressure lesson is belief plus barrel readiness, not profile stereotypes.",
        "takeaway": "Your role label cannot shrink your swing decision."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "The pressure lesson is belief plus barrel readiness, not profile stereotypes.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Your role label cannot shrink your swing decision."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['velocity','stay_alive'],
  true
),

-- ── 8. Veteran Barrel, Veteran Nerve ─────────────────────────
(
  gen_random_uuid(),
  'fr_howie_kendrick_2019_ws',
  'hitter-path',
  'oppo_barrel',
  'Film Room: Veteran Barrel, Veteran Nerve',
  'Under pressure, trust your best path.',
  'competitor',
  137,
  30,
  8,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Veteran Barrel, Veteran Nerve",
      "content": "World Series Game 7 - Nationals vs Astros (2019). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/kendrick-s-stunning-go-ahead-hr",
        "fallback_url": "https://www.mlb.com/video/kendrick-s-stunning-go-ahead-hr",
        "backup_urls": ["https://www.mlb.com/video/kendrick-s-stunning-go-ahead-hr"],
        "start_sec": 0,
        "end_sec": 77,
        "reliability_rating": "A",
        "event": "World Series Game 7 - Nationals vs Astros",
        "year": 2019,
        "athletes": "Howie Kendrick",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What did Kendrick do right that a hype swing would have ruined?",
        "choices": [
          {"id": "best_read", "label": "He let the ball travel and stayed through his lane.", "quality": "correct"},
          {"id": "wrong_1",   "label": "Big spot means pull-side violence.",                  "quality": "poor"},
          {"id": "wrong_2",   "label": "Clutch means selling out for lift.",                  "quality": "poor"}
        ],
        "coach_breakdown": "Older hitters survive October because they trust path and timing under noise.",
        "takeaway": "Under pressure, trust your best path."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Older hitters survive October because they trust path and timing under noise.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Under pressure, trust your best path."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['opposite_field','veteran_calm'],
  true
),

-- ── 9. Stay in the Clip ───────────────────────────────────────
-- ⚠️  pillar_id "team-chaos" has no world entry in career.tsx.
(
  gen_random_uuid(),
  'fr_rays_2020_ws_game4',
  'team-chaos',
  'chaos_finish',
  'Film Room: Stay in the Clip',
  'Finish the play after the weird part.',
  'competitor',
  211,
  30,
  9,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Stay in the Clip",
      "content": "World Series Game 4 - Dodgers vs Rays (2020). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/rays-crazy-game-4-walk-off",
        "fallback_url": "https://www.mlb.com/video/rays-crazy-game-4-walk-off",
        "backup_urls": ["https://www.mlb.com/video/rays-crazy-game-4-walk-off"],
        "start_sec": 0,
        "end_sec": 151,
        "reliability_rating": "A",
        "event": "World Series Game 4 - Dodgers vs Rays",
        "year": 2020,
        "athletes": "Brett Phillips and Randy Arozarena",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "Where did each team composure help or hurt?",
        "choices": [
          {"id": "best_read", "label": "The winning side never stopped the play; the losing side mentally did.", "quality": "correct"},
          {"id": "wrong_1",   "label": "The fall killed the run.",                                               "quality": "poor"},
          {"id": "wrong_2",   "label": "Once the throw goes home the play is over.",                            "quality": "poor"}
        ],
        "coach_breakdown": "Chaos belongs to the team that keeps processing after the first break.",
        "takeaway": "Finish the play after the weird part."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Chaos belongs to the team that keeps processing after the first break.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Finish the play after the weird part."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['team','baserunner','outfielder','all'],
  ARRAY['finish_play','chaos'],
  true
),

-- ── 10. Star Move, Same Move ──────────────────────────────────
(
  gen_random_uuid(),
  'fr_freeman_2024_ws_gs',
  'pressure-resilience',
  'injury_pressure',
  'Film Room: Star Move, Same Move',
  'Pain changes the body, not the plan.',
  'competitor',
  150,
  30,
  10,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Star Move, Same Move",
      "content": "World Series Game 1 - Dodgers vs Yankees (2024). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/dodgers/video/freddie-freeman-hits-a-grand-slam-1-to-right-field-chris-taylor-scores-to",
        "fallback_url": "https://www.mlb.com/dodgers/video/freddie-freeman-hits-a-grand-slam-1-to-right-field-chris-taylor-scores-to",
        "backup_urls": ["https://www.mlb.com/dodgers/video/freddie-freeman-hits-a-grand-slam-1-to-right-field-chris-taylor-scores-to"],
        "start_sec": 0,
        "end_sec": 90,
        "reliability_rating": "A",
        "event": "World Series Game 1 - Dodgers vs Yankees",
        "year": 2024,
        "athletes": "Freddie Freeman",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What made this professional instead of emotional?",
        "choices": [
          {"id": "best_read", "label": "Same swing, same gather, right pitch.",    "quality": "correct"},
          {"id": "wrong_1",   "label": "He overpowered the moment.",               "quality": "poor"},
          {"id": "wrong_2",   "label": "Great players black out and react.",        "quality": "poor"}
        ],
        "coach_breakdown": "Elite hitting in October still starts with count and pitch discipline.",
        "takeaway": "Pain changes the body, not the plan."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Elite hitting in October still starts with count and pitch discipline.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Pain changes the body, not the plan."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['injured_composure','pitch_selection'],
  true
),

-- ── 11. Best on Best ──────────────────────────────────────────
(
  gen_random_uuid(),
  'fr_ohtani_trout_wbc',
  'pressure-resilience',
  'best_on_best',
  'Film Room: Best on Best',
  'The moment gets simple when your plan is clear.',
  'competitor',
  180,
  30,
  11,
  false,
  true,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Best on Best",
      "content": "World Baseball Classic Final - Japan vs USA (2023). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/news/shohei-ohtani-strikes-out-mike-trout-world-baseball-classic",
        "fallback_url": "https://www.mlb.com/news/shohei-ohtani-strikes-out-mike-trout-world-baseball-classic",
        "backup_urls": ["https://www.mlb.com/news/shohei-ohtani-strikes-out-mike-trout-world-baseball-classic"],
        "start_sec": 0,
        "end_sec": 120,
        "reliability_rating": "A/B",
        "event": "World Baseball Classic Final - Japan vs USA",
        "year": 2023,
        "athletes": "Shohei Ohtani vs Mike Trout",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What makes this feel like baseball pressure at its purest?",
        "choices": [
          {"id": "best_read", "label": "No hiding from the best hitter; conviction and execution decide the rep.", "quality": "correct"},
          {"id": "wrong_1",   "label": "The hype made the at-bat.",                                               "quality": "poor"},
          {"id": "wrong_2",   "label": "Talent, not process, decided it.",                                        "quality": "poor"}
        ],
        "coach_breakdown": "This is premium intent versus premium intent.",
        "takeaway": "The moment gets simple when your plan is clear."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "This is premium intent versus premium intent.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "The moment gets simple when your plan is clear."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['pitcher','hitter','team','all'],
  ARRAY['conviction','execution'],
  true
),

-- ── 12. Finish the Last Out ───────────────────────────────────
-- ⚠️  pillar_id "team-chaos" has no world entry in career.tsx.
(
  gen_random_uuid(),
  'fr_lsu_final_out_2023',
  'team-chaos',
  'closeout',
  'Film Room: Finish the Last Out',
  'Win the final basic play before the pile-on.',
  'competitor',
  194,
  30,
  12,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Finish the Last Out",
      "content": "Men College World Series Final - LSU vs Florida (2023). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.ncaa.com/video/baseball/2023-06-26/lsu-baseball-wins-2023-mens-college-world-series-final-out-0",
        "fallback_url": "https://www.ncaa.com/video/baseball/2023-06-26/lsu-baseball-wins-2023-mens-college-world-series-final-out-0",
        "backup_urls": ["https://www.ncaa.com/video/baseball/2023-06-26/lsu-baseball-wins-2023-mens-college-world-series-final-out-0"],
        "start_sec": 0,
        "end_sec": 134,
        "reliability_rating": "A",
        "event": "Men College World Series Final - LSU vs Florida",
        "year": 2023,
        "athletes": "LSU Baseball",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What does a clean closeout look like in college pressure?",
        "choices": [
          {"id": "best_read", "label": "Complete the basic execution before the celebration.", "quality": "correct"},
          {"id": "wrong_1",   "label": "The celebration is the lesson.",                       "quality": "poor"},
          {"id": "wrong_2",   "label": "The last out is automatic when you are up big.",       "quality": "poor"}
        ],
        "coach_breakdown": "Players who respect the last rep tend to own the last rep.",
        "takeaway": "Win the final basic play before the pile-on."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Players who respect the last rep tend to own the last rep.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Win the final basic play before the pile-on."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['team','all'],
  ARRAY['final_out','finish_rep'],
  true
),

-- ── 13. Down 0-2, Still Hunting ───────────────────────────────
(
  gen_random_uuid(),
  'fr_pete_alonso_2024_wc',
  'hitter-path',
  'slump_pressure',
  'Film Room: Down 0-2, Still Hunting',
  'Stay alive long enough to get your pitch.',
  'competitor',
  108,
  30,
  13,
  false,
  true,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Down 0-2, Still Hunting",
      "content": "NL Wild Card Game 3 - Mets vs Brewers (2024). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/pete-alonso-homers-1-on-a-line-drive-to-right-center-field-francisco-lind",
        "fallback_url": "https://www.mlb.com/video/pete-alonso-homers-1-on-a-line-drive-to-right-center-field-francisco-lind",
        "backup_urls": ["https://www.mlb.com/video/pete-alonso-homers-1-on-a-line-drive-to-right-center-field-francisco-lind"],
        "start_sec": 0,
        "end_sec": 48,
        "reliability_rating": "A",
        "event": "NL Wild Card Game 3 - Mets vs Brewers",
        "year": 2024,
        "athletes": "Pete Alonso",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What was the real win before the homer left the yard?",
        "choices": [
          {"id": "best_read", "label": "He stayed alive until the pitch he could attack arrived.", "quality": "correct"},
          {"id": "wrong_1",   "label": "He was just due.",                                         "quality": "poor"},
          {"id": "wrong_2",   "label": "Slumps disappear because the moment is big.",              "quality": "poor"}
        ],
        "coach_breakdown": "Slumps end when approach gets a real chance to cash.",
        "takeaway": "Stay alive long enough to get your pitch."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Slumps end when approach gets a real chance to cash.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Stay alive long enough to get your pitch."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['stay_alive','damage_pitch'],
  true
),

-- ── 14. Inside Alonso Biggest At-Bat ─────────────────────────
(
  gen_random_uuid(),
  'fr_alonso_breakdown',
  'opponent-intel',
  'hitter_intel',
  'Film Room: Inside Alonso Biggest At-Bat',
  'Scouting should simplify, not freeze, the swing.',
  'competitor',
  240,
  30,
  14,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Inside Alonso Biggest At-Bat",
      "content": "NL Wild Card Game 3 breakdown (2024). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/news/pete-alonso-breaks-down-game-winning-home-run-off-devin-williams",
        "fallback_url": "https://www.mlb.com/news/pete-alonso-breaks-down-game-winning-home-run-off-devin-williams",
        "backup_urls": ["https://www.mlb.com/news/pete-alonso-breaks-down-game-winning-home-run-off-devin-williams"],
        "start_sec": 0,
        "end_sec": 180,
        "reliability_rating": "A",
        "event": "NL Wild Card Game 3 breakdown",
        "year": 2024,
        "athletes": "Pete Alonso vs Devin Williams",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What detail turned a huge moment into a readable at-bat?",
        "choices": [
          {"id": "best_read", "label": "Pre-at-bat intel sharpened the decision without creating guess-ball.", "quality": "correct"},
          {"id": "wrong_1",   "label": "He just sat dead red.",                                               "quality": "poor"},
          {"id": "wrong_2",   "label": "Pressure cancels scouting.",                                          "quality": "poor"}
        ],
        "coach_breakdown": "Real hitters use info to narrow the map, not erase it.",
        "takeaway": "Scouting should simplify, not freeze, the swing."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Real hitters use info to narrow the map, not erase it.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Scouting should simplify, not freeze, the swing."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['scouting','pitch_recognition'],
  true
),

-- ── 15. Simple Zone, Massive Result ──────────────────────────
(
  gen_random_uuid(),
  'fr_trea_turner_wbc_gs',
  'hitter-path',
  'bases_loaded',
  'Film Room: Simple Zone, Massive Result',
  'Do not let bases-loaded noise widen your plan.',
  'competitor',
  90,
  30,
  15,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Simple Zone, Massive Result",
      "content": "WBC Quarterfinal - USA vs Venezuela (2023). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/trea-turner-hits-a-grand-slam-2-to-left-field-tim-anderson-scores-bobby-w",
        "fallback_url": "https://www.mlb.com/video/trea-turner-hits-a-grand-slam-2-to-left-field-tim-anderson-scores-bobby-w",
        "backup_urls": ["https://www.mlb.com/video/trea-turner-hits-a-grand-slam-2-to-left-field-tim-anderson-scores-bobby-w"],
        "start_sec": 0,
        "end_sec": 30,
        "reliability_rating": "A",
        "event": "WBC Quarterfinal - USA vs Venezuela",
        "year": 2023,
        "athletes": "Trea Turner",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "Why is this a better approach clip than a highlight clip?",
        "choices": [
          {"id": "best_read", "label": "He kept the zone simple even when the score got loud.", "quality": "correct"},
          {"id": "wrong_1",   "label": "Just react faster.",                                    "quality": "poor"},
          {"id": "wrong_2",   "label": "Big swings are mandatory with bases loaded.",           "quality": "poor"}
        ],
        "coach_breakdown": "The best pressure swings often look like normal leverage on the right pitch.",
        "takeaway": "Do not let bases-loaded noise widen your plan."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "The best pressure swings often look like normal leverage on the right pitch.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Do not let bases-loaded noise widen your plan."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['zone_control','leverage'],
  true
),

-- ── 16. Seven Pitches to the Pennant ─────────────────────────
(
  gen_random_uuid(),
  'fr_soto_2024_alcs_ab',
  'hitter-path',
  'at_bat_management',
  'Film Room: Seven Pitches to the Pennant',
  'Own the at-bat before the highlight.',
  'competitor',
  293,
  30,
  16,
  false,
  true,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Seven Pitches to the Pennant",
      "content": "ALCS Game 5 - Yankees vs Guardians (2024). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/juan-soto-s-game-clinching-at-bat",
        "fallback_url": "https://www.mlb.com/video/juan-soto-s-game-clinching-at-bat",
        "backup_urls": ["https://www.mlb.com/video/juan-soto-s-game-clinching-at-bat"],
        "start_sec": 0,
        "end_sec": 233,
        "reliability_rating": "A",
        "event": "ALCS Game 5 - Yankees vs Guardians",
        "year": 2024,
        "athletes": "Juan Soto",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What was Soto doing better than being clutch?",
        "choices": [
          {"id": "best_read", "label": "He managed the full at-bat, not just the last pitch.", "quality": "correct"},
          {"id": "wrong_1",   "label": "One mistake pitch decided everything.",                 "quality": "poor"},
          {"id": "wrong_2",   "label": "Elite hitters guess right more.",                       "quality": "poor"}
        ],
        "coach_breakdown": "Clutch hitters often win the swing before the final pitch by mastering the sequence.",
        "takeaway": "Own the at-bat before the highlight."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Clutch hitters often win the swing before the final pitch by mastering the sequence.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Own the at-bat before the highlight."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['sequence','approach'],
  true
),

-- ── 17. Soto Internal Read ────────────────────────────────────
(
  gen_random_uuid(),
  'fr_soto_breakdown',
  'opponent-intel',
  'coach_eye',
  'Film Room: Soto Internal Read',
  'Elite hitters remove noise in real time.',
  'competitor',
  187,
  30,
  17,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Soto Internal Read",
      "content": "ALCS Game 5 breakdown (2024). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/juan-soto-breaks-down-his-epic-alcs-game-5-home-run",
        "fallback_url": "https://www.mlb.com/video/juan-soto-breaks-down-his-epic-alcs-game-5-home-run",
        "backup_urls": ["https://www.mlb.com/video/juan-soto-breaks-down-his-epic-alcs-game-5-home-run"],
        "start_sec": 0,
        "end_sec": 127,
        "reliability_rating": "A",
        "event": "ALCS Game 5 breakdown",
        "year": 2024,
        "athletes": "Juan Soto",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What cues was Soto actually using?",
        "choices": [
          {"id": "best_read", "label": "He was narrowing the menu through the at-bat.",        "quality": "correct"},
          {"id": "wrong_1",   "label": "He knew exactly what was coming.",                     "quality": "poor"},
          {"id": "wrong_2",   "label": "Great hitters do not think in the box.",               "quality": "poor"}
        ],
        "coach_breakdown": "Great player explanations reveal what was filtered out, not just what was seen.",
        "takeaway": "Elite hitters remove noise in real time."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Great player explanations reveal what was filtered out, not just what was seen.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Elite hitters remove noise in real time."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['pattern_recall','decision_ownership'],
  true
),

-- ── 18. Two Pitches, Whole Series Tone ───────────────────────
(
  gen_random_uuid(),
  'fr_yordan_alvarez_2022_alds',
  'hitter-path',
  'early_attack',
  'Film Room: Two Pitches, Whole Series Tone',
  'If the pitch is yours early, take it early.',
  'competitor',
  93,
  30,
  18,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Two Pitches, Whole Series Tone",
      "content": "ALDS Game 1 - Astros vs Mariners (2022). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/yordan-alvarez-homers-1-on-a-line-drive-to-right-field-jake-meyers-scores",
        "fallback_url": "https://www.mlb.com/video/yordan-alvarez-homers-1-on-a-line-drive-to-right-field-jake-meyers-scores",
        "backup_urls": ["https://www.mlb.com/video/yordan-alvarez-homers-1-on-a-line-drive-to-right-field-jake-meyers-scores"],
        "start_sec": 0,
        "end_sec": 33,
        "reliability_rating": "A",
        "event": "ALDS Game 1 - Astros vs Mariners",
        "year": 2022,
        "athletes": "Yordan Alvarez",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "Why does this teach count leverage better than pure power?",
        "choices": [
          {"id": "best_read", "label": "He was ready to attack early because the zone picture was clear.", "quality": "correct"},
          {"id": "wrong_1",   "label": "Ambush means reckless.",                                           "quality": "poor"},
          {"id": "wrong_2",   "label": "Power hitters should always wait.",                                "quality": "poor"}
        ],
        "coach_breakdown": "Selective aggression is still aggression.",
        "takeaway": "If the pitch is yours early, take it early."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Selective aggression is still aggression.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "If the pitch is yours early, take it early."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['early_count','selective_aggression'],
  true
),

-- ── 19. What Yordan Knew ──────────────────────────────────────
(
  gen_random_uuid(),
  'fr_yordan_breakdown',
  'opponent-intel',
  'coach_eye',
  'Film Room: What Yordan Knew',
  'Confidence gets stronger when it has specifics.',
  'competitor',
  155,
  30,
  19,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: What Yordan Knew",
      "content": "ALDS Game 1 postgame breakdown (2022). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/astros/video/alvarez-on-walk-off-home-run",
        "fallback_url": "https://www.mlb.com/astros/video/alvarez-on-walk-off-home-run",
        "backup_urls": ["https://www.mlb.com/astros/video/alvarez-on-walk-off-home-run"],
        "start_sec": 0,
        "end_sec": 95,
        "reliability_rating": "A",
        "event": "ALDS Game 1 postgame breakdown",
        "year": 2022,
        "athletes": "Yordan Alvarez",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What kind of confidence shows up here: emotional or informational?",
        "choices": [
          {"id": "best_read", "label": "Informational confidence.",        "quality": "correct"},
          {"id": "wrong_1",   "label": "Swagger is the plan.",            "quality": "poor"},
          {"id": "wrong_2",   "label": "Big hitters ignore detail.",      "quality": "poor"}
        ],
        "coach_breakdown": "The calmer the hitter explanation, the more you usually hear a real plan.",
        "takeaway": "Confidence gets stronger when it has specifics."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "The calmer the hitter explanation, the more you usually hear a real plan.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Confidence gets stronger when it has specifics."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','all'],
  ARRAY['informational_confidence','plan'],
  true
),

-- ── 20. Swing as Leadership ───────────────────────────────────
-- ⚠️  pillar_id "team-chaos" has no world entry in career.tsx.
(
  gen_random_uuid(),
  'fr_harper_2022_nlcs',
  'team-chaos',
  'leadership_rep',
  'Film Room: Swing as Leadership',
  'One great rep can move a whole team state.',
  'competitor',
  98,
  30,
  20,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Swing as Leadership",
      "content": "NLCS Game 5 - Phillies vs Padres (2022). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/phillies/video/iconic-moment-harper-s-clutch-hr",
        "fallback_url": "https://www.mlb.com/phillies/video/iconic-moment-harper-s-clutch-hr",
        "backup_urls": ["https://www.mlb.com/phillies/video/iconic-moment-harper-s-clutch-hr"],
        "start_sec": 0,
        "end_sec": 38,
        "reliability_rating": "A",
        "event": "NLCS Game 5 - Phillies vs Padres",
        "year": 2022,
        "athletes": "Bryce Harper",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What is the leadership piece hidden inside this swing?",
        "choices": [
          {"id": "best_read", "label": "His conviction transfers belief to the entire dugout.", "quality": "correct"},
          {"id": "wrong_1",   "label": "Leadership is what you say after.",                    "quality": "poor"},
          {"id": "wrong_2",   "label": "Emotion alone creates the barrel.",                    "quality": "poor"}
        ],
        "coach_breakdown": "Sometimes leadership is visible in the quality of the rep itself.",
        "takeaway": "One great rep can move a whole team state."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Sometimes leadership is visible in the quality of the rep itself.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "One great rep can move a whole team state."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['leadership','conviction'],
  true
),

-- ── 21. Truck in the Tenth ────────────────────────────────────
(
  gen_random_uuid(),
  'fr_kendrick_2019_nlds',
  'hitter-path',
  'extra_inning_pressure',
  'Film Room: Truck in the Tenth',
  'The barrel path still decides the moment.',
  'competitor',
  210,
  30,
  21,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Truck in the Tenth",
      "content": "NLDS Game 5 - Nationals vs Dodgers (2019). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/news/howie-kendrick-grand-slam-nlds-game-5",
        "fallback_url": "https://www.mlb.com/news/howie-kendrick-grand-slam-nlds-game-5",
        "backup_urls": ["https://www.mlb.com/news/howie-kendrick-grand-slam-nlds-game-5"],
        "start_sec": 0,
        "end_sec": 150,
        "reliability_rating": "A/B",
        "event": "NLDS Game 5 - Nationals vs Dodgers",
        "year": 2019,
        "athletes": "Howie Kendrick",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What was mature about the swing path here?",
        "choices": [
          {"id": "best_read", "label": "Staying through the fastball instead of trying to create magic by hand speed alone.", "quality": "correct"},
          {"id": "wrong_1",   "label": "Extra innings require hero mechanics.",                                               "quality": "poor"},
          {"id": "wrong_2",   "label": "Veterans can coast on feel.",                                                        "quality": "poor"}
        ],
        "coach_breakdown": "Pressure and path are tied together.",
        "takeaway": "The barrel path still decides the moment."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Pressure and path are tied together.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "The barrel path still decides the moment."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['veteran_path','stay_through'],
  true
),

-- ── 22. Walk-Off Ready ────────────────────────────────────────
(
  gen_random_uuid(),
  'fr_ortiz_2004_alds',
  'hitter-path',
  'walkoff_approach',
  'Film Room: Walk-Off Ready',
  'A walk-off is still one well-managed at-bat.',
  'competitor',
  156,
  30,
  22,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Walk-Off Ready",
      "content": "ALDS Clincher - Red Sox vs Angels (2004). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/david-ortiz-ends-alds-with-hr",
        "fallback_url": "https://www.mlb.com/video/david-ortiz-ends-alds-with-hr",
        "backup_urls": ["https://www.mlb.com/video/david-ortiz-ends-alds-with-hr"],
        "start_sec": 0,
        "end_sec": 96,
        "reliability_rating": "A",
        "event": "ALDS Clincher - Red Sox vs Angels",
        "year": 2004,
        "athletes": "David Ortiz",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What hitter behavior says walk-off ready here?",
        "choices": [
          {"id": "best_read", "label": "No expansion, no over-rotation, clear barrel intent.",        "quality": "correct"},
          {"id": "wrong_1",   "label": "Walk-off swings are different swings.",                       "quality": "poor"},
          {"id": "wrong_2",   "label": "Closers beat hitters unless the hitter guesses.",             "quality": "poor"}
        ],
        "coach_breakdown": "The walk-off myth is usually just a disciplined swing with fireworks after it.",
        "takeaway": "A walk-off is still one well-managed at-bat."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "The walk-off myth is usually just a disciplined swing with fireworks after it.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "A walk-off is still one well-managed at-bat."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['walkoff','discipline'],
  true
),

-- ── 23. Stay Available ────────────────────────────────────────
(
  gen_random_uuid(),
  'fr_ortiz_2013_alcs',
  'pressure-resilience',
  'quiet_offense',
  'Film Room: Stay Available',
  'You only need one real pitch if you are still ready for it.',
  'competitor',
  180,
  30,
  23,
  false,
  true,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Stay Available",
      "content": "ALCS Game 2 - Red Sox vs Tigers (2013). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/news/david-ortiz-clutch-grand-slam-2013-alcs",
        "fallback_url": "https://www.mlb.com/news/david-ortiz-clutch-grand-slam-2013-alcs",
        "backup_urls": ["https://www.mlb.com/news/david-ortiz-clutch-grand-slam-2013-alcs"],
        "start_sec": 0,
        "end_sec": 120,
        "reliability_rating": "A/B",
        "event": "ALCS Game 2 - Red Sox vs Tigers",
        "year": 2013,
        "athletes": "David Ortiz",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What matters more here: swing violence or staying available for one mistake?",
        "choices": [
          {"id": "best_read", "label": "Staying available.",                        "quality": "correct"},
          {"id": "wrong_1",   "label": "He muscled the whole game around.",         "quality": "poor"},
          {"id": "wrong_2",   "label": "A cold hitter must force the issue.",       "quality": "poor"}
        ],
        "coach_breakdown": "Quiet series or loud series, the at-bat stays the at-bat.",
        "takeaway": "You only need one real pitch if you are still ready for it."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Quiet series or loud series, the at-bat stays the at-bat.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "You only need one real pitch if you are still ready for it."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['staying_available','team_momentum'],
  true
),

-- ── 24. Swing First, Stare Later ──────────────────────────────
(
  gen_random_uuid(),
  'fr_bautista_bat_flip',
  'pressure-resilience',
  'emotion_control',
  'Film Room: Swing First, Stare Later',
  'Do not copy the celebration before you copy the read.',
  'competitor',
  180,
  30,
  24,
  false,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Swing First, Stare Later",
      "content": "ALDS Game 5 - Blue Jays vs Rangers (2015). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/news/jose-bautista-bat-flip-game",
        "fallback_url": "https://www.mlb.com/news/jose-bautista-bat-flip-game",
        "backup_urls": ["https://www.mlb.com/news/jose-bautista-bat-flip-game"],
        "start_sec": 0,
        "end_sec": 120,
        "reliability_rating": "A",
        "event": "ALDS Game 5 - Blue Jays vs Rangers",
        "year": 2015,
        "athletes": "Jose Bautista",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "What part of this moment is teachable, and what part is theater?",
        "choices": [
          {"id": "best_read", "label": "The swing decision is teachable; the celebration is optional.", "quality": "correct"},
          {"id": "wrong_1",   "label": "The bat flip is the lesson.",                                  "quality": "poor"},
          {"id": "wrong_2",   "label": "Emotion created the barrel.",                                  "quality": "poor"}
        ],
        "coach_breakdown": "Players copy the wrong half of this clip all the time.",
        "takeaway": "Do not copy the celebration before you copy the read."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Players copy the wrong half of this clip all the time.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Do not copy the celebration before you copy the read."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['emotion','zone_control'],
  true
),

-- ── 25. Hit Through the Noise ─────────────────────────────────
(
  gen_random_uuid(),
  'fr_adolis_garcia_2023_alcs',
  'pressure-resilience',
  'hostile_environment',
  'Film Room: Hit Through the Noise',
  'Use the edge; do not let the edge use you.',
  'competitor',
  90,
  30,
  25,
  true,
  false,
  $$[
    {
      "type": "spark",
      "title": "Film Room: Hit Through the Noise",
      "content": "ALCS Game 6 - Rangers vs Astros (2023). Watch the moment through the Clutchr lens: one read, one decision, one takeaway."
    },
    {
      "type": "decision",
      "ui_variant": "film_room",
      "data": {
        "provider": "external_video",
        "youtube_id": null,
        "canonical_url": "https://www.mlb.com/video/adolis-garcia-hits-a-grand-slam-5-to-left-field-leody-taveras-scores-marc",
        "fallback_url": "https://www.mlb.com/video/adolis-garcia-hits-a-grand-slam-5-to-left-field-leody-taveras-scores-marc",
        "backup_urls": ["https://www.mlb.com/video/adolis-garcia-hits-a-grand-slam-5-to-left-field-leody-taveras-scores-marc"],
        "start_sec": 0,
        "end_sec": 27,
        "reliability_rating": "A",
        "event": "ALCS Game 6 - Rangers vs Astros",
        "year": 2023,
        "athletes": "Adolis Garcia",
        "setup": "Watch for the baseball behavior before the highlight result.",
        "question": "Why is this a recovery clip, not just a power clip?",
        "choices": [
          {"id": "best_read", "label": "He did not carry emotional debt into the next decision.",  "quality": "correct"},
          {"id": "wrong_1",   "label": "Anger made him better.",                                   "quality": "poor"},
          {"id": "wrong_2",   "label": "Hostile environments automatically fuel stars.",           "quality": "poor"}
        ],
        "coach_breakdown": "Emotion can fuel attention, but only if it stays organized.",
        "takeaway": "Use the edge; do not let the edge use you."
      },
      "responses": {
        "correct_id": "best_read",
        "acceptable_ids": []
      },
      "feedback": {
        "correct": "Emotion can fuel attention, but only if it stays organized.",
        "wrong":   "Rewatch the clip. The highlight is not the lesson; the decision before it is."
      }
    },
    {
      "type": "feedback",
      "title": "Takeaway",
      "content": "Use the edge; do not let the edge use you."
    }
  ]$$::jsonb,
  'baseball',
  ARRAY['hitter','team','all'],
  ARRAY['emotion_organization','recovery'],
  true
);

COMMIT;
