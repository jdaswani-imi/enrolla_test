-- ============================================================
-- 008 — Packages and package–subject composition
-- ============================================================

-- A package is a predefined bundle of subjects sold at a fixed price.
-- When a student enrols via a package, a single invoice_line of
-- line_type = 'package' is created at packages.price — no per-subject lines.
CREATE TABLE packages (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid          NOT NULL REFERENCES tenants  (id),
  branch_id   uuid          NOT NULL REFERENCES branches (id),
  name        text          NOT NULL,
  description text,
  price       numeric(10,2) NOT NULL,
  is_active   boolean       NOT NULL DEFAULT true,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

-- Junction: which subjects are bundled inside a package.
-- Deleting a package cascades to remove its composition rows.
CREATE TABLE package_subjects (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES tenants   (id),
  package_id uuid        NOT NULL REFERENCES packages  (id) ON DELETE CASCADE,
  subject_id uuid        NOT NULL REFERENCES subjects  (id),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT package_subjects_pair_key UNIQUE (package_id, subject_id)
);

ALTER TABLE packages
  ADD COLUMN session_type text NOT NULL DEFAULT 'limited'
    CHECK (session_type IN ('limited', 'unlimited')),
  ADD COLUMN sessions_per_subject integer,
  ADD COLUMN validity_type text
    CHECK (validity_type IN ('by_date', 'by_date_range') OR validity_type IS NULL),
  ADD COLUMN validity_end_date date,
  ADD COLUMN validity_duration_days integer;

-- sessions_per_subject must be set when session_type = 'limited'
ALTER TABLE packages
  ADD CONSTRAINT packages_limited_sessions_check
    CHECK (session_type = 'unlimited' OR sessions_per_subject IS NOT NULL);

ALTER TABLE packages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_subjects ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_packages_tenant_id          ON packages (tenant_id);
CREATE INDEX idx_packages_branch_id          ON packages (branch_id);
CREATE INDEX idx_package_subjects_tenant_id  ON package_subjects (tenant_id);
CREATE INDEX idx_package_subjects_package_id ON package_subjects (package_id);
CREATE INDEX idx_package_subjects_subject_id ON package_subjects (subject_id);
