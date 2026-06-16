-- ============================================================
-- CLUTCHR BATCH 05 — WORLD 2: LEADOFF MENTALITY (LOM)
-- 15 lessons | pillar: leadoff-mentality | unit: leadoff-mentality
-- Covers: first AB plans, on-deck scouting, pitch counts, walks,
--         seeing pitcher patterns, getting on base, starting rallies
-- ============================================================

BEGIN;

DELETE FROM public.legacy_lessons_staging
WHERE legacy_lesson_id LIKE 'LOM_%';

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
  'LOM_001',
  'leadoff-mentality',
  'leadoff-mentality',
  'First Look Has Value',
  'Every pitch you see in your first at-bat builds information for the game.',
  'beginner',
  120,
  20,
  1,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Your first at-bat is a scouting mission",
      "body": "Even if you make out in your first at-bat, you have gathered data. You confirmed the arm slot. You saw the fastball velocity. You tracked how his curveball breaks. A leadoff hitter who treats every pitch as information — not just something to hit — is more dangerous in the third inning than the first."
    },
    {
      "type": "notice_wonder",
      "notice": "You are leading off the game. First pitch from the starter — ball one, low. He threw a fastball at 91 mph that ran away from you. You saw the release point clearly. Second pitch — curveball at 1-0 that broke down from twelve to six.",
      "wonder": "You made out on a groundball. What did you earn from this at-bat?",
      "reveal": "You confirmed velocity at 91. You saw the curveball break — twelve-to-six, drops sharply at the end. You tracked his arm slot at three-quarters. The next hitter can use this. The next time you face him, you know his fastball runs and his curve drops late. That is a full scouting report in two pitches."
    },
    {
      "type": "checklist",
      "prompt": "First AB Information Checklist",
      "items": [
        "Confirm fastball velocity and movement direction",
        "Note the arm slot — three-quarters, over the top, or sidearm",
        "Track the first offspeed pitch — does it break early or late?",
        "Watch his tempo — fast worker or slow and deliberate?",
        "Share one data point with the next hitter when you return to the dugout"
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "EVERY PITCH HAS VALUE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['first-ab','scouting','pitcher-read','leadoff-approach'],
  true
),

(
  gen_random_uuid(),
  'LOM_002',
  'leadoff-mentality',
  'leadoff-mentality',
  'On-Deck Scout',
  'Use your time in the on-deck circle to gather intel before you step in.',
  'beginner',
  120,
  20,
  2,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "The on-deck circle is your film room",
      "body": "While you are on deck, the pitcher is showing you everything. His first pitch tendency. His go-to breaking ball in fastball counts. Whether he nibbles or attacks. You have 30 to 60 seconds of live data before you step in. Use it."
    },
    {
      "type": "checklist",
      "prompt": "On-Deck Scouting Checklist",
      "items": [
        "Watch two full pitches and note arm slot and first-pitch pitch type",
        "Confirm his primary fastball location — away, up, or in?",
        "See if his offspeed breaks early or tunnels deep before moving",
        "Track his tempo between pitches — rushed or deliberate?",
        "Walk to the plate with one specific thing you will attack"
      ]
    },
    {
      "type": "reflection",
      "prompt": "The most useful thing you can confirm while on deck is one actionable data point about the pitcher. What is that one thing for you?",
      "placeholder": "I always try to confirm his first-pitch tendency and whether his breaking ball stays in the zone..."
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "SCOUT BEFORE THE BOX"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['on-deck','pre-ab-routine','scouting','pitch-recognition'],
  true
),

(
  gen_random_uuid(),
  'LOM_003',
  'leadoff-mentality',
  'leadoff-mentality',
  'First Pitch Intent',
  'Walk to the plate knowing exactly what you will do with the first pitch.',
  'beginner',
  120,
  20,
  3,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Walk to the plate with a decision already made",
      "body": "Most hitters have no plan for the first pitch. The best leadoff hitters have already decided: attack it if it is in my zone, take it if it is not. The decision is not made in the box — it is made on deck. Walk in with intent."
    },
    {
      "type": "notice_wonder",
      "notice": "You are leading off the third inning. On deck, you watched the pitcher throw first-pitch fastballs to the last three hitters — two for strikes, one for a ball that ran out of the zone. His first-pitch fastball rate is north of 60 percent.",
      "wonder": "What is your first-pitch plan before you step in?",
      "reveal": "You are looking for a first-pitch fastball in your damage zone. If it arrives, you attack. If he throws a breaking ball first, you take and reset for 1-0. You are not guessing — you are deciding. The data you collected on deck made the decision before the pitch."
    },
    {
      "type": "choice",
      "prompt": "0-0 count. First pitch. Pitcher throws a fastball, belt-high, inner third — matches your first-pitch plan exactly. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Attack it — your plan said fastball inner half, this is it",
          "feedback": "Correct. You prepared, the pitch matched your plan, and you executed. First-pitch intent pays off when you see your pitch and pull the trigger.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Take it — you always want to see one pitch first",
          "feedback": "Taking your planned pitch negates the preparation you did on deck. If your data said first-pitch fastball and it arrived, passing it is wasted work.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Bunt it for a hit since you are the leadoff man",
          "feedback": "Bunting a belt-high inner half fastball wastes one of the best damage pitches you will see in the at-bat. Attack first, bunt is a separate plan.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "FIRST PITCH WITH PURPOSE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['first-pitch','pre-ab-plan','leadoff-approach','intent'],
  true
),

(
  gen_random_uuid(),
  'LOM_004',
  'leadoff-mentality',
  'leadoff-mentality',
  'Make Him Work',
  'Forcing a deep count adds pressure and opens the game for your team.',
  'beginner',
  120,
  20,
  4,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Deep counts change the game for nine",
      "body": "A leadoff hitter who works deep counts forces the pitcher to throw more pitches, taxes his arm earlier, and pushes the bullpen into action sooner. A six-pitch at-bat that ends in a groundout is more valuable than a two-pitch lineout. Grinding is a skill."
    },
    {
      "type": "choice",
      "prompt": "0-1 count. Pitcher comes back with a fastball just off the outer corner — borderline, likely a ball. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Take it — it is a borderline pitch and you are working the count",
          "feedback": "Correct. Taking a borderline pitch at 0-1 and going to 1-1 extends the AB and adds to his pitch count. You are making him work.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Protect and swing — it might be called a strike",
          "feedback": "Protecting borderline pitches early in the count is a two-strike adjustment, not an 0-1 adjustment. Trust your eye and take the ball.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Swing hard to put it in play and move on",
          "feedback": "Putting a borderline 0-1 pitch in play on a swing that was not planned reduces your chance of a deep AB. Work the count.",
          "correct": false
        }
      ]
    },
    {
      "type": "reflection",
      "prompt": "What is the minimum pitch count you want to reach before ending an at-bat? What tells you when to stop grinding and attack?",
      "placeholder": "I try to see at least four or five pitches before I give up the AB..."
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "MAKE HIM THROW SIX"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['pitch-count','deep-counts','leadoff-approach','grinding'],
  true
),

(
  gen_random_uuid(),
  'LOM_005',
  'leadoff-mentality',
  'leadoff-mentality',
  'Set The Table',
  'Your job as a leadoff hitter is to get on base — not to score.',
  'beginner',
  150,
  30,
  5,
  true,
  false,
  '[
    {
      "type": "spark",
      "headline": "Your job is not to score. It is to get on.",
      "body": "Leadoff hitters who try to do too much swing at bad pitches, expand their zone, and give away at-bats. The job is simpler than that: get on base and let your lineup do the rest. Get on. Set the table."
    },
    {
      "type": "notice_wonder",
      "notice": "Game tied in the fifth inning. You are leading off the inning. The starter is still dealing but his pitch count is climbing. He has walked two hitters this inning alone.",
      "wonder": "What is your exact approach before you step in?",
      "reveal": "He is throwing strikes but his control is tightening. Your plan: be patient, see at least four pitches, and do not expand your zone. If he nibbles, let him. A walk here puts pressure on a starter who is already feeling it. Your job is not a double — your job is a baserunner."
    },
    {
      "type": "choice",
      "prompt": "3-2 full count, two outs. Pitcher throws a pitch at the knees away — borderline. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Take it — borderline pitches at 3-2 lean toward ball, especially away",
          "feedback": "Correct. A borderline 3-2 pitch away at the knees is a walk if the umpire is consistent. Trusting your eye in a walk situation is part of the leadoff job.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Protect and swing — it might catch the corner",
          "feedback": "Protecting a 3-2 borderline pitch away and down is often the right move with two outs. But if you are a disciplined leadoff hitter with good feel for the zone, trusting the take on a questionable pitch is acceptable.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Swing hard — you need to drive it and score a run",
          "feedback": "Swinging hard at a knee-high away pitch on 3-2 is expanding your zone. That is the definition of the pitch the pitcher wants you to chase.",
          "correct": false
        }
      ]
    },
    {
      "type": "checklist",
      "prompt": "Set the Table Checklist",
      "items": [
        "Know the outs and score before you step in",
        "Have a pitch to attack — do not be passive, be selective",
        "Do not expand the zone in the first two strikes",
        "Walk equals pressure — accept the free pass",
        "Get on base any way available: hit, walk, error, HBP"
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "GET ON SET TABLE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['on-base','leadoff-approach','zone-discipline','setting-table'],
  true
),

-- ── STAGE 2: INTERMEDIATE (lessons 6–10) ────────────────────────

(
  gen_random_uuid(),
  'LOM_006',
  'leadoff-mentality',
  'leadoff-mentality',
  'Green Light or Deep Count',
  'Know when the count tells you to attack and when to grind.',
  'intermediate',
  140,
  22,
  6,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Not every at-bat needs a full count",
      "body": "A 3-0 green light exists because the count guarantees a fastball in the zone. A 2-0 hitter count is almost as valuable. But grinding to a full count costs pitches on your side too — a 3-2 swing on a pitcher pitch you had to protect is not ideal. Know when to attack the count and when to extend it."
    },
    {
      "type": "notice_wonder",
      "notice": "3-0 count. Coach flashes the green light. Pitcher is behind all day and has been throwing fastballs in the zone at 3-0 to avoid walking the leadoff man.",
      "wonder": "What are the only conditions that justify swinging at a 3-0 pitch?",
      "reveal": "Two conditions: first, the green light is given. Second, the pitch is in your damage zone. Green light does not mean swing at a pitch in the dirt. It means hunt your pitch in your zone and attack it if it arrives. A 3-0 pitch below the knees is still a take."
    },
    {
      "type": "choice",
      "prompt": "3-0 count. Green light. Pitcher throws a fastball belt-high, inner half. This is your pitch. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Attack it — green light, your zone, your pitch",
          "feedback": "Correct. Green light plus your damage zone equals attack. This is the situation the 3-0 green light was built for.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Take it and walk — the walk is more valuable than the swing",
          "feedback": "With green light and your pitch in the zone, passing it up is leaving a damage opportunity on the table. Take the walk if the pitch misses your zone — not if it hits it.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Bunt it for a leadoff single",
          "feedback": "Bunting a 3-0 fastball inner half wastes one of the best pitch counts in the game. Attack damage pitches in hitter counts.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "GREEN LIGHT SWING HARD"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['count-leverage','green-light','hitter-counts','attack-vs-grind'],
  true
),

(
  gen_random_uuid(),
  'LOM_007',
  'leadoff-mentality',
  'leadoff-mentality',
  'Walk Equals Pressure',
  'A leadoff walk disrupts the pitcher rhythm and puts the defense on edge.',
  'intermediate',
  140,
  22,
  7,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Walks put the defense on edge",
      "body": "A leadoff walk forces every infielder to move. It changes the pitching strategy. It adds a pressure variable that a pitcher who is getting outs cleanly does not want. A walk from the leadoff spot is not a lucky outcome — it is a disciplined win that changes the inning before a pitch is thrown to the next hitter."
    },
    {
      "type": "notice_wonder",
      "notice": "1-0 count. Pitcher throws two pitches outside the zone. You take both. The count is 2-0. He is behind and nibbling. Every infielder is watching. The pitcher is rattled.",
      "wonder": "Is taking these pitches passive or disciplined?",
      "reveal": "Disciplined. You did not chase pitches outside your zone. You forced a 2-0 count that now puts the pitcher in a spot where he must throw a strike or give you a walk. His next pitch has to be in the zone — and you are waiting for it. That is lead-off pressure applied correctly."
    },
    {
      "type": "reflection",
      "prompt": "How do you stay mentally engaged and ready to attack during a patient at-bat when you are taking pitches?",
      "placeholder": "I keep my load active, stay in my stance, and remind myself the next pitch could be my pitch..."
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "A WALK SCORES RUNS"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['walk','plate-discipline','leadoff-approach','patience'],
  true
),

(
  gen_random_uuid(),
  'LOM_008',
  'leadoff-mentality',
  'leadoff-mentality',
  'Start The Run Game',
  'Get on base, then be an immediate threat on the bases.',
  'intermediate',
  140,
  22,
  8,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Get on base — then make noise",
      "body": "A leadoff hitter who gets on base and does nothing with it has done half the job. Once you are on first, you are a run-scoring threat. Your secondary lead, your jump, your read on the pitcher tempo — all of it matters. Get on and then force the defense to deal with you."
    },
    {
      "type": "choice",
      "prompt": "You are on first, no outs, 2-2 count on the batter. The pitcher has a slow delivery to the plate — over 1.4 seconds. What is your baserunning play?",
      "options": [
        {
          "id": "A",
          "text": "Get a maximum secondary lead and steal on a pitch that the catcher blocks",
          "feedback": "A 1.4-second delivery is a steal situation. Aggressive secondary read and a steal attempt on a blocked pitch or passed ball is the correct aggressive play.",
          "correct": false
        },
        {
          "id": "B",
          "text": "Take your secondary lead and steal on the first chance — his delivery time gives you a free base",
          "feedback": "Correct. Anything over 1.3 seconds to the plate with a standard catcher pop time gives you a meaningful advantage to steal. With no outs and a 2-2 count, going now protects the runner from a double play.",
          "correct": true
        },
        {
          "id": "C",
          "text": "Stay close and take no chances — the hitter should drive you in",
          "feedback": "Passive baserunning on a slow delivery wastes an advantage. You are a leadoff man. Force the defense to pay attention to you.",
          "correct": false
        }
      ]
    },
    {
      "type": "checklist",
      "prompt": "First-to-Second Steal Checklist",
      "items": [
        "Confirm pitcher delivery time — over 1.3 seconds is a go",
        "Check catcher arm strength during warm-ups",
        "Get your maximum primary lead without getting picked off",
        "Read the first move — if pitcher hesitates, you go",
        "Commit on the back foot coming down — no hesitation mid-steal"
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "GET ON THEN MOVE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['baserunning','stolen-base','first-to-second','run-game'],
  true
),

(
  gen_random_uuid(),
  'LOM_009',
  'leadoff-mentality',
  'leadoff-mentality',
  'Read Tempo From The Box',
  'A fast-working pitcher disrupts hitter timing — here is how to slow him down.',
  'intermediate',
  140,
  22,
  9,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "The pitcher is trying to own your clock",
      "body": "A fast-tempo pitcher rushes hitters out of their routine, shortens their decision window, and creates defensive swings before you are ready. Your job is to recognize the tempo and reset it. You control when you step in. You control the clock."
    },
    {
      "type": "notice_wonder",
      "notice": "Pitcher is working fast — fielding a groundout, getting the ball back, and delivering in under 12 seconds. Three hitters in a row have swung early and produced weak contact. You are next.",
      "wonder": "What do you do before stepping into the box to counter his fast tempo?",
      "reveal": "Step out or delay stepping in. Take one breath. Reset your routine. Look at your hands, look at your target, step in only when you are ready. He is trying to get you in the box before your clock is set. You are under no obligation to comply. Slow the game down on your terms."
    },
    {
      "type": "choice",
      "prompt": "Pitcher is working fast, 1-1 count, you feel rushed and your timing is off. What is the correct in-AB adjustment?",
      "options": [
        {
          "id": "A",
          "text": "Step out of the box between pitches to reset your breathing and timing",
          "feedback": "Correct. Stepping out legally between pitches is the most direct way to break a fast-tempo pitcher rhythm and recenter your own clock. Use it.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Match his pace and swing faster to stay on time",
          "feedback": "Matching a fast-tempo pitcher on his terms is exactly what he wants. Your mechanics speed up, your decisions shorten, and your contact quality drops.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Call time and walk toward first base to protest",
          "feedback": "Calling time once is legal and effective. Walking toward first base is not an option. Step out, breathe, reset, and step back in.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "TEMPO TELLS YOUR TIMING"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['tempo','fast-worker','in-ab-adjustment','routine'],
  true
),

(
  gen_random_uuid(),
  'LOM_010',
  'leadoff-mentality',
  'leadoff-mentality',
  'Leadoff Plan',
  'Build a complete at-bat plan before stepping in as the leadoff hitter.',
  'intermediate',
  160,
  30,
  10,
  true,
  false,
  '[
    {
      "type": "spark",
      "headline": "Walk to the plate with a complete plan",
      "body": "A leadoff plan is not complicated. It has three parts: a pitch to hunt, a count to start grinding in, and a zone floor you will not go below. Three things. Locked before you step in. That plan replaces panic when the count gets tough."
    },
    {
      "type": "notice_wonder",
      "notice": "You are leading off the fourth inning. Game tied. You have faced this starter twice. First AB: walked him on five pitches. Second AB: grounded out on a fastball inner half at 2-1. He is now mixing his curveball early.",
      "wonder": "What is your complete leadoff plan for this third at-bat?",
      "reveal": "You know: fastball first-pitch tendency is real. He went CB early in the second AB after the walk. In this AB, you take the first pitch regardless — see if he goes CB early again. If it is a fastball in your zone at 1-0, you attack. If he goes to 2-0, you are hunting a fastball in your damage zone on the next pitch. Your floor is the middle of the plate — nothing below the knees or off the black."
    },
    {
      "type": "choice",
      "prompt": "1-0 count. Fastball comes in belt-high outer third. It is in your zone and matches your plan. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Attack it — your plan said fastball in your zone at 1-0, this is it",
          "feedback": "Correct. You built the plan, the pitch matched it, and you executed. This is what pre-AB preparation creates: clean, confident swings in the right situation.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Take it — you want to grind and get to a deeper count",
          "feedback": "Grinding is a good tactic but not when your pitch is in your zone on your count. Your plan built to 1-0 — that is the attack count you were waiting for.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Bunt it down the third base line since the infield is back",
          "feedback": "Bunting a fastball in your damage zone at 1-0 discards the plan you built. Attack damage pitches in hitter counts — bunt is a separate pre-at-bat plan.",
          "correct": false
        }
      ]
    },
    {
      "type": "visualization",
      "content": "See yourself stepping in with your three-part plan locked. Pitch to hunt. Count to grind from. Zone floor. When the pitch arrives in your zone, your swing fires without hesitation. You are on first base. The inning is open.",
      "cue": "ON BASE CHANGES GAME"
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "LEAD OFF WITH PLAN"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['pre-ab-plan','leadoff-approach','hunt-zone','at-bat-structure'],
  true
),

-- ── STAGE 3: ADVANCED (lessons 11–15) ───────────────────────────

(
  gen_random_uuid(),
  'LOM_011',
  'leadoff-mentality',
  'leadoff-mentality',
  'Down One Late',
  'Leading off late in a close game means getting on base is the entire job.',
  'advanced',
  150,
  24,
  11,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Down one late is not a crisis — it is your job",
      "body": "Your team is down one run in the seventh inning and you are leading off. The instinct is to expand your zone, chase something extra, or go for a home run. The job is simpler: get on. A leadoff runner down one in the seventh changes everything."
    },
    {
      "type": "notice_wonder",
      "notice": "Seventh inning. Down 1-0. You are leading off. The closer has just entered. He throws 95 and uses a hard slider. You have not seen him before.",
      "wonder": "How does your approach change — or not change — against a reliever you have never faced?",
      "reveal": "Your approach does not change. You still need to get on base. The one adjustment: sit fastball until you have seen the slider once. His velocity is high so your timing needs to be early. Take the first pitch if possible to confirm the slot. After that, hunt fastball in your zone and protect everything else."
    },
    {
      "type": "choice",
      "prompt": "0-0 count. You decided to take the first pitch. Closer throws a 95 mph fastball right down the middle — called strike. What do you do at 0-1?",
      "options": [
        {
          "id": "A",
          "text": "Attack the next fastball — you got the timing read you needed, now hunt",
          "feedback": "Correct. You took the first pitch and confirmed the velocity and slot. Now you are locked in. If he throws another fastball in your zone, your timing is set and you attack.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Protect everything — you are behind in the count now",
          "feedback": "0-1 is not a two-strike count. Protect mode at 0-1 turns aggressive ABs into passive ones. You are not in danger yet.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Expand your zone — the team needs you to get on and you are behind",
          "feedback": "Expanding your zone at 0-1 against a reliever throwing 95 produces weak swings on his terms. Stay disciplined. Get your pitch.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "GET ON DOWN ONE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['late-inning','close-game','leadoff-approach','new-pitcher'],
  true
),

(
  gen_random_uuid(),
  'LOM_012',
  'leadoff-mentality',
  'leadoff-mentality',
  'After First AB Failure',
  'Reset your approach after a poor first at-bat and carry a useful adjustment.',
  'advanced',
  150,
  24,
  12,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "One bad at-bat does not define the game",
      "body": "You chased a first-pitch breaking ball and grounded out weakly. That is one at-bat. The next one starts fresh — but not from zero. You learned something. What pitch did you chase? What adjustment does the next at-bat require? One correction makes the second at-bat better."
    },
    {
      "type": "reflection",
      "prompt": "You just grounded out weakly on a first-pitch breaking ball that was two inches below your zone. What is the one adjustment you carry into your next at-bat?",
      "placeholder": "I will take the first pitch next AB and not expand below my zone on pitch one..."
    },
    {
      "type": "choice",
      "prompt": "Second at-bat. You are reminding yourself: take the first pitch, do not chase low breaking balls. 0-0 count, pitcher throws a fastball right down the middle for strike one. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Take it — your plan was to see the first pitch and this was it",
          "feedback": "You followed your plan. But taking a fastball down the middle is only correct if your plan was specifically to take one pitch. Taking a hittable first pitch just because you want to see something is not discipline — it is passivity. Know the difference.",
          "correct": false
        },
        {
          "id": "B",
          "text": "Attack it — patience does not mean taking strikes in your damage zone",
          "feedback": "Correct. Your adjustment was to not chase low breaking balls early — not to take every first pitch. A fastball down the middle is not a breaking ball below the zone. Attack it.",
          "correct": true
        },
        {
          "id": "C",
          "text": "Look for the breaking ball because you expect him to repeat his pattern",
          "feedback": "Sitting breaking ball when you are behind 0-1 from a taken strike is reactive hitting. Use your adjustment smartly — take the fastball in your zone, not the breaking ball below it.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "NEXT AB STARTS NOW"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['between-ab','adjustment','post-ab-reset','self-correction'],
  true
),

(
  gen_random_uuid(),
  'LOM_013',
  'leadoff-mentality',
  'leadoff-mentality',
  'Dugout Intel Carryover',
  'Use what your teammates saw against the pitcher to sharpen your next at-bat.',
  'advanced',
  150,
  24,
  13,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Your teammates are your eyes between at-bats",
      "body": "While you are sitting in the dugout, your teammates are adding to the database. The third hitter just got jammed on an inside fastball. The five-hole hitter struck out on a 1-2 slider away. That is two data points you did not have after your last at-bat. Use them."
    },
    {
      "type": "checklist",
      "prompt": "Dugout Intel Transfer Checklist",
      "items": [
        "Watch the at-bat before yours with a specific question in mind",
        "Note which pitch got the previous hitter out — count and location",
        "Ask one quick question to the hitter returning from the on-deck circle",
        "Update your hunt zone based on what the team is seeing",
        "Walk to the plate with updated information, not just your own"
      ]
    },
    {
      "type": "notice_wonder",
      "notice": "Two hitters before you, the two-hole man struck out on a 1-2 curveball low and away. One hitter before you, the three-hole man did the same. This pitcher has used a curveball to end three of the last four at-bats.",
      "wonder": "What does this pattern tell you and how do you adjust?",
      "reveal": "He is going to the curveball in 1-2 counts to close out at-bats. In your at-bat, if the count reaches 1-2, you are expecting the curveball low and away. You either protect and foul it off or, if it is the right one, recognize it early and sit on it. Your teammates handed you the out pitch for free."
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "CARRY WHAT THEY SAW"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['dugout-intel','pattern-recognition','team-scouting','between-ab'],
  true
),

(
  gen_random_uuid(),
  'LOM_014',
  'leadoff-mentality',
  'leadoff-mentality',
  'Pressure Leadoff AB',
  'Step into a high-stakes leadoff at-bat with one clear physical cue.',
  'advanced',
  150,
  24,
  14,
  false,
  false,
  '[
    {
      "type": "spark",
      "headline": "Pressure is not an emergency — it is information",
      "body": "Your heart rate is up. The crowd is loud. This at-bat matters. That is pressure, and it is normal. What you do with pressure is the variable. The hitters who succeed in big moments are not calmer than everyone else — they have a physical cue that grounds them before the pitch arrives."
    },
    {
      "type": "notice_wonder",
      "notice": "Championship game. First inning. You are leading off. Every coach, parent, scout, and teammate is watching. The pitcher is an ace who throws 94. The crowd is loud.",
      "wonder": "What do you do in the five seconds before you step into the box?",
      "reveal": "One breath out — long exhale. One look at your hands. One reminder of your plan: fastball inner half, take the first pitch if it is not there. Step in only when you are ready. The crowd does not hit. The noise does not hit. You do. Step in on your terms."
    },
    {
      "type": "choice",
      "prompt": "2-2 count in a pressure at-bat. Pitcher throws a hard slider at the knees on the outer third. Your body is tense. What is the correct physical and mental response?",
      "options": [
        {
          "id": "A",
          "text": "Protect and foul it off with a short swing — you are two-strike competing",
          "feedback": "Correct. 2-2 in a pressure at-bat does not change the fundamental: protect the outer third at the knees. Short swing, try to foul it back. Stay in the at-bat.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Swing hard because you need to do something big with the game on the line",
          "feedback": "Big-game swings on slider at the knees produce big strikeouts. The game being on the line does not change what the right swing is.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Take it hoping the umpire calls it a ball",
          "feedback": "Passive takes at 2-2 end at-bats. Protect slider at the knees. You have the ability to foul it off — use it.",
          "correct": false
        }
      ]
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "COMPETE SET THE TONE"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['pressure-ab','composure','pre-pitch-routine','big-game'],
  true
),

(
  gen_random_uuid(),
  'LOM_015',
  'leadoff-mentality',
  'leadoff-mentality',
  'Start The Rally',
  'Execute a full game-situation leadoff AB with full plan and adjustment.',
  'advanced',
  210,
  40,
  15,
  false,
  true,
  '[
    {
      "type": "spark",
      "headline": "One player can change the inning",
      "body": "Eighth inning. Down one run. You are the leadoff hitter stepping in against a reliever who has been sharp. Three hitters have gone down in order this inning. You have watched four of his pitches from the dugout. You are not walking in blind."
    },
    {
      "type": "notice_wonder",
      "notice": "Eighth inning. Down 2-1. Leadoff spot. Reliever has thrown FB-slider-slider to retire the last two hitters. His slider is breaking early and off the plate — hitters are chasing it. His fastball has been in the zone.",
      "wonder": "What is your game plan before you step in?",
      "reveal": "Sit fastball. The slider has been off the plate — you are not chasing it. Every hitter who chased his slider has been retired. You are hunting the fastball in your zone and laying off anything that breaks early. He has to throw the fastball — make him put it in your zone."
    },
    {
      "type": "choice",
      "prompt": "0-0 count. Reliever throws slider — it breaks early and misses off the plate outside. Confirmed: he is pitching to the pattern. You take it. 1-0. What is your plan for the next pitch?",
      "options": [
        {
          "id": "A",
          "text": "Stay on fastball — he has to throw one now at 1-0",
          "feedback": "Correct. 1-0 is a fastball count. He has to throw a strike. You are locked to fastball in your damage zone. If it shows up, you attack.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Expand your zone — he might surprise you with a slider in the zone",
          "feedback": "His slider has not been in the zone all inning. Expanding for it at 1-0 abandons the pattern you identified.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Take the next pitch too to get to 2-0",
          "feedback": "Taking another pitch is fine if you see the slider again. But if he throws a fastball in your zone at 1-0 and you take it, you gave back your advantage.",
          "correct": false
        }
      ]
    },
    {
      "type": "choice",
      "prompt": "2-1 count. He goes fastball, belt-high, inner third — right in your damage zone. Commit time. What do you do?",
      "options": [
        {
          "id": "A",
          "text": "Attack it — this is the pitch you were hunting",
          "feedback": "Correct. Two-pitch count, your lane, your pitch, your plan. You did the work and the pitch arrived. This is execution.",
          "correct": true
        },
        {
          "id": "B",
          "text": "Take it — you want to grind to 3-1 for an even better count",
          "feedback": "Taking your pitch when it arrives in your damage zone at 2-1 is not patience — it is passing. Attack your pitch.",
          "correct": false
        },
        {
          "id": "C",
          "text": "Check swing in case it runs further inside",
          "feedback": "Check swings on belt-high inner half fastballs when you are expecting fastball are the weakest outcome. Commit and drive it.",
          "correct": false
        }
      ]
    },
    {
      "type": "visualization",
      "content": "You are standing at second base. You drove the fastball inner half to right center. One pitch. One decision. The dugout is alive. You saw the pattern, you built the plan, and you executed. The rally has started.",
      "cue": "RALLY STARTS WITH YOU"
    },
    {
      "type": "cue",
      "label": "YOUR CUE",
      "text": "START IT RIGHT NOW"
    }
  ]'::jsonb,
  'baseball',
  ARRAY['hitter','catcher','infielder','outfielder','baserunner'],
  ARRAY['rally-start','leadoff-approach','pattern-recognition','full-game-sim','pressure-ab'],
  true
);

COMMIT;
