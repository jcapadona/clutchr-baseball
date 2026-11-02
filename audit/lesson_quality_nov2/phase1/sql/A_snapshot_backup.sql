-- PHASE 1, FILE A: snapshot. REVIEW ONLY. Do not run until approved.
-- Creates a full copy of the table before any change. Fails if the backup table already exists (intentional).
create table legacy_lessons_staging_backup_nov2 as
select * from legacy_lessons_staging;

-- Sanity check: both counts should be 869 and match.
select (select count(*) from legacy_lessons_staging) as live_rows,
       (select count(*) from legacy_lessons_staging_backup_nov2) as backup_rows;

-- Rollback path for a single lesson, if ever needed:
--   update legacy_lessons_staging l set steps = b.steps, updated_at = b.updated_at
--   from legacy_lessons_staging_backup_nov2 b where b.id = l.id and l.id = '<lesson id>';
