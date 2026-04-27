-- ============================================================
-- 018 — Add daily timing fields to org_settings
-- ============================================================

ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS day_start_time text,
  ADD COLUMN IF NOT EXISTS day_end_time   text;
