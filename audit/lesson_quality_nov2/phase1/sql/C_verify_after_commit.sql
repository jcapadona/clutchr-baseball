-- PHASE 1, FILE C: post-commit verification. READ-ONLY: one SELECT, no changes to any table.
-- Run after B_update_items_1_2_commit.sql. Compares legacy_lessons_staging with legacy_lessons_staging_backup_nov2.
-- Returns one row. Each column name ends in the value it should have.
select
  -- 1. lessons whose steps differ from the snapshot
  (select count(*)
     from legacy_lessons_staging s
     join legacy_lessons_staging_backup_nov2 b using (id)
    where s.steps is distinct from b.steps)                                   as rows_changed_expect_216,

  -- 2. changed rows that are not series lessons
  (select count(*)
     from legacy_lessons_staging s
     join legacy_lessons_staging_backup_nov2 b using (id)
    where s.steps is distinct from b.steps
      and s.id !~ '^(charge_bank|power_grid|replay_room|reset_switch|ritual_circuit|signal_talk|stormproof|target_charge|voltage_control)_u[1-5]_(l[1-6]|checkpoint|boss)$')
                                                                              as non_series_changed_expect_0,

  -- 3. series lessons whose final step is now a reflection
  (select count(*)
     from legacy_lessons_staging
    where id ~ '^(charge_bank|power_grid|replay_room|reset_switch|ritual_circuit|signal_talk|stormproof|target_charge|voltage_control)_u[1-5]_(l[1-6]|checkpoint|boss)$'
      and steps->(jsonb_array_length(steps)-1)->>'type' = 'reflection')       as final_step_reflection_expect_120,

  -- 4. series lessons whose final step is still the generic cue
  (select count(*)
     from legacy_lessons_staging
    where id ~ '^(charge_bank|power_grid|replay_room|reset_switch|ritual_circuit|signal_talk|stormproof|target_charge|voltage_control)_u[1-5]_(l[1-6]|checkpoint|boss)$'
      and steps->(jsonb_array_length(steps)-1)->>'type' = 'cue')              as final_step_cue_expect_240,

  -- 5. restored reflection prompts that still say "Write one specific action"
  (select count(*)
     from legacy_lessons_staging
    where id ~ '^(charge_bank|power_grid|replay_room|reset_switch|ritual_circuit|signal_talk|stormproof|target_charge|voltage_control)_u[1-5]_(l[1-6]|checkpoint|boss)$'
      and steps->(jsonb_array_length(steps)-1)->>'type' = 'reflection'
      and steps->(jsonb_array_length(steps)-1)->>'prompt' like '%Write one specific action%')
                                                                              as write_wording_left_expect_0,

  -- 6. series lessons with broken grammar phrasing left anywhere in steps
  (select count(*)
     from legacy_lessons_staging
    where id ~ '^(charge_bank|power_grid|replay_room|reset_switch|ritual_circuit|signal_talk|stormproof|target_charge|voltage_control)_u[1-5]_(l[1-6]|checkpoint|boss)$'
      and (steps::text like '%you’re during%'
        or steps::text like '%entering in %'
        or steps::text like '%entering during%'))                             as broken_phrasing_left_expect_0,

  -- 7. lessons whose step 0 differs from the snapshot
  (select count(*)
     from legacy_lessons_staging s
     join legacy_lessons_staging_backup_nov2 b using (id)
    where s.steps->0 is distinct from b.steps->0)                             as step0_changed_expect_153,

  -- 8. changed lessons where any step other than step 0 and the final step differs
  (select count(*)
     from legacy_lessons_staging s
     join legacy_lessons_staging_backup_nov2 b using (id)
    where s.steps is distinct from b.steps
      and (select jsonb_agg(e)
             from jsonb_array_elements(s.steps) with ordinality t(e, i)
            where i > 1 and i < jsonb_array_length(s.steps))
          is distinct from
          (select jsonb_agg(e)
             from jsonb_array_elements(b.steps) with ordinality t(e, i)
            where i > 1 and i < jsonb_array_length(b.steps)))                 as middle_steps_changed_expect_0,

  -- 9. total rows in the live table
  (select count(*) from legacy_lessons_staging)                               as total_rows_expect_869,

  -- 10. hidden rows in the live table
  (select count(*) from legacy_lessons_staging where is_hidden)               as hidden_rows_expect_26;
