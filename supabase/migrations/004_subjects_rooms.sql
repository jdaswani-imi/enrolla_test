-- ============================================================
-- 004 — Subjects and rooms
-- ============================================================

-- INVARIANT: subjects.branch_id must always match subjects.department_id → departments.branch_id
-- Changing a subject's department to one in a different branch is blocked at application layer.
-- Do not add a DB trigger — enforce in PATCH /api/courses/[id] handler.

-- A subject sits at the intersection of a department and a year group.
-- branch_id is denormalised from department to allow direct branch-level
-- queries without joining through departments.
CREATE TABLE subjects (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid          NOT NULL REFERENCES tenants     (id),
  -- Denormalised from department for efficient branch-scoped queries
  branch_id                uuid          NOT NULL REFERENCES branches    (id),
  department_id            uuid          NOT NULL REFERENCES departments (id),
  year_group_id            uuid          NOT NULL REFERENCES year_groups (id),
  name                     text          NOT NULL,
  -- Flat rate per subject. Snapshotted on enrolments.price_at_enrolment
  -- and on invoice_lines.unit_price at invoice issue time.
  price                    numeric(10,2) NOT NULL,
  -- Duration of a single session in minutes.
  -- App layer derives sessions.end_time from this value; no DB enforcement.
  session_duration_minutes integer       NOT NULL,
  is_active                boolean       NOT NULL DEFAULT true,
  created_at               timestamptz   NOT NULL DEFAULT now(),
  updated_at               timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE rooms (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES tenants  (id),
  branch_id  uuid        NOT NULL REFERENCES branches (id),
  name       text        NOT NULL,
  capacity   integer,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms    ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_subjects_tenant_id     ON subjects (tenant_id);
CREATE INDEX idx_subjects_branch_id     ON subjects (branch_id);
CREATE INDEX idx_subjects_department_id ON subjects (department_id);
CREATE INDEX idx_subjects_year_group_id ON subjects (year_group_id);
CREATE INDEX idx_rooms_tenant_id        ON rooms (tenant_id);
CREATE INDEX idx_rooms_branch_id        ON rooms (branch_id);
