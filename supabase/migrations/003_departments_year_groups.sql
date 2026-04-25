-- ============================================================
-- 003 — Departments and year groups
-- ============================================================

-- Departments are branch-scoped. Tenants configure their own names —
-- no platform defaults exist.
CREATE TABLE departments (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid        NOT NULL REFERENCES tenants  (id),
  branch_id                uuid        NOT NULL REFERENCES branches (id),
  name                     text        NOT NULL,
  -- Number of makeup sessions a new enrolment in this department receives.
  -- Required — must be set during department creation; drives eager
  -- makeup_allowances population at enrolment time.
  default_makeup_allowance integer     NOT NULL,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- Year groups are branch-scoped. Fully tenant-configured (e.g. "Grade 5",
-- "KG2", "Year 9") — no platform-level year group names exist.
CREATE TABLE year_groups (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES tenants  (id),
  branch_id  uuid        NOT NULL REFERENCES branches (id),
  name       text        NOT NULL,
  -- Controls display order in timetable and enrolment UIs
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE year_groups ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_departments_tenant_id ON departments (tenant_id);
CREATE INDEX idx_departments_branch_id ON departments (branch_id);
CREATE INDEX idx_year_groups_tenant_id ON year_groups (tenant_id);
CREATE INDEX idx_year_groups_branch_id ON year_groups (branch_id);
