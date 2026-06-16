-- ============================================================
-- CLUTCHR BATCH 05 — WORLD 3: RBI MODE (RBI)
-- 15 lessons | pillar: rbi-mode | unit: rbi-mode
-- Covers: runner on third less than two, productive contact,
--         two-strike RBI battle, RISP pressure, pitcher escape
--         patterns, base open trap, sac fly, hero swing avoidance
-- ============================================================

BEGIN;

DELETE FROM public.legacy_lessons_staging
WHERE legacy_lesson_id LIKE 'RBI_%';

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

-- ── STAGE 1: BEGINNER (lessons 1–5) ─────────────────────────────

(
  gen_random_uuid(),
  'RBI_001',
  'rbi-mode',
  'rbi-mode',
  'Runner On Third, Less Than Two',
  'The run is 90 feet away — your job is to get it home with contact.',
  'beginner',
  120,
  20,
  1,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "The run is 90 feet away. Go get it.",
      "body": "Runner on third, less than two outs. You do not need a home run. You do not need a line drive in the gap. You need contact to the right side or a sac fly to medium depth. The entire game is asking you to do one simple job: get the run in."
    },
    {
      "type": "notice_wonder",
      "notice": "Runner on third. One out. The outfield is playing back. The infield is at normal depth. You are up with a chance to score a run in a tie game. Pitcher throws mostly fastballs.",
      "wonder": "What is your swing target on contact?",
      "reveal": "Your target is middle of the field to right center. A ball hit to the right side scores a runner from third in virtually every scenario. A deep fly to center or right does the same. You are not trying to pull the ball or lift it to left. You are driving something to the right side."
    },
    {
      "type": "choice",
      "prompt": "1-0 count. Fastball middle of the plate at the belt. This is your pitch. Where do you drive this ball?",
      "options": [
        {
          "id": "A",
          "text": "Drive it up the middle or to right center with a controlled swing",
          "feedback": "Correct. Middle contact on a belt-high fastball is your RBI weapon here. Controlled contact to the right side scores the runner and keeps your team moving.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Pull it hard to left field for extra bases",
          "feedback": "Pulling a belt-high fastball with a runner on third risks a line drive caught by the third baseman or a weak grounder to short. Drive it to the right side.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Take it and look for a better pitch at 2-0",
          "feedback": "A belt-high fastball in a scoring situation with a runner on third is your pitch. Taking it to get to 2-0 passes on a run-scoring opportunity.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "CONTACT SCORES THE RUN"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['runner-on-third','situational-hitting','productive-contact','rbi'],
  true
),

(
  gen_random_uuid(),
  'RBI_002',
  'rbi-mode',
  'rbi-mode',
  'Damage vs Job',
  'Know the difference between a damage swing and a job swing.',
  'beginner',
  120,
  20,
  2,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "The job swing and the damage swing are different reps",
      "body": "A damage swing is your full aggressive swing — you are trying to drive the ball hard. A job swing is shorter, more controlled — you are trying to make productive contact in a specific situation. With a runner on second and one out, the job is to get the run home with contact, not to go yard. Identify which rep you are in."
    },
    {
      "type": "notice_wonder",
      "notice": "Runner on second. One out. Team is down 1-0 in the fifth. You have power. The pitcher is a fastball pitcher who has been in the zone all day.",
      "wonder": "Do you take a damage swing or a job swing here?",
      "reveal": "Job swing. One out, runner on second — you need the runner to advance or score. A damage swing that results in a pulled groundout to the pitcher or a pop to short does nothing. A controlled middle-field swing that gets the runner to third with one out keeps the inning alive. The job comes first."
    },
    {
      "type": "choice",
      "prompt": "2-1 count. Runner on second. Pitcher goes away fastball at the belt. Job swing means middle-away contact. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Drive it to right center — stay back and let the ball travel",
          "feedback": "Correct. Away fastball at the belt with a runner on second is a right-center ball all day. Stay back, let it travel, and drive it the other way.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Pull it hard to left to try to drive the runner in from second",
          "feedback": "Pulling an away fastball requires you to reach across your body and rotate early. The result is usually a weak groundout to second or a pull-side fly. Stay back.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Take it and go to 3-1 for a better damage pitch",
          "feedback": "3-1 is a better count for a damage swing, but you are here for a job swing. Middle-away contact on this pitch gets the runner to third or scores him. Do not wait for damage when the job pitch is right here.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "DO THE JOB FIRST"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['situational-hitting','job-swing','productive-contact','rbi'],
  true
),

(
  gen_random_uuid(),
  'RBI_003',
  'rbi-mode',
  'rbi-mode',
  'Middle Field Money',
  'Middle and right-center contact is where RBI situational hitting lives.',
  'beginner',
  120,
  20,
  3,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Middle field contact is your RBI weapon",
      "body": "Pulled groundouts score zero runners. Deep flies to left score runners sometimes. A hard groundball up the middle, a liner to right center, a chopper to the right side — those score runners in almost every count-and-base scenario. Middle field is not defensive hitting — it is weaponized situational hitting."
    },
    {
      "type": "checklist",
      "prompt": "Middle Field Approach",
      "items": [
        "Let the ball travel deeper before firing your swing",
        "Keep your back knee loaded — do not pull off early",
        "Contact point should be even with or slightly behind the front hip",
        "Drive through the ball — do not lift it",
        "Target the gap or up the middle — not down the left field line"
      ]
    },
    {
      "type": "choice",
      "prompt": "Runner on second. One out. Pitcher throws a fastball away at the knees. What is the correct middle-field contact play?",
      "options": [
        {
          "id": "A",
          "text": "Let it travel, keep your back knee back, drive it to right center",
          "feedback": "Correct. Away fastball at the knees is a right-center ball when you stay back. This scores the runner from second and gives you a chance at a hit.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Expand the zone and try to pull it for extra bases",
          "feedback": "Pulling a knee-high away pitch means reaching across the plate and rolling your wrists early. The result is a weak grounder to second — an out that moves nobody.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Take it — it is low and might be a ball",
          "feedback": "Knee-high away in this count is likely a strike. In a run-scoring situation, taking a hittable pitch that you could drive to the right side is a wasted opportunity.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "MIDDLE FIELD ALL DAY"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['middle-field','situational-hitting','stay-back','productive-contact'],
  true
),

(
  gen_random_uuid(),
  'RBI_004',
  'rbi-mode',
  'rbi-mode',
  'Lift When Asked',
  'A sac fly wins a run — learn the swing thought that makes it happen.',
  'beginner',
  120,
  20,
  4,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "A fly ball is a win when a runner is 90 feet away",
      "body": "Runner on third, no outs, outfield back — a fly ball to medium depth wins this situation. You do not need to barrel it. You do not need 400 feet. You need to get the ball in the air to medium depth. One adjustment in your swing thought produces a sac fly."
    },
    {
      "type": "notice_wonder",
      "notice": "Runner on third. No outs. The outfield is playing at normal depth — not in. A sac fly scores the run. The pitcher throws a fastball waist-high in the middle of the plate.",
      "wonder": "What is your swing thought on this pitch to produce a fly ball?",
      "reveal": "Slight upward path through contact. You are not trying to hit the top of the ball — you are driving through the lower half. Let the ball get to you a split second longer, stay back, and drive through it with a slight backspin-lift angle. You are not scooping it or trying to homer. You are driving a fly ball to medium depth."
    },
    {
      "type": "choice",
      "prompt": "1-0 count. Fastball thigh-high in the middle. Runner on third, no outs. What is your swing type?",
      "options": [
        {
          "id": "A",
          "text": "Drive through the ball with a slight upward path — aim for medium-depth fly ball",
          "feedback": "Correct. A medium-depth fly ball from a thigh-high fastball in the middle is exactly what this situation calls for. Backspin contact, slight upward path, ball in the air.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Flat level swing and try to hit it on the ground to the right side",
          "feedback": "A ground ball to the right side does score the runner sometimes, but in a no-out situation with a thigh-high pitch, producing a fly ball is the higher-percentage play. Get the ball in the air.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Swing down on the ball to drive it into the ground on the right side",
          "feedback": "Swinging down on a thigh-high pitch produces a topped grounder that goes to second or the pitcher — not a sac fly. Drive through the ball upward.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "LIFT LINE DRIVE MIDDLE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['sac-fly','runner-on-third','lift-swing','situational-hitting'],
  true
),

(
  gen_random_uuid(),
  'RBI_005',
  'rbi-mode',
  'rbi-mode',
  'Get The Run In',
  'Checkpoint: execute in three different run-scoring situations.',
  'beginner',
  150,
  30,
  5,
  true,
  false,
  '[
    {
      "type": "spark",
      "headline": "One run changes everything. Go get it.",
      "body": "The fastest way to change a game is to score the runner that is already in scoring position. This rep puts you in three situations — runner on third less than two, runner on second with two outs, and runner on third no outs. One job. Three executions."
    },
    {
      "type": "notice_wonder",
      "notice": "Runner on third. One out. Tie game. Fifth inning. You are 0-for-1 with a pulled groundout. Pitcher got you on a fastball inner half you chased inside and rolled over. He is back on the mound.",
      "wonder": "What is the one adjustment that changes your result this at-bat?",
      "reveal": "Stay back. Last time you rolled over the inner half pitch because you fired your hips early. This time your adjustment is to keep your back knee in until the ball is in your contact zone. You still attack the inner pitch, but you do not pull off it. That small adjustment keeps the ball to the right side and scores the run."
    },
    {
      "type": "choice",
      "prompt": "0-2 count. Pitcher comes with a slider on the outer half at the knees. You are in two-strike mode. What is your job?",
      "options": [
        {
          "id": "A",
          "text": "Protect and try to foul it off — stay alive, the runner is still on third",
          "feedback": "Correct. Two-strike mode with a runner on third means you stay alive first. A foul ball keeps the at-bat going and gives you another chance to produce.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Attack it hard and try to drive the run in anyway",
          "feedback": "Attacking a slider at the knees on the outer half at 0-2 produces a swing and miss or a weak grounder. Protect first, look for contact, then attack if the pitch stays in your two-strike damage zone.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Take it and hope it misses the zone",
          "feedback": "Passive takes at 0-2 end at-bats. Protect the pitch and stay alive. The runner is still on third.",
          "correct": false
        }
      ]
    },
    {
      "type": "checklist",
      "prompt": "Get The Run In — Execution Checklist",
      "items": [
        "Know the outs before you swing",
        "Middle-right contact scores runners from second and third",
        "Sac fly to medium depth scores the runner from third with no outs",
        "Two strikes means protect first — damage if the pitch shows up",
        "One at-bat with RISP is worth three singles with bases empty"
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "GET THE RUN IN"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['risp','run-scoring','situational-hitting','two-strike','checkpoint'],
  true
),

-- ── STAGE 2: INTERMEDIATE (lessons 6–10) ────────────────────────

(
  gen_random_uuid(),
  'RBI_006',
  'rbi-mode',
  'rbi-mode',
  'Runner On Second, Two Outs',
  'Two outs with RISP means one job: drive a pitch in your zone for a hit.',
  'intermediate',
  140,
  22,
  6,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Two outs means the hit has to happen",
      "body": "Runner on second with two outs is not a productive out situation. You need a hit. There is no sac fly, no groundout to the right side that scores the run. You need to reach base. That changes your approach: be selective, extend the at-bat, and drive a pitch you can actually do damage with."
    },
    {
      "type": "notice_wonder",
      "notice": "Runner on second. Two outs. Pitcher has been battling — he is at 85 pitches and nibbling. The count is 2-0 on you. He has to throw a strike.",
      "wonder": "How does a two-out, two-outs situation change your zone compared to a one-out, runner-on-third situation?",
      "reveal": "With two outs you need a hit, not a productive out. Your zone opens up slightly in a hitter count — you are hunting damage pitches because weak contact ends the inning. In a 2-0 count with a tired pitcher, your damage zone is the most important thing on the field right now."
    },
    {
      "type": "choice",
      "prompt": "3-1 count. Runner on second. Two outs. Pitcher throws a fastball, belt-high in the zone middle. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Attack it and drive it — this is your pitch in a hitter count",
          "feedback": "Correct. 3-1, belt-high, middle of the plate. This is the RBI pitch. With two outs you need a hit, and this pitch gives you the best chance to produce one.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Take it and go to a full count",
          "feedback": "Taking a belt-high 3-1 fastball in the middle in a two-out RBI situation is leaving the run on the table. That pitch is your job and your opportunity.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Poke it to right field for a single",
          "feedback": "Poking a middle belt-high fastball to right on purpose limits your damage. Drive this pitch. With two outs you need hits, not rollers.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "TWO OUTS DRIVE THROUGH"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['two-out-hitting','risp','hitter-counts','damage-swing'],
  true
),

(
  gen_random_uuid(),
  'RBI_007',
  'rbi-mode',
  'rbi-mode',
  'Do Not Chase Hero Pitch',
  'The hero swing in an RBI situation ends at-bats without scoring runs.',
  'intermediate',
  140,
  22,
  7,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Hero swings lose RBI situations",
      "body": "Runner in scoring position. The situation calls for a hit. You are looking for a pitch to crush — something up, something in, something you can drive out of the park. The pitcher knows this. He is throwing everything below your knees and off the outer edge. He is baiting the hero swing."
    },
    {
      "type": "choice",
      "prompt": "Runner on second. One out. 1-1 count. Pitcher throws a changeup low and away — six inches below the zone. You feel the urgency to score the run. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Expand and reach for it — you need to score the run",
          "feedback": "Reaching for a changeup six inches below the zone produces a weak swing-and-miss or a slow roller to second. The urgency you feel is exactly what the pitcher is exploiting. Do not bite.",
          "correct": false
        },
        {
          "id": "B",
          "text": "Take it — it is out of your zone, go to 1-2",
          "feedback": "Correct. The changeup below the zone is the bait pitch. You recognize it, take it, and go to 1-2. Now you are in two-strike mode and the pitcher has to keep throwing.",
          "correct": true
        },
        {
          "id": "C",
          "text": "Half-swing and try to foul it off",
          "feedback": "Half-swinging at a pitch six inches below the zone gets you called out on a check swing or produces a weak dribbler. Take the pitch cleanly.",
          "correct": false
        }
      ]
    },
    {
      "type": "reflection",
      "prompt": "What physical cue do you use to stay short and controlled in RBI situations when you feel the urge to do too much?",
      "placeholder": "I remind myself to stay back and let the ball come to me instead of reaching for it..."
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "NO HERO SWINGS HERE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['risp','hero-swing','zone-discipline','two-strike'],
  true
),

(
  gen_random_uuid(),
  'RBI_008',
  'rbi-mode',
  'rbi-mode',
  'Two-Strike RBI Battle',
  'With two strikes and runners on, competing harder is the only option.',
  'intermediate',
  140,
  22,
  8,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Two strikes with runners on means compete harder",
      "body": "You are behind in the count with runners in scoring position. The at-bat is not over. Shorten the swing. Protect more of the plate. Give yourself a chance to fight off the strikeout pitch and wait for a mistake. A two-strike RBI single is one of the most valuable plays in the game."
    },
    {
      "type": "notice_wonder",
      "notice": "1-2 count. Runner on second. The pitcher has been going to a curveball low and away to end at-bats all game. You have seen him use it twice today against left-handed hitters.",
      "wonder": "How does your approach change when you go to two-strike mode with a runner on second?",
      "reveal": "You shorten up and protect the outer half. You are no longer hunting a specific pitch in a specific zone — you are protecting against the out pitch. If the curveball lands low and away and you can foul it off, you stay alive. If it misses below the zone, you take it. If a fastball catches the middle in a two-strike count, you drive it."
    },
    {
      "type": "choice",
      "prompt": "1-2 count. Curveball breaks low and away — outer corner, knee height. Runner on second. What is the correct two-strike play?",
      "options": [
        {
          "id": "A",
          "text": "Foul it off with a short, controlled swing — stay alive",
          "feedback": "Correct. Two-strike mode with a runner on second means you protect first. A foul ball extends the at-bat and adds to his pitch count.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Lay off — it might be a ball",
          "feedback": "Knee-high outer corner on 1-2 is in the zone in most ballparks. Do not take it passively. Protect and foul it back.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Attack it and try to drive it to right center",
          "feedback": "Attacking a knee-high outer corner curveball in two-strike mode with a hard swing produces a weak groundout to second or a swing-and-miss. Protect, do not attack.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "SHRINK AND COMPETE NOW"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['two-strike','risp','compete-mode','foul-ball'],
  true
),

(
  gen_random_uuid(),
  'RBI_009',
  'rbi-mode',
  'rbi-mode',
  'Sac Fly or Roll Over',
  'Know when a fly ball beats a groundball and execute the right swing.',
  'intermediate',
  140,
  22,
  9,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "A sac fly wins. A rollover gives the inning back.",
      "body": "Runner on third, no outs, outfield back. A fly ball to medium depth scores the run. A pulled groundout keeps the runner on third. The difference is one mechanical adjustment in your swing path — and knowing before the pitch which one you are trying to produce."
    },
    {
      "type": "choice",
      "prompt": "Runner on third. No outs. 1-0 count. Fastball thigh-high, right at the plate. This is a sac fly pitch. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Drive through it with a slight backspin path — lift it to medium depth",
          "feedback": "Correct. Thigh-high fastball in the middle with a runner on third and no outs. Drive through the lower half of the ball with a slight backspin path. Medium-depth fly ball. Run scores.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Try to pull it hard to produce a sacrifice fly to left",
          "feedback": "Pulling this pitch with a hard rotation produces a topped grounder or a pulled fly that does not go deep enough. Drive it to center or right center — not pulled.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Take it and look for a better pitch at 2-0 to go for the home run",
          "feedback": "In a sac fly situation with no outs, taking a thigh-high fastball in the middle to look for a home run pitch passes on a sure run. Get the run in first.",
          "correct": false
        }
      ]
    },
    {
      "type": "reflection",
      "prompt": "In a sac fly situation with no outs, what one adjustment do you make in your stance or swing thought to produce the fly ball?",
      "placeholder": "I think about letting the ball travel slightly deeper and driving through it with my hands..."
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "CONTACT AHEAD OF HERO"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['sac-fly','runner-on-third','lift-swing','situational-hitting'],
  true
),

(
  gen_random_uuid(),
  'RBI_010',
  'rbi-mode',
  'rbi-mode',
  'Situation Plan',
  'Build your RBI approach before the pitch — know the outs, score, and job.',
  'intermediate',
  160,
  30,
  10,
  true,
  false,
  '[
    {
      "type": "spark",
      "headline": "Know the situation before you know the pitch",
      "body": "Every time you step into the box with runners in scoring position, the situation should already be processed: outs, score, runner locations, and what contact wins. A hitter who has to figure out the situation in the box is a half-second late. A hitter who walks in with the plan already locked is ready to execute."
    },
    {
      "type": "notice_wonder",
      "notice": "Runners on first and second. One out. Tie game. Late innings. The situation has multiple outcomes: sac fly does not help, groundout to the right side advances both runners, base hit drives both.",
      "wonder": "What are your priorities in order before you swing?",
      "reveal": "Priority one: know the outs. One out means a groundout to the right side is not a run but it is a base advance. Priority two: know where the runners go on contact to different parts of the field. Priority three: your swing is designed for middle-right contact — keep the ball out of the double-play zone on the left side."
    },
    {
      "type": "choice",
      "prompt": "1-1 count. Runners on first and second, one out. Pitcher goes away fastball at the belt. What is the correct play?",
      "options": [
        {
          "id": "A",
          "text": "Drive it to right center — advances both runners, avoids the double play",
          "feedback": "Correct. Away fastball at the belt to right center keeps both runners moving and avoids the double play on the left side. That is the situational rep.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Pull it hard to the left side for extra bases",
          "feedback": "Pulling a ball to the left side with runners on first and second and one out risks a 5-4-3 double play. Middle-right contact is safer and more productive in this situation.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Take it and go to 1-2",
          "feedback": "Taking an away fastball at the belt in a run-scoring situation at 1-1 passes on one of the better pitches you will see. Drive it.",
          "correct": false
        }
      ]
    },
    {
      "type": "visualization",
      "content": "See yourself driving the ball to right center. Both runners move. The runner on second scores. You are standing at first. You did not need a home run. You needed a plan and a contact zone. You had both.",
      "cue": "RIGHT SIDE SCORES RUNS"
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "READ SITUATION MAKE PLAN"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['situational-hitting','risp','pre-ab-plan','middle-field'],
  true
),

-- ── STAGE 3: ADVANCED (lessons 11–15) ───────────────────────────

(
  gen_random_uuid(),
  'RBI_011',
  'rbi-mode',
  'rbi-mode',
  'Late-Inning RBI Nerves',
  'Win the five seconds before the pitch in a high-stakes RBI situation.',
  'advanced',
  150,
  24,
  11,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Pressure ABs are won before the pitch arrives",
      "body": "Ninth inning. Runner on second. Two outs. Your team is down one. Every single person in the building knows the situation. Your heart rate is up. Your hands are tight. The crowd is loud. None of that changes what the right swing is. The pressure is a signal — not a command."
    },
    {
      "type": "notice_wonder",
      "notice": "Ninth inning. Down 1-0. Runner on second. Two outs. You are the go-ahead run at the plate. Closer is coming in — hard slider, 96 fastball. You have never faced him.",
      "wonder": "What do you do in the five seconds before stepping into the box?",
      "reveal": "One slow breath out. One look at your hands on the bat. One reminder: fastball in my zone, I attack. Slider I track and take or foul if it is near the zone. I do not need to do anything special. I need to do my job. Step in only when that plan is locked."
    },
    {
      "type": "reflection",
      "prompt": "What is the one phrase or thought you come back to when the game is on the line and you feel the pressure building?",
      "placeholder": "I remind myself of my plan — hunt the fastball in my zone and make him beat me..."
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "NERVES ARE NOT NOISE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['pressure-ab','risp','composure','late-inning'],
  true
),

(
  gen_random_uuid(),
  'RBI_012',
  'rbi-mode',
  'rbi-mode',
  'Bad Call With RISP',
  'Stay in the at-bat after a questionable strike call with runners in scoring position.',
  'advanced',
  150,
  24,
  12,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "A bad call is part of the at-bat — not the end of it",
      "body": "You are at 1-2 with a runner on third. The umpire rings you up on a pitch that was two inches outside. You cannot argue it. You cannot replay it. What you can control is what happens in the next ten seconds — and whether you carry that call into the next at-bat."
    },
    {
      "type": "notice_wonder",
      "notice": "1-2 count. Runner on third. One out. Umpire calls you out on a fastball that appeared to be off the outer edge. You are convinced it missed. The runner stays on third.",
      "wonder": "What happens in your body and mind in the 10 seconds after the call?",
      "reveal": "You feel the frustration. That is real and that is allowed. But the at-bat is over. Your next job is to carry your cue into the dugout, identify what pitch to expect next time, and be ready to compete in your next at-bat. Arguing the call gives you zero runs. A clean next at-bat gives you a chance at one."
    },
    {
      "type": "choice",
      "prompt": "Same situation, different pitch. You hold it together. The umpire calls the borderline pitch a ball — 2-2. Next pitch is a fastball, right at the belt, middle of the plate. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Attack it with full commitment — you are composed and this is your pitch",
          "feedback": "Correct. You stayed in the at-bat mentally after the close call. That composure set you up for the next pitch, and the next pitch is in your zone. Attack it.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Take it — you are still reacting to the previous pitch",
          "feedback": "If you are still processing the previous pitch, you are not ready to hit. That is why the reset between pitches matters. Flush the last call before the next pitch arrives.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Foul it off because you are not settled",
          "feedback": "An unsettled foul ball on a middle belt-high fastball is a wasted pitch. Reset fully between pitches so you are locked in when your pitch arrives.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "MOVE ON NEXT PITCH"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['composure','risp','reset','bad-call'],
  true
),

(
  gen_random_uuid(),
  'RBI_013',
  'rbi-mode',
  'rbi-mode',
  'Pitcher Escape Pattern',
  'Identify what the pitcher throws when he needs a strikeout — then plan for it.',
  'advanced',
  150,
  24,
  13,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Pitchers have escape pitches — learn them early",
      "body": "When a pitcher needs a strikeout with runners in scoring position, he goes to his best pitch in his best location. It is almost always the same. Left-handers go slider away. Power right-handers go four-seam up and in. Soft tossers go changeup down. Identify the escape pitch early and prepare your response."
    },
    {
      "type": "notice_wonder",
      "notice": "Right-handed starter. He has used a curveball low and away to end three at-bats in two-strike counts today. 1-2 count. Runner on second. He needs a strikeout.",
      "wonder": "What pitch do you predict and what is your response?",
      "reveal": "Curveball low and away — that is his escape pitch today. Your two-strike response: protect the outer half, shorten your swing, and if the curveball hangs in the zone, drive it to right center. If it goes below the zone, take it. You are not guessing — you identified his pattern from the dugout."
    },
    {
      "type": "choice",
      "prompt": "1-2 count. Pitcher throws his escape curveball — it breaks low and away, catching the outer corner at the knee. What is your play?",
      "options": [
        {
          "id": "A",
          "text": "Protect and try to foul it off with a short swing",
          "feedback": "Correct. You identified the pitch and it caught the outer corner at the knee. Foul it back and stay in the at-bat. You have done the hard work — now compete pitch by pitch.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Lay off — the curveball is always a ball in this situation",
          "feedback": "His escape curveball catches the outer corner often. Taking it passively risks a called strikeout. Protect it.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Attack it hard and try to drive it to right",
          "feedback": "Attacking a knee-high curveball on the outer corner with full force produces a weak grounder or a swing-and-miss. Protect and foul first.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "SPOT THE ESCAPE PITCH"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['escape-pitch','two-strike','risp','pattern-recognition'],
  true
),

(
  gen_random_uuid(),
  'RBI_014',
  'rbi-mode',
  'rbi-mode',
  'Base Open Trap',
  'When first base is open, recognize the nibble and let the walk happen.',
  'advanced',
  150,
  24,
  14,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "When first base is open, they may not want to face you",
      "body": "Runner on second. First base open. You are a dangerous hitter. The pitcher may decide to work around you — throwing at the edge of the zone or off it entirely to get to the next hitter. Your job is to recognize the nibble and let the walk happen. Do not chase when he does not want to challenge you."
    },
    {
      "type": "choice",
      "prompt": "Runner on second. First base open. One out. Pitcher throws the first pitch six inches off the outer edge — clearly away. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Swing — you need to score the runner and can reach it",
          "feedback": "Reaching for a pitch six inches off the outer edge with first base open is the opposite of what the situation calls for. He is testing whether you will chase. Take it.",
          "correct": false
        },
        {
          "id": "B",
          "text": "Take it — he is working around you, let him put you on base",
          "feedback": "Correct. A pitch six inches off the edge with first base open and a dangerous hitter at the plate is the nibble. Take it, go to 1-0, and see if he is going to challenge you.",
          "correct": true
        },
        {
          "id": "C",
          "text": "Swing anyway because they might pitch around you the whole at-bat",
          "feedback": "Chasing pitches outside your zone because you are afraid of walking is exactly what pitchers exploit. Let the walk happen when he does not want to pitch to you.",
          "correct": false
        }
      ]
    },
    {
      "type": "reflection",
      "prompt": "How do you tell the difference between a pitcher who is genuinely pitching around you and one who just missed his spot badly?",
      "placeholder": "I look at whether the catcher set up off the plate and whether the pitch pattern shows a second one outside..."
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "LET THE WALK HAPPEN"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['intentional-walk','base-open','zone-discipline','risp'],
  true
),

(
  gen_random_uuid(),
  'RBI_015',
  'rbi-mode',
  'rbi-mode',
  'RISP Gauntlet',
  'Execute your full RISP approach across three consecutive pressure at-bats.',
  'advanced',
  210,
  40,
  15,
  false,
  true,
  '[
    {
      "type": "spark",
      "headline": "Three situations. Three chances. One run.",
      "body": "Championship game. Seventh inning. You have gone 0-for-3 with runners in scoring position. Same pitcher. You know his out pitch is a slider away at 1-2. You know he starts with fastballs. You have the full database. This at-bat is different because you have earned the information."
    },
    {
      "type": "notice_wonder",
      "notice": "0-for-3 with RISP today. All three times you chased the slider low and away in two-strike counts. The pitcher went: FB-FB-slider all three ABs. Runner on second. One out. Tie game. Seventh inning.",
      "wonder": "What is the one adjustment that wins this at-bat?",
      "reveal": "Sit on the slider. You have seen it three times. In this at-bat, when the count reaches 1-2 and he goes to his slider, you are not swinging at it unless it is middle-up in the zone. If it goes low and away — which it has every time — you take it and extend the at-bat. You are done giving him that pitch."
    },
    {
      "type": "choice",
      "prompt": "2-1 count. Pitcher goes fastball inner half — not the slider you were sitting on. It is belt-high in your damage zone. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Attack it — inner half fastball at the belt is your damage pitch",
          "feedback": "Correct. You were sitting slider but this is a belt-high fastball in your zone. Yes-yes-no fired all the way. You do not pass on damage pitches just because they are not the pitch you were hunting.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Take it — you are sitting slider and this is not your pitch",
          "feedback": "Sitting a pitch does not mean ignoring damage pitches in your zone. A belt-high inner half fastball at 2-1 is a damage pitch. Attack it.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Foul it off to get to 2-2 where you expect the slider",
          "feedback": "Fouling off damage pitches intentionally to get to the count you want is bad hitting. Attack belt-high inner half fastballs when they arrive.",
          "correct": false
        }
      ]
    },
    {
      "type": "choice",
      "prompt": "1-2 count. He goes to the slider — low and away, just like the last three at-bats. It is below the zone. You have been here before. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Take it — you identified the pattern, it is below your zone, let it go",
          "feedback": "Correct. You prepared for this pitch in this count. It went below the zone — just like the three previous at-bats. You let it go. Now it is 2-2 and you have extended the at-bat.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Swing — it looks close enough and you need the hit",
          "feedback": "You identified this exact pitch three times today. It went below the zone all three times. Urgency is not a reason to chase the same pitch you told yourself to lay off.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Protect and foul it off — it might catch the zone",
          "feedback": "If it is below your zone, protect mode produces a weak contact or a swing-and-miss. If it is cleanly below the zone, the clean take is better than a protect swing.",
          "correct": false
        }
      ]
    },
    {
      "type": "visualization",
      "content": "See the next pitch. You have extended the at-bat. He comes with a fastball away at the belt — not the slider. You stay back. You drive it to right center. The runner on second scores standing up. All four at-bats you built the database. The last one you used it.",
      "cue": "STAY BACK SCORES RUNS"
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "RISP RUN SCORES NOW"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['risp','full-game-sim','pattern-recall','two-strike','pressure-ab'],
  true
);

COMMIT;
