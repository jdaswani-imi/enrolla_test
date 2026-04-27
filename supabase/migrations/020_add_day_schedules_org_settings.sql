-- ============================================================
-- 020 — Add day_schedules JSONB to org_settings
-- ============================================================

ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS day_schedules JSONB;
