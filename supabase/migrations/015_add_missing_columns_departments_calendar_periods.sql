-- ============================================================
-- 015 — Add missing columns to departments and calendar_periods
-- ============================================================

-- departments was missing display/filtering columns needed by the settings
-- and onboarding APIs (year group range, colour swatch, active flag, ordering)
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS year_group_from TEXT,
  ADD COLUMN IF NOT EXISTS year_group_to   TEXT,
  ADD COLUMN IF NOT EXISTS colour          TEXT    NOT NULL DEFAULT '#94A3B8',
  ADD COLUMN IF NOT EXISTS is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order      INTEGER NOT NULL DEFAULT 0;

-- Allow API inserts that omit default_makeup_allowance
ALTER TABLE departments
  ALTER COLUMN default_makeup_allowance SET DEFAULT 2;

-- calendar_periods was missing the academic year link, a normalised type
-- column, display ordering, and an updated_at timestamp
ALTER TABLE calendar_periods
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS type             TEXT,
  ADD COLUMN IF NOT EXISTS sort_order       INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now();

-- Back-fill type from the legacy period_type column for any existing rows
UPDATE calendar_periods SET type = period_type WHERE type IS NULL AND period_type IS NOT NULL;
