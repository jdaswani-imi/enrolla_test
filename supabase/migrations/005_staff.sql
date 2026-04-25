-- ============================================================
-- 005 — Staff and branch assignments
-- ============================================================

CREATE TABLE staff (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES tenants (id),
  -- References Supabase Auth. Nullable until the invite is accepted and
  -- the auth account is confirmed. Staff record and auth account are
  -- created together atomically at the application layer.
  user_id    uuid        UNIQUE REFERENCES auth.users (id),
  first_name text        NOT NULL,
  last_name  text        NOT NULL,
  -- Source of truth for the staff member's email address.
  -- Only Super Admin may change this via the app. On change, the app must
  -- call the Supabase Auth admin API to sync auth.users.email.
  -- Auth email follows the staff record — not the other way around.
  email      text        NOT NULL,
  phone      text,
  -- Application RBAC role. Embedded in the JWT via Supabase Auth hook at login.
  -- Role-gated UI and API enforcement happens at the application layer.
  role       text        NOT NULL,
  status     text        NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT staff_role_check CHECK (role IN (
    'super_admin', 'admin_head', 'admin',
    'academic_head', 'hod', 'teacher', 'ta', 'hr_finance'
  )),
  CONSTRAINT staff_status_check CHECK (status IN ('active', 'on_leave', 'off_boarded'))
);

-- Junction: which branches a staff member works at.
-- Tracks branch assignment only — no department on the junction.
CREATE TABLE staff_branches (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES tenants  (id),
  staff_id   uuid        NOT NULL REFERENCES staff    (id) ON DELETE CASCADE,
  branch_id  uuid        NOT NULL REFERENCES branches (id),
  is_primary boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT staff_branches_pair_key UNIQUE (staff_id, branch_id)
);

ALTER TABLE staff          ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_branches ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_staff_tenant_id          ON staff (tenant_id);
CREATE INDEX idx_staff_user_id            ON staff (user_id);
CREATE INDEX idx_staff_branches_tenant_id ON staff_branches (tenant_id);
CREATE INDEX idx_staff_branches_staff_id  ON staff_branches (staff_id);
CREATE INDEX idx_staff_branches_branch_id ON staff_branches (branch_id);
