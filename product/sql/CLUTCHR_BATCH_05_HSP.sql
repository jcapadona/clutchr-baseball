-- ============================================================
-- CLUTCHR BATCH 05 — WORLD 1: HITTER-SPECIALTY (HSP)
-- 15 lessons | pillar: hitter-specialty | unit: hitter-specialty
-- Covers: pitch recognition, damage window, yes-yes-no, release
--         window, two-strike compete, pattern recall, post-K reset
-- ============================================================

BEGIN;

DELETE FROM public.legacy_lessons_staging
WHERE legacy_lesson_id LIKE 'HSP_%';

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
  'HSP_001',
  'hitter-specialty',
  'hitter-specialty',
  'See It Early',
  'Train your focus to the release point before the pitch arrives.',
  'beginner',
  120,
  20,
  1,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Your eyes get there first",
      "body": "Every quality swing starts before the ball leaves the hand. The hitter who locks onto the release point has a quarter-second advantage over one who tracks the ball in flight. Train your focus to the window — not the plate."
    },
    {
      "type": "notice_wonder",
      "notice": "First inning. Fastball starter on the mound. You are leading off. You have seen him throw two fastballs away to the previous batter. His arm slot is three-quarters. He sets at the stretch.",
      "wonder": "Where should your eyes be focused as he begins his delivery?",
      "reveal": "Park your eyes at the release point — where his hand comes out over his front hip. You are not watching the glove, the windup, or the catcher. You track arm slot and wrist angle, then pick up the ball. That early read adds a fraction of a second to your decision window."
    },
    {
      "type": "checklist",
      "prompt": "Release Window Routine",
      "items": [
        "Eyes relax and soft before the windup starts",
        "Shift focus to release point as he strides",
        "Track arm slot — high slot means fastball is likely",
        "Watch wrist angle for spin or breaking ball tip",
        "Commit to swing or take before the ball enters the zone"
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "EYES TO THE SLOT"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['pitch-recognition','release-window','early-read'],
  true
),

(
  gen_random_uuid(),
  'HSP_002',
  'hitter-specialty',
  'hitter-specialty',
  'Damage Zone vs Strike Zone',
  'Not every strike is worth swinging at — learn your real attack zone.',
  'beginner',
  120,
  20,
  2,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Not all strikes are created equal",
      "body": "The legal strike zone is the rulebook version. Your damage zone is the smaller area where you can consistently do damage. A pitch at the knees on the outer third may be a strike — but if you cannot drive it with authority, it is not your pitch."
    },
    {
      "type": "notice_wonder",
      "notice": "1-0 count. Fastball starter comes back with a pitch that catches the outer third, knee-high. The catcher sets up right on the corner. The ball is in the strike zone.",
      "wonder": "Is this your pitch to attack?",
      "reveal": "Legal strike, yes. But knee-high outer third is below most hitters damage zone. Taking this pitch in a 1-0 count is a disciplined decision, not a passive one. You are waiting for something you can do damage with — belt-high in your lane."
    },
    {
      "type": "choice",
      "prompt": "1-0 count. Fastball, belt-high on the inner third. This is in the heart of your damage zone. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Attack it — this is in your damage zone",
          "feedback": "Right call. Belt-high inner half is where you do damage. You had a plan, the pitch matched it, and you attacked. That is quality AB thinking.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Take it — go to 2-0 for an even better count",
          "feedback": "Passing on a pitch in your damage zone in a hitter count is the wrong move. 2-0 is a good count, but you just gave back a pitch you could have driven. Attack when the damage zone pitch arrives.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Check swing — you are not sure",
          "feedback": "If you are unsure on a belt-high inner half fastball in a 1-0 count, your zone definition needs sharpening. Know your damage zone before you step in.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "HUNT YOUR DAMAGE ZONE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['pitch-recognition','damage-zone','swing-take','zone-discipline'],
  true
),

(
  gen_random_uuid(),
  'HSP_003',
  'hitter-specialty',
  'hitter-specialty',
  'Yes-Yes-No',
  'Master the three-part swing decision and never be late again.',
  'beginner',
  120,
  20,
  3,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Two yes decisions — then a no if needed",
      "body": "Yes-Yes-No is a timing model. First yes: the pitch is in your zone. Second yes: the ball is on the plane you can handle. No: the break, the spin, or the final location takes it out of your damage window. Two yeses mean the swing fires. One no means you hold."
    },
    {
      "type": "notice_wonder",
      "notice": "0-0 count. Fastball pitcher. You are hunting fastball inner half. He throws a fastball that starts at the belt toward the inner third — two yes decisions are firing. At the last instant, the ball cuts slightly away.",
      "wonder": "You are already in the yes-yes decision. What happens now?",
      "reveal": "If the cut takes it into the outer third below the belt, the no kicks in and you hold. If it stays on the inner third at the belt, you complete the swing. The model works because it commits you to attack early and lets you bail only if the final location demands it. You are never guessing from zero."
    },
    {
      "type": "choice",
      "prompt": "0-1 count. Pitcher throws what looks like a fastball inner half — two yes decisions fire. The pitch breaks late and drops to the bottom of the zone, outer third. What is the correct application of yes-yes-no?",
      "options": [
        {
          "id": "A",
          "text": "Swing through it — you were already committed",
          "feedback": "Commitment is fine until the no condition arrives. Late break that drops below your damage zone is the no. Holding here is the correct outcome of the model.",
          "correct": false
        },
        {
          "id": "B",
          "text": "Hold — the late break into the low outer third is the no",
          "feedback": "Correct. Two yeses fired early, but the late movement took it out of your damage zone. The no kicked in. That is exactly how the model works.",
          "correct": true
        },
        {
          "id": "C",
          "text": "Take every pitch until you get to a full count",
          "feedback": "Passive counts hurt you. Yes-yes-no is not a take strategy — it is a commit-then-bail model that keeps you aggressive while giving you one last exit.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "YES YES NO"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['swing-decision','yes-yes-no','timing','pitch-recognition'],
  true
),

(
  gen_random_uuid(),
  'HSP_004',
  'hitter-specialty',
  'hitter-specialty',
  'Release Window Lock',
  'Identify the exact release window for each pitcher in your first at-bat.',
  'beginner',
  120,
  20,
  4,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Find the window — then lock it in",
      "body": "Every pitcher has a release window — the small zone in space where the ball first becomes trackable. Left-handers release from a different spot than right-handers. Sidearmers, three-quarter, over-the-top — each has a different window. Your first job in the first at-bat is to find it and lock it in for the rest of the game."
    },
    {
      "type": "timer",
      "duration": 10,
      "instructions": "Close your eyes. Visualize the last pitcher you faced. See his arm coming through. Where exactly does the ball first appear? Hold that image in your mind for 10 seconds. That is your release window."
    },
    {
      "type": "checklist",
      "prompt": "Release Window Lock — First AB Mission",
      "items": [
        "Note the pitcher arm angle before you step in",
        "Pick a focus spot slightly behind the release zone",
        "On the first pitch, confirm exactly where the ball appears",
        "Adjust your soft focus between pitches if the window felt off",
        "Carry the confirmed window into every AB for the rest of the game"
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "LOCK THE RELEASE POINT"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['release-window','pitch-recognition','early-read','pre-pitch-routine'],
  true
),

(
  gen_random_uuid(),
  'HSP_005',
  'hitter-specialty',
  'hitter-specialty',
  'Hunt Lane Lock',
  'Commit to one pitch in one lane and let everything else go.',
  'beginner',
  150,
  30,
  5,
  true,
  false,
  '[
    {
      "type": "spark",
      "headline": "One lane. One pitch. One swing.",
      "body": "Hunting means deciding before the pitch what you are looking for and where. If it shows up, you attack. If it does not, you take. A hitter who hunts with discipline makes fewer weak swings, sees more pitches in his zone, and forces pitchers to come to him."
    },
    {
      "type": "notice_wonder",
      "notice": "2-1 count. Fastball pitcher who has gone away on first pitches to three straight hitters. You are hunting fastball outer third, belt-high — his go-to location in 2-1 counts all game.",
      "wonder": "What is your decision rule before this pitch leaves his hand?",
      "reveal": "Your rule is locked: fastball outer third belt-high — attack it. Any other location — take. You are not reacting pitch-to-pitch. You made a decision before stepping in. If he throws your pitch, your barrel is already committed. If he misses your lane, you take and go to 2-2."
    },
    {
      "type": "choice",
      "prompt": "2-1 count. You are hunting fastball outer third. Pitcher throws a fastball inner half at the belt — in the zone but not your lane. What is the correct decision?",
      "options": [
        {
          "id": "A",
          "text": "Swing — it is in the strike zone and a hitter count",
          "feedback": "Inner half in a fastball count is a fine pitch, but you locked to outer third for a reason. Abandoning your lane mid-AB leads to weaker contact and broken swings. Stay disciplined.",
          "correct": false
        },
        {
          "id": "B",
          "text": "Take — it missed your lane, go to 2-2",
          "feedback": "Correct. Your lane was outer third. He threw inner third. You take, go to 2-2, and re-evaluate. Lane discipline means you only attack the pitch you planned for.",
          "correct": true
        },
        {
          "id": "C",
          "text": "Check swing and try to make contact just in case",
          "feedback": "Check swings on pitches outside your lane produce the weakest contact. If you did not plan for it, you do not half-swing at it.",
          "correct": false
        }
      ]
    },
    {
      "type": "visualization",
      "content": "See yourself at 2-1. You are locked to outer third. The pitcher throws outer third belt-high. You attack it cleanly because you were already committed. The ball jumps off the barrel to the right-center gap. That is what lane discipline produces.",
      "cue": "LANE OR PASS"
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "ONE LANE ONE DECISION"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['hunt-zone','lane-discipline','pitch-recognition','swing-decision'],
  true
),

-- ── STAGE 2: INTERMEDIATE (lessons 6–10) ────────────────────────

(
  gen_random_uuid(),
  'HSP_006',
  'hitter-specialty',
  'hitter-specialty',
  'Fastball Ready Body',
  'Load for the fastball and make a late mental adjustment for offspeed.',
  'intermediate',
  140,
  22,
  6,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Be fastball ready — adjust to everything else",
      "body": "The hardest adjustment in hitting is gearing up for a fastball and then getting offspeed. The second hardest is sitting offspeed and getting a fastball. The solution: load for the fastball every time, and let your eyes make the late adjustment. Your body is always ready. Your mind makes the call."
    },
    {
      "type": "notice_wonder",
      "notice": "2-0 count. Pitcher is a power fastball guy. He has not thrown a breaking ball in two innings. Your body is loaded early, stride foot down, hands loaded. Ball leaves his hand.",
      "wonder": "He throws a curveball that breaks sharply down and in. Your body is fully loaded for fastball. What happens now?",
      "reveal": "Your eyes picked up the break. Your body is committed to fastball timing but your mental trigger did not fire because the pitch shape said no. If you saw the spin early enough, you held — contact with a rushed curveball produces weak roll-overs. If you saw it late, you took a bad swing. The key is training your eyes to read the break before your barrel commits."
    },
    {
      "type": "choice",
      "prompt": "2-0 count. You are loaded for fastball. Pitcher throws a curveball that starts at your eyes and breaks to knee-high outer third. Your load is complete. What is the right outcome?",
      "options": [
        {
          "id": "A",
          "text": "Fire the swing — your body was committed and the pitch is a strike",
          "feedback": "Firing on a curveball with fastball timing produces a pulled groundout or a late roll-over at best. Your body was committed but your eyes should override the trigger when spin reads breaking ball.",
          "correct": false
        },
        {
          "id": "B",
          "text": "Read the spin early and hold — take the called strike",
          "feedback": "Correct. 2-0 is a gift count but not a free-swing count. If the pitch broke out of your damage zone, taking it and going to 2-1 is a disciplined win. Early spin read overrides the loaded body.",
          "correct": true
        },
        {
          "id": "C",
          "text": "Check swing and try to foul it off",
          "feedback": "A check swing on a breaking ball when you were fastball-loaded is a panic response. Read the spin early so the decision is clean — full hold or full swing, not a halfway hack.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "FASTBALL READY ADJUST LATE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['fastball-ready','offspeed-recognition','load-timing','spin-read'],
  true
),

(
  gen_random_uuid(),
  'HSP_007',
  'hitter-specialty',
  'hitter-specialty',
  'Offspeed Recognition',
  'Read spin and arm slot to identify offspeed pitches at the hand.',
  'intermediate',
  140,
  22,
  7,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Spin reads happen at the hand — not the plate",
      "body": "By the time an offspeed pitch shows you its full break, it is too late to hold. The decision to take a curveball happens when you see the wrist turn early, the arm slot drop slightly, or the tunnel break — not when the ball reaches knee-high. Train your read to the first 15 feet."
    },
    {
      "type": "notice_wonder",
      "notice": "0-1 count. Pitcher has thrown two fastballs to you already. This pitch: his arm slot drops two inches from his normal three-quarter delivery. The ball leaves his hand with a different grip pressure.",
      "wonder": "What does the dropped arm slot and grip change tell you before the ball travels 20 feet?",
      "reveal": "Dropped arm slot is one of the clearest offspeed tells in the game. Most curveballs and sliders come from a lower arm slot than the pitcher normal fastball delivery. Combined with early wrist turn or visible grip, that two-inch slot drop is a read you can act on. Sit and take."
    },
    {
      "type": "choice",
      "prompt": "0-1 count. You identified a dropped arm slot. Ball exits the hand and confirms spin — it is a slider breaking low and away. It catches the bottom of the zone. What is the correct play?",
      "options": [
        {
          "id": "A",
          "text": "Lay off — you identified offspeed, it went low and away, it is out of your damage zone",
          "feedback": "Correct. You read the slot, confirmed the spin, and the pitch ended up below your damage zone. Taking a borderline slider at 0-1 is a quality AB play — you extended the count with a disciplined take.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Attack it — it is technically in the zone",
          "feedback": "Low and away offspeed pitches in 0-1 counts are strikeout pitches. The pitcher wanted you to chase or roll over. You identified the pitch early — use that information and take it.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Swing late and try to go the other way",
          "feedback": "A late swing on an identified offspeed pitch below your damage zone is guessing, not adjusting. Your early read told you this was not your pitch.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "READ SPIN EARLY"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['offspeed-recognition','spin-read','arm-slot','pitch-identification'],
  true
),

(
  gen_random_uuid(),
  'HSP_008',
  'hitter-specialty',
  'hitter-specialty',
  'Middle-Away Plan',
  'Build a plan for the outer half and drive it the other way.',
  'intermediate',
  140,
  22,
  8,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Middle-away is where plate discipline lives",
      "body": "Pitchers attack the outer half because most hitters pull off it. A hitter with a middle-away plan stays back, lets the ball travel deeper, and drives it to the right side or up the middle. That plan turns a strikeout pitch into an extra-base hit."
    },
    {
      "type": "choice",
      "prompt": "1-2 count. Pitcher comes back with a fastball at the knees on the outer third — your back knee stays back, you let the ball travel. Where do you drive this ball?",
      "options": [
        {
          "id": "A",
          "text": "Drive it to right center — stay back, let it travel, inside-out swing",
          "feedback": "That is the play. Letting the ball travel to the outer third and driving it to right center is how you turn an outer half strike into a quality hit. You did not pull off the ball.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Pull it to the left side by rotating hard through contact",
          "feedback": "Pulling an outer half pitch requires you to reach for it and rotate early — the two mechanics that produce weak groundouts to second or lazy flies to left. Stay back and go the other way.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Lift it for a fly ball by getting under it early",
          "feedback": "Getting under an outer half pitch at the knees creates a weak pop-up on the right side or a foul ball. You need to drive through it with backspin, not loft it.",
          "correct": false
        }
      ]
    },
    {
      "type": "reflection",
      "prompt": "Think about the last time you got jammed or pulled off an outer half pitch. What physical adjustment would have kept you back?",
      "placeholder": "I should have kept my back knee in and let the ball get deeper..."
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "STAY BACK DRIVE MIDDLE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['away-pitch','oppo-approach','plate-coverage','stay-back'],
  true
),

(
  gen_random_uuid(),
  'HSP_009',
  'hitter-specialty',
  'hitter-specialty',
  'Ambush or Track',
  'Know when to attack the first pitch and when to gather information.',
  'intermediate',
  140,
  22,
  9,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "First pitch is not a freebie — it is an opportunity",
      "body": "An ambush count is when the data says the pitcher is likely to throw a fastball in your zone on the first pitch. High first-pitch strike rate, fastball heavy, no off-speed early — those are ambush conditions. A track count is when you need more information before you can commit."
    },
    {
      "type": "notice_wonder",
      "notice": "Leadoff at-bat, fourth inning. This starter has thrown a first-pitch fastball to 7 of the last 8 hitters. He is ahead in the count on 6 of them. You are a fastball hunter.",
      "wonder": "Is this an ambush situation or a track situation?",
      "reveal": "Ambush. High first-pitch fastball rate plus your fastball strengths equals a green light to hunt on 0-0. Your plan is fastball in your damage zone — if it arrives, you attack. If he throws a breaking ball first, you take and reset your plan for a new count."
    },
    {
      "type": "choice",
      "prompt": "0-0 count. Ambush conditions confirmed. Pitcher throws a fastball, belt-high, inner half — right in your damage zone. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Attack it — this is exactly the ambush pitch you planned for",
          "feedback": "Right call. You identified the ambush situation, had a plan, and the pitch matched it. Executing an ambush swing is the payoff for pre-pitch preparation.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Take it — you want to see another pitch before committing",
          "feedback": "If you have ambush conditions and your pitch arrives, taking it is wasted preparation. You did the work to identify the situation. Pull the trigger.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Foul it off and try to get deep into the count",
          "feedback": "A fouled ambush pitch is a missed opportunity. When your conditions are right and your pitch arrives on the first pitch, damage it.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "HUNT FIRST PITCH HARD"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['first-pitch','ambush','pitch-count-leverage','swing-take'],
  true
),

(
  gen_random_uuid(),
  'HSP_010',
  'hitter-specialty',
  'hitter-specialty',
  'Decision Speed',
  'Make the swing-or-take call before the ball hits the zone.',
  'intermediate',
  160,
  30,
  10,
  true,
  false,
  '[
    {
      "type": "spark",
      "headline": "The decision happens before the ball arrives",
      "body": "A quality swing decision is not made at the hitting zone — it is made in the first half of the pitch flight. Hitters who decide late produce check swings, weak contact, or called strikes on hittable pitches. Train your decision speed so the choice is made and locked before the ball reaches the front of the plate."
    },
    {
      "type": "notice_wonder",
      "notice": "2-2 count. Full AB, seven pitches. Pitcher is going to his out pitch — a slider he has used to get two strikeouts already today. You know it breaks down and away.",
      "wonder": "At what point in the pitch flight do you need your swing-or-take decision locked in?",
      "reveal": "The decision must be made no later than the ball crossing the midpoint between the mound and the plate. At the release point you read fastball or offspeed. By 20 feet you confirm spin direction. By 30 feet you have a yes or no. If you are still deciding at 40 feet, you are reacting, not deciding — and reactions produce bad contact."
    },
    {
      "type": "choice",
      "prompt": "2-2 count. Slider leaves the hand and you confirm the spin at 20 feet. It is breaking down and away, heading to the bottom of the zone. You have 0.12 seconds before it arrives. What is your decision?",
      "options": [
        {
          "id": "A",
          "text": "Take it — you read offspeed and it is heading to the low outside corner",
          "feedback": "Correct. You used your read window, identified the pitch, and recognized it was heading to the bottom edge of your damage zone. Taking a 2-2 slider low and away on a confirmed early read is a quality decision.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Protect and swing — it is 2-2 and you cannot afford a called third strike",
          "feedback": "Protect mode on 2-2 makes sense for borderline pitches. But if you identified the spin and confirmed the pitch is heading below your zone, swinging is the wrong read. Trust your early recognition.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Wait and see what the umpire calls",
          "feedback": "Waiting for the umpire is passive hitting. Your decision must be made before the ball arrives — not after the catcher catches it.",
          "correct": false
        }
      ]
    },
    {
      "type": "visualization",
      "content": "See the slider leaving the hand. See yourself read the wrist rotation at 20 feet. Confirm the break direction. Lock in the take at 30 feet. Watch it drop below the zone. Called ball three. You extended the AB with a clean read.",
      "cue": "EARLY OR NEVER"
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "COMMIT BEFORE THE ZONE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['decision-speed','swing-take','pitch-recognition','two-strike'],
  true
),

-- ── STAGE 3: ADVANCED (lessons 11–15) ───────────────────────────

(
  gen_random_uuid(),
  'HSP_011',
  'hitter-specialty',
  'hitter-specialty',
  'Two-Strike Shrink',
  'Adjust your zone and your swing with two strikes to stay alive.',
  'advanced',
  150,
  24,
  11,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Two strikes means one job: stay alive",
      "body": "Two-strike hitting is not about surrendering — it is about adjusting. Shorten the swing. Protect more of the plate. Give up the pull side and use the whole field. A two-strike hit is worth exactly the same as a 0-0 hit. Stay in the AB."
    },
    {
      "type": "checklist",
      "prompt": "Two-Strike Adjustments",
      "items": [
        "Widen your stance slightly for a more compact base",
        "Choke up on the bat one inch for better barrel control",
        "Expand coverage to the outer third — protect more zone",
        "Give up the pull side — go middle-away with any contact",
        "Stay short to the ball — no big load, no long swing"
      ]
    },
    {
      "type": "notice_wonder",
      "notice": "0-2 count. Pitcher gets ahead of you early. He has a wipeout slider that has ended four at-bats today. His go-to at 0-2 is a slider low and away.",
      "wonder": "Which half of the plate do you protect with two strikes?",
      "reveal": "Protect the outer half. Most strikeout pitches live low and away from right-handed pitchers. By widening your coverage to the outer half and keeping your hands inside the ball, you give yourself a chance to foul off or weakly contact the pitch you would normally miss. The goal is not a hit — the goal is the next pitch."
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "SHRINK ZONE TWO STRIKES"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['two-strike','zone-adjustment','compete-mode','plate-coverage'],
  true
),

(
  gen_random_uuid(),
  'HSP_012',
  'hitter-specialty',
  'hitter-specialty',
  'Foul It Tough',
  'Compete with two strikes by fouling off pitches you cannot drive.',
  'advanced',
  150,
  24,
  12,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "A foul ball with two strikes is a win",
      "body": "Every foul ball with two strikes is another pitch the pitcher has to throw. It raises his pitch count. It puts stress on his release. It forces him to go back into his arsenal. A tough foul ball is not a failure — it is a hard-earned extension of the at-bat."
    },
    {
      "type": "choice",
      "prompt": "2-2 count. Pitcher throws a slider at the knees, outer third — the pitch you cannot drive. What is the correct two-strike response?",
      "options": [
        {
          "id": "A",
          "text": "Swing hard and try to drive it for a hit",
          "feedback": "Swinging hard at a two-strike slider you cannot drive produces a weak groundout or a swing-and-miss. Your goal at 2-2 is to stay alive first, damage second.",
          "correct": false
        },
        {
          "id": "B",
          "text": "Shorten up and foul it back to buy another pitch",
          "feedback": "Correct. A short, controlled swing that fouls the slider back is a win. You added a pitch to his count and kept the AB alive. Now he has to make another decision.",
          "correct": true
        },
        {
          "id": "C",
          "text": "Take it and hope the umpire calls it a ball",
          "feedback": "Taking a borderline two-strike pitch is a passive choice that ends the AB if it catches any part of the zone. With two strikes, protect. Do not take.",
          "correct": false
        }
      ]
    },
    {
      "type": "reflection",
      "prompt": "When you are in a 0-2 or 1-2 count, what one physical adjustment do you make to improve your ability to foul off the tough pitch?",
      "placeholder": "I choke up, widen my stance, and try to shorten my path to the ball..."
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "FOUL IT STAY ALIVE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['two-strike','foul-ball','compete-mode','pitch-count'],
  true
),

(
  gen_random_uuid(),
  'HSP_013',
  'hitter-specialty',
  'hitter-specialty',
  'Post-K Reset',
  'Flush the strikeout fast and carry a useful cue into the next AB.',
  'advanced',
  150,
  24,
  13,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "A strikeout is already over the moment it ends",
      "body": "The strikeout happened. You cannot change it. What you control is what happens in the next 90 seconds — how you process it, what adjustment you identify, and what cue you carry into your next at-bat. Hitters who flush fast hit better in the next AB."
    },
    {
      "type": "notice_wonder",
      "notice": "You just struck out looking on a 2-2 fastball that caught the inner corner. The umpire rang you up. You thought it was outside. The dugout is quiet. Your next at-bat is three innings away.",
      "wonder": "What do you do in the next 60 seconds?",
      "reveal": "Step out of the box. Take one breath. Identify one mechanical thing: did you pull off it? Did you guess offspeed? Were your eyes late to the release point? Name it, own it, let it go. When you sit down in the dugout, write it in your memory or your wristband. That is the adjustment for next AB. Then you are done thinking about this at-bat."
    },
    {
      "type": "reflection",
      "prompt": "After a strikeout, what is the one question you ask yourself before moving on?",
      "placeholder": "Was my read late? Did I pull off the pitch? Did I guess wrong on the count?"
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "FLUSH IT NEXT PITCH"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['post-k-reset','mental-reset','between-ab','composure'],
  true
),

(
  gen_random_uuid(),
  'HSP_014',
  'hitter-specialty',
  'hitter-specialty',
  'Pattern Recall',
  'Use what you saw in earlier at-bats to predict the pitcher next sequence.',
  'advanced',
  150,
  24,
  14,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Every at-bat builds your database",
      "body": "A pitcher who gets you out in the second inning is already showing you how he will attack you in the fifth. Pitchers repeat sequences, especially when they got the result they wanted. Your job is to remember what he did and adjust before you step back in."
    },
    {
      "type": "notice_wonder",
      "notice": "Third at-bat against the same starter. First AB: FB-FB-CB, you grounded out on the curveball at 1-1. Second AB: FB-CB-FB, you struck out on a slider at 2-2. He has used a first-pitch fastball both times.",
      "wonder": "What pattern do you predict for this third at-bat and what lane do you hunt?",
      "reveal": "He starts with fastballs. He went to the curveball when ahead at 1-0 or 1-1 in both ABs. This AB he will likely start with a fastball and go offspeed once he is ahead. Your plan: hunt the fastball in your zone on the first or second pitch, take the offspeed if it comes early."
    },
    {
      "type": "checklist",
      "prompt": "Pattern Recall Checklist",
      "items": [
        "Recall his first pitch in your first AB — fastball or offspeed?",
        "Which pitch got you out — what count was it?",
        "What pitch does he go to at 1-1 or 2-1?",
        "Has he set you up the same way twice?",
        "Adjust your hunt zone based on what he repeats"
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "RECALL ADJUST ATTACK"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['pattern-recall','pitcher-tendencies','between-ab','pitch-recognition'],
  true
),

(
  gen_random_uuid(),
  'HSP_015',
  'hitter-specialty',
  'hitter-specialty',
  'Three AB Simulation',
  'Execute a full game plan across three simulated at-bats against the same pitcher.',
  'advanced',
  210,
  40,
  15,
  false,
  true,
  '[
    {
      "type": "spark",
      "headline": "Three chances. Read. Adjust. Compete.",
      "body": "A quality game against one starter requires patience in the first AB, adjustment in the second, and execution in the third. This simulation runs you through all three. Your job is to carry what you learned and act on it."
    },
    {
      "type": "notice_wonder",
      "notice": "First AB against this starter. He opens with a fastball away. You take. Then a curveball at 1-1 that you chase for strike two. He closes you out with a fastball at 2-2 inner half. You ground out. You saw FB away, CB, FB inside.",
      "wonder": "Walking to the plate for your second AB, what one pattern adjustment do you make?",
      "reveal": "He went FB away, CB, FB inside. In the second AB you are sitting FB inner half earlier in the count. If he goes CB at 0-1 or 1-0, you take it — you are looking for the inner half fastball to ambush. He got you out in the first AB but you built a database."
    },
    {
      "type": "choice",
      "prompt": "Second AB, 1-0 count. You are hunting fastball inner half. He throws a fastball outer third at the belt — in the zone, not your lane. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Take it — missed your lane, go to 2-0",
          "feedback": "Correct. You are locked to inner half. He threw outer half. Taking this and going to 2-0 keeps your plan intact. In a 2-0 count you may expand your lane.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Swing it because it is in the zone and 1-0 is a hitter count",
          "feedback": "Hitter count does not mean swing at everything in the zone. Your lane was inner half for a reason — you identified his tendency. Abandoning your plan on a 1-0 pitch outside your lane breaks the rep.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Check swing in case it breaks",
          "feedback": "Check swings on identified fastballs outside your lane are the worst outcome — you got neither a take nor a quality swing.",
          "correct": false
        }
      ]
    },
    {
      "type": "choice",
      "prompt": "Third AB, 1-2 count. He goes to his curveball — it breaks down to your shoelaces, outside corner. You are two-strike competing. What is the correct play?",
      "options": [
        {
          "id": "A",
          "text": "Protect and foul it off — the pitch is out of your damage zone",
          "feedback": "Correct. Two-strike mode means protect when the pitch goes low and away. You recognized the curveball, shortened your swing, and fouled it back. The AB continues.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Attack it — third AB you need to make something happen",
          "feedback": "Urgency is not a hitting plan. A curveball at your shoelaces outside produces a weak swing-and-miss or a bad groundout. Protect first.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Take it — hope the umpire misses it",
          "feedback": "With two strikes, passive takes end at-bats. If it catches any part of the zone, you are done. Protect the pitch you cannot drive.",
          "correct": false
        }
      ]
    },
    {
      "type": "visualization",
      "content": "See the next pitch after you fouled off the curveball. He comes back with the fastball inner half — the pitch you identified in the first AB. You are locked. You attack it and drive it to right center. Three ABs of preparation. One moment of execution.",
      "cue": "PLAN THEN EXECUTE"
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "SEE IT DECIDE ATTACK"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder'],
  ARRAY['full-game-sim','pattern-recall','two-strike','swing-decision','pitch-recognition'],
  true
);

COMMIT;
