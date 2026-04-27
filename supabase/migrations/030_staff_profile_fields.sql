-- ============================================================
-- 030 — Add profile_complete and avatar_url to staff
-- ============================================================

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS profile_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url       text;
