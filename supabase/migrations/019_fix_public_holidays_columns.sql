-- ============================================================
-- 019 — Fix public_holidays: add academic_year_id, date, source
-- ============================================================

ALTER TABLE public_holidays
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS date             DATE,
  ADD COLUMN IF NOT EXISTS source           TEXT NOT NULL DEFAULT 'custom';

-- Back-fill date from legacy holiday_date for any existing rows
UPDATE public_holidays SET date = holiday_date WHERE date IS NULL AND holiday_date IS NOT NULL;

-- Make branch_id optional (academic_year_id provides year context)
ALTER TABLE public_holidays
  ALTER COLUMN branch_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_holidays_academic_year_id ON public_holidays (academic_year_id);
