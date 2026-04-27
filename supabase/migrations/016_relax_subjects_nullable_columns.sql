-- ============================================================
-- 016 — Relax subjects NOT NULL constraints
-- ============================================================

-- year_group_id and department_id are not available during basic onboarding
-- setup (year groups may not exist yet). Allow catalogue entries to be
-- created without these details; they can be filled in later via Settings.
-- price defaults to 0 so inserts that omit it still succeed.
ALTER TABLE subjects
  ALTER COLUMN year_group_id   DROP NOT NULL,
  ALTER COLUMN department_id   DROP NOT NULL,
  ALTER COLUMN price           SET DEFAULT 0;
