-- ============================================================
-- CLUTCHR BATCH 05 — VALIDATION QUERIES
-- Run AFTER executing HSP / LOM / RBI insert files.
-- These are read-only SELECT checks. No data is modified.
-- ============================================================

-- ── 1. COUNT CHECK ──────────────────────────────────────────────
-- Expect: 15 each for HSP, LOM, RBI — 45 total

SELECT
  CASE
    WHEN legacy_lesson_id LIKE 'HSP_%' THEN 'hitter-specialty'
    WHEN legacy_lesson_id LIKE 'LOM_%' THEN 'leadoff-mentality'
    WHEN legacy_lesson_id LIKE 'RBI_%' THEN 'rbi-mode'
    ELSE 'OTHER'
  END AS world,
  COUNT(*) AS lesson_count,
  CASE WHEN COUNT(*) = 15 THEN 'PASS' ELSE 'FAIL — expected 15' END AS status
FROM public.legacy_lessons_staging
WHERE legacy_lesson_id LIKE 'HSP_%'
   OR legacy_lesson_id LIKE 'LOM_%'
   OR legacy_lesson_id LIKE 'RBI_%'
GROUP BY 1
ORDER BY 1;


-- ── 2. DUPLICATE LEGACY_LESSON_ID CHECK ────────────────────────
-- Expect: 0 rows (no duplicates)

SELECT
  legacy_lesson_id,
  COUNT(*) AS occurrences,
  'FAIL — duplicate ID' AS status
FROM public.legacy_lessons_staging
WHERE legacy_lesson_id LIKE 'HSP_%'
   OR legacy_lesson_id LIKE 'LOM_%'
   OR legacy_lesson_id LIKE 'RBI_%'
GROUP BY legacy_lesson_id
HAVING COUNT(*) > 1
ORDER BY legacy_lesson_id;


-- ── 3. ACTIVE LESSON CHECK ─────────────────────────────────────
-- Expect: 0 rows (all lessons should be is_active = true)

SELECT
  legacy_lesson_id,
  is_active,
  'FAIL — lesson not active' AS status
FROM public.legacy_lessons_staging
WHERE (
    legacy_lesson_id LIKE 'HSP_%'
    OR legacy_lesson_id LIKE 'LOM_%'
    OR legacy_lesson_id LIKE 'RBI_%'
  )
  AND is_active = false
ORDER BY legacy_lesson_id;


-- ── 4. STEP COUNT CHECK — must have 3–6 steps ──────────────────
-- Expect: 0 rows (no lessons with fewer than 3 or more than 6 steps)

SELECT
  legacy_lesson_id,
  jsonb_array_length(steps) AS step_count,
  CASE
    WHEN jsonb_array_length(steps) < 3 THEN 'FAIL — fewer than 3 steps'
    WHEN jsonb_array_length(steps) > 6 THEN 'FAIL — more than 6 steps'
    ELSE 'PASS'
  END AS status
FROM public.legacy_lessons_staging
WHERE (
    legacy_lesson_id LIKE 'HSP_%'
    OR legacy_lesson_id LIKE 'LOM_%'
    OR legacy_lesson_id LIKE 'RBI_%'
  )
  AND (
    jsonb_array_length(steps) < 3
    OR jsonb_array_length(steps) > 6
  )
ORDER BY legacy_lesson_id;


-- ── 5. UNSUPPORTED STEP TYPE CHECK ────────────────────────────
-- Allowed types: spark, notice_wonder, choice, checklist, reflection,
--   timer, visualization, pressure_rep, cue, feedback, action, text
-- Expect: 0 rows (no unsupported step types)

WITH step_types AS (
  SELECT
    l.legacy_lesson_id,
    step->>'type' AS step_type
  FROM public.legacy_lessons_staging l,
       jsonb_array_elements(l.steps) AS step
  WHERE l.legacy_lesson_id LIKE 'HSP_%'
     OR l.legacy_lesson_id LIKE 'LOM_%'
     OR l.legacy_lesson_id LIKE 'RBI_%'
)
SELECT
  legacy_lesson_id,
  step_type,
  'FAIL — unsupported step type' AS status
FROM step_types
WHERE step_type NOT IN (
  'spark', 'notice_wonder', 'choice', 'checklist',
  'reflection', 'timer', 'visualization', 'pressure_rep',
  'cue', 'feedback', 'action', 'text',
  'pressure_clock', 'hot_read', 'visualization_rep',
  'film_room', 'build_your_rep'
)
ORDER BY legacy_lesson_id, step_type;


-- ── 6. UNSUPPORTED UI_VARIANT CHECK ───────────────────────────
-- Allowed variants (confirmed in live components):
--   strike_zone_visualizer, pitch_sequence_chess, field_iq_board,
--   throw_decision_board, leverage_ladder, routine_card_builder,
--   pressure_replay, snapshot_read, jump_read, timing_track,
--   confidence_slider, pitch_count_board
-- Expect: 0 rows (no unsupported ui_variants used in batch 05)

WITH step_variants AS (
  SELECT
    l.legacy_lesson_id,
    step->>'ui_variant' AS ui_variant
  FROM public.legacy_lessons_staging l,
       jsonb_array_elements(l.steps) AS step
  WHERE (
      l.legacy_lesson_id LIKE 'HSP_%'
      OR l.legacy_lesson_id LIKE 'LOM_%'
      OR l.legacy_lesson_id LIKE 'RBI_%'
    )
    AND step->>'ui_variant' IS NOT NULL
)
SELECT
  legacy_lesson_id,
  ui_variant,
  CASE
    WHEN ui_variant IN (
      'strike_zone_visualizer', 'pitch_sequence_chess', 'field_iq_board',
      'throw_decision_board', 'leverage_ladder', 'routine_card_builder',
      'pressure_replay', 'snapshot_read', 'jump_read', 'timing_track',
      'confidence_slider', 'pitch_count_board'
    ) THEN 'PASS — supported variant'
    ELSE 'FAIL — unsupported ui_variant'
  END AS status
FROM step_variants
ORDER BY legacy_lesson_id;


-- ── 7. EMPTY CHOICE / OPTIONS CHECK ───────────────────────────
-- Expect: 0 rows (no choice steps with empty or missing options)

WITH choice_steps AS (
  SELECT
    l.legacy_lesson_id,
    step,
    step->>'type' AS step_type,
    step->'options' AS options_arr,
    step->'choices' AS choices_arr
  FROM public.legacy_lessons_staging l,
       jsonb_array_elements(l.steps) AS step
  WHERE (
      l.legacy_lesson_id LIKE 'HSP_%'
      OR l.legacy_lesson_id LIKE 'LOM_%'
      OR l.legacy_lesson_id LIKE 'RBI_%'
    )
    AND step->>'type' = 'choice'
)
SELECT
  legacy_lesson_id,
  step_type,
  COALESCE(jsonb_array_length(options_arr), jsonb_array_length(choices_arr), 0) AS option_count,
  'FAIL — choice step has no options' AS status
FROM choice_steps
WHERE
  (options_arr IS NULL OR jsonb_array_length(options_arr) = 0)
  AND (choices_arr IS NULL OR jsonb_array_length(choices_arr) = 0)
ORDER BY legacy_lesson_id;


-- ── 8. CHOICE OPTIONS MISSING FEEDBACK CHECK ──────────────────
-- Expect: 0 rows (every option in every choice step has feedback)

WITH choice_options AS (
  SELECT
    l.legacy_lesson_id,
    opt->>'id'       AS option_id,
    opt->>'text'     AS option_text,
    opt->>'feedback' AS feedback
  FROM public.legacy_lessons_staging l,
       jsonb_array_elements(l.steps) AS step,
       jsonb_array_elements(
         COALESCE(step->'options', step->'choices', '[]'::jsonb)
       ) AS opt
  WHERE (
      l.legacy_lesson_id LIKE 'HSP_%'
      OR l.legacy_lesson_id LIKE 'LOM_%'
      OR l.legacy_lesson_id LIKE 'RBI_%'
    )
    AND step->>'type' = 'choice'
)
SELECT
  legacy_lesson_id,
  option_id,
  LEFT(option_text, 40) AS option_preview,
  'FAIL — option missing feedback' AS status
FROM choice_options
WHERE feedback IS NULL OR TRIM(feedback) = ''
ORDER BY legacy_lesson_id, option_id;


-- ── 9. NOTICE_WONDER FIELD CHECK ──────────────────────────────
-- Both interactive (notice_items) and legacy (notice/wonder/reveal) schemas
-- must have the minimum required fields.
-- Expect: 0 rows (all notice_wonder steps have notice/wonder/reveal or notice_items)

WITH nw_steps AS (
  SELECT
    l.legacy_lesson_id,
    step
  FROM public.legacy_lessons_staging l,
       jsonb_array_elements(l.steps) AS step
  WHERE (
      l.legacy_lesson_id LIKE 'HSP_%'
      OR l.legacy_lesson_id LIKE 'LOM_%'
      OR l.legacy_lesson_id LIKE 'RBI_%'
    )
    AND step->>'type' = 'notice_wonder'
)
SELECT
  legacy_lesson_id,
  CASE
    WHEN step->>'notice' IS NULL AND (step->'notice_items' IS NULL OR jsonb_array_length(step->'notice_items') = 0) THEN 'FAIL — missing notice or notice_items'
    WHEN step->>'wonder' IS NULL AND (step->'wonder_options' IS NULL OR jsonb_array_length(step->'wonder_options') = 0) THEN 'FAIL — missing wonder or wonder_options'
    WHEN step->>'reveal' IS NULL THEN 'FAIL — missing reveal'
    ELSE 'PASS'
  END AS status
FROM nw_steps
WHERE
  (step->>'notice' IS NULL AND (step->'notice_items' IS NULL OR jsonb_array_length(step->'notice_items') = 0))
  OR (step->>'wonder' IS NULL AND (step->'wonder_options' IS NULL OR jsonb_array_length(step->'wonder_options') = 0))
  OR step->>'reveal' IS NULL
ORDER BY legacy_lesson_id;


-- ── 10. CUE CHECK — last step must be type=cue, text ≤ 5 words ─
-- Expect: 0 rows (all lessons end with a cue step with ≤ 5 words)

WITH last_steps AS (
  SELECT
    l.legacy_lesson_id,
    l.steps->>(jsonb_array_length(l.steps) - 1) AS last_step_raw
  FROM public.legacy_lessons_staging l
  WHERE l.legacy_lesson_id LIKE 'HSP_%'
     OR l.legacy_lesson_id LIKE 'LOM_%'
     OR l.legacy_lesson_id LIKE 'RBI_%'
),
parsed AS (
  SELECT
    legacy_lesson_id,
    (last_step_raw::jsonb)->>'type'  AS last_step_type,
    (last_step_raw::jsonb)->>'text'  AS cue_text
  FROM last_steps
)
SELECT
  legacy_lesson_id,
  last_step_type,
  cue_text,
  CASE
    WHEN last_step_type <> 'cue'
      THEN 'FAIL — last step is not cue'
    WHEN cue_text IS NULL OR TRIM(cue_text) = ''
      THEN 'FAIL — cue text is empty'
    WHEN array_length(string_to_array(TRIM(cue_text), ' '), 1) > 5
      THEN 'FAIL — cue text exceeds 5 words'
    ELSE 'PASS'
  END AS status
FROM parsed
WHERE
  last_step_type <> 'cue'
  OR cue_text IS NULL
  OR TRIM(cue_text) = ''
  OR array_length(string_to_array(TRIM(cue_text), ' '), 1) > 5
ORDER BY legacy_lesson_id;


-- ── 11. ROLE_TAGS UPPERCASE CHECK ─────────────────────────────
-- Expect: 0 rows (all role_tags are lowercase)

SELECT
  legacy_lesson_id,
  role_tags,
  'FAIL — role_tags contain uppercase' AS status
FROM public.legacy_lessons_staging
WHERE (
    legacy_lesson_id LIKE 'HSP_%'
    OR legacy_lesson_id LIKE 'LOM_%'
    OR legacy_lesson_id LIKE 'RBI_%'
  )
  AND EXISTS (
    SELECT 1
    FROM unnest(role_tags) AS t
    WHERE t <> lower(t)
  )
ORDER BY legacy_lesson_id;


-- ── 12. PILLAR_ID / UNIT_ID MISMATCH CHECK ────────────────────
-- Expect: 0 rows (pillar_id and unit_id must match for batch 05)

SELECT
  legacy_lesson_id,
  pillar_id,
  unit_id,
  'FAIL — pillar_id and unit_id do not match' AS status
FROM public.legacy_lessons_staging
WHERE (
    legacy_lesson_id LIKE 'HSP_%'
    OR legacy_lesson_id LIKE 'LOM_%'
    OR legacy_lesson_id LIKE 'RBI_%'
  )
  AND pillar_id <> unit_id
ORDER BY legacy_lesson_id;


-- ── 13. CHECKPOINT / BOSS PLACEMENT CHECK ─────────────────────
-- Rules: lesson 5 and 10 are checkpoints (is_checkpoint=true, is_boss=false)
--        lesson 15 is boss (is_boss=true, is_checkpoint=false)
--        all others: is_checkpoint=false, is_boss=false
-- Expect: 0 rows (all placement rules satisfied)

WITH expected AS (
  SELECT
    legacy_lesson_id,
    order_index,
    is_checkpoint,
    is_boss,
    CASE
      WHEN order_index = 5  THEN (is_checkpoint = true  AND is_boss = false)
      WHEN order_index = 10 THEN (is_checkpoint = true  AND is_boss = false)
      WHEN order_index = 15 THEN (is_boss = true        AND is_checkpoint = false)
      ELSE                       (is_checkpoint = false AND is_boss = false)
    END AS placement_ok
  FROM public.legacy_lessons_staging
  WHERE legacy_lesson_id LIKE 'HSP_%'
     OR legacy_lesson_id LIKE 'LOM_%'
     OR legacy_lesson_id LIKE 'RBI_%'
)
SELECT
  legacy_lesson_id,
  order_index,
  is_checkpoint,
  is_boss,
  'FAIL — checkpoint/boss placement wrong' AS status
FROM expected
WHERE placement_ok = false
ORDER BY legacy_lesson_id;


-- ── 14. SUMMARY — PASS / FAIL COUNTS ─────────────────────────
-- Run this last. Each row shows a check and whether it passed.

WITH counts AS (
  SELECT
    (SELECT COUNT(*) FROM public.legacy_lessons_staging WHERE legacy_lesson_id LIKE 'HSP_%') AS hsp_count,
    (SELECT COUNT(*) FROM public.legacy_lessons_staging WHERE legacy_lesson_id LIKE 'LOM_%') AS lom_count,
    (SELECT COUNT(*) FROM public.legacy_lessons_staging WHERE legacy_lesson_id LIKE 'RBI_%') AS rbi_count,

    -- duplicates
    (SELECT COUNT(*) FROM (
      SELECT legacy_lesson_id FROM public.legacy_lessons_staging
      WHERE legacy_lesson_id LIKE 'HSP_%' OR legacy_lesson_id LIKE 'LOM_%' OR legacy_lesson_id LIKE 'RBI_%'
      GROUP BY legacy_lesson_id HAVING COUNT(*) > 1
    ) dupes) AS duplicate_ids,

    -- inactive
    (SELECT COUNT(*) FROM public.legacy_lessons_staging
     WHERE (legacy_lesson_id LIKE 'HSP_%' OR legacy_lesson_id LIKE 'LOM_%' OR legacy_lesson_id LIKE 'RBI_%')
       AND is_active = false) AS inactive_lessons,

    -- step count violations
    (SELECT COUNT(*) FROM public.legacy_lessons_staging
     WHERE (legacy_lesson_id LIKE 'HSP_%' OR legacy_lesson_id LIKE 'LOM_%' OR legacy_lesson_id LIKE 'RBI_%')
       AND (jsonb_array_length(steps) < 3 OR jsonb_array_length(steps) > 6)) AS step_count_violations,

    -- notice_wonder missing fields
    (SELECT COUNT(*) FROM public.legacy_lessons_staging l, jsonb_array_elements(l.steps) step
     WHERE (l.legacy_lesson_id LIKE 'HSP_%' OR l.legacy_lesson_id LIKE 'LOM_%' OR l.legacy_lesson_id LIKE 'RBI_%')
       AND step->>'type' = 'notice_wonder'
       AND (
         (step->>'notice' IS NULL AND (step->'notice_items' IS NULL OR jsonb_array_length(step->'notice_items') = 0))
         OR (step->>'wonder' IS NULL AND (step->'wonder_options' IS NULL OR jsonb_array_length(step->'wonder_options') = 0))
         OR step->>'reveal' IS NULL
       )) AS nw_field_violations,

    -- choice missing options
    (SELECT COUNT(*) FROM public.legacy_lessons_staging l, jsonb_array_elements(l.steps) step
     WHERE (l.legacy_lesson_id LIKE 'HSP_%' OR l.legacy_lesson_id LIKE 'LOM_%' OR l.legacy_lesson_id LIKE 'RBI_%')
       AND step->>'type' = 'choice'
       AND (step->'options' IS NULL OR jsonb_array_length(step->'options') = 0)
       AND (step->'choices' IS NULL OR jsonb_array_length(step->'choices') = 0)) AS empty_choice_violations,

    -- pillar/unit mismatch
    (SELECT COUNT(*) FROM public.legacy_lessons_staging
     WHERE (legacy_lesson_id LIKE 'HSP_%' OR legacy_lesson_id LIKE 'LOM_%' OR legacy_lesson_id LIKE 'RBI_%')
       AND pillar_id <> unit_id) AS pillar_unit_mismatch,

    -- checkpoint/boss violations
    (SELECT COUNT(*) FROM (
      SELECT is_checkpoint, is_boss, order_index
      FROM public.legacy_lessons_staging
      WHERE legacy_lesson_id LIKE 'HSP_%' OR legacy_lesson_id LIKE 'LOM_%' OR legacy_lesson_id LIKE 'RBI_%'
    ) p WHERE (
      (p.order_index = 5  AND NOT (p.is_checkpoint = true  AND p.is_boss = false)) OR
      (p.order_index = 10 AND NOT (p.is_checkpoint = true  AND p.is_boss = false)) OR
      (p.order_index = 15 AND NOT (p.is_boss = true        AND p.is_checkpoint = false)) OR
      (p.order_index NOT IN (5,10,15) AND NOT (p.is_checkpoint = false AND p.is_boss = false))
    )) AS placement_violations
)
SELECT
  'Total lessons (HSP)'         AS check_name, hsp_count::text AS value,    CASE WHEN hsp_count = 15 THEN 'PASS' ELSE 'FAIL' END AS result FROM counts
UNION ALL SELECT 'Total lessons (LOM)',         lom_count::text,             CASE WHEN lom_count = 15 THEN 'PASS' ELSE 'FAIL' END FROM counts
UNION ALL SELECT 'Total lessons (RBI)',         rbi_count::text,             CASE WHEN rbi_count = 15 THEN 'PASS' ELSE 'FAIL' END FROM counts
UNION ALL SELECT 'Total lessons (all)',         (hsp_count+lom_count+rbi_count)::text, CASE WHEN hsp_count+lom_count+rbi_count = 45 THEN 'PASS' ELSE 'FAIL' END FROM counts
UNION ALL SELECT 'Duplicate IDs',              duplicate_ids::text,          CASE WHEN duplicate_ids = 0 THEN 'PASS' ELSE 'FAIL' END FROM counts
UNION ALL SELECT 'Inactive lessons',           inactive_lessons::text,       CASE WHEN inactive_lessons = 0 THEN 'PASS' ELSE 'FAIL' END FROM counts
UNION ALL SELECT 'Step count violations',      step_count_violations::text,  CASE WHEN step_count_violations = 0 THEN 'PASS' ELSE 'FAIL' END FROM counts
UNION ALL SELECT 'NoticeWonder field gaps',    nw_field_violations::text,    CASE WHEN nw_field_violations = 0 THEN 'PASS' ELSE 'FAIL' END FROM counts
UNION ALL SELECT 'Empty choice/options',       empty_choice_violations::text,CASE WHEN empty_choice_violations = 0 THEN 'PASS' ELSE 'FAIL' END FROM counts
UNION ALL SELECT 'Pillar/unit mismatch',       pillar_unit_mismatch::text,   CASE WHEN pillar_unit_mismatch = 0 THEN 'PASS' ELSE 'FAIL' END FROM counts
UNION ALL SELECT 'Checkpoint/boss placement',  placement_violations::text,   CASE WHEN placement_violations = 0 THEN 'PASS' ELSE 'FAIL' END FROM counts
ORDER BY 1;
