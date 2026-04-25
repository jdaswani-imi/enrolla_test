-- ============================================================
-- 009 — Academic years, terms and calendar
-- ============================================================

CREATE TABLE academic_years (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES tenants  (id),
  branch_id  uuid        NOT NULL REFERENCES branches (id),
  name       text        NOT NULL,
  start_date date        NOT NULL,
  end_date   date        NOT NULL,
  -- At most one academic year may be current per branch at a time.
  -- Enforced by the partial unique index below, not a CHECK constraint,
  -- so that setting a new current year does not require a transaction
  -- that simultaneously clears the old one.
  is_current boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Exactly one current academic year per branch
CREATE UNIQUE INDEX academic_years_single_current_per_branch
  ON academic_years (branch_id)
  WHERE is_current = true;

CREATE TABLE terms (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES tenants        (id),
  academic_year_id uuid        NOT NULL REFERENCES academic_years (id),
  name             text        NOT NULL,
  start_date       date        NOT NULL,
  end_date         date        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Named calendar blocks for display in the timetable and scheduling UIs.
-- Distinct from terms: a calendar_period provides navigable labels
-- (including holidays and breaks) without driving scheduling logic.
CREATE TABLE calendar_periods (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES tenants  (id),
  branch_id   uuid        NOT NULL REFERENCES branches (id),
  name        text        NOT NULL,
  start_date  date        NOT NULL,
  end_date    date        NOT NULL,
  period_type text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT calendar_periods_type_check CHECK (
    period_type IN ('term', 'holiday', 'break')
  )
);

-- Public holidays trigger session-boundary enforcement at the app layer.
-- Branch-scoped because different branches may be in different jurisdictions.
CREATE TABLE public_holidays (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES tenants  (id),
  branch_id    uuid        NOT NULL REFERENCES branches (id),
  name         text        NOT NULL,
  holiday_date date        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE academic_years  ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_holidays  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_academic_years_tenant_id   ON academic_years (tenant_id);
CREATE INDEX idx_academic_years_branch_id   ON academic_years (branch_id);
CREATE INDEX idx_terms_tenant_id            ON terms (tenant_id);
CREATE INDEX idx_terms_academic_year_id     ON terms (academic_year_id);
CREATE INDEX idx_calendar_periods_tenant_id ON calendar_periods (tenant_id);
CREATE INDEX idx_calendar_periods_branch_id ON calendar_periods (branch_id);
CREATE INDEX idx_public_holidays_tenant_id  ON public_holidays (tenant_id);
CREATE INDEX idx_public_holidays_branch_id  ON public_holidays (branch_id);
