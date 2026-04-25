-- ============================================================
-- 010 — Enrolments, trials, withdrawals and makeup allowances
-- ============================================================

-- One row per student × subject combination.
-- Enrolment lifecycle (app-layer enforcement only, no DB state machine):
--   lead → trial_booked → trial_completed → won
--   → payment_received → enrolled → withdrawn
CREATE TABLE enrolments (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid          NOT NULL REFERENCES tenants  (id),
  student_id         uuid          NOT NULL REFERENCES students (id),
  subject_id         uuid          NOT NULL REFERENCES subjects (id),
  branch_id          uuid          NOT NULL REFERENCES branches (id),
  -- Set when this enrolment was made as part of a package deal
  package_id         uuid          REFERENCES packages (id),
  status             text          NOT NULL DEFAULT 'lead',
  -- Stored counter decremented atomically by the attendance confirmation
  -- route handler. Not recomputed from attendance_records.
  sessions_remaining integer       NOT NULL DEFAULT 0,
  -- Snapshot of subjects.price at creation time — billing reference
  price_at_enrolment numeric(10,2) NOT NULL,
  start_date         date,
  end_date           date,
  notes              text,
  created_at         timestamptz   NOT NULL DEFAULT now(),
  updated_at         timestamptz   NOT NULL DEFAULT now()
);

-- One trial record per enrolment.
-- trials.session_id FK to sessions is added in migration 011 once the
-- sessions table exists.
CREATE TABLE trials (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES tenants    (id),
  enrolment_id  uuid        NOT NULL REFERENCES enrolments (id),
  -- FK to sessions(id) deferred — added via ALTER TABLE in 011
  session_id    uuid,
  outcome       text        NOT NULL DEFAULT 'pending',
  outcome_notes text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT trials_enrolment_id_key  UNIQUE (enrolment_id),
  CONSTRAINT trials_outcome_check     CHECK  (outcome IN ('pending', 'won', 'lost', 'no_show'))
);

CREATE TABLE withdrawals (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid          NOT NULL REFERENCES tenants    (id),
  enrolment_id   uuid          NOT NULL REFERENCES enrolments (id),
  reason         text          NOT NULL,
  effective_date date          NOT NULL,
  -- Informational only. Does not automatically create a credit or payment row.
  refund_amount  numeric(10,2),
  notes          text,
  -- Staff member who processed the withdrawal; nullable for imports / system actions
  requested_by   uuid          REFERENCES staff (id),
  created_at     timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT withdrawals_enrolment_id_key UNIQUE (enrolment_id)
);

ALTER TABLE withdrawals
  ADD COLUMN refund_status text NOT NULL DEFAULT 'none'
    CHECK (refund_status IN ('none', 'pending', 'issued'));

-- Created eagerly when an enrolment row is first inserted.
-- total_allowance is copied from departments.default_makeup_allowance
-- at the time the enrolment is created.
CREATE TABLE makeup_allowances (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES tenants    (id),
  enrolment_id    uuid        NOT NULL REFERENCES enrolments (id),
  total_allowance integer     NOT NULL,
  -- Incremented atomically by the makeup-booking route handler
  used_allowance  integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT makeup_allowances_enrolment_id_key UNIQUE (enrolment_id)
);

ALTER TABLE enrolments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials            ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE makeup_allowances ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_enrolments_tenant_id        ON enrolments (tenant_id);
CREATE INDEX idx_enrolments_student_id       ON enrolments (student_id);
CREATE INDEX idx_enrolments_subject_id       ON enrolments (subject_id);
CREATE INDEX idx_enrolments_branch_id        ON enrolments (branch_id);
CREATE INDEX idx_enrolments_package_id       ON enrolments (package_id);
CREATE INDEX idx_enrolments_status           ON enrolments (status);
CREATE INDEX idx_trials_tenant_id            ON trials (tenant_id);
CREATE INDEX idx_trials_enrolment_id         ON trials (enrolment_id);
CREATE INDEX idx_withdrawals_tenant_id       ON withdrawals (tenant_id);
CREATE INDEX idx_withdrawals_enrolment_id    ON withdrawals (enrolment_id);
CREATE INDEX idx_makeup_allowances_tenant_id ON makeup_allowances (tenant_id);
CREATE INDEX idx_makeup_allowances_enrolment ON makeup_allowances (enrolment_id);
