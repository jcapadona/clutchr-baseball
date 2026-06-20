-- ─────────────────────────────────────────────────────────────────────────────
-- CLUTCHR MINI CLINIC — BATCH 01 TEST (rows 1–5)
-- Source: product/mini_clinic_output.csv
-- card_type: article | sport_scope: baseball_softball_specific | is_active: true
-- id: gen_random_uuid() | legacy_resource_id: cc_miniclinic_000N (CSV id column)
-- body_markdown: internal file:// source citations stripped
-- Re-runnable: DELETE by legacy_resource_id before each INSERT run
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM content_cards
WHERE legacy_resource_id IN (
  'cc_miniclinic_0001',
  'cc_miniclinic_0002',
  'cc_miniclinic_0003',
  'cc_miniclinic_0004',
  'cc_miniclinic_0005'
);

INSERT INTO content_cards (
  id,
  legacy_resource_id,
  title,
  summary,
  body_markdown,
  card_type,
  content_category,
  lesson_family,
  sport_scope,
  role_tags,
  season_tags,
  state_tags,
  skill_tags,
  difficulty_tier,
  duration_minutes,
  priority,
  is_featured,
  is_active,
  source,
  thumbnail_url,
  audio_url,
  youtube_url,
  video_url,
  attachment_url,
  visibility
) VALUES

-- ── 0001: Outfield Priorities & Communication ─────────────────────────────────
(
  gen_random_uuid(),
  'cc_miniclinic_0001',
  'Mini-Clinic: Outfield Priorities & Communication',
  'Learn why championship outfielders hustle, anticipate and communicate to minimize free bases and keep innings small.',
  $body1$
Opening hook: Outfield success isn't about flashy dives; it's about refusing to give bases away. From the first pitch, elite outfielders set the tone by hustling on and off the field and knowing exactly where the baseball needs to go.

KEY INSIGHT
Good outfielders minimize bases allowed. That means anticipating the count, pitch location and hitter tendencies so you can take the right angle and cut balls off in front of you. They understand that center‑fielders have priority on fly balls and that all three outfielders communicate gappers with a loud "Ball!" and "Green" call.

WHY THIS MATTERS
When you control free bases you prevent innings from snowballing. Teams that over‑communicate in the outfield keep runners out of scoring position and give pitchers confidence. It also helps eliminate misplayed fly balls and mis‑throws that give extra 90 feet.

REAL TALK
Too many high‑school outfielders coast on pre‑pitch preparation. They drift instead of sprinting to backups, and they assume someone else will take charge. Lack of urgency leads to missed cuts and overthrowing the wrong base. Coaches notice when an outfielder fails to back up a base or lets a base runner advance on a routine single.

COMMON MISTAKES
• Jogging on and off the field, which sets a lazy tone.
• Not adjusting positioning based on the hitter's count and plan.
• Forgetting that center‑field has priority and colliding with a teammate.
• Taking poor angles and letting balls get past you, costing extra bases.

WHAT TO DO
• Sprint everywhere: your job is to conserve runs with hustle.
• Before each pitch, align your depth and positioning based on hitter tendencies and the count.
• Call "Ball" loudly on every fly ball; if the ball splits the gap, yell "Green" so the other outfielder knows to back up the fence.
• Know your cut‑and‑relay assignments. On balls hit at you, throw two bases ahead; on balls hit to your left or right, hit the cutoff at chest height and keep the double play in order.

TAKEAWAY
Playing the outfield at a championship level is about being a free‑base machine. Hustle, position with intent and communicate on every pitch. When you minimize bases, you win games.
$body1$,
  'article',
  'ingame',
  'game_execution',
  'baseball_softball_specific',
  ARRAY['outfielder'],
  ARRAY['in_season'],
  ARRAY['communication', 'decision_making'],
  ARRAY['mini_clinic', 'mini_clinic_series', 'outfield', 'team_defense', 'communication'],
  'medium',
  6.0,
  75,
  false,
  true,
  'legacy_resource',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'pro'
),

-- ── 0002: Outfield Cuts & Relays ──────────────────────────────────────────────
(
  gen_random_uuid(),
  'cc_miniclinic_0002',
  'Mini-Clinic: Outfield Cuts & Relays',
  'Master the rules of cuts and relays to limit extra bases and win the free‑base war.',
  $body2$
Opening hook: The difference between throwing a runner out and watching him cruise into scoring position comes down to smart relays. Great outfielders know the priority system and practice it until it's second nature.

KEY INSIGHT
On ground balls hit at you, throw two bases ahead; on balls hit to your right or left, hit the cutoff man chest high and keep the double play in order. On balls down the line, the first baseman is the relay and the cut sets up at the front of the infield. Those rules simplify complex game decisions.

WHY THIS MATTERS
Cuts and relays win ballgames by limiting extra bases. When everyone knows the rule—"Ball" call, "Green" call, center‑fielder priority, two bases ahead—teams prevent the big inning and give pitchers a chance to compete. Sloppy relay lines are invitations for aggressive offenses to take extra 90 feet.

REAL TALK
Most amateur outfields don't practice relays enough. Players panic when the ball ricochets off the wall, overthrow cut men and forget who should be covering second. Practice these scenarios so decision‑making becomes instinct.

COMMON MISTAKES
• Throwing behind runners instead of two bases ahead.
• Missing the cutoff because of poor footwork.
• Failing to communicate your throw so infielders are surprised.
• Forgetting to back up bases when you're not receiving the ball.

WHAT TO DO
• Rehearse cuts and relays every week with live fungo. Start with simple single to right and progress to balls down the line.
• Center‑fielder always has priority; corners defer to his call.
• When gappers split the outfield, the off‑outfielder sprints to back up the wall while the middle infielder lines up the relay.
• Know the game situation and which runner matters so you can choose the right base.

TAKEAWAY
Smart outfielders use rules of thumb to move decisively. Master cuts and relays so you can limit damage and play winning team defense.
$body2$,
  'article',
  'ingame',
  'game_execution',
  'baseball_softball_specific',
  ARRAY['outfielder'],
  ARRAY['in_season'],
  ARRAY['decision_making'],
  ARRAY['mini_clinic', 'mini_clinic_series', 'outfield', 'cuts_relays', 'team_defense'],
  'medium',
  6.0,
  75,
  false,
  true,
  'legacy_resource',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'pro'
),

-- ── 0003: Outfielder Mindset—Effort, Engagement & Ownership ──────────────────
(
  gen_random_uuid(),
  'cc_miniclinic_0003',
  'Mini-Clinic: Outfielder Mindset—Effort, Engagement & Ownership',
  'Discover the three pillars that separate elite outfielders—effort, engagement and ownership—and how to apply them.',
  $body3$
Opening hook: Outfielders who change games don't just catch balls; they own their preparation and take pride in doing the boring stuff right. Darren Fenster describes three pillars—effort, engagement and ownership—that separate big leaguers from casual players.

KEY INSIGHT
Effort means hustling on every play and treating practice like game reps. Engagement is staying locked in on every pitch so you're ready to move as soon as contact is made. Ownership is caring enough about your craft to hold yourself accountable for mistakes and to fix them without excuses.

WHY THIS MATTERS
Coaches trust outfielders who never take a pitch off. When you bring maximum effort and mental engagement, you read balls earlier, get better jumps and make tough plays look routine. Ownership fosters long‑term growth because you seek feedback and work on weaknesses instead of hiding them.

REAL TALK
It's easy to cruise through practice when no one's watching. Players complain drills are boring and then wonder why they misplay balls in games. If you don't take responsibility for your development, you'll never reach your ceiling.

COMMON MISTAKES
• Going half speed on fungo reps and then being late in games.
• Chatting with teammates during pitches instead of watching hitters.
• Blaming bad hops or sun for misplays rather than your positioning.

WHAT TO DO
• Treat every rep like it counts. Sprint to your spot and finish through the play.
• Stand in when teammates hit bullpens to track pitches and work on reads.
• After each practice, write down one thing you did well and one thing you'll improve tomorrow. Accountability drives improvement.

TAKEAWAY
Outfield greatness starts with effort, engagement and ownership. When you care enough to do the boring things right, your performance on game day skyrockets.
$body3$,
  'article',
  'mindset_growth',
  'game_execution',
  'baseball_softball_specific',
  ARRAY['outfielder'],
  ARRAY['in_season'],
  ARRAY['focus', 'accountability'],
  ARRAY['mini_clinic', 'mini_clinic_series', 'outfield', 'effort', 'engagement', 'ownership'],
  'easy',
  5.5,
  75,
  false,
  true,
  'legacy_resource',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'pro'
),

-- ── 0004: Outfield Basics – Pre-Pitch & Reads ─────────────────────────────────
(
  gen_random_uuid(),
  'cc_miniclinic_0004',
  'Mini-Clinic: Outfield Basics – Pre-Pitch & Reads',
  'Learn the pre‑pitch routine and first‑step mechanics that give you elite jumps in the outfield.',
  $body4$
Opening hook: Great jumps don't happen by accident. They start with disciplined pre‑pitch routines that put you in the best position to react as soon as the bat hits the ball.

KEY INSIGHT
Before every pitch you should check the count, outs and hitter tendencies, then get into an athletic stance with your weight on the balls of your feet. As the pitcher begins his delivery, take a soft hop to synchronize your timing. This rhythm helps you explode on contact instead of being flat‑footed.

WHY THIS MATTERS
Outfielders who consistently beat hitters to spots save runs. A good first step allows you to cover more ground, take better routes and avoid desperation dives. Practicing pre‑pitch routines builds muscle memory so your reactions are automatic.

REAL TALK
Most players stand flat‑footed until the ball is hit, then panic. Without an intentional pre‑pitch routine you will always be a step late. The game is too fast to react after contact.

COMMON MISTAKES
• Starting with your feet locked in concrete.
• Jumping too early or too late, which throws off your read.
• Forgetting game context and being out of position for bunts or hit‑and‑runs.

WHAT TO DO
• Between pitches, scan the scoreboard and think about where you'd throw if the ball is hit to you.
• As the pitcher starts home, take a timing hop and sink into a ready position.
• Practice reads off the bat during batting practice from different spots to improve your jump.

TAKEAWAY
Your first step is your superpower. Nail your pre‑pitch routine and you'll make more plays look easy.
$body4$,
  'article',
  'ingame',
  'game_execution',
  'baseball_softball_specific',
  ARRAY['outfielder'],
  ARRAY['in_season'],
  ARRAY['performance'],
  ARRAY['mini_clinic', 'mini_clinic_series', 'outfield', 'pre_pitch', 'reads'],
  'easy',
  5.0,
  75,
  false,
  true,
  'legacy_resource',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'pro'
),

-- ── 0005: Outfield Drills – Buy into the Boring ───────────────────────────────
(
  gen_random_uuid(),
  'cc_miniclinic_0005',
  'Mini-Clinic: Outfield Drills – Buy into the Boring',
  'See why embracing repetitive drills like drop steps, wall reads and clean exchanges makes you a dependable outfielder.',
  $body5$
Opening hook: Outfield play is built on repetition. The drills aren't glamorous, but mastering them turns routine fly balls into outs and keeps baserunners honest.

KEY INSIGHT
The best outfielders invest in boring drills: drop steps, crossover runs, ball off the wall reads and catch‑and‑throw exchanges. These movements reinforce footwork patterns so you can react instinctively when the game speeds up.

WHY THIS MATTERS
Elite teams trust their outfielders to handle balls in the gaps and hold runners at first. Drilling fundamentals until they're automatic makes your routes cleaner, your transfers smoother and your throws more accurate.

REAL TALK
Players often skip footwork drills because they're repetitive. Then they wonder why they slip on wet grass or mis‑time a jump. Skill comes from thousands of quality reps.

COMMON MISTAKES
• Taking poor drop steps and turning the wrong way.
• Letting the ball play you off the wall instead of attacking it.
• Rushing your exchange and throwing off‑balance, causing air‑mailed throws.

WHAT TO DO
• Work on glove‑side and backhand drop steps every practice. Have a partner toss balls over your head and focus on opening correctly.
• Use walls or fences to simulate caroms. Practice reading the angle and getting your body behind the bounce.
• Do catch‑and‑throw drills where you catch the ball on your throwing side, shuffle and throw to a target without breaking your rhythm.

TAKEAWAY
Embrace the boring. The drills no one sees are the ones that make you a dependable outfielder when it counts.
$body5$,
  'article',
  'practice',
  'game_execution',
  'baseball_softball_specific',
  ARRAY['outfielder'],
  ARRAY['in_season'],
  ARRAY['mechanics'],
  ARRAY['mini_clinic', 'mini_clinic_series', 'outfield', 'drills', 'practice_design'],
  'easy',
  5.5,
  75,
  false,
  true,
  'legacy_resource',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'pro'
);
