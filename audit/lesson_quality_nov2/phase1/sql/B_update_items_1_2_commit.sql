-- PHASE 1, FILE B (COMMIT VERSION): items 1 and 2. REVIEW ONLY. Do not run until approved.
-- Identical statements to B_update_items_1_2.sql, but ends in COMMIT. Run it only after the rollback version's
-- verification output matched the expected counts.
-- Prerequisite: file A (snapshot) has been run and its counts match.
-- Scope: series lessons only. One UPDATE per changed lesson, keyed by id (id = legacy_lesson_id for these rows).
-- Item 1 (grammar): 153 lessons get a step 0 text fix (all 7 template sentences, including the 3 "awkward" boss ones).
-- Item 2 (reflection): 120 lessons get their final generic cue replaced by the restored reflection step
--   (30 Charge Bank skill lessons + 45 checkpoints + 45 bosses). The other 240 series lessons keep the cue.
--   Restored wording uses "Name one specific action" in place of "Write one specific action".
-- Item 3 (recap facts) is NOT touched. Lessons changed in total: 216.
-- Each UPDATE is guarded by the old text and the generic cue, so re-running changes nothing.
begin;
-- charge_bank_u1_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u1_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering in practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- charge_bank_u1_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u1_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- charge_bank_u1_l1 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice body language boost in practice? Name one specific action you’ll take next time you train.", "speaker": "Sam"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u1_l1'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u1_l2 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice confidence bank in practice? Name one specific action you’ll take next time you train.", "speaker": "Jordan"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u1_l2'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u1_l3 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice past success replay in practice? Name one specific action you’ll take next time you train.", "speaker": "Sam"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u1_l3'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u1_l4 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice win the moment in practice? Name one specific action you’ll take next time you train.", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u1_l4'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u1_l5 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice trust your training in practice? Name one specific action you’ll take next time you train.", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u1_l5'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u1_l6 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice believe and achieve in practice? Name one specific action you’ll take next time you train.", "speaker": "Morgan"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u1_l6'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u2_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Sam"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u2_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering during a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- charge_bank_u2_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u2_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- charge_bank_u2_l1 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re in a competitive drill. Use open body language to project confidence – stand tall, make eye contact, and relax your shoulders to feel more powerful.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice body language boost during a competitive drill? Name one specific action you’ll take next time you train.", "speaker": "Morgan"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u2_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re during a competitive drill. Use open body language to project confidence – stand tall, make eye contact, and relax your shoulders to feel more powerful.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u2_l2 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re in a competitive drill. Build a mental bank of confident moments by celebrating small successes and recalling them when you need a boost.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice confidence bank during a competitive drill? Name one specific action you’ll take next time you train.", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u2_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re during a competitive drill. Build a mental bank of confident moments by celebrating small successes and recalling them when you need a boost.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u2_l3 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re in a competitive drill. Revisit videos or memories of your best games to remind yourself what success looks and feels like.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice past success replay during a competitive drill? Name one specific action you’ll take next time you train.", "speaker": "Casey"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u2_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re during a competitive drill. Revisit videos or memories of your best games to remind yourself what success looks and feels like.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u2_l4 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re in a competitive drill. Focus on what you can control in the present; if you lose a play, reset your posture and prepare for the next moment.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice win the moment during a competitive drill? Name one specific action you’ll take next time you train.", "speaker": "Sam"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u2_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re during a competitive drill. Focus on what you can control in the present; if you lose a play, reset your posture and prepare for the next moment.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u2_l5 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re in a competitive drill. When you’re nervous, rely on the body-language habits you’ve practiced – they’re your anchor in high-pressure moments.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice trust your training during a competitive drill? Name one specific action you’ll take next time you train.", "speaker": "Jamie"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u2_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re during a competitive drill. When you’re nervous, rely on the body-language habits you’ve practiced – they’re your anchor in high-pressure moments.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u2_l6 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re in a competitive drill. Pair positive self-belief with strong posture; picture yourself succeeding as you stand tall and composed.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice believe and achieve during a competitive drill? Name one specific action you’ll take next time you train.", "speaker": "Casey"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u2_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re during a competitive drill. Pair positive self-belief with strong posture; picture yourself succeeding as you stand tall and composed.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u3_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u3_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering during a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- charge_bank_u3_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u3_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- charge_bank_u3_l1 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re in a high-pressure scrimmage. Use open body language to project confidence – stand tall, make eye contact, and relax your shoulders to feel more powerful.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice body language boost during a high-pressure scrimmage? Name one specific action you’ll take next time you train.", "speaker": "Riley"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u3_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re during a high-pressure scrimmage. Use open body language to project confidence – stand tall, make eye contact, and relax your shoulders to feel more powerful.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u3_l2 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re in a high-pressure scrimmage. Build a mental bank of confident moments by celebrating small successes and recalling them when you need a boost.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice confidence bank during a high-pressure scrimmage? Name one specific action you’ll take next time you train.", "speaker": "Sam"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u3_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re during a high-pressure scrimmage. Build a mental bank of confident moments by celebrating small successes and recalling them when you need a boost.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u3_l3 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re in a high-pressure scrimmage. Revisit videos or memories of your best games to remind yourself what success looks and feels like.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice past success replay during a high-pressure scrimmage? Name one specific action you’ll take next time you train.", "speaker": "Morgan"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u3_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re during a high-pressure scrimmage. Revisit videos or memories of your best games to remind yourself what success looks and feels like.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u3_l4 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re in a high-pressure scrimmage. Focus on what you can control in the present; if you lose a play, reset your posture and prepare for the next moment.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice win the moment during a high-pressure scrimmage? Name one specific action you’ll take next time you train.", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u3_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re during a high-pressure scrimmage. Focus on what you can control in the present; if you lose a play, reset your posture and prepare for the next moment.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u3_l5 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re in a high-pressure scrimmage. When you’re nervous, rely on the body-language habits you’ve practiced – they’re your anchor in high-pressure moments.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice trust your training during a high-pressure scrimmage? Name one specific action you’ll take next time you train.", "speaker": "Sam"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u3_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re during a high-pressure scrimmage. When you’re nervous, rely on the body-language habits you’ve practiced – they’re your anchor in high-pressure moments.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u3_l6 | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re in a high-pressure scrimmage. Pair positive self-belief with strong posture; picture yourself succeeding as you stand tall and composed.$q$::text)), '{4}', $q${"type": "reflection", "prompt": "How will you practice believe and achieve during a high-pressure scrimmage? Name one specific action you’ll take next time you train.", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u3_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re during a high-pressure scrimmage. Pair positive self-belief with strong posture; picture yourself succeeding as you stand tall and composed.$q$
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u4_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Riley"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u4_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering in a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- charge_bank_u4_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u4_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- charge_bank_u4_l1 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice body language boost in a real game? Name one specific action you’ll take next time you train.", "speaker": "Casey"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u4_l1'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u4_l2 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice confidence bank in a real game? Name one specific action you’ll take next time you train.", "speaker": "Morgan"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u4_l2'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u4_l3 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice past success replay in a real game? Name one specific action you’ll take next time you train.", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u4_l3'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u4_l4 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice win the moment in a real game? Name one specific action you’ll take next time you train.", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u4_l4'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u4_l5 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice trust your training in a real game? Name one specific action you’ll take next time you train.", "speaker": "Morgan"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u4_l5'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u4_l6 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice believe and achieve in a real game? Name one specific action you’ll take next time you train.", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u4_l6'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u5_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u5_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering in overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- charge_bank_u5_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u5_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- charge_bank_u5_l1 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice body language boost in overtime of a championship game? Name one specific action you’ll take next time you train.", "speaker": "Sam"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u5_l1'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u5_l2 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice confidence bank in overtime of a championship game? Name one specific action you’ll take next time you train.", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u5_l2'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u5_l3 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice past success replay in overtime of a championship game? Name one specific action you’ll take next time you train.", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u5_l3'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u5_l4 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice win the moment in overtime of a championship game? Name one specific action you’ll take next time you train.", "speaker": "Morgan"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u5_l4'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u5_l5 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice trust your training in overtime of a championship game? Name one specific action you’ll take next time you train.", "speaker": "Casey"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u5_l5'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- charge_bank_u5_l6 | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{4}', $q${"type": "reflection", "prompt": "How will you practice believe and achieve in overtime of a championship game? Name one specific action you’ll take next time you train.", "speaker": "Morgan"}$q$::jsonb),
    updated_at = now()
where id = 'charge_bank_u5_l6'
  and jsonb_array_length(steps) = 5
  and steps->4->>'type' = 'cue'
  and steps->4->>'content' = 'Carry this into your next rep.';

-- power_grid_u1_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'power_grid_u1_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering in practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- power_grid_u1_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'power_grid_u1_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- power_grid_u2_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Jordan"}$q$::jsonb),
    updated_at = now()
where id = 'power_grid_u2_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering during a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- power_grid_u2_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'power_grid_u2_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- power_grid_u2_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re in a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u2_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re during a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u2_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Riley, you’re in a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u2_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Riley, you’re during a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u2_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re in a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u2_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re during a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u2_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Riley, you’re in a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u2_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Riley, you’re during a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u2_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re in a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u2_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re during a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u2_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re in a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u2_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re during a competitive drill. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u3_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Morgan"}$q$::jsonb),
    updated_at = now()
where id = 'power_grid_u3_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering during a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- power_grid_u3_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'power_grid_u3_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- power_grid_u3_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re in a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u3_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re during a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u3_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re in a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u3_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re during a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u3_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re in a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u3_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re during a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u3_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Casey, you’re in a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u3_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Casey, you’re during a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u3_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re in a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u3_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re during a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u3_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jamie, you’re in a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$::text)),
    updated_at = now()
where id = 'power_grid_u3_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jamie, you’re during a high-pressure scrimmage. Use open gestures, eye contact and nodding to show teammates you’re listening; non-verbal cues build trust.$q$;

-- power_grid_u4_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'power_grid_u4_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering in a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- power_grid_u4_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'power_grid_u4_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- power_grid_u5_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'power_grid_u5_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering in overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- power_grid_u5_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'power_grid_u5_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- replay_room_u1_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Sam"}$q$::jsonb),
    updated_at = now()
where id = 'replay_room_u1_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering in practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- replay_room_u1_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'replay_room_u1_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- replay_room_u2_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Sam"}$q$::jsonb),
    updated_at = now()
where id = 'replay_room_u2_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering during a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- replay_room_u2_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'replay_room_u2_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- replay_room_u2_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jordan, you’re in a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u2_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jordan, you’re during a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u2_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re in a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u2_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re during a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u2_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re in a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u2_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re during a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u2_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Taylor, you’re in a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u2_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Taylor, you’re during a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u2_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re in a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u2_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re during a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u2_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re in a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u2_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re during a competitive drill. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u3_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Casey"}$q$::jsonb),
    updated_at = now()
where id = 'replay_room_u3_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering during a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- replay_room_u3_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'replay_room_u3_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- replay_room_u3_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jamie, you’re in a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u3_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jamie, you’re during a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u3_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re in a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u3_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re during a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u3_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re in a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u3_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re during a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u3_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re in a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u3_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re during a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u3_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re in a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u3_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re during a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u3_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re in a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$::text)),
    updated_at = now()
where id = 'replay_room_u3_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re during a high-pressure scrimmage. Visualize your body moving with perfect form; see your shoulders relaxed and your movements fluid before you perform.$q$;

-- replay_room_u4_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Jamie"}$q$::jsonb),
    updated_at = now()
where id = 'replay_room_u4_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering in a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- replay_room_u4_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'replay_room_u4_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- replay_room_u5_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'replay_room_u5_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering in overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- replay_room_u5_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'replay_room_u5_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- reset_switch_u1_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Jordan"}$q$::jsonb),
    updated_at = now()
where id = 'reset_switch_u1_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering in practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- reset_switch_u1_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'reset_switch_u1_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- reset_switch_u2_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'reset_switch_u2_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering during a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- reset_switch_u2_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'reset_switch_u2_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- reset_switch_u2_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Taylor, you’re in a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u2_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Taylor, you’re during a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u2_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re in a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u2_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re during a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u2_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Taylor, you’re in a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u2_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Taylor, you’re during a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u2_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jordan, you’re in a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u2_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jordan, you’re during a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u2_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re in a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u2_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re during a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u2_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re in a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u2_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re during a competitive drill. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u3_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'reset_switch_u3_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering during a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- reset_switch_u3_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'reset_switch_u3_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- reset_switch_u3_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re in a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u3_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re during a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u3_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re in a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u3_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re during a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u3_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re in a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u3_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re during a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u3_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re in a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u3_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re during a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u3_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re in a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u3_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re during a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u3_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re in a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$::text)),
    updated_at = now()
where id = 'reset_switch_u3_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re during a high-pressure scrimmage. Use a quick power pose combined with a deep breath to reset after an error; this physical cue helps you shake off mistakes.$q$;

-- reset_switch_u4_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Morgan"}$q$::jsonb),
    updated_at = now()
where id = 'reset_switch_u4_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering in a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- reset_switch_u4_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'reset_switch_u4_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- reset_switch_u5_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Riley"}$q$::jsonb),
    updated_at = now()
where id = 'reset_switch_u5_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering in overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- reset_switch_u5_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'reset_switch_u5_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- ritual_circuit_u1_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Casey"}$q$::jsonb),
    updated_at = now()
where id = 'ritual_circuit_u1_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering in practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- ritual_circuit_u1_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'ritual_circuit_u1_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- ritual_circuit_u2_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Jamie"}$q$::jsonb),
    updated_at = now()
where id = 'ritual_circuit_u2_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering during a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- ritual_circuit_u2_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'ritual_circuit_u2_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- ritual_circuit_u2_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re in a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u2_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re during a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u2_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Taylor, you’re in a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u2_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Taylor, you’re during a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u2_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Riley, you’re in a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u2_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Riley, you’re during a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u2_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re in a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u2_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re during a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u2_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jordan, you’re in a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u2_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jordan, you’re during a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u2_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re in a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u2_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re during a competitive drill. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u3_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Morgan"}$q$::jsonb),
    updated_at = now()
where id = 'ritual_circuit_u3_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering during a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- ritual_circuit_u3_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'ritual_circuit_u3_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- ritual_circuit_u3_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re in a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u3_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re during a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u3_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jamie, you’re in a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u3_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jamie, you’re during a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u3_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re in a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u3_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re during a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u3_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re in a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u3_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re during a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u3_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re in a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u3_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re during a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u3_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re in a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$::text)),
    updated_at = now()
where id = 'ritual_circuit_u3_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Sam, you’re during a high-pressure scrimmage. Incorporate a specific posture (e.g., bouncing lightly on your toes with shoulders back) into your routine to cue your mind that it’s go-time.$q$;

-- ritual_circuit_u4_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'ritual_circuit_u4_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering in a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- ritual_circuit_u4_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'ritual_circuit_u4_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- ritual_circuit_u5_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Casey"}$q$::jsonb),
    updated_at = now()
where id = 'ritual_circuit_u5_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering in overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- ritual_circuit_u5_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'ritual_circuit_u5_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- signal_talk_u1_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Sam"}$q$::jsonb),
    updated_at = now()
where id = 'signal_talk_u1_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering in practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- signal_talk_u1_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'signal_talk_u1_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- signal_talk_u2_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Jordan"}$q$::jsonb),
    updated_at = now()
where id = 'signal_talk_u2_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering during a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- signal_talk_u2_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'signal_talk_u2_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- signal_talk_u2_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re in a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u2_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re during a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u2_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re in a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u2_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re during a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u2_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Riley, you’re in a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u2_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Riley, you’re during a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u2_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re in a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u2_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re during a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u2_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re in a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u2_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re during a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u2_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re in a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u2_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re during a competitive drill. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u3_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'signal_talk_u3_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering during a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- signal_talk_u3_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'signal_talk_u3_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- signal_talk_u3_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re in a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u3_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re during a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u3_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re in a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u3_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re during a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u3_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re in a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u3_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re during a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u3_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re in a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u3_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re during a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u3_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re in a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u3_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re during a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u3_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re in a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$::text)),
    updated_at = now()
where id = 'signal_talk_u3_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Alex, you’re during a high-pressure scrimmage. Use self-talk to remind yourself to stand tall: say to yourself, ‘chest up, head high, you’ve got this.’$q$;

-- signal_talk_u4_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Riley"}$q$::jsonb),
    updated_at = now()
where id = 'signal_talk_u4_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering in a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- signal_talk_u4_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'signal_talk_u4_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- signal_talk_u5_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Jamie"}$q$::jsonb),
    updated_at = now()
where id = 'signal_talk_u5_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering in overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- signal_talk_u5_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'signal_talk_u5_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- stormproof_u1_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Casey"}$q$::jsonb),
    updated_at = now()
where id = 'stormproof_u1_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering in practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- stormproof_u1_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'stormproof_u1_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- stormproof_u2_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'stormproof_u2_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering during a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- stormproof_u2_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'stormproof_u2_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- stormproof_u2_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re in a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u2_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re during a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u2_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re in a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u2_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re during a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u2_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re in a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u2_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re during a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u2_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re in a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u2_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re during a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u2_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re in a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u2_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jamie, you’re during a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u2_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re in a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u2_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re during a competitive drill. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u3_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Casey"}$q$::jsonb),
    updated_at = now()
where id = 'stormproof_u3_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering during a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- stormproof_u3_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'stormproof_u3_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- stormproof_u3_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re in a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u3_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re during a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u3_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re in a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u3_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re during a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u3_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Casey, you’re in a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u3_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Casey, you’re during a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u3_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re in a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u3_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re during a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u3_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re in a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u3_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re during a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u3_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jamie, you’re in a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$::text)),
    updated_at = now()
where id = 'stormproof_u3_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jamie, you’re during a high-pressure scrimmage. Recognize how emotions show in your posture; stand tall and relax your body to reduce the physical impact of stress.$q$;

-- stormproof_u4_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Jamie"}$q$::jsonb),
    updated_at = now()
where id = 'stormproof_u4_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering in a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- stormproof_u4_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'stormproof_u4_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- stormproof_u5_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Jordan"}$q$::jsonb),
    updated_at = now()
where id = 'stormproof_u5_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering in overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- stormproof_u5_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'stormproof_u5_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- target_charge_u1_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'target_charge_u1_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering in practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- target_charge_u1_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'target_charge_u1_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- target_charge_u2_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Riley"}$q$::jsonb),
    updated_at = now()
where id = 'target_charge_u2_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering during a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- target_charge_u2_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'target_charge_u2_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- target_charge_u2_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re in a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u2_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re during a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u2_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re in a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u2_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re during a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u2_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re in a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u2_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re during a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u2_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re in a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u2_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Alex, you’re during a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u2_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re in a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u2_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re during a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u2_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jordan, you’re in a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u2_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Jordan, you’re during a competitive drill. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u3_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Casey"}$q$::jsonb),
    updated_at = now()
where id = 'target_charge_u3_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering during a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- target_charge_u3_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'target_charge_u3_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- target_charge_u3_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re in a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u3_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re during a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u3_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re in a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u3_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re during a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u3_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re in a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u3_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re during a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u3_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re in a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u3_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re during a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u3_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re in a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u3_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Riley, you’re during a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u3_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Casey, you’re in a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$::text)),
    updated_at = now()
where id = 'target_charge_u3_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Casey, you’re during a high-pressure scrimmage. Adopt a powerful stance when you review your goals; your body posture can reinforce commitment to your objectives.$q$;

-- target_charge_u4_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Alex"}$q$::jsonb),
    updated_at = now()
where id = 'target_charge_u4_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering in a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- target_charge_u4_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'target_charge_u4_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- target_charge_u5_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Jordan"}$q$::jsonb),
    updated_at = now()
where id = 'target_charge_u5_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering in overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- target_charge_u5_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'target_charge_u5_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- voltage_control_u1_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Sam"}$q$::jsonb),
    updated_at = now()
where id = 'voltage_control_u1_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the fundamentals unit, so you'll learn the basic principles of this mental skill. You’re now entering in practice. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- voltage_control_u1_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'voltage_control_u1_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- voltage_control_u2_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Taylor"}$q$::jsonb),
    updated_at = now()
where id = 'voltage_control_u2_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. You’re now entering during a competitive drill. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- voltage_control_u2_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'voltage_control_u2_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- voltage_control_u2_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re in a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u2_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re during a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u2_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Taylor, you’re in a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u2_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Taylor, you’re during a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u2_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re in a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u2_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re during a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u2_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re in a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u2_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Casey, you’re during a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u2_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re in a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u2_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Morgan, you’re during a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u2_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re in a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u2_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$This unit focuses on applying the skill at game speed. Imagine you're in the middle of a fast-paced drill. Sam, you’re during a competitive drill. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u3_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Morgan"}$q$::jsonb),
    updated_at = now()
where id = 'voltage_control_u3_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. You’re now entering during a high-pressure scrimmage. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- voltage_control_u3_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'voltage_control_u3_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- voltage_control_u3_l1 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re in a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u3_l1'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re during a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u3_l2 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re in a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u3_l2'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re during a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u3_l3 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re in a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u3_l3'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Morgan, you’re during a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u3_l4 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re in a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u3_l4'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re during a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u3_l5 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re in a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u3_l5'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Taylor, you’re during a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u3_l6 | step0 grammar fix
update legacy_lessons_staging
set steps = jsonb_set(steps, '{0,prompt}', to_jsonb($q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re in a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$::text)),
    updated_at = now()
where id = 'voltage_control_u3_l6'
  and jsonb_array_length(steps) = 5
  and steps->0->>'prompt' = $q$Now you're learning to perform under pressure. The stakes are higher – maybe a scrimmage against tough opponents. Jordan, you’re during a high-pressure scrimmage. Stand tall even when tired; adopting an energetic posture can trick your brain into feeling more awake.$q$;

-- voltage_control_u4_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Casey"}$q$::jsonb),
    updated_at = now()
where id = 'voltage_control_u4_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$In the integration unit you'll combine mental skills with full team play. Picture yourself in an actual game setting. You’re now entering in a real game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- voltage_control_u4_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'voltage_control_u4_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- voltage_control_u5_boss | step0 grammar fix + reflection restored
update legacy_lessons_staging
set steps = jsonb_set(jsonb_set(steps, '{0,prompt}', to_jsonb($q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$::text)), '{8}', $q${"type": "reflection", "prompt": "During this overtime challenge, which mental skill felt the most challenging to execute and how will you improve it?", "speaker": "Jordan"}$q$::jsonb),
    updated_at = now()
where id = 'voltage_control_u5_boss'
  and jsonb_array_length(steps) = 9
  and steps->0->>'prompt' = $q$This is the overtime challenge. You need to demonstrate all you've learned under fatigue and pressure. You’re now entering in overtime of a championship game. It’s the overtime challenge: you must use all the mental skills you’ve learned.$q$
  and steps->8->>'type' = 'cue'
  and steps->8->>'content' = 'Carry this into your next rep.';

-- voltage_control_u5_checkpoint | reflection restored
update legacy_lessons_staging
set steps = jsonb_set(steps, '{7}', $q${"type": "reflection", "prompt": "Think about the mental skills in this unit. Which one will you focus on strengthening in the next week, and why?", "speaker": "Coach"}$q$::jsonb),
    updated_at = now()
where id = 'voltage_control_u5_checkpoint'
  and jsonb_array_length(steps) = 8
  and steps->7->>'type' = 'cue'
  and steps->7->>'content' = 'Carry this into your next rep.';

-- ============ VERIFICATION (read this output before deciding) ============
-- 1. Rows changed versus the snapshot. Expect exactly 216.
select count(*) as changed_rows
from legacy_lessons_staging s join legacy_lessons_staging_backup_nov2 b using (id)
where s.steps is distinct from b.steps;

-- 2. Rows changed that are NOT series lessons. Expect 0.
select count(*) as changed_non_series
from legacy_lessons_staging s join legacy_lessons_staging_backup_nov2 b using (id)
where s.steps is distinct from b.steps and s.id !~ '^(charge_bank|power_grid|replay_room|reset_switch|ritual_circuit|signal_talk|stormproof|target_charge|voltage_control)_u[1-5]_(l[1-6]|checkpoint|boss)$';

-- 3. Series rows by final step type. Expect now_reflection = 120 and still_cue = 240.
select count(*) filter (where steps->(jsonb_array_length(steps)-1)->>'type' = 'reflection') as now_reflection,
       count(*) filter (where steps->(jsonb_array_length(steps)-1)->>'type' = 'cue') as still_cue
from legacy_lessons_staging where id ~ '^(charge_bank|power_grid|replay_room|reset_switch|ritual_circuit|signal_talk|stormproof|target_charge|voltage_control)_u[1-5]_(l[1-6]|checkpoint|boss)$';

-- 4. Restored reflection prompts that still say "Write one". Expect 0.
select count(*) as still_write_wording
from legacy_lessons_staging
where id ~ '^(charge_bank|power_grid|replay_room|reset_switch|ritual_circuit|signal_talk|stormproof|target_charge|voltage_control)_u[1-5]_(l[1-6]|checkpoint|boss)$' and steps->(jsonb_array_length(steps)-1)->>'type' = 'reflection'
  and steps->(jsonb_array_length(steps)-1)->>'prompt' like '%Write one specific action%';

-- 5. Remaining broken phrasing anywhere in the series. Expect 0.
select count(*) as remaining_broken
from legacy_lessons_staging
where id ~ '^(charge_bank|power_grid|replay_room|reset_switch|ritual_circuit|signal_talk|stormproof|target_charge|voltage_control)_u[1-5]_(l[1-6]|checkpoint|boss)$' and (steps::text like '%you’re during%' or steps::text like '%entering in %' or steps::text like '%entering during%');

-- 6. Step 0 changed. Expect 153. (Compares step 0 only.)
select count(*) as step0_changed
from legacy_lessons_staging s join legacy_lessons_staging_backup_nov2 b using (id)
where s.steps->0 is distinct from b.steps->0;

-- 7. Steps other than step 0 and the final step must be untouched on every changed row. Expect 0.
select count(*) as middle_steps_changed
from legacy_lessons_staging s join legacy_lessons_staging_backup_nov2 b using (id)
where s.steps is distinct from b.steps
  and (select jsonb_agg(e) from jsonb_array_elements(s.steps) with ordinality t(e,i) where i > 1 and i < jsonb_array_length(s.steps))
      is distinct from
      (select jsonb_agg(e) from jsonb_array_elements(b.steps) with ordinality t(e,i) where i > 1 and i < jsonb_array_length(b.steps));

-- 8. Total rows and hidden rows untouched. Expect 869 and 26.
select count(*) as total_rows, count(*) filter (where is_hidden) as hidden_rows from legacy_lessons_staging;

-- Makes the changes permanent.
commit;
