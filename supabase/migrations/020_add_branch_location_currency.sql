-- ============================================================
-- 020 — Add location_url and currency to branches
-- ============================================================

ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS location_url text,
  ADD COLUMN IF NOT EXISTS currency     text NOT NULL DEFAULT 'AED';
