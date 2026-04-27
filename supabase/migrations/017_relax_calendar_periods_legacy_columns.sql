-- ============================================================
-- 017 — Relax calendar_periods legacy NOT NULL constraints
-- ============================================================

-- period_type is superseded by the new type column added in migration 015.
-- branch_id is redundant now that academic_year_id provides the year context.
-- Make both nullable so the API can insert via type + academic_year_id
-- without having to populate these legacy columns.
ALTER TABLE calendar_periods
  ALTER COLUMN period_type DROP NOT NULL,
  ALTER COLUMN branch_id   DROP NOT NULL;
